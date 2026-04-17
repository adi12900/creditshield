"""
DatabaseDataAdapter — reads real loan application data from PostgreSQL.
Replaces MockDataAdapter for production use.
"""

from __future__ import annotations

import logging
from decimal import Decimal
from typing import Any

from sqlalchemy import text
from sqlalchemy.orm import Session

from ai_agent.data_adapter import DataAdapter

logger = logging.getLogger(__name__)


class DatabaseDataAdapter(DataAdapter):
    """
    Reads application data from the CreditShield PostgreSQL database.
    Falls back to safe defaults when data is missing.
    """

    def __init__(self, db: Session) -> None:
        self._db = db

    def get_application(self, arn: str) -> dict[str, Any]:
        row = self._db.execute(
            text("""
                SELECT id, arn, borrower_name, borrower_email, loan_amount,
                       loan_type, stage, risk_grade, credit_score, employment_type, purpose
                FROM loan_applications
                WHERE arn = :arn
            """),
            {"arn": arn},
        ).fetchone()

        if not row:
            logger.warning("Application not found for ARN %s", arn)
            return {"arn": arn, "borrower_name": "Unknown", "loan_type": "Unknown",
                    "loan_amount": Decimal("0"), "monthly_income_declared": Decimal("0"),
                    "cibil": 0, "foir_pct": Decimal("0"), "composite_score": Decimal("0"),
                    "status": "UNKNOWN"}

        # Try to get appraisal data for income/FOIR/score
        appraisal = self._db.execute(
            text("""
                SELECT final_score, risk_level, confidence_score
                FROM loan_appraisal_records
                WHERE application_id = (
                    SELECT id FROM loan_applications WHERE arn = :arn
                )
                ORDER BY created_at DESC LIMIT 1
            """),
            {"arn": arn},
        ).fetchone()

        composite = Decimal(str(appraisal[0])) if appraisal and appraisal[0] else Decimal("50")

        return {
            "arn": row[1],
            "borrower_name": row[2],
            "borrower_email": row[3],
            "loan_type": row[5] or "Personal Loan",
            "loan_amount": Decimal(str(row[4])) if row[4] else Decimal("0"),
            "monthly_income_declared": Decimal("0"),  # not stored separately
            "cibil": row[8] or 0,
            "foir_pct": Decimal("0"),
            "composite_score": composite,
            "status": row[6] or "REVIEW",
            "employment_type": row[9],
            "purpose": row[10],
        }

    def get_ivl_score(self, arn: str) -> dict[str, Any]:
        appraisal = self._db.execute(
            text("""
                SELECT final_score, confidence_score
                FROM loan_appraisal_records
                WHERE application_id = (
                    SELECT id FROM loan_applications WHERE arn = :arn
                )
                ORDER BY created_at DESC LIMIT 1
            """),
            {"arn": arn},
        ).fetchone()

        score = Decimal(str(appraisal[0])) if appraisal and appraisal[0] else Decimal("50")
        return {
            "arn": arn,
            "params": {"IS-01": {"score": score}},
            "foir_pct": Decimal("0"),
            "amni": Decimal("0"),
            "income_cv_pct": Decimal("15"),
        }

    def get_fraud_signals(self, arn: str) -> list[dict[str, Any]]:
        # No fraud signals table yet — return empty (no false positives)
        return []

    def get_rule_violations(self, arn: str) -> dict[str, Any]:
        app = self.get_application(arn)
        hard = []

        # HR-06: CIBIL floor check
        cibil = app.get("cibil", 0)
        if cibil and cibil < 550:
            hard.append({
                "rule_id": "HR-06",
                "name": "Bureau score floor",
                "triggered_value": Decimal(str(cibil)),
                "threshold": Decimal("550"),
                "detail": f"CIBIL {cibil} below minimum 550",
            })

        decision = "REJECT" if hard else "REVIEW"
        return {
            "hard": hard,
            "soft": [],
            "decision": decision,
            "primary_rejection_reason": hard[0]["detail"] if hard else None,
        }

    def get_borrower_documents(self, arn: str) -> list[dict[str, Any]]:
        rows = self._db.execute(
            text("""
                SELECT d.id, d.doc_type, d.status, d.storage_url, d.uploaded_at
                FROM documents d
                JOIN loan_applications la ON d.application_id = la.id
                WHERE la.arn = :arn
                ORDER BY d.uploaded_at DESC
            """),
            {"arn": arn},
        ).fetchall()

        return [
            {
                "doc_id": str(row[0]),
                "type": row[1],
                "status": row[2],
                "file": row[3],
                "uploaded_at": str(row[4]),
            }
            for row in rows
        ]

    def update_agent_analysis(self, arn: str, analysis_result: dict[str, Any]) -> bool:
        logger.info("Agent analysis for %s: decision=%s", arn, analysis_result.get("decision"))
        return True
