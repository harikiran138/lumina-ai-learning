from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
import os


class Settings(BaseSettings):
    PROJECT_NAME: str = "Lumina Learning Platform"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: Optional[str] = None
    JWT_SECRET: Optional[str] = None
    JWT_REFRESH_SECRET: Optional[str] = None
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days

    # Database
    DATABASE_URL: str = "postgresql://lumina:lumina_password@localhost:5432/lumina_db"
    
    # Supabase
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://odyjksznsdeyweylovzl.supabase.co")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "sb_publishable_6zHeJDU5hRv8c5dfW87W3A_3ZG5JlMQ")
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    # Server
    HOST: str = "0.0.0.0"  # nosec B104
    PORT: int = 8000
    SECURE_COOKIES: bool = True if str(os.getenv("ENVIRONMENT")).lower() == "production" else str(os.getenv("SECURE_COOKIES", "True")).lower() == "true"

    # AI Configuration - Use GEMINI_API_KEY for both tutor and assessment
    ASSESSMENT_API_KEY: Optional[str] = None
    SENTRY_DSN: Optional[str] = None

    # Handwritten Assignment System
    HF_TOKEN: Optional[str] = os.getenv("HF_TOKEN")
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    MAX_FILE_SIZE_MB: int = 10
    UPLOAD_DIR: str = "uploads/handwritten"

    model_config = SettingsConfigDict(env_file=(".env", "../.env", "../../.env"), extra="ignore")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # If ASSESSMENT_API_KEY not set, use GEMINI_API_KEY
        if not self.ASSESSMENT_API_KEY:
            self.ASSESSMENT_API_KEY = os.getenv("GEMINI_API_KEY")

        # Security Check for Production or Development Secret Presence
        is_prod = os.getenv("ENVIRONMENT", "").lower() == "production"
        
        # Mandatory Secrets Check
        if not self.SECRET_KEY or not self.JWT_SECRET or not self.JWT_REFRESH_SECRET:
            if is_prod:
                import logging
                logging.getLogger("uvicorn.error").critical("SECURITY ALERT: Missing secrets in PRODUCTION environment. Deployment blocked.")
                raise ValueError("SECRET_KEY, JWT_SECRET, and JWT_REFRESH_SECRET MUST be set in .env for production.")
            else:
                # Default for local development ONLY if not in prod
                self.SECRET_KEY = self.SECRET_KEY or "dev_secret_only_for_local_testing"
                self.JWT_SECRET = self.JWT_SECRET or "dev_jwt_secret_only_for_local_testing"
                self.JWT_REFRESH_SECRET = self.JWT_REFRESH_SECRET or "dev_refresh_secret_only_for_local_testing"


settings = Settings()
