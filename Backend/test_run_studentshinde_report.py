from pathlib import Path

from app.services.loan_appraisal_service import loan_appraisal_service

csv_path = Path("/media/ideabliss/data/creditshield/dataset/synthetic_users/studentshinde.csv")
loan_type = "personal"
loan_amount = 50000.0

payload = csv_path.read_bytes()
analysis = loan_appraisal_service.analyze_uploaded_statement(
    loan_type,
    loan_amount,
    csv_path.name,
    payload,
    "dataset/behavioral_rules.yaml",
    "loan_appraisal_model/loan_appraisal_trained_model.pkl",
    True,
)

report = loan_appraisal_service.generate_professional_report(analysis, output_format="text")
out_path = Path("reports/studentshinde_personal_50000_4page_report.txt")
out_path.parent.mkdir(parents=True, exist_ok=True)
out_path.write_text(report, encoding="utf-8")

summary = analysis.get("result", {}).get("validated_appraisal", {}).get("summary", {})
diagnostics = analysis.get("result", {}).get("validated_appraisal", {}).get("diagnostics", {})
loan_analysis = analysis.get("result", {}).get("professional_appraisal", {}).get("loan_amount_analysis", {})

print("REPORT_PATH", out_path.resolve())
print("ROWS_ANALYZED", analysis.get("rows_analyzed"))
print("RISK_LEVEL", summary.get("risk_level"))
print("RECOMMENDATION", summary.get("recommendation"))
print("CONFIDENCE", analysis.get("result", {}).get("professional_appraisal", {}).get("confidence_score"))
print("FINAL_SCORE", summary.get("final_score"))
print("MONTHLY_INCOME", summary.get("monthly_income"))
print("MONTHLY_EXPENSES", summary.get("monthly_expenses"))
print("TOTAL_INFLOW", summary.get("total_inflow"))
print("TOTAL_OUTFLOW", summary.get("total_outflow"))
print("SAVINGS_RATIO", summary.get("net_savings_ratio"))
print("LOW_BALANCE_DAYS", diagnostics.get("low_balance_days"))
print("AFFORDABILITY", loan_analysis.get("classification"))
