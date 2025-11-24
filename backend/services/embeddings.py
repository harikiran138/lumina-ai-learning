"""
Embedding service using SentenceTransformers
"""

from sentence_transformers import SentenceTransformer
from typing import List
from config import settings


class EmbeddingService:
    def __init__(self):
        self.model = SentenceTransformer(settings.EMBEDDING_MODEL)
        self.dimension = settings.EMBEDDING_DIMENSION

    def encode(self, text: str) -> List[float]:
        """Generate embeddings for a single text"""
        embedding = self.model.encode(text, convert_to_numpy=True)
        return embedding.tolist()

    def encode_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts"""
        embeddings = self.model.encode(texts, convert_to_numpy=True)
        return embeddings.tolist()

    def get_dimension(self) -> int:
        """Get embedding dimension"""
        return self.dimension


# Global instance
embedding_service = EmbeddingService()
