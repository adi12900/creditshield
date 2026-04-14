from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.borrower import Borrower
from app.schemas.borrower import BorrowerSignupRequest


def get_borrower_by_email(db: Session, email: str) -> Borrower | None:
    return db.query(Borrower).filter(Borrower.email == email).first()


def get_borrower_by_mobile(db: Session, mobile_number: str) -> Borrower | None:
    return db.query(Borrower).filter(Borrower.mobile_number == mobile_number).first()


def get_borrower_by_identifier(db: Session, identifier: str) -> Borrower | None:
    return db.query(Borrower).filter(
        or_(Borrower.email == identifier, Borrower.mobile_number == identifier)
    ).first()


def create_borrower(db: Session, payload: BorrowerSignupRequest) -> Borrower:
    borrower = Borrower(
        full_name=payload.full_name,
        email=str(payload.email),
        mobile_number=payload.mobile_number,
        password_hash=hash_password(payload.password),
        is_active=True,
    )
    db.add(borrower)
    db.commit()
    db.refresh(borrower)
    return borrower
