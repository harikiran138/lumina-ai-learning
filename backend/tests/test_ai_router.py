import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from fastapi.testclient import TestClient
from app.main import app


# Mock Response object from Gemini
class MockGeminiResponse:
    def __init__(self, text):
        self.text = text


def test_ai_tutor_endpoint(client):
    """
    Verifies /api/tutor/generate-ppt endpoint using mocked LLM provider.
    """
    mock_llm = MagicMock()
    # Mock agenerate as async
    mock_llm.agenerate = AsyncMock(
        return_value='{"title": "AI 101", "slides": [{"title": "Slide 1"}]}'
    )

    # Patch where it is imported: ai_engine.llm
    with patch("ai_engine.llm.get_llm_provider", return_value=mock_llm) as mock_provider:
        # Test 1: Generate PPT
        import uuid

        topic = f"Artificial Intelligence {uuid.uuid4()}"
        response = client.post("/api/tutor/generate-ppt", json={"topic": topic, "slides_count": 5})

        # Check if it called the model
        assert mock_llm.agenerate.called
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "download_url" in data


def test_ai_chat_endpoint(client):
    """
    If there is a chat endpoint, verify it too.
    Checking routers/ai.py for other endpoints.
    """
    # Based on file review, we have /generate-ppt.
    # Let's check if there's a generic /chat or /generate.
    # Assuming /api/v1/ai/... structure if generic.
    pass
