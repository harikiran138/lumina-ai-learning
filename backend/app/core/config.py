from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
import os


class Settings(BaseSettings):
    PROJECT_NAME: str = "Lumina Learning Platform"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "change_this_to_a_secure_random_string"
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
    SECURE_COOKIES: bool = False  # Set True in production (HTTPS required)

    # AI Configuration - Use GEMINI_API_KEY for both tutor and assessment
    ASSESSMENT_API_KEY: Optional[str] = None
    SENTRY_DSN: Optional[str] = None

    model_config = SettingsConfigDict(env_file=(".env", "../.env", "../../.env"), extra="ignore")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # If ASSESSMENT_API_KEY not set, use GEMINI_API_KEY
        if not self.ASSESSMENT_API_KEY:
            self.ASSESSMENT_API_KEY = os.getenv("GEMINI_API_KEY")


settings = Settings()
