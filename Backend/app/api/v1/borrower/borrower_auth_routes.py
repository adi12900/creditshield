from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import AuthenticatedUser, create_access_token, get_current_user, require_auth_roles, verify_password
from app.schemas.borrower import BorrowerAuthResponse, BorrowerLoginRequest, BorrowerProfile, BorrowerSignupRequest
from app.services import borrower_service

router = APIRouter(prefix="/borrower/auth", tags=["borrower-auth"])


@router.post("/signup", response_model=BorrowerAuthResponse, status_code=status.HTTP_201_CREATED)
def borrower_signup(payload: BorrowerSignupRequest, db: Session = Depends(get_db)) -> BorrowerAuthResponse:
    existing_email = borrower_service.get_borrower_by_email(db, str(payload.email))
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Borrower with this email already exists",
        )

    existing_mobile = borrower_service.get_borrower_by_mobile(db, payload.mobile_number)
    if existing_mobile:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Borrower with this mobile number already exists",
        )

    borrower = borrower_service.create_borrower(db, payload)
    token, expires_in_seconds = create_access_token(
        username=borrower.email,
        role="borrower",
        full_name=borrower.full_name,
    )

    return BorrowerAuthResponse(
        access_token=token,
        full_name=borrower.full_name,
        borrower=BorrowerProfile.model_validate(borrower),
        expires_in_seconds=expires_in_seconds,
    )


@router.post("/login", response_model=BorrowerAuthResponse)
def borrower_login(payload: BorrowerLoginRequest, db: Session = Depends(get_db)) -> BorrowerAuthResponse:
    identifier = payload.identifier.strip()
    borrower = borrower_service.get_borrower_by_identifier(db, identifier)

    if not borrower or not borrower.is_active or not verify_password(payload.password, borrower.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    token, expires_in_seconds = create_access_token(
        username=borrower.email,
        role="borrower",
        full_name=borrower.full_name,
    )

    return BorrowerAuthResponse(
        access_token=token,
        full_name=borrower.full_name,
        borrower=BorrowerProfile.model_validate(borrower),
        expires_in_seconds=expires_in_seconds,
    )


@router.get(
    "/me",
    response_model=BorrowerProfile,
    dependencies=[Depends(require_auth_roles({"borrower"}))],
)
def borrower_me(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BorrowerProfile:
    borrower = borrower_service.get_borrower_by_email(db, current_user.username)
    if not borrower or not borrower.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Borrower profile not found",
        )
    return BorrowerProfile.model_validate(borrower)
