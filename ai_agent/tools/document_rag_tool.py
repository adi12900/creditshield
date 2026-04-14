"""
Semantic (or keyword) search over borrower document chunks in the vector store.
"""

from __future__ import annotations

import time
from typing import Any

from ai_agent import config
from ai_agent.data_adapter import DataAdapter
from ai_agent.rag.embedder import Embedder
from ai_agent.rag.retriever import Retriever
from ai_agent.tools.base_tool import BaseTool, ToolResult


class DocumentRagTool(BaseTool):
    name = "search_borrower_documents"
    description = "Semantic search over borrower's uploaded documents — salary slips, bank statements, ITR"
    parameters = {
        "type": "object",
        "properties": {
            "arn": {"type": "string"},
            "query": {"type": "string"},
        },
        "required": ["arn", "query"],
    }

    def __init__(self, adapter: DataAdapter, embedder: Embedder, retriever: Retriever) -> None:
        self._adapter = adapter
        self._embedder = embedder
        self._retriever = retriever

    def execute(self, args: dict[str, Any]) -> ToolResult:
        t0 = time.perf_counter()
        arn = args["arn"]
        query = args["query"]
        ns = f"borrower_{arn}"
        emb = self._embedder.embed(query)
        chunks = self._retriever.search(emb, ns, top_k=config.RAG_TOP_K)
        if not chunks:
            chunks = self._retriever.keyword_search(query, ns, top_k=config.RAG_TOP_K)
        if not chunks:
            docs = self._adapter.get_borrower_documents(arn)
            fallback = [
                {
                    "text": f"Metadata hit: {d.get('type')} file={d.get('file')}",
                    "source": d.get("doc_id", "unknown"),
                    "score": 0.1,
                }
                for d in docs
            ]
            data = {"chunks": fallback, "fallback": "metadata_only"}
        else:
            data = {
                "chunks": [
                    {"text": c.text, "source": c.source, "score": c.score, "metadata": c.metadata}
                    for c in chunks
                ],
                "fallback": None,
            }
        latency = (time.perf_counter() - t0) * 1000
        self._log_tool(arn, args, f"hits={len(data['chunks'])}", latency)
        return ToolResult(success=True, data=data, metadata={"latency_ms": latency})
