from decimal import Decimal

from sqlalchemy import ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class GoldLoanDetails(Base):
    __tablename__ = "gold_loan_details"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    loan_application_id: Mapped[int] = mapped_column(
        ForeignKey("loan_applications.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    gold_type: Mapped[str] = mapped_column(String(50), nullable=False)
    total_weight_grams: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    purity_karat: Mapped[str | None] = mapped_column(String(10), nullable=True)
    item_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    valuation_per_gram: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    total_valuation: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    ltv_ratio: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    approved_loan_amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)

    application = relationship("LoanApplication", back_populates="gold_details")