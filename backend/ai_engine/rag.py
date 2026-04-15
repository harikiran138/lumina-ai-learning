from functools import lru_cache


@lru_cache(maxsize=1)
def get_rag_engine(*args, **kwargs):
    from app.rag.retrieval import RetrievalService

    provider = kwargs.get("provider", "auto")
    return RetrievalService(provider=provider)
