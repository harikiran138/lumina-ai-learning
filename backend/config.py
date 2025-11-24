"""
Configuration settings for Lumina LMS Backend
"""

from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import validator


class Settings(BaseSettings):
    """Application settings with environment variable support"""

    # Environment
    environment: str = "development"
    debug: bool = True

    # API Settings
    api_host: str = "0.0.0.0"
    api_port: int = 8000

    # Database Settings
    database_url: str = "postgresql://postgres:postgres@localhost:5432/lumina"
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/lumina"

    # Security Settings
    secret_key: str = "your-super-secret-key-change-in-production-12345678901234567890"
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24
    jwt_refresh_expiration_days: int = 7

    # CORS Settings
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:8080",
        "http://localhost:8000",
        "http://127.0.0.1:3000"
    ]

    # Vector Database Settings
    vector_db_type: str = "milvus"  # 'milvus' or 'weaviate'
    milvus_host: str = "localhost"
    milvus_port: int = 19530
    MILVUS_HOST: str = "localhost"
    MILVUS_PORT: int = 19530
    weaviate_url: str = "http://localhost:8080"

    # Embedding Model Settings
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    embedding_dimension: int = 384
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    EMBEDDING_DIMENSION: int = 384

    # LLM Settings
    llm_type: str = "ollama"  # 'ollama' or 'vllm'
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama2"
    vllm_model: str = "microsoft/DialoGPT-medium"

    # File Upload Settings
    max_upload_size: int = 50 * 1024 * 1024  # 50MB
    allowed_extensions: List[str] = [".pdf", ".txt", ".md", ".docx", ".doc", ".html", ".htm"]
    upload_chunk_size: int = 1024 * 1024  # 1MB chunks for streaming

    # Content Processing Settings
    tesseract_path: Optional[str] = r"C:\Program Files\Tesseract-OCR\tesseract.exe"  # Windows path
    max_chunk_size: int = 512  # Maximum tokens per chunk
    chunk_overlap: int = 50  # Number of overlapping tokens between chunks
    enable_ocr: bool = True  # Enable OCR for images
    enable_table_extraction: bool = True  # Enable table extraction
    enable_diagram_analysis: bool = True  # Enable diagram analysis
    min_content_length: int = 10  # Minimum content length to process
    max_content_length: int = 1000000  # Maximum content length to process
    content_deduplication: bool = True  # Enable content deduplication

    # Cache Settings
    enable_caching: bool = True
    cache_ttl: int = 3600  # Default cache TTL in seconds
    content_cache_ttl: int = 86400  # Content cache TTL (24 hours)
    search_cache_ttl: int = 300  # Search cache TTL (5 minutes)
    
    # Redis Settings (for streak service and caching)
    redis_url: str = "redis://localhost:6379"
    REDIS_URL: str = "redis://localhost:6379"

    # Face Recognition Settings
    face_model_path: str = "models/insightface"
    face_recognition_threshold: float = 0.6
    FACE_MODEL_PATH: str = "models/insightface"

    # Logging
    log_level: str = "INFO"
    log_file: Optional[str] = "logs/lumina_ai.log"

    # Monitoring
    prometheus_port: int = 9090

    @validator('cors_origins', pre=True)
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            # Handle comma-separated string from env
            return [origin.strip() for origin in v.split(',')]
        return v

    @validator('allowed_extensions', pre=True)
    def parse_allowed_extensions(cls, v):
        if isinstance(v, str):
            # Handle comma-separated string from env
            return [ext.strip() for ext in v.split(',')]
        return v

    class Config:
        env_file = ".env"
        case_sensitive = False  # Allow case-insensitive env vars
        env_file_encoding = 'utf-8'


# Global settings instance
settings = Settings()
