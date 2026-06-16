from datetime import datetime
from enum import Enum
import re

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


PASSWORD_PATTERN = re.compile(r"^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$")
PASSWORD_RULE_MESSAGE = (
    "Password must be at least 8 characters and include at least one uppercase letter, "
    "one number, and one symbol"
)


class UserRole(str, Enum):
    LOAN_OFFICER = "loan_officer"
    CREDIT_ANALYST = "credit_analyst"
    UNDERWRITER = "underwriter"
    COMPLIANCE_OFFICER = "compliance_officer"


class UserBase(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    role: UserRole
    is_active: bool = True


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        if not PASSWORD_PATTERN.match(value):
            raise ValueError(PASSWORD_RULE_MESSAGE)
        return value


class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    role: UserRole | None = None
    is_active: bool | None = None
    password: str | None = Field(default=None, min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str | None) -> str | None:
        if value is None:
            return value
        if not PASSWORD_PATTERN.match(value):
            raise ValueError(PASSWORD_RULE_MESSAGE)
        return value


class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    username: str = Field(min_length=3, max_length=255, description="Use system admin username or user email")
    password: str = Field(min_length=8, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    full_name: str
    expires_in_seconds: int