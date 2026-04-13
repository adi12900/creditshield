"""
Counterfactual / improvement tips using Decimal precision.
"""

from __future__ import annotations

import time
from decimal import Decimal
from typing import Any

from ai_agent.data_adapter import DataAdapter
from ai_agent.tools.base_tool import BaseTool, ToolResult

# Minimum monthly income hints by product (illustrative — align with loan_products.txt).
_MIN_INCOME: dict[str, Decimal] = {
    "Personal Loan": Decimal("25000"),
    "Home Loan": Decimal("35000"),
    "MSME": Decimal("40000"),
    "Vehicle Loan": Decimal("20000"),
    "BNPL": Decimal("15000"),
}
_MAX_FOIR = Decimal("65")


class ImprovementTipsTool(BaseTool):
    name = "get_improvement_tips"
    description = "Generates actionable counterfactual recommendations — what the borrower can change to qualify"
    parameters = {
        "type": "object",
        "properties": {
            "arn": {"type": "string"},
            "loan_type": {
                "type": "string",
                "description": "Product line; optional — defaults from application if omitted",
            },
        },
        "required": ["arn"],
    }

    def __init__(self, adapter: DataAdapter) -> None:
        self._adapter = adapter

    def execute(self, args: dict[str, Any]) -> ToolResult:
        t0 = time.perf_counter()
        arn = args["arn"]
        app = self._adapter.get_application(arn)
        loan_type = (
            (args.get("loan_type") or "").strip()
            or str(app.get("loan_type") or "Personal Loan")
        )
        viol = self._adapter.get_rule_violations(arn)
        income = Decimal(str(app.get("monthly_income_declared", "0")))
        foir = Decimal(str(app.get("foir_pct", "0")))
        cibil = int(app.get("cibil", 0))

        tips: list[dict[str, Any]] = []
        priority = 1

        obligations = (income * foir / Decimal("100")).quantize(Decimal("0.01"))
        if foir > _MAX_FOIR and income > 0:
            target_obligations = income * _MAX_FOIR / Decimal("100")
            reduction = (obligations - target_obligations).quantize(Decimal("0.01"))
            tips.append(
                {
                    "priority": priority,
                    "action": "Reduce monthly credit obligations (close or consolidate loans)",
                    "impact": f"FOIR drops from {float(foir):.1f}% toward {_MAX_FOIR}% if obligations fall by ₹{float(reduction):,.0f}/month",
                    "time_required": "1-3 months",
                    "difficulty": "medium",
                }
            )
            priority += 1

        min_inc = _MIN_INCOME.get(loan_type, Decimal("25000"))
        if income < min_inc:
            gap = (min_inc - income).quantize(Decimal("0.01"))
            tips.append(
                {
                    "priority": priority,
                    "action": "Increase verifiable net monthly income",
                    "impact": f"Need roughly ₹{float(gap):,.0f}/month more documented income for {loan_type}",
                    "time_required": "3-6 months",
                    "difficulty": "high",
                }
            )
            priority += 1

        unsecured_min = 550
        if cibil < unsecured_min:
            tips.append(
                {
                    "priority": priority,
                    "action": "Improve bureau score before reapplication",
                    "impact": f"CIBIL gap ~{unsecured_min - cibil} points vs typical unsecured minimum",
                    "time_required": "6-12 months",
                    "difficulty": "medium",
                }
            )
            priority += 1

        if any(v.get("rule_id") == "HR-05" for v in viol.get("hard", [])):
            tips.append(
                {
                    "priority": priority,
                    "action": "Stop new borrowing; reduce loan stacking",
                    "impact": "Lowers HR-05 stacking risk after a cooling period",
                    "time_required": "90-180 days",
                    "difficulty": "medium",
                }
            )
            priority += 1

        can_qualify = foir <= _MAX_FOIR and cibil >= unsecured_min and income >= min_inc
        timeline = "unlikely"
        if can_qualify:
            timeline = "immediate"
        elif tips:
            timeline = "6 months"

        data = {
            "can_qualify_in_future": bool(tips) or can_qualify,
            "estimated_timeline": timeline,
            "tips": tips,
            "minimum_income_needed": float(min_inc) if income < min_inc else None,
            "reapply_after": "180 days" if viol.get("hard") else "30-90 days",
        }
        latency = (time.perf_counter() - t0) * 1000
        self._log_tool(arn, args, f"tips={len(tips)}", latency)
        return ToolResult(success=True, data=data, metadata={"latency_ms": latency})
