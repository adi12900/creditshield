"""
All LLM system and user prompt templates — do not scatter prompt strings elsewhere.
"""

from __future__ import annotations

FINAL_ANSWER_FORMAT = """
When you output FINAL ANSWER:, use exactly this structure (headings and order):

Decision:
<APPROVE / REJECT / REVIEW>

Primary Reason:
- Rule ID + explanation (e.g. HR-01, SR-02)
- Include concrete values: FOIR %, CIBIL, loan amount, income, or other metrics from tool data

Additional Risks:
- Bullet points with clear reasons (one risk per line)

Final Summary:
1–2 line conclusion
""".strip()


SYSTEM_PROMPT_ANALYST = (
    "You are CreditShield AI, an expert credit risk analyst for Indian lending. "
    "You analyse loan applications using RBI-compliant income verification. "
    "Always cite specific parameter IDs (IS-01, CF-03, etc.) and rule codes (HR-01, SR-02, etc.) "
    "in your analysis. "
    "The mandatory block includes get_rule_violations (with regulation_ref + source file per rule) and, "
    "when rules fire, search_policy hits—tie your Primary Reason to those snippets and name the source "
    "keys (e.g. rules/loan_rules.txt, hard_rules.txt) when you quote thresholds. "
    "Be precise, factual, and concise. Never fabricate data — only use what tools return. "
    "Respond in the same language the user queries in.\n\n"
    + FINAL_ANSWER_FORMAT
)

SYSTEM_PROMPT_EXPLAINER = (
    "You explain credit decisions to borrowers in simple, empathetic language. "
    "Avoid jargon; give actionable next steps. Never invent numbers — use only provided facts."
)


def format_llama3_instruct_prompt(system: str, user: str) -> str:
    """Exact Llama 3 Instruct template for Amazon Bedrock native invoke (Meta)."""
    return (
        f"<|begin_of_text|><|redacted_start_header_id|>system<|redacted_end_header_id|>\n\n"
        f"{system}<|eot_id|><|redacted_start_header_id|>user<|redacted_end_header_id|>\n\n"
        f"{user}<|eot_id|><|redacted_start_header_id|>assistant<|redacted_end_header_id|>\n\n"
    )


USER_PROMPT_TEMPLATES = {
    "full_analysis": (
        "Borrower context and IVL snapshot:\n{borrower_data}\n\n"
        "IVL scores (structured):\n{ivl_scores}\n\n"
        "Fraud signals:\n{fraud_signals}\n\n"
        "User query:\n{query}\n\n"
        "Use tools if needed. When finished, output FINAL ANSWER: following the required "
        "Decision / Primary Reason / Additional Risks / Final Summary structure from your system instructions."
    ),
    "rejection_explanation": (
        "Borrower name: {borrower_name}\n"
        "Loan type: {loan_type}\n"
        "Violations (hard/soft):\n{violations}\n\n"
        "Explain clearly why the decision is negative and what rules apply (HR/SR codes)."
    ),
    "improvement_tips": (
        "Current scores and threshold gaps:\n{current_scores}\n"
        "{threshold_gaps}\n\n"
        "List concrete, ordered actions the borrower can take."
    ),
    "fraud_assessment": (
        "Fraud signals:\n{fraud_signals}\n"
        "Anomaly score: {anomaly_score}\n\n"
        "Summarise risk posture without speculating beyond signals."
    ),
    "income_narrative": (
        "Income-related IVL parameters:\n{income_params}\n"
        "Loan type: {loan_type}\n\n"
        "Narrate stability, cash flow, and documentation posture using parameter IDs."
    ),
}

BORROWER_DIGEST_USER = (
    "Summarise the decision for the borrower in simple terms.\n"
    "Borrower: {borrower_name}\nLoan type: {loan_type}\n"
    "Decision: {decision}\nKey reasons: {reasons}\n"
    "Language code: {language}\n"
    "If language is hi or mr, respond in that language; keep rule codes (HR-xx, SR-xx) and numbers in English."
)

REACT_TOOL_INSTRUCTION = (
    "You may call tools. To call a tool, respond with exactly one line:\n"
    "TOOL: <tool_name>, ARGS: <json object>\n"
    "Available tools:\n{tool_descriptions}\n"
    "After observations are provided, continue reasoning or output FINAL ANSWER: using the "
    "mandatory sections: Decision, Primary Reason, Additional Risks, Final Summary."
)
