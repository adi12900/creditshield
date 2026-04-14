"""
Structured outputs for officers, borrowers, and audit trails.
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any

from ai_agent import config
from ai_agent.bedrock.llama_agent import AgentRunResult


@dataclass
class AgentResponse:
    arn: str
    query: str
    response_text: str
    decision: str
    confidence: float
    tools_called: list[dict[str, Any]] = field(default_factory=list)
    rag_sources: list[str] = field(default_factory=list)
    reasoning_steps: list[str] = field(default_factory=list)
    processing_time_ms: float = 0.0
    model_version: str = config.BEDROCK_MODEL_ID
    mock_mode: bool = config.MOCK_MODE
    timestamp: str = ""
    formatted_for: str = "raw"


class ResponseFormatter:
    def format_for_loan_officer(self, agent_response: AgentResponse) -> dict[str, Any]:
        return {
            "arn": agent_response.arn,
            "decision": agent_response.decision,
            "confidence": agent_response.confidence,
            "analysis": agent_response.response_text,
            "tools_called": agent_response.tools_called,
            "rag_sources": agent_response.rag_sources,
            "reasoning_steps": agent_response.reasoning_steps,
            "model": agent_response.model_version,
            "mock_mode": agent_response.mock_mode,
            "processing_time_ms": agent_response.processing_time_ms,
            "timestamp": agent_response.timestamp,
        }

    def format_for_borrower(self, agent_response: AgentResponse, language: str) -> dict[str, Any]:
        return {
            "arn": agent_response.arn,
            "language": language,
            "summary": agent_response.response_text,
            "decision": agent_response.decision,
            "next_steps": "Please contact your loan officer for personalised guidance.",
            "mock_mode": agent_response.mock_mode,
        }

    def format_for_audit(self, agent_response: AgentResponse) -> dict[str, Any]:
        return {
            "record_type": "creditshield_agent_analysis",
            "immutable": True,
            "arn": agent_response.arn,
            "timestamp": agent_response.timestamp,
            "model_version": agent_response.model_version,
            "mock_mode": agent_response.mock_mode,
            "tools_called": agent_response.tools_called,
            "rag_citations": agent_response.rag_sources,
            "decision": agent_response.decision,
            "confidence": agent_response.confidence,
            "processing_time_ms": agent_response.processing_time_ms,
            "reasoning_steps": agent_response.reasoning_steps,
            "response_excerpt": agent_response.response_text[:4000],
        }
