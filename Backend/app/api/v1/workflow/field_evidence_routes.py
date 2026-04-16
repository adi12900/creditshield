from __future__ import annotations

import re
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import AuthenticatedUser, require_auth_roles
from app.models.field_verification_evidence import FieldVerificationEvidence
from app.models.loan_application import LoanApplication
from app.schemas.workflow import FieldEvidenceGroupedResponse, FieldEvidenceItem, FieldEvidenceUploadResponse
from app.services.s3 import extract_object_key_from_url, generate_presigned_url, upload_field_verification_file
from app.services.workflow_service import WorkflowServiceError, workflow_service

router = APIRouter(prefix="/workflow", tags=["workflow-field-evidence"])

_ALLOWED_SECTIONS = {"residence", "business", "education", "loan_specific"}


def _parse_captured_at(value: str | None) -> datetime:
    if not value:
        return datetime.now(tz=timezone.utc)
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="captured_at must be ISO timestamp",
        ) from exc
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def _to_item(row: FieldVerificationEvidence, expires_in: int = 3600) -> FieldEvidenceItem:
    try:
        access_url = generate_presigned_url(extract_object_key_from_url(row.storage_url), expires_in=expires_in)
    except Exception:
        access_url = row.storage_url

    return FieldEvidenceItem(
        id=row.id,
        arn=row.arn,
        loan_type=row.loan_type,
        verification_section=row.verification_section,  # type: ignore[arg-type]
        evidence_type=row.evidence_type,
        storage_url=row.storage_url,
        access_url=access_url,
        uploaded_by_role=row.uploaded_by_role,
        latitude=row.latitude,
        longitude=row.longitude,
        captured_at=row.captured_at,
        created_at=row.created_at,
    )


@router.post(
    "/field-officer/cases/{arn}/evidence/upload",
    response_model=FieldEvidenceUploadResponse,
)
def upload_field_evidence(
    arn: str,
    loan_type: str = Form(...),
    verification_section: str = Form(...),
    evidence_type: str = Form(...),
    latitude: float | None = Form(default=None),
    longitude: float | None = Form(default=None),
    captured_at: str | None = Form(default=None),
    file: UploadFile = File(...),
    current_user: AuthenticatedUser = Depends(require_auth_roles({"field_officer"})),
    db: Session = Depends(get_db),
) -> FieldEvidenceUploadResponse:
    try:
        workflow_service.get_field_officer_case_detail(current_user.username, arn)
    except WorkflowServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc

    normalized_section = verification_section.strip().lower()
    if normalized_section not in _ALLOWED_SECTIONS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"verification_section must be one of: {', '.join(sorted(_ALLOWED_SECTIONS))}",
        )

    try:
        application = db.query(LoanApplication).filter(LoanApplication.arn == arn).first()
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while loading application",
        ) from exc
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Application not found for ARN {arn}")
    if application.borrower_id is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Application has no borrower_id")

    safe_name = re.sub(r"[^A-Za-z0-9._-]", "_", (file.filename or "evidence.bin").strip())

    try:
        storage_url = upload_field_verification_file(
            file=file.file,
            borrower_id=application.borrower_id,
            arn=arn,
            loan_type=loan_type,
            evidence_type=evidence_type,
            filename=safe_name,
            content_type=file.content_type or "application/octet-stream",
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"S3 upload failed: {exc}") from exc

    row = FieldVerificationEvidence(
        borrower_id=application.borrower_id,
        application_id=application.id,
        arn=arn,
        loan_type=loan_type.strip(),
        verification_section=normalized_section,
        evidence_type=evidence_type.strip().lower(),
        storage_url=storage_url,
        uploaded_by_role="field_officer",
        latitude=latitude,
        longitude=longitude,
        captured_at=_parse_captured_at(captured_at),
    )
    try:
        db.add(row)
        db.commit()
        db.refresh(row)
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while saving field evidence",
        ) from exc

    return FieldEvidenceUploadResponse(evidence=_to_item(row))


@router.get(
    "/field-officer/cases/{arn}/evidence",
    response_model=FieldEvidenceGroupedResponse,
)
def list_field_evidence(
    arn: str,
    signed_url_expires_in: int = 3600,
    current_user: AuthenticatedUser = Depends(require_auth_roles({"field_officer"})),
    db: Session = Depends(get_db),
) -> FieldEvidenceGroupedResponse:
    try:
        case_detail = workflow_service.get_field_officer_case_detail(current_user.username, arn)
    except WorkflowServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc

    try:
        rows = (
            db.query(FieldVerificationEvidence)
            .filter(FieldVerificationEvidence.arn == arn)
            .order_by(FieldVerificationEvidence.created_at.desc(), FieldVerificationEvidence.id.desc())
            .all()
        )
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while fetching field evidence",
        ) from exc

    grouped: dict[str, dict[str, list[FieldEvidenceItem]]] = {}
    for row in rows:
        section = row.verification_section
        grouped.setdefault(section, {})
        grouped[section].setdefault(row.evidence_type, [])
        grouped[section][row.evidence_type].append(_to_item(row, expires_in=signed_url_expires_in))

    return FieldEvidenceGroupedResponse(
        arn=arn,
        loan_type=str(case_detail.get("loan_type") or ""),
        grouped_evidence=grouped,
    )
