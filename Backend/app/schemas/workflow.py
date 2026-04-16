from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


UserRole = Literal[
    "loan_officer",
    "credit_analyst",
    "underwriter",
    "compliance_officer",
]

LoanStage = Literal[
    "Lead",
    "Submitted",
    "Documents Pending",
    "KYC",
    "Underwriting",
    "Offer Sent",
    "Disbursed",
    "Rejected",
]


class LoanApplicationOut(BaseModel):
    arn: str
    borrower_name: str
    loan_amount: float
    stage: LoanStage
    risk_grade: Literal["A+", "A", "B", "C"]
    credit_score: int
    kyc_status: Literal["Verified", "Pending"]
    employment_type: Literal["Salaried", "Self Employed"]
    purpose: str


class DashboardStat(BaseModel):
    key: str
    value: float | int | str


class DashboardResponse(BaseModel):
    role: UserRole
    stats: list[DashboardStat]


class DocumentItem(BaseModel):
    id: str
    type: str
    status: Literal["Verified", "Pending OCR", "Flagged"]
    confidence: int = Field(ge=0, le=100)
    agent_verdict: str | None = None
    storage_url: str | None = None
    uploaded_at: str | None = None


class DocumentReviewRequest(BaseModel):
    document_id: str
    decision: Literal["approve", "reject"]
    reason: str | None = None


class CommunicationMessageRequest(BaseModel):
    channel: Literal["email", "sms", "call"]
    subject: str
    message: str


class CreditMemoDraftRequest(BaseModel):
    summary: str
    strengths: str
    risk_factors: str
    recommendation: Literal["Approve", "Approve with Conditions", "Decline"]
    conditions: str | None = None


class RatioRecalculateRequest(BaseModel):
    monthly_income: float = Field(gt=0)
    existing_obligations: float = Field(ge=0)
    proposed_emi: float = Field(gt=0)
    loan_amount: float = Field(gt=0)
    asset_value: float = Field(gt=0)


class RatioRecalculateResponse(BaseModel):
    dti: float
    foir: float
    ltv: float
    policy_pass: bool


class LoanStructuringRequest(BaseModel):
    loan_amount: float = Field(gt=0)
    tenure_months: int = Field(ge=6, le=120)
    interest_rate: float = Field(gt=0, le=40)


class LoanOfferResponse(BaseModel):
    arn: str
    emi: float
    total_interest: float
    total_payable: float


class PolicyOverrideRequest(BaseModel):
    override_category: str
    justification: str = Field(min_length=50)
    decision: Literal["approve", "reject"]


class UnderwriterDecisionStep(BaseModel):
    name: str
    status: Literal["passed", "failed", "pending"]


class UnderwriterDecisionEngineResponse(BaseModel):
    arn: str
    decision: Literal["AUTO_APPROVE", "MANUAL_REVIEW", "AUTO_REJECT"]
    steps: list[UnderwriterDecisionStep]


class UnderwriterDecisionSubmitRequest(BaseModel):
    decision: Literal["approve", "reject", "manual_review"]
    reason: str | None = None


class ClarificationRequest(BaseModel):
    message: str = Field(min_length=5)


class AdditionalDocumentRequest(BaseModel):
    required_documents: list[str] = Field(min_length=1)
    message: str | None = None


class ComplianceActionRequest(BaseModel):
    reason: str


class AuditLogItem(BaseModel):
    timestamp: datetime
    user: str
    action: str
    resource: str
    details: str
    risk: Literal["Low", "Medium", "High"]


class RegulatoryReport(BaseModel):
    id: str
    name: str
    report_type: str
    due_date: str
    status: Literal["Pending", "In Progress", "Submitted"]
    completeness: int = Field(ge=0, le=100)


class GenerateReportRequest(BaseModel):
    name: str
    report_type: str
    reporting_period: str