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
    db, student_id: str, class_id: str, semester_id: Optional[str] = None
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


async def complete_lesson(
    db, student_id: str, course_id: str, lesson_id: str
) -> dict:
    """Mark a lesson complete using the canonical enrollment table."""
    enrollment = await db.fetch_one(
        "student_enrollments",
        {"student_id": student_id, "course_id": course_id},
    )
    if not enrollment:
        return {"success": False, "error": "Not enrolled"}

    progress = enrollment.get("progress") or {}
    completed_lessons = progress.get("completed_lessons") or []
    if lesson_id not in completed_lessons:
        completed_lessons.append(lesson_id)
    progress["completed_lessons"] = completed_lessons

    course = await db.fetch_one("courses", {"id": course_id})
    total_lessons = 0
    if course:
        for module in course.get("modules", []) or []:
            total_lessons += len(module.get("lessons", []))

    progress_pct = (len(completed_lessons) / total_lessons * 100) if total_lessons > 0 else 0
    progress["progress_percentage"] = progress_pct

    await db.update(
        "student_enrollments",
        {"progress": progress},
        {"id": enrollment["id"]},
    )
    return {"success": True, "lesson_id": lesson_id, "progress": progress_pct}


async def unenroll_student(db, student_id: str, class_id: str) -> None:
    """Set a student's class enrollment status to inactive (soft delete)."""
    await db.update(
        "student_enrollments",
        {"status": "inactive"},
        {"student_id": student_id, "class_id": class_id},
    )
    log.info("student_unenrolled_from_class", student_id=student_id, class_id=class_id)
