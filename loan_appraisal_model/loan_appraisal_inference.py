"""Inference using trained loan appraisal model artifact."""

from __future__ import annotations

import argparse
import json
import pickle
from typing import Any, Dict, List

import numpy as np

from loan_appraisal_engine import run_loan_appraisal
from loan_appraisal_features import extract_features, load_transactions
from loan_appraisal_rule_engine import evaluate_rules, load_rules


def _build_vector(features: Dict[str, Any], tier_map: Dict[str, float], tier_features: List[str], numeric_features: List[str]) -> np.ndarray:
    row: List[float] = []
    for key in tier_features:
        row.append(float(tier_map.get(str(features.get(key, "moderate")), 2.0)))
    for key in numeric_features:
        try:
            row.append(float(features.get(key, 0.0)))
        except (TypeError, ValueError):
            row.append(0.0)
    return np.array([row], dtype=float)


def _rule_metrics(rule_hits: List[Any]) -> Dict[str, float]:
    return {
        "rule_hit_count": float(len(rule_hits)),
        "rule_impact_sum": float(sum(float(h.impact) for h in rule_hits)),
        "rule_critical_count": float(sum(1 for h in rule_hits if str(h.severity).lower() == "critical")),
        "rule_high_count": float(sum(1 for h in rule_hits if str(h.severity).lower() == "high")),
        "rule_negative_impact_count": float(sum(1 for h in rule_hits if float(h.impact) < 0.0)),
        "rule_positive_impact_count": float(sum(1 for h in rule_hits if float(h.impact) > 0.0)),
    }


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


def run_inference(
    model_path: str,
    transactions_csv: str,
    rules_yaml: str,
    loan_context: Dict[str, Any] | None = None,
) -> Dict[str, Any]:
    with open(model_path, "rb") as f:
        artifact = pickle.load(f)

    model = artifact["model"]
    tier_map = artifact["tier_map"]
    tier_features = artifact["tier_features"]
    numeric_features = artifact["numeric_features"]

    df = load_transactions(transactions_csv)
    feat = extract_features(df)
    rules = load_rules(rules_yaml)
    rule_hits = evaluate_rules(feat.features, rules, loan_context=loan_context)
    feature_dict = dict(feat.features)
    feature_dict.update(_rule_metrics(rule_hits))

    X = _build_vector(feature_dict, tier_map, tier_features, numeric_features)
    prob_safe = float(model.predict_proba(X)[0][1])
    pred_safe = int(model.predict(X)[0])

    # Keep explainable rule output, then reconcile with ML probability to avoid contradictory outcomes.
    effective_context = dict(loan_context or {})
    if float(effective_context.get("loan_amount", 0.0) or 0.0) <= 0.0:
        effective_context["loan_amount"] = 100000.0
    if int(effective_context.get("tenure_months", 0) or 0) <= 0:
        effective_context["tenure_months"] = 24
    if not str(effective_context.get("loan_type", "")).strip():
        effective_context["loan_type"] = "personal"

    result = run_loan_appraisal(transactions_csv, rules_yaml, loan_context=effective_context)
    rule_score = float(result.get("final_score", 50.0))
    ml_score = prob_safe * 100.0
    hybrid_score = (0.6 * rule_score) + (0.4 * ml_score)

    if prob_safe <= 0.2 and hybrid_score > 55.0:
        # Strongly risky model signal should not end up as a soft moderate outcome.
        hybrid_score = min(hybrid_score, 49.0)

    final_score = round(max(0.0, min(100.0, hybrid_score)), 2)
    risk_level = _risk_level(final_score)
    recommendation = _recommendation(final_score)

    result["final_score"] = final_score
    result["risk_level"] = risk_level
    result["recommendation"] = recommendation
    result["summary"] = (
        f"Hybrid score {final_score:.2f} ({risk_level}) from rule score {rule_score:.2f} "
        f"and model safe probability {prob_safe:.4f}. "
        f"Recommendation: {recommendation}."
    )

    result["trained_model"] = {
        "prediction": "safer" if pred_safe == 1 else "risky",
        "probability_safe": round(prob_safe, 4),
        "probability_risky": round(1.0 - prob_safe, 4),
        "rule_score": round(rule_score, 2),
        "hybrid_final_score": final_score,
    }

    if prob_safe <= 0.2:
        red_flags = result.setdefault("red_flags", [])
        if "Model indicates high repayment default risk" not in red_flags:
            red_flags.append("Model indicates high repayment default risk")

    return result


def main() -> None:
    parser = argparse.ArgumentParser(description="Run trained loan appraisal inference")
    parser.add_argument("--model", required=True, help="Path to trained model pickle")
    parser.add_argument("--transactions", required=True, help="Path to user transaction CSV")
    parser.add_argument("--rules", required=True, help="Path to behavioral rules YAML")
    args = parser.parse_args()

    output = run_inference(args.model, args.transactions, args.rules)
    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
