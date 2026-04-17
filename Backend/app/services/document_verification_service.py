"""
Document Verification Service

After a borrower uploads a document via the upload link, this service:
1. Downloads the file from S3
2. Extracts text content (PDF text extraction or basic OCR fallback)
3. Indexes the text into the ai_agent RAG under borrower_{arn} namespace
4. Runs the agent to verify the document against KYC/loan rules
5. Updates the document record with the agent verdict
"""

from __future__ import annotations

import logging
import sys
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import SessionLocal

logger = logging.getLogger(__name__)

# Ensure repo root is on path so ai_agent is importable from Backend context
_REPO_ROOT = Path(__file__).resolve().parents[3]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))


def _extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    """
    Extract text from uploaded document.
    Supports PDF (via pypdf) and images (returns filename-based metadata).
    """
    ext = Path(filename).suffix.lower()

    if ext == ".pdf":
        try:
            import io
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            pages = []
            for page in reader.pages:
                pages.append(page.extract_text() or "")
            text = "\n".join(pages).strip()
            if text:
                return text
        except Exception as e:
            logger.warning("PDF text extraction failed: %s", e)

    # For images or failed PDF extraction — return metadata stub
    # The agent will use doc_type + filename as context
    return f"Document file: {filename} (binary content, type={ext})"


def _download_from_s3(storage_url: str) -> bytes | None:
    """Download file bytes from S3 using the storage URL."""
    try:
        import boto3
        import os
        from urllib.parse import urlparse

        parsed = urlparse(storage_url)
        # URL format: https://{bucket}.s3.{region}.amazonaws.com/{key}
        # or: https://s3.{region}.amazonaws.com/{bucket}/{key}
        bucket = os.getenv("AWS_BUCKET_NAME", "credit-shield-document")
        key = parsed.path.lstrip("/")
        # If bucket name is in the path (path-style URL)
        if key.startswith(bucket + "/"):
            key = key[len(bucket) + 1:]

        s3 = boto3.client(
            "s3",
            region_name=os.getenv("AWS_REGIONS3", "ap-south-1"),
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY"),
            aws_secret_access_key=os.getenv("AWS_SECRET_KEY"),
        )
        response = s3.get_object(Bucket=bucket, Key=key)
        return response["Body"].read()
    except Exception as e:
        logger.error("S3 download failed for %s: %s", storage_url, e)
        return None


def verify_document_with_agent(
    document_id: int,
    arn: str,
    doc_type: str,
    filename: str,
    storage_url: str,
    db: Session,
) -> None:
    """
    Main entry point — called as a background task after document upload.

    Downloads the document, indexes it into RAG, runs the agent,
    and updates the document record with the verdict.
    """
    logger.info("Starting agent verification for doc_id=%s arn=%s type=%s", document_id, arn, doc_type)

    try:
        from ai_agent.db_data_adapter import DatabaseDataAdapter
        from ai_agent.pipeline.agent_orchestrator import AgentOrchestrator
        from ai_agent.rag.knowledge_base import KnowledgeBase

        # Step 1: Download file from S3
        file_bytes = _download_from_s3(storage_url)
        if file_bytes is None:
            _update_document_verdict(db, document_id, "Verification Failed",
                                     "Could not download document from storage")
            return

        # Step 2: Extract text
        doc_text = _extract_text_from_file(file_bytes, filename)
        logger.info("Extracted %d chars from %s", len(doc_text), filename)

        # Step 3: Build orchestrator with real DB adapter
        adapter = DatabaseDataAdapter(db)
        orchestrator = AgentOrchestrator(data_adapter=adapter)

        # Step 4: Index document text into RAG under borrower_{arn} namespace
        orchestrator._kb.build_index()  # ensure policy index is built
        orchestrator._kb.add_borrower_document(
            arn=arn,
            text=doc_text,
            doc_type=doc_type,
        )
        orchestrator._policy_index_built = True

        # Step 5: Run agent with document verification query
        query = (
            f"Verify the uploaded '{doc_type}' document for application {arn}. "
            f"Check: 1) Is the document type correct and complete? "
            f"2) Does it satisfy KYC requirements (PAN format, Aadhaar validity, address proof)? "
            f"3) Are there any rule violations (HR-02 document integrity, KYC rules)? "
            f"4) Is this document sufficient for loan processing? "
            f"Provide a clear PASS, REVIEW, or REJECT verdict with reasons."
        )

        result = orchestrator.analyse_application(arn=arn, query=query)

        # Step 6: Map agent decision to document status
        # Allowed DB values: 'Verified', 'Pending OCR', 'Flagged'
        decision = (result.decision or "REVIEW").upper()
        if decision in ("APPROVE", "PREMIUM", "PREMIUM APPROVE"):
            doc_status = "Verified"
            confidence = int(result.confidence * 100)
        elif decision == "REJECT":
            doc_status = "Flagged"
            confidence = int(result.confidence * 100)
        else:
            # REVIEW / CAUTION → keep as Flagged for manual review
            doc_status = "Flagged"
            confidence = int(result.confidence * 100)

        # Build findings summary (keep it concise for DB storage)
        findings = result.response_text[:1000] if result.response_text else "No findings"

        # Step 7: Update document record
        _update_document_verdict(db, document_id, doc_status, findings, confidence)

        logger.info(
            "Verification complete doc_id=%s verdict=%s confidence=%s",
            document_id, doc_status, confidence
        )

    except Exception as e:
        logger.exception("Document verification failed for doc_id=%s: %s", document_id, e)
        _update_document_verdict(db, document_id, "Verification Failed", str(e)[:500])


def run_document_verification_task(document_id: int) -> None:
    """
    Background-task safe wrapper.

    Opens a fresh DB session, loads document metadata, and triggers agent verification.
    """
    db = SessionLocal()
    try:
        row = db.execute(
            text(
                """
                SELECT d.id, d.doc_type, d.storage_url, la.arn
                FROM documents d
                JOIN loan_applications la ON la.id = d.application_id
                WHERE d.id = :doc_id
                """
            ),
            {"doc_id": int(document_id)},
        ).fetchone()

        if not row:
            logger.error("Verification task skipped; document not found doc_id=%s", document_id)
            return

        storage_url = row[2]
        if not storage_url:
            _update_document_verdict(
                db,
                int(row[0]),
                "Flagged",
                "Document storage URL is missing; cannot run AI verification.",
                0,
            )
            return

        verify_document_with_agent(
            document_id=int(row[0]),
            arn=str(row[3]),
            doc_type=str(row[1] or "document"),
            filename=str(storage_url).rsplit("/", 1)[-1],
            storage_url=str(storage_url),
            db=db,
        )
    except Exception:
        logger.exception("Verification task crashed for doc_id=%s", document_id)
    finally:
        db.close()


def _update_document_verdict(
    db: Session,
    document_id: int,
    status: str,
    findings: str,
    confidence: int | None = None,
) -> None:
    """Update document record with agent verdict."""
    # Map to allowed DB status values: 'Verified', 'Pending OCR', 'Flagged'
    allowed = {"Verified", "Pending OCR", "Flagged"}
    safe_status = status if status in allowed else "Flagged"
    try:
        db.execute(
            text("""
                UPDATE documents
                SET status = :status,
                    confidence = :confidence,
                    agent_verdict = :findings
                WHERE id = :doc_id
            """),
            {
                "doc_id": document_id,
                "status": safe_status,
                "confidence": confidence,
                "findings": findings,
            },
        )
        db.commit()
        logger.info("Updated doc_id=%s status=%s", document_id, status)
    except Exception as e:
        db.rollback()
        logger.error("Failed to update document verdict for doc_id=%s: %s", document_id, e)
