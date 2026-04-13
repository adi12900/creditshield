#!/usr/bin/env python3
"""
Run a fixed set of queries against a saved RAG index and print top chunks.
"""

from __future__ import annotations

import sys
from pathlib import Path

_SCRIPT_DIR = Path(__file__).resolve().parent
_RAG_ROOT = _SCRIPT_DIR.parent
_AI_AGENT_ROOT = _RAG_ROOT.parent
_PROJECT_ROOT = _AI_AGENT_ROOT.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

DEFAULT_INDEX = _RAG_ROOT / "index" / "rag_index.json"

QUERIES = [
    "What is the FOIR limit for personal loans?",
    "Borrower with 7 active loans across lenders",
    "Self employed income verification GST",
    "CIBIL score below 550 rejection",
    "UPI transaction history thin file borrower",
    "PAN format 10 characters Aadhaar KYC verification",
]


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

    from ai_agent import config
    from ai_agent.rag.embedder import Embedder
    from ai_agent.rag.retriever import Retriever

    index_path = DEFAULT_INDEX
    if not index_path.is_file():
        print(f"Index not found at {index_path}. Run build_rag_index.py first.", file=sys.stderr)
        return 1

    embedder = Embedder(mock_mode=config.MOCK_MODE)
    retriever = Retriever()
    raw = index_path.read_text(encoding="utf-8")
    import json

    retriever.load_serializable(json.loads(raw))

    print("RAG verification (namespace=policy_global, top_k=3)\n")
    for q in QUERIES:
        print(f"Query: {q}")
        emb = embedder.embed(q)
        hits = retriever.search(emb, "policy_global", top_k=3)
        if not hits:
            hits = retriever.keyword_search(q, "policy_global", top_k=3)
        if not hits:
            print("  (no chunks retrieved)\n")
            continue
        for j, h in enumerate(hits, start=1):
            preview = (h.text or "")[:200].replace("\n", " ")
            print(f"  [{j}] score={h.score:.4f} source={h.source}")
            print(f"      {preview!r}...")
        print()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
