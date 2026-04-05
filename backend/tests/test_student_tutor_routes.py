import asyncio
import json
from unittest.mock import AsyncMock, patch

import pytest

from app.api.deps import get_current_student
from app.main import app
from ai_engine.classifier import RoutingTier, SAFE_INSTANT_WAITING


@pytest.fixture
async def ac(async_client):
    yield async_client


@pytest.fixture
def student_override():
    async def _get_user():
        return {"id": "student-1", "role": "student", "is_active": True}

    app.dependency_overrides[get_current_student] = _get_user
    try:
        yield
    finally:
        app.dependency_overrides.pop(get_current_student, None)


async def _wait_for_answer(ac, answer_id: str):
    for _ in range(30):
        response = await ac.get(f"/api/student/tutor/answer/{answer_id}")
        assert response.status_code == 200
        payload = response.json()
        if payload["status"] == "completed":
            return payload
        await asyncio.sleep(0.01)
    raise AssertionError("Tutor answer did not complete in time")


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
            json={"prompt": "Quiz me on algebra", "history": []},
        )

    assert ask_response.status_code == 200
    ask_payload = ask_response.json()
    assert ask_payload["status"] == "pending"
    assert ask_payload["message"] == SAFE_INSTANT_WAITING
    assert ask_payload["poll_url"].endswith(ask_payload["id"])

    answer_payload = await _wait_for_answer(ac, ask_payload["id"])
    assert answer_payload["status"] == "completed"
    assert answer_payload["type"] == "quiz"
    assert answer_payload["answer"]["type"] == "quiz"
    assert json.loads(answer_payload["response"])["flow"][0]["type"] == "quiz"


@pytest.mark.asyncio
async def test_student_tutor_blank_response_falls_back_to_safe_payload(student_override, ac):
    with patch(
        "app.routers.ai_tutor.AITutorStore.get_response",
        new=AsyncMock(return_value="   "),
    ):
        ask_response = await ac.post(
            "/api/student/tutor/ask",
            json={"message": "Explain sorting"},
        )

    assert ask_response.status_code == 200
    answer_payload = await _wait_for_answer(ac, ask_response.json()["id"])
    assert answer_payload["status"] == "completed"

    parsed = json.loads(answer_payload["response"])
    assert parsed["flow"][0]["type"] == "text"
    assert answer_payload["answer"]["content"].strip()
