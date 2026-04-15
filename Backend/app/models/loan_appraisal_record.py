from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, JSON, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class LoanAppraisalRecord(Base):
    __tablename__ = "loan_appraisal_records"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    application_id: Mapped[int] = mapped_column(
        ForeignKey("loan_applications.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )
    arn: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="success")
    final_score: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    risk_level: Mapped[str | None] = mapped_column(String(60), nullable=True)
    recommendation: Mapped[str | None] = mapped_column(String(80), nullable=True)
    confidence_score: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    rows_analyzed: Mapped[int | None] = mapped_column(nullable=True)
    kpi_metrics: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    report_pdf_storage_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    report_pdf_access_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    report_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
