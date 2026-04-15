"""
Enrollment Service — canonical business logic for class enrollments.

All class enrollment operations must go through this service.
This service uses student_enrollments (canonical) exclusively.
The legacy `enrollments` table is only used for course-progress tracking (StudentStore).
"""

from typing import Optional
from app.store.academic_store import AcademicStore
from app.core.logging import structlog

log = structlog.get_logger()


async def get_enrollments_for_student(
    db, student_id: str, semester_id: Optional[str] = None
) -> list:
    """Return all class enrollments for a student, optionally filtered by semester."""
    store = AcademicStore(db=db)
    return await store.get_student_enrollments_compat(
        student_id=student_id, semester_id=semester_id
    )


async def enroll_student_in_class(
    db, student_id: str, class_id: str, semester_id: str
) -> dict:
    """
    Enroll a student in a class. Writes to canonical student_enrollments table.
    Raises ValueError if already enrolled.
    """
    store = AcademicStore(db=db)

    existing = await store.get_student_enrollments_compat(
        student_id=student_id, class_id=class_id
    )
    if existing:
        raise ValueError("Student already enrolled in this class")

    result = await db.insert("student_enrollments", {
        "student_id": student_id,
        "class_id": class_id,
        "semester_id": semester_id,
        "status": "active",
    })
    log.info("student_enrolled_in_class", student_id=student_id, class_id=class_id)
    return result


async def unenroll_student(db, student_id: str, class_id: str) -> None:
    """Set a student's class enrollment status to inactive (soft delete)."""
    await db.update(
        "student_enrollments",
        {"status": "inactive"},
        {"student_id": student_id, "class_id": class_id},
    )
    log.info("student_unenrolled_from_class", student_id=student_id, class_id=class_id)
