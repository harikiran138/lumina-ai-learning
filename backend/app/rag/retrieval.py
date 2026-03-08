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
        Performs hybrid search (Keyword + Vector) using Reciprocal Rank Fusion (RRF).
        """
        # 1. Search Vector DB
        vector_results = self.vector_store.search(query, top_k=top_k * 2)

        # 2. Fallback to keyword search using BM25
        keyword_results = []
        try:
            from rank_bm25 import BM25Okapi
            
            # Fetch texts from Qdrant for BM25 corpus (for larger scales, use an ElasticSearch index or Qdrant Sparse vectors)
            client = self.vector_store.client
            scroll_res, _ = client.scroll(
                collection_name=self.vector_store.collection_name, 
                limit=1000, 
                with_payload=True, 
                with_vectors=False
            )
            all_texts = [hit.payload["text"] for hit in scroll_res if "text" in hit.payload]
            
            if all_texts:
                tokenized_corpus = [doc.lower().split(" ") for doc in all_texts]
                bm25 = BM25Okapi(tokenized_corpus)
                tokenized_query = query.lower().split(" ")
                keyword_results = bm25.get_top_n(tokenized_query, all_texts, n=top_k * 2)
        except Exception as e:
            import structlog
            structlog.get_logger().error("bm25_search_failed", error=str(e))

        # 3. Reciprocal Rank Fusion (RRF)
        if not keyword_results:
            return vector_results[:top_k]
            
        rrf_scores = {}
        for rank, doc in enumerate(vector_results):
            rrf_scores[doc] = rrf_scores.get(doc, 0) + 1.0 / (60 + rank)
            
        for rank, doc in enumerate(keyword_results):
            rrf_scores[doc] = rrf_scores.get(doc, 0) + 1.0 / (60 + rank)
            
        sorted_docs = sorted(rrf_scores.keys(), key=lambda x: rrf_scores[x], reverse=True)
        return sorted_docs[:top_k]

    @functools.lru_cache(maxsize=128)
    def cached_search(self, query: str, top_k: int = 5) -> List[str]:
        """
        Production-grade caching wrapper for retrieval.
        Helps with repeated LLM queries during group discussions/study sessions.
        """
        return self.hybrid_search(query, top_k)
