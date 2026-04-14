from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class BorrowerKycProfile(Base):
    __tablename__ = "borrower_kyc_profiles"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    borrower_id: Mapped[int] = mapped_column(ForeignKey("borrowers.id", ondelete="CASCADE"), unique=True, nullable=False)
    kyc_status: Mapped[str] = mapped_column(String(20), nullable=False)
    kyc_provider: Mapped[str] = mapped_column(String(30), nullable=False, default="digilocker")
    kyc_reference_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
