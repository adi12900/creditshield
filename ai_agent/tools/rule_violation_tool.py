"""
Hard/soft rule violations with optional policy RAG citations.
"""

from __future__ import annotations

import time
from decimal import Decimal
from typing import Any

from ai_agent.data_adapter import DataAdapter
from ai_agent.rag.embedder import Embedder
from ai_agent.rag.retriever import Retriever
from ai_agent.tools.base_tool import BaseTool, ToolResult

# Richer queries than rule_id alone so embedding/keyword retrieval hits rules/*.txt and hard_rules.
_RULE_ID_RAG_QUERY: dict[str, str] = {
    "HR-01": "HR-01 FOIR 65 percent maximum unsecured personal loan obligations income",
    "HR-02": "HR-02 document tamper integrity salary bank statement ITR",
    "HR-03": "HR-03 NPA write-off guarantor 36 months bureau",
    "HR-04": "HR-04 declared verified income variance 50 percent",
    "HR-05": "HR-05 loan stacking new loans 90 days three unsecured",
    "HR-06": "HR-06 CIBIL bureau score 550 minimum unsecured personal",
    "HR-07": "HR-07 income below product minimum verified monthly",
    "SR-01": "SR-01 income variability coefficient CV manual review",
}


class RuleViolationTool(BaseTool):
    name = "get_rule_violations"
    description = (
        "Returns all hard and soft rule violations triggered for this application with regulation citations"
    )
    parameters = {
        "type": "object",
        "properties": {"arn": {"type": "string"}},
        "required": ["arn"],
    }

    def __init__(self, adapter: DataAdapter, embedder: Embedder, retriever: Retriever) -> None:
        self._adapter = adapter
        self._embedder = embedder
        self._retriever = retriever

    def _regulation_snippet(self, rule_id: str) -> tuple[str, str]:
        hint = _RULE_ID_RAG_QUERY.get(
            rule_id,
            f"{rule_id} credit underwriting policy India RBI digital lending",
        )
        q = self._embedder.embed(hint)
        chunks = self._retriever.search(q, "policy_global", top_k=3)
        if not chunks:
            chunks = self._retriever.keyword_search(rule_id, "policy_global", top_k=3)
        if not chunks:
            chunks = self._retriever.keyword_search(hint, "policy_global", top_k=3)
        if chunks:
            c0 = chunks[0]
            text = c0.text.strip().replace("\n", " ")[:400]
            return text, str(c0.source)
        return (
            "Regulatory reference: RBI Master Direction — Digital Lending (2022) and internal credit policy.",
            "rbi_digital_lending_2022.txt",
        )

    def execute(self, args: dict[str, Any]) -> ToolResult:
        t0 = time.perf_counter()
        arn = args["arn"]
        viol = self._adapter.get_rule_violations(arn)
        hard_out = []
        for h in viol.get("hard", []):
            rid = h["rule_id"]
            snippet, src = self._regulation_snippet(rid)
            hard_out.append(
                {
                    "rule_id": rid,
                    "rule_name": h.get("name", rid),
                    "triggered_value": float(Decimal(str(h["triggered_value"]))),
                    "threshold": float(Decimal(str(h["threshold"]))),
                    "detail": h.get("detail", ""),
                    "regulation_ref": snippet,
                    "source": src,
                    "is_fatal": True,
                }
            )
        soft_out = []
        for s in viol.get("soft", []):
            rid = s["rule_id"]
            snippet, src = self._regulation_snippet(rid)
            soft_out.append(
                {
                    "rule_id": rid,
                    "rule_name": s.get("name", rid),
                    "triggered_value": float(Decimal(str(s["triggered_value"]))),
                    "threshold": float(Decimal(str(s["threshold"]))),
                    "detail": s.get("detail", ""),
                    "regulation_ref": snippet,
                    "source": src,
                    "is_fatal": False,
                }
            )
        data = {
            "hard_violations": hard_out,
            "soft_violations": soft_out,
            "decision": viol.get("decision", "REVIEW"),
            "primary_rejection_reason": viol.get("primary_rejection_reason"),
        }
        latency = (time.perf_counter() - t0) * 1000
        self._log_tool(
            arn,
            args,
            f"decision={data['decision']} hard={len(hard_out)} soft={len(soft_out)}",
            latency,
        )
        return ToolResult(success=True, data=data, metadata={"latency_ms": latency})
