"""
Policy / RBI document retrieval from the global knowledge namespace.
"""

from __future__ import annotations

import time
from typing import Any

from ai_agent import config
from ai_agent.rag.embedder import Embedder
from ai_agent.rag.retriever import Retriever
from ai_agent.tools.base_tool import BaseTool, ToolResult


class PolicyRagTool(BaseTool):
    name = "search_policy"
    description = (
        "Searches the indexed policy corpus: RBI digital lending excerpts, hard/soft rule sheets, "
        "product/IVL parameters, and underwriting rules (KYC e.g. PAN/Aadhaar, credit FOIR/CIBIL, fraud/stacking). "
        "Use for citations and threshold wording; do not invent rules not present in retrieved chunks."
    )
    parameters = {
        "type": "object",
        "properties": {"query": {"type": "string"}},
        "required": ["query"],
    }

    def __init__(self, embedder: Embedder, retriever: Retriever) -> None:
        self._embedder = embedder
        self._retriever = retriever

    def execute(self, args: dict[str, Any]) -> ToolResult:
        t0 = time.perf_counter()
        query = args["query"]
        emb = self._embedder.embed(query)
        chunks = self._retriever.search(emb, "policy_global", top_k=config.RAG_TOP_K)
        if not chunks:
            chunks = self._retriever.keyword_search(query, "policy_global", top_k=config.RAG_TOP_K)
        refs = []
        for c in chunks:
            refs.append(
                {
                    "text": c.text,
                    "source": c.source,
                    "score": c.score,
                    "regulation_reference": c.metadata.get("reg_ref", c.source),
                }
            )
        data = {"results": refs}
        latency = (time.perf_counter() - t0) * 1000
        self._log_tool(None, args, f"hits={len(refs)}", latency)
        return ToolResult(success=True, data=data, metadata={"latency_ms": latency})
