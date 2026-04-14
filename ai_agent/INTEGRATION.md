# FastAPI integration — CreditShield AI agent

## Mounting the agent router

```python
# In your FastAPI main.py — 3 lines to integrate
from ai_agent.fastapi_router import agent_router

app.include_router(agent_router, prefix="/api/v1/agent")
```

Ensure the application process can import the `ai_agent` package (e.g. set `PYTHONPATH` to the project root that contains `ai_agent/`).

## Dependencies to add to backend `requirements.txt`

```
fastapi
uvicorn
pydantic>=2.0
boto3>=1.34.0
sentence-transformers>=2.7.0
numpy>=1.26.0
```

Alternatively install everything from `ai_agent/requirements-agent.txt`.

## Environment variables required

```
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
BEDROCK_MODEL_ID=meta.llama3-70b-instruct-v1:0
MOCK_MODE=false
```

If `MOCK_MODE` is unset and AWS keys are missing, the agent defaults to mock mode (see `ai_agent/config.py`).

## Auth integration

The router does not enforce JWT or API keys. Wrap it with your middleware or router dependencies:

```python
from fastapi import Depends
from .auth import verify_token

app.include_router(
    agent_router,
    prefix="/api/v1/agent",
    dependencies=[Depends(verify_token)],
)
```

## DataAdapter — how to connect a real database

When your ORM models are ready, implement a concrete `DataAdapter` (see `ai_agent/data_adapter.py`) and construct `AgentOrchestrator` with it. The stock `AsyncAgentOrchestrator` currently wraps the default `AgentOrchestrator()` (mock adapter). To inject a custom adapter without editing orchestrator internals, extend `AsyncAgentOrchestrator` in your backend or add a factory hook in your own code that builds the orchestrator your way.

Example sketch:

```python
# Your backend module
class PostgresDataAdapter(DataAdapter):
    def get_application(self, arn):
        # Query your LoanApplication model here
        pass

    def get_ivl_score(self, arn):
        # Query your IVL results table here
        pass
```

Then wire that adapter into whichever service layer constructs the agent.

## API endpoints (after mount)

| Method | Path |
|--------|------|
| POST | `/api/v1/agent/analyse` |
| POST | `/api/v1/agent/explain-borrower` |
| POST | `/api/v1/agent/batch-analyse` |
| GET | `/api/v1/agent/health` |
| GET | `/api/v1/agent/tools` |

## Testing without the main backend

### Option A — router-only test app

```bash
uvicorn ai_agent.fastapi_router:test_app --port 8001
```

Open `http://localhost:8001/docs`.

### Option B — dev server (includes `/` landing JSON)

```bash
uvicorn ai_agent.dev_server:app --port 8001 --reload
```

## RAG index (optional but recommended)

From the project root that contains `ai_agent/`:

```bash
pip install -r ai_agent/requirements-agent.txt
python ai_agent/rag/scripts/build_rag_index.py
python ai_agent/rag/scripts/verify_rag.py
```

The orchestrator still builds an in-memory policy index on first use unless you extend loading from `rag/index/` in your own integration.
