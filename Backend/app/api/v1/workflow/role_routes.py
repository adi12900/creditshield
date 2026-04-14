from collections.abc import Callable

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.security import require_auth_roles
from app.schemas.workflow import (
    AuditLogItem,
    CommunicationMessageRequest,
    ComplianceActionRequest,
    CreditMemoDraftRequest,
    DashboardResponse,
    DocumentItem,
    DocumentReviewRequest,
    GenerateReportRequest,
    LoanApplicationOut,
    LoanOfferResponse,
    LoanStructuringRequest,
    PolicyOverrideRequest,
    RatioRecalculateRequest,
    RatioRecalculateResponse,
    RegulatoryReport,
)
from app.services.workflow_service import WorkflowServiceError, workflow_service

router = APIRouter(prefix="/workflow", tags=["workflow-role-apis"])


def _to_http_exception(exc: WorkflowServiceError) -> HTTPException:
    return HTTPException(status_code=exc.status_code, detail=str(exc))


def require_roles(allowed_roles: set[str]) -> Callable:
    return require_auth_roles(allowed_roles)


@router.get("/applications", response_model=list[LoanApplicationOut])
def list_applications(
    stage: str | None = Query(default=None),
    _user=Depends(require_auth_roles({"system_admin", "loan_officer", "credit_analyst", "underwriter", "compliance_officer"})),
) -> list[LoanApplicationOut]:
    return [LoanApplicationOut(**item) for item in workflow_service.list_applications(stage=stage)]


@router.get("/applications/{arn}", response_model=LoanApplicationOut)
def get_application(
    arn: str,
    _user=Depends(require_auth_roles({"system_admin", "loan_officer", "credit_analyst", "underwriter", "compliance_officer"})),
) -> LoanApplicationOut:
    try:
        return LoanApplicationOut(**workflow_service.get_application(arn))
    except WorkflowServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.get(
    "/loan-officer/dashboard",
    response_model=DashboardResponse,
    dependencies=[Depends(require_roles({"loan_officer"}))],
)
def loan_officer_dashboard() -> DashboardResponse:
    return DashboardResponse(**workflow_service.role_dashboard("loan_officer"))


@router.get(
    "/loan-officer/documents/{arn}",
    response_model=list[DocumentItem],
    dependencies=[Depends(require_roles({"loan_officer"}))],
)
def loan_officer_documents(arn: str) -> list[DocumentItem]:
    try:
        return [DocumentItem(**item) for item in workflow_service.get_documents(arn)]
    except WorkflowServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.post(
    "/loan-officer/documents/{arn}/review",
    dependencies=[Depends(require_roles({"loan_officer"}))],
)
def loan_officer_review_document(arn: str, payload: DocumentReviewRequest) -> dict:
    try:
        return workflow_service.review_document(arn, payload.document_id, payload.decision, payload.reason)
    except WorkflowServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.get(
    "/loan-officer/communications/{arn}",
    dependencies=[Depends(require_roles({"loan_officer"}))],
)
def loan_officer_get_communications(arn: str) -> list[dict]:
    try:
        return workflow_service.get_communications(arn)
    except WorkflowServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.post(
    "/loan-officer/communications/{arn}/send",
    dependencies=[Depends(require_roles({"loan_officer"}))],
)
def loan_officer_send_communication(arn: str, payload: CommunicationMessageRequest) -> dict:
    try:
        return workflow_service.send_communication(arn, payload.channel, payload.subject, payload.message)
    except WorkflowServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.post(
    "/loan-officer/leads/{arn}/move-to-intake",
    dependencies=[Depends(require_roles({"loan_officer"}))],
)
def loan_officer_move_to_intake(arn: str) -> LoanApplicationOut:
    try:
        updated = workflow_service.move_stage(arn, "Submitted", "Lead moved to intake", "Loan Officer")
        return LoanApplicationOut(**updated)
    except WorkflowServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.post(
    "/loan-officer/intake/{arn}/submit",
    dependencies=[Depends(require_roles({"loan_officer"}))],
)
def loan_officer_submit_intake(arn: str) -> LoanApplicationOut:
    try:
        updated = workflow_service.move_stage(arn, "Documents Pending", "Intake submitted", "Loan Officer")
        return LoanApplicationOut(**updated)
    except WorkflowServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.post(
    "/loan-officer/esign/{arn}/send-link",
    dependencies=[Depends(require_roles({"loan_officer"}))],
)
def loan_officer_send_esign(arn: str) -> dict:
    try:
        workflow_service.get_application(arn)
        workflow_service.add_audit_log(
            user="Loan Officer",
            action="E-sign Link Sent",
            resource=arn,
            details="Borrower notified for agreement execution",
            risk="Low",
        )
        return {"arn": arn, "status": "esign_link_sent"}
    except WorkflowServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.get(
    "/credit-analyst/dashboard",
    response_model=DashboardResponse,
    dependencies=[Depends(require_roles({"credit_analyst"}))],
)
def credit_analyst_dashboard() -> DashboardResponse:
    return DashboardResponse(**workflow_service.role_dashboard("credit_analyst"))


@router.get(
    "/credit-analyst/bureau/{arn}",
    dependencies=[Depends(require_roles({"credit_analyst"}))],
)
def credit_analyst_bureau_report(arn: str) -> dict:
    try:
        app = workflow_service.get_application(arn)
        return {
            "arn": arn,
            "credit_score": app["credit_score"],
            "tradelines": [
                {"lender": "HDFC Credit Card", "type": "Credit Card", "limit": 500000, "balance": 125000, "status": "Active", "dpd": 0},
                {"lender": "SBI Home Loan", "type": "Home Loan", "limit": 5000000, "balance": 3500000, "status": "Active", "dpd": 0},
            ],
            "score_trend": [
                {"month": "Oct", "score": app["credit_score"] - 40},
                {"month": "Nov", "score": app["credit_score"] - 20},
                {"month": "Dec", "score": app["credit_score"] - 5},
                {"month": "Jan", "score": app["credit_score"]},
            ],
        }
    except WorkflowServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.post(
    "/credit-analyst/ratios/{arn}/recalculate",
    response_model=RatioRecalculateResponse,
    dependencies=[Depends(require_roles({"credit_analyst"}))],
)
def credit_analyst_recalculate_ratios(arn: str, payload: RatioRecalculateRequest) -> RatioRecalculateResponse:
    try:
        workflow_service.get_application(arn)
        return RatioRecalculateResponse(
            **workflow_service.recalculate_ratios(
                payload.monthly_income,
                payload.existing_obligations,
                payload.proposed_emi,
                payload.loan_amount,
                payload.asset_value,
            )
        )
    except WorkflowServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.get(
    "/credit-analyst/ai-score/{arn}",
    dependencies=[Depends(require_roles({"credit_analyst"}))],
)
def credit_analyst_ai_score(arn: str) -> dict:
    try:
        app = workflow_service.get_application(arn)
        composite = app["credit_score"]
        return {
            "arn": arn,
            "composite_score": composite,
            "confidence_percent": 92,
            "risk_grade": app["risk_grade"],
            "decision": "AUTO_APPROVE" if app["risk_grade"] in {"A+", "A"} else "MANUAL_REVIEW",
            "reason_codes": ["RC-001", "RC-014"],
        }
    except WorkflowServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.post(
    "/credit-analyst/memo/{arn}/draft",
    dependencies=[Depends(require_roles({"credit_analyst"}))],
)
def credit_analyst_save_draft(arn: str, payload: CreditMemoDraftRequest) -> dict:
    try:
        return workflow_service.save_credit_memo(arn, payload.model_dump(), submitted=False)
    except WorkflowServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.post(
    "/credit-analyst/memo/{arn}/submit",
    dependencies=[Depends(require_roles({"credit_analyst"}))],
)
def credit_analyst_submit_memo(arn: str, payload: CreditMemoDraftRequest) -> dict:
    try:
        return workflow_service.save_credit_memo(arn, payload.model_dump(), submitted=True)
    except WorkflowServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.get(
    "/underwriter/dashboard",
    response_model=DashboardResponse,
    dependencies=[Depends(require_roles({"underwriter"}))],
)
def underwriter_dashboard() -> DashboardResponse:
    return DashboardResponse(**workflow_service.role_dashboard("underwriter"))


@router.get(
    "/underwriter/decision-engine/{arn}",
    dependencies=[Depends(require_roles({"underwriter"}))],
)
def underwriter_decision_engine(arn: str) -> dict:
    try:
        app = workflow_service.get_application(arn)
        decision = "AUTO_REJECT" if app["risk_grade"] == "C" else "AUTO_APPROVE" if app["risk_grade"] in {"A+", "A"} else "MANUAL_REVIEW"
        return {
            "arn": arn,
            "decision": decision,
            "steps": [
                {"name": "Hard Filters", "status": "failed" if decision == "AUTO_REJECT" else "passed"},
                {"name": "Policy Rules", "status": "passed"},
                {"name": "Credit Score Evaluation", "status": "passed" if decision == "AUTO_APPROVE" else "pending"},
            ],
        }
    except WorkflowServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.post(
    "/underwriter/loan-structuring/{arn}/offer",
    response_model=LoanOfferResponse,
    dependencies=[Depends(require_roles({"underwriter"}))],
)
def underwriter_generate_offer(arn: str, payload: LoanStructuringRequest) -> LoanOfferResponse:
    try:
        return LoanOfferResponse(**workflow_service.generate_offer(
            arn,
            payload.loan_amount,
            payload.tenure_months,
            payload.interest_rate,
        ))
    except WorkflowServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.post(
    "/underwriter/policy-override/{arn}/submit",
    dependencies=[Depends(require_roles({"underwriter"}))],
)
def underwriter_submit_override(arn: str, payload: PolicyOverrideRequest) -> dict:
    try:
        return workflow_service.submit_policy_override(arn, payload.model_dump())
    except WorkflowServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.get(
    "/compliance/dashboard",
    response_model=DashboardResponse,
    dependencies=[Depends(require_roles({"compliance_officer"}))],
)
def compliance_dashboard() -> DashboardResponse:
    return DashboardResponse(**workflow_service.role_dashboard("compliance_officer"))


@router.get(
    "/compliance/kyc-aml/{arn}",
    dependencies=[Depends(require_roles({"compliance_officer"}))],
)
def compliance_kyc_aml(arn: str) -> dict:
    try:
        return workflow_service.get_kyc_aml(arn)
    except WorkflowServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.post(
    "/compliance/kyc-aml/{arn}/clear-hold",
    dependencies=[Depends(require_roles({"compliance_officer"}))],
)
def compliance_clear_hold(arn: str, payload: ComplianceActionRequest) -> dict:
    try:
        return workflow_service.clear_compliance_hold(arn, payload.reason)
    except WorkflowServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.get(
    "/compliance/fraud-signals/{arn}",
    dependencies=[Depends(require_roles({"compliance_officer"}))],
)
def compliance_fraud_signals(arn: str) -> dict:
    try:
        return workflow_service.get_fraud_signals(arn)
    except WorkflowServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.post(
    "/compliance/fraud-signals/{arn}/false-positive",
    dependencies=[Depends(require_roles({"compliance_officer"}))],
)
def compliance_mark_false_positive(arn: str, payload: ComplianceActionRequest) -> dict:
    try:
        return workflow_service.mark_false_positive(arn, payload.reason)
    except WorkflowServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.get(
    "/compliance/audit-logs",
    response_model=list[AuditLogItem],
    dependencies=[Depends(require_roles({"compliance_officer"}))],
)
def compliance_audit_logs(
    action: str | None = Query(default=None),
    user: str | None = Query(default=None),
    resource: str | None = Query(default=None),
    risk: str | None = Query(default=None),
) -> list[AuditLogItem]:
    return workflow_service.list_audit_logs(action=action, user=user, resource=resource, risk=risk)


@router.get(
    "/compliance/regulatory-reports",
    response_model=list[RegulatoryReport],
    dependencies=[Depends(require_roles({"compliance_officer"}))],
)
def compliance_regulatory_reports() -> list[RegulatoryReport]:
    return workflow_service.list_reports()


@router.post(
    "/compliance/regulatory-reports/generate",
    response_model=RegulatoryReport,
    dependencies=[Depends(require_roles({"compliance_officer"}))],
)
def compliance_generate_report(payload: GenerateReportRequest) -> RegulatoryReport:
    return workflow_service.generate_report(payload.name, payload.report_type, payload.reporting_period)


@router.get(
    "/compliance/rbi-compliance/{arn}",
    dependencies=[Depends(require_roles({"compliance_officer"}))],
)
def compliance_rbi_compliance(arn: str) -> dict:
    try:
        return workflow_service.get_rbi_compliance(arn)
    except WorkflowServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.get(
    "/compliance/rbi-audit-export/{arn}",
    dependencies=[Depends(require_roles({"compliance_officer"}))],
)
def compliance_rbi_audit_export(arn: str) -> dict:
    try:
        return workflow_service.get_rbi_audit_export(arn)
    except WorkflowServiceError as exc:
        raise _to_http_exception(exc) from exc