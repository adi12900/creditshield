import os
from datetime import timedelta
from pathlib import Path


def _sqlite_dev_uri() -> str:
    instance_dir = Path(__file__).resolve().parent.parent / "instance"
    instance_dir.mkdir(parents=True, exist_ok=True)
    db_path = instance_dir / "creditshield_dev.db"
    return "sqlite:///" + str(db_path).replace("\\", "/")


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me-use-32-chars-min")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get(
        "JWT_SECRET_KEY",
        "dev-jwt-secret-change-me-minimum-32-characters",
    )
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=7)
    JWT_TOKEN_LOCATION = ("headers",)
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"


class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL") or _sqlite_dev_uri()


config_by_name = {
    "development": DevelopmentConfig,
    "default": DevelopmentConfig,
}
