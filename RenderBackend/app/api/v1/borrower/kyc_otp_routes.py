"""
KYC OTP routes — Aadhaar verification via email OTP.
Flow:
  1. POST /borrower/kyc/aadhaar/send-otp  — hash Aadhaar, check registry, send OTP via Node service
  2. POST /borrower/kyc/aadhaar/verify-otp — verify OTP via Node service, mark KYC verified
"""
import hashlib
import os
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import AuthenticatedUser, get_current_user, require_auth_roles
from app.models.aadhaar_registry import AadhaarRegistry
from app.models.borrower import Borrower
from app.models.borrower_kyc_profile import BorrowerKycProfile

router = APIRouter(
    prefix="/borrower/kyc/aadhaar",
    tags=["borrower-kyc-aadhaar"],
    dependencies=[Depends(require_auth_roles({"borrower"}))],
)

OTP_SERVICE_URL = os.getenv("OTP_SERVICE_URL", "http://localhost:3001")


def _hash_aadhaar(aadhaar: str) -> str:
    """SHA-256 hash of the raw Aadhaar number."""
    return hashlib.sha256(aadhaar.strip().encode()).hexdigest()


def _get_borrower_or_404(db: Session, current_user: AuthenticatedUser) -> Borrower:
    borrower = db.query(Borrower).filter(Borrower.email == current_user.username).first()
    if not borrower or not borrower.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Borrower not found")
    return borrower


class SendOtpRequest(BaseModel):
    aadhaar_number: str


class VerifyOtpRequest(BaseModel):
    otp: str


@router.post("/send-otp")
async def send_kyc_otp(
    payload: SendOtpRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    aadhaar = payload.aadhaar_number.strip().replace(" ", "")
    if len(aadhaar) != 12 or not aadhaar.isdigit():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid Aadhaar number")

    aadhaar_hash = _hash_aadhaar(aadhaar)
    registry_entry = db.query(AadhaarRegistry).filter(
        AadhaarRegistry.aadhaar_hash == aadhaar_hash,
        AadhaarRegistry.is_active == True,
    ).first()

    if not registry_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aadhaar not found in registry. Please contact support.",
        )

    # Send OTP via Node service to the email linked to this Aadhaar
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"{OTP_SERVICE_URL}/send-otp",
                json={"email": registry_entry.email},
            )
            if resp.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Failed to send OTP. Please try again.",
                )
    except httpx.RequestError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="OTP service unavailable. Please try again later.",
        )

    # Mask email for display: y***@gmail.com
    email = registry_entry.email
    parts = email.split("@")
    masked = parts[0][0] + "***@" + parts[1] if len(parts) == 2 else "***"

    return {
        "success": True,
        "message": f"OTP sent to {masked}",
        "masked_email": masked,
    }


@router.post("/verify-otp")
async def verify_kyc_otp(
    payload: VerifyOtpRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    borrower = _get_borrower_or_404(db, current_user)

    # Verify OTP via Node service using borrower's email
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"{OTP_SERVICE_URL}/verify-otp",
                json={"email": borrower.email, "otp": payload.otp},
            )
            result = resp.json()
            if not result.get("valid"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=result.get("error", "Invalid OTP"),
                )
    except httpx.RequestError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="OTP service unavailable. Please try again later.",
        )

    # Mark KYC as verified
    profile = db.query(BorrowerKycProfile).filter(BorrowerKycProfile.borrower_id == borrower.id).first()
    if not profile:
        profile = BorrowerKycProfile(
            borrower_id=borrower.id,
            kyc_status="Verified",
            kyc_provider="aadhaar_email_otp",
            kyc_reference_id=f"AADH-OTP-{borrower.id}",
            verified_at=datetime.now(tz=timezone.utc),
        )
        db.add(profile)
    else:
        profile.kyc_status = "Verified"
        profile.kyc_provider = "aadhaar_email_otp"
        profile.verified_at = datetime.now(tz=timezone.utc)
        profile.rejection_reason = None

    db.commit()
    return {"success": True, "kyc_completed": True, "message": "KYC verified successfully"}
