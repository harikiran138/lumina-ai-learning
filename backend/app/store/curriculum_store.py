from typing import List, Optional, Dict
from uuid import UUID
from app.database.supabase_manager import supabase_db as supabase

class BaseStore:
    def __init__(self):
        self.supabase = supabase

class CurriculumStore(BaseStore):
    """
    Manages the academic hierarchy: Programs, Semesters, and Student Enrollments.
    """
    
    async def get_program_by_name(self, name: str) -> Optional[Dict]:
        """Fetch a program by its name."""
        result = await self.supabase.table("programs")\
            .select("*")\
            .eq("program_name", name)\
            .async_execute()
        if not result.data:
            return None
        return result.data[0]

    async def get_semesters(self, program_id: UUID) -> List[Dict]:
        """Fetch all semesters for a given program."""
        result = await self.supabase.table("semesters")\
            .select("*")\
            .eq("program_id", str(program_id))\
            .order("semester_number")\
            .async_execute()
        return result.data

    async def get_student_enrollment(self, student_id: UUID) -> Optional[Dict]:
        """Get the current program and semester for a student using robust nested queries."""
        # 1. Fetch the enrollment record
        enr_res = await self.supabase.table("student_enrollments") \
            .select("*") \
            .eq("student_id", str(student_id)) \
            .async_execute()
        
        if not enr_res.data:
            return None
            
        enrollment = enr_res.data[0]
        
        # 2. Fetch the semester details
        sem_res = await self.supabase.table("semesters") \
            .select("*") \
            .eq("id", enrollment["current_semester_id"]) \
            .async_execute()
            
        if not sem_res.data:
            return None
            
        semester = sem_res.data[0]
        
        # 3. Fetch the program details
        prog_res = await self.supabase.table("programs") \
            .select("*") \
            .eq("id", enrollment["program_id"]) \
            .async_execute()
            
        if not prog_res.data:
            return None
            
        program = prog_res.data[0]
        
        return {
            "enrollment_id": enrollment["id"],
            "semester_id": semester["id"],
            "semester_number": semester["semester_number"],
            "semester_title": semester["title"],
            "program_name": program["program_name"],
            "program_id": enrollment["program_id"]
        }

    async def enroll_student(self, student_id: UUID, program_id: UUID, semester_id: UUID):
        """Enroll or update a student's academic placement."""
        data = {
            "student_id": str(student_id),
            "program_id": str(program_id),
            "current_semester_id": str(semester_id),
            "updated_at": "now()"
        }
        result = await self.supabase.table("student_enrollments")\
            .upsert(data, on_conflict="student_id,program_id")\
            .async_execute()
        return result.data

    async def get_allowed_courses(self, student_id: UUID) -> List[Dict]:
        """
        Fetch courses allowed for the student's current and previous semesters.
        This defines the 'AI Scope'.
        """
        enrollment = await self.get_student_enrollment(student_id)
        if not enrollment:
            return []
            
        current_sem_num = enrollment['semester_number']
        program_id = enrollment['program_id']
        
        # Fetch all semesters up to the current one
        sem_result = await self.supabase.table("semesters")\
            .select("id")\
            .eq("program_id", str(program_id))\
            .lte("semester_number", current_sem_num)\
            .async_execute()
            
        allowed_sem_ids = [s['id'] for s in sem_result.data]
        
        # Fetch courses in those semesters
        courses_result = await self.supabase.table("courses")\
            .select("*")\
            .in_("semester_id", allowed_sem_ids)\
            .async_execute()
            
        return courses_result.data
