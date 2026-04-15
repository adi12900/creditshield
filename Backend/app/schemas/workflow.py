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
    borrower_email: str | None = None
    borrower_phone: str | None = None
    loan_amount: float
    loan_type: str = "digital_personal_loan"
    stage: LoanStage
    risk_grade: Literal["A+", "A", "B", "C"]
    credit_score: int
    kyc_status: Literal["Verified", "Pending"]
    employment_type: Literal[
        "Salaried",
        "Self Employed",
        "Business Owner",
        "Freelancer",
        "Student",
        "Unemployed",
    ]
    purpose: str
    created_at: datetime | None = None
    updated_at: datetime | None = None


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


class IntakeSubmitRequest(BaseModel):
    file_complete: bool = Field(
        ...,
        description="Loan officer confirms that applicant file is complete and ready for credit analyst review",
    )


class SystemAdminMetric(BaseModel):
    key: str
    label: str
    value: int | float | str
    subtitle: str | None = None


class SystemIntegrationHealth(BaseModel):
    name: str
    status: Literal["Healthy", "Degraded", "Down"]
    latency_ms: int = Field(ge=0)


class SystemRoleActivity(BaseModel):
    role: str
    active_users: int = Field(ge=0)
    total_users: int = Field(ge=0)


class SystemEventItem(BaseModel):
    timestamp: datetime
    event: str
    user: str


class SystemAdminDashboardResponse(BaseModel):
    metrics: list[SystemAdminMetric]
    integrations: list[SystemIntegrationHealth]
    role_activity: list[SystemRoleActivity]
    recent_events: list[SystemEventItem]


class WorkflowStageItem(BaseModel):
    id: int
    name: str
    assigned_role: str
    avg_duration_minutes: int = Field(ge=0)
    status: Literal["Active", "Inactive"]


class WorkflowConditionItem(BaseModel):
    id: str
    condition: str
    outcome: str


class WorkflowDesignerResponse(BaseModel):
    metrics: list[SystemAdminMetric]
    workflow_name: str
    stages: list[WorkflowStageItem]
    conditions: list[WorkflowConditionItem]


class RuleEngineRuleItem(BaseModel):
    id: int
    name: str
    category: str
    condition: str
    action: str
    severity: Literal["High", "Medium", "Low"]
    status: Literal["Active", "Inactive"]
    last_modified: str


class RuleEngineResponse(BaseModel):
    metrics: list[SystemAdminMetric]
    rules: list[RuleEngineRuleItem]


class LoanOfficerChecklistItem(BaseModel):
    id: str
    item: str
    done: bool


class CommunicationTemplateItem(BaseModel):
    id: str
    name: str
    category: str
    channel: Literal["email", "sms", "call"]
    subject: str
    body: str


class LoanOfficerApplicationSummary(BaseModel):
    arn: str
    application_status: str
    active_stage: str
    processing_time_days: float
    documents_verified: int
    documents_total: int
    communications_total: int
    email_count: int
    sms_count: int
    call_count: int
    risk_score: int
    risk_confidence_percent: int
    timeline: list[dict[str, str | bool]]