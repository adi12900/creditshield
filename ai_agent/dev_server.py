"""
Minimal FastAPI app for local agent testing without the main CreditShield backend.
"""

from __future__ import annotations

from fastapi import FastAPI

from ai_agent.fastapi_router import agent_router

app = FastAPI(
    title="CreditShield Agent — Dev Server",
    description="Standalone agent test server",
    version="1.0.0",
)

app.include_router(agent_router, prefix="/api/v1/agent")


@app.get("/")
async def root() -> dict:
    """Root metadata and links for the dev server."""
    return {
        "message": "CreditShield Agent Dev Server",
        "docs": "/docs",
        "health": "/api/v1/agent/health",
    }
