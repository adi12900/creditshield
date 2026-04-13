"""
Hardcoded ARNs and complete mock scenarios for tests and MockDataAdapter.
"""

from decimal import Decimal


def _param_ids() -> list[str]:
    ids: list[str] = []
    for p in range(1, 8):
        ids.append(f"IS-{p:02d}")
    for p in range(1, 8):
        ids.append(f"CF-{p:02d}")
    for p in range(1, 8):
        ids.append(f"EP-{p:02d}")
    for p in range(1, 8):
        ids.append(f"ST-{p:02d}")
    for p in range(1, 8):
        ids.append(f"FD-{p:02d}")
    for p in range(1, 7):
        ids.append(f"LB-{p:02d}")
    for p in range(1, 8):
        ids.append(f"DF-{p:02d}")
    return ids


IVL_PARAM_IDS: list[str] = _param_ids()


def _category_for_param(pid: str) -> str:
    return pid.split("-")[0]


def _build_ivl_from_category_scores(
    category_base: dict[str, Decimal],
    jitter: Decimal = Decimal("0"),
) -> dict[str, dict[str, Decimal]]:
    out: dict[str, dict[str, Decimal]] = {}
    for pid in IVL_PARAM_IDS:
        cat = _category_for_param(pid)
        base = category_base.get(cat, Decimal("50"))
        val = max(Decimal("0"), min(Decimal("100"), base + jitter))
        out[pid] = {"score": val, "value": val}
    return out


APPROVE_SCENARIO = {
    "arn": "APPROVE-2026-001",
    "borrower_name": "Rahul Sharma",
    "monthly_income": Decimal("75000"),
    "loan_type": "Personal Loan",
    "loan_amount": Decimal("800000"),
    "foir_pct": Decimal("38"),
    "cibil": 762,
    "composite_score": Decimal("78"),
    "expected_decision": "APPROVE",
    "income_cv_pct": Decimal("12"),
    "amni": Decimal("72000"),
}

REVIEW_SCENARIO = {
    "arn": "REVIEW-2026-002",
    "borrower_name": "Priya Patel",
    "monthly_income": Decimal("32000"),
    "loan_type": "Personal Loan",
    "loan_amount": Decimal("300000"),
    "foir_pct": Decimal("52"),
    "cibil": 641,
    "composite_score": Decimal("43"),
    "expected_decision": "REVIEW",
    "income_cv_pct": Decimal("34"),
    "amni": Decimal("30000"),
}

REJECT_SCENARIO = {
    "arn": "REJECT-2026-003",
    "borrower_name": "Amit Kumar",
    "monthly_income": Decimal("28000"),
    "loan_type": "Personal Loan",
    "loan_amount": Decimal("500000"),
    "foir_pct": Decimal("71"),
    "cibil": 531,
    "composite_score": Decimal("18"),
    "expected_decision": "REJECT",
    "income_cv_pct": Decimal("22"),
    "new_loans_90d": 4,
    "amni": Decimal("26000"),
}


def ivl_scores_approve() -> dict[str, dict[str, Decimal]]:
    return _build_ivl_from_category_scores(
        {
            "IS": Decimal("88"),
            "CF": Decimal("82"),
            "EP": Decimal("80"),
            "ST": Decimal("85"),
            "FD": Decimal("84"),
            "LB": Decimal("78"),
            "DF": Decimal("76"),
        }
    )


def ivl_scores_review() -> dict[str, dict[str, Decimal]]:
    return _build_ivl_from_category_scores(
        {
            "IS": Decimal("52"),
            "CF": Decimal("48"),
            "EP": Decimal("55"),
            "ST": Decimal("50"),
            "FD": Decimal("58"),
            "LB": Decimal("60"),
            "DF": Decimal("62"),
        }
    )


def ivl_scores_reject() -> dict[str, dict[str, Decimal]]:
    return _build_ivl_from_category_scores(
        {
            "IS": Decimal("35"),
            "CF": Decimal("30"),
            "EP": Decimal("40"),
            "ST": Decimal("28"),
            "FD": Decimal("32"),
            "LB": Decimal("25"),
            "DF": Decimal("38"),
        }
    )


def ivl_scores_generic(seed: int) -> dict[str, dict[str, Decimal]]:
    """Deterministic IVL params for non-scenario ARNs (tests / demos)."""

    def b(shift: int) -> Decimal:
        return Decimal(str(45 + ((seed >> shift) % 20)))

    return _build_ivl_from_category_scores(
        {
            "IS": b(3),
            "CF": b(6),
            "EP": b(9),
            "ST": b(12),
            "FD": b(15),
            "LB": b(18),
            "DF": b(21),
        }
    )


def fraud_signals_approve() -> list[dict]:
    return []


def fraud_signals_review() -> list[dict]:
    return [
        {
            "id": "SIG-BAL-01",
            "type": "balance_spike",
            "severity": "medium",
            "description": "Closing balance increased 2.1x vs trailing 6M average",
            "value": Decimal("2.1"),
        }
    ]


def fraud_signals_reject() -> list[dict]:
    return [
        {
            "id": "SIG-STACK-01",
            "type": "loan_stacking",
            "severity": "high",
            "description": "Multiple new unsecured facilities in short window",
            "value": Decimal("4"),
        }
    ]


def rule_violations_approve() -> dict:
    return {
        "hard": [],
        "soft": [],
        "decision": "APPROVE",
        "primary_rejection_reason": None,
    }


def rule_violations_review() -> dict:
    return {
        "hard": [],
        "soft": [
            {
                "rule_id": "SR-01",
                "name": "Income variability",
                "triggered_value": Decimal("34"),
                "threshold": Decimal("30"),
                "detail": "Income CV above manual review threshold",
            }
        ],
        "decision": "REVIEW",
        "primary_rejection_reason": None,
    }


def rule_violations_reject() -> dict:
    return {
        "hard": [
            {
                "rule_id": "HR-01",
                "name": "FOIR breach",
                "triggered_value": Decimal("71"),
                "threshold": Decimal("65"),
                "detail": "FOIR exceeds maximum for product",
            },
            {
                "rule_id": "HR-05",
                "name": "Loan stacking",
                "triggered_value": Decimal("4"),
                "threshold": Decimal("3"),
                "detail": "Three or more new loans in 90 days",
            },
            {
                "rule_id": "HR-06",
                "name": "Bureau minimum",
                "triggered_value": Decimal("531"),
                "threshold": Decimal("550"),
                "detail": "CIBIL below minimum for unsecured personal loan",
            },
        ],
        "soft": [],
        "decision": "REJECT",
        "primary_rejection_reason": "HR-01: FOIR above 65%",
    }


def documents_for_scenario(arn_key: str) -> list[dict]:
    base = [
        {"doc_id": "DOC-PAN", "type": "PAN", "file": "pan.pdf", "arn": arn_key},
        {"doc_id": "DOC-BANK", "type": "BANK_STATEMENT", "file": "stmt.pdf", "arn": arn_key},
    ]
    if arn_key.startswith("REVIEW"):
        base.append({"doc_id": "DOC-GST", "type": "GST", "file": None, "arn": arn_key})
    return base


def application_record(scenario: dict, arn: str) -> dict:
    return {
        "arn": arn,
        "borrower_name": scenario["borrower_name"],
        "loan_type": scenario["loan_type"],
        "loan_amount": scenario["loan_amount"],
        "monthly_income_declared": scenario["monthly_income"],
        "cibil": scenario["cibil"],
        "foir_pct": scenario["foir_pct"],
        "composite_score": scenario["composite_score"],
        "status": scenario["expected_decision"],
    }
