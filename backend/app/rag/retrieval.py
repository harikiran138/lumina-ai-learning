import functools
import asyncio
from typing import List, Dict, Any
from app.rag.vector_store import VectorStore
from app.rag.embeddings import EmbeddingService
from ai_engine.llm import get_llm_provider


class RetrievalService:
    def __init__(self, provider: str = "auto"):
        self.vector_store = VectorStore()
        self.embedding_service = EmbeddingService.get_embeddings()
        self.llm = get_llm_provider(provider)

    def ingest_text(self, text: str, metadata: Dict[str, Any] = None):
        """
        Ingests text into the vector store.
        """
        self.vector_store.add_documents([text], [metadata] if metadata else None)

    async def expand_query(self, query: str) -> List[str]:
        """
        Generates 3 variations of the query to improve retrieval coverage.
        """
        system_prompt = "You are a helpful assistant that generates 3 search query variations for better RAG retrieval."
        user_prompt = f"Original Query: {query}\n\nGenerate 3 varied search queries that capture different facets of this topic. Return only the queries, one per line."
        
        try:
            response = await self.llm.agenerate(user_prompt, system_prompt)
            queries = [q.strip() for q in response.split("\n") if q.strip()]
            return queries[:3] + [query]
        except Exception:
            return [query]

    async def hybrid_search(self, query: str, top_k: int = 5) -> List[str]:
        """
        Performs multi-query expansion followed by hybrid search (Keyword + Vector)
        using refined Reciprocal Rank Fusion (RRF).
        """
        # 1. Expand Query
        expanded_queries = await self.expand_query(query)
        
        # 2. Parallel Vector Search for all variations
        search_tasks = [
            asyncio.to_thread(self.vector_store.search, q, top_k=top_k * 2) 
            for q in expanded_queries
        ]
        vector_results_nested = await asyncio.gather(*search_tasks)
        
        # 3. Fallback to keyword search using BM25
        keyword_results = []
        try:
            from rank_bm25 import BM25Okapi
            
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

        # 4. Refined Reciprocal Rank Fusion (RRF)
        # RRF Score = sum( 1 / (k + rank) )
        k = 60
        rrf_scores: Dict[str, float] = {}

        # Fuse Vector results (multiple queries)
        for sub_results in vector_results_nested:
            for rank, doc in enumerate(sub_results):
                rrf_scores[doc] = rrf_scores.get(doc, 0.0) + (1.0 / (k + rank))
        
        # Fuse Keyword results
        for rank, doc in enumerate(keyword_results):
            rrf_scores[doc] = rrf_scores.get(doc, 0.0) + (1.0 / (k + rank))
            
        sorted_docs = sorted(rrf_scores.keys(), key=lambda x: rrf_scores[x], reverse=True)
        return sorted_docs[:top_k]

    async def cached_search(self, query: str, top_k: int = 5) -> List[str]:
        """
        Production-grade retrieval with async support.
        """
        # Note: functools.lru_cache doesn't work well with async methods directly
        # For production, we'd use an async cache like aiocache or Redis
        return await self.hybrid_search(query, top_k)
