from pathlib import Path

from app.services.loan_appraisal_service import loan_appraisal_service

csv_path = Path("/media/ideabliss/data/creditshield/dataset/synthetic_users/studentshinde.csv")
analysis = loan_appraisal_service.analyze_uploaded_statement(
    "personal",
    5000.0,
    csv_path.name,
    csv_path.read_bytes(),
    "dataset/behavioral_rules.yaml",
    "loan_appraisal_model/loan_appraisal_trained_model.pkl",
    True,
)

result = analysis.get("result", {})
policy = loan_appraisal_service._compute_realistic_underwriting_policy(result, 5000.0)
print("POLICY", policy)
print("RESULT_RISK", result.get("risk_level"))
print("RESULT_REC", result.get("recommendation"))
print("SUMMARY", result.get("summary"))
print("RED_FLAGS", result.get("red_flags"))
print("BEHAV_FLAGS", result.get("behavioral_flags"))
print("CASHFLOW", result.get("cashflow_analysis"))
print("INCOME", result.get("income_analysis"))
