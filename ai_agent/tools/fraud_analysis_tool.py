"""
Fraud signals aggregation for an application.
"""

from __future__ import annotations

import time
from decimal import Decimal
from typing import Any

from ai_agent.data_adapter import DataAdapter
from ai_agent.tools.base_tool import BaseTool, ToolResult


def _to_decimal(val: Any) -> Decimal:
    if isinstance(val, Decimal):
        return val
    return Decimal(str(val))


class FraudAnalysisTool(BaseTool):
    name = "get_fraud_analysis"
    description = "Returns fraud detection results and suspicious transaction signals for an application"
    parameters = {
        "type": "object",
        "properties": {"arn": {"type": "string"}},
        "required": ["arn"],
    }

    def __init__(self, adapter: DataAdapter) -> None:
        self._adapter = adapter

    def execute(self, args: dict[str, Any]) -> ToolResult:
        t0 = time.perf_counter()
        arn = args["arn"]
        signals = self._adapter.get_fraud_signals(arn)
        sev_map = {"low": Decimal("0.08"), "medium": Decimal("0.18"), "high": Decimal("0.35")}
        prob = Decimal("0")
        for s in signals:
            prob += sev_map.get(s.get("severity", "low"), Decimal("0.1"))
        prob = min(Decimal("1"), prob)

        if prob < Decimal("0.1"):
            overall = "CLEAR"
        elif prob < Decimal("0.25"):
            overall = "SUSPICIOUS"
        elif prob < Decimal("0.5"):
            overall = "HIGH_RISK"
        else:
            overall = "BLOCK"

        doc_ok = not any(s.get("type") == "document_tamper" for s in signals)
        balance_inf = any(s.get("type") == "balance_spike" for s in signals)
        structuring = any(s.get("type") == "structuring" for s in signals)

        if overall == "BLOCK":
            rec = "BLOCK"
        elif overall in ("HIGH_RISK", "SUSPICIOUS"):
            rec = "REVIEW"
        else:
            rec = "PASS"

        norm_signals = []
        for s in signals:
            norm_signals.append(
                {
                    "id": s.get("id"),
                    "type": s.get("type"),
                    "severity": s.get("severity"),
                    "description": s.get("description"),
                    "value": float(_to_decimal(s["value"])) if "value" in s else None,
                }
            )

        data = {
            "fraud_probability": float(prob),
            "overall_risk": overall,
            "signals": norm_signals,
            "document_integrity": doc_ok,
            "balance_inflation_detected": balance_inf,
            "structuring_detected": structuring,
            "recommendation": rec,
        }
        latency = (time.perf_counter() - t0) * 1000
        self._log_tool(arn, args, f"risk={overall} prob={prob}", latency)
        return ToolResult(success=True, data=data, metadata={"latency_ms": latency})
