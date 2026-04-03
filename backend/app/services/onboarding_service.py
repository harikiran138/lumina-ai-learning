from datetime import datetime
from typing import Any, Dict, List, Optional, Union
import uuid
import mimetypes
import os

from fastapi import HTTPException
import structlog
from app.database.supabase_manager import supabase_db
from app.store.user_store import UserStore
from app.core.rbac import normalize_role

logger = structlog.get_logger(__name__)

class OnboardingService:
    def __init__(self, db: Any = None):
        self.db = db or supabase_db

    async def complete_onboarding(self, user_id: str, role: str, current_user: Dict[str, Any], payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Finalizes onboarding for a user by migrating data from temporary storage 
        to role-specific profile tables.
        """
        role = normalize_role(role)
        logger.info(f"completing_onboarding_for_role: {role}", user_id=user_id)
        
        # 1. Fetch current progress data
        user_data = await self.db.fetch_one("user_data", {"user_id": user_id})
        if not user_data or not user_data.get("progress"):
            # If no progress data, we still mark as step 5 but can't migrate much
            logger.warning("no_onboarding_progress_found", user_id=user_id)
            progress = {}
        else:
            progress = user_data.get("progress")

        # 2. Route to role-specific migration logic
        migration_results = {}
        try:
            if role == "student":
                migration_results = await self._migrate_student(user_id, progress, current_user, payload)
            elif role in {"faculty", "hod", "teacher"}:
                migration_results = await self._migrate_faculty(user_id, progress, current_user, payload)
            elif role == "parent":
                migration_results = await self._migrate_parent(user_id, progress, current_user, payload)
            elif role == "mentor":
                migration_results = await self._migrate_mentor(user_id, progress, current_user, payload)
            elif role == "researcher":
                migration_results = await self._migrate_researcher(user_id, progress, current_user, payload)
            elif role in {"college_admin", "super_admin"}:
                migration_results = await self._migrate_admin(user_id, progress, current_user, payload)
            else:
                logger.info(f"generic_onboarding_completion_for_role: {role}")
        except Exception as e:
            logger.error(f"migration_failed_during_onboarding: {e}", exc_info=True)
            # We continue so the user isn't stuck, but log the error
            migration_results = {"error": str(e), "status": "partial_failure"}

        # 3. Finalize onboarding status in user record
        now = datetime.utcnow().isoformat()
        updates = {
            "onboarding_step": 5,
            "updated_at": now
        }
        
        # Sync generic fields if they were updated during onboarding
        step_1 = progress.get("step_1") or {}
        if step_1.get("first_name") and step_1.get("last_name"):
            full_name = f"{step_1.get('first_name')} {step_1.get('last_name')}"
            updates["full_name"] = full_name
            updates["name"] = full_name
        elif step_1.get("fullName"):
            updates["full_name"] = step_1.get("fullName")
            updates["name"] = step_1.get("fullName")
        
        if step_1.get("phone"):
            updates["phone"] = step_1.get("phone")
        elif step_1.get("phone_number"):
            updates["phone"] = step_1.get("phone_number")
            
        step_4 = progress.get("step_4") or {}
        if step_4.get("profilePhotoUrl"):
            updates["profile_photo_url"] = step_4.get("profilePhotoUrl")

        await UserStore(db=self.db).update_user_fields(user_id, updates)

        # 4. Update progress tag
        progress["onboarding_status"] = "COMPLETED"
        progress["onboarding_step"] = 5
        progress["completed_at"] = now
        
        await self.db.update(
            "user_data",
            {"progress": progress, "updated_at": now},
            {"user_id": user_id}
        )

        return {
            "success": True,
            "step": 5,
            "complete": True,
            "role": role,
            "migration": migration_results
        }

    async def _migrate_student(self, user_id: str, progress: Dict[str, Any], current_user: Dict[str, Any], payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Migrates student data to learner_profiles and enrollments."""
        payload = payload or {}
        step_1 = progress.get("step_1") or {}
        step_2 = progress.get("step_2") or {}
        step_3 = progress.get("step_3") or {}
        step_5 = progress.get("step_5") or {}
        
        now = datetime.utcnow().isoformat()
        
        # 1. Initialize Learner Profile
        learning_styles = payload.get("learning_styles") or step_5.get("learningStyles") or step_5.get("learning_styles") or []
        primary_style = learning_styles[0] if learning_styles else "visual"
        
        await self.db.upsert(
            "learner_profiles",
            {
                "user_id": user_id,
                "role": "student",
                "goals": payload.get("goals") or ["complete_curriculum"],
                "learning_style": primary_style,
                "preferences": {
                    "learning_styles": learning_styles,
                    "self_assessment": payload.get("self_assessment") or step_5.get("selfAssessment") or step_5.get("self_assessment"),
                },
                "status": "active",
                "updated_at": now,
            },
            on_conflict="user_id"
        )
        
        # 2. Ensure Student Enrollment
        batch_id = step_2.get("batchId") or step_2.get("batch_id") or current_user.get("batch_id")
        if batch_id:
            await self.db.upsert(
                "student_enrollments",
                {
                    "student_id": user_id,
                    "batch_id": batch_id,
                    "dept_id": step_2.get("departmentId") or step_2.get("dept_id") or current_user.get("dept_id"),
                    "section": step_2.get("section") or current_user.get("section"),
                    "status": "active",
                    "updated_at": now
                },
                on_conflict="student_id, batch_id"
            )
            
        # 3. Migrate selected subjects
        subjects = step_3.get("subjectIds") or step_3.get("subject_ids") or []
        if subjects:
            # Clear existing to avoid duplicates if re-onboarding
            await self.db.delete("student_subjects", {"student_id": user_id})
            for sid in subjects:
                await self.db.insert("student_subjects", {"student_id": user_id, "subject_id": sid})
                
        return {"status": "success", "profile": "learner_profiles", "enrollment_synced": bool(batch_id)}

    async def _migrate_faculty(self, user_id: str, progress: Dict[str, Any], current_user: Dict[str, Any], payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Migrates faculty data to teacher_profiles."""
        payload = payload or {}
        step_1 = progress.get("step_1") or {}
        step_5 = progress.get("step_5") or {}
        
        now = datetime.utcnow().isoformat()
        
        # Faculty profile migration
        profile_payload = {
            "user_id": user_id,
            "full_name": payload.get("full_name") or step_1.get("fullName") or step_1.get("name") or current_user.get("full_name") or f"{step_1.get('firstName')} {step_1.get('lastName')}",
            "employee_id": payload.get("employee_id") or step_1.get("employeeId") or step_1.get("employee_id"),
            "designation": payload.get("designation") or step_1.get("designation") or "Faculty",
            "specialization": payload.get("specialization") or step_1.get("specialization"),
            "experience_years": payload.get("experience_years") or step_1.get("experienceYears") or step_1.get("experience_years"),
            "subjects": payload.get("subjects") or progress.get("step_2", {}).get("subjects", []),
            "bio": payload.get("bio") or (f"Engineering faculty setup complete. Goal: {payload.get('teaching_goal')}." if payload.get('teaching_goal') else None),
            "onboarding_completed": True,
            "status": "active",
            "updated_at": now
        }
        
        await self.db.upsert("teacher_profiles", profile_payload, on_conflict="user_id")
        
        # Preferences
        prefs = payload.get("preferences") or step_5
        if prefs:
            await self.db.upsert(
                "dashboard_preferences",
                {
                    "user_id": user_id,
                    "preferences": prefs,
                    "updated_at": now
                },
                on_conflict="user_id"
            )
            
        return {"status": "success", "profile": "teacher_profiles"}

    async def _migrate_parent(self, user_id: str, progress: Dict[str, Any], current_user: Dict[str, Any], payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Migrates parent data to parent_profiles."""
        step_1 = progress.get("step_1") or {}
        
        now = datetime.utcnow().isoformat()
        
        profile_payload = {
            "user_id": user_id,
            "occupation": step_1.get("occupation"),
            "relationship": step_1.get("relationship"),
            "emergency_contact": step_1.get("phone") or step_1.get("phone_number"),
            "address": step_1.get("address"),
            "updated_at": now
        }
        
        await self.db.upsert("parent_profiles", profile_payload, on_conflict="user_id")
        return {"status": "success", "profile": "parent_profiles"}

    async def _migrate_mentor(self, user_id: str, progress: Dict[str, Any], current_user: Dict[str, Any], payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Migrates mentor data to mentor_profiles."""
        step_1 = progress.get("step_1") or {}
        step_3 = progress.get("step_3") or {}
        
        now = datetime.utcnow().isoformat()
        
        profile_payload = {
            "user_id": user_id,
            "bio": step_1.get("bio"),
            "expertise": step_3.get("expertise") or step_3.get("expertise_areas") or [],
            "years_of_experience": step_1.get("experienceYears") or step_1.get("years_of_experience"),
            "linked_in_url": step_1.get("linkedIn") or step_1.get("linkedin_url"),
            "availability": progress.get("step_4", {}).get("availability"),
            "updated_at": now
        }
        
        await self.db.upsert("mentor_profiles", profile_payload, on_conflict="user_id")
        return {"status": "success", "profile": "mentor_profiles"}

    async def _migrate_researcher(self, user_id: str, progress: Dict[str, Any], current_user: Dict[str, Any], payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Migrates researcher data to researcher_profiles."""
        step_1 = progress.get("step_1") or {}
        
        now = datetime.utcnow().isoformat()
        
        profile_payload = {
            "user_id": user_id,
            "institution": step_1.get("institutionName") or step_1.get("institution_name"),
            "research_area": step_1.get("researchArea") or step_1.get("research_area"),
            "publications_link": step_1.get("publications") or step_1.get("publications_link"),
            "updated_at": now
        }
        
        await self.db.upsert("researcher_profiles", profile_payload, on_conflict="user_id")
        return {"status": "success", "profile": "researcher_profiles"}

    async def _migrate_admin(self, user_id: str, progress: Dict[str, Any], current_user: Dict[str, Any], payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Migrates admin data and activates institutions."""
        college_id = current_user.get("college_id") or current_user.get("institution_id")
        if college_id:
            await self.db.update(
                "institutions",
                {
                    "onboarding_status": "ACTIVE",
                    "is_active": True,
                    "updated_at": datetime.utcnow().isoformat(),
                },
                {"id": college_id},
            )
            return {"status": "success", "institution_activated": college_id}
        return {"status": "skipped", "reason": "no_institution_linked"}
