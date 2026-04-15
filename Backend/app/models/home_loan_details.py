from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class HomeLoanDetails(Base):
    __tablename__ = "home_loan_details"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    loan_application_id: Mapped[int] = mapped_column(
        ForeignKey("loan_applications.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    property_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    property_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    property_location: Mapped[str | None] = mapped_column(Text, nullable=True)
    builder_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    property_value: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    down_payment: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    loan_to_value: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    purpose: Mapped[str | None] = mapped_column(String(100), nullable=True)

    application = relationship("LoanApplication", back_populates="home_details")