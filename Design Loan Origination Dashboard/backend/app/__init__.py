from dotenv import load_dotenv
from flask import Flask, jsonify

from app.api import register_blueprints
from app.cli import register_cli
from app.config import config_by_name
from app.errors import register_error_handlers
from app.extensions import cors, db, jwt, ma, migrate


def create_app(config_name: str | None = None) -> Flask:
    load_dotenv()
    name = (config_name or "development").lower()
    config_class = config_by_name.get(name, config_by_name["default"])

    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)
    ma.init_app(app)
    jwt.init_app(app)
    cors.init_app(app)

    from app import models  # noqa: F401

    register_error_handlers(app)
    register_jwt_handlers(jwt)
    register_blueprints(app)
    register_cli(app)

    return app


def register_jwt_handlers(jwt_manager):
    @jwt_manager.expired_token_loader
    def expired_token_callback(_jwt_header, _jwt_payload):
        return jsonify({"error": "unauthorized", "message": "Token has expired"}), 401

    @jwt_manager.invalid_token_loader
    def invalid_token_callback(reason):
        return jsonify({"error": "unauthorized", "message": reason or "Invalid token"}), 401

    @jwt_manager.unauthorized_loader
    def missing_token_callback(reason):
        return jsonify({"error": "unauthorized", "message": reason or "Authorization required"}), 401
