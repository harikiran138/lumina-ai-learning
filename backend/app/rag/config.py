from pydantic_settings import BaseSettings, SettingsConfigDict

class RAGSettings(BaseSettings):
    EMBEDDING_MODEL: str = "BAAI/bge-large-en-v1.5"
    QDRANT_URL: str = ":memory:"  # Default to memory for testing
    QDRANT_COLLECTION: str = "lumina_knowledge"
    CHUNK_SIZE: int = 512
    CHUNK_OVERLAP: int = 50
    TOP_K: int = 5
    RERANKING_ENABLED: bool = True

    model_config = SettingsConfigDict(env_prefix="RAG_")


rag_settings = RAGSettings()
