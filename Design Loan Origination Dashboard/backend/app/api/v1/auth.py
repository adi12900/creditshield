from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt_identity, jwt_required

from app.extensions import db
from app.models.user import User
from app.schemas.user import LoginSchema, UserSchema
from app.security import verify_password

bp = Blueprint("auth", __name__, url_prefix="/api/v1/auth")

login_schema = LoginSchema()
user_schema = UserSchema()


@bp.post("/login")
def login():
    data = login_schema.load(request.get_json(silent=True) or {})
    user = User.query.filter_by(email=data["email"].lower().strip()).first()
    if not user or not verify_password(user.password_hash, data["password"]):
        return jsonify({"error": "unauthorized", "message": "Invalid email or password"}), 401

    identity = str(user.id)
    access = create_access_token(
        identity=identity,
        additional_claims={"role": user.role},
    )
    refresh = create_refresh_token(identity=identity)
    return jsonify(
        {
            "access_token": access,
            "refresh_token": refresh,
            "token_type": "Bearer",
        }
    )


@bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    user = db.session.get(User, int(identity))
    if not user:
        return jsonify({"error": "unauthorized", "message": "User not found"}), 401

    access = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role},
    )
    return jsonify({"access_token": access, "token_type": "Bearer"})


@bp.get("/me")
@jwt_required()
def me():
    identity = get_jwt_identity()
    user = db.session.get(User, int(identity))
    if not user:
        return jsonify({"error": "unauthorized", "message": "User not found"}), 401
    return jsonify(user_schema.dump(user))
