import os
import sys
import uuid
from datetime import datetime, timedelta

import pytest
from httpx import ASGITransport, AsyncClient

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.store.assignment_store import AssignmentStore
from app.store.course_store import CourseStore
from app.store.user_store import UserStore


@pytest.fixture
async def ac():
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://localhost",
    ) as client:
        yield client


def _user_seed(role: str):
    uid = str(uuid.uuid4())[:8]
    return {
        "email": f"{role}_{uid}@example.com",
        "password": "password123",
        "name": f"{role.title()} User",
        "role": role,
        "phone": f"+1555{uuid.uuid4().int % 1000000:06d}",
    }


async def _token(client: AsyncClient, email: str, password: str) -> str:
    response = await client.post(
        "/api/auth/token",
        data={"username": email, "password": password},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.mark.asyncio
async def test_student_dashboard_returns_personalized_sections(ac):
    user_store = UserStore()
    course_store = CourseStore()
    assignment_store = AssignmentStore()
    course = None

    teacher_seed = _user_seed("teacher")
    student_seed = _user_seed("student")

    teacher = await user_store.create_user(
        teacher_seed["email"],
        teacher_seed["password"],
        teacher_seed["name"],
        teacher_seed["role"],
        teacher_seed["phone"],
    )
    student = await user_store.create_user(
        student_seed["email"],
        student_seed["password"],
        student_seed["name"],
        student_seed["role"],
        student_seed["phone"],
    )

    try:
        await _token(ac, teacher_seed["email"], teacher_seed["password"])
        student_token = await _token(ac, student_seed["email"], student_seed["password"])

        course = await course_store.create_course(
            "Adaptive Algebra",
            f"ALG-{str(uuid.uuid4())[:6]}",
            "Personalized algebra practice.",
            teacher["id"],
        )

        enroll_response = await ac.post(
            "/api/student/enroll",
            json={"course_id": course["id"]},
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert enroll_response.status_code == 200

        await assignment_store.create_assignment(
            "Quadratics Homework",
            course["id"],
            "Solve the assigned quadratic equations.",
            (datetime.utcnow() + timedelta(days=1)).isoformat(),
            teacher["id"],
        )

        quiz_response = await ac.post(
            "/api/student/quiz-result",
            json={
                "topic": "quadratics",
                "difficulty": "medium",
                "score": 45,
                "course_id": course["id"],
            },
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert quiz_response.status_code == 200

        activity_response = await ac.post(
            "/api/student/log-activity",
            json={"course_id": course["id"], "duration_minutes": 25},
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert activity_response.status_code == 200

        dashboard_response = await ac.get(
            "/api/student/dashboard",
            headers={"Authorization": f"Bearer {student_token}"},
        )

        assert dashboard_response.status_code == 200
        data = dashboard_response.json()

        assert data["studentName"] == student_seed["name"]
        assert data["pendingAssignments"] >= 1
        assert data["weeklyMinutes"] >= 25
        assert data["nextAction"]["title"]
        assert len(data["todayPlan"]) >= 1
        assert len(data["dueAssignments"]) >= 1
        assert len(data["weakTopics"]) >= 1
        assert data["weakTopics"][0]["topic"] == "quadratics"
        assert len(data["weeklyActivity"]) == 7
        assert "learningSignals" in data
        assert "achievementSummary" in data
    finally:
        if course is not None:
            await course_store.delete_course(course["id"])
        await user_store.delete_user(student["id"])
        await user_store.delete_user(teacher["id"])
