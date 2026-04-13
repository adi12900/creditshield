"""
Embeddings: Amazon Titan via Bedrock, then sentence-transformers, then mock vector.
"""

from __future__ import annotations

import json
import logging
import math
import random
from typing import Any

from ai_agent import config

logger = logging.getLogger(__name__)

try:
    import boto3
    from botocore.exceptions import ClientError
except ImportError:  # pragma: no cover
    boto3 = None  # type: ignore[assignment]

    class ClientError(Exception):
        pass

_ST_MODEL = None


def _normalize(vec: list[float]) -> list[float]:
    s = math.sqrt(sum(x * x for x in vec)) or 1.0
    return [x / s for x in vec]


class Embedder:
    def __init__(self, mock_mode: bool | None = None) -> None:
        self.mock_mode = config.MOCK_MODE if mock_mode is None else mock_mode
        self._client = None
        if not self.mock_mode and boto3 is not None:
            self._client = boto3.client(
                "bedrock-runtime",
                region_name=config.AWS_REGION,
                aws_access_key_id=config.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=config.AWS_SECRET_ACCESS_KEY,
            )

    def embed(self, text: str) -> list[float]:
        if self.mock_mode or self._client is None:
            return self._mock_vector(text)

        body = json.dumps({"inputText": text})
        try:
            resp = self._client.invoke_model(
                modelId=config.BEDROCK_EMBEDDING_MODEL,
                body=body,
                contentType="application/json",
                accept="application/json",
            )
            data: dict[str, Any] = json.loads(resp["body"].read().decode("utf-8"))
            emb = data.get("embedding")
            if isinstance(emb, list):
                return _normalize([float(x) for x in emb])
        except (ClientError, OSError, json.JSONDecodeError) as e:
            logger.warning("Titan embed failed (%s) — trying local fallback", e)

        return self._local_fallback(text)

    def _local_fallback(self, text: str) -> list[float]:
        global _ST_MODEL  # noqa: PLW0603
        try:
            if _ST_MODEL is None:
                from sentence_transformers import SentenceTransformer

                _ST_MODEL = SentenceTransformer("all-MiniLM-L6-v2")
            vec = _ST_MODEL.encode(text, normalize_embeddings=True)
            return [float(x) for x in vec]
        except Exception as e:  # pragma: no cover - heavy optional dep
            logger.warning("sentence-transformers unavailable (%s) — mock vector", e)
            return self._mock_vector(text)

    def _mock_vector(self, text: str) -> list[float]:
        rnd = random.Random(sum(ord(c) for c in text) % (2**32))
        vec = [rnd.gauss(0, 1) for _ in range(384)]
        return _normalize(vec)
