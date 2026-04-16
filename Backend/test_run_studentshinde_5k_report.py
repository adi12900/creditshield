from pathlib import Path
import sys

from app.services.loan_appraisal_service import loan_appraisal_service

csv_path = Path("/media/ideabliss/data/creditshield/dataset/synthetic_users/studentshinde.csv")
loan_type = "personal"
loan_amount = 5000.0
use_bedrock = "--use-bedrock" in sys.argv

analysis = loan_appraisal_service.analyze_uploaded_statement(
    loan_type,
    loan_amount,
    csv_path.name,
    csv_path.read_bytes(),
    "dataset/behavioral_rules.yaml",
    "loan_appraisal_model/loan_appraisal_trained_model.pkl",
    use_bedrock,
)

report = loan_appraisal_service.generate_professional_report(analysis, output_format="text")
out_path = Path("reports/studentshinde_personal_5000_4page_report.txt")
out_path.parent.mkdir(parents=True, exist_ok=True)
out_path.write_text(report, encoding="utf-8")

result = analysis.get("result", {})
professional = result.get("professional_appraisal", {})
cashflow = result.get("cashflow_analysis", {})
income = professional.get("income_diagnostics", {})
loan_amt = professional.get("loan_amount_analysis", {})

print("REPORT_PATH", out_path.resolve())
print("ROWS_ANALYZED", analysis.get("rows_analyzed"))
print("RISK_LEVEL", result.get("risk_level"))
print("RECOMMENDATION", result.get("recommendation"))
print("CONFIDENCE", result.get("confidence_score"))
print("FINAL_SCORE", result.get("final_score"))
print("TOTAL_INFLOW", cashflow.get("total_inflow"))
print("TOTAL_OUTFLOW", cashflow.get("total_outflow"))
print("NET_SAVINGS_RATIO", cashflow.get("net_savings_ratio"))
print("MONTHLY_INCOME_ESTIMATE", income.get("monthly_income_estimate"))
print("AFFORDABILITY", loan_amt.get("affordability"))
print("USE_BEDROCK", use_bedrock)
