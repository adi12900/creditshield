from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class FieldVerificationEvidence(Base):
    __tablename__ = "field_verification_evidence"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    borrower_id: Mapped[int] = mapped_column(ForeignKey("borrowers.id", ondelete="CASCADE"), nullable=False, index=True)
    application_id: Mapped[int] = mapped_column(ForeignKey("loan_applications.id", ondelete="CASCADE"), nullable=False, index=True)
    arn: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    loan_type: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    verification_section: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    evidence_type: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    storage_url: Mapped[str] = mapped_column(Text, nullable=False)
    uploaded_by_role: Mapped[str] = mapped_column(String(32), nullable=False, default="field_officer")
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    captured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
