"""
class_auth.py — Single source of truth for teacher-class and student-class authorization.

All routes that need to verify a teacher belongs to a class, or a student is
enrolled in a class, must call these functions.
Never duplicate this logic inline in a router, service, or store.
"""

from app.core.logging import structlog

log = structlog.get_logger()


async def verify_teacher_has_class_access(db, teacher_id: str, class_id: str) -> bool:
    """
    Single source of truth for teacher-class authorization.
    Returns True if the teacher has an approved assignment for the given class.
    """
    try:
        assignment = await db.fetch_one(
            "teacher_assignments",
            {"teacher_id": teacher_id, "class_id": class_id},
        )
        return bool(assignment and assignment.get("status") == "approved")
    except Exception as exc:
        log.error(
            "verify_teacher_class_access_failed",
            teacher_id=teacher_id,
            class_id=class_id,
            error=str(exc),
        )
        return False


async def verify_student_in_class(db, student_id: str, class_id: str) -> bool:
    """
    Single source of truth for student-class membership check.
    Returns True if the student has an active enrollment in the given class.
    """
    try:
        enrollment = await db.fetch_one(
            "student_enrollments",
            {"student_id": student_id, "class_id": class_id, "status": "active"},
        )
        return enrollment is not None
    except Exception as exc:
        log.error(
            "verify_student_in_class_failed",
            student_id=student_id,
            class_id=class_id,
            error=str(exc),
        )
        return False
