from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class GenerateTokenRequest(BaseModel):
    force_refresh: bool = False


class GenerateTokenResponse(BaseModel):
    access_token: str
    refresh_token: str | None = None
    token_type: str = "Bearer"
    expires_in: int | None = None
    expires_at: datetime | None = None


# Setu AA v2 - Consent Models
class ConsentDuration(BaseModel):
    unit: str = Field(default="MONTH", description="MONTH, YEAR, DAY")
    value: int = Field(ge=1, le=120)


class DataRange(BaseModel):
    from_date: str = Field(alias="from", description="ISO 8601 format: 2023-01-01T00:00:00Z")
    to_date: str = Field(alias="to", description="ISO 8601 format: 2023-12-31T23:59:59Z")

    class Config:
        allow_population_by_field_name = True


class PurposeCategory(BaseModel):
    type: str = "LOAN"


class Purpose(BaseModel):
    code: str = Field(default="103", description="103=Loan underwriting")
    text: str = "Loan underwriting and risk assessment"
    refUri: str = "https://www.setu.co/purpose"
    category: PurposeCategory


class CreateConsentRequest(BaseModel):
    """Setu AA v2 Consent Creation Request"""
    vua: str = Field(description="Virtual Unconstrained Address (e.g., 9999999999@onemoney)")
    dataRange: DataRange = Field(description="Date range for FI data")
    fiTypes: list[str] = Field(
        default_factory=lambda: ["DEPOSIT"],
        description="Financial Info Types: DEPOSIT, TERM_DEPOSIT, MUTUAL_FUNDS, etc."
    )
    consentTypes: list[str] = Field(
        default_factory=lambda: ["PROFILE", "SUMMARY", "TRANSACTIONS"],
        description="Types of consent data"
    )
    consentDuration: ConsentDuration = Field(description="How long to store data")
    purpose: Purpose = Field(description="Purpose of consent")
    redirectUrl: str | None = None
    PAN: str | None = None


class CreateConsentResponse(BaseModel):
    id: str = Field(description="Consent request ID")
    url: str = Field(description="URL for user to approve consent")
    status: str = Field(description="PENDING, INITIATED, ACTIVE, REJECTED, etc.")
    detail: dict[str, Any] | None = None
    txnid: str | None = None


class WebhookPayload(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: str | None = None
    consent_id: str | None = None
    consentId: str | None = None
    status: str | None = None
    consentStatus: str | None = None


class WebhookResponse(BaseModel):
    message: str
    consent_id: str
    status: str


# Setu AA v2 - Data Fetch Models
class CreateFIDataFetchRequest(BaseModel):
    """Setu AA v2 FI Data Fetch Session Request"""
    consentId: str = Field(description="Consent ID from consent creation")
    dataRange: DataRange = Field(description="Date range for FI data")
    format: str = Field(default="json", description="json or xml")


class FIAccount(BaseModel):
    maskedAccNumber: str | None = None
    linkRefNumber: str | None = None
    fiType: str | None = None
    data: dict[str, Any] | None = None


class FIProvider(BaseModel):
    fipID: str | None = None
    accounts: list[FIAccount] | None = None


class FetchDataResponse(BaseModel):
    id: str = Field(description="Session ID")
    status: str = Field(description="PENDING, COMPLETED, FAILED, PARTIAL")
    consentId: str
    dataRange: DataRange
    format: str
    fips: list[FIProvider] | None = None
    txnid: str | None = None


# Legacy compatibility - for gradual migration
class FetchTransactionsRequest(BaseModel):
    consent_id: str
    from_date: str | None = None
    to_date: str | None = None


class TransactionItem(BaseModel):
    transaction_id: str | None = None
    amount: float | None = None
    currency: str | None = None
    transaction_type: str | None = None
    narration: str | None = None
    timestamp: str | None = None
    mode: str | None = None
    current_balance: float | None = None
    raw: dict[str, Any]


class FetchTransactionsResponse(BaseModel):
    consent_id: str
    consent_status: str
    count: int
    transactions: list[TransactionItem]
