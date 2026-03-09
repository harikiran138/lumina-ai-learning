import os
import sys
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app


@pytest.fixture
async def ac():
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://localhost",
    ) as client:
        yield client


@pytest.mark.asyncio
async def test_assessment_quick_log_updates_real_profile_signal(ac):
    mock_service = MagicMock()
    mock_service.record_event = AsyncMock()
    mock_service.get_profile = AsyncMock(
        return_value=SimpleNamespace(
            mastery_state={
                "fractions": SimpleNamespace(score=0.67),
            }
        )
    )

    with patch(
        "app.assessment.api.router.get_personalization_service",
        return_value=mock_service,
    ):
        response = await ac.post(
            "/api/assessment/quick-log",
            json={
                "user_id": "student-1",
                "topic": "fractions",
                "is_correct": True,
                "difficulty": 0.4,
            },
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["new_mastery"] == 0.67
    mock_service.record_event.assert_awaited_once()
    mock_service.get_profile.assert_awaited_once_with("student-1")
