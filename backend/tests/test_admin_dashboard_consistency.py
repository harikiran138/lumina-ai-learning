import pytest

from app.store.analytics_store import AnalyticsStore
from app.store.institution_store import InstitutionStore


@pytest.mark.asyncio
async def test_admin_dashboard_falls_back_to_scoped_users_without_stakeholders(monkeypatch):
    store = AnalyticsStore()

    async def fake_tables():
        return {
            "users": [
                {
                    "id": "student-1",
                    "name": "Student One",
                    "email": "student1@example.com",
                    "role": "student",
                    "status": "active",
                    "college_id": "inst-1",
                    "created_at": "2026-03-20T10:00:00+00:00",
                },
                {
                    "id": "faculty-1",
                    "name": "Faculty One",
                    "email": "faculty1@example.com",
                    "role": "faculty",
                    "status": "active",
                    "department_id": "dept-1",
                    "created_at": "2026-03-21T10:00:00+00:00",
                },
                {
                    "id": "hod-1",
                    "name": "HOD One",
                    "email": "hod1@example.com",
                    "role": "hod",
                    "status": "active",
                    "department_id": "dept-1",
                    "created_at": "2026-03-22T10:00:00+00:00",
                },
            ],
            "courses": [
                {
                    "id": "course-1",
                    "title": "Signals",
                    "status": "Published",
                    "is_published": True,
                    "moduleCount": 4,
                    "department_id": "dept-1",
                    "teacher_id": "faculty-1",
                }
            ],
            "progress": [
                {
                    "id": "enrollment-1",
                    "course_id": "course-1",
                    "user_id": "student-1",
                    "progress": 72,
                    "mastery": 68,
                    "last_accessed": "2026-03-25T10:00:00+00:00",
                }
            ],
            "assignments": [],
            "submissions": [],
            "institutions": [
                {
                    "id": "inst-1",
                    "institution_name": "Lumina College",
                    "created_at": "2026-03-01T10:00:00+00:00",
                }
            ],
            "departments": [
                {
                    "id": "dept-1",
                    "institution_id": "inst-1",
                    "department_name": "CSE",
                }
            ],
            "programs": [],
            "stakeholders": [],
        }

    async def fake_primary_institution_id(self):
        return "inst-1"

    monkeypatch.setattr(store, "_normalized_tables", fake_tables)
    monkeypatch.setattr(InstitutionStore, "get_primary_institution_id", fake_primary_institution_id)

    payload = await store.get_admin_dashboard_stats()

    assert payload["summary"]["totalUsers"] == 3
    assert payload["summary"]["totalStudents"] == 1
    assert payload["summary"]["totalFaculty"] == 2
    assert payload["summary"]["activeUsers"] == 3
    assert payload["summary"]["activeCourses"] == 1
