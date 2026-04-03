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
        raw_role = str(role or "").strip().lower()
        normalized_role = normalize_role(raw_role)
        effective_role = raw_role if raw_role in {"faculty", "hod"} else normalized_role
        logger.info(f"completing_onboarding_for_role: {effective_role}", user_id=user_id)
        
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
            if effective_role == "student":
                migration_results = await self._migrate_student(user_id, progress, current_user, payload)
            elif effective_role == "teacher":
                migration_results = await self._migrate_teacher(user_id, progress, current_user, payload)
            elif effective_role in {"faculty", "hod"}:
                migration_results = await self._migrate_faculty(user_id, progress, current_user, payload)
            elif effective_role == "parent":
                migration_results = await self._migrate_parent(user_id, progress, current_user, payload)
            elif effective_role == "mentor":
                migration_results = await self._migrate_mentor(user_id, progress, current_user, payload)
            elif effective_role == "peer_tutor":
                migration_results = await self._migrate_peer_tutor(user_id, progress, current_user, payload)
            elif effective_role == "researcher":
                migration_results = await self._migrate_researcher(user_id, progress, current_user, payload)
            elif effective_role in {"college_admin", "super_admin"}:
                migration_results = await self._migrate_admin(user_id, progress, current_user, payload)
            else:
                logger.info(f"generic_onboarding_completion_for_role: {effective_role}")
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
        elif step_1.get("contactPhone"):
            updates["phone"] = step_1.get("contactPhone")
        elif step_1.get("contact_phone"):
            updates["phone"] = step_1.get("contact_phone")
            
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
            "role": effective_role,
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

    async def _migrate_teacher(self, user_id: str, progress: Dict[str, Any], current_user: Dict[str, Any], payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Migrates independent teacher data to teacher_profiles."""
        payload = payload or {}
        step_1 = progress.get("step_1") or {}
        step_2 = progress.get("step_2") or {}
        step_3 = progress.get("step_3") or {}
        step_4 = progress.get("step_4") or {}

        now = datetime.utcnow().isoformat()

        profile_payload = {
            "user_id": user_id,
            "full_name": payload.get("full_name") or step_1.get("fullName") or current_user.get("full_name") or current_user.get("name"),
            "qualification": payload.get("qualification") or step_1.get("qualification"),
            "contact_phone": payload.get("contact_phone") or step_1.get("contactPhone"),
            "subjects": payload.get("subjects") or step_2.get("subjects") or [],
            "experience_years": payload.get("experience_years") or step_2.get("experienceYears") or 0,
            "teaching_mode": payload.get("teaching_mode") or step_2.get("teachingMode"),
            "hourly_rate": payload.get("hourly_rate") or step_2.get("hourlyRate") or 0,
            "availability": payload.get("availability") or step_3.get("availability"),
            "portfolio_links": payload.get("portfolio_links") or step_3.get("portfolioLinks") or [],
            "teaching_focus": payload.get("teaching_focus") or step_3.get("teachingFocus"),
            "response_time": payload.get("response_time") or step_4.get("responseTime"),
            "learner_levels": payload.get("learner_levels") or step_4.get("learnerLevels") or [],
            "is_activated": True,
            "updated_at": now,
        }

        await self.db.upsert("teacher_profiles", profile_payload, on_conflict="user_id")

        return {"status": "success", "profile": "teacher_profiles"}

    async def _migrate_faculty(self, user_id: str, progress: Dict[str, Any], current_user: Dict[str, Any], payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Migrates institution-linked faculty data to faculty_profiles."""
        payload = payload or {}
        step_1 = progress.get("step_1") or {}
        step_2 = progress.get("step_2") or {}
        step_3 = progress.get("step_3") or {}
        step_4 = progress.get("step_4") or {}

        now = datetime.utcnow().isoformat()

        profile_payload = {
            "user_id": user_id,
            "full_name": payload.get("full_name") or step_1.get("fullName") or current_user.get("full_name") or current_user.get("name"),
            "employee_id": payload.get("employee_id") or step_1.get("employeeId") or current_user.get("employee_id"),
            "institution_id": payload.get("institution_id") or step_1.get("collegeId") or current_user.get("college_id") or current_user.get("institution_id"),
            "department": payload.get("department") or step_1.get("department"),
            "designation": payload.get("designation") or step_1.get("designation") or "Faculty",
            "subjects": payload.get("subjects") or step_2.get("subjects") or [],
            "experience_years": payload.get("experience_years") or step_2.get("experienceYears") or 0,
            "verification_docs": payload.get("verification_docs") or step_2.get("verificationDocs") or [],
            "office_hours": payload.get("office_hours") or step_3.get("officeHours"),
            "teaching_modes": payload.get("teaching_modes") or step_3.get("teachingModes") or [],
            "faculty_notes": payload.get("faculty_notes") or step_3.get("facultyNotes"),
            "grading_scale": payload.get("grading_scale") or step_4.get("gradingScale"),
            "analytics_focus": payload.get("analytics_focus") or step_4.get("analyticsFocus") or [],
            "is_verified": bool(payload.get("is_verified")) or bool(step_2.get("confirmedAssignments")),
            "updated_at": now,
        }

        await self.db.upsert("faculty_profiles", profile_payload, on_conflict="user_id")
        return {"status": "success", "profile": "faculty_profiles"}

    async def _migrate_parent(self, user_id: str, progress: Dict[str, Any], current_user: Dict[str, Any], payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Migrates parent data to parent_profiles."""
        step_1 = progress.get("step_1") or {}
        step_2 = progress.get("step_2") or {}
        step_3 = progress.get("step_3") or {}
        step_4 = progress.get("step_4") or {}

        now = datetime.utcnow().isoformat()

        profile_payload = {
            "user_id": user_id,
            "full_name": payload.get("full_name") or step_1.get("fullName") or current_user.get("full_name") or current_user.get("name"),
            "relation": payload.get("relation") or step_1.get("relation"),
            "contact_phone": payload.get("contact_phone") or step_1.get("contactPhone"),
            "parent_email": payload.get("parent_email") or step_1.get("parentEmail"),
            "monitoring_goals": payload.get("monitoring_goals") or step_2.get("monitoringGoals") or [],
            "check_in_frequency": payload.get("check_in_frequency") or step_2.get("checkInFrequency"),
            "alert_preferences": payload.get("alert_preferences") or step_3.get("alertPreferences") or [],
            "support_notes": payload.get("support_notes") or step_3.get("supportNotes"),
            "preferred_language": payload.get("preferred_language") or step_3.get("preferredLanguage") or "English",
            "communication_mode": payload.get("communication_mode") or step_4.get("communicationMode"),
            "dashboard_intent": payload.get("dashboard_intent") or step_4.get("dashboardIntent"),
            "updated_at": now,
        }

        await self.db.upsert("parent_profiles", profile_payload, on_conflict="user_id")

        student_ids = payload.get("student_ids") or step_2.get("studentIds") or []
        await self.db.delete("parent_student_map", {"parent_id": user_id})
        for student_id in student_ids:
            await self.db.upsert(
                "parent_student_map",
                {
                    "parent_id": user_id,
                    "student_id": student_id,
                    "relationship_type": profile_payload.get("relation"),
                    "is_verified": bool(step_4.get("relationshipConfirmation")),
                },
                on_conflict="parent_id, student_id",
            )

        return {"status": "success", "profile": "parent_profiles"}

    async def _migrate_mentor(self, user_id: str, progress: Dict[str, Any], current_user: Dict[str, Any], payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Migrates mentor data to mentor_profiles."""
        step_1 = progress.get("step_1") or {}
        step_2 = progress.get("step_2") or {}
        step_3 = progress.get("step_3") or {}
        step_4 = progress.get("step_4") or {}

        now = datetime.utcnow().isoformat()

        profile_payload = {
            "user_id": user_id,
            "full_name": payload.get("full_name") or step_1.get("fullName") or current_user.get("full_name") or current_user.get("name"),
            "industry": payload.get("industry") or step_1.get("industry"),
            "experience_years": payload.get("experience_years") or step_1.get("experienceYears") or 0,
            "linkedin_url": payload.get("linkedin_url") or step_1.get("linkedinUrl"),
            "expertise_areas": payload.get("expertise_areas") or step_2.get("expertiseAreas") or [],
            "mentorship_type": payload.get("mentorship_type") or step_2.get("mentorshipType"),
            "availability_slots": payload.get("availability_slots") or step_2.get("availabilitySlots") or [],
            "mentorship_goals": payload.get("mentorship_goals") or step_3.get("mentorshipGoals"),
            "target_learner_levels": payload.get("target_learner_levels") or step_3.get("targetLearnerLevels") or [],
            "support_formats": payload.get("support_formats") or step_3.get("supportFormats") or [],
            "response_window": payload.get("response_window") or step_4.get("responseWindow"),
            "portfolio_review_support": (payload.get("portfolio_review_support") or step_4.get("portfolioReviewSupport")) == "yes",
            "updated_at": now,
        }

        await self.db.upsert("mentor_profiles", profile_payload, on_conflict="user_id")
        return {"status": "success", "profile": "mentor_profiles"}

    async def _migrate_peer_tutor(self, user_id: str, progress: Dict[str, Any], current_user: Dict[str, Any], payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Migrates peer tutor data to peer_tutor_profiles."""
        step_1 = progress.get("step_1") or {}
        step_2 = progress.get("step_2") or {}
        step_3 = progress.get("step_3") or {}
        step_4 = progress.get("step_4") or {}

        now = datetime.utcnow().isoformat()

        profile_payload = {
            "user_id": user_id,
            "full_name": payload.get("full_name") or step_1.get("fullName") or current_user.get("full_name") or current_user.get("name"),
            "student_id_code": payload.get("student_id_code") or step_1.get("studentId"),
            "cgpa": payload.get("cgpa") or step_1.get("cgpa"),
            "availability": payload.get("availability") or step_1.get("availability"),
            "strong_subjects": payload.get("strong_subjects") or step_2.get("strongSubjects") or [],
            "preferred_levels": payload.get("preferred_levels") or step_2.get("preferredLevels") or [],
            "tutoring_modes": payload.get("tutoring_modes") or step_2.get("tutoringModes") or [],
            "escalation_preference": payload.get("escalation_preference") or step_3.get("escalationPreference"),
            "tutoring_statement": payload.get("tutoring_statement") or step_3.get("tutoringStatement"),
            "weekly_capacity": payload.get("weekly_capacity") or step_3.get("weeklyCapacity") or 0,
            "collaboration_tools": payload.get("collaboration_tools") or step_4.get("collaborationTools") or [],
            "support_boundaries": payload.get("support_boundaries") or step_4.get("supportBoundaries"),
            "updated_at": now,
        }

        await self.db.upsert("peer_tutor_profiles", profile_payload, on_conflict="user_id")
        return {"status": "success", "profile": "peer_tutor_profiles"}

    async def _migrate_researcher(self, user_id: str, progress: Dict[str, Any], current_user: Dict[str, Any], payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Migrates researcher data to researcher_profiles."""
        step_1 = progress.get("step_1") or {}
        step_2 = progress.get("step_2") or {}
        step_3 = progress.get("step_3") or {}
        step_4 = progress.get("step_4") or {}

        now = datetime.utcnow().isoformat()

        profile_payload = {
            "user_id": user_id,
            "full_name": payload.get("full_name") or step_1.get("fullName") or current_user.get("full_name") or current_user.get("name"),
            "organization": payload.get("organization") or step_1.get("organization"),
            "research_areas": payload.get("research_areas") or step_1.get("researchAreas") or [],
            "data_access_level": payload.get("data_access_level") or step_2.get("dataAccessLevel"),
            "publications": payload.get("publications") or step_2.get("publications") or [],
            "ethics_approval": bool(payload.get("ethics_approval")) or bool(step_2.get("ethicsApproval")),
            "methodology": payload.get("methodology") or step_3.get("methodology"),
            "collaboration_intent": payload.get("collaboration_intent") or step_3.get("collaborationIntent"),
            "reporting_cadence": payload.get("reporting_cadence") or step_3.get("reportingCadence"),
            "privacy_mode": payload.get("privacy_mode") or step_4.get("privacyMode"),
            "export_formats": payload.get("export_formats") or step_4.get("exportFormat") or [],
            "updated_at": now,
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
