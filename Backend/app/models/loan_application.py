from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, func
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
    employment_type: Mapped[str] = mapped_column(String(20), nullable=False)
    purpose: Mapped[str | None] = mapped_column(String(255), nullable=True)
    borrower_id: Mapped[int | None] = mapped_column(ForeignKey("borrowers.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    education_details = relationship(
        "EducationLoanDetails",
        back_populates="application",
        cascade="all, delete-orphan",
        uselist=False,
    )
    gold_details = relationship(
        "GoldLoanDetails",
        back_populates="application",
        cascade="all, delete-orphan",
        uselist=False,
    )
    home_details = relationship(
        "HomeLoanDetails",
        back_populates="application",
        cascade="all, delete-orphan",
        uselist=False,
    )
