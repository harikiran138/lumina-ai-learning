import pytest
from app.rag.retrieval import RetrievalService
from unittest.mock import MagicMock


def test_rag_retrieval_logic():
    """
    Verifies that RetrievalService correctly calls the vector store and returns 'documents'.
    Since we don't have a live Qdrant, we verify the integration logic using mocks.
    """
    retriever = RetrievalService()

    # Mock the internal vector store search to return dummy hits
    retriever.vector_store.search = MagicMock(return_value=["Doc A", "Doc B"])

    results = retriever.hybrid_search("Test Query", top_k=2)

    assert len(results) == 2
    assert results[0] == "Doc A"
    assert results[1] == "Doc B"
