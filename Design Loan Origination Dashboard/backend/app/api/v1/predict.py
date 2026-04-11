from datetime import datetime, timezone

from flask import Blueprint, jsonify, request

from app.extensions import db
from app.models.loan_application import LoanApplication
from app.rbac import role_required
from app.schemas.loan_application import LoanApplicationSchema, PredictBodySchema

bp = Blueprint("predict", __name__, url_prefix="/api/v1")

body_schema = PredictBodySchema()
loan_schema = LoanApplicationSchema()

MOCK_MODEL_VERSION = "mock-v0"


def _mock_from_application(app_row: LoanApplication) -> dict:
    """Deterministic mock outputs from application attributes (foundation only)."""
    amount = float(app_row.requested_amount_inr or 0)
    income = float(app_row.monthly_income_inr or 1)
    ratio = amount / max(income, 1)
    base = (hash(app_row.arn) % 1000) / 1000.0
    default_probability = min(0.95, max(0.02, 0.15 + ratio * 0.02 + base * 0.1))
    risk_score = round(300 + (1 - default_probability) * 550, 1)
    if default_probability < 0.12:
        tier = "low"
        decision = "approve"
    elif default_probability < 0.22:
        tier = "medium"
        decision = "refer"
    else:
        tier = "high"
        decision = "decline"

    shap_explanation = [
        {"feature": "requested_amount_inr", "value": float(app_row.requested_amount_inr), "contribution": round(ratio * 0.04, 4)},
        {"feature": "monthly_income_inr", "value": float(app_row.monthly_income_inr), "contribution": round(-0.02 if income > 50000 else 0.01, 4)},
        {"feature": "tenure_months", "value": app_row.tenure_months, "contribution": round(app_row.tenure_months * 0.0001, 4)},
    ]
    return {
        "arn": app_row.arn,
        "risk_score": risk_score,
        "risk_tier": tier,
        "default_probability": round(default_probability, 4),
        "decision": decision,
        "model_version": MOCK_MODEL_VERSION,
        "shap_explanation": shap_explanation,
    }


@bp.post("/predict")
@role_required("analyst", "underwriter", "admin")
def predict():
    payload = body_schema.load(request.get_json(silent=True) or {})
    arn = payload["arn"].strip()
    persist = payload.get("persist", True)

    app_row = LoanApplication.query.filter_by(arn=arn).first()
    if not app_row:
        return jsonify({"error": "not_found", "message": "Application not found for ARN"}), 404

    result = _mock_from_application(app_row)

    if persist:
        app_row.risk_score = result["risk_score"]
        app_row.risk_tier = result["risk_tier"]
        app_row.default_probability = result["default_probability"]
        app_row.decision = result["decision"]
        app_row.model_version = result["model_version"]
        app_row.shap_explanation = result["shap_explanation"]
        app_row.decision_at = datetime.now(timezone.utc)
        db.session.commit()
        result["application"] = loan_schema.dump(app_row)
    else:
        result["application"] = loan_schema.dump(app_row)

    return jsonify(result)
