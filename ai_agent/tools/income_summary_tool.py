"""
IVL income verification summary and weighted composite (Decimal arithmetic).
"""

from __future__ import annotations

import time
from decimal import Decimal
from typing import Any

from ai_agent import config
from ai_agent.data_adapter import DataAdapter
from ai_agent.tools.base_tool import BaseTool, ToolResult


class IncomeSummaryTool(BaseTool):
    name = "get_income_summary"
    description = (
        "Retrieves computed income verification scores for all IVL parameters for a loan application"
    )
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
        raw = self._adapter.get_ivl_score(arn)
        params = raw.get("params") or {}
        category_avgs: dict[str, Decimal] = {k: Decimal("0") for k in config.IVL_CATEGORY_WEIGHTS}
        counts: dict[str, int] = {k: 0 for k in config.IVL_CATEGORY_WEIGHTS}

        for pid, row in params.items():
            cat = pid.split("-")[0]
            if cat not in category_avgs:
                continue
            score = row["score"] if isinstance(row, dict) else row
            if not isinstance(score, Decimal):
                score = Decimal(str(score))
            category_avgs[cat] += score
            counts[cat] += 1

        for cat in category_avgs:
            if counts[cat] > 0:
                category_avgs[cat] = category_avgs[cat] / Decimal(counts[cat])

        composite = Decimal("0")
        category_scores_out: dict[str, float] = {}
        for cat, w in config.IVL_CATEGORY_WEIGHTS.items():
            composite += category_avgs[cat] * w
            category_scores_out[cat] = float(category_avgs[cat])

        flat: list[tuple[str, Decimal]] = []
        for pid, row in params.items():
            score = row["score"] if isinstance(row, dict) else row
            if not isinstance(score, Decimal):
                score = Decimal(str(score))
            flat.append((pid, score))
        flat.sort(key=lambda x: x[1])
        top_risk = [p for p, _ in flat[:5]]
        flat.sort(key=lambda x: x[1], reverse=True)
        top_strength = [p for p, _ in flat[:3]]

        foir = raw.get("foir_pct")
        if foir is not None and not isinstance(foir, Decimal):
            foir = Decimal(str(foir))
        amni = raw.get("amni")
        if amni is not None and not isinstance(amni, Decimal):
            amni = Decimal(str(amni))

        cv = raw.get("income_cv_pct")
        if cv is not None and not isinstance(cv, Decimal):
            cv = Decimal(str(cv))
        if cv is None:
            cv = Decimal("0")
        if cv < Decimal("15"):
            stability = "STABLE"
        elif cv < Decimal("30"):
            stability = "VARIABLE"
        else:
            stability = "IRREGULAR"

        data = {
            "composite_score": float(composite),
            "category_scores": category_scores_out,
            "top_risk_params": top_risk,
            "top_strength_params": top_strength,
            "foir": float(foir) if foir is not None else None,
            "amni": float(amni) if amni is not None else None,
            "income_stability": stability,
        }
        latency = (time.perf_counter() - t0) * 1000
        self._log_tool(arn, args, f"composite={data['composite_score']:.2f}", latency)
        return ToolResult(success=True, data=data, metadata={"latency_ms": latency})
