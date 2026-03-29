from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path


class Settings(BaseSettings):
    # App
    app_name: str = "HandwrittenAssignment"
    secret_key: str = "dev-secret-change-me"
    debug: bool = True
    allowed_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Database
    database_url: str = "sqlite+aiosqlite:///./handwritten_lms.db"

    # HuggingFace
    huggingface_api_token: str = ""
    trocr_model: str = "microsoft/trocr-large-handwritten"
    hf_llm_model: str = "mistralai/Mistral-7B-Instruct-v0.3"

    # OpenAI fallback
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Storage
    upload_dir: Path = Path("./uploads")
    max_file_size_mb: int = 20

    # OCR
    ocr_confidence_threshold: float = 0.70
    image_min_dpi: int = 150

    @property
    def use_openai(self) -> bool:
        return bool(self.openai_api_key)

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()
