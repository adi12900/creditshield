#!/usr/bin/env python3
"""
Build the RAG index: policy documents + ``documents/rules/*``, persist to ``rag/index/``.
"""

from __future__ import annotations

import argparse
import logging
import sys
import time
from pathlib import Path

_SCRIPT_DIR = Path(__file__).resolve().parent
_RAG_ROOT = _SCRIPT_DIR.parent
_AI_AGENT_ROOT = _RAG_ROOT.parent
_PROJECT_ROOT = _AI_AGENT_ROOT.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")

DEFAULT_INDEX_PATH = _RAG_ROOT / "index" / "rag_index.json"


def main() -> int:
    parser = argparse.ArgumentParser(description="Build CreditShield RAG index (policy + rules)")
    parser.add_argument(
        "--index-out",
        type=Path,
        default=DEFAULT_INDEX_PATH,
        help="Output JSON path for the serialised retriever",
    )
    args = parser.parse_args()

    t0 = time.perf_counter()

    from ai_agent import config
    from ai_agent.rag.embedder import Embedder
    from ai_agent.rag.knowledge_base import KnowledgeBase
    from ai_agent.rag.retriever import Retriever

    embedder = Embedder(mock_mode=config.MOCK_MODE)
    kb = KnowledgeBase(embedder=embedder, retriever=Retriever())

    policy_slots = len(kb.load_documents())
    rule_docs = kb.load_rule_documents()
    kb.build_index(index_path=args.index_out)

    chunks = len(kb.retriever._texts)  # noqa: SLF001
    if config.MOCK_MODE:
        embed_label = "MOCK_MODE deterministic hash vectors"
    elif embedder._client is None:  # noqa: SLF001
        embed_label = "sentence-transformers (no Bedrock embedding client)"
    else:
        embed_label = (
            f"{config.BEDROCK_EMBEDDING_MODEL} "
            "(sentence-transformers used if Titan invoke fails)"
        )

    elapsed = time.perf_counter() - t0
    print()
    print("========== RAG INDEX BUILD SUMMARY ==========")
    print(f"Policy document slots (fixed list): {policy_slots}")
    print(f"Rule files under rules/: {len(rule_docs)}")
    print(f"Total chunks indexed: {chunks}")
    print(f"Embedding path label: {embed_label}")
    print(f"Index saved to: {args.index_out.resolve()}")
    print(f"Time taken: {elapsed:.2f}s")
    print("============================================")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
