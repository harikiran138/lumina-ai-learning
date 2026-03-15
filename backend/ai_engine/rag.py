import os
import asyncio
from typing import List, Dict, Any, Optional
from app.services.ml_client import ml_client

class RAGEngine:
    def __init__(self, collection_name: str = "course_content"):
        # Proxy class for unified ML service
        self.collection_name = collection_name

    def ingest_text(self, text: str, metadata: Dict[str, Any] = None):
        """
        Proxy ingest to ML service.
        """
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # We are in an async context, but this method is sync.
                # In fire-and-forget mode or wait? 
                # Let's try to run it in a background task if in a loop.
                asyncio.create_task(ml_client.ingest_rag(text, metadata))
            else:
                asyncio.run(ml_client.ingest_rag(text, metadata))
        except Exception as e:
            print(f"RAG Ingest proxy failed: {e}")

    def query(self, query_text: str, n_results: int = 5) -> List[str]:
        """
        Proxy query to ML service.
        """
        try:
            # Check if we have an active loop
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    # We can't use run() here. But this method is sync.
                    # This is tricky without changing the whole ai_engine to async.
                    # For now, we'll try to find a way to wait or use a sync httpx client.
                    # Given the constraints, let's use a sync bridge or 
                    # use the ml_client's _post in a sync way?
                    # Or just use the existing async bridge if available.
                    return self._query_sync(query_text, n_results)
            except RuntimeError:
                return asyncio.run(self._query_async(query_text, n_results))
        except Exception as e:
            print(f"RAG Query proxy failed: {e}")
            return []
        
        return []

    async def _query_async(self, query_text: str, n_results: int = 5) -> List[str]:
        result = await ml_client.chat_tutor(query_text, n_results)
        return result.get("results", []) if result else []

    def _query_sync(self, query_text: str, n_results: int = 5) -> List[str]:
        # Simple sync wrapper for the proxy query
        import httpx
        try:
            base_url = os.getenv("ML_SERVICE_URL", "http://ml-service:9000")
            with httpx.Client(timeout=10.0) as client:
                response = client.post(
                    f"{base_url}/ml/rag/query", 
                    json={"query": query_text, "n_results": n_results}
                )
                if response.status_code == 200:
                    return response.json().get("results", [])
        except Exception as e:
            print(f"RAG Sync Query fallback failed: {e}")
        return []

class MockRAGEngine:
    def ingest_text(self, text, metadata=None):
        pass
    def query(self, query_text, n_results=5):
        return []

# Singleton instance
_rag_engine = None

def get_rag_engine():
    global _rag_engine
    if _rag_engine is None:
        _rag_engine = RAGEngine()
    return _rag_engine
