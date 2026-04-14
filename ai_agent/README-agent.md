# CreditShield `ai_agent` — Agentic AI layer (standalone)

Self-contained module for AI-powered loan default risk assistance. No Flask, SQLAlchemy, or app routes.

## Architecture (ASCII)

```
┌─────────────────────┐
│ AgentOrchestrator   │
└─────────┬───────────┘
          │ validate ARN, ensure policy RAG index
          ▼
┌─────────────────────┐     ┌──────────────────┐
│ LlamaAgent (ReAct)  │────▶│ BedrockClient    │
└─────────┬───────────┘     │ (Llama 3 70B)    │
          │                 │ MOCK_MODE ▶ mock │
          ▼                 └──────────────────┘
┌─────────────────────────────────────────────┐
│ Tools: income, fraud, rules, improve,       │
│        doc RAG, policy RAG                  │
└─────────┬───────────────────────────────────┘
          │
          ▼
┌─────────────────────┐     ┌──────────────────┐
│ DataAdapter (ABC)   │     │ KnowledgeBase    │
│ MockDataAdapter     │     │ Embedder+Retriever│
└─────────────────────┘     └──────────────────┘
```

## Setup

```bash
cd "Design Loan Origination Dashboard"
pip install -r ai_agent/requirements-agent.txt
```

Run tests (from the same directory):

```bash
set PYTHONPATH=.
python -m pytest ai_agent/tests -v
```

(On PowerShell, `$env:PYTHONPATH="."` before pytest.)

## Environment variables

| Variable | Description |
|----------|-------------|
| `AWS_REGION` | Bedrock region (default `ap-south-1`). |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Optional; if both missing, `MOCK_MODE` defaults on. |
| `MOCK_MODE` | `true`/`false` — force mock even with credentials if `true`. |
| `BEDROCK_MODEL_ID` | Default `meta.llama3-70b-instruct-v1:0`. |
| `BEDROCK_EMBEDDING_MODEL` | Default `amazon.titan-embed-text-v2:0`. |
| `VECTOR_STORE` | `in_memory` (default) or `pgvector` (placeholder — falls back to in-memory). |
| `MAX_TOKENS`, `TEMPERATURE`, `RAG_TOP_K`, `RAG_CHUNK_SIZE`, `RAG_CHUNK_OVERLAP` | Tuning knobs. |

## Mock mode (zero AWS setup)

Unset AWS keys or set `MOCK_MODE=true`. The Bedrock client returns canned text; embeddings use deterministic mock vectors; Titan/Bedrock are not called.

## Real AWS Bedrock

1. Enable model access for Llama 3 70B Instruct and Titan Embed Text v2 in **ap-south-1**.
2. Export credentials (or use an IAM role).
3. Set `MOCK_MODE=false`.

## Borrower documents in RAG

```python
from ai_agent.rag.knowledge_base import KnowledgeBase
from ai_agent.rag.embedder import Embedder
from ai_agent.rag.retriever import Retriever

emb = Embedder()
ret = Retriever()
kb = KnowledgeBase(embedder=emb, retriever=ret)
kb.add_borrower_document("APPROVE-2026-001", "Salary credit ₹75,000 from ACME Pvt Ltd …", "SALARY_SLIP")
```

Namespace: `borrower_{arn}` for `search_borrower_documents`.

## Plug into Flask (later)

```python
from ai_agent.pipeline.agent_orchestrator import AgentOrchestrator

orchestrator = AgentOrchestrator()
result = orchestrator.analyse_application(arn, query)
```

Swap `MockDataAdapter` for a real `DataAdapter` implementation when the DB layer exists.

## Demo queries

- "Why was this application rejected?"
- "What can this borrower do to qualify?"
- "Summarise the income verification results"
- "Are there any fraud signals?"
- "Is this borrower eligible for a home loan instead?"

## Llama 3 prompt format

Prompts are built in `ai_agent/bedrock/prompts.py` using the Bedrock-documented template with `<|begin_of_text|>`, `<|redacted_start_header_id|>`, `<|eot_id|>`, etc. Do not alter token strings casually — malformed prompts yield empty generations.
