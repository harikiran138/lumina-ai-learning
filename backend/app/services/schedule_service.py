"""
Schedule Service — canonical business logic for class schedules.

All schedule reads use the canonical `classes` and `teacher_assignments` tables.
The legacy `sections` table is accessed only through the compatibility view.
"""

from typing import Optional
from app.store.academic_store import AcademicStore
from app.services.enrollment_service import get_enrollments_for_student
from app.core.logging import structlog

log = structlog.get_logger()


async def get_class_schedule(db, class_id: str) -> dict:
    """
    Return the full schedule for a class including teacher assignments and courses.
    Uses canonical `classes` and `teacher_assignments` tables only.
    """
    store = AcademicStore(db=db)
    class_data = await store.get_class_by_id(class_id)
    if not class_data:
        return {}
    assignments = await store.get_teacher_assignments_for_class(class_id)
    return {
        "class": class_data,
        "assignments": assignments,
    }


async def get_student_schedule(db, student_id: str) -> list:
    """
    Return all classes a student is enrolled in, with their teachers and courses.
    Reads from student_enrollments (canonical) then enriches each class.
    """
    enrollments = await get_enrollments_for_student(db, student_id=student_id)
    result = []
    for enrollment in enrollments:
        class_id = enrollment.get("class_id")
        if not class_id:
            continue
        schedule = await get_class_schedule(db, class_id)
        if schedule:
            result.append(schedule)
    return result


async def create_academic_year_record(db, payload: dict) -> Optional[dict]:
    """Create a new academic year entry."""
    return await db.insert("academic_years", payload)


async def create_class_record(db, payload: dict) -> Optional[dict]:
    """Create a new class entry in the canonical classes table."""
    return await db.insert("classes", payload)


async def get_classes_for_batch(db, batch_id: str) -> list:
    """List all classes for a given batch (replaces legacy sections endpoint)."""
    return await db.fetch_all("classes", {"batch_id": batch_id})
