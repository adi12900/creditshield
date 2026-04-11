from datetime import datetime, timezone

from app.extensions import db


def utcnow():
    return datetime.now(timezone.utc)


class LoanApplication(db.Model):
    __tablename__ = "loan_applications"

    id = db.Column(db.Integer, primary_key=True)
    arn = db.Column(db.String(64), unique=True, nullable=False, index=True)

    borrower_name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(32), nullable=False)
    pan_last_four = db.Column(db.String(4), nullable=True)

    state = db.Column(db.String(64), nullable=False)
    city = db.Column(db.String(128), nullable=False)

    employment_type = db.Column(db.String(64), nullable=False)
    monthly_income_inr = db.Column(db.Numeric(14, 2), nullable=False)
    requested_amount_inr = db.Column(db.Numeric(14, 2), nullable=False)
    tenure_months = db.Column(db.Integer, nullable=False)
    purpose = db.Column(db.String(255), nullable=False)

    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
        nullable=False,
    )

    risk_score = db.Column(db.Float, nullable=True)
    risk_tier = db.Column(db.String(32), nullable=True)
    default_probability = db.Column(db.Float, nullable=True)
    decision = db.Column(db.String(32), nullable=True)
    decision_at = db.Column(db.DateTime(timezone=True), nullable=True)
    model_version = db.Column(db.String(64), nullable=True)
    shap_explanation = db.Column(db.JSON, nullable=True)
