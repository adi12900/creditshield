import logging
import sys
from pathlib import Path

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.api.v1.risk.loan_appraisal_routes import router as loan_appraisal_router
from app.api.v1.auth.auth_routes import router as auth_router
from app.api.v1.borrower.borrower_auth_routes import router as borrower_auth_router
from app.api.v1.borrower.borrower_journey_routes import router as borrower_journey_router
from app.api.v1.borrower.document_upload_routes import router as document_upload_router
from app.api.v1.borrower.kyc_otp_routes import router as kyc_otp_router
from app.api.v1.risk.setu_routes import router as setu_router
from app.api.v1.users.user_routes import router as users_router
from app.api.v1.workflow.role_routes import router as workflow_router
from app.api.v1.workflow.document_proxy_routes import router as document_proxy_router
from app.core.config import settings
from app.core.database import SessionLocal
from app.models import borrower as _borrower_models  # noqa: F401
from app.models import user as _user_models  # noqa: F401
from app.models import aadhaar_registry as _aadhaar_models  # noqa: F401
from app.services.risk.setu_aa_service import setu_aa_service

logger = logging.getLogger("uvicorn.error")

_REPO_ROOT = Path(__file__).resolve().parents[2]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

try:
    from ai_agent.fastapi_router import agent_router  # noqa: E402
except ModuleNotFoundError as exc:  # pragma: no cover - environment dependent
    agent_router = None
    logger.warning("AI agent routes disabled due to missing dependency: %s", exc)

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if agent_router is not None:
    app.include_router(agent_router, prefix="/api/v1/agent")


@app.on_event("startup")
def startup_database_check() -> None:
    try:
        with SessionLocal() as db:
            db.execute(text("SELECT 1"))
        logger.info("Database connection status: connected")
    except SQLAlchemyError as exc:
        logger.error("Database connection status: failed (%s)", exc.__class__.__name__)


@app.on_event("shutdown")
async def shutdown_setu_client() -> None:
    await setu_aa_service.close()


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "environment": settings.app_env}


@app.get("/health/db")
def database_health_check() -> dict[str, str]:
    try:
        with SessionLocal() as db:
            db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database connection failed: {exc.__class__.__name__}",
        ) from exc


app.include_router(setu_router, prefix="/api/v1/setu")
app.include_router(loan_appraisal_router, prefix="/api/v1/loan-appraisal")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(borrower_auth_router, prefix="/api/v1")
app.include_router(borrower_journey_router, prefix="/api/v1")
app.include_router(document_upload_router)  # No prefix - uses /borrower from router
app.include_router(kyc_otp_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(workflow_router, prefix="/api/v1")
app.include_router(document_proxy_router)  # Uses /api/v1/documents from router
