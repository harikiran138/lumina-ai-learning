import json
from unittest.mock import AsyncMock, patch

import pytest

from app.api.deps import get_current_active_user
from app.store.ai_tutor_store import AITutorStore
from ai_engine.classifier import RoutingTier


def test_ai_tutor_classification_adapts_to_student_state():
    store = AITutorStore()

    classification = store._classify_request(
        "Quiz me on algebra with MCQs",
        {"topic": "algebra"},
        {
            "mastery_scores": {"algebra": 0.22},
            "cognitive_load": 82,
        },
    )

    assert classification["mode"] == "quiz"
    assert classification["response_type"] == "quiz"
    assert classification["student_level"] == "beginner"
    assert classification["difficulty"] == "easy"
    assert classification["concept"] == "algebra"


def test_ai_tutor_classification_supports_graph_outputs():
    store = AITutorStore()

    classification = store._classify_request(
        "Show me a graph of recursion flow",
        {"topic": "recursion", "render_target": "a2ui"},
        {
            "mastery_scores": {"recursion": 0.78},
            "cognitive_load": 35,
        },
        requested_mode="interactive",
    )

    assert classification["mode"] == "interactive"
    assert classification["response_type"] == "graph"
    assert classification["student_level"] == "advanced"
    assert classification["difficulty"] == "hard"


@pytest.mark.asyncio
async def test_ai_tutor_chat_queues_student_answer_for_teacher_review(ac, app, local_db):
    async def _mock_user():
        return {"id": "student-1", "role": "student", "is_active": True}

    app.dependency_overrides[get_current_active_user] = _mock_user

    local_db.table("courses").insert(
        {
            "id": "course-1",
            "teacher_id": "teacher-1",
            "course_name": "Physics 101",
        }
    ).execute()
    local_db.table("student_enrollments").insert(
        {
            "student_id": "student-1",
            "course_id": "course-1",
            "class_id": "class-1",
        }
    ).execute()

    _academic_clf = {"tier": RoutingTier.ACADEMIC_VERIFIED, "confidence": 0.9, "reason": "mocked"}
    with patch("app.routers.ai_tutor.classify", return_value=_academic_clf), \
         patch.object(
            AITutorStore,
            "_generate_teacher_review_draft",
            new=AsyncMock(
                return_value={
                    "draft_answer": "Newton's Second Law states that force equals mass times acceleration.",
                    "response_payload": {"response_type": "explanation"},
                }
            ),
        ):
        response = await ac.post(
            "/api/ai-tutor/chat",
            json={
                "prompt": "Explain Newton's Second Law simply",
                "history": [],
                "context_filters": {"topic": "Newton's Second Law"},
            },
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["queued"] is True
    assert payload["delivery_status"] == "pending_teacher_review"
    assert payload["classification"]["response_type"] == "explanation"
    assert payload["classification"]["mode"] == "explain"

    ack = json.loads(payload["content"])
    assert ack["meta"]["queue_status"] == "pending_teacher_review"
    assert ack["flow"][0]["title"] == "Answer queued for teacher review"

    queue_rows = local_db.table("ai_answer_queue").select("*").execute().data or []
    assert len(queue_rows) == 1
    assert queue_rows[0]["student_id"] == "student-1"
    assert queue_rows[0]["teacher_id"] == "teacher-1"
    assert queue_rows[0]["course_id"] == "course-1"
    assert queue_rows[0]["status"] == "pending"
    assert "force equals mass times acceleration" in queue_rows[0]["ai_generated_answer"].lower()
