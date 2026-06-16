from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.user import User, UserRole as ModelUserRole
from app.schemas.user import UserCreate, UserUpdate


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, payload: UserCreate) -> User:
    user = User(
        full_name=payload.full_name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=ModelUserRole(payload.role.value),
        is_active=payload.is_active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def list_users(db: Session, role: str | None = None) -> list[User]:
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    return query.order_by(User.id.desc()).all()


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def update_user(db: Session, user: User, payload: UserUpdate) -> User:
    updates = payload.model_dump(exclude_unset=True)
    if "role" in updates and updates["role"] is not None:
        updates["role"] = ModelUserRole(updates["role"].value)
    if "password" in updates and updates["password"] is not None:
        updates["password_hash"] = hash_password(updates.pop("password"))

    for field, value in updates.items():
        setattr(user, field, value)

    db.add(user)
    db.commit()
    db.refresh(user)
    return user