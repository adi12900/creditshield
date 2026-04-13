"""
Amazon Bedrock runtime client with mock mode, retry, and structured logging.
"""

from __future__ import annotations

import json
import logging
import time
from typing import Any

from ai_agent import config
from ai_agent.bedrock import prompts
from ai_agent.mock_mode import MOCK_RESPONSES

logger = logging.getLogger(__name__)

try:
    import boto3
    from botocore.config import Config as BotoConfig
    from botocore.exceptions import ClientError
except ImportError:  # pragma: no cover - optional in minimal env
    boto3 = None  # type: ignore[assignment]
    BotoConfig = None  # type: ignore[assignment,misc]

    class ClientError(Exception):
        pass


def _classify_mock_key(prompt: str) -> str:
    p = prompt.lower()
    # Mandatory JSON always mentions fraud analysis — detect hard rejects first.
    if '"hard_violations": [{' in p:
        return "explain_rejection"
    if "fraud" in p:
        return "fraud_check"
    if "reject" in p or "violation" in p or "hr-0" in p:
        return "explain_rejection"
    if "improve" in p or "qualify" in p or "counterfactual" in p:
        return "improvement_tips"
    if "income" in p and "summary" in p:
        return "income_summary"
    if "analyse" in p or "analyze" in p or "assessment" in p:
        return "analyse"
    return "default"


class BedrockClient:
    def __init__(self, mock_mode: bool | None = None) -> None:
        self.mock_mode = config.MOCK_MODE if mock_mode is None else mock_mode
        self._client = None
        if not self.mock_mode and boto3 is not None and BotoConfig is not None:
            boto_cfg = BotoConfig(read_timeout=30, connect_timeout=10, retries={"max_attempts": 1})
            self._client = boto3.client(
                "bedrock-runtime",
                region_name=config.AWS_REGION,
                aws_access_key_id=config.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=config.AWS_SECRET_ACCESS_KEY,
                config=boto_cfg,
            )

    def invoke_model(
        self,
        prompt: str,
        system_prompt: str,
        max_tokens: int | None = None,
        temperature: float | None = None,
    ) -> str:
        max_gen = max_tokens if max_tokens is not None else config.MAX_TOKENS
        temp = float(temperature if temperature is not None else config.TEMPERATURE)

        full_prompt = prompts.format_llama3_instruct_prompt(system_prompt, prompt)

        if self.mock_mode or self._client is None:
            key = _classify_mock_key(prompt)
            return MOCK_RESPONSES.get(key, MOCK_RESPONSES["default"])

        body = json.dumps(
            {
                "prompt": full_prompt,
                "max_gen_len": max_gen,
                "temperature": temp,
                "top_p": 0.9,
            }
        )

        t0 = time.perf_counter()
        last_err: Exception | None = None
        for attempt in range(2):
            try:
                resp = self._client.invoke_model(
                    modelId=config.BEDROCK_MODEL_ID,
                    body=body,
                    contentType="application/json",
                    accept="application/json",
                )
                raw = resp["body"].read()
                latency_ms = (time.perf_counter() - t0) * 1000
                data: dict[str, Any] = json.loads(raw.decode("utf-8"))
                text = data.get("generation", "")
                prompt_token_count = data.get("prompt_token_count")
                generation_token_count = data.get("generation_token_count")
                logger.info(
                    "bedrock_call ts=%s model=%s prompt_tokens=%s gen_tokens=%s latency_ms=%.2f",
                    time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    config.BEDROCK_MODEL_ID,
                    prompt_token_count,
                    generation_token_count,
                    latency_ms,
                )
                return text
            except (ClientError, TimeoutError, OSError) as e:
                last_err = e
                logger.warning("bedrock_invoke attempt %s failed: %s", attempt + 1, e)
                time.sleep(0.5)

        logger.error("bedrock_invoke exhausted retries: %s — mock fallback", last_err)
        key = _classify_mock_key(prompt)
        return MOCK_RESPONSES.get(key, MOCK_RESPONSES["default"])
