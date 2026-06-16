"""Rule loading and condition evaluation for loan appraisal."""

from __future__ import annotations

import ast
import json
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml


PRIMARY_RULES_JSON = Path("/mnt/user-data/uploads/behavioral_rules.json")
EXTENDED_RULES_YAML = Path(
    "/media/ideabliss/E0921B6E921B4904/creditshield/dataset/behavioral_rules_realistic.yaml"
)


def _preferred_rules_path(rules_yaml_path: str) -> str:
    candidate = Path(rules_yaml_path)
    if candidate.name == "behavioral_rules.yaml":
        realistic_candidate = candidate.with_name("behavioral_rules_realistic.yaml")
        if realistic_candidate.exists():
            return str(realistic_candidate)
    return rules_yaml_path


@dataclass
class RuleHit:
    rule_id: str
    impact: float
    reason: str
    category: str
    severity: str
    subcategory: str = ""
    status: str = "APPLIED"
    note: str = ""


class _SafeEvaluator(ast.NodeVisitor):
    ALLOWED = (
        ast.Expression,
        ast.BoolOp,
        ast.Compare,
        ast.Name,
        ast.Load,
        ast.Constant,
        ast.And,
        ast.Or,
        ast.Eq,
        ast.NotEq,
        ast.Gt,
        ast.GtE,
        ast.Lt,
        ast.LtE,
        ast.In,
        ast.NotIn,
        ast.List,
        ast.Tuple,
        ast.UnaryOp,
        ast.Not,
    )

    def __init__(self, context: Dict[str, Any]) -> None:
        self.context = context

    def visit(self, node: ast.AST) -> Any:
        if not isinstance(node, self.ALLOWED):
            raise ValueError(f"Unsupported expression node: {type(node).__name__}")
        return super().visit(node)

    def visit_Expression(self, node: ast.Expression) -> Any:
        return self.visit(node.body)

    def visit_Name(self, node: ast.Name) -> Any:
        return self.context.get(node.id)

    def visit_Constant(self, node: ast.Constant) -> Any:
        return node.value

    def visit_List(self, node: ast.List) -> Any:
        return [self.visit(e) for e in node.elts]

    def visit_Tuple(self, node: ast.Tuple) -> Any:
        return tuple(self.visit(e) for e in node.elts)

    def visit_UnaryOp(self, node: ast.UnaryOp) -> Any:
        if isinstance(node.op, ast.Not):
            return not bool(self.visit(node.operand))
        raise ValueError("Unsupported unary operator")

    def visit_BoolOp(self, node: ast.BoolOp) -> Any:
        values = [bool(self.visit(v)) for v in node.values]
        if isinstance(node.op, ast.And):
            return all(values)
        if isinstance(node.op, ast.Or):
            return any(values)
        raise ValueError("Unsupported boolean operator")

    def visit_Compare(self, node: ast.Compare) -> Any:
        left = self.visit(node.left)
        for op, comparator_node in zip(node.ops, node.comparators):
            right = self.visit(comparator_node)
            if isinstance(op, ast.Eq):
                ok = left == right
            elif isinstance(op, ast.NotEq):
                ok = left != right
            elif isinstance(op, ast.Gt):
                ok = left > right
            elif isinstance(op, ast.GtE):
                ok = left >= right
            elif isinstance(op, ast.Lt):
                ok = left < right
            elif isinstance(op, ast.LtE):
                ok = left <= right
            elif isinstance(op, ast.In):
                ok = left in right
            elif isinstance(op, ast.NotIn):
                ok = left not in right
            else:
                raise ValueError("Unsupported comparison operator")
            if not ok:
                return False
            left = right
        return True


def _extract_condition_variables(expr: str) -> List[str]:
    vars_found: List[str] = []
    try:
        tree = ast.parse(expr, mode="eval")
    except SyntaxError:
        return vars_found
    for n in ast.walk(tree):
        if isinstance(n, ast.Name):
            vars_found.append(n.id)
    return sorted(set(vars_found))


def _read_rules_from_file(path: Path) -> List[Dict[str, Any]]:
    if not path.exists():
        return []
    try:
        if path.suffix.lower() == ".json":
            data = json.loads(path.read_text(encoding="utf-8"))
        else:
            data = yaml.safe_load(path.read_text(encoding="utf-8"))
    except Exception:
        return []

    if isinstance(data, dict) and isinstance(data.get("rules"), list):
        return [r for r in data["rules"] if isinstance(r, dict)]
    if isinstance(data, list):
        return [r for r in data if isinstance(r, dict)]
    return []


def _merge_rules(primary_rules: List[Dict[str, Any]], yaml_rules: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    merged: Dict[str, Dict[str, Any]] = {}
    ordered: List[Dict[str, Any]] = []

    for rule in primary_rules:
        rid = str(rule.get("rule_id", rule.get("id", ""))).strip()
        if not rid:
            continue
        if rid not in merged:
            merged[rid] = dict(rule)
            ordered.append(merged[rid])

    # YAML is the realistic override layer and always takes precedence by rule_id.
    for rule in yaml_rules:
        rid = str(rule.get("rule_id", rule.get("id", ""))).strip()
        if not rid:
            continue
        if rid in merged:
            merged[rid] = dict(rule)
            for idx, existing in enumerate(ordered):
                ex_id = str(existing.get("rule_id", existing.get("id", ""))).strip()
                if ex_id == rid:
                    ordered[idx] = merged[rid]
                    break
        else:
            merged[rid] = dict(rule)
            ordered.append(merged[rid])

    return ordered


def _to_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _build_underwriting_metrics(features: Dict[str, Any], loan_context: Dict[str, Any] | None) -> Dict[str, Any]:
    ctx = loan_context or {}

    total_inflow = _to_float(features.get("metric_total_inflow", 0.0), 0.0)
    total_outflow = _to_float(features.get("metric_total_outflow", 0.0), 0.0)
    salary_cv = _to_float(features.get("metric_salary_cv", 1.0), 1.0)

    monthly_income = total_inflow / 12.0 if total_inflow > 0 else 0.0
    monthly_expense = total_outflow / 12.0 if total_outflow > 0 else 0.0

    loan_amount = _to_float(ctx.get("loan_amount", 0.0), 0.0)
    tenure_months = max(1.0, _to_float(ctx.get("tenure_months", 24.0), 24.0))
    estimated_emi = (loan_amount / tenure_months) if loan_amount > 0 else 0.0

    # Guard near-zero denominators to avoid unstable/meaningless ratio explosions.
    effective_income = monthly_income if monthly_income > 1e-6 else 0.0

    emi_to_income_ratio = (estimated_emi / effective_income) if effective_income > 0 else 99.0
    expense_to_income_ratio = (monthly_expense / effective_income) if effective_income > 0 else 99.0
    debit_income_ratio = expense_to_income_ratio

    # RBI-aligned operational affordability guardrails (internal policy interpretation):
    # - <= 70%: compliant
    # - > 70%: elevated stress, review/restrict auto-approval 
    rbi_debit_income_threshold = 0.70
    rbi_debit_income_compliant = debit_income_ratio <= rbi_debit_income_threshold

    annual_income = monthly_income * 12.0
    loan_size_sensitivity = (loan_amount / annual_income) if annual_income > 0 else 99.0
    net_surplus_after_emi = monthly_income - monthly_expense - estimated_emi

    # Strict DTI: debt obligation only (estimated EMI) over income.
    dti_ratio = (estimated_emi / effective_income) if effective_income > 0 else 99.0
    # Cash burden ratio keeps prior holistic affordability stress view.
    cash_burden_ratio = ((monthly_expense + estimated_emi) / effective_income) if effective_income > 0 else 99.0
    income_consistency_score = max(0.0, min(1.0, 1.0 - min(1.0, salary_cv)))

    return {
        "metric_monthly_income_proxy": round(monthly_income, 2),
        "metric_monthly_expense_proxy": round(monthly_expense, 2),
        "metric_monthly_savings_proxy": round(monthly_income - monthly_expense, 2),
        "metric_expense_to_income_ratio": round(expense_to_income_ratio, 4),
        "metric_debit_income_ratio": round(debit_income_ratio, 4),
        "metric_rbi_debit_income_threshold": round(rbi_debit_income_threshold, 4),
        "metric_rbi_debit_income_compliant": rbi_debit_income_compliant,
        "metric_rbi_debit_income_breach": not rbi_debit_income_compliant,
        "metric_estimated_emi": round(estimated_emi, 2),
        "metric_emi_to_income_ratio": round(emi_to_income_ratio, 4),
        "metric_dti_ratio": round(dti_ratio, 4),
        "metric_cash_burden_ratio": round(cash_burden_ratio, 4),
        "metric_annual_income_proxy": round(annual_income, 2),
        "metric_loan_size_sensitivity": round(loan_size_sensitivity, 4),
        "metric_net_surplus_after_emi": round(net_surplus_after_emi, 2),
        "metric_income_consistency_score": round(income_consistency_score, 4),
    }


def classify_account_type(features: Dict[str, Any], loan_context: Dict[str, Any] | None = None) -> Dict[str, str]:
    ctx = loan_context or {}
    salary_tier = str(features.get("salary_salary_detection_tier", "moderate")).lower()
    salary_months = int(_to_float(features.get("metric_salary_months", 0.0), 0.0))
    salary_cv = _to_float(features.get("metric_salary_cv", 1.0), 1.0)
    total_inflow = _to_float(features.get("metric_total_inflow", 0.0), 0.0)
    total_outflow = _to_float(features.get("metric_total_outflow", 0.0), 0.0)

    loan_type = str(ctx.get("loan_type", "")).strip().lower()
    segment = str(ctx.get("segment", "")).strip().lower()
    is_business_context = (
        loan_type in {"business", "business_loan", "msme"}
        or "business" in loan_type
        or segment in {"business_owner", "credit_dependent"}
    )

    if is_business_context:
        return {
            "account_type": "BUSINESS",
            "confidence": "HIGH",
            "reason": "Loan context and transaction profile indicate a business-oriented account.",
        }

    salaried_like = salary_tier in {"stable", "strong"} and salary_months >= 6 and salary_cv <= 0.20
    non_salaried_like = salary_tier in {"critical", "high", "moderate"} or salary_months < 4

    if salaried_like and not non_salaried_like:
        return {
            "account_type": "SALARIED",
            "confidence": "HIGH",
            "reason": "Regular salary-like behavior detected with stable monthly consistency.",
        }

    if non_salaried_like and total_inflow > 0:
        return {
            "account_type": "NON_SALARIED",
            "confidence": "MEDIUM",
            "reason": "Income appears irregular or multi-source without a fixed salary cycle.",
        }

    if total_inflow > 0 and total_outflow > 0:
        return {
            "account_type": "MIXED",
            "confidence": "LOW",
            "reason": "Signals are mixed or insufficient for a single clear account archetype.",
        }

    return {
        "account_type": "MIXED",
        "confidence": "LOW",
        "reason": "Insufficient history or contradictory patterns for robust account classification.",
    }


# Loan products where behavioral (lifestyle/addiction/salary) factors apply.
_BEHAVIORAL_FACTOR_PRODUCTS = {"PERSONAL_LOAN", "SMALL_PERSONAL", "HOME_LOAN", "MICRO_LOAN"}


def detect_loan_product(loan_context: Dict[str, Any] | None = None) -> str:
    ctx = loan_context or {}
    amount = _to_float(ctx.get("loan_amount", 0.0), 0.0)
    tenure = int(_to_float(ctx.get("tenure_months", 24.0), 24.0))
    loan_type = str(ctx.get("loan_type", "")).strip().lower()
    collateral = bool(ctx.get("collateral_present", False))

    if "education" in loan_type or loan_type in {"education", "education_loan", "student_loan"}:
        return "EDUCATION_LOAN"
    if "business" in loan_type or loan_type in {"business", "business_loan", "msme"}:
        return "BUSINESS_LOAN"
    if "gold" in loan_type or collateral and "gold" in loan_type:
        return "GOLD_LOAN"
    if "home" in loan_type or "mortgage" in loan_type or (amount > 1000000 and collateral):
        return "HOME_LOAN"
    if "bnpl" in loan_type or "pay_later" in loan_type:
        return "BNPL"
    if amount <= 10000 and ("bnpl" in loan_type or "pay" in loan_type):
        return "BNPL"
    if amount <= 25000 or tenure <= 12:
        return "MICRO_LOAN"
    if amount <= 200000:
        return "SMALL_PERSONAL"
    if amount <= 1000000:
        return "PERSONAL_LOAN"
    return "PERSONAL_LOAN"


def is_behavioral_factors_applicable(loan_product: str) -> bool:
    """Returns True only for loan types where lifestyle/addiction/salary behavioral factors apply."""
    return loan_product in _BEHAVIORAL_FACTOR_PRODUCTS


def _adjust_rule_for_context(
    rule: Dict[str, Any],
    matched_impact: float,
    account_type: str,
    loan_product: str,
) -> tuple[float, str, str, str]:
    category = str(rule.get("category", "")).lower()
    subcategory = str(rule.get("subcategory", "")).lower()
    severity = str(rule.get("severity", "medium")).lower()

    impact = matched_impact
    status = "APPLIED"
    note = ""

    if loan_product == "MICRO_LOAN":
        suppress_keys = (
            "salary_fluctuation",
            "salary_consistency",
            "month_end_stress",
            "addiction",
        )
        if severity == "critical" and any(k in subcategory for k in suppress_keys):
            return 0.0, severity, "SUPPRESSED", "SUPPRESSED for MICRO_LOAN"

        if severity in {"high", "medium"} and (
            "income_stability" in category
            or "behavioral_segmentation" in category
            or "salary" in subcategory
        ):
            impact *= 0.5
            status = "ADJUSTED"
            note = "Severity tolerance applied for MICRO_LOAN"

    if account_type == "NON_SALARIED":
        if "salary" in subcategory or ("income_stability" in category and "salary" in subcategory):
            impact *= 0.5
            status = "ADJUSTED"
            note = "Weighted down by 50% for NON_SALARIED profile"

    if account_type == "BUSINESS" and loan_product == "BUSINESS_LOAN":
        if "salary" in category or "salary" in subcategory:
            return 0.0, severity, "SKIPPED", "SKIPPED for BUSINESS_LOAN business account"

    return impact, severity, status, note


@lru_cache(maxsize=12)
def _load_rules_cached(
    rules_yaml_path: str,
    primary_rules_json_path: str,
    extended_rules_yaml_path: str,
) -> tuple[Dict[str, Any], ...]:
    fallback_yaml = Path(_preferred_rules_path(rules_yaml_path))
    primary_json = Path(primary_rules_json_path)
    extended_yaml = Path(extended_rules_yaml_path)

    primary_rules = _read_rules_from_file(primary_json)

    if extended_yaml.exists():
        yaml_rules = _read_rules_from_file(extended_yaml)
    else:
        yaml_rules = _read_rules_from_file(fallback_yaml)

    raw_rules = _merge_rules(primary_rules, yaml_rules)

    compiled_rules: List[Dict[str, Any]] = []
    for rule in raw_rules:
        if not isinstance(rule, dict):
            continue

        condition = str(rule.get("condition", "")).strip()
        if not condition:
            continue

        try:
            parsed_expr: Optional[ast.Expression] = ast.parse(condition, mode="eval")
        except SyntaxError:
            parsed_expr = None

        rule_vars = _extract_condition_variables(condition)

        enriched_rule = dict(rule)
        enriched_rule["_parsed_expr"] = parsed_expr
        enriched_rule["_rule_vars"] = rule_vars
        compiled_rules.append(enriched_rule)

    return tuple(compiled_rules)


def load_rules(
    rules_yaml_path: str,
    primary_rules_json_path: str | Path = PRIMARY_RULES_JSON,
    extended_rules_yaml_path: str | Path = EXTENDED_RULES_YAML,
) -> List[Dict[str, Any]]:
    # Return shallow copies so callers can safely work with their own rule objects.
    return [
        dict(rule)
        for rule in _load_rules_cached(
            _preferred_rules_path(rules_yaml_path),
            str(primary_rules_json_path),
            str(extended_rules_yaml_path),
        )
    ]


def evaluate_rules(
    features: Dict[str, Any],
    rules: List[Dict[str, Any]],
    loan_context: Dict[str, Any] | None = None,
) -> List[RuleHit]:
    hits: List[RuleHit] = []
    eval_features = dict(features)
    eval_features.update(_build_underwriting_metrics(features, loan_context))

    salary_months = int(eval_features.get("metric_salary_months", 0) or 0)
    account_type = classify_account_type(eval_features, loan_context).get("account_type", "MIXED")
    loan_product = detect_loan_product(loan_context)
    behavioral_applicable = is_behavioral_factors_applicable(loan_product)

    _BEHAVIORAL_SUBCATEGORIES = {
        "lifestyle", "addiction", "spending_spike", "bill_regular",
        "salary_fluctuation", "salary_consistency", "salary_hike_drop",
        "job_switching", "salary_delay",
    }

    for rule in rules:
        rule_vars = rule.get("_rule_vars")
        if not rule_vars:
            continue

        # Skip behavioral/lifestyle/salary rules for EDUCATION_LOAN, BUSINESS_LOAN, GOLD_LOAN, BNPL
        if not behavioral_applicable:
            subcategory = str(rule.get("subcategory", "")).lower()
            if any(k in subcategory for k in _BEHAVIORAL_SUBCATEGORIES):
                continue

        if salary_months <= 0 and any(str(v).startswith("salary_") for v in rule_vars):
            continue

        if not all(v in eval_features for v in rule_vars):
            continue

        parsed = rule.get("_parsed_expr")
        if parsed is None:
            continue

        try:
            matched = bool(_SafeEvaluator(eval_features).visit(parsed))
        except Exception:
            continue

        if not matched:
            continue

        raw_impact = float(rule.get("score_impact", 0.0))
        impact, severity, status, note = _adjust_rule_for_context(
            rule=rule,
            matched_impact=raw_impact,
            account_type=account_type,
            loan_product=loan_product,
        )

        hits.append(
            RuleHit(
                rule_id=str(rule.get("rule_id", rule.get("id", ""))),
                impact=impact,
                reason=str(rule.get("reason", "")),
                category=str(rule.get("category", "")),
                severity=severity,
                subcategory=str(rule.get("subcategory", "")),
                status=status,
                note=note,
            )
        )

    return hits


def build_underwriting_decision(
    features: Dict[str, Any],
    rule_hits: List[RuleHit],
    loan_context: Dict[str, Any] | None = None,
) -> Dict[str, Any]:
    ctx = loan_context or {}
    account_meta = classify_account_type(features, ctx)
    account_type = account_meta["account_type"]
    loan_product = detect_loan_product(ctx)

    net_score = round(sum(float(h.impact) for h in rule_hits), 4)
    amount = _to_float(ctx.get("loan_amount", 0.0), 0.0)
    tenure = max(1.0, _to_float(ctx.get("tenure_months", 24.0), 24.0))
    monthly_emi = amount / tenure if amount > 0 else 0.0
    avg_monthly_inflow = _to_float(features.get("metric_total_inflow", 0.0), 0.0) / 12.0

    if account_type == "NON_SALARIED":
        if avg_monthly_inflow >= (1.5 * monthly_emi) and monthly_emi > 0:
            net_score = round(net_score + 0.05, 4)
        elif monthly_emi > 0:
            net_score = round(net_score - 0.05, 4)

    if loan_product == "MICRO_LOAN":
        high_crit = [
            h
            for h in rule_hits
            if h.severity == "critical"
            and (
                "combined_risk_intelligence" in h.category.lower()
                or "credit_behavior_intelligence" in h.category.lower()
            )
            and h.status == "APPLIED"
        ]
        if len(high_crit) >= 3:
            decision = "DECLINE"
        elif net_score >= -0.35:
            decision = "APPROVE"
        elif net_score >= -0.45:
            decision = "APPROVE_WITH_CONDITIONS"
        elif net_score >= -0.55:
            decision = "REFER"
        else:
            decision = "DECLINE"
    else:
        if net_score >= 0.0:
            decision = "APPROVE"
        elif net_score >= -0.25:
            decision = "APPROVE_WITH_CONDITIONS"
        elif net_score >= -0.40:
            decision = "REFER"
        else:
            decision = "DECLINE"

    top_risks = [
        f"{h.rule_id}: {h.reason}"
        for h in sorted(rule_hits, key=lambda x: x.impact)[:2]
        if h.impact < 0
    ]

    borrower_msg = (
        "Your repayment profile was checked using income consistency, cashflow stability, and debt behavior. "
        "The decision reflects adjusted thresholds for your account type and loan product. "
        "Improving monthly surplus and reducing stress transactions can improve outcomes."
    )

    underwriter_note = ""
    if decision in {"REFER", "DECLINE"}:
        underwriter_note = (
            f"Escalation suggested. account_type={account_type}, loan_product={loan_product}, net_score={net_score:.4f}."
        )

    return {
        "account_type": account_type,
        "confidence": account_meta["confidence"],
        "classification_reason": account_meta["reason"],
        "loan_product": loan_product,
        "net_score": net_score,
        "decision": decision,
        "top_risk_factors": top_risks,
        "borrower_friendly_explanation": borrower_msg,
        "underwriter_note": underwriter_note,
    }
