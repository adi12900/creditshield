"""
Load policy documents, chunk, embed, and index into the retriever with namespaces.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

import tiktoken

from ai_agent import config
from ai_agent.rag.embedder import Embedder
from ai_agent.rag.retriever import Retriever

logger = logging.getLogger(__name__)

DOCUMENT_FILES = [
    "rbi_digital_lending_2022.txt",
    "hard_rules.txt",
    "soft_rules.txt",
    "loan_products.txt",
    "ivl_parameters.txt",
]

RULES_SUBDIR = "rules"
RULE_EXTENSIONS = (".txt", ".json")


class KnowledgeBase:
    def __init__(
        self,
        documents_dir: Path | None = None,
        embedder: Embedder | None = None,
        retriever: Retriever | None = None,
    ) -> None:
        base = Path(__file__).resolve().parent / "documents"
        self.documents_dir = documents_dir or base
        self.embedder = embedder or Embedder()
        self.retriever = retriever or Retriever()
        self._enc = tiktoken.get_encoding("cl100k_base")

    def load_documents(self) -> dict[str, str]:
        out: dict[str, str] = {}
        for name in DOCUMENT_FILES:
            path = self.documents_dir / name
            if path.exists():
                out[name] = path.read_text(encoding="utf-8")
            else:
                logger.warning("Missing knowledge file: %s", path)
                out[name] = ""
        return out

    def load_rule_documents(self) -> dict[str, str]:
        """Rule text under ``documents/rules/``; all chunks are indexed in ``policy_global``."""
        rules_dir = self.documents_dir / RULES_SUBDIR
        out: dict[str, str] = {}
        if not rules_dir.is_dir():
            return out
        for path in sorted(rules_dir.iterdir()):
            if not path.is_file() or path.suffix.lower() not in RULE_EXTENSIONS:
                continue
            key = f"{RULES_SUBDIR}/{path.name}"
            out[key] = path.read_text(encoding="utf-8")
        return out

    def chunk_documents(self, text: str, source: str) -> list[dict[str, Any]]:
        tokens = self._enc.encode(text)
        size = config.RAG_CHUNK_SIZE
        overlap = min(config.RAG_CHUNK_OVERLAP, size - 1) if size > 1 else 0
        chunks: list[dict[str, Any]] = []
        i = 0
        part = 0
        while i < len(tokens):
            slice_tok = tokens[i : i + size]
            chunk_text = self._enc.decode(slice_tok)
            chunks.append(
                {
                    "text": chunk_text,
                    "source": source,
                    "part": part,
                }
            )
            part += 1
            i += max(1, size - overlap)
        return chunks

    def build_index(self, index_path: Path | None = None) -> None:
        """
        Single indexing path: clear retriever, load policy files + ``rules/*``, chunk,
        embed into ``policy_global``. Optionally persist to ``index_path``.
        """
        self.retriever.clear()
        docs = dict(self.load_documents())
        docs.update(self.load_rule_documents())
        for fname, body in docs.items():
            if not body.strip():
                continue
            for ch in self.chunk_documents(body, fname):
                emb = self.embedder.embed(ch["text"])
                self.retriever.add(
                    embedding=emb,
                    text=ch["text"],
                    source=ch["source"],
                    namespace="policy_global",
                    metadata={"part": ch["part"]},
                )
        if index_path is not None:
            index_path.parent.mkdir(parents=True, exist_ok=True)
            self.save_index(index_path)

    def add_borrower_document(self, arn: str, text: str, doc_type: str) -> None:
        ns = f"borrower_{arn}"
        for ch in self.chunk_documents(text, doc_type):
            emb = self.embedder.embed(ch["text"])
            self.retriever.add(
                embedding=emb,
                text=ch["text"],
                source=doc_type,
                namespace=ns,
                metadata={"arn": arn, "part": ch["part"]},
            )

    def save_index(self, path: Path) -> None:
        path.write_text(json.dumps(self.retriever.to_serializable(), ensure_ascii=False), encoding="utf-8")

    def load_index(self, path: Path) -> None:
        raw = path.read_text(encoding="utf-8")
        self.retriever.load_serializable(json.loads(raw))
