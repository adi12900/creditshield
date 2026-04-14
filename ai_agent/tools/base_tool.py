"""
Abstract tool contract and structured results.
"""

from __future__ import annotations

import json
import logging
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any

logger = logging.getLogger(__name__)


@dataclass
class ToolResult:
    success: bool
    data: dict[str, Any] | None = None
    error: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)


class BaseTool(ABC):
    name: str = "base"
    description: str = ""
    parameters: dict[str, Any] = {}

    @abstractmethod
    def execute(self, args: dict[str, Any]) -> ToolResult:
        raise NotImplementedError

    def schema(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "description": self.description,
            "parameters": self.parameters,
        }

    def _log_tool(
        self,
        arn: str | None,
        input_args: dict[str, Any],
        output_summary: str,
        latency_ms: float,
    ) -> None:
        logger.info(
            "tool=%s arn=%s input_args=%s output_summary=%s latency_ms=%.2f",
            self.name,
            arn,
            json.dumps(input_args, default=str),
            output_summary[:500],
            latency_ms,
        )
