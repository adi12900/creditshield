from decimal import Decimal

from sqlalchemy import ForeignKey, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class EducationLoanDetails(Base):
    __tablename__ = "education_loan_details"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    loan_application_id: Mapped[int] = mapped_column(
        ForeignKey("loan_applications.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    course_name: Mapped[str] = mapped_column(String(100), nullable=False)
    specialization: Mapped[str | None] = mapped_column(String(100), nullable=True)
    college_name: Mapped[str] = mapped_column(String(150), nullable=False)
    university_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    admission_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    entrance_exam: Mapped[str | None] = mapped_column(String(50), nullable=True)
    entrance_score: Mapped[str | None] = mapped_column(String(50), nullable=True)
    course_duration: Mapped[int | None] = mapped_column(Integer, nullable=True)
    year_of_study: Mapped[int | None] = mapped_column(Integer, nullable=True)
    academic_percentages: Mapped[list[dict]] = mapped_column(
        JSONB,
        nullable=False,
        default=list,
        server_default='[]',
    )
    tuition_fee: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    hostel_fee: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    other_expenses: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)

    application = relationship("LoanApplication", back_populates="education_details")