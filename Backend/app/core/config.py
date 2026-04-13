from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "CreditShield Backend"
    app_env: str = "development"
    database_url: str = (
        "postgresql://postgres:[YOUR-PASSWORD]@db.chzunmbdqywleaqxbsqw.supabase.co:5432/postgres"
    )
    # Setu AA v2 endpoints
    setu_base_url: str = "https://fiu-sandbox.setu.co"
    setu_production_base_url: str = "https://fiu.setu.co"
    setu_client_id: str = ""
    setu_client_secret: str = ""
    setu_product_instance_id: str = ""
    setu_token_url: str = "https://orgservice-prod.setu.co/v1/users/login"
    setu_consent_path: str = "/v2/consents"
    setu_consent_get_path_template: str = "/v2/consents/{request_id}"
    setu_sessions_path: str = "/v2/sessions"
    setu_sessions_get_path_template: str = "/v2/sessions/{session_id}"
    setu_request_timeout_seconds: float = 30.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
