from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, verify_password
from app.schemas.user import LoginRequest, TokenResponse
from app.services import user_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    username = payload.username.strip()

    if username == settings.system_admin_username and payload.password == settings.system_admin_password:
        token, expires_in_seconds = create_access_token(
            username=settings.system_admin_username,
            role="system_admin",
            full_name=settings.system_admin_full_name,
        )
        return TokenResponse(
            access_token=token,
            role="system_admin",
            full_name=settings.system_admin_full_name,
            expires_in_seconds=expires_in_seconds,
        )

    user = user_service.get_user_by_email(db, username)
    if not user or not user.is_active or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    token, expires_in_seconds = create_access_token(
        username=user.email,
        role=user.role.value,
        full_name=user.full_name,
    )
    return TokenResponse(
        access_token=token,
        role=user.role.value,
        full_name=user.full_name,
        expires_in_seconds=expires_in_seconds,
    )
