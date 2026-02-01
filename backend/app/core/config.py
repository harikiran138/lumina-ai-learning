from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    PROJECT_NAME: str = "Lumina Learning Platform"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "change_this_to_a_secure_random_string"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days

    # Database
    DATABASE_URL: str = "postgresql://lumina:lumina_password@localhost:5432/lumina_db"
    MONGODB_URI: Optional[str] = "mongodb://localhost:27017"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # AI Configuration - Use GEMINI_API_KEY for both tutor and assessment
    ASSESSMENT_API_KEY: Optional[str] = None
    SENTRY_DSN: Optional[str] = None

    class Config:
        env_file = ".env"
        extra = "ignore"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # If ASSESSMENT_API_KEY not set, use GEMINI_API_KEY
        if not self.ASSESSMENT_API_KEY:
            self.ASSESSMENT_API_KEY = os.getenv("GEMINI_API_KEY")


settings = Settings()
