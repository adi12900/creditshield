from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class LoanApplication(Base):
    __tablename__ = "loan_applications"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    arn: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    borrower_name: Mapped[str] = mapped_column(String(150), nullable=False)
    borrower_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    borrower_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    loan_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    loan_type: Mapped[str] = mapped_column(String(80), nullable=False)
    stage: Mapped[str] = mapped_column(String(40), nullable=False, default="Submitted")
    risk_grade: Mapped[str] = mapped_column(String(2), nullable=False)
    credit_score: Mapped[int] = mapped_column(Integer, nullable=False)
    kyc_status: Mapped[str] = mapped_column(String(20), nullable=False)
    is_cibil_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    employment_type: Mapped[str] = mapped_column(String(20), nullable=False)
    purpose: Mapped[str | None] = mapped_column(String(255), nullable=True)
    co_applicant_details: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    borrower_id: Mapped[int | None] = mapped_column(ForeignKey("borrowers.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
