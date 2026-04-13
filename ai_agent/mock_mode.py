"""
Deterministic mock LLM and narrative responses for demo without AWS credentials.
"""

MOCK_RESPONSES: dict[str, str] = {
    "analyse": (
        "FINAL ANSWER: Application assessment complete. "
        "Composite IVL aligns with policy; cite IS-01, CF-03 where relevant. "
        "No fabricated fields — values taken from tools only."
    ),
    "explain_rejection": (
        "FINAL ANSWER:\n"
        "Decision:\n"
        "REJECT\n\n"
        "Primary Reason:\n"
        "- HR-01 (FOIR breach): triggered 71% vs maximum 65% for unsecured personal loan; see "
        "get_rule_violations regulation_ref and rules/loan_rules.txt or hard_rules.txt chunks.\n"
        "- HR-06 (bureau floor): CIBIL 531 vs minimum 550 for unsecured personal per policy corpus.\n"
        "- HR-05 (loan stacking): 4 new facilities in 90 days vs maximum 3; see fraud_rules.txt / hard_rules.\n\n"
        "Additional Risks:\n"
        "- get_fraud_analysis: high-severity loan_stacking (SIG-STACK-01) aligns with HR-05.\n"
        "- Income and IVL snapshot in get_income_summary supports weak composite (~18).\n\n"
        "Final Summary:\n"
        "Decline is driven by affordability (FOIR), bureau minimum, and concurrent exposure rules; "
        "borrower should reduce obligations, improve bureau, and wait before reapplying."
    ),
    "fraud_check": (
        "FINAL ANSWER: Fraud tool output reviewed. "
        "Overall risk band and document integrity flags are as returned by get_fraud_analysis; "
        "no additional signals invented."
    ),
    "improvement_tips": (
        "FINAL ANSWER: Use get_improvement_tips output: prioritise FOIR reduction, "
        "stabilise income evidence (SR-02 if self-employed), and address any soft fraud triggers (SR-03)."
    ),
    "income_summary": (
        "FINAL ANSWER: Income verification narrative based on get_income_summary: "
        "category weights IS 28%, CF 22%, EP 15%, ST 18%, FD 10%, LB 4%, DF 3%; "
        "reference worst parameters by ID from the tool."
    ),
    "default": (
        "FINAL ANSWER: Analysis complete using tool observations only. "
        "Refer to parameter IDs (IS-xx, CF-xx, …) and rules (HR-xx, SR-xx) from tool results."
    ),
}

# Borrower-facing mock narratives (Indian context) for three demo paths
MOCK_SCENARIO_NARRATIVES = {
    "approve": (
        "Rahul Sharma (Mumbai) shows stable salaried income of ₹75,000/month with FOIR ~38% and "
        "strong bureau history (CIBIL 762). Composite risk score ~78 — band APPROVE (66–80). "
        "IVL highlights solid IS and CF categories; no hard rule breaches."
    ),
    "review": (
        "Priya Patel (Ahmedabad) is a freelancer at ₹32,000/month average with variable inflows "
        "(income CV ~34%, SR-01). FOIR ~52%, CIBIL 641. Score ~43 — REVIEW band (36–50). "
        "Soft fraud signals warrant analyst look but no automatic hard reject from mock data."
    ),
    "reject": (
        "Amit Kumar (Delhi) has FOIR ~71% (HR-01), CIBIL 531 vs unsecured minimum (HR-06), "
        "and multiple recent facilities indicating stacking (HR-05). Composite score ~18 — REJECT. "
        "Recommend structured decline with regulatory-safe wording."
    ),
}
