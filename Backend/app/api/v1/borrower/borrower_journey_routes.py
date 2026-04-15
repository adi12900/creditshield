from datetime import datetime, timezone
from decimal import Decimal
from io import BytesIO
import logging
from random import randint
import re
from typing import Any
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import AuthenticatedUser, get_current_user, require_auth_roles
from app.models.borrower import Borrower
from app.models.borrower_kyc_profile import BorrowerKycProfile
from app.models.document import Document
from app.models.education_loan_details import EducationLoanDetails
from app.models.gold_loan_details import GoldLoanDetails
from app.models.home_loan_details import HomeLoanDetails
from app.models.loan_application import LoanApplication
from app.models.loan_appraisal_record import LoanAppraisalRecord
from app.services.loan_appraisal_service import LoanAppraisalServiceError, loan_appraisal_service
from app.services.s3 import (
    download_bytes_from_s3,
    extract_object_key_from_url,
    generate_presigned_url,
    upload_file_to_s3,
)

router = APIRouter(
    prefix="/borrower",
    tags=["borrower-journey"],
    dependencies=[Depends(require_auth_roles({"borrower"}))],
)

ALLOWED_LOAN_TYPES = {"personal", "gold", "home", "car", "education"}
ALLOWED_EMPLOYMENT_TYPES = {
    "Salaried",
    "Self Employed",
    "Business Owner",
    "Freelancer",
    "Student",
    "Unemployed",
}

APPRAISAL_RULES_PATH = "dataset/behavioral_rules_realistic.yaml"
APPRAISAL_MODEL_PATH = "loan_appraisal_model/loan_appraisal_trained_model.pkl"
UNIVERSAL_REQUIRED_DOCS = {"aadhaar_card", "pan_card", "bank_statement_12m"}

logger = logging.getLogger("uvicorn.error")

def _get_borrower_or_404(db: Session, current_user: AuthenticatedUser) -> Borrower:
    borrower = db.query(Borrower).filter(Borrower.email == current_user.username).first()
    if not borrower or not borrower.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Borrower profile not found")
    return borrower


def _latest_application(db: Session, borrower_id: int) -> LoanApplication | None:
    return (
        db.query(LoanApplication)
        .filter(LoanApplication.borrower_id == borrower_id)
        .order_by(LoanApplication.created_at.desc(), LoanApplication.id.desc())
        .first()
    )


def _latest_active_application(db: Session, borrower_id: int) -> LoanApplication | None:
    return (
        db.query(LoanApplication)
        .filter(LoanApplication.borrower_id == borrower_id)
        .filter(LoanApplication.stage.notin_({"Disbursed", "Rejected"}))
        .order_by(LoanApplication.created_at.desc(), LoanApplication.id.desc())
        .first()
    )


def _normalize_employment_type(raw_value: str) -> str:
    value = raw_value.strip().lower().replace("-", " ")
    mapping = {
        "salaried": "Salaried",
        "self employed": "Self Employed",
        "business owner": "Business Owner",
        "freelancer": "Freelancer",
        "student": "Student",
        "unemployed": "Unemployed",
    }
    return mapping.get(value, "")


def _application_required_docs(loan_type: str, employment_type: str | None = None) -> list[str]:
    normalized_loan_type = loan_type.strip().lower()
    normalized_employment = _normalize_employment_type(employment_type or "") or "Salaried"

    required_docs = set(UNIVERSAL_REQUIRED_DOCS)

    if normalized_loan_type == "home":
        required_docs.update(["sale_deed", "property_tax"])
    elif normalized_loan_type == "gold":
        required_docs.update(["gold_photo_1", "gold_photo_2", "self_declaration"])
    elif normalized_loan_type == "education":
        docs = ["admission_letter", "fee_structure"]
        if normalized_employment == "Student":
            docs.extend(["co_applicant_income_proof", "guardian_bank_statement"])
        required_docs.update(docs)
    elif normalized_loan_type == "car":
        required_docs.update(["dealer_invoice", "vehicle_quotation"])
    else:
        # Personal loan docs depend heavily on employment type.
        if normalized_employment == "Salaried":
            required_docs.update(["salary_slip_1", "salary_slip_2", "salary_slip_3", "bank_statement"])
        elif normalized_employment in {"Self Employed", "Business Owner", "Freelancer"}:
            required_docs.update(["itr_last_2_years", "business_proof"])
        elif normalized_employment == "Student":
            required_docs.update(["student_id_card", "co_applicant_income_proof", "guardian_bank_statement"])
        else:
            required_docs.update(["co_applicant_income_proof", "bank_statement_6m"])

    return sorted(required_docs)

def _build_report_pdf(report_text: str, arn: str) -> bytes:
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas

    stream = BytesIO()
    pdf = canvas.Canvas(stream, pagesize=A4)
    width, height = A4

    lines = [line.rstrip() for line in report_text.splitlines()]
    if not lines:
        lines = ["No report content generated"]

    lines_per_page = 50
    sections = [lines[i:i + lines_per_page] for i in range(0, len(lines), lines_per_page)]
    while len(sections) < 4:
        sections.append([])

    for page_index in range(4):
        page_lines = sections[page_index] if page_index < len(sections) else []
        pdf.setFont("Helvetica-Bold", 12)
        pdf.drawString(40, height - 40, f"CreditShield Loan Appraisal Report | ARN: {arn} | Page {page_index + 1} of 4")
        pdf.setFont("Helvetica", 10)
        y = height - 70
        for line in page_lines:
            wrapped = line if line else " "
            pdf.drawString(40, y, wrapped[:120])
            y -= 14
            if y < 60:
                break
        pdf.showPage()

    pdf.save()
    return stream.getvalue()


def _upsert_appraisal_record(
    db: Session,
    application: LoanApplication,
    *,
    status_value: str,
    final_score: float | None = None,
    risk_level: str | None = None,
    recommendation: str | None = None,
    confidence_score: float | None = None,
    rows_analyzed: int | None = None,
    kpi_metrics: dict[str, Any] | None = None,
    report_pdf_storage_url: str | None = None,
    report_pdf_access_url: str | None = None,
    report_text: str | None = None,
    error_message: str | None = None,
) -> LoanAppraisalRecord:
    LoanAppraisalRecord.__table__.create(bind=db.get_bind(), checkfirst=True)
    record = (
        db.query(LoanAppraisalRecord)
        .filter(LoanAppraisalRecord.application_id == application.id)
        .first()
    )
    if record is None:
        record = LoanAppraisalRecord(application_id=application.id, arn=application.arn)
        db.add(record)

    record.status = status_value
    record.final_score = final_score
    record.risk_level = risk_level
    record.recommendation = recommendation
    record.confidence_score = confidence_score
    record.rows_analyzed = rows_analyzed
    record.kpi_metrics = kpi_metrics
    record.report_pdf_storage_url = report_pdf_storage_url
    record.report_pdf_access_url = report_pdf_access_url
    record.report_text = report_text
    record.error_message = error_message
    db.commit()
    db.refresh(record)
    return record


async def _run_appraisal_if_ready(db: Session, application: LoanApplication) -> dict[str, Any] | None:
    LoanAppraisalRecord.__table__.create(bind=db.get_bind(), checkfirst=True)
    required_docs = set(_application_required_docs(application.loan_type, application.employment_type))
    docs = db.query(Document).filter(Document.application_id == application.id).all()
    docs_by_type = {_canonical_doc_type(d.doc_type): d for d in docs}
    if not required_docs.issubset(set(docs_by_type.keys())):
        return None

    existing = (
        db.query(LoanAppraisalRecord)
        .filter(LoanAppraisalRecord.application_id == application.id)
        .first()
    )
    if existing and existing.status == "success" and existing.report_pdf_storage_url:
        return {
            "status": existing.status,
            "final_score": float(existing.final_score) if existing.final_score is not None else None,
            "risk_level": existing.risk_level,
            "recommendation": existing.recommendation,
            "confidence_score": float(existing.confidence_score) if existing.confidence_score is not None else None,
            "rows_analyzed": existing.rows_analyzed,
            "report_pdf_storage_url": existing.report_pdf_storage_url,
            "report_pdf_access_url": existing.report_pdf_access_url,
        }

    statement_doc = docs_by_type.get("bank_statement_12m")
    if not statement_doc or not statement_doc.storage_url:
        _upsert_appraisal_record(
            db,
            application,
            status_value="failed",
            error_message="bank_statement_12m must be uploaded with valid storage_url for appraisal",
        )
        return {"status": "failed", "error": "Missing bank_statement_12m storage URL"}

    try:
        logger.info("Loan appraisal started for ARN=%s", application.arn)
        statement_bytes = download_bytes_from_s3(statement_doc.storage_url)
        statement_name = statement_doc.storage_url.rsplit("/", 1)[-1] or "bank_statement_12m.pdf"
        statement_format = _statement_format_from_name(statement_doc.storage_url)
        if statement_format == "unknown":
            raise LoanAppraisalServiceError(
                "bank_statement_12m file must be .csv or .pdf",
                422,
            )
        analysis_result = await run_in_threadpool(
            loan_appraisal_service.analyze_uploaded_statement,
            application.loan_type,
            float(application.loan_amount),
            statement_name,
            statement_bytes,
            APPRAISAL_RULES_PATH,
            APPRAISAL_MODEL_PATH,
            True,
        )
        report_text = await run_in_threadpool(
            loan_appraisal_service.generate_professional_report,
            analysis_result,
            "text",
        )
        pdf_bytes = _build_report_pdf(report_text, application.arn)

        report_object_key = (
            f"borrowers/{application.borrower_id}/applications/{application.arn}/"
            f"loan_appraisal_report_{int(datetime.now(tz=timezone.utc).timestamp())}.pdf"
        )
        report_storage_url = upload_file_to_s3(BytesIO(pdf_bytes), report_object_key, "application/pdf")
        report_access_url = generate_presigned_url(report_object_key)

        result_block = analysis_result.get("result", {})
        professional_block = result_block.get("professional_appraisal", {})
        kpi_metrics = {
            "analysis_period": analysis_result.get("analysis_period", {}),
            "income_diagnostics": professional_block.get("income_diagnostics", {}),
            "cashflow_diagnostics": professional_block.get("cashflow_diagnostics", {}),
            "liability_diagnostics": professional_block.get("liability_diagnostics", {}),
            "loan_amount_analysis": professional_block.get("loan_amount_analysis", {}),
            "rulebook_top_insights": result_block.get("rulebook_top_insights", []),
        }

        record = _upsert_appraisal_record(
            db,
            application,
            status_value="success",
            final_score=float(result_block.get("final_score")) if result_block.get("final_score") is not None else None,
            risk_level=result_block.get("risk_level"),
            recommendation=result_block.get("recommendation"),
            confidence_score=(
                float(result_block.get("confidence_score"))
                if result_block.get("confidence_score") is not None
                else None
            ),
            rows_analyzed=analysis_result.get("rows_analyzed"),
            kpi_metrics=kpi_metrics,
            report_pdf_storage_url=report_storage_url,
            report_pdf_access_url=report_access_url,
            report_text=report_text,
            error_message=None,
        )
        logger.info("Loan appraisal completed for ARN=%s with status=%s", application.arn, record.status)
        return {
            "status": record.status,
            "final_score": float(record.final_score) if record.final_score is not None else None,
            "risk_level": record.risk_level,
            "recommendation": record.recommendation,
            "confidence_score": float(record.confidence_score) if record.confidence_score is not None else None,
            "rows_analyzed": record.rows_analyzed,
            "statement_format": statement_format,
            "report_pdf_storage_url": record.report_pdf_storage_url,
            "report_pdf_access_url": record.report_pdf_access_url,
        }
    except LoanAppraisalServiceError as exc:
        _upsert_appraisal_record(
            db,
            application,
            status_value="failed",
            error_message=str(exc),
        )
        logger.warning("Loan appraisal failed for ARN=%s: %s", application.arn, str(exc))
        return {"status": "failed", "error": str(exc)}
    except Exception as exc:
        _upsert_appraisal_record(
            db,
            application,
            status_value="failed",
            error_message=f"Unexpected appraisal error: {exc}",
        )
        logger.exception("Loan appraisal unexpected failure for ARN=%s", application.arn)
        return {"status": "failed", "error": f"Unexpected appraisal error: {exc}"}


def _get_application_for_borrower_or_404(
    db: Session,
    borrower_id: int,
    application_arn: str,
) -> LoanApplication:
    application = (
        db.query(LoanApplication)
        .filter(LoanApplication.arn == application_arn)
        .filter(LoanApplication.borrower_id == borrower_id)
        .first()
    )
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return application


def _risk_grade(credit_score: int) -> str:
    if credit_score >= 800:
        return "A+"
    if credit_score >= 740:
        return "A"
    if credit_score >= 680:
        return "B"
    return "C"


def _generate_arn() -> str:
    ts = datetime.now(tz=timezone.utc).strftime("%Y%m%d%H%M%S")
    return f"ARN{ts}{randint(10, 99)}"


def _payload_dict(value: object) -> dict:
    if isinstance(value, dict):
        return value
    return {}


def _payload_str(payload: dict, key: str, default: str = "") -> str:
    value = payload.get(key, default)
    return str(value).strip()


def _payload_int(payload: dict, key: str) -> int | None:
    raw = payload.get(key)
    if raw is None or str(raw).strip() == "":
        return None
    try:
        return int(float(str(raw).replace(",", "")))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"{key} must be a valid number") from exc


def _payload_decimal(payload: dict, key: str) -> Decimal | None:
    raw = payload.get(key)
    if raw is None or str(raw).strip() == "":
        return None
    try:
        return Decimal(str(raw).replace(",", ""))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"{key} must be a valid number") from exc


def _payload_education_academic_percentages(payload: dict, key: str = "academic_percentages") -> list[dict]:
    raw = payload.get(key)
    if raw is None:
        return []

    if not isinstance(raw, list):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"{key} must be a list of objects",
        )

    parsed: list[dict] = []
    for idx, item in enumerate(raw):
        if not isinstance(item, dict):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"{key}[{idx}] must be an object",
            )

        level = str(item.get("level", "")).strip()
        if not level:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"{key}[{idx}].level is required",
            )

        raw_percentage = item.get("percentage")
        if raw_percentage is None or str(raw_percentage).strip() == "":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"{key}[{idx}].percentage is required",
            )

        try:
            percentage = float(str(raw_percentage).replace(",", ""))
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"{key}[{idx}].percentage must be a valid number",
            ) from exc

        if percentage < 0 or percentage > 100:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"{key}[{idx}].percentage must be between 0 and 100",
            )

        parsed.append(
            {
                "level": level,
                "percentage": round(percentage, 2),
            }
        )

    return parsed


def _canonical_doc_type(raw_doc_type: str) -> str:
    normalized = raw_doc_type.strip().lower().replace("-", "_")
    aliases = {
        "aadhar_card": "aadhaar_card",
        "aadhaar": "aadhaar_card",
        "aadhar": "aadhaar_card",
        "pan": "pan_card",
        "bank_statement_1y": "bank_statement_12m",
        "bank_statement_1yr": "bank_statement_12m",
        "bank_statement_one_year": "bank_statement_12m",
        "bank_transaction_1_year": "bank_statement_12m",
    }
    return aliases.get(normalized, normalized)


def _statement_format_from_name(file_name: str = "", content_type: str | None = None) -> str:
    normalized = file_name.strip().lower()
    if normalized.startswith("http://") or normalized.startswith("https://"):
        normalized = urlparse(normalized).path.lower().strip()

    if normalized.endswith(".csv"):
        return "csv"
    if normalized.endswith(".pdf"):
        return "pdf"
        if normalized.endswith(".xlsx"):
            return "xlsx"

    mime = (content_type or "").strip().lower()
    if mime in {"text/csv", "application/csv", "application/vnd.ms-excel", "text/plain"}:
        return "csv"
    if mime == "application/pdf":
        return "pdf"
        if mime in {"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel.sheet.macroenabled.12"}:
            return "xlsx"

    return "unknown"


def _missing_required_docs_for_application(db: Session, application: LoanApplication) -> list[str]:
    required_docs = set(_application_required_docs(application.loan_type, application.employment_type))
    uploaded_docs = {
        _canonical_doc_type(row.doc_type)
        for row in db.query(Document).filter(Document.application_id == application.id).all()
    }
    return sorted(required_docs.difference(uploaded_docs))


def _create_loan_type_details(db: Session, application: LoanApplication, loan_type: str, loan_details: dict) -> None:
    details = _payload_dict(loan_details)

    if loan_type == "education":
        course_name = _payload_str(details, "course_name")
        college_name = _payload_str(details, "college_name")
        if not course_name or not college_name:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="course_name and college_name are required for education loans",
            )
        db.add(
            EducationLoanDetails(
                loan_application_id=application.id,
                course_name=course_name,
                specialization=_payload_str(details, "specialization") or None,
                college_name=college_name,
                university_name=_payload_str(details, "university_name") or None,
                admission_status=_payload_str(details, "admission_status") or None,
                entrance_exam=_payload_str(details, "entrance_exam") or None,
                entrance_score=_payload_str(details, "entrance_score") or None,
                course_duration=_payload_int(details, "course_duration"),
                year_of_study=_payload_int(details, "year_of_study"),
                academic_percentages=_payload_education_academic_percentages(details),
                tuition_fee=_payload_decimal(details, "tuition_fee"),
                hostel_fee=_payload_decimal(details, "hostel_fee"),
                other_expenses=_payload_decimal(details, "other_expenses"),
            )
        )
        return

    if loan_type == "gold":
        gold_type = _payload_str(details, "gold_type")
        total_weight_grams = _payload_decimal(details, "total_weight_grams")
        if not gold_type or total_weight_grams is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="gold_type and total_weight_grams are required for gold loans",
            )
        valuation_per_gram = _payload_decimal(details, "valuation_per_gram")
        total_valuation = _payload_decimal(details, "total_valuation")
        ltv_ratio = _payload_decimal(details, "ltv_ratio")
        approved_amount = _payload_decimal(details, "approved_loan_amount")
        if approved_amount is None:
            approved_amount = application.loan_amount
        db.add(
            GoldLoanDetails(
                loan_application_id=application.id,
                gold_type=gold_type,
                total_weight_grams=total_weight_grams,
                purity_karat=_payload_str(details, "purity_karat") or None,
                item_count=_payload_int(details, "item_count"),
                valuation_per_gram=valuation_per_gram,
                total_valuation=total_valuation,
                ltv_ratio=ltv_ratio,
                approved_loan_amount=approved_amount,
            )
        )
        return

    if loan_type == "home":
        db.add(
            HomeLoanDetails(
                loan_application_id=application.id,
                property_type=_payload_str(details, "property_type") or None,
                property_status=_payload_str(details, "property_status") or None,
                property_location=_payload_str(details, "property_location") or None,
                builder_name=_payload_str(details, "builder_name") or None,
                property_value=_payload_decimal(details, "property_value"),
                down_payment=_payload_decimal(details, "down_payment"),
                loan_to_value=_payload_decimal(details, "loan_to_value"),
                purpose=_payload_str(details, "purpose") or None,
            )
        )
        return


@router.get("/kyc/status")
def borrower_kyc_status(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    borrower = _get_borrower_or_404(db, current_user)
    profile = db.query(BorrowerKycProfile).filter(BorrowerKycProfile.borrower_id == borrower.id).first()
    return {
        "kyc_completed": bool(profile and profile.kyc_status == "Verified"),
    }


@router.post("/kyc/complete")
def borrower_kyc_complete(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    borrower = _get_borrower_or_404(db, current_user)
    profile = db.query(BorrowerKycProfile).filter(BorrowerKycProfile.borrower_id == borrower.id).first()
    if not profile:
        profile = BorrowerKycProfile(
            borrower_id=borrower.id,
            kyc_status="Verified",
            kyc_provider="digilocker",
            kyc_reference_id=f"DL-KYC-{borrower.id}",
            verified_at=datetime.now(tz=timezone.utc),
        )
        db.add(profile)
    else:
        profile.kyc_status = "Verified"
        profile.kyc_provider = "digilocker"
        profile.verified_at = datetime.now(tz=timezone.utc)
        profile.rejection_reason = None

    db.commit()
    return {
        "status": "kyc_completed",
        "kyc_completed": True,
    }


@router.get("/loan-types")
def loan_types() -> list[dict]:
    return [
        {"code": "personal", "name": "Personal Loan"},
        {"code": "gold", "name": "Gold Loan"},
        {"code": "home", "name": "Home Loan"},
        {"code": "car", "name": "Car Loan"},
        {"code": "education", "name": "Education Loan"},
    ]


@router.post("/applications")
def create_application(
    payload: dict,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    borrower = _get_borrower_or_404(db, current_user)
    profile = db.query(BorrowerKycProfile).filter(BorrowerKycProfile.borrower_id == borrower.id).first()
    if not profile or profile.kyc_status != "Verified":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Complete KYC before applying for loan")

    loan_type = str(payload.get("loan_type", "personal")).strip().lower()
    if loan_type not in ALLOWED_LOAN_TYPES:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid loan_type")

    amount = int(payload.get("loan_amount", 0) or 0)
    if amount <= 0:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="loan_amount must be greater than 0")

    employment_type = _normalize_employment_type(str(payload.get("employment_type", "Salaried")))
    if employment_type not in ALLOWED_EMPLOYMENT_TYPES:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid employment_type")

    credit_score = int(payload.get("credit_score", 730) or 730)
    credit_score = max(300, min(900, credit_score))
    risk_grade = _risk_grade(credit_score)

    arn = _generate_arn()
    while db.query(LoanApplication.id).filter(LoanApplication.arn == arn).first():
        arn = _generate_arn()

    application = LoanApplication(
        arn=arn,
        borrower_id=borrower.id,
        borrower_name=borrower.full_name,
        borrower_email=borrower.email,
        borrower_phone=borrower.mobile_number,
        loan_amount=Decimal(str(amount)),
        loan_type=loan_type,
        stage="Submitted",
        risk_grade=risk_grade,
        credit_score=credit_score,
        kyc_status="Verified",
        employment_type=employment_type,
        purpose=str(payload.get("purpose", "General")),
    )
    db.add(application)
    db.flush()

    _create_loan_type_details(db, application, loan_type, payload.get("loan_details", {}))

    db.commit()
    db.refresh(application)

    return {
        "application_id": application.arn,
        "loan_type": application.loan_type,
        "employment_type": application.employment_type,
        "loan_amount": int(application.loan_amount),
        "stage": application.stage,
        "created_at": application.created_at.isoformat(),
    }


@router.get("/applications/current")
def get_current_application(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    borrower = _get_borrower_or_404(db, current_user)
    application = _latest_active_application(db, borrower.id)
    if not application:
        return {
            "application_id": None,
            "stage": "No active application",
        }
    return {
        "application_id": application.arn,
        "borrower_name": application.borrower_name,
        "loan_type": application.loan_type,
        "employment_type": application.employment_type,
        "loan_amount": int(application.loan_amount),
        "stage": application.stage,
        "created_at": application.created_at.isoformat(),
    }


@router.get("/documents/required")
def required_documents(loan_type: str = "personal", employment_type: str = "Salaried") -> list[dict]:
    docs = _application_required_docs(loan_type, employment_type)
    return [
        {"code": code, "name": code.replace("_", " ").title(), "required": True}
        for code in docs
    ]


@router.get("/applications/{application_id}/documents/required")
def required_documents_for_application(
    application_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[dict]:
    borrower = _get_borrower_or_404(db, current_user)
    application = _get_application_for_borrower_or_404(db, borrower.id, application_id)
    docs = _application_required_docs(application.loan_type, application.employment_type)
    return [
        {"code": code, "name": code.replace("_", " ").title(), "required": True}
        for code in docs
    ]


@router.get("/applications/{application_id}/documents")
def list_application_documents(
    application_id: str,
    include_signed_url: bool = Query(default=False),
    signed_url_expires_in: int = Query(default=3600, ge=60, le=86400),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[dict]:
    borrower = _get_borrower_or_404(db, current_user)
    application = _get_application_for_borrower_or_404(db, borrower.id, application_id)
    documents = (
        db.query(Document)
        .filter(Document.application_id == application.id)
        .order_by(Document.uploaded_at.desc(), Document.id.desc())
        .all()
    )
    output: list[dict] = []
    for doc in documents:
        item = {
            "id": doc.id,
            "doc_type": doc.doc_type,
            "status": doc.status,
            "confidence": doc.confidence,
            "storage_url": doc.storage_url,
            "uploaded_at": doc.uploaded_at.isoformat(),
        }
        if include_signed_url and doc.storage_url:
            try:
                object_key = extract_object_key_from_url(doc.storage_url)
                item["access_url"] = generate_presigned_url(object_key, expires_in=signed_url_expires_in)
            except Exception:
                item["access_url"] = doc.storage_url
        output.append(item)
    return output


@router.get("/applications/{application_id}/loan-appraisal")
def get_application_loan_appraisal(
    application_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    borrower = _get_borrower_or_404(db, current_user)
    application = _get_application_for_borrower_or_404(db, borrower.id, application_id)
    missing_docs = _missing_required_docs_for_application(db, application)
    record = (
        db.query(LoanAppraisalRecord)
        .filter(LoanAppraisalRecord.application_id == application.id)
        .first()
    )
    if not record:
        return {
            "application_id": application.arn,
            "status": "not_started",
            "missing_required_docs": missing_docs,
            "loan_type": application.loan_type,
            "loan_amount": float(application.loan_amount),
        }

    statement_format = "unknown"
    statement_doc = (
        db.query(Document)
        .filter(Document.application_id == application.id)
        .filter(Document.doc_type.in_(["bank_statement_12m", "bank_statement_1y", "bank_statement_1yr"]))
        .order_by(Document.uploaded_at.desc(), Document.id.desc())
        .first()
    )
    if statement_doc and statement_doc.storage_url:
        statement_name = statement_doc.storage_url.rsplit("/", 1)[-1]
        statement_format = _statement_format_from_name(statement_doc.storage_url)

    return {
        "application_id": application.arn,
        "status": record.status,
        "final_score": float(record.final_score) if record.final_score is not None else None,
        "risk_level": record.risk_level,
        "recommendation": record.recommendation,
        "confidence_score": float(record.confidence_score) if record.confidence_score is not None else None,
        "rows_analyzed": record.rows_analyzed,
        "kpi_metrics": record.kpi_metrics,
        "statement_format": statement_format,
        "report_pdf_storage_url": record.report_pdf_storage_url,
        "report_pdf_access_url": record.report_pdf_access_url,
        "error_message": record.error_message,
        "missing_required_docs": missing_docs,
        "updated_at": record.updated_at.isoformat() if record.updated_at else None,
    }


@router.post("/applications/{application_id}/loan-appraisal/run")
async def run_application_loan_appraisal(
    application_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    borrower = _get_borrower_or_404(db, current_user)
    application = _get_application_for_borrower_or_404(db, borrower.id, application_id)

    missing_docs = _missing_required_docs_for_application(db, application)
    if missing_docs:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": "Upload all required documents before running loan appraisal",
                "missing_required_docs": missing_docs,
            },
        )

    appraisal_payload = await _run_appraisal_if_ready(db, application)
    if appraisal_payload is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Loan appraisal could not start. Required documents may be incomplete.",
        )

    return {
        "application_id": application.arn,
        "loan_appraisal": appraisal_payload,
    }


@router.post("/applications/{application_id}/documents")
async def upload_application_document(
    application_id: str,
    payload: dict,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    borrower = _get_borrower_or_404(db, current_user)
    application = _get_application_for_borrower_or_404(db, borrower.id, application_id)

    raw_doc_type = str(payload.get("doc_type", "")).strip()
    if not raw_doc_type:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="doc_type is required")
    doc_type = _canonical_doc_type(raw_doc_type)

    status_value = str(payload.get("status", "Pending OCR")).strip() or "Pending OCR"
    if status_value not in {"Verified", "Pending OCR", "Flagged"}:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid status")

    confidence_raw = payload.get("confidence")
    confidence: int | None = None
    if confidence_raw is not None:
        confidence = int(confidence_raw)
        if confidence < 0 or confidence > 100:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="confidence must be between 0 and 100")

    storage_url_raw = payload.get("storage_url")
    storage_url = str(storage_url_raw).strip() if storage_url_raw is not None else None
    if storage_url == "":
        storage_url = None
    if storage_url and not (storage_url.startswith("http://") or storage_url.startswith("https://")):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="storage_url must be a valid http(s) URL. Use /documents/upload for S3-backed uploads.",
        )
    if doc_type == "bank_statement_12m" and storage_url:
        statement_format = _statement_format_from_name(storage_url)
        if statement_format == "unknown":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="bank_statement_12m storage_url must point to .csv, .xlsx, or .pdf file",
            )

    existing = (
        db.query(Document)
        .filter(Document.application_id == application.id)
        .filter(Document.doc_type == doc_type)
        .first()
    )

    if existing:
        existing.status = status_value
        existing.confidence = confidence
        existing.storage_url = storage_url
        doc = existing
    else:
        doc = Document(
            application_id=application.id,
            doc_type=doc_type,
            status=status_value,
            confidence=confidence,
            storage_url=storage_url,
            uploaded_by_user_id=None,
        )
        db.add(doc)

    required_docs = set(_application_required_docs(application.loan_type, application.employment_type))
    uploaded_required_docs = {
        _canonical_doc_type(row.doc_type)
        for row in db.query(Document)
        .filter(Document.application_id == application.id)
        .all()
    }
    uploaded_required_docs.add(doc_type)

    if required_docs.issubset(uploaded_required_docs):
        application.stage = "Underwriting"
    else:
        application.stage = "Documents Pending"

    db.commit()
    db.refresh(doc)
    db.refresh(application)

    appraisal_payload: dict[str, Any] | None = None
    if application.stage == "Underwriting":
        appraisal_payload = await _run_appraisal_if_ready(db, application)

    return {
        "document_id": doc.id,
        "application_id": application.arn,
        "doc_type": doc.doc_type,
        "status": doc.status,
        "confidence": doc.confidence,
        "storage_url": doc.storage_url,
        "uploaded_at": doc.uploaded_at.isoformat(),
        "application_stage": application.stage,
        "loan_appraisal": appraisal_payload,
    }


@router.post("/applications/{application_id}/documents/upload")
async def upload_application_document_file(
    application_id: str,
    doc_type: str = Form(...),
    file: UploadFile = File(...),
    status_value: str = Form(default="Pending OCR"),
    confidence: int | None = Form(default=None),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    borrower = _get_borrower_or_404(db, current_user)
    application = _get_application_for_borrower_or_404(db, borrower.id, application_id)

    normalized_doc_type = _canonical_doc_type(doc_type)
    if not normalized_doc_type:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="doc_type is required")

    normalized_status = status_value.strip() or "Pending OCR"
    if normalized_status not in {"Verified", "Pending OCR", "Flagged"}:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid status")

    if confidence is not None and (confidence < 0 or confidence > 100):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="confidence must be between 0 and 100")

    original_name = (file.filename or "document.bin").strip()
    if normalized_doc_type == "bank_statement_12m":
        statement_format = _statement_format_from_name(original_name, file.content_type)
        if statement_format == "unknown":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="bank_statement_12m must be uploaded as .csv, .xlsx, or .pdf",
            )
    safe_name = re.sub(r"[^A-Za-z0-9._-]", "_", original_name)
    safe_doc_type = re.sub(r"[^A-Za-z0-9._-]", "_", normalized_doc_type.lower())
    object_key = (
        f"borrowers/{borrower.id}/applications/{application.arn}/"
        f"{int(datetime.now(tz=timezone.utc).timestamp())}_{safe_doc_type}_{safe_name}"
    )

    try:
        storage_url = upload_file_to_s3(file.file, object_key, file.content_type or "application/octet-stream")
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"S3 upload failed: {exc}") from exc

    existing = (
        db.query(Document)
        .filter(Document.application_id == application.id)
        .filter(Document.doc_type == normalized_doc_type)
        .first()
    )

    if existing:
        existing.status = normalized_status
        existing.confidence = confidence
        existing.storage_url = storage_url
        doc = existing
    else:
        doc = Document(
            application_id=application.id,
            doc_type=normalized_doc_type,
            status=normalized_status,
            confidence=confidence,
            storage_url=storage_url,
            uploaded_by_user_id=None,
        )
        db.add(doc)

    required_docs = set(_application_required_docs(application.loan_type, application.employment_type))
    uploaded_required_docs = {
        _canonical_doc_type(row.doc_type)
        for row in db.query(Document)
        .filter(Document.application_id == application.id)
        .all()
    }
    uploaded_required_docs.add(normalized_doc_type)

    if required_docs.issubset(uploaded_required_docs):
        application.stage = "Underwriting"
    else:
        application.stage = "Documents Pending"

    db.commit()
    db.refresh(doc)
    db.refresh(application)

    appraisal_payload: dict[str, Any] | None = None
    if application.stage == "Underwriting":
        appraisal_payload = await _run_appraisal_if_ready(db, application)

    access_url: str | None = None
    try:
        access_url = generate_presigned_url(object_key)
    except Exception:
        access_url = storage_url

    return {
        "document_id": doc.id,
        "application_id": application.arn,
        "doc_type": doc.doc_type,
        "status": doc.status,
        "confidence": doc.confidence,
        "storage_url": doc.storage_url,
        "access_url": access_url,
        "uploaded_at": doc.uploaded_at.isoformat(),
        "application_stage": application.stage,
        "loan_appraisal": appraisal_payload,
    }


@router.post("/consent/submit")
def submit_consent(payload: dict, current_user: AuthenticatedUser = Depends(get_current_user)) -> dict:
    return {
        "status": "consent_recorded",
        "consent_version": payload.get("consent_version", "v1"),
        "borrower": current_user.username,
    }


@router.get("/rbi/checkpoint")
def rbi_checkpoint() -> dict:
    return {
        "kfs_disclosed": True,
        "cooling_off_disclosed": True,
        "grievance_contact_shown": True,
    }


@router.get("/risk-score")
def borrower_risk_score() -> dict:
    return {
        "composite_score": 742,
        "risk_grade": "A",
        "decision": "PROVISIONAL_APPROVE",
    }


@router.get("/offers")
def borrower_offers(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[dict]:
    borrower = _get_borrower_or_404(db, current_user)
    application = _latest_application(db, borrower.id)
    base_amount = int(application.loan_amount) if application else 500000
    return [
        {"offer_id": "offer-1", "lender": "Lender A", "amount": base_amount, "apr": 12.9, "tenure": 36},
        {"offer_id": "offer-2", "lender": "Lender B", "amount": int(base_amount * 0.96), "apr": 11.8, "tenure": 30},
    ]


@router.post("/offers/{offer_id}/select")
def select_offer(offer_id: str) -> dict:
    return {
        "status": "offer_selected",
        "offer_id": offer_id,
    }


@router.get("/agreement")
def agreement_summary() -> dict:
    return {
        "agreement_id": "AG-001",
        "status": "ready_for_esign",
    }


@router.get("/dashboard")
def borrower_dashboard(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    borrower = _get_borrower_or_404(db, current_user)
    application = _latest_active_application(db, borrower.id)
    return {
        "borrower": current_user.username,
        "active_application": application.arn if application else None,
        "current_stage": application.stage if application else "No active application",
        "next_emi": "2026-05-05",
        "loan_health": "On Track",
    }


@router.get("/tracker")
def borrower_tracker(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    borrower = _get_borrower_or_404(db, current_user)
    application = _latest_active_application(db, borrower.id)
    if not application:
        return {"stage": "No active application"}
    return {
        "application_id": application.arn,
        "borrower_name": application.borrower_name,
        "loan_type": application.loan_type,
        "employment_type": application.employment_type,
        "loan_amount": int(application.loan_amount),
        "stage": application.stage,
    }


@router.get("/notifications")
def borrower_notifications() -> list[dict]:
    return [
        {"id": "n1", "title": "Welcome", "message": "Your account is ready"},
        {"id": "n2", "title": "Offer Available", "message": "New lender offer added"},
    ]
