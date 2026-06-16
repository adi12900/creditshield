from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# Use pbkdf2_sha256 to avoid bcrypt backend/runtime issues on some environments.
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
http_bearer = HTTPBearer(auto_error=False)


class AuthenticatedUser:
    def __init__(self, username: str, role: str, full_name: str):
        self.username = username
        self.role = role
        self.full_name = full_name


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    return pwd_context.verify(plain_password, password_hash)


def create_access_token(*, username: str, role: str, full_name: str) -> tuple[str, int]:
    expires_delta = timedelta(minutes=settings.jwt_access_token_expire_minutes)
    expire_at = datetime.now(timezone.utc) + expires_delta
    payload = {
        "sub": username,
        "role": role,
        "full_name": full_name,
        "exp": expire_at,
    }
    token = jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return token, int(expires_delta.total_seconds())


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(http_bearer),
) -> AuthenticatedUser:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
        )

    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        username = str(payload.get("sub", "")).strip()
        role = str(payload.get("role", "")).strip()
        full_name = str(payload.get("full_name", "")).strip() or username
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc

    if not username or not role:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    return AuthenticatedUser(username=username, role=role, full_name=full_name)


def require_auth_roles(allowed_roles: set[str]):
    def dependency(current_user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.role}' is not allowed for this endpoint",
            )
        return current_user

    return dependency
