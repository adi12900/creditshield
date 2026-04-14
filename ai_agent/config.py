"""
Configuration from environment variables.
"""

import os
from decimal import Decimal
from pathlib import Path

from dotenv import load_dotenv

_REPO_ROOT = Path(__file__).resolve().parent.parent


def _load_dotenv_files() -> None:
    """
    Load env files so the agent sees Backend/.env even when cwd is repo root (pytest, scripts).

    We use override=True so values from these files win over stale shell/IDE variables
    (e.g. MOCK_MODE=true left in the environment hides Backend/.env's MOCK_MODE=false).

    Later files override earlier: Backend/.env → repo .env → cwd .env.
    Production: rely on real env vars only, or keep a single mounted .env consistent with deploy.
    """
    load_dotenv(_REPO_ROOT / "Backend" / ".env", override=True)
    load_dotenv(_REPO_ROOT / ".env", override=True)
    load_dotenv(override=True)


_load_dotenv_files()


def _truthy(val: str | None, default: bool = False) -> bool:
    if val is None:
        return default
    return val.strip().lower() in ("1", "true", "yes", "on")


def _has_aws_credentials() -> bool:
    return bool(os.environ.get("AWS_ACCESS_KEY_ID") and os.environ.get("AWS_SECRET_ACCESS_KEY"))


AWS_REGION = os.environ.get("AWS_REGION", "ap-south-1")
AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")
BEDROCK_MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "meta.llama3-70b-instruct-v1:0")
BEDROCK_EMBEDDING_MODEL = os.environ.get(
    "BEDROCK_EMBEDDING_MODEL", "amazon.titan-embed-text-v2:0"
)

_env_mock = os.environ.get("MOCK_MODE")
if _env_mock is not None:
    MOCK_MODE = _truthy(_env_mock, default=False)
else:
    MOCK_MODE = not _has_aws_credentials()

VECTOR_STORE = os.environ.get("VECTOR_STORE", "in_memory")
MAX_TOKENS = int(os.environ.get("MAX_TOKENS", "2048"))
TEMPERATURE = Decimal(os.environ.get("TEMPERATURE", "0.1"))
RAG_TOP_K = int(os.environ.get("RAG_TOP_K", "5"))
RAG_CHUNK_SIZE = int(os.environ.get("RAG_CHUNK_SIZE", "512"))
RAG_CHUNK_OVERLAP = int(os.environ.get("RAG_CHUNK_OVERLAP", "50"))

# IVL category weights for composite score (sum = 1.0)
IVL_CATEGORY_WEIGHTS: dict[str, Decimal] = {
    "IS": Decimal("0.28"),
    "CF": Decimal("0.22"),
    "EP": Decimal("0.15"),
    "ST": Decimal("0.18"),
    "FD": Decimal("0.10"),
    "LB": Decimal("0.04"),
    "DF": Decimal("0.03"),
}
