from typing import Any

from pydantic import BaseModel, Field


class TrainLoanAppraisalRequest(BaseModel):
    dataset_dir: str = Field(default="dataset/synthetic_users")
    rules_path: str = Field(default="dataset/behavioral_rules_realistic.yaml")
    model_out: str = Field(default="loan_appraisal_model/loan_appraisal_trained_model.pkl")
    metrics_out: str = Field(default="loan_appraisal_model/loan_appraisal_training_metrics.json")


class TrainLoanAppraisalResponse(BaseModel):
    message: str
    model_path: str
    metrics_path: str
    elapsed_seconds: float
    metrics: dict[str, Any]


class PredictLoanAppraisalRequest(BaseModel):
    model_path: str = Field(default="loan_appraisal_model/loan_appraisal_trained_model.pkl")
    transactions_csv: str
    rules_path: str = Field(default="dataset/behavioral_rules_realistic.yaml")


class PredictLoanAppraisalResponse(BaseModel):
    result: dict[str, Any]


class AnalyzeStatementResponse(BaseModel):
    loan_type: str
    loan_amount: float | None = None
    source_file: str
    detected_format: str
    rows_analyzed: int
    analysis_period: dict[str, str]
    rules_path: str
    model_used: str | None = None
    result: dict[str, Any]
