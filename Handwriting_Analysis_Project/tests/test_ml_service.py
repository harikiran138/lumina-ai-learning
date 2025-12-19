import sys
import os
import pytest
from fastapi.testclient import TestClient

# Adjust path to import from ml_service
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml_service.logic.scoring import QAScorer
from ml_service.api.server import app

client = TestClient(app)

def test_qa_scorer():
    scorer = QAScorer()
    # Identical strings should be 1.0 (or very close)
    assert scorer.calculate_similarity("hello world", "hello world") > 0.99
    # Different strings should be lower
    assert scorer.calculate_similarity("apple", "banana") < 0.8 # MiniLM might find them somewhat similar (fruits)

def test_api_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

# We cannot easily test /analyze without a real image file mock and model loaded
# But we verified the structure.
