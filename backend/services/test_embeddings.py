"""Mock embeddings service for testing"""

import numpy as np
from typing import List, Union

class MockEmbeddingService:
    def __init__(self, dimension: int = 384):
        self.dimension = dimension
        self.model_name = "mock-all-MiniLM-L6-v2"

    def encode(self, texts: Union[str, List[str]], normalize: bool = True) -> np.ndarray:
        """Generate mock embeddings for text(s)"""
        if isinstance(texts, str):
            texts = [texts]
            
        embeddings = []
        for text in texts:
            # Generate deterministic mock embeddings based on text length
            # This ensures consistent results for testing
            seed = sum(ord(c) for c in text)
            np.random.seed(seed)
            embedding = np.random.normal(0, 0.1, self.dimension)
            
            if normalize:
                embedding = embedding / np.linalg.norm(embedding)
                
            embeddings.append(embedding)
            
        return np.array(embeddings)

    def encode_batch(
        self, 
        texts: List[str], 
        batch_size: int = 32,
        normalize: bool = True
    ) -> List[List[float]]:
        """Generate mock embeddings for a batch of texts"""
        embeddings = []
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            batch_embeddings = self.encode(batch, normalize=normalize)
            embeddings.extend(batch_embeddings)
        return embeddings

# Create mock instance
embedding_service = MockEmbeddingService()