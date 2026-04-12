from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "CreditShield Backend"
    app_env: str = "development"
    database_url: str = (
        "postgresql://postgres:[YOUR-PASSWORD]@db.chzunmbdqywleaqxbsqw.supabase.co:5432/postgres"
    )

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
