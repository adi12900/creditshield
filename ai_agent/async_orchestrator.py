"""
Async wrapper around the synchronous AgentOrchestrator for FastAPI.
"""

from __future__ import annotations

import asyncio
import os
from concurrent.futures import ThreadPoolExecutor
from functools import partial

from ai_agent.pipeline.agent_orchestrator import AgentOrchestrator
from ai_agent.pipeline.response_formatter import AgentResponse

_orchestrator_instance: AsyncAgentOrchestrator | None = None


class AsyncAgentOrchestrator:
    def __init__(self) -> None:
        self._sync_orchestrator = AgentOrchestrator()
        self._executor = ThreadPoolExecutor(max_workers=4)

    async def analyse_application(self, arn: str, query: str, language: str = "en") -> AgentResponse:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(
            self._executor,
            partial(self._sync_orchestrator.analyse_application, arn, query, language),
        )

    async def explain_for_borrower(self, arn: str, language: str = "en") -> str:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(
            self._executor,
            partial(self._sync_orchestrator.explain_for_borrower, arn, language),
        )

    async def health_check(self) -> dict:
        def _sync_health() -> dict:
            orch = self._sync_orchestrator
            client = orch._client  # noqa: SLF001 — integration surface to sync orchestrator
            kb = orch._kb  # noqa: SLF001
            tools = orch._build_tools()  # noqa: SLF001
            return {
                "mock_mode": client.mock_mode,
                "rag_chunks": len(kb.retriever._texts),  # noqa: SLF001
                "rag_index_built": bool(getattr(orch, "_policy_index_built", False)),
                "tools_available": [t.name for t in tools],
                "bedrock_region": os.getenv("AWS_REGION", "ap-south-1"),
                "model_id": os.getenv("BEDROCK_MODEL_ID", "meta.llama3-70b-instruct-v1:0"),
            }

        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(self._executor, _sync_health)


def get_orchestrator() -> AsyncAgentOrchestrator:
    global _orchestrator_instance
    if _orchestrator_instance is None:
        _orchestrator_instance = AsyncAgentOrchestrator()
    return _orchestrator_instance
