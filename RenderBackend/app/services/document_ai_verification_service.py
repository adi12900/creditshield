from __future__ import annotations

import json
import logging
import os
import re
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

try:
    import boto3  # type: ignore[import-not-found]
except ImportError:  # pragma: no cover - optional in thin environments
    boto3 = None  # type: ignore[assignment]

try:
    from botocore.exceptions import ClientError  # type: ignore[import-not-found]
except ImportError:  # pragma: no cover - optional in thin environments
    ClientError = Exception  # type: ignore[assignment]

from app.core.database import SessionLocal
from app.models.document import Document
from app.models.loan_application import LoanApplication
from app.services.s3 import download_bytes_from_s3

logger = logging.getLogger("uvicorn.error")

BLOCKING_DOCUMENT_TYPES = {
    "student_id_card",
    "pan_card",
    "guardian_bank_statement",
    "co_applicant_income_proof",
    "aadhaar_card",
}

NON_BLOCKING_DOCUMENT_TYPES = {"bank_statement_12m"}

MAX_VERIFICATION_ATTEMPTS = 3
LEGACY_FAILURE_PREFIX = "verification failed:"


def normalize_status(status: str | None) -> str:
    raw = (status or "").strip().lower().replace("-", " ").replace("_", " ")
    if raw in {"pending", "pending ocr", "pendingocr"}:
        return "Pending OCR"
    if raw in {"processing", "in progress", "inprogress"}:
        return "Pending OCR"
    if raw in {"verified", "success", "approved"}:
        return "Verified"
    if raw in {"failed", "error", "flagged", "rejected", "verification failed"}:
        return "Flagged"
    return (status or "").strip() or "Pending OCR"


def normalize_doc_type(doc_type: str) -> str:
    return (doc_type or "").strip().lower().replace("-", "_")


def is_blocking_document(doc_type: str) -> bool:
    return normalize_doc_type(doc_type) in BLOCKING_DOCUMENT_TYPES


def _bedrock_client():
    if boto3 is None:
        raise RuntimeError("boto3 is required for Bedrock verification")
    return boto3.client(
        "bedrock-runtime",
        region_name=os.getenv("AWS_REGION", "us-west-2"),
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID") or os.getenv("AWS_ACCESS_KEY"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY") or os.getenv("AWS_SECRET_KEY"),
    )


def _doc_format_from_filename(filename: str) -> str:
    name = (filename or "").lower()
    if name.endswith(".pdf"):
        return "pdf"
    if name.endswith(".png"):
        return "png"
    if name.endswith(".jpg") or name.endswith(".jpeg"):
        return "jpeg"
    if name.endswith(".webp"):
        return "webp"
    if name.endswith(".csv"):
        return "csv"
    if name.endswith(".xls"):
        return "xls"
    if name.endswith(".xlsx"):
        return "xlsx"
    return "unknown"


def _detect_doc_format(file_bytes: bytes, filename: str) -> str:
    if file_bytes.startswith(b"%PDF"):
        return "pdf"
    if file_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if file_bytes.startswith(b"\xff\xd8\xff"):
        return "jpeg"
    if file_bytes.startswith(b"RIFF") and file_bytes[8:12] == b"WEBP":
        return "webp"

    # OLE Compound format used by legacy .xls files.
    if file_bytes.startswith(b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1"):
        return "xls"
    # Zip container used by .xlsx files.
    if file_bytes.startswith(b"PK\x03\x04"):
        return "xlsx"

    # Some uploads are mislabeled as .pdf even though content is plain text.
    # Prefer content sniffing over extension fallback to avoid Bedrock validation errors.
    sample = file_bytes[:2048]
    if sample:
        try:
            decoded = sample.decode("utf-8")
            printable = sum(1 for ch in decoded if ch.isprintable() or ch in "\r\n\t")
            ratio = printable / max(1, len(decoded))
            if ratio >= 0.95:
                return "txt"
        except UnicodeDecodeError:
            pass

    by_name = _doc_format_from_filename(filename)
    if by_name != "unknown":
        return by_name
    return "unknown"


def _extract_json_payload(model_text: str) -> dict[str, Any]:
    text = (model_text or "").strip()
    if not text:
        raise ValueError("Bedrock returned empty response")

    start = text.find("{")
    end = text.rfind("}")
    if start < 0 or end < 0 or end <= start:
        raise ValueError("Bedrock response did not include JSON object")

    payload = text[start : end + 1]
    data = json.loads(payload)
    if not isinstance(data, dict):
        raise ValueError("Bedrock JSON response was not an object")
    return data


def _fallback_from_text(model_text: str) -> dict[str, Any]:
    text = (model_text or "").strip()
    lowered = text.lower()

    verdict = "Suspicious"
    if "rejected" in lowered:
        verdict = "Rejected"
    elif "verified" in lowered:
        verdict = "Verified"

    is_valid = verdict == "Verified"

    confidence = 0.0
    pct_match = re.search(r"(\d{1,3}(?:\.\d+)?)\s*%", text)
    if pct_match:
        try:
            confidence = float(pct_match.group(1)) / 100.0
        except ValueError:
            confidence = 0.0
    else:
        frac_match = re.search(r"\b(0(?:\.\d+)?|1(?:\.0+)?)\b", text)
        if frac_match:
            try:
                confidence = float(frac_match.group(1))
            except ValueError:
                confidence = 0.0

    confidence = max(0.0, min(1.0, confidence))

    return {
        "extracted_text": text[:4000],
        "is_valid": is_valid,
        "confidence": confidence,
        "verdict": verdict,
        "key_fields": {"name": "", "dob": "", "document_number": ""},
    }


def _fallback_unreadable_document(reason: str = "") -> dict[str, Any]:
    return {
        "extracted_text": "",
        "is_valid": False,
        "confidence": 0.0,
        "verdict": "Suspicious",
        "key_fields": {"name": "", "dob": "", "document_number": ""},
    }


def _is_filetype_mismatch_error(err_text: str) -> bool:
    lowered = (err_text or "").lower()
    return (
        "validationexception" in lowered
        and "detected filetype" in lowered
        and "provided filetype" in lowered
    )


def _is_legacy_failure_verdict(verdict: str | None) -> bool:
    return (verdict or "").strip().lower().startswith(LEGACY_FAILURE_PREFIX)


def run_bedrock_verification(file_bytes: bytes, filename: str, doc_type: str) -> dict[str, Any]:
    model_id = os.getenv("BEDROCK_DOC_MODEL_ID") or os.getenv("BEDROCK_MODEL_ID") or "anthropic.claude-3-5-sonnet-20241022-v2:0"
    prompt = (
        "You are a document verification engine. Perform OCR-like text extraction and authenticity checks. "
        "Return STRICT JSON only with keys: extracted_text, is_valid, confidence, verdict, key_fields. "
        "confidence must be a float between 0 and 1. verdict must be one of Verified, Suspicious, Rejected. "
        f"Document type: {doc_type}."
    )

    def _parse_response(response: dict[str, Any]) -> dict[str, Any]:
        output = response.get("output", {}).get("message", {}).get("content", [])
        text_chunks: list[str] = []
        for chunk in output:
            if isinstance(chunk, dict) and "text" in chunk:
                text_chunks.append(str(chunk["text"]))

        raw_text = "\n".join(text_chunks)
        try:
            parsed = _extract_json_payload(raw_text)
        except Exception:
            parsed = _fallback_from_text(raw_text)

        extracted_text = str(parsed.get("extracted_text") or "").strip()
        is_valid = bool(parsed.get("is_valid", False))

        confidence_raw = parsed.get("confidence", 0)
        try:
            confidence = float(confidence_raw)
        except (TypeError, ValueError):
            confidence = 0.0
        confidence = max(0.0, min(1.0, confidence))

        verdict = str(parsed.get("verdict") or "Suspicious").strip()
        if verdict not in {"Verified", "Suspicious", "Rejected"}:
            verdict = "Suspicious"

        key_fields = parsed.get("key_fields")
        if not isinstance(key_fields, dict):
            key_fields = {"name": "", "dob": "", "document_number": ""}

        return {
            "extracted_text": extracted_text,
            "is_valid": is_valid,
            "confidence": confidence,
            "verdict": verdict,
            "key_fields": key_fields,
        }

    def _verify_from_text(client_obj) -> dict[str, Any]:
        text_excerpt = file_bytes.decode("utf-8", errors="ignore")[:10000]
        response = client_obj.converse(
            modelId=model_id,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "text": (
                                f"{prompt} Treat the following as raw extracted text from a document and verify consistency.\n\n"
                                f"TEXT_CONTENT_START\n{text_excerpt}\nTEXT_CONTENT_END"
                            )
                        }
                    ],
                }
            ],
            inferenceConfig={"temperature": 0.1, "maxTokens": 1800},
        )
        return _parse_response(response)

    try:
        client = _bedrock_client()
        doc_format = _detect_doc_format(file_bytes, filename)

        if doc_format in {"xls", "xlsx", "csv", "unknown"}:
            # Unsupported binary/tabular content for this vision path.
            return _fallback_unreadable_document(doc_format)

        if doc_format == "txt":
            return _verify_from_text(client)

        user_content: list[dict[str, Any]] = [{"text": prompt}]
        if doc_format in {"png", "jpeg", "webp"}:
            user_content.append(
                {
                    "image": {
                        "format": doc_format,
                        "source": {"bytes": file_bytes},
                    }
                }
            )
        else:
            user_content.append(
                {
                    "document": {
                        "format": "pdf",
                        "name": "uploaded_document",
                        "source": {"bytes": file_bytes},
                    }
                }
            )

        try:
            response = client.converse(
                modelId=model_id,
                messages=[{"role": "user", "content": user_content}],
                inferenceConfig={"temperature": 0.1, "maxTokens": 1800},
            )
            return _parse_response(response)
        except ClientError as exc:
            err = str(exc)
            if _is_filetype_mismatch_error(err):
                # Retry as text-based verification when Bedrock rejects claimed format.
                return _verify_from_text(client)
            raise
    except Exception as exc:
        logger.warning("Bedrock verification fallback used for %s (%s)", filename, exc)
        return _fallback_unreadable_document(str(exc))


def _set_processing_state(db: Session, doc: Document) -> None:
    # Keep legacy-compatible status value while tracking attempts.
    doc.status = normalize_status(doc.status)
    doc.verification_attempts = int(doc.verification_attempts or 0) + 1
    doc.updated_at = datetime.now(timezone.utc)
    db.add(doc)
    db.commit()
    db.refresh(doc)


def process_document(doc_id: int, force: bool = False) -> None:
    db = SessionLocal()
    try:
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if not doc:
            logger.warning("Verification skipped; document not found doc_id=%s", doc_id)
            return

        doc_status = normalize_status(doc.status)
        doc.status = doc_status
        if doc.is_blocking is None:  # pragma: no cover - db null-safety
            doc.is_blocking = is_blocking_document(doc.doc_type)

        if (
            not force
            and doc_status == "Verified"
            and bool((doc.agent_verdict or "").strip())
            and bool((doc.extracted_text or "").strip())
        ):
            logger.info("Verification already complete for doc_id=%s", doc_id)
            return

        attempts = int(doc.verification_attempts or 0)
        if attempts >= MAX_VERIFICATION_ATTEMPTS and doc_status == "Flagged":
            logger.warning("Verification retry limit reached for doc_id=%s", doc_id)
            return

        _set_processing_state(db, doc)

        if not doc.storage_url:
            raise ValueError("Document storage URL is missing")

        file_bytes = download_bytes_from_s3(doc.storage_url)
        filename = doc.storage_url.rsplit("/", 1)[-1] or f"doc_{doc.id}.pdf"
        result = run_bedrock_verification(file_bytes, filename, doc.doc_type)

        verdict = result["verdict"]
        is_valid = bool(result["is_valid"])
        status = "Verified" if (is_valid and verdict == "Verified") else "Flagged"

        doc.status = status
        doc.extracted_text = result["extracted_text"]
        doc.agent_verdict = verdict
        doc.confidence = round(float(result["confidence"]) * 100.0, 2)
        doc.last_verified_at = datetime.now(timezone.utc)
        doc.updated_at = datetime.now(timezone.utc)
        db.add(doc)
        db.commit()

        logger.info(
            "Document verification complete doc_id=%s status=%s attempts=%s confidence=%.3f",
            doc.id,
            doc.status,
            doc.verification_attempts,
            doc.confidence or 0.0,
        )
    except Exception as exc:
        logger.exception("Document verification failed doc_id=%s", doc_id)
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if doc:
            doc.status = "Flagged"
            doc.agent_verdict = f"Verification failed: {exc}"
            doc.last_verified_at = datetime.now(timezone.utc)
            doc.updated_at = datetime.now(timezone.utc)
            db.add(doc)
            db.commit()
    finally:
        db.close()


def run_document_verification_task(doc_id: int, force: bool = False) -> None:
    process_document(doc_id=doc_id, force=force)


def can_move_to_next_step(application_id: int, db: Session) -> bool:
    docs = db.query(Document).filter(Document.application_id == application_id).all()
    blocking_docs = [
        d for d in docs if bool(d.is_blocking) or is_blocking_document(d.doc_type)
    ]
    if not blocking_docs:
        return False

    for doc in blocking_docs:
        if normalize_status(doc.status) != "Verified":
            return False

    return True


def schedule_reverification_for_arn(arn: str, db: Session, schedule_fn) -> None:
    app = db.query(LoanApplication).filter(LoanApplication.arn == arn).first()
    if not app:
        return

    docs = db.query(Document).filter(Document.application_id == app.id).all()
    for doc in docs:
        status = normalize_status(doc.status)
        attempts = int(doc.verification_attempts or 0)
        legacy_failed_verdict = _is_legacy_failure_verdict(doc.agent_verdict)
        missing_verdict = not bool((doc.agent_verdict or "").strip()) or legacy_failed_verdict
        missing_extracted_text = not bool((doc.extracted_text or "").strip())

        if not bool(doc.is_blocking) and is_blocking_document(doc.doc_type):
            doc.is_blocking = True
            db.add(doc)

        if attempts >= MAX_VERIFICATION_ATTEMPTS:
            continue
        if status in {"Pending OCR", "Flagged"} or missing_verdict or missing_extracted_text:
            if legacy_failed_verdict:
                doc.agent_verdict = None
                doc.extracted_text = None
                doc.confidence = None
                doc.status = "Pending OCR"
                db.add(doc)
            schedule_fn(int(doc.id), False)

    db.commit()


def schedule_reverification_for_all_documents(
    db: Session,
    schedule_fn,
    limit: int = 500,
    force: bool = False,
    repair_legacy_failures: bool = False,
) -> tuple[int, int]:
    docs = (
        db.query(Document)
        .order_by(Document.updated_at.asc(), Document.id.asc())
        .limit(max(1, limit))
        .all()
    )
    scheduled = 0
    repaired = 0
    for doc in docs:
        status = normalize_status(doc.status)
        attempts = int(doc.verification_attempts or 0)
        legacy_failed_verdict = _is_legacy_failure_verdict(doc.agent_verdict)
        missing_verdict = not bool((doc.agent_verdict or "").strip()) or legacy_failed_verdict
        missing_extracted_text = not bool((doc.extracted_text or "").strip())

        doc.status = status
        if not bool(doc.is_blocking) and is_blocking_document(doc.doc_type):
            doc.is_blocking = True

        if repair_legacy_failures and legacy_failed_verdict:
            doc.status = "Pending OCR"
            doc.agent_verdict = None
            doc.extracted_text = None
            doc.confidence = None
            if force:
                doc.verification_attempts = 0
            repaired += 1

        if attempts >= MAX_VERIFICATION_ATTEMPTS and not force:
            continue
        if status in {"Pending OCR", "Flagged"} or missing_verdict or missing_extracted_text:
            schedule_fn(int(doc.id), force)
            scheduled += 1

    db.commit()
    return scheduled, repaired
