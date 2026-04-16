from typing import Any, Dict, List, Optional, Tuple
from app.store.academic_store import AcademicStore
from app.core.logging import structlog

log = structlog.get_logger()

class AcademicService:
    def __init__(self, db: Optional[Any] = None):
        self.store = AcademicStore(db)

    async def get_student_context(self, student_id: str, course_id: Optional[str], question_text: str) -> Dict[str, Any]:
        """
        Gathers all academic context for a student question.
        Includes course resolved, teacher assigned, profile, and mastery.
        """
        # Resolve course
        course, all_courses = await self.resolve_course_for_student(student_id, course_id, question_text)
        if not course:
            return {"course": None, "teacher_id": None}

        # Resolve teacher
        teacher_id = await self.store.get_teacher_assignment(course["id"])
        if teacher_id and isinstance(teacher_id, dict):
            teacher_id = teacher_id.get("teacher_id")

        # Get profile and mastery
        profile = await self.store.get_learner_profile(student_id)
        mastery = await self.store.get_skill_mastery(student_id)
        
        # Get enrollment for semester
        enrollment = await self.store.get_student_enrollment(student_id) or {}
        semester_label = "Not specified"
        if enrollment.get("current_semester_id"):
            semester = await self.store.get_semester(enrollment["current_semester_id"])
            if semester:
                semester_label = semester.get("title") or f"Semester {semester.get('semester_number')}"
        elif profile.get("grade_level"):
            semester_label = str(profile.get("grade_level"))

        # Get recent assignments
        assignments = await self.store.get_assignments(course["id"])
        recent_assignments = [
            f"{item.get('title') or 'Assignment'}" + (f" (due {item.get('due_date')})" if item.get("due_date") else "")
            for item in assignments
        ]

        return {
            "course": course,
            "all_courses": all_courses,
            "teacher_id": teacher_id,
            "profile": profile,
            "mastery": mastery,
            "semester_label": semester_label,
            "recent_assignments": recent_assignments
        }

    async def resolve_course_for_student(self, student_id: str, course_id: Optional[str], question_text: str) -> Tuple[Optional[Dict[str, Any]], List[Dict[str, Any]]]:
        if course_id:
            course = await self.store.get_course_by_id(course_id)
            return course, [course] if course else []

        enrollments = await self.store.get_student_enrollments(student_id)
        subject_rows = await self.store.get_student_subjects(student_id)
        
        course_ids = {str(r.get("course_id")) for r in enrollments if r.get("course_id")} | \
                     {str(r.get("subject_id")) for r in subject_rows if r.get("subject_id")}
        
        if not course_ids:
            return None, []

        courses = await self.store.get_courses_by_ids(list(course_ids))
        
        # Inject progress for scoring
        progress_lookup = {str(r.get("course_id")): (r.get("progress") or {}).get("mastery", 0) for r in enrollments if r.get("course_id")}
        for c in courses:
            c["progress"] = progress_lookup.get(str(c.get("id")), 0)

        picked = self._pick_course(question_text, courses)
        return picked, courses

    def _pick_course(self, question_text: str, courses: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if not courses:
            return None
        lowered = question_text.lower()
        def score(c: Dict[str, Any]) -> Tuple[int, int]:
            tokens = [str(c.get("subject") or "").lower(), (c.get("course_name") or c.get("name") or "").lower(), str(c.get("description") or "").lower()]
            direct_match = sum(1 for t in tokens if t and t in lowered)
            return direct_match, int(c.get("progress") or 0)
        return sorted(courses, key=score, reverse=True)[0]
