from flask import Blueprint, jsonify
from sqlalchemy import text

from app.extensions import db

bp = Blueprint("health", __name__, url_prefix="/api/v1")


@bp.get("/health")
def health():
    return jsonify({"status": "ok", "service": "creditshield-api"})


@bp.get("/health/ready")
def health_ready():
    try:
        db.session.execute(text("SELECT 1"))
    except Exception:
        return jsonify({"status": "not_ready", "database": "unavailable"}), 503
    return jsonify({"status": "ready", "database": "ok"})


@bp.get("/health/integrations")
def health_integrations():
    return jsonify(
        {
            "integrations": {
                "credit_bureau": {
                    "status": "stub",
                    "message": "Bureau pull not wired in foundation phase.",
                },
                "kyc_provider": {
                    "status": "stub",
                    "message": "KYC vendor integration placeholder.",
                },
                "model_registry": {
                    "status": "stub",
                    "message": "Model registry not connected.",
                },
            }
        }
    )
