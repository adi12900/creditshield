"""Integration-style tests for orchestrator, formatter, and mock scenarios."""

from __future__ import annotations

import pytest

from ai_agent.bedrock.client import BedrockClient
from ai_agent.data_adapter import MockDataAdapter
from ai_agent.pipeline.agent_orchestrator import AgentOrchestrator
from ai_agent.pipeline.response_formatter import AgentResponse, ResponseFormatter
from ai_agent.rag.embedder import Embedder
from ai_agent.rag.retriever import Retriever
from ai_agent.tests import mock_data as md
from ai_agent.tools.counterfactual_tool import ImprovementTipsTool
from ai_agent.tools.document_rag_tool import DocumentRagTool
from ai_agent.tools.fraud_analysis_tool import FraudAnalysisTool
from ai_agent.tools.income_summary_tool import IncomeSummaryTool
from ai_agent.tools.policy_rag_tool import PolicyRagTool
from ai_agent.tools.rule_violation_tool import RuleViolationTool


@pytest.fixture
def mock_client() -> BedrockClient:
    return BedrockClient(mock_mode=True)


@pytest.fixture
def orchestrator(mock_client: BedrockClient) -> AgentOrchestrator:
    return AgentOrchestrator(data_adapter=MockDataAdapter(), client=mock_client)


def test_approve_scenario_returns_approve_decision(orchestrator: AgentOrchestrator) -> None:
    r = orchestrator.analyse_application(md.APPROVE_SCENARIO["arn"], "Summarise risk")
    assert r.decision == "APPROVE"
    assert md.APPROVE_SCENARIO["arn"] in r.arn


def test_reject_scenario_triggers_hard_rules(orchestrator: AgentOrchestrator) -> None:
    r = orchestrator.analyse_application(md.REJECT_SCENARIO["arn"], "Why rejected?")
    assert r.decision == "REJECT"
    viol = orchestrator._adapter.get_rule_violations(md.REJECT_SCENARIO["arn"])  # noqa: SLF001
    assert any(v["rule_id"] == "HR-01" for v in viol["hard"])


def test_review_scenario_routes_to_manual(orchestrator: AgentOrchestrator) -> None:
    r = orchestrator.analyse_application(md.REVIEW_SCENARIO["arn"], "Manual review?")
    assert r.decision == "REVIEW"


def test_agent_works_without_aws_credentials(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("AWS_ACCESS_KEY_ID", raising=False)
    monkeypatch.delenv("AWS_SECRET_ACCESS_KEY", raising=False)
    monkeypatch.setenv("MOCK_MODE", "true")
    c = BedrockClient(mock_mode=True)
    text = c.invoke_model("test fraud assessment", "You are a tester.")
    assert len(text) > 0


def test_all_6_tools_callable(mock_client: BedrockClient) -> None:
    adapter = MockDataAdapter()
    emb = Embedder(mock_mode=True)
    ret = Retriever()
    arn = md.APPROVE_SCENARIO["arn"]
    assert IncomeSummaryTool(adapter).execute({"arn": arn}).success
    assert FraudAnalysisTool(adapter).execute({"arn": arn}).success
    assert RuleViolationTool(adapter, emb, ret).execute({"arn": arn}).success
    assert ImprovementTipsTool(adapter).execute(
        {"arn": arn, "loan_type": "Personal Loan"}
    ).success
    assert DocumentRagTool(adapter, emb, ret).execute(
        {"arn": arn, "query": "salary"}
    ).success
    assert PolicyRagTool(emb, ret).execute({"query": "FOIR HR-01"}).success


def test_response_formatter_all_formats() -> None:
    ar = AgentResponse(
        arn="X-1",
        query="q",
        response_text="body",
        decision="REVIEW",
        confidence=0.5,
        tools_called=[{"tool": "get_income_summary"}],
        rag_sources=["hard_rules.txt"],
        reasoning_steps=["s1"],
        processing_time_ms=12.0,
        timestamp="t",
    )
    fmt = ResponseFormatter()
    assert fmt.format_for_loan_officer(ar)["decision"] == "REVIEW"
    assert "summary" in fmt.format_for_borrower(ar, "en")
    assert fmt.format_for_audit(ar)["immutable"] is True


def test_rag_fallback_when_vector_store_unavailable() -> None:
    adapter = MockDataAdapter()
    emb = Embedder(mock_mode=True)
    ret = Retriever()
    tool = DocumentRagTool(adapter, emb, ret)
    res = tool.execute({"arn": md.APPROVE_SCENARIO["arn"], "query": "PAN"})
    assert res.success
    assert res.data is not None
    assert res.data.get("fallback") in (None, "metadata_only")
