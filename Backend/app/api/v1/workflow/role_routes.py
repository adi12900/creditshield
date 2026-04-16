from collections.abc import Callable

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import AuthenticatedUser, require_auth_roles
from app.models.loan_application import LoanApplication
from app.models.loan_appraisal_record import LoanAppraisalRecord
from app.schemas.workflow import (
    AdditionalDocumentRequest,
    AuditLogItem,
    ClarificationRequest,
    CommunicationMessageRequest,
    ComplianceActionRequest,
    CreditMemoDraftRequest,
    DashboardResponse,
    DocumentItem,
    DocumentReviewRequest,
    FieldOfficerCaseDetail,
    FieldOfficerCaseItem,
    FieldVisitReportRequest,
    GenerateReportRequest,
    LoanApplicationOut,
    LoanOfferResponse,
    LoanStructuringRequest,
    PolicyOverrideRequest,
    RatioRecalculateRequest,
    RatioRecalculateResponse,
    RegulatoryReport,
    UnderwriterDecisionEngineResponse,
    UnderwriterDecisionSubmitRequest,
)
from app.services.s3 import extract_object_key_from_url, generate_presigned_url
from app.services.document_ai_verification_service import run_document_verification_task, schedule_reverification_for_arn
from app.services.workflow_service import WorkflowServiceError, workflow_service

router = APIRouter(prefix="/workflow", tags=["workflow-role-apis"])


def _to_http_exception(exc: WorkflowServiceError) -> HTTPException:
    return HTTPException(status_code=exc.status_code, detail=str(exc))


def require_roles(allowed_roles: set[str]) -> Callable:
    return require_auth_roles(allowed_roles)


@router.get("/applications", response_model=list[LoanApplicationOut])
def list_applications(
    stage: str | None = Query(default=None),
    current_user=Depends(require_auth_roles({"system_admin", "loan_officer", "credit_analyst", "underwriter", "compliance_officer"})),
) -> list[LoanApplicationOut]:
    require_submitted_memo = current_user.role == "underwriter"
    return [LoanApplicationOut(**item) for item in workflow_service.list_applications(stage=stage, require_submitted_memo=require_submitted_memo)]


@router.get("/applications/{arn}", response_model=LoanApplicationOut)
def get_application(
    arn: str,
    current_user=Depends(require_auth_roles({"system_admin", "loan_officer", "credit_analyst", "underwriter", "compliance_officer"})),
    db: Session = Depends(get_db),
) -> LoanApplicationOut:
    try:
        if current_user.role == "underwriter" and not workflow_service.has_submitted_credit_memo(arn, db=db):
            raise HTTPException(status_code=403, detail="Application is not yet submitted via credit memo")
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
def loan_officer_documents(
    arn: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> list[DocumentItem]:
    try:
        schedule_reverification_for_arn(
            arn=arn,
            db=db,
            schedule_fn=lambda doc_id, force: background_tasks.add_task(run_document_verification_task, doc_id, force),
        )
        docs = workflow_service.get_documents(arn, db=db)
        return [DocumentItem(
            id=d["id"],
            type=d["type"],
            status=d["status"],
            confidence=d.get("confidence") or 0,
            agent_verdict=d.get("agent_verdict"),
            storage_url=d.get("storage_url"),
            uploaded_at=d.get("uploaded_at"),
        ) for d in docs]
    except WorkflowServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.post(
    "/loan-officer/documents/{arn}/review",
    dependencies=[Depends(require_roles({"loan_officer"}))],
)
def loan_officer_review_document(arn: str, payload: DocumentReviewRequest, db: Session = Depends(get_db)) -> dict:
    try:
        return workflow_service.review_document(arn, payload.document_id, payload.decision, payload.reason, db=db)
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
def loan_officer_send_communication(arn: str, payload: CommunicationMessageRequest, db: Session = Depends(get_db)) -> dict:
    """
    Send communication to borrower with document upload link.
    
    Enhanced to generate secure upload tokens and send actual emails/SMS.
    """
    try:
        return workflow_service.send_communication(
            arn=arn,
            channel=payload.channel,
            subject=payload.subject,
            message=payload.message,
            db=db  # Pass database session for token storage and email/SMS sending
        )
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
)
def credit_analyst_ai_score(
    arn: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_auth_roles({"credit_analyst", "underwriter"})),
) -> dict:
    try:
        if current_user.role == "underwriter" and not workflow_service.has_submitted_credit_memo(arn, db=db):
            raise HTTPException(status_code=403, detail="Application is not yet submitted via credit memo")
        app = workflow_service.get_application(arn)
        composite = app["credit_score"]
        application_row = db.query(LoanApplication).filter(LoanApplication.arn == arn).first()
        actual_appraisal: dict[str, object] | None = None
        reasons = ["RC-001", "RC-014"]

        if application_row:
            record = (
                db.query(LoanAppraisalRecord)
                .filter(LoanAppraisalRecord.application_id == application_row.id)
                .filter(LoanAppraisalRecord.status == "success")
                .order_by(LoanAppraisalRecord.updated_at.desc(), LoanAppraisalRecord.id.desc())
                .first()
            )
            if record:
                metrics = record.kpi_metrics or {}
                income_metrics = metrics.get("income_analysis") if isinstance(metrics.get("income_analysis"), dict) else {}
                cashflow_metrics = metrics.get("cashflow_analysis") if isinstance(metrics.get("cashflow_analysis"), dict) else {}
                liability_metrics = metrics.get("liability_analysis") if isinstance(metrics.get("liability_analysis"), dict) else {}
                loan_metrics = metrics.get("loan_analysis") if isinstance(metrics.get("loan_analysis"), dict) else {}
                behavior_metrics = metrics.get("behavioral_risk") if isinstance(metrics.get("behavioral_risk"), dict) else {}
                borrower_kpis = metrics.get("borrower_kpis") if isinstance(metrics.get("borrower_kpis"), dict) else {}
                co_applicant_kpis = metrics.get("co_applicant_kpis") if isinstance(metrics.get("co_applicant_kpis"), dict) else {}
                borrower_salary = metrics.get("salary_diagnostics") if isinstance(metrics.get("salary_diagnostics"), dict) else {}
                co_applicant_salary = metrics.get("co_applicant_salary_diagnostics") if isinstance(metrics.get("co_applicant_salary_diagnostics"), dict) else {}
                if isinstance(record.salary_diagnostics, dict):
                    borrower_salary = record.salary_diagnostics.get("borrower") if isinstance(record.salary_diagnostics.get("borrower"), dict) else borrower_salary
                    co_applicant_salary = record.salary_diagnostics.get("co_applicant") if isinstance(record.salary_diagnostics.get("co_applicant"), dict) else co_applicant_salary

                monthly_balance_table = metrics.get("monthly_balance_table") if isinstance(metrics.get("monthly_balance_table"), list) else []
                month_count = len(monthly_balance_table)
                if month_count <= 0:
                    try:
                        month_count = int((metrics.get("analysis_period") or {}).get("month_count", 0) or 0)
                    except (TypeError, ValueError):
                        month_count = 0

                actual_appraisal = {
                    "available": True,
                    "final_score": float(record.final_score) if record.final_score is not None else None,
                    "risk_level": record.risk_level,
                    "recommendation": record.recommendation,
                    "confidence_score": float(record.confidence_score) if record.confidence_score is not None else None,
                    "rows_analyzed": record.rows_analyzed,
                    "analysis_period": metrics.get("analysis_period", {}),
                    "monthly_balance_table": monthly_balance_table,
                    "opening_outstanding_before_first_month": (monthly_balance_table[0].get("opening_balance") if monthly_balance_table and isinstance(monthly_balance_table[0], dict) else None),
                    "income_analysis": income_metrics,
                    "cashflow_analysis": cashflow_metrics,
                    "liability_analysis": liability_metrics,
                    "loan_analysis": loan_metrics,
                    "behavioral_risk": behavior_metrics,
                    "kpi_metrics": metrics,
                    "borrower_kpis": borrower_kpis,
                    "co_applicant_kpis": co_applicant_kpis,
                    "borrower_salary_diagnostics": borrower_salary,
                    "co_applicant_salary_diagnostics": co_applicant_salary,
                    "salary_diagnostics": record.salary_diagnostics or {
                        "salary_months_detected": income_metrics.get("salary_months_detected"),
                        "salary_variance_ratio": income_metrics.get("salary_variance_ratio"),
                        "salary_trend_pct": income_metrics.get("salary_trend_pct"),
                        "salary_delay_std_days": income_metrics.get("salary_delay_std_days"),
                        "employer_switch_count": income_metrics.get("employer_switch_count"),
                        "employers_detected": income_metrics.get("employers_detected"),
                        "salary_reduction_signal": income_metrics.get("salary_reduction_signal"),
                        "salary_delay_signal": income_metrics.get("salary_delay_signal"),
                        "company_switch_signal": income_metrics.get("company_switch_signal"),
                    },
                    "rulebook_top_insights": metrics.get("rulebook_top_insights", []),
                    "report_pdf_access_url": (
                        generate_presigned_url(
                            extract_object_key_from_url(record.report_pdf_storage_url),
                            response_disposition="inline",
                        )
                        if record.report_pdf_storage_url
                        else None
                    ),
                    "report_pdf_download_url": (
                        generate_presigned_url(
                            extract_object_key_from_url(record.report_pdf_storage_url),
                            response_disposition="attachment",
                        )
                        if record.report_pdf_storage_url
                        else None
                    ),
                    "report_text": record.report_text,
                    "month_count": month_count,
                }

                reasons = [str(item) for item in (metrics.get("rulebook_top_insights", []) or [])[:4]] or ["RC-POLICY-CLEAR"]

        return {
            "arn": arn,
            "composite_score": float(actual_appraisal["final_score"]) if actual_appraisal and actual_appraisal.get("final_score") is not None else composite,
            "confidence_percent": int(float(actual_appraisal["confidence_score"])) if actual_appraisal and actual_appraisal.get("confidence_score") is not None else 92,
            "risk_grade": app["risk_grade"],
            "decision": "AUTO_APPROVE" if app["risk_grade"] in {"A+", "A"} else "MANUAL_REVIEW",
            "model_source": "loan_appraisal_record" if actual_appraisal else "workflow_proxy",
            "appraisal_available": bool(actual_appraisal),
            "actual_appraisal": actual_appraisal,
            "reason_codes": reasons if actual_appraisal else reasons,
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
    response_model=UnderwriterDecisionEngineResponse,
    dependencies=[Depends(require_roles({"underwriter"}))],
)
def underwriter_decision_engine(arn: str) -> UnderwriterDecisionEngineResponse:
    try:
        app = workflow_service.get_application(arn)
        decision = "AUTO_REJECT" if app["risk_grade"] == "C" else "AUTO_APPROVE" if app["risk_grade"] in {"A+", "A"} else "MANUAL_REVIEW"
        return UnderwriterDecisionEngineResponse(
            arn=arn,
            decision=decision,
            steps=[
                {"name": "Hard Filters", "status": "failed" if decision == "AUTO_REJECT" else "passed"},
                {"name": "Policy Rules", "status": "passed"},
                {"name": "Credit Score Evaluation", "status": "passed" if decision == "AUTO_APPROVE" else "pending"},
            ],
        )
    except WorkflowServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.post(
    "/underwriter/decision-engine/{arn}/submit",
    dependencies=[Depends(require_roles({"underwriter"}))],
)
def underwriter_submit_decision(arn: str, payload: UnderwriterDecisionSubmitRequest, db: Session = Depends(get_db)) -> dict:
    try:
        return workflow_service.submit_underwriter_decision(arn, payload.decision, payload.reason, db=db)
    except WorkflowServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.get(
    "/underwriter/case-summary/{arn}",
    dependencies=[Depends(require_roles({"underwriter"}))],
)
def underwriter_case_summary(arn: str, db: Session = Depends(get_db)) -> dict:
    try:
        return workflow_service.underwriter_case_summary(arn, db=db)
    except WorkflowServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.get(
    "/underwriter/decisions/{arn}/history",
    dependencies=[Depends(require_roles({"underwriter"}))],
)
def underwriter_decision_history(arn: str) -> list[dict]:
    try:
        return workflow_service.underwriter_decision_history(arn)
    except WorkflowServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.post(
    "/underwriter/case/{arn}/send-back",
    dependencies=[Depends(require_roles({"underwriter"}))],
)
def underwriter_send_back_for_clarification(arn: str, payload: ClarificationRequest, db: Session = Depends(get_db)) -> dict:
    try:
        return workflow_service.send_back_for_clarification(arn, payload.message, db=db)
    except WorkflowServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.post(
    "/underwriter/case/{arn}/request-documents",
    dependencies=[Depends(require_roles({"underwriter"}))],
)
def underwriter_request_additional_documents(arn: str, payload: AdditionalDocumentRequest, db: Session = Depends(get_db)) -> dict:
    try:
        return workflow_service.request_additional_documents(
            arn,
            required_documents=payload.required_documents,
            message=payload.message,
            db=db,
        )
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


@router.get(
    "/field-officer/dashboard",
    response_model=DashboardResponse,
    dependencies=[Depends(require_roles({"field_officer"}))],
)
def field_officer_dashboard() -> DashboardResponse:
    return DashboardResponse(**workflow_service.role_dashboard("field_officer"))


@router.get(
    "/field-officer/cases",
    response_model=list[FieldOfficerCaseItem],
)
def field_officer_cases(
    status: str | None = Query(default=None),
    search: str | None = Query(default=None),
    current_user: AuthenticatedUser = Depends(require_auth_roles({"field_officer"})),
) -> list[FieldOfficerCaseItem]:
    try:
        rows = workflow_service.list_field_officer_cases(current_user.username, status=status, query=search)
        return [FieldOfficerCaseItem(**row) for row in rows]
    except WorkflowServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.get(
    "/field-officer/cases/{arn}",
    response_model=FieldOfficerCaseDetail,
)
def field_officer_case_detail(
    arn: str,
    current_user: AuthenticatedUser = Depends(require_auth_roles({"field_officer"})),
) -> FieldOfficerCaseDetail:
    try:
        return FieldOfficerCaseDetail(**workflow_service.get_field_officer_case_detail(current_user.username, arn))
    except WorkflowServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.post(
    "/field-officer/cases/{arn}/start-visit",
)
def field_officer_start_visit(
    arn: str,
    current_user: AuthenticatedUser = Depends(require_auth_roles({"field_officer"})),
) -> dict:
    try:
        return workflow_service.start_field_visit(current_user.username, arn)
    except WorkflowServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.post(
    "/field-officer/cases/{arn}/submit-report",
)
def field_officer_submit_report(
    arn: str,
    payload: FieldVisitReportRequest,
    current_user: AuthenticatedUser = Depends(require_auth_roles({"field_officer"})),
) -> dict:
    try:
        return workflow_service.submit_field_visit_report(current_user.username, arn, payload.model_dump())
    except WorkflowServiceError as exc:
        raise _to_http_exception(exc) from exc