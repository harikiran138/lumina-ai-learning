import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.database.supabase_manager import supabase_db
from app.routers.auth import get_current_user


@pytest.fixture
def local_db():
    return supabase_db.get_client(force_new=True)


@pytest.fixture
async def ac():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://localhost") as client:  # nosec B113
        yield client


def _override_user(user: dict):
    async def _get_user():
        return user

    app.dependency_overrides[get_current_user] = _get_user


def _clear_overrides():
    app.dependency_overrides.pop(get_current_user, None)


@pytest.mark.asyncio
async def test_student_can_list_batches_for_onboarding(ac, local_db):
    local_db.table("batches").insert(
        {
            "id": "batch-1",
            "dept_id": "dept-1",
            "label": "2026-2030",
            "sections": ["A"],
            "current_semester": 1,
        }
    ).execute()

    _override_user({"id": "student-1", "role": "student", "dept_id": "dept-1", "batch_id": "batch-1"})
    try:
        response = await ac.get("/api/departments/dept-1/batches")
    finally:
        _clear_overrides()

    assert response.status_code == 200
    payload = response.json()
    assert len(payload) == 1
    assert payload[0]["id"] == "batch-1"


@pytest.mark.asyncio
async def test_student_onboarding_complete_resolves_program_from_department(ac, local_db):
    local_db.table("programs").insert(
        {
            "id": "program-1",
            "department_id": "dept-1",
            "program_name": "B.Tech CSE",
            "status": "active",
        }
    ).execute()
    local_db.table("batches").insert(
        {
            "id": "batch-1",
            "dept_id": "dept-1",
            "label": "2026-2030",
            "sections": ["A"],
            "current_semester": 1,
        }
    ).execute()
    local_db.table("courses").insert(
        {
            "id": "course-1",
            "department_id": "dept-1",
            "course_name": "Engineering Mathematics",
            "course_code": "M101",
            "semester": 1,
        }
    ).execute()
    local_db.table("users").insert(
        {
            "id": "student-1",
            "email": "student@example.com",
            "role": "student",
            "dept_id": "dept-1",
            "batch_id": "batch-1",
            "onboarding_step": 4,
        }
    ).execute()

    _override_user(
        {
            "id": "student-1",
            "email": "student@example.com",
            "role": "student",
            "dept_id": "dept-1",
            "batch_id": "batch-1",
            "section": "A",
        }
    )
    try:
        response = await ac.post(
            "/api/student/onboarding/complete",
            json={
                "class_id": None,
                "subject_ids": ["course-1"],
                "learning_styles": ["step_by_step"],
                "skill_levels": {"course-1": 0.6},
                "goal": "pass_semester_exams",
                "device_type": "laptop",
                "internet_type": "stable",
                "consents": {
                    "teacherVerifiedAi": True,
                    "academicIntegrity": True,
                    "dataPolicy": True,
                },
                "batch_confirmed": True,
                "batch_confirmation_note": None,
            },
        )
    finally:
        _clear_overrides()

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["programLinked"] is True

    enrollment = await supabase_db.fetch_one("student_enrollments", {"student_id": "student-1"})
    assert enrollment is not None
    assert enrollment["program_id"] == "program-1"

    user = await supabase_db.fetch_one("users", {"id": "student-1"})
    assert user is not None
    assert user["onboarding_step"] == 5


@pytest.mark.asyncio
async def test_college_update_returns_single_object(ac, local_db):
    local_db.table("institutions").insert(
        {
            "id": "college-1",
            "institution_name": "Lumina College",
            "code": "LUM",
            "is_active": True,
        }
    ).execute()

    _override_user({"id": "admin-1", "role": "super_admin"})
    try:
        response = await ac.patch(
            "/api/colleges/college-1",
            json={"institution_name": "Lumina Engineering College"},
        )
    finally:
        _clear_overrides()

    assert response.status_code == 200
    payload = response.json()
    assert payload["id"] == "college-1"
    assert payload["institution_name"] == "Lumina Engineering College"
