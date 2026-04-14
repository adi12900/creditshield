import re
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

PASSWORD_PATTERN = re.compile(r"^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$")
PASSWORD_RULE_MESSAGE = (
    "Password must be at least 8 characters and include at least one uppercase letter, "
    "one number, and one symbol"
)


class BorrowerSignupRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    mobile_number: str = Field(min_length=10, max_length=15)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("mobile_number")
    @classmethod
    def validate_mobile_number(cls, value: str) -> str:
        normalized = value.strip()
        if not re.fullmatch(r"\d{10,15}", normalized):
            raise ValueError("Mobile number must contain only digits and be 10 to 15 digits long")
        return normalized

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        if not PASSWORD_PATTERN.match(value):
            raise ValueError(PASSWORD_RULE_MESSAGE)
        return value


class BorrowerLoginRequest(BaseModel):
    identifier: str = Field(min_length=3, max_length=255, description="Borrower email or mobile number")
    password: str = Field(min_length=8, max_length=128)


class BorrowerProfile(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    mobile_number: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BorrowerAuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str = "borrower"
    full_name: str
    borrower: BorrowerProfile
    expires_in_seconds: int
