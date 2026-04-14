"""
Mountable FastAPI router for the CreditShield AI agent (no auth — add upstream).
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, FastAPI, HTTPException

from ai_agent.async_orchestrator import get_orchestrator
from ai_agent.schemas import (
    AgentHealthResponse,
    AnalyseRequest,
    AnalyseResponse,
    BatchAnalyseRequest,
    BatchAnalyseResponse,
    BorrowerExplainRequest,
    BorrowerExplainResponse,
    ToolInfo,
)

logger = logging.getLogger(__name__)

agent_router = APIRouter(tags=["agent"])


def _normalize_decision(raw: str) -> str:
    r = (raw or "").strip().upper()
    if r == "PREMIUM APPROVE" or r.startswith("PREMIUM"):
        return "PREMIUM"
    if r in ("APPROVE", "REVIEW", "REJECT", "CAUTION", "PREMIUM"):
        return r
    return "REVIEW"


def _tools_called_to_names(items: list[object]) -> list[str]:
    names: list[str] = []
    for x in items:
        if isinstance(x, dict) and "tool" in x:
            names.append(str(x["tool"]))
        elif isinstance(x, str):
            names.append(x)
        else:
            names.append(str(x))
    return names


def _parse_timestamp(ts: str) -> datetime:
    if not ts:
        return datetime.now(timezone.utc)
    normalized = ts.replace("Z", "+00:00")
    return datetime.fromisoformat(normalized)


def _log_agent_request(endpoint: str, **fields: object) -> None:
    logger.info("agent_api %s %s", endpoint, fields)


def _agent_response_to_schema(arn: str, r) -> AnalyseResponse:
    return AnalyseResponse(
        arn=arn,
        decision=_normalize_decision(r.decision),  # type: ignore[arg-type]
        confidence=float(r.confidence),
        response=r.response_text,
        tools_called=_tools_called_to_names(r.tools_called),
        rag_sources=list(r.rag_sources),
        reasoning_steps=list(r.reasoning_steps),
        processing_time_ms=int(round(r.processing_time_ms)),
        mock_mode=bool(r.mock_mode),
        model_version=r.model_version,
        timestamp=_parse_timestamp(r.timestamp),
    )


@agent_router.post("/analyse", response_model=AnalyseResponse)
async def analyse_application(
    body: AnalyseRequest,
    background_tasks: BackgroundTasks,
) -> AnalyseResponse:
    """Run full agent analysis for a single loan application ARN."""
    background_tasks.add_task(
        _log_agent_request,
        "POST /analyse",
        arn=body.arn,
        language=body.language,
    )
    orch = get_orchestrator()
    try:
        result = await orch.analyse_application(body.arn, body.query, body.language)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    except Exception as e:
        logger.exception("analyse_application failed")
        raise HTTPException(status_code=500, detail=str(e)) from e
    return _agent_response_to_schema(body.arn, result)


@agent_router.post("/explain-borrower", response_model=BorrowerExplainResponse)
async def explain_borrower(
    body: BorrowerExplainRequest,
    background_tasks: BackgroundTasks,
) -> BorrowerExplainResponse:
    """Return a plain-language explanation of the decision for the borrower."""
    background_tasks.add_task(
        _log_agent_request,
        "POST /explain-borrower",
        arn=body.arn,
        language=body.language,
    )
    orch = get_orchestrator()
    try:
        text = await orch.explain_for_borrower(body.arn, body.language)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    except Exception as e:
        logger.exception("explain_for_borrower failed")
        raise HTTPException(status_code=500, detail=str(e)) from e
    return BorrowerExplainResponse(
        arn=body.arn,
        language=body.language,
        explanation=text,
        timestamp=datetime.now(timezone.utc),
    )


@agent_router.post("/batch-analyse", response_model=BatchAnalyseResponse)
async def batch_analyse(
    body: BatchAnalyseRequest,
    background_tasks: BackgroundTasks,
) -> BatchAnalyseResponse:
    """Analyse up to ten ARNs in sequence using the same query."""
    if len(body.arns) > 10:
        raise HTTPException(
            status_code=422,
            detail="At most 10 ARNs are allowed per batch-analyse request.",
        )
    background_tasks.add_task(
        _log_agent_request,
        "POST /batch-analyse",
        count=len(body.arns),
    )
    orch = get_orchestrator()
    results: list[AnalyseResponse] = []
    for arn in body.arns:
        try:
            r = await orch.analyse_application(arn, body.query, "en")
            results.append(_agent_response_to_schema(arn, r))
        except ValueError as e:
            raise HTTPException(status_code=422, detail=str(e)) from e
        except Exception as e:
            logger.exception("batch_analyse failed for arn=%s", arn)
            raise HTTPException(status_code=500, detail=str(e)) from e
    return BatchAnalyseResponse(results=results, total=len(results))


@agent_router.get("/health", response_model=AgentHealthResponse)
async def agent_health(background_tasks: BackgroundTasks) -> AgentHealthResponse:
    """Report agent readiness, RAG stats, and configured Bedrock settings."""
    background_tasks.add_task(_log_agent_request, "GET /health")
    orch = get_orchestrator()
    try:
        h = await orch.health_check()
    except Exception as e:
        logger.exception("health_check failed")
        raise HTTPException(status_code=500, detail=str(e)) from e
    return AgentHealthResponse(status="ok", **h)


@agent_router.get("/tools", response_model=list[ToolInfo])
async def list_agent_tools(background_tasks: BackgroundTasks) -> list[ToolInfo]:
    """List tool names, descriptions, and JSON-schema parameters for the agent."""
    background_tasks.add_task(_log_agent_request, "GET /tools")
    orch = get_orchestrator()

    def _load_tools() -> list[ToolInfo]:
        tools = orch._sync_orchestrator._build_tools()  # noqa: SLF001
        return [
            ToolInfo(
                name=t.name,
                description=t.description,
                parameters=dict(t.parameters),
            )
            for t in tools
        ]

    loop = asyncio.get_running_loop()
    try:
        return await loop.run_in_executor(orch._executor, _load_tools)  # noqa: SLF001
    except Exception as e:
        logger.exception("list_agent_tools failed")
        raise HTTPException(status_code=500, detail=str(e)) from e


# Standalone test application (see INTEGRATION.md)
test_app = FastAPI(title="CreditShield Agent Router (test)")
test_app.include_router(agent_router, prefix="/api/v1/agent")
