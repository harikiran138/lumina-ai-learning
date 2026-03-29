import json
import os
import sys
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app


@pytest.fixture
async def ac():
    async with AsyncClient(  # nosec B113
        transport=ASGITransport(app=app),
        base_url="http://localhost",
    ) as client:
        yield client


@pytest.mark.asyncio
async def test_tutor_chat_returns_structured_fallback_instead_of_500(ac):
    mock_service = MagicMock()
    mock_service.get_legacy_state = AsyncMock(
        return_value={
            "behavior_label": "neutral",
            "cognitive_load": 45,
            "mastery_scores": {},
            "risk_summary": {"risk_level": "low"},
            "weak_topics": ["algebra"],
        }
    )

    with patch("ai_engine.swarm.orchestrator.Orchestrator") as mock_orchestrator_cls:
        instance = MagicMock()
        instance.route_request = AsyncMock(side_effect=RuntimeError("provider down"))
        mock_orchestrator_cls.return_value = instance

        with patch("app.routers.ai.get_personalization_service", return_value=mock_service):
            response = await ac.post(
                "/api/tutor/chat",
                json={
                    "message": "Explain algebra simply",
                    "user_id": "student-1",
                    "session_id": "session-1",
                    "provider": "auto",
                },
            )

    assert response.status_code == 200
    payload = response.json()
    structured = json.loads(payload["response"])
    assert structured["meta"]["topic"] == "algebra"
    assert structured["flow"][0]["type"] == "concept"


@pytest.mark.asyncio
async def test_tutor_chat_wraps_assessment_output_into_a2ui(ac):
    mock_service = MagicMock()
    mock_service.get_legacy_state = AsyncMock(
        return_value={
            "behavior_label": "neutral",
            "cognitive_load": 40,
            "mastery_scores": {},
            "risk_summary": {"risk_level": "low"},
            "weak_topics": ["algebra"],
        }
    )
    mock_service.record_event = AsyncMock()

    with patch("ai_engine.swarm.orchestrator.Orchestrator") as mock_orchestrator_cls:
        instance = MagicMock()
        instance.route_request = AsyncMock(
            return_value={
                "question": "What is 2 + 2?",
                "options": ["3", "4", "5", "6"],
                "correct_index": 1,
                "explanation": "2 + 2 equals 4.",
                "difficulty": 0.3,
            }
        )
        mock_orchestrator_cls.return_value = instance

        with patch("app.routers.ai.get_personalization_service", return_value=mock_service):
            response = await ac.post(
                "/api/tutor/chat",
                json={
                    "message": "Quiz me on algebra",
                    "user_id": "student-1",
                    "session_id": "session-1",
                    "provider": "auto",
                },
            )

    assert response.status_code == 200
    payload = response.json()
    structured = json.loads(payload["response"])
    assert structured["flow"][0]["type"] == "quiz"
    assert structured["flow"][0]["questions"][0]["question"] == "What is 2 + 2?"


@pytest.mark.asyncio
async def test_tutor_chat_wraps_pathway_string_into_a2ui(ac):
    mock_service = MagicMock()
    mock_service.get_legacy_state = AsyncMock(
        return_value={
            "behavior_label": "focused",
            "cognitive_load": 25,
            "mastery_scores": {"algebra": 0.6},
            "risk_summary": {"risk_level": "low"},
            "weak_topics": ["algebra"],
        }
    )
    mock_service.record_event = AsyncMock()

    with patch("ai_engine.swarm.orchestrator.Orchestrator") as mock_orchestrator_cls:
        instance = MagicMock()
        instance.route_request = AsyncMock(
            return_value="Pathway Agent: Analyzed your progress. Next, review linear equations."
        )
        mock_orchestrator_cls.return_value = instance

        with patch("app.routers.ai.get_personalization_service", return_value=mock_service):
            response = await ac.post(
                "/api/tutor/chat",
                json={
                    "message": "What should I study next?",
                    "user_id": "student-1",
                    "session_id": "session-2",
                    "provider": "auto",
                },
            )

    assert response.status_code == 200
    payload = response.json()
    structured = json.loads(payload["response"])
    assert structured["flow"][0]["type"] == "concept"
    assert "next step" in structured["flow"][0]["title"].lower()


@pytest.mark.asyncio
async def test_tutor_chat_infers_topic_from_message_when_profile_is_empty(ac):
    mock_service = MagicMock()
    mock_service.get_legacy_state = AsyncMock(
        return_value={
            "behavior_label": "neutral",
            "cognitive_load": 30,
            "mastery_scores": {},
            "risk_summary": {"risk_level": "low"},
            "weak_topics": [],
        }
    )
    mock_service.record_event = AsyncMock()

    with patch("ai_engine.swarm.orchestrator.Orchestrator") as mock_orchestrator_cls:
        instance = MagicMock()
        instance.route_request = AsyncMock(side_effect=RuntimeError("provider down"))
        mock_orchestrator_cls.return_value = instance

        with patch("app.routers.ai.get_personalization_service", return_value=mock_service):
            response = await ac.post(
                "/api/tutor/chat",
                json={
                    "message": "Explain fractions simply",
                    "user_id": "student-1",
                    "session_id": "session-3",
                    "provider": "auto",
                },
            )

    assert response.status_code == 200
    payload = response.json()
    structured = json.loads(payload["response"])
    assert structured["meta"]["topic"] == "fractions"


@pytest.mark.asyncio
async def test_tutor_chat_prefers_message_topic_over_stale_filter_topic(ac):
    mock_service = MagicMock()
    mock_service.get_legacy_state = AsyncMock(
        return_value={
            "behavior_label": "neutral",
            "cognitive_load": 30,
            "mastery_scores": {},
            "risk_summary": {"risk_level": "low"},
            "weak_topics": [],
        }
    )

    with patch("ai_engine.swarm.orchestrator.Orchestrator") as mock_orchestrator_cls:
        instance = MagicMock()
        instance.route_request = AsyncMock(side_effect=RuntimeError("provider down"))
        mock_orchestrator_cls.return_value = instance

        with patch("app.routers.ai.get_personalization_service", return_value=mock_service):
            response = await ac.post(
                "/api/tutor/chat",
                json={
                    "message": "Give me time line of ai",
                    "user_id": "student-1",
                    "session_id": "session-4",
                    "provider": "auto",
                    "context_filters": {"topic": "General"},
                },
            )

    assert response.status_code == 200
    payload = response.json()
    structured = json.loads(payload["response"])
    assert structured["meta"]["topic"] == "AI"
    assert any(
        block["type"] == "steps" and "timeline" in block.get("title", "").lower()
        for block in structured["flow"]
    )
