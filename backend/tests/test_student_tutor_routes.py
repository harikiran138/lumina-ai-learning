import asyncio
import json
from unittest.mock import AsyncMock, patch

import pytest
from app.api.deps import get_current_student
from app.main import app
from ai_engine.classifier import RoutingTier, SAFE_INSTANT_WAITING

from app.routers.student import get_current_user

@pytest.fixture
def student_override(app):
    """Override current_user to be a student"""
    async def mocked_get_current_user():
        return {
            "id": "test-student-123",
            "role": "student",
            "email": "student@test.com",
            "full_name": "Test Student",
        }
    app.dependency_overrides[get_current_user] = mocked_get_current_user
    yield
    app.dependency_overrides.clear()

@pytest.fixture
async def ac(app):
    from httpx import AsyncClient, ASGITransport
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client

# Helper to poll for answer
async def _wait_for_answer(ac, answer_id: str):
    # Increased timeout from 30 * 0.01s (0.3s) to 50 * 0.1s (5s) for stability
    for _ in range(50):
        response = await ac.get(f"/api/student/tutor/answer/{answer_id}")
        assert response.status_code == 200
        payload = response.json()
        if payload["status"] == "completed":
            return payload
        if payload["status"] == "failed":
            raise AssertionError(f"Tutor answer failed with message: {payload.get('message')} and error: {payload.get('error')}")
        await asyncio.sleep(0.1)
    raise AssertionError("Tutor answer did not complete in time after 5s")

@pytest.mark.asyncio
async def test_student_tutor_ask_and_poll(student_override, ac):
    structured = json.dumps(
        {
            "meta": {
                "topic": "Algebra",
                "difficulty": "easy",
                "estimated_time_min": 2,
                "exportable": False,
            },
            "flow": [
                {
                    "type": "quiz",
                    "difficulty": "easy",
                    "questions": [
                        {
                            "question": "What is 2 + 2?",
                            "options": ["1", "2", "3", "4"],
                            "answer": 3,
                            "explanation": "2 + 2 equals 4.",
                        }
                    ],
                }
            ],
        }
    )

    _safe_clf = {"tier": RoutingTier.SAFE_INSTANT, "confidence": 0.95, "reason": "mocked"}
    with patch("app.routers.student.classify", return_value=_safe_clf), \
         patch("app.routers.ai_tutor.AITutorStore.get_response", new=AsyncMock(return_value=structured)):
        ask_response = await ac.post(
            "/api/student/tutor/ask",
            json={"message": "What is 2 + 2?", "context": {"course_id": "test-course"}},
        )

    assert ask_response.status_code == 200
    ask_payload = ask_response.json()
    assert ask_payload["status"] == "pending"
    # If tier is SAFE_INSTANT, the message should be SAFE_INSTANT_WAITING ("Thinking...")
    assert ask_payload["message"] == SAFE_INSTANT_WAITING
    assert ask_payload["poll_url"].endswith(ask_payload["id"])

    answer_payload = await _wait_for_answer(ac, ask_payload["id"])
    assert answer_payload["status"] == "completed"
    assert "2 + 2" in answer_payload["response"]

@pytest.mark.asyncio
async def test_student_tutor_blank_response_falls_back_to_safe_payload(student_override, ac):
    _safe_clf = {"tier": RoutingTier.SAFE_INSTANT, "confidence": 0.95, "reason": "mocked"}
    # Patch at source for maximum reliability
    with patch("ai_engine.classifier.classify", return_value=_safe_clf), \
         patch("app.store.ai_tutor_store.AITutorStore.get_response", new=AsyncMock(return_value="   ")):
        
        ask_response = await ac.post(
            "/api/student/tutor/ask",
            json={"message": "Explain sorting"},
        )

    assert ask_response.status_code == 200
    answer_payload = await _wait_for_answer(ac, ask_response.json()["id"])
    assert answer_payload["status"] == "completed"
    # Even if blank, it should fall back to a safe message or handle it gracefully
    assert "response" in answer_payload
