import os
import sys
import uuid
from datetime import datetime, timedelta

import pytest
from httpx import ASGITransport, AsyncClient

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.database.supabase_manager import supabase_db
from app.routers.auth import get_current_user
from app.store.analytics_store import AnalyticsStore
from app.store.assignment_store import AssignmentStore
from app.store.course_store import CourseStore
from app.store.user_store import UserStore


@pytest.fixture
async def ac():
    async with AsyncClient(  # nosec B113
        transport=ASGITransport(app=app),
        base_url="http://localhost",
    ) as client:
        yield client


@pytest.fixture
def local_db():
    return supabase_db.get_client(force_new=True)


def _override_user(user: dict):
    async def _get_user():
        return user

    app.dependency_overrides[get_current_user] = _get_user


def _clear_overrides():
    app.dependency_overrides.pop(get_current_user, None)


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


@pytest.mark.asyncio
async def test_student_subjects_include_enrollment_progress(ac, local_db):
    local_db.table("courses").insert(
        {
            "id": "course-subject-1",
            "course_name": "Data Structures",
            "course_code": "CS201",
            "description": "Core data structures course",
        }
    ).execute()
    local_db.table("enrollments").insert(
        {
            "student_id": "student-subject-1",
            "course_id": "course-subject-1",
            "status": "active",
            "progress": {
                "percentage": 42,
                "mastery": 67,
                "streak": 3,
                "hoursSpent": 4.5,
                "lastAccessed": "2026-03-28T10:00:00+00:00",
            },
        }
    ).execute()

    _override_user({"id": "student-subject-1", "role": "student", "batch_id": None, "section": None})
    try:
        response = await ac.get("/api/student/subjects")
    finally:
        _clear_overrides()

    assert response.status_code == 200
    payload = response.json()
    assert len(payload) == 1
    assert payload[0]["id"] == "course-subject-1"
    assert payload[0]["progress"] == 42
    assert payload[0]["mastery"] == 67
    assert payload[0]["streak"] == 3


@pytest.mark.asyncio
async def test_student_grades_support_assignment_id_fallback(ac, local_db):
    local_db.table("courses").insert(
        {
            "id": "course-grade-1",
            "course_name": "Operating Systems",
        }
    ).execute()
    local_db.table("assignments").insert(
        {
            "id": "assignment-grade-1",
            "course_id": "course-grade-1",
            "title": "Process Scheduling Quiz",
        }
    ).execute()
    local_db.table("submissions").insert(
        {
            "id": "submission-grade-1",
            "student_id": "student-grade-1",
            "assignment_id": "assignment-grade-1",
            "score": 88,
            "feedback": "Well reasoned answer.",
        }
    ).execute()

    _override_user({"id": "student-grade-1", "role": "student"})
    try:
        response = await ac.get("/api/student/grades")
    finally:
        _clear_overrides()

    assert response.status_code == 200
    payload = response.json()
    assert len(payload) == 1
    assert payload[0]["assignmentId"] == "assignment-grade-1"
    assert payload[0]["assignmentTitle"] == "Process Scheduling Quiz"
    assert payload[0]["courseName"] == "Operating Systems"
    assert payload[0]["marks"] == 88


@pytest.mark.asyncio
async def test_student_dashboard_falls_back_to_student_subjects(local_db):
    local_db.table("courses").insert(
        {
            "id": "course-dashboard-1",
            "course_name": "Compiler Design",
            "description": "Parsing and code generation",
        }
    ).execute()
    local_db.table("student_subjects").insert(
        {
            "student_id": "student-dashboard-1",
            "subject_id": "course-dashboard-1",
        }
    ).execute()

    payload = await AnalyticsStore().get_student_full_dashboard("student-dashboard-1")

    assert payload["currentStreak"] == 0
    assert len(payload["enrolledCourses"]) == 1
    assert payload["enrolledCourses"][0]["id"] == "course-dashboard-1"
