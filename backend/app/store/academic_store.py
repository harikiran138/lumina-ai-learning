from typing import List, Optional, Dict, Any
from datetime import datetime
from app.database.supabase_manager import supabase_db
from app.core.logging import structlog

log = structlog.get_logger()

class AcademicStore:
    """
    Supabase store for Academic hierarchy, Credits, and Promotions.
    """

    def __init__(self, db: Optional[Any] = None):
        self.db = db or supabase_db

    def _normalize_section(self, sec: Optional[dict]) -> Optional[dict]:
        if not sec:
            return None
        normalized = sec.copy()
        # Ensure section_name and class_name are interchangeable for legacy support
        if "section_name" not in normalized and "name" in normalized:
            normalized["section_name"] = normalized.get("name")
        if "class_name" not in normalized and "name" in normalized:
            normalized["class_name"] = normalized.get("name")
        return normalized

    async def get_student_enrollment(self, student_id: str) -> Optional[dict]:
        return await self.db.fetch_one("student_enrollments", {"student_id": student_id})

    async def get_student_credits(self, student_id: str) -> List[dict]:
        return await self.db.fetch_all("student_credits", {"student_id": student_id})

    async def get_sections(self, batch_id: str, semester_id: Optional[str] = None) -> List[dict]:
        """Fetch all sections/classes for a specific batch and semester."""
        filters = {"batch_id": batch_id}
        if semester_id:
            filters["semester_id"] = semester_id
            
        classes = await self.db.fetch_all("classes", filters)
        return [s for s in (self._normalize_section(s) for s in classes) if s is not None]

    async def get_section_by_id(self, section_id: str) -> Optional[dict]:
        """Fetch a specific class/section by ID."""
        sec = await self.db.fetch_one("classes", {"id": section_id})
        return self._normalize_section(sec)

    async def create_class(self, data: Dict[str, Any]) -> Optional[dict]:
        # Map incoming legacy fields to current schema
        payload = data.copy()
        if "section_name" not in payload and "class_name" in payload:
            payload["section_name"] = payload.get("class_name")
        if "batch_name" not in payload and "batch" in payload:
            payload["batch_name"] = payload.get("batch")
        if "academic_year" not in payload:
            payload["academic_year"] = payload.get("batch_year") or payload.get("batch") or "unknown"
        if "batch_name" not in payload:
            payload["batch_name"] = payload.get("batch_year") or payload.get("batch") or "unknown"
        return await self.db.insert("classes", payload)

    async def get_student_class_enrollment(self, student_id: str) -> Optional[dict]:
        """Fetch the student's enrollment including their class_id."""
        return await self.db.fetch_one("student_enrollments", {"student_id": student_id})

    async def update_credits(self, student_id: str, semester_id: str, earned: int, total: int):
        data = {
            "student_id": student_id,
            "semester_id": semester_id,
            "earned_credits": earned,
            "total_credits": total,
            "updated_at": datetime.utcnow().isoformat()
        }
        return await self.db.upsert("student_credits", data, on_conflict="student_id, semester_id")

    async def promote_student(self, student_id: str) -> Optional[dict]:
        """Promote student to the next semester in their program."""
        try:
            enrollment = await self.get_student_enrollment(student_id)
            if not enrollment:
                log.warning("promotion_failed_no_enrollment", student_id=student_id)
                return None

            program_id = enrollment["program_id"]
            current_sem_id = enrollment["current_semester_id"]

            # Fetch current semester number
            current_sem = await self.db.fetch_one("semesters", {"id": current_sem_id})
            if not current_sem:
                return None

            next_sem_num = current_sem["semester_number"] + 1
            
            # Find next semester
            next_sem = await self.db.fetch_one("semesters", {
                "program_id": program_id,
                "semester_number": next_sem_num
            })

            if not next_sem:
                log.info("promotion_limit_reached", student_id=student_id, program_id=program_id)
                return None

            # Update enrollment
            updated = await self.db.update("student_enrollments", 
                {"current_semester_id": next_sem["id"]}, 
                {"student_id": student_id}
            )
            
            # Record promotion in history
            await self.db.insert("academic_history", {
                "student_id": student_id,
                "academic_year_id": enrollment.get("academic_year_id"),
                "semester_id": next_sem["id"],
                "section_id": enrollment.get("section_id"),
                "result_status": "promoted"
            })
            
            log.info("student_promoted", student_id=student_id, to_semester=next_sem_num)
            return updated
        except Exception as e:
            log.error("promote_student_failed", error=str(e), student_id=student_id)
            return None

    async def verify_teacher_student_link(self, teacher_id: str, student_id: str) -> bool:
        """
        Verifies if a teacher is assigned to any class that the student is enrolled in.
        Strict relationship check for data scoping.
        """
        try:
            # 1. Get student's class_id
            enrollment = await self.db.fetch_one("student_enrollments", {"student_id": student_id})
            if not enrollment or not enrollment.get("class_id"):
                return False
            
            student_class_id = enrollment["class_id"]

            # 2. Check teacher assignments for this class
            assignment = await self.db.fetch_one("teacher_assignments", {
                "teacher_id": teacher_id,
                "class_id": student_class_id
            })
            
            return assignment is not None
        except Exception as e:
            log.error("teacher_student_link_verification_failed", teacher_id=teacher_id, student_id=student_id, error=str(e))
            return False

    # --- Department Methods ---

    async def get_departments(self, institution_id: str) -> List[dict]:
        """Fetch all departments for an institution."""
        return await self.db.fetch_all("departments", {"institution_id": institution_id})

    async def get_department_by_id(self, dept_id: str) -> Optional[dict]:
        return await self.db.fetch_one("departments", {"id": dept_id})

    async def get_department_by_hod(self, hod_id: str) -> Optional[dict]:
        return await self.db.fetch_one("departments", {"hod_id": hod_id})

    async def get_department_teachers(self, dept_id: str) -> List[dict]:
        """Fetch all teachers belonging to a specific department."""
        return await self.db.fetch_all("users", {"department_id": dept_id, "role": "teacher"})

    async def get_department_programs(self, dept_id: str) -> List[dict]:
        """Fetch all programs under a specific department."""
        return await self.db.fetch_all("programs", {"department_id": dept_id})

    async def get_department_students(self, dept_id: str) -> List[dict]:
        """Fetch all students belonging to a specific department."""
        return await self.db.fetch_all("users", {"department_id": dept_id, "role": "student"})

    async def create_department(self, data: Dict[str, Any]) -> Optional[dict]:
        return await self.db.insert("departments", data)

    async def update_department(self, dept_id: str, data: Dict[str, Any]) -> Optional[dict]:
        return await self.db.update("departments", data, {"id": dept_id})

    async def delete_department(self, dept_id: str) -> bool:
        res = await self.db.delete("departments", {"id": dept_id})
        return res is not None

    # --- Institution & Program Methods ---

    async def get_institutions(self) -> List[dict]:
        """Fetch all institutions."""
        return await self.db.fetch_all("institutions", {})

    async def get_institution_by_id(self, inst_id: str) -> Optional[dict]:
        return await self.db.fetch_one("institutions", {"id": inst_id})

    async def get_programs(self, institution_id: str) -> List[dict]:
        """Fetch all programs for an institution."""
        return await self.db.fetch_all("programs", {"institution_id": institution_id})

    async def get_semesters(self, program_id: str) -> List[dict]:
        """Fetch all semesters for a program."""
        return await self.db.fetch_all("semesters", {"program_id": program_id})

    async def list_all_classes(self, limit: int = 1000) -> List[dict]:
        """Fetch all classes across all programs (for admin view)."""
        classes = await self.db.fetch_all("classes", limit=limit)
        return [c for c in (self._normalize_class(c) for c in classes) if c is not None]

    async def delete_class(self, class_id: str) -> bool:
        """Remove a class/section."""
        res = await self.db.delete("classes", {"id": class_id})
        return res is not None

    # --- Academic Years ---

    async def get_academic_years(self, institution_id: str) -> List[dict]:
        return await self.db.fetch_all("academic_years", {"institution_id": institution_id})

    async def create_academic_year(self, data: Dict[str, Any]) -> Optional[dict]:
        return await self.db.insert("academic_years", data)

    # --- Sections ---

    async def get_course_concepts(self, course_id: str) -> List[dict]:
        """Fetch concepts allowed for a specific course (AI Scope Enforcement)."""
        return await self.db.fetch_all("course_concepts", {"course_id": course_id})

    async def get_student_allowed_concepts(self, student_id: str, course_id: str) -> List[str]:
        """Fetch names of concepts allowed for this student in this course."""
        concepts = await self.get_course_concepts(course_id)
        return [c["name"] for c in concepts]

    async def assign_student_to_section(self, student_id: str, section_id: str, academic_year_id: str):
        data = {
            "section_id": section_id,
            "academic_year_id": academic_year_id,
            "updated_at": datetime.utcnow().isoformat()
        }
        res = await self.db.update("student_enrollments", data, {"student_id": student_id})
        
        # Also bind to normalized student_profiles
        try:
            await self.db.upsert("student_profiles", {
                "user_id": student_id,
                "section_id": section_id,
                "academic_year_id": academic_year_id
            }, on_conflict="user_id")
        except Exception as e:
            log.warning("student_profile_update_failed", error=str(e))
            
        return res

    async def update_mastery(self, student_id: str, topic_id: str, performance_gain: float):
        """Update a student's mastery level for a specific topic/concept."""
        try:
            now = datetime.utcnow().isoformat()
            
            # Fetch existing mastery
            existing = await self.db.fetch_one("student_mastery", {
                "student_id": student_id,
                "topic_id": topic_id
            })

            if existing:
                new_mastery = min(100.0, float(existing.get("mastery_score", 0)) + performance_gain)
                res = await self.db.update("student_mastery", {
                    "mastery_score": new_mastery,
                    "updated_at": now
                }, {"id": existing["id"]})
            else:
                # First time mastery for this topic
                res = await self.db.insert("student_mastery", {
                    "student_id": student_id,
                    "topic_id": topic_id,
                    "mastery_score": performance_gain,
                    "created_at": now,
                    "updated_at": now
                })
            
            log.info("mastery_updated", student_id=student_id, topic_id=topic_id, gain=performance_gain)
            return res
        except Exception as e:
            log.error("update_mastery_failed", error=str(e), student_id=student_id)
            return None
