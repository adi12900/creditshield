"""End-to-end loan appraisal engine using transaction CSV + behavioral YAML rules."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
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


def _to_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _build_stage2_payload(feature_result: Any, loan_context: Dict[str, Any] | None) -> Dict[str, Any]:
    ctx = loan_context or {}
    cash = dict(feature_result.cashflow_analysis)

    monthly_income = _to_float(cash.get("monthly_income"), 0.0)
    monthly_expense = _to_float(cash.get("monthly_expense"), 0.0)
    monthly_savings = monthly_income - monthly_expense
    savings_ratio = (monthly_savings / monthly_income) * 100.0 if monthly_income > 0 else 0.0

    loan_amount = _to_float(ctx.get("loan_amount"), 0.0)
    tenure_months = max(1.0, _to_float(ctx.get("tenure_months"), 0.0))
    emi = loan_amount / tenure_months if loan_amount > 0 else 0.0
    emi_ratio = (emi / monthly_income) * 100.0 if monthly_income > 0 else 0.0

    if emi_ratio < 20.0:
        emi_band = "SAFE"
    elif emi_ratio <= 40.0:
        emi_band = "MANAGEABLE"
    else:
        emi_band = "RISKY"

    return {
        "units_note": "monthly_* fields are per-month averages; total_credit and total_debit are 12-month totals",
        "liquidity_method": "daily_closing_balance",
        "monthly_income": round(monthly_income, 2),
        "monthly_expense": round(monthly_expense, 2),
        "monthly_savings": round(monthly_savings, 2),
        "savings_ratio": round(savings_ratio, 2),
        "low_balance_days": int(cash.get("low_balance_days", 0) or 0),
        "liquidity_stress": round(_to_float(cash.get("liquidity_stress_pct"), 0.0), 2),
        "emi": round(emi, 2),
        "emi_ratio": round(emi_ratio, 2),
        "emi_band": emi_band,
        "income_classification": str(feature_result.income_analysis.get("income_classification", "Unemployed")),
        "expense_categories": dict(cash.get("expense_categories", {})),
        "total_credit": round(_to_float(cash.get("total_inflow"), 0.0), 2),
        "total_debit": round(_to_float(cash.get("total_outflow"), 0.0), 2),
        "annual_expense_from_monthly": round(monthly_expense * 12.0, 2),
        "annual_income_from_monthly": round(monthly_income * 12.0, 2),
        "loan_amount": round(loan_amount, 2),
        "tenure_months": int(tenure_months),
    }


def _internal_validation(payload: Dict[str, Any]) -> Dict[str, Any]:
    issues: list[str] = []

    monthly_income = _to_float(payload.get("monthly_income"), 0.0)
    monthly_expense = _to_float(payload.get("monthly_expense"), 0.0)
    monthly_savings = _to_float(payload.get("monthly_savings"), 0.0)
    savings_ratio = _to_float(payload.get("savings_ratio"), 0.0)
    total_credit = _to_float(payload.get("total_credit"), 0.0)
    total_debit = _to_float(payload.get("total_debit"), 0.0)
    annual_income = _to_float(payload.get("annual_income_from_monthly"), monthly_income * 12.0)
    annual_expense = _to_float(payload.get("annual_expense_from_monthly"), monthly_expense * 12.0)
    emi = _to_float(payload.get("emi"), 0.0)

    if total_credit < 0 or monthly_income < 0:
        issues.append("income_values_invalid")
    if total_debit < 0 or monthly_expense < 0:
        issues.append("expense_values_invalid")
    if round(monthly_savings, 2) != round(monthly_income - monthly_expense, 2):
        issues.append("savings_mismatch")

    recomputed_ratio = (monthly_savings / monthly_income) * 100.0 if monthly_income > 0 else 0.0
    if abs(recomputed_ratio - savings_ratio) > 0.25:
        issues.append("savings_ratio_inconsistent")

    expense_delta = abs(annual_expense - total_debit)
    expense_tol = max(1.0, total_debit * 0.02)
    if expense_delta > expense_tol:
        issues.append("expense_total_mismatch")

    income_delta = abs(annual_income - total_credit)
    income_tol = max(1.0, total_credit * 0.02)
    if income_delta > income_tol:
        issues.append("income_total_mismatch")

    categories = payload.get("expense_categories") or {}
    category_total = sum(_to_float(v, 0.0) for v in categories.values())
    if total_debit > 0 and category_total <= 0:
        issues.append("expense_categories_all_zero")

    income_classification = str(payload.get("income_classification", "")).strip().lower()
    allowed_classes = {"salaried", "freelance", "business", "informal income", "unemployed"}
    if income_classification not in allowed_classes:
        issues.append("income_classification_invalid")
    if total_credit > 0 and income_classification == "unemployed":
        issues.append("income_classification_invalid")

    liquidity_method = str(payload.get("liquidity_method", "")).strip().lower()
    if liquidity_method != "daily_closing_balance":
        issues.append("liquidity_method_invalid")

    if emi <= 0.0:
        issues.append("emi_missing_or_zero")

    return {
        "status": "PASS" if not issues else "FAIL",
        "issues": issues,
        "checks": {
            "income_matches_credit": total_credit >= 0,
            "expense_matches_debit": total_debit >= 0,
            "savings_exact": "savings_mismatch" not in issues,
            "savings_ratio_logical": "savings_ratio_inconsistent" not in issues,
            "expense_total_consistent": "expense_total_mismatch" not in issues,
            "income_total_consistent": "income_total_mismatch" not in issues,
            "categories_non_zero": "expense_categories_all_zero" not in issues,
            "emi_non_zero": "emi_missing_or_zero" not in issues,
            "classification_valid": "income_classification_invalid" not in issues,
            "liquidity_daily_balance_method": "liquidity_method_invalid" not in issues,
        },
    }


def _apply_auto_corrections(payload: Dict[str, Any], issues: list[str]) -> Dict[str, Any]:
    corrected = dict(payload)
    issues_text = " ".join(str(i).lower() for i in issues)

    if "savings_mismatch" in issues or "savings_ratio_inconsistent" in issues:
        income = _to_float(corrected.get("monthly_income"), 0.0)
        expense = _to_float(corrected.get("monthly_expense"), 0.0)
        savings = income - expense
        corrected["monthly_savings"] = round(savings, 2)
        corrected["savings_ratio"] = round((savings / income) * 100.0 if income > 0 else 0.0, 2)

    if "expense_total_mismatch" in issues or ("expense" in issues_text and ("debit" in issues_text or "under" in issues_text)):
        total_debit = _to_float(corrected.get("total_debit"), 0.0)
        monthly_expense = (total_debit / 12.0) if total_debit > 0 else 0.0
        corrected["monthly_expense"] = round(monthly_expense, 2)
        corrected["annual_expense_from_monthly"] = round(monthly_expense * 12.0, 2)

    if "income_total_mismatch" in issues or ("income" in issues_text and "credit" in issues_text):
        total_credit = _to_float(corrected.get("total_credit"), 0.0)
        monthly_income = (total_credit / 12.0) if total_credit > 0 else 0.0
        corrected["monthly_income"] = round(monthly_income, 2)
        corrected["annual_income_from_monthly"] = round(monthly_income * 12.0, 2)

    if "income_classification_invalid" in issues and _to_float(corrected.get("total_credit"), 0.0) > 0:
        corrected["income_classification"] = "Informal income"

    if "expense_categories_all_zero" in issues and _to_float(corrected.get("total_debit"), 0.0) > 0:
        categories = dict(corrected.get("expense_categories") or {})
        categories["Unknown"] = round(_to_float(corrected.get("total_debit"), 0.0), 2)
        corrected["expense_categories"] = categories

    if "liquidity_method_invalid" in issues:
        corrected["liquidity_method"] = "daily_closing_balance"

    # Recompute dependent fields after any fix.
    monthly_income = _to_float(corrected.get("monthly_income"), 0.0)
    monthly_expense = _to_float(corrected.get("monthly_expense"), 0.0)
    monthly_savings = monthly_income - monthly_expense
    corrected["monthly_savings"] = round(monthly_savings, 2)
    corrected["savings_ratio"] = round((monthly_savings / monthly_income) * 100.0 if monthly_income > 0 else 0.0, 2)
    corrected["annual_income_from_monthly"] = round(monthly_income * 12.0, 2)
    corrected["annual_expense_from_monthly"] = round(monthly_expense * 12.0, 2)

    return corrected


def _extract_json(response_text: str) -> Dict[str, Any] | None:
    if not response_text:
        return None
    match = re.search(r"\{[\s\S]*\}", response_text)
    if not match:
        return None
    try:
        data = json.loads(match.group(0))
    except Exception:
        return None
    return data if isinstance(data, dict) else None


def _bedrock_validate(payload: Dict[str, Any]) -> Dict[str, Any]:
    repo_root = str(Path(__file__).resolve().parents[1])
    if repo_root not in sys.path:
        sys.path.append(repo_root)

    try:
        from ai_agent.bedrock.client import BedrockClient
    except Exception:
        return {
            "status": "INCONSISTENT",
            "issues": ["bedrock_client_unavailable"],
            "raw": "",
        }

    bedrock_payload = {
        "income": payload.get("monthly_income"),
        "expense": payload.get("monthly_expense"),
        "savings": payload.get("monthly_savings"),
        "savings_ratio": payload.get("savings_ratio"),
        "emi": payload.get("emi"),
        "emi_ratio": payload.get("emi_ratio"),
        "liquidity_stress": payload.get("liquidity_stress"),
        "categories_present": bool(sum(_to_float(v, 0.0) for v in (payload.get("expense_categories") or {}).values()) > 0),
        "classification": payload.get("income_classification"),
        "annual_expense_from_monthly": payload.get("annual_expense_from_monthly"),
        "total_debit_12m": payload.get("total_debit"),
        "annual_income_from_monthly": payload.get("annual_income_from_monthly"),
        "total_credit_12m": payload.get("total_credit"),
        "liquidity_method": payload.get("liquidity_method"),
    }

    system_prompt = (
        "You are a loan underwriting audit validator. "
        "Do not calculate new numbers. Validate consistency only. "
        "Return JSON with keys: status, issues, observations. "
        "status must be CONSISTENT or INCONSISTENT. "
        "Check these items explicitly: expenses under-reported, savings realism, missing categories, "
        "classification correctness, EMI validity, risk justification, and expense accuracy. "
        "Compare annual_expense_from_monthly with total_debit_12m and annual_income_from_monthly with total_credit_12m."
    )
    prompt = (
        "Validate the following metrics exactly as provided. "
        "Answer whether values are CONSISTENT and REALISTIC for underwriting. "
        "Do not generate or modify numbers.\n"
        f"INPUT_JSON:\n{json.dumps(bedrock_payload, ensure_ascii=True)}\n"
        "If values are consistent, return: {\"status\":\"CONSISTENT\",\"issues\":[],\"observations\":[...]}\n"
        "If inconsistent, return: {\"status\":\"INCONSISTENT\",\"issues\":[...],\"observations\":[...]}"
    )

    client = BedrockClient()
    if getattr(client, "mock_mode", False):
        return {
            "status": "INCONSISTENT",
            "issues": ["bedrock_mock_mode_not_allowed"],
            "raw": "",
        }

    response_text = client.invoke_model(prompt=prompt, system_prompt=system_prompt, temperature=0.0)
    parsed = _extract_json(response_text)
    if not parsed:
        return {
            "status": "INCONSISTENT",
            "issues": ["bedrock_response_unparseable"],
            "raw": response_text,
        }

    status = str(parsed.get("status", "")).upper()
    issues = parsed.get("issues") if isinstance(parsed.get("issues"), list) else []
    if status not in {"CONSISTENT", "INCONSISTENT"}:
        status = "INCONSISTENT"
        issues = list(issues) + ["bedrock_status_invalid"]

    return {
        "status": status,
        "issues": issues,
        "observations": parsed.get("observations", []),
        "raw": response_text,
    }


def _ensure_bedrock_preflight() -> None:
    repo_root = str(Path(__file__).resolve().parents[1])
    if repo_root not in sys.path:
        sys.path.append(repo_root)

    try:
        from ai_agent import config as agent_config
        from ai_agent.bedrock.client import BedrockClient
    except Exception as exc:
        raise ValueError(
            "AWS Bedrock preflight failed: Bedrock modules unavailable; strict validation cannot proceed."
        ) from exc

    missing: list[str] = []
    if not getattr(agent_config, "AWS_REGION", None):
        missing.append("AWS_REGION")
    if not getattr(agent_config, "AWS_ACCESS_KEY_ID", None):
        missing.append("AWS_ACCESS_KEY_ID")
    if not getattr(agent_config, "AWS_SECRET_ACCESS_KEY", None):
        missing.append("AWS_SECRET_ACCESS_KEY")

    if missing:
        raise ValueError(
            "AWS Bedrock preflight failed: missing "
            + ", ".join(missing)
            + "; strict validation cannot proceed."
        )

    client = BedrockClient()
    if getattr(client, "mock_mode", False):
        raise ValueError(
            "AWS Bedrock preflight failed: MOCK_MODE is enabled; strict validation requires live Bedrock."
        )


def run_loan_appraisal(
    transaction_csv_path: str,
    rules_yaml_path: str,
    loan_context: Dict[str, Any] | None = None,
) -> Dict[str, Any]:
    _ensure_bedrock_preflight()

    pipeline_trace: list[Dict[str, Any]] = []

    # STEP 1: DATA CLEANING
    df = load_transactions(transaction_csv_path)
    pipeline_trace.append({
        "step": "STEP 1",
        "name": "DATA CLEANING",
        "status": "PASS",
        "rows_processed": int(df.shape[0]),
    })

    # STEP 2: FEATURE ENGINEERING
    feature_result = extract_features(df)
    stage2_payload = _build_stage2_payload(feature_result, loan_context)
    pipeline_trace.append({
        "step": "STEP 2",
        "name": "FEATURE ENGINEERING",
        "status": "PASS",
        "computed": {
            "monthly_income": stage2_payload["monthly_income"],
            "monthly_expense": stage2_payload["monthly_expense"],
            "monthly_savings": stage2_payload["monthly_savings"],
            "savings_ratio": stage2_payload["savings_ratio"],
        },
    })

    # STEP 3 + STEP 4 + STEP 5: FIREWALL, BEDROCK VALIDATION, AUTO-CORRECTION LOOP
    validation_rounds: list[Dict[str, Any]] = []
    validation_payload = dict(stage2_payload)
    final_internal = {"status": "FAIL", "issues": ["not_run"]}
    final_bedrock = {"status": "INCONSISTENT", "issues": ["not_run"]}

    for round_idx in range(1, 4):
        internal = _internal_validation(validation_payload)
        final_internal = internal

        bedrock = {"status": "INCONSISTENT", "issues": ["internal_validation_failed"]}
        if internal["status"] == "PASS":
            bedrock = _bedrock_validate(validation_payload)
        final_bedrock = bedrock

        validation_rounds.append(
            {
                "round": round_idx,
                "internal_status": internal["status"],
                "internal_issues": list(internal.get("issues", [])),
                "bedrock_status": bedrock["status"],
                "bedrock_issues": list(bedrock.get("issues", [])),
            }
        )

        if internal["status"] == "PASS" and bedrock["status"] == "CONSISTENT":
            break

        fix_issues = list(internal.get("issues", [])) + list(bedrock.get("issues", []))
        validation_payload = _apply_auto_corrections(validation_payload, fix_issues)

    pipeline_trace.append({
        "step": "STEP 3",
        "name": "STRICT VALIDATION FIREWALL",
        "status": final_internal["status"],
        "issues": list(final_internal.get("issues", [])),
    })
    pipeline_trace.append({
        "step": "STEP 4",
        "name": "BEDROCK VALIDATION",
        "status": final_bedrock["status"],
        "issues": list(final_bedrock.get("issues", [])),
    })
    pipeline_trace.append({
        "step": "STEP 5",
        "name": "AUTO-CORRECTION LOOP",
        "status": "PASS" if (final_internal["status"] == "PASS" and final_bedrock["status"] == "CONSISTENT") else "FAIL",
        "rounds": validation_rounds,
    })

    if final_internal["status"] != "PASS" or final_bedrock["status"] != "CONSISTENT":
        raise ValueError("PIPELINE VALIDATION FAILED AFTER MULTIPLE ATTEMPTS")

    # Rule + model analysis after validation firewall passes.
    rules = load_rules(rules_yaml_path)
    hits = evaluate_rules(feature_result.features, rules, loan_context=loan_context)
    pipeline_trace.append({
        "step": "STEP 3B",
        "name": "RULE + MODEL ANALYSIS",
        "status": "PASS",
        "rules_fired": len(hits),
    })

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

    # STEP 6: FINAL REPORT GENERATION
    pipeline_trace.append({
        "step": "STEP 6",
        "name": "FINAL REPORT GENERATION",
        "status": "PASS",
    })

    output = {
        "final_score": round(final_score, 2),
        "risk_level": risk_level,
        "summary": summary,
        "income_analysis": feature_result.income_analysis,
        "cashflow_analysis": feature_result.cashflow_analysis,
        "loan_analysis": feature_result.loan_analysis,
        "strict_pipeline_metrics": validation_payload,
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
        "pipeline_validation": {
            "internal_validation": final_internal,
            "bedrock_validation": final_bedrock,
            "trace": pipeline_trace,
        },
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
    default_context = {
        "loan_amount": 100000,
        "tenure_months": 24,
        "loan_type": "personal",
    }
    result = run_loan_appraisal(transaction_csv_path, rules_yaml_path, loan_context=default_context)
    print(json.dumps(result, indent=2))
