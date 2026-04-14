"""
Pydantic v2 request/response models for the FastAPI agent layer.
"""

from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator

_ARN_PATTERN = re.compile(r"^[A-Za-z0-9._\-]{6,128}$")


class AnalyseRequest(BaseModel):
    arn: str
    query: str = "Analyse this application"
    language: Literal["en", "hi", "mr"] = "en"

    @field_validator("arn")
    @classmethod
    def arn_nonempty_reasonable(cls, v: str) -> str:
        s = (v or "").strip()
        if not s:
            raise ValueError("ARN must be non-empty")
        if not _ARN_PATTERN.match(s):
            raise ValueError("ARN must be 6–128 characters; allowed: letters, digits, . _ -")
        return s


class AnalyseResponse(BaseModel):
    arn: str
    decision: Literal["APPROVE", "REVIEW", "REJECT", "CAUTION", "PREMIUM"]
    confidence: float = Field(ge=0.0, le=1.0)
    response: str
    tools_called: list[str]
    rag_sources: list[str]
    reasoning_steps: list[str]
    processing_time_ms: int
    mock_mode: bool
    model_version: str
    timestamp: datetime


class BorrowerExplainRequest(BaseModel):
    arn: str
    language: Literal["en", "hi", "mr"] = "en"

    @field_validator("arn")
    @classmethod
    def arn_nonempty_reasonable(cls, v: str) -> str:
        s = (v or "").strip()
        if not s:
            raise ValueError("ARN must be non-empty")
        if not _ARN_PATTERN.match(s):
            raise ValueError("ARN must be 6–128 characters; allowed: letters, digits, . _ -")
        return s


class BorrowerExplainResponse(BaseModel):
    arn: str
    language: str
    explanation: str
    timestamp: datetime


class BatchAnalyseRequest(BaseModel):
    arns: list[str] = Field(max_length=10)
    query: str = "Analyse this loan application"

    @field_validator("arns")
    @classmethod
    def validate_arns(cls, v: list[str]) -> list[str]:
        if not v:
            raise ValueError("arns must contain at least one ARN")
        for arn in v:
            s = (arn or "").strip()
            if not s or not _ARN_PATTERN.match(s):
                raise ValueError(f"Invalid ARN: {arn!r}")
        return [x.strip() for x in v]


class BatchAnalyseResponse(BaseModel):
    results: list[AnalyseResponse]
    total: int


class AgentHealthResponse(BaseModel):
    status: str
    mock_mode: bool
    rag_chunks: int
    rag_index_built: bool
    tools_available: list[str]
    bedrock_region: str
    model_id: str


class ToolInfo(BaseModel):
    name: str
    description: str
    parameters: dict[str, Any]
