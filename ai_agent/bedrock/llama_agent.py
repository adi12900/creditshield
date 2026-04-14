"""
ReAct-style agent loop over Bedrock Llama 3 with tool execution.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any

from ai_agent import config
from ai_agent.bedrock.client import BedrockClient
from ai_agent.bedrock import prompts
from ai_agent.data_adapter import DataAdapter
from ai_agent.tools.base_tool import BaseTool


@dataclass
class AgentRunResult:
    response_text: str
    decision: str
    confidence: float
    tools_called: list[dict[str, Any]] = field(default_factory=list)
    reasoning_steps: list[str] = field(default_factory=list)
    rag_sources: list[str] = field(default_factory=list)
    total_tokens_estimate: int = 0


MANDATORY_TOOL_NAMES: tuple[str, ...] = (
    "get_income_summary",
    "get_fraud_analysis",
    "get_rule_violations",
)


class LlamaAgent:
    def __init__(
        self,
        client: BedrockClient,
        tools: list[BaseTool],
        adapter: DataAdapter,
    ) -> None:
        self._client = client
        self._tools = {t.name: t for t in tools}
        self._adapter = adapter

    def _run_mandatory_tools(
        self, arn: str, user_query: str = ""
    ) -> tuple[list[dict[str, Any]], str, list[str]]:
        """Always run income, fraud, and rules tools before the ReAct loop."""
        args: dict[str, Any] = {"arn": arn}
        entries: list[dict[str, Any]] = []
        rag_extra: list[str] = []
        blocks: list[str] = []

        labels = {
            "get_income_summary": "Income Summary",
            "get_fraud_analysis": "Fraud Analysis",
            "get_rule_violations": "Rule Violations",
        }

        for name in MANDATORY_TOOL_NAMES:
            tool = self._tools.get(name)
            if tool is None:
                err = {"error": f"tool {name!r} not registered"}
                entries.append({"tool": name, "args": dict(args), "success": False})
                blocks.append(f"**{labels.get(name, name)}:**\n{json.dumps(err)}")
                continue
            tr = tool.execute(args)
            entries.append({"tool": name, "args": dict(args), "success": tr.success})
            payload = tr.data if tr.success else {"error": tr.error}
            text = json.dumps(payload, default=str)
            blocks.append(f"**{labels.get(name, name)}:**\n{text}")
            if tr.data:
                for key in ("chunks", "results", "hard_violations", "soft_violations"):
                    if key in tr.data and isinstance(tr.data[key], list):
                        for item in tr.data[key]:
                            if isinstance(item, dict) and item.get("source"):
                                rag_extra.append(str(item["source"]))

        viol = self._adapter.get_rule_violations(arn)
        policy_tool = self._tools.get("search_policy")
        if policy_tool and (viol.get("hard") or viol.get("soft")):
            terms: list[str] = []
            for h in viol.get("hard", []):
                terms.extend(
                    [
                        str(h.get("rule_id", "")),
                        str(h.get("name", "")),
                        str(h.get("detail", "")),
                    ]
                )
            for s in viol.get("soft", []):
                terms.extend(
                    [
                        str(s.get("rule_id", "")),
                        str(s.get("name", "")),
                        str(s.get("detail", "")),
                    ]
                )
            if user_query.strip():
                terms.append(user_query.strip())
            pq = " ".join(t for t in terms if t).strip()[:800] or (
                "underwriting rules FOIR CIBIL fraud KYC"
            )
            ptr = policy_tool.execute({"query": pq})
            entries.append(
                {"tool": "search_policy", "args": {"query": pq}, "success": ptr.success}
            )
            pload = ptr.data if ptr.success else {"error": ptr.error}
            blocks.append(
                "**Policy search (rule & policy corpus):**\n" + json.dumps(pload, default=str)
            )
            if ptr.data:
                for key in ("chunks", "results"):
                    if key in ptr.data and isinstance(ptr.data[key], list):
                        for item in ptr.data[key]:
                            if isinstance(item, dict) and item.get("source"):
                                rag_extra.append(str(item["source"]))

        combined = (
            "### Mandatory tool outputs (already executed — use for your FINAL ANSWER)\n\n"
            + "\n\n".join(blocks)
        )
        return entries, combined, rag_extra

    def _build_context(self, arn: str) -> str:
        app = self._adapter.get_application(arn)
        viol = self._adapter.get_rule_violations(arn)
        lines = [
            f"ARN: {arn}",
            f"Borrower: {app.get('borrower_name')}",
            f"Loan: {app.get('loan_type')} amount={app.get('loan_amount')}",
            f"Declared income/month: {app.get('monthly_income_declared')}",
            f"FOIR %: {app.get('foir_pct')}",
            f"CIBIL: {app.get('cibil')}",
            f"Composite score (engine): {app.get('composite_score')}",
            f"Engine decision: {viol.get('decision')}",
        ]
        return "\n".join(lines)

    def _parse_tool_call(self, llm_output: str) -> tuple[str | None, dict[str, Any] | None]:
        for line in llm_output.splitlines():
            line = line.strip()
            if line.upper().startswith("TOOL:"):
                m = re.match(r"TOOL:\s*([^,]+),\s*ARGS:\s*(\{.*\})\s*$", line, re.IGNORECASE | re.DOTALL)
                if m:
                    name = m.group(1).strip()
                    try:
                        args = json.loads(m.group(2))
                        return name, args
                    except json.JSONDecodeError:
                        return None, None
        return None, None

    def _derive_decision(self, arn: str) -> tuple[str, float]:
        viol = self._adapter.get_rule_violations(arn)
        app = self._adapter.get_application(arn)
        if viol.get("hard"):
            return "REJECT", 0.92
        score = app.get("composite_score")
        if isinstance(score, Decimal):
            s = float(score)
        else:
            s = float(score or 0)
        if s <= 35:
            return "REJECT", 0.75
        if s <= 50:
            return "REVIEW", 0.7
        if s <= 65:
            return "CAUTION", 0.65
        if s <= 80:
            return "APPROVE", 0.72
        return "PREMIUM APPROVE", 0.68

    def analyse(self, arn: str, query: str, language: str = "en") -> AgentRunResult:
        mandatory_tools_called, mandatory_context, mandatory_rag = self._run_mandatory_tools(
            arn, query
        )

        tool_lines = "\n".join(f"- {t.name}: {t.description}" for t in self._tools.values())
        react_instr = prompts.REACT_TOOL_INSTRUCTION.format(tool_descriptions=tool_lines)
        ivl_preview = self._adapter.get_ivl_score(arn)
        fraud = self._adapter.get_fraud_signals(arn)
        seed_user = prompts.USER_PROMPT_TEMPLATES["full_analysis"].format(
            borrower_data=self._build_context(arn),
            ivl_scores=json.dumps({k: str(v) for k, v in ivl_preview.items()}, default=str)[:8000],
            fraud_signals=json.dumps(fraud, default=str),
            query=query,
        )
        initial_user = (
            f"Language: {language}\n{react_instr}\n\n"
            f"{mandatory_context}\n\n"
            f"{seed_user}\n"
        )
        scratch: list[str] = []
        tools_called: list[dict[str, Any]] = list(mandatory_tools_called)
        reasoning_steps: list[str] = [
            "mandatory_tools_executed=" + ",".join(MANDATORY_TOOL_NAMES),
        ]
        rag_sources: list[str] = list(mandatory_rag)
        tokens_est = 0
        final_text = ""
        out = ""

        for iteration in range(5):
            user_payload = initial_user + ("\n\n### Trace\n" + "\n".join(scratch) if scratch else "")
            out = self._client.invoke_model(
                user_payload,
                prompts.SYSTEM_PROMPT_ANALYST,
                max_tokens=config.MAX_TOKENS,
                temperature=float(config.TEMPERATURE),
            )
            tokens_est += max(1, len(out) // 4)
            reasoning_steps.append(f"iter={iteration + 1} raw_len={len(out)}")
            if "FINAL ANSWER:" in out:
                final_text = out.split("FINAL ANSWER:", 1)[-1].strip()
                break
            tool_name, tool_args = self._parse_tool_call(out)
            if tool_name and tool_name in self._tools and tool_args is not None:
                tr = self._tools[tool_name].execute(tool_args)
                tools_called.append({"tool": tool_name, "args": tool_args, "success": tr.success})
                obs = json.dumps(tr.data or {"error": tr.error}, default=str)[:6000]
                scratch.append(f"Assistant: {out}")
                scratch.append(f"Observation: {obs}")
                if tr.data:
                    for key in ("chunks", "results", "hard_violations", "soft_violations"):
                        if key in tr.data and isinstance(tr.data[key], list):
                            for item in tr.data[key]:
                                if isinstance(item, dict) and item.get("source"):
                                    rag_sources.append(str(item["source"]))
            else:
                scratch.append(f"Assistant: {out}")
                scratch.append("Observation: No TOOL line parsed; reply with FINAL ANSWER: ...")
                if iteration == 4:
                    final_text = out.strip()

        if not final_text:
            final_text = (out or "").strip()
        decision, conf = self._derive_decision(arn)
        return AgentRunResult(
            response_text=final_text,
            decision=decision,
            confidence=conf,
            tools_called=tools_called,
            reasoning_steps=reasoning_steps,
            rag_sources=list(dict.fromkeys(rag_sources)),
            total_tokens_estimate=tokens_est,
        )
