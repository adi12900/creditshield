from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class AadhaarRegistry(Base):
    """
    Pre-loaded Aadhaar registry for KYC verification.
    Stores SHA-256 hashed Aadhaar numbers mapped to emails.
    """
    __tablename__ = "aadhaar_registry"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    aadhaar_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
