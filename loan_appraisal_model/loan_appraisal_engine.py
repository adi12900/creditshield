"""End-to-end loan appraisal engine using transaction CSV + behavioral YAML rules."""

from __future__ import annotations

import json
from dataclasses import asdict
from typing import Any, Dict

from loan_appraisal_features import extract_features, load_transactions
from loan_appraisal_rule_engine import build_underwriting_decision, evaluate_rules, load_rules


def _clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


def _risk_level(score: float) -> str:
    if score < 40:
        return "High Risk"
    if score < 70:
        return "Moderate Risk"
    return "Low Risk"


def _recommendation(score: float) -> str:
    if score < 35:
        return "Reject"
    if score < 70:
        return "Approve with caution"
    return "Approve"


def run_loan_appraisal(
    transaction_csv_path: str,
    rules_yaml_path: str,
    loan_context: Dict[str, Any] | None = None,
) -> Dict[str, Any]:
    df = load_transactions(transaction_csv_path)
    feature_result = extract_features(df)

    rules = load_rules(rules_yaml_path)
    hits = evaluate_rules(feature_result.features, rules, loan_context=loan_context)

    underwriting = build_underwriting_decision(
        feature_result.features,
        hits,
        loan_context=loan_context,
    )

    base_score = 72.0
    impact_score = sum(h.impact for h in hits) * 100.0
    final_score = _clamp(base_score + impact_score, 0.0, 100.0)

    risk_level = _risk_level(final_score)
    recommendation = _recommendation(final_score)

    red_flags = list(feature_result.red_flags)
    if any(h.severity in {"critical", "high"} for h in hits):
        red_flags.append("Rule engine triggered high-severity behavioral risks")

    confidence = 0.55
    confidence += 0.2 if len(df) >= 200 else 0.0
    confidence += 0.15 if len(hits) >= 10 else 0.05
    confidence += 0.1 if feature_result.income_analysis.get("salary_months_detected", 0) >= 6 else 0.0
    confidence_score = round(_clamp(confidence * 100, 0.0, 99.0), 2)

    summary = (
        f"Final score {final_score:.2f} ({risk_level}). "
        f"Rules matched: {len(hits)}. "
        f"Key concerns: {', '.join(red_flags[:3]) if red_flags else 'no major red flags detected.'}"
    )

    output = {
        "final_score": round(final_score, 2),
        "risk_level": risk_level,
        "summary": summary,
        "income_analysis": feature_result.income_analysis,
        "cashflow_analysis": feature_result.cashflow_analysis,
        "loan_analysis": feature_result.loan_analysis,
        "category_scores": feature_result.category_scores,
        "behavioral_flags": feature_result.behavioral_flags,
        "rule_evaluations": [
            {
                "rule_id": h.rule_id,
                "impact": round(h.impact, 4),
                "reason": h.reason,
                "category": h.category,
                "subcategory": h.subcategory,
                "severity": h.severity,
                "status": h.status,
                "note": h.note,
            }
            for h in hits
        ],
        "red_flags": red_flags,
        "recommendation": recommendation,
        "confidence_score": confidence_score,
        "underwriting_evaluation": {
            "ACCOUNT_TYPE": underwriting["account_type"],
            "CONFIDENCE": underwriting["confidence"],
            "CLASSIFICATION_REASON": underwriting["classification_reason"],
            "LOAN_PRODUCT": underwriting["loan_product"],
            "NET_SCORE": underwriting["net_score"],
            "DECISION": underwriting["decision"],
            "RULES_FIRED": [
                {
                    "sign": "+" if h.impact >= 0 else "-",
                    "rule_id": h.rule_id,
                    "subcategory": h.subcategory,
                    "score": round(h.impact, 4),
                    "reason": h.reason,
                    "status": h.status,
                    "note": h.note,
                }
                for h in hits
            ],
            "TOP_RISK_FACTORS": underwriting["top_risk_factors"],
            "BORROWER_FRIENDLY_EXPLANATION": underwriting["borrower_friendly_explanation"],
            "UNDERWRITER_NOTE": underwriting["underwriter_note"],
        },
    }

    return output


def run_and_print_json(transaction_csv_path: str, rules_yaml_path: str) -> None:
    result = run_loan_appraisal(transaction_csv_path, rules_yaml_path)
    print(json.dumps(result, indent=2))
