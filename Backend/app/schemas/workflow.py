from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


UserRole = Literal[
    "loan_officer",
    "credit_analyst",
    "underwriter",
    "compliance_officer",
    "field_officer",
]

LoanStage = Literal[
    "Lead",
    "Submitted",
    "Documents Pending",
    "KYC",
    "CREDIT_ANALYST",
    "Underwriting",
    "Offer Sent",
    "Disbursed",
    "Rejected",
    "REJECTED",
]


class LoanApplicationOut(BaseModel):
    arn: str
    borrower_name: str
    borrower_email: str | None = None
    borrower_phone: str | None = None
    loan_amount: float
    loan_type: str
    stage: LoanStage
    risk_grade: Literal["A+", "A", "B", "C"]
    credit_score: int
    kyc_status: Literal["Verified", "Pending"]
    is_cibil_verified: bool = False
    employment_type: Literal["Salaried", "Self Employed", "Business Owner", "Freelancer", "Student", "Unemployed"]
    purpose: str
    created_at: datetime | None = None
    final_score: float | None = None


class DashboardStat(BaseModel):
    key: str
    value: float | int | str


class DashboardResponse(BaseModel):
    role: UserRole
    stats: list[DashboardStat]


FieldVisitStatus = Literal["Pending Visit", "In Progress", "Completed"]
LoanTypeCategory = Literal[
    "Personal Loan",
    "Car Loan",
    "Home Loan",
    "Gold Loan",
    "Education Loan",
    "Business Loan",
]
VerificationSection = Literal["residence", "business", "education", "loan_specific"]


class FieldOfficerCaseItem(BaseModel):
    arn: str
    borrower_name: str
    loan_amount: float
    status: FieldVisitStatus


class FieldOfficerCaseDetail(BaseModel):
    arn: str
    borrower_name: str
    borrower_phone: str | None = None
    borrower_address: str
    loan_amount: float
    loan_type: str
    stage: str
    status: FieldVisitStatus
    map_link: str
    report_submitted: bool = False


class FieldUploadedDocument(BaseModel):
    doc_type: str = Field(min_length=2, max_length=120)
    files: list[str] = Field(min_length=1)


class ResidenceVerification(BaseModel):
    house_type: Literal["Owned", "Rented"]
    address_verified: bool
    staying_since_years: float = Field(ge=0)
    locality_type: Literal["Urban", "Rural", "Semi-Urban"]
    house_condition: Literal["Good", "Average", "Poor"]
    landmark_notes: str = Field(min_length=1, max_length=500)
    neighbor_feedback: str | None = Field(default=None, max_length=1000)


class EmploymentBusinessVerification(BaseModel):
    employment_category: Literal["Salaried", "Self-Employed"]
    business_verified: bool

    company_name: str | None = Field(default=None, max_length=150)
    job_role: str | None = Field(default=None, max_length=100)
    employment_type: Literal["Permanent", "Contract"] | None = None
    years_in_job: float | None = Field(default=None, ge=0)
    office_verified: bool | None = None
    salary_estimated: float | None = Field(default=None, ge=0)

    business_name: str | None = Field(default=None, max_length=150)
    business_type: str | None = Field(default=None, max_length=120)
    shop_office_exists: bool | None = None
    years_in_business: float | None = Field(default=None, ge=0)
    daily_customer_flow: Literal["Low", "Medium", "High"] | None = None
    estimated_monthly_income: float | None = Field(default=None, ge=0)


class FinancialAssessment(BaseModel):
    declared_income: float = Field(ge=0)
    estimated_actual_income: float = Field(ge=0)
    monthly_expenses: float = Field(ge=0)
    existing_loans: bool
    repayment_capacity: Literal["Low", "Medium", "High"]


class EducationDetails(BaseModel):
    highest_qualification: str = Field(min_length=1, max_length=100)
    tenth_percentage: float | None = Field(default=None, ge=0, le=100)
    twelfth_or_diploma_percentage: float | None = Field(default=None, ge=0, le=100)
    graduation_details: str | None = Field(default=None, max_length=200)
    professional_stability_indicator: Literal["Low", "Medium", "High"]


class RiskRemarks(BaseModel):
    risk_level: Literal["Low", "Medium", "High"]
    fraud_suspicion: bool
    final_recommendation: Literal["Recommend Approval", "Recommend Rejection", "Needs Further Review"]
    detailed_remarks: str = Field(min_length=5, max_length=3000)


class FieldVisitReportRequest(BaseModel):
    loan_type: LoanTypeCategory
    residence_verification: ResidenceVerification
    employment_business_verification: EmploymentBusinessVerification
    financial_assessment: FinancialAssessment
    education_details: EducationDetails | None = None
    loan_specific_details: dict[str, Any] = Field(default_factory=dict)
    uploaded_documents: list[FieldUploadedDocument] = Field(default_factory=list)
    risk_remarks: RiskRemarks


class FieldEvidenceItem(BaseModel):
    id: int
    arn: str
    loan_type: str
    verification_section: VerificationSection
    evidence_type: str
    storage_url: str
    access_url: str
    uploaded_by_role: str
    latitude: float | None = None
    longitude: float | None = None
    captured_at: datetime
    created_at: datetime


class FieldEvidenceUploadResponse(BaseModel):
    evidence: FieldEvidenceItem


class FieldEvidenceGroupedResponse(BaseModel):
    arn: str
    loan_type: str
    grouped_evidence: dict[str, dict[str, list[FieldEvidenceItem]]]


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
    email_status: str | None = None
    email_error: str | None = None
    email_to: str | None = None


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