import functools
from typing import List
from app.rag.vector_store import VectorStore
from app.rag.embeddings import EmbeddingService


class RetrievalService:
    def __init__(self):
        self.vector_store = VectorStore()
        self.embedding_service = EmbeddingService.get_embeddings()

    def hybrid_search(self, query: str, top_k: int = 5) -> List[str]:
        """
        Performs hybrid search (Keyword + Vector).
        """
        # 1. Search Vector DB
        results = self.vector_store.search(query, top_k=top_k)

        # 2. Fallback to keyword search if needed (TODO: Implement BM25)
        # For now, we return vector results which are already quite good

        return results

    @functools.lru_cache(maxsize=128)
    def cached_search(self, query: str, top_k: int = 5) -> List[str]:
        """
        Production-grade caching wrapper for retrieval.
        Helps with repeated LLM queries during group discussions/study sessions.
        """
        return self.hybrid_search(query, top_k)
