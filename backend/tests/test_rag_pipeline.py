import sys
import os
import shutil

# Add backend to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Ensure we have a clean DB for test
TEST_DB_PATH = "./backend/db/chroma_test"
if os.path.exists(TEST_DB_PATH):
    shutil.rmtree(TEST_DB_PATH)

import pytest
import unittest
from ai_engine.rag import RAGEngine

# Mock the persistence path in the class for testing
# We'll just instantiate it and let it use the default path but ideally we'd config it
# For now, we will test the functionality. 

def test_rag_pipeline():
    print("Initializing RAG Engine...")
    
    # Patch SentenceTransformer to return valid embeddings with correct shape (1D vs 2D)
    with unittest.mock.patch("ai_engine.rag.SentenceTransformer") as MockST, \
         unittest.mock.patch("ai_engine.rag.CrossEncoder") as MockCE:
        
        def encode_side_effect(sentences, *args, **kwargs):
            mock_ret = unittest.mock.MagicMock()
            if isinstance(sentences, list):
                 # Ingest: List of strings -> 2D
                mock_ret.tolist.return_value = [[0.1] * 384 for _ in sentences]
            else:
                # Query: Single string -> 1D
                mock_ret.tolist.return_value = [0.1] * 384
            return mock_ret
            
        MockST.return_value.encode.side_effect = encode_side_effect
        
        # Configure Re-Ranker to return dummy scores
        MockCE.return_value.predict.return_value = [0.99] # High score for the 1 doc

        # Monkey patch the client for testing to use Ephemeral
        import chromadb
        original_client = chromadb.PersistentClient
        chromadb.PersistentClient = lambda path: chromadb.EphemeralClient()
    
        rag = RAGEngine(collection_name="test_collection")
    
        # Restore
        chromadb.PersistentClient = original_client
    
        text = """
        Lumina AI is an advanced learning platform.
        It uses RAG to provide context-aware tutoring.
        The Pathway Agent optimizes learning trajectories.
        Handwriting analysis allows digitization of notes.
        """
    
        print("Testing Ingestion...")
        rag.ingest_text(text, {"source": "test_doc"})
    
    
        print("Testing Query (Vector Search + Re-Ranking)...")
        QUERY = "What does the Pathway Agent do?"
        results = rag.query(QUERY, n_results=1)
    
        print(f"Query: {QUERY}")
        print(f"Result: {results[0]}")
        
        assert len(results) > 0
    
    assert len(results) > 0
    assert "Pathway Agent" in results[0]
    print("RAG Pipeline Verification Passed!")

if __name__ == "__main__":
    test_rag_pipeline()
