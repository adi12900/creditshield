from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import PlainTextResponse

from app.schemas.loan_appraisal import (
    AnalyzeStatementResponse,
    PredictLoanAppraisalRequest,
    PredictLoanAppraisalResponse,
    TrainLoanAppraisalRequest,
    TrainLoanAppraisalResponse,
)
from app.services.loan_appraisal_service import LoanAppraisalServiceError, loan_appraisal_service

router = APIRouter(tags=["loan-appraisal"])


@router.post("/train", response_model=TrainLoanAppraisalResponse)
async def train_loan_appraisal(payload: TrainLoanAppraisalRequest) -> TrainLoanAppraisalResponse:
    try:
        response = await run_in_threadpool(
            loan_appraisal_service.train,
            payload.dataset_dir,
            payload.rules_path,
            payload.model_out,
            payload.metrics_out,
        )
        return TrainLoanAppraisalResponse(**response)
    except LoanAppraisalServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@router.post("/predict", response_model=PredictLoanAppraisalResponse)
async def predict_loan_appraisal(payload: PredictLoanAppraisalRequest) -> PredictLoanAppraisalResponse:
    try:
        response = await run_in_threadpool(
            loan_appraisal_service.predict,
            payload.model_path,
            payload.transactions_csv,
            payload.rules_path,
        )
        return PredictLoanAppraisalResponse(**response)
    except LoanAppraisalServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@router.post("/analyze-statement", response_model=AnalyzeStatementResponse)
async def analyze_statement(
    loan_type: str = Form(..., description="Loan type, e.g. personal/home/business/education"),
    loan_amount: float | None = Form(None, description="Requested loan amount for affordability analysis"),
    statement: UploadFile = File(..., description="Bank statement in CSV or PDF format"),
    rules_path: str = Form("dataset/behavioral_rules_realistic.yaml"),
    model_path: str = Form("loan_appraisal_model/loan_appraisal_trained_model.pkl"),
    use_bedrock: bool = Form(True, description="Enable Bedrock-powered professional underwriting narrative"),
) -> AnalyzeStatementResponse:
    try:
        payload_bytes = await statement.read()
        response = await run_in_threadpool(
            loan_appraisal_service.analyze_uploaded_statement,
            loan_type,
            loan_amount,
            statement.filename or "statement.csv",
            payload_bytes,
            rules_path,
            model_path,
            use_bedrock,
        )
        return AnalyzeStatementResponse(**response)
    except LoanAppraisalServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@router.post("/professional-report", response_class=PlainTextResponse)
async def generate_professional_report(
    loan_type: str = Form(..., description="Loan type, e.g. personal/home/business/education"),
    loan_amount: float | None = Form(None, description="Requested loan amount for affordability analysis"),
    statement: UploadFile = File(..., description="Bank statement in CSV or PDF format"),
    rules_path: str = Form("dataset/behavioral_rules_realistic.yaml"),
    model_path: str = Form("loan_appraisal_model/loan_appraisal_trained_model.pkl"),
    use_bedrock: bool = Form(True, description="Enable Bedrock-powered professional underwriting narrative"),
    output_format: str = Form("text", description="Output format: 'text' or 'html'"),
) -> str:
    """
    Generate and return a professional 4-page loan appraisal report.

    This endpoint:
    1. Analyzes the uploaded bank statement
    2. Generates a comprehensive underwriting report
    3. Returns formatted text suitable for formal documentation

    Returns:
    - 4-page professional report with:
      - PAGE 1: Executive Summary & Credit Decision
      - PAGE 2: Income & Cashflow Analysis
      - PAGE 3: Expense, Liability & Behavioral Analysis
      - PAGE 4: Transaction Insights & Recommendations
    """
    try:
        payload_bytes = await statement.read()

        # First, analyze the statement
        analysis_result = await run_in_threadpool(
            loan_appraisal_service.analyze_uploaded_statement,
            loan_type,
            loan_amount,
            statement.filename or "statement.csv",
            payload_bytes,
            rules_path,
            model_path,
            use_bedrock,
        )

        # Then, generate the professional report
        report = await run_in_threadpool(
            loan_appraisal_service.generate_professional_report,
            analysis_result,
            output_format,
        )

        if output_format == "html":
            from fastapi.responses import HTMLResponse
            return HTMLResponse(content=report)
        else:
            return report

    except LoanAppraisalServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(exc)}") from exc
