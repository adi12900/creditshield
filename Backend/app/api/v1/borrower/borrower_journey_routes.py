from datetime import datetime, timezone
from decimal import Decimal
from random import randint

from fastapi import APIRouter, Depends, HTTPException, status
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

    if normalized_loan_type == "home":
        return ["sale_deed", "property_tax"]
    if normalized_loan_type == "gold":
        return ["gold_photo_1", "gold_photo_2", "self_declaration"]
    if normalized_loan_type == "education":
        docs = ["admission_letter", "fee_structure"]
        if normalized_employment == "Student":
            docs.extend(["co_applicant_income_proof", "guardian_bank_statement"])
        return docs
    if normalized_loan_type == "car":
        return ["dealer_invoice", "vehicle_quotation"]

    # Personal loan docs depend heavily on employment type.
    if normalized_employment == "Salaried":
        return ["salary_slip_1", "salary_slip_2", "salary_slip_3", "bank_statement"]
    if normalized_employment in {"Self Employed", "Business Owner", "Freelancer"}:
        return ["itr_last_2_years", "bank_statement_12m", "business_proof"]
    if normalized_employment == "Student":
        return ["student_id_card", "co_applicant_income_proof", "guardian_bank_statement"]
    return ["co_applicant_income_proof", "bank_statement_6m"]


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


@router.post("/eligibility/check")
def check_eligibility(payload: dict, current_user: AuthenticatedUser = Depends(get_current_user)) -> dict:
    income = float(payload.get("monthly_income", 0) or 0)
    obligations = float(payload.get("existing_obligations", 0) or 0)
    score = max(0, min(100, int((income - obligations) / 1000) + 50))
    return {
        "eligible": income > obligations,
        "score": score,
        "reason": "Eligibility estimated from income-obligation profile",
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
    return [
        {
            "id": doc.id,
            "doc_type": doc.doc_type,
            "status": doc.status,
            "confidence": doc.confidence,
            "storage_url": doc.storage_url,
            "uploaded_at": doc.uploaded_at.isoformat(),
        }
        for doc in documents
    ]


@router.post("/applications/{application_id}/documents")
def upload_application_document(
    application_id: str,
    payload: dict,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    borrower = _get_borrower_or_404(db, current_user)
    application = _get_application_for_borrower_or_404(db, borrower.id, application_id)

    doc_type = str(payload.get("doc_type", "")).strip()
    if not doc_type:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="doc_type is required")

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
        row.doc_type
        for row in db.query(Document)
        .filter(Document.application_id == application.id)
        .filter(Document.doc_type.in_(required_docs))
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

    return {
        "document_id": doc.id,
        "application_id": application.arn,
        "doc_type": doc.doc_type,
        "status": doc.status,
        "confidence": doc.confidence,
        "storage_url": doc.storage_url,
        "uploaded_at": doc.uploaded_at.isoformat(),
        "application_stage": application.stage,
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
