"""
Vector retrieval: pgvector when configured, else in-memory cosine similarity.
"""

from __future__ import annotations

import logging
import math
import re
from dataclasses import dataclass, field
from typing import Any

import numpy as np

from ai_agent import config

logger = logging.getLogger(__name__)


@dataclass
class RetrievedChunk:
    text: str
    source: str
    score: float
    metadata: dict[str, Any] = field(default_factory=dict)


class Retriever:
    def __init__(self) -> None:
        self._vectors: list[np.ndarray] = []
        self._texts: list[str] = []
        self._sources: list[str] = []
        self._namespaces: list[str] = []
        self._metas: list[dict[str, Any]] = []
        self._pg_url = None

    def clear(self) -> None:
        self._vectors.clear()
        self._texts.clear()
        self._sources.clear()
        self._namespaces.clear()
        self._metas.clear()

    def add(
        self,
        embedding: list[float],
        text: str,
        source: str,
        namespace: str,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        vec = np.array(embedding, dtype=np.float64)
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        self._vectors.append(vec)
        self._texts.append(text)
        self._sources.append(source)
        self._namespaces.append(namespace)
        self._metas.append(metadata or {})

    def search(
        self,
        query_embedding: list[float],
        namespace: str,
        top_k: int | None = None,
    ) -> list[RetrievedChunk]:
        k = top_k if top_k is not None else config.RAG_TOP_K
        if config.VECTOR_STORE == "pgvector":
            logger.warning("pgvector backend not wired — falling back to in-memory search")
        if not self._vectors:
            return []

        q = np.array(query_embedding, dtype=np.float64)
        qn = np.linalg.norm(q)
        if qn > 0:
            q = q / qn

        scores: list[tuple[int, float]] = []
        for i, v in enumerate(self._vectors):
            if self._namespaces[i] != namespace:
                continue
            sim = float(np.dot(q, v))
            scores.append((i, sim))
        scores.sort(key=lambda x: x[1], reverse=True)
        out: list[RetrievedChunk] = []
        for idx, sc in scores[:k]:
            out.append(
                RetrievedChunk(
                    text=self._texts[idx],
                    source=self._sources[idx],
                    score=sc,
                    metadata=dict(self._metas[idx]),
                )
            )
        return out

    def keyword_search(self, query: str, namespace: str, top_k: int) -> list[RetrievedChunk]:
        tokens = [t for t in re.split(r"\W+", query.lower()) if len(t) > 2]
        hits: list[tuple[int, int]] = []
        for i, ns in enumerate(self._namespaces):
            if ns != namespace:
                continue
            text_l = self._texts[i].lower()
            score = sum(text_l.count(t) for t in tokens)
            if score > 0:
                hits.append((i, score))
        hits.sort(key=lambda x: x[1], reverse=True)
        return [
            RetrievedChunk(
                text=self._texts[i],
                source=self._sources[i],
                score=float(s) / (10.0 + math.log1p(s)),
                metadata=dict(self._metas[i]),
            )
            for i, s in hits[:top_k]
        ]

    def to_serializable(self) -> list[dict[str, Any]]:
        return [
            {
                "embedding": self._vectors[i].tolist(),
                "text": self._texts[i],
                "source": self._sources[i],
                "namespace": self._namespaces[i],
                "metadata": self._metas[i],
            }
            for i in range(len(self._texts))
        ]

    def load_serializable(self, rows: list[dict[str, Any]]) -> None:
        self.clear()
        for row in rows:
            self.add(
                row["embedding"],
                row["text"],
                row["source"],
                row["namespace"],
                row.get("metadata"),
            )
