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
async def test_enrollment_code_validation_returns_batch_mapping(ac, local_db):
    local_db.table("departments").insert(
        {
            "id": "dept-2",
            "department_name": "Computer Science",
            "abbreviation": "CSE",
            "institution_id": "college-1",
        }
    ).execute()
    local_db.table("batches").insert(
        {
            "id": "batch-2",
            "dept_id": "dept-2",
            "label": "2026-2030",
            "current_semester": 3,
        }
    ).execute()
    local_db.table("enrollment_codes").insert(
        {
            "id": "code-2",
            "code": "LUM2026",
            "batch_id": "batch-2",
            "section": "A",
            "expires_at": "2099-01-01T00:00:00+00:00",
        }
    ).execute()

    _override_user({"id": "student-2", "role": "student"})
    try:
        response = await ac.post("/api/enrollment/validate", json={"enrollmentCode": "LUM2026"})
    finally:
        _clear_overrides()

    assert response.status_code == 200
    payload = response.json()
    assert payload["valid"] is True
    assert payload["department"]["name"] == "Computer Science"
    assert payload["batch"]["id"] == "batch-2"
    assert payload["semester"] == 3
    assert payload["section"] == "A"


@pytest.mark.asyncio
async def test_student_onboarding_v2_requires_sequence_and_completes(ac, local_db):
    local_db.table("departments").insert(
        {
            "id": "dept-3",
            "department_name": "Electronics",
            "abbreviation": "ECE",
            "institution_id": "college-9",
        }
    ).execute()
    local_db.table("programs").insert(
        {
            "id": "program-3",
            "department_id": "dept-3",
            "program_name": "B.Tech ECE",
            "status": "active",
        }
    ).execute()
    local_db.table("batches").insert(
        {
            "id": "batch-3",
            "dept_id": "dept-3",
            "label": "2026-2030",
            "current_semester": 1,
        }
    ).execute()
    local_db.table("classes").insert(
        {
            "id": "class-3",
            "batch_id": "batch-3",
            "program_id": "program-3",
            "semester_id": "semester-3",
            "section": "B",
        }
    ).execute()
    local_db.table("semesters").insert(
        {
            "id": "semester-3",
            "program_id": "program-3",
            "semester_number": 1,
        }
    ).execute()
    local_db.table("courses").insert(
        {
            "id": "course-3",
            "department_id": "dept-3",
            "program_id": "program-3",
            "semester_id": "semester-3",
            "course_name": "Circuit Theory",
            "course_code": "ECE101",
            "semester": 1,
        }
    ).execute()
    local_db.table("enrollment_codes").insert(
        {
            "id": "code-3",
            "code": "ECE2030",
            "batch_id": "batch-3",
            "section": "B",
            "expires_at": "2099-01-01T00:00:00+00:00",
        }
    ).execute()
    local_db.table("users").insert(
        {
            "id": "student-3",
            "email": "student3@example.com",
            "role": "student",
            "onboarding_step": 0,
        }
    ).execute()

    _override_user(
        {
            "id": "student-3",
            "email": "student3@example.com",
            "role": "student",
            "onboarding_step": 0,
        }
    )
    try:
        out_of_sequence = await ac.post("/api/onboarding/enrollment", json={"enrollment_code": "ECE2030"})
        assert out_of_sequence.status_code == 409

        step1 = await ac.post(
            "/api/onboarding/personal",
            json={
                "first_name": "Ada",
                "last_name": "Lovelace",
                "date_of_birth": "2005-05-01",
                "gender": "female",
                "phone_number": "+91 9000000000",
                "email": "student3@example.com",
            },
        )
        assert step1.status_code == 200

        step2 = await ac.post("/api/onboarding/enrollment", json={"enrollment_code": "ECE2030"})
        assert step2.status_code == 200

        subjects = await ac.get("/api/onboarding/student-subjects", params={"batch_id": "batch-3"})
        assert subjects.status_code == 200
        assert len(subjects.json()) == 1

        step3 = await ac.post("/api/onboarding/subjects", json={"subject_ids": ["course-3"]})
        assert step3.status_code == 200

        step4 = await ac.post(
            "/api/onboarding/profile",
            data={"emergency_contact": "+91 9888888888", "parent_email": "parent@example.com"},
            files={"profile_photo": ("avatar.png", b"image-bytes", "image/png")},
        )
        assert step4.status_code == 200

        step5 = await ac.post(
            "/api/onboarding/preferences",
            json={
                "learning_styles": ["visual_learner", "step_by_step"],
                "self_assessment": "intermediate",
            },
        )
    finally:
        _clear_overrides()

    assert step5.status_code == 200
    payload = step5.json()
    assert payload["complete"] is True
    assert payload["programLinked"] is True

    user = await supabase_db.fetch_one("users", {"id": "student-3"})
    assert user is not None
    assert user["onboarding_step"] == 5
    assert user["batch_id"] == "batch-3"
    assert user["section"] == "B"

    subjects = await supabase_db.fetch_all("student_subjects", {"student_id": "student-3"})
    assert len(subjects) == 1
    assert subjects[0]["subject_id"] == "course-3"

    learner_profile = await supabase_db.fetch_one("learner_profiles", {"user_id": "student-3"})
    assert learner_profile is not None
    assert learner_profile["preferences"]["self_assessment"] == "intermediate"


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
