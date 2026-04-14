"""
Main entrypoint for the standalone agentic layer.
"""

from __future__ import annotations

import logging
import re
import time
from typing import Any

from ai_agent import config
from ai_agent.bedrock.client import BedrockClient
from ai_agent.bedrock import prompts
from ai_agent.bedrock.llama_agent import LlamaAgent
from ai_agent.data_adapter import DataAdapter, MockDataAdapter
from ai_agent.mock_mode import MOCK_SCENARIO_NARRATIVES
from ai_agent.pipeline.response_formatter import AgentResponse, ResponseFormatter
from ai_agent.rag.embedder import Embedder
from ai_agent.rag.knowledge_base import KnowledgeBase
from ai_agent.rag.retriever import Retriever
from ai_agent.tools.counterfactual_tool import ImprovementTipsTool
from ai_agent.tools.document_rag_tool import DocumentRagTool
from ai_agent.tools.fraud_analysis_tool import FraudAnalysisTool
from ai_agent.tools.income_summary_tool import IncomeSummaryTool
from ai_agent.tools.policy_rag_tool import PolicyRagTool
from ai_agent.tools.rule_violation_tool import RuleViolationTool

logger = logging.getLogger(__name__)

_ARN_PATTERN = re.compile(r"^[A-Za-z0-9._\-]{6,128}$")


class AgentOrchestrator:
    def __init__(
        self,
        data_adapter: DataAdapter | None = None,
        client: BedrockClient | None = None,
    ) -> None:
        self._adapter = data_adapter or MockDataAdapter()
        self._client = client or BedrockClient()
        self._embedder = Embedder(mock_mode=self._client.mock_mode)
        self._retriever = Retriever()
        self._kb = KnowledgeBase(embedder=self._embedder, retriever=self._retriever)
        self._policy_index_built = False
        self._formatter = ResponseFormatter()

    def _ensure_policy_index(self) -> None:
        if self._policy_index_built:
            return
        self._kb.build_index()
        self._policy_index_built = True

    def _build_tools(self) -> list[Any]:
        self._ensure_policy_index()
        return [
            IncomeSummaryTool(self._adapter),
            FraudAnalysisTool(self._adapter),
            RuleViolationTool(self._adapter, self._embedder, self._retriever),
            ImprovementTipsTool(self._adapter),
            DocumentRagTool(self._adapter, self._embedder, self._retriever),
            PolicyRagTool(self._embedder, self._retriever),
        ]

    def _validate_arn(self, arn: str) -> None:
        if not arn or not _ARN_PATTERN.match(arn):
            raise ValueError("Invalid ARN format")

    def analyse_application(self, arn: str, query: str, language: str = "en") -> AgentResponse:
        self._validate_arn(arn)
        t0 = time.perf_counter()
        if config.MOCK_MODE:
            logger.info("Running agent in MOCK_MODE without live Bedrock")

        tools = self._build_tools()
        agent = LlamaAgent(self._client, tools, self._adapter)
        run = agent.analyse(arn, query, language=language)

        ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        resp = AgentResponse(
            arn=arn,
            query=query,
            response_text=run.response_text,
            decision=run.decision,
            confidence=run.confidence,
            tools_called=run.tools_called,
            rag_sources=run.rag_sources,
            reasoning_steps=run.reasoning_steps,
            processing_time_ms=(time.perf_counter() - t0) * 1000,
            model_version=config.BEDROCK_MODEL_ID,
            mock_mode=self._client.mock_mode,
            timestamp=ts,
        )
        self._adapter.update_agent_analysis(
            arn,
            {
                "decision": resp.decision,
                "confidence": resp.confidence,
                "tools": resp.tools_called,
                "timestamp": ts,
            },
        )
        logger.info(
            "analyse_application arn=%s decision=%s ms=%.2f tools=%s",
            arn,
            resp.decision,
            resp.processing_time_ms,
            len(resp.tools_called),
        )
        return resp

    def explain_for_borrower(self, arn: str, language: str = "en") -> str:
        self._validate_arn(arn)
        app = self._adapter.get_application(arn)
        viol = self._adapter.get_rule_violations(arn)
        reasons = viol.get("primary_rejection_reason") or "; ".join(
            f"{v.get('rule_id')}" for v in viol.get("soft", [])
        )
        user = prompts.BORROWER_DIGEST_USER.format(
            borrower_name=app.get("borrower_name", ""),
            loan_type=app.get("loan_type", ""),
            decision=viol.get("decision", "REVIEW"),
            reasons=reasons or "No critical rule flags in mock adapter.",
            language=language,
        )
        if config.MOCK_MODE:
            u = arn.upper()
            if u.startswith("APPROVE"):
                key = "approve"
            elif u.startswith("REVIEW"):
                key = "review"
            elif u.startswith("REJECT"):
                key = "reject"
            else:
                key = "approve"
            return MOCK_SCENARIO_NARRATIVES.get(key, MOCK_SCENARIO_NARRATIVES["approve"])
        return self._client.invoke_model(user, prompts.SYSTEM_PROMPT_EXPLAINER)

    def batch_analyse(self, arn_list: list[str], query: str = "Summarise risk") -> list[AgentResponse]:
        if len(arn_list) > 10:
            raise ValueError("batch_analyse supports at most 10 ARNs")
        out: list[AgentResponse] = []
        for arn in arn_list:
            out.append(self.analyse_application(arn, query))
        return out
