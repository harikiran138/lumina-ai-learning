"""
Enrollment Service — canonical business logic for class enrollments.

All class enrollment operations must go through this service.
This service uses student_enrollments (canonical) exclusively.
The legacy `enrollments` table is only used for course-progress tracking (StudentStore).
"""

from datetime import datetime
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
    
    # 1. Fetch class info to get program/semester/course
    cls = await store.get_class_by_id(class_id)
    if not cls:
        raise ValueError("Class not found")
        
    program_id = cls.get("program_id")
    # Use provided semester_id or fall back to class semester
    final_semester_id = semester_id or cls.get("semester_id")
    course_id = cls.get("course_id")

    # 2. Check existing enrollment
    existing = await store.get_student_enrollments_compat(
        student_id=student_id, class_id=class_id, course_id=course_id
    )
    if existing:
        raise ValueError("Student already enrolled in this class/course")

    # 3. Insert into student_enrollments
    result = await db.insert("student_enrollments", {
        "student_id": student_id,
        "class_id": class_id,
        "course_id": course_id,
        "program_id": program_id,
        "current_semester_id": final_semester_id,
        "status": "active",
        "progress": {
            "completed_lessons": [],
            "mastery": 0.0,
            "hours_spent": 0.0,
            "streak": 0,
            "last_accessed": datetime.utcnow().isoformat(),
        }
    })
    log.info("student_enrolled_in_class", student_id=student_id, class_id=class_id, course_id=course_id)
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
