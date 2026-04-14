"""
Data access abstraction — swap real DB implementation later without changing agents/tools.
"""

from __future__ import annotations

import hashlib
import logging
from abc import ABC, abstractmethod
from decimal import Decimal
from typing import Any

from ai_agent.tests import mock_data as md

logger = logging.getLogger(__name__)


class DataAdapter(ABC):
    """Abstract interface for all persistence reads/writes used by the agent layer."""

    @abstractmethod
    def get_application(self, arn: str) -> dict[str, Any]:
        pass

    @abstractmethod
    def get_ivl_score(self, arn: str) -> dict[str, Any]:
        pass

    @abstractmethod
    def get_fraud_signals(self, arn: str) -> list[dict[str, Any]]:
        pass

    @abstractmethod
    def get_rule_violations(self, arn: str) -> dict[str, Any]:
        pass

    @abstractmethod
    def get_borrower_documents(self, arn: str) -> list[dict[str, Any]]:
        pass

    @abstractmethod
    def update_agent_analysis(self, arn: str, analysis_result: dict[str, Any]) -> bool:
        pass


def _scenario_key(arn: str) -> str:
    u = arn.upper()
    if u.startswith("APPROVE"):
        return "approve"
    if u.startswith("REVIEW"):
        return "review"
    if u.startswith("REJECT"):
        return "reject"
    return "generic"


def _hash_seed(arn: str) -> int:
    return int(hashlib.sha256(arn.encode("utf-8")).hexdigest()[:8], 16)


class MockDataAdapter(DataAdapter):
    """
    In-memory adapter driven by ARN prefix (APPROVE/REVIEW/REJECT) or deterministic generic data.
    Full ARNs for the three canonical scenarios live in tests/mock_data.py only.
    """

    def __init__(self) -> None:
        self._analysis_log: dict[str, dict[str, Any]] = {}

    def get_application(self, arn: str) -> dict[str, Any]:
        key = _scenario_key(arn)
        if key == "approve":
            return md.application_record(md.APPROVE_SCENARIO, arn)
        if key == "review":
            return md.application_record(md.REVIEW_SCENARIO, arn)
        if key == "reject":
            return md.application_record(md.REJECT_SCENARIO, arn)
        seed = _hash_seed(arn)
        inc = Decimal(25000 + (seed % 50000))
        return {
            "arn": arn,
            "borrower_name": f"Applicant-{seed % 10000}",
            "loan_type": "Personal Loan",
            "loan_amount": Decimal(100000 + (seed % 900000)),
            "monthly_income_declared": inc,
            "cibil": 550 + (seed % 200),
            "foir_pct": Decimal(str(40 + (seed % 30))),
            "composite_score": Decimal(str(35 + (seed % 50))),
            "status": "REVIEW",
        }

    def get_ivl_score(self, arn: str) -> dict[str, Any]:
        key = _scenario_key(arn)
        if key == "approve":
            scores = md.ivl_scores_approve()
        elif key == "review":
            scores = md.ivl_scores_review()
        elif key == "reject":
            scores = md.ivl_scores_reject()
        else:
            scores = md.ivl_scores_generic(_hash_seed(arn))
        app = self.get_application(arn)
        income_cv = (
            md.APPROVE_SCENARIO["income_cv_pct"]
            if key == "approve"
            else md.REVIEW_SCENARIO["income_cv_pct"]
            if key == "review"
            else md.REJECT_SCENARIO["income_cv_pct"]
            if key == "reject"
            else Decimal(str(15 + (_hash_seed(arn) % 25)))
        )
        return {
            "arn": arn,
            "params": scores,
            "foir_pct": app.get("foir_pct"),
            "amni": app.get("monthly_income_declared"),
            "income_cv_pct": income_cv,
        }

    def get_fraud_signals(self, arn: str) -> list[dict[str, Any]]:
        key = _scenario_key(arn)
        if key == "approve":
            return md.fraud_signals_approve()
        if key == "review":
            return md.fraud_signals_review()
        if key == "reject":
            return md.fraud_signals_reject()
        return []

    def get_rule_violations(self, arn: str) -> dict[str, Any]:
        key = _scenario_key(arn)
        if key == "approve":
            return md.rule_violations_approve()
        if key == "review":
            return md.rule_violations_review()
        if key == "reject":
            return md.rule_violations_reject()
        seed = _hash_seed(arn)
        hard = []
        if seed % 17 == 0:
            hard.append(
                {
                    "rule_id": "HR-06",
                    "name": "Bureau minimum",
                    "triggered_value": Decimal("540"),
                    "threshold": Decimal("550"),
                    "detail": "Synthetic generic breach",
                }
            )
        return {
            "hard": hard,
            "soft": [],
            "decision": "REJECT" if hard else "REVIEW",
            "primary_rejection_reason": hard[0]["detail"] if hard else None,
        }

    def get_borrower_documents(self, arn: str) -> list[dict[str, Any]]:
        return md.documents_for_scenario(arn)

    def update_agent_analysis(self, arn: str, analysis_result: dict[str, Any]) -> bool:
        self._analysis_log[arn] = analysis_result
        logger.info("Stored agent analysis for %s keys=%s", arn, list(analysis_result.keys()))
        return True
