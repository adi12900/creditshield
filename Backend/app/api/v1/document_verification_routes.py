from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_auth_roles
from app.models.document import Document
from app.models.loan_application import LoanApplication
from app.schemas.document_verification import DocumentUploadOut, DocumentVerificationListResponse
from app.services.document_ai_verification_service import (
    can_move_to_next_step,
    is_blocking_document,
    run_document_verification_task,
    schedule_reverification_for_all_documents,
    schedule_reverification_for_arn,
)
from app.services.s3 import upload_document_file

router = APIRouter(prefix="/api/v1", tags=["document-verification"])


@router.post(
    "/documents/upload",
    response_model=DocumentUploadOut,
    dependencies=[Depends(require_auth_roles({"borrower", "loan_officer", "system_admin"}))],
)
async def upload_document(
    background_tasks: BackgroundTasks,
    application_id: int = Form(...),
    doc_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> DocumentUploadOut:
    application = db.query(LoanApplication).filter(LoanApplication.id == application_id).first()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    content_type = file.content_type or "application/octet-stream"
    storage_url = upload_document_file(
        file=file.file,
        arn=application.arn,
        doc_type=doc_type,
        filename=file.filename or "document.bin",
        content_type=content_type,
    )

    blocking = is_blocking_document(doc_type)
    doc = Document(
        application_id=application.id,
        doc_type=doc_type,
        status="Pending OCR",
        confidence=None,
        extracted_text=None,
        agent_verdict=None,
        is_blocking=blocking,
        verification_attempts=0,
        last_verified_at=None,
        storage_url=storage_url,
        uploaded_by_user_id=None,
        uploaded_at=datetime.now(timezone.utc),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    if blocking:
        run_document_verification_task(int(doc.id), force=True)
        db.refresh(doc)
    else:
        background_tasks.add_task(run_document_verification_task, int(doc.id), False)

    return DocumentUploadOut(
        id=int(doc.id),
        application_id=int(doc.application_id),
        doc_type=doc.doc_type,
        file_url=doc.storage_url,
        status=doc.status,
        confidence=doc.confidence,
        agent_verdict=doc.agent_verdict,
        is_blocking=bool(doc.is_blocking),
        verification_attempts=int(doc.verification_attempts or 0),
    )


@router.get(
    "/loan-officer/documents/{arn}",
    response_model=DocumentVerificationListResponse,
    dependencies=[Depends(require_auth_roles({"loan_officer", "system_admin"}))],
)
def get_documents_for_loan_officer(
    arn: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> DocumentVerificationListResponse:
    application = db.query(LoanApplication).filter(LoanApplication.arn == arn).first()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    schedule_reverification_for_arn(
        arn=arn,
        db=db,
        schedule_fn=lambda doc_id, force: background_tasks.add_task(run_document_verification_task, doc_id, force),
    )

    docs = (
        db.query(Document)
        .filter(Document.application_id == application.id)
        .order_by(Document.uploaded_at.desc(), Document.id.desc())
        .all()
    )

    can_proceed = can_move_to_next_step(application.id, db)

    return DocumentVerificationListResponse(
        documents=[
            DocumentUploadOut(
                id=int(doc.id),
                application_id=int(doc.application_id),
                doc_type=doc.doc_type,
                file_url=doc.storage_url,
                status=doc.status,
                confidence=doc.confidence,
                agent_verdict=doc.agent_verdict,
                is_blocking=bool(doc.is_blocking),
                verification_attempts=int(doc.verification_attempts or 0),
            )
            for doc in docs
        ],
        can_proceed=can_proceed,
    )


@router.post(
    "/documents/backfill-verification",
    dependencies=[Depends(require_auth_roles({"system_admin"}))],
)
def backfill_verification(
    background_tasks: BackgroundTasks,
    limit: int = 500,
    force: bool = True,
    repair_legacy_failures: bool = True,
    db: Session = Depends(get_db),
) -> dict:
    scheduled, repaired = schedule_reverification_for_all_documents(
        db=db,
        schedule_fn=lambda doc_id, do_force: background_tasks.add_task(run_document_verification_task, doc_id, do_force),
        limit=limit,
        force=force,
        repair_legacy_failures=repair_legacy_failures,
    )
    return {
        "status": "scheduled",
        "scheduled_count": scheduled,
        "repaired_count": repaired,
        "limit": limit,
        "force": force,
        "repair_legacy_failures": repair_legacy_failures,
    }
