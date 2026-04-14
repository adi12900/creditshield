from pathlib import Path
from pprint import pprint

from app.services.loan_appraisal_service import loan_appraisal_service

csv_path = Path("/media/ideabliss/data/creditshield/dataset/synthetic_users/studentshinde.csv")
payload = csv_path.read_bytes()
analysis = loan_appraisal_service.analyze_uploaded_statement(
    "personal",
    50000.0,
    csv_path.name,
    payload,
    "dataset/behavioral_rules.yaml",
    "loan_appraisal_model/loan_appraisal_trained_model.pkl",
    True,
)

result = analysis.get("result", {})
print("TOP_LEVEL_RESULT_KEYS:", list(result.keys()))

top_summary = result.get("summary", {})
top_income = result.get("income_analysis", {})
top_cashflow = result.get("cashflow_analysis", {})
top_loan = result.get("loan_analysis", {})
print("\nTOP_SUMMARY_KEYS:", list(top_summary.keys()) if isinstance(top_summary, dict) else "N/A")
print("TOP_SUMMARY_SAMPLE:")
pprint(top_summary)
print("\nTOP_INCOME_ANALYSIS_KEYS:", list(top_income.keys()) if isinstance(top_income, dict) else "N/A")
print("TOP_INCOME_ANALYSIS_SAMPLE:")
pprint(top_income)
print("\nTOP_CASHFLOW_ANALYSIS_KEYS:", list(top_cashflow.keys()) if isinstance(top_cashflow, dict) else "N/A")
print("TOP_CASHFLOW_ANALYSIS_SAMPLE:")
pprint(top_cashflow)
print("\nTOP_LOAN_ANALYSIS_KEYS:", list(top_loan.keys()) if isinstance(top_loan, dict) else "N/A")
print("TOP_LOAN_ANALYSIS_SAMPLE:")
pprint(top_loan)

va = result.get("validated_appraisal", {})
print("VALIDATED_APPRAISAL_KEYS:", list(va.keys()))
summary_obj = va.get("summary", {})
diagnostics_obj = va.get("diagnostics", {})
corrected_summary_obj = va.get("corrected_summary", {})

print("VALIDATED_SUMMARY_TYPE:", type(summary_obj).__name__)
print("VALIDATED_SUMMARY_KEYS:", list(summary_obj.keys()) if isinstance(summary_obj, dict) else "N/A")
print("VALIDATED_DIAGNOSTICS_TYPE:", type(diagnostics_obj).__name__)
print("VALIDATED_DIAGNOSTICS_KEYS:", list(diagnostics_obj.keys()) if isinstance(diagnostics_obj, dict) else "N/A")
print("SUMMARY_SAMPLE:")
pprint(summary_obj)

print("\nCORRECTED_SUMMARY_TYPE:", type(corrected_summary_obj).__name__)
print(
    "CORRECTED_SUMMARY_KEYS:",
    list(corrected_summary_obj.keys()) if isinstance(corrected_summary_obj, dict) else "N/A",
)
print("CORRECTED_SUMMARY_SAMPLE:")
pprint(corrected_summary_obj)
print("\nCORRECTED_RULE_EVALUATIONS_TYPE:", type(va.get("corrected_rule_evaluations")).__name__)
print("CORRECTED_RULE_EVALUATIONS_COUNT:", len(va.get("corrected_rule_evaluations", [])))
print("CORRECTED_RULE_EVALUATIONS_FIRST5:")
pprint(va.get("corrected_rule_evaluations", [])[:5])
print("\nTOP_RISK_DRIVERS:")
pprint(va.get("top_risk_drivers", []))

pa = result.get("professional_appraisal", {})
print("\nPROFESSIONAL_APPRAISAL_KEYS:", list(pa.keys()))
print("\nINCOME_DIAGNOSTICS_TYPE:", type(pa.get("income_diagnostics")).__name__)
print("INCOME_DIAGNOSTICS_VALUE:")
pprint(pa.get("income_diagnostics"))

print("\nCASHFLOW_DIAGNOSTICS_TYPE:", type(pa.get("cashflow_diagnostics")).__name__)
print("CASHFLOW_DIAGNOSTICS_VALUE:")
pprint(pa.get("cashflow_diagnostics"))

print("\nLIABILITY_DIAGNOSTICS_TYPE:", type(pa.get("liability_diagnostics")).__name__)
print("LIABILITY_DIAGNOSTICS_VALUE:")
pprint(pa.get("liability_diagnostics"))

print("\nLOAN_AMOUNT_ANALYSIS_TYPE:", type(pa.get("loan_amount_analysis")).__name__)
print("LOAN_AMOUNT_ANALYSIS_VALUE:")
pprint(pa.get("loan_amount_analysis"))

print("\nRULEBOOK_INSIGHTS_TYPE:", type(pa.get("rulebook_insights")).__name__)
print("RULEBOOK_INSIGHTS_VALUE:")
pprint(pa.get("rulebook_insights"))

print("\nNOTABLE_TRANSACTIONS_TYPE:", type(pa.get("notable_transactions")).__name__)
print("NOTABLE_TRANSACTIONS_COUNT:", len(pa.get("notable_transactions", [])))
