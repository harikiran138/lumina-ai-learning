from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
import os


class Settings(BaseSettings):
    PROJECT_NAME: str = "Lumina Learning Platform"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: Optional[str] = None
    JWT_SECRET: Optional[str] = None
    JWT_REFRESH_SECRET: Optional[str] = None
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # 30 minutes (Replaced 8 days for security)

    # Database
    DATABASE_URL: str = "postgresql://lumina:lumina_password@localhost:5432/lumina_db"
    
    # Supabase
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://odyjksznsdeyweylovzl.supabase.co")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "sb_publishable_6zHeJDU5hRv8c5dfW87W3A_3ZG5JlMQ")
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")

    # Server
    HOST: str = "0.0.0.0"  # nosec B104
    PORT: int = 8000
    SECURE_COOKIES: bool = False  # Set True in production (HTTPS required)

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
        env = os.getenv("ENVIRONMENT", "").lower()
        is_prod = env == "production"
        
        # Mandatory Secrets Check
        secrets = {
            "SECRET_KEY": self.SECRET_KEY,
            "JWT_SECRET": self.JWT_SECRET,
            "JWT_REFRESH_SECRET": self.JWT_REFRESH_SECRET
        }
        
        missing = [k for k, v in secrets.items() if not v or (is_prod and len(v) < 32)]
        
        if missing:
            if is_prod:
                import logging
                logger = logging.getLogger("uvicorn.error")
                logger.critical(f"SECURITY ALERT: Missing or weak secrets in PRODUCTION ({', '.join(missing)}). Deployment blocked.")
                raise ValueError(f"PRODUCTION REQUIREMENT: {', '.join(missing)} must be set and at least 32 characters long.")
            else:
                # Default for local development ONLY if not in prod
                self.SECRET_KEY = self.SECRET_KEY or "dev_secret_only_for_local_testing_min_32_chars_long_12345"
                self.JWT_SECRET = self.JWT_SECRET or "dev_jwt_secret_only_for_local_testing_min_32_chars_long_12345"
                self.JWT_REFRESH_SECRET = self.JWT_REFRESH_SECRET or "dev_refresh_secret_only_for_local_testing_min_32_chars_long_12345"


settings = Settings()
