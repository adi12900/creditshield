from datetime import datetime, timezone
from decimal import Decimal
from random import randint

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import AuthenticatedUser, get_current_user, require_auth_roles
from app.models.borrower import Borrower
from app.models.borrower_kyc_profile import BorrowerKycProfile
from app.models.loan_application import LoanApplication

router = APIRouter(
    prefix="/borrower",
    tags=["borrower-journey"],
    dependencies=[Depends(require_auth_roles({"borrower"}))],
)

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

    loan_type = str(payload.get("loan_type", "personal"))
    amount = int(payload.get("loan_amount", 0) or 0)
    if amount <= 0:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="loan_amount must be greater than 0")

    employment_type = str(payload.get("employment_type", "Salaried"))
    if employment_type not in {"Salaried", "Self Employed"}:
        employment_type = "Salaried"

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
    db.commit()
    db.refresh(application)

    return {
        "application_id": application.arn,
        "loan_type": application.loan_type,
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
    application = _latest_application(db, borrower.id)
    if not application:
        return {
            "application_id": None,
            "stage": "No active application",
        }
    return {
        "application_id": application.arn,
        "loan_type": application.loan_type,
        "loan_amount": int(application.loan_amount),
        "stage": application.stage,
        "created_at": application.created_at.isoformat(),
    }


@router.get("/documents/required")
def required_documents() -> list[dict]:
    return [
        {"code": "id_proof", "name": "Identity Proof", "required": True},
        {"code": "address_proof", "name": "Address Proof", "required": True},
        {"code": "income_proof", "name": "Income Proof", "required": True},
    ]


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
    application = _latest_application(db, borrower.id)
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
    application = _latest_application(db, borrower.id)
    if not application:
        return {"stage": "No active application"}
    return {
        "application_id": application.arn,
        "stage": application.stage,
    }


@router.get("/notifications")
def borrower_notifications() -> list[dict]:
    return [
        {"id": "n1", "title": "Welcome", "message": "Your account is ready"},
        {"id": "n2", "title": "Offer Available", "message": "New lender offer added"},
    ]
