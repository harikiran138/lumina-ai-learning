from langchain_community.embeddings import HuggingFaceEmbeddings
from app.rag.config import rag_settings

class EmbeddingService:
    _instance = None

    @classmethod
    def get_embeddings(cls):
        if cls._instance is None:
            # Using BAAI/bge-large-en-v1.5 as requested
            # Requires: sentence-transformers
            cls._instance = HuggingFaceEmbeddings(
                model_name=rag_settings.EMBEDDING_MODEL,
                model_kwargs={'device': 'cpu'}, # Force CPU for now
                encode_kwargs={'normalize_embeddings': True}
            )
        return cls._instance
