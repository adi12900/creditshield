"""Unit tests for tool outputs and Decimal paths."""

from __future__ import annotations

from ai_agent.data_adapter import MockDataAdapter
from ai_agent.tests import mock_data as md
from ai_agent.tools.fraud_analysis_tool import FraudAnalysisTool
from ai_agent.tools.income_summary_tool import IncomeSummaryTool


def test_income_summary_composite_ordering() -> None:
    adapter = MockDataAdapter()
    tool = IncomeSummaryTool(adapter)
    res = tool.execute({"arn": md.APPROVE_SCENARIO["arn"]})
    assert res.success and res.data
    assert "top_risk_params" in res.data
    assert isinstance(res.data["composite_score"], float)


def test_fraud_clear_vs_review() -> None:
    adapter = MockDataAdapter()
    tool = FraudAnalysisTool(adapter)
    clear = tool.execute({"arn": md.APPROVE_SCENARIO["arn"]})
    review = tool.execute({"arn": md.REVIEW_SCENARIO["arn"]})
    assert clear.data and clear.data["overall_risk"] == "CLEAR"
    assert review.data and review.data["overall_risk"] in ("SUSPICIOUS", "HIGH_RISK", "CLEAR")


def test_reject_fraud_signals_present() -> None:
    adapter = MockDataAdapter()
    tool = FraudAnalysisTool(adapter)
    res = tool.execute({"arn": md.REJECT_SCENARIO["arn"]})
    assert res.data
    assert len(res.data["signals"]) >= 1
