"""
Alumni onboarding service.

4-step alumni onboarding flow:
1. Alumni identity & graduation details
2. Current professional status
3. Contribution preferences
4. Mentorship setup (if opted in)
"""

from typing import Any, Dict, List
from datetime import datetime
import structlog
from .base_service import BaseOnboardingService

logger = structlog.get_logger(__name__)


class AlumniOnboardingService(BaseOnboardingService):
    """Alumni-specific onboarding connecting graduates to mentorship and feedback."""

    TOTAL_STEPS = 4
    ROLE_NAME = "alumni"

    @property
    def TOTAL_STEPS(self) -> int:
        return 4

    @property
    def ROLE_NAME(self) -> str:
        return "alumni"

    async def get_step_options(self, step: int) -> Dict[str, Any]:
        """Get alumni onboarding options per step."""
        options = {
            1: {
                "title": "Alumni Identity",
                "description": "Verify your graduation details",
                "fields": ["full_name", "profile_photo", "graduation_year", "degree_obtained", "branch", "college", "roll_number", "current_location"],
                "dropdowns": {
                    "graduation_year": list(range(2010, datetime.now().year + 1)),
                    "branch": ["Computer Science", "Electronics", "Mechanical", "Civil", "Chemical", "Other"],
                }
            },
            2: {
                "title": "Professional Status",
                "description": "Tell us about your career",
                "fields": ["employment_status", "current_job_title", "current_employer", "industry", "highest_qualification", "linkedin_url"],
                "dropdowns": {
                    "employment_status": ["Employed", "Self-employed", "Pursuing higher education", "Between roles"],
                    "industry": ["Technology", "Finance", "Healthcare", "Education", "Manufacturing", "Consulting", "Government", "Non-profit", "Other"],
                    "highest_qualification": ["Bachelor's", "Master's", "PhD", "Professional certification"],
                }
            },
            3: {
                "title": "Contribution Preferences",
                "description": "How would you like to contribute?",
                "fields": ["want_to_mentor", "guest_lectures", "review_projects", "contribute_content", "alumni_events", "contribution_topics"],
                "checkboxes": [
                    "Want to mentor current students",
                    "Available for guest lectures",
                    "Willing to review student projects",
                    "Want to contribute to course content",
                    "Want to participate in alumni events",
                ]
            },
            4: {
                "title": "Mentorship Setup",
                "description": "Configure your mentorship availability (if opted in)",
                "fields": ["available_time_slots", "session_mode", "sessions_per_month", "compensation_model"],
                "conditional": "only_if_mentorship_opted",
                "dropdowns": {
                    "session_mode": ["Video/Phone call", "Chat", "In-person", "Flexible"],
                    "sessions_per_month": ["1 session", "2-3 sessions", "4+ sessions", "Flexible"],
                    "compensation_model": ["Volunteer only (alumni tradition)"],
                }
            },
        }
        return options.get(step, {})

    async def validate_step(self, step: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate alumni onboarding step data."""
        errors: List[str] = []

        if step == 1:
            if not data.get("full_name", "").strip():
                errors.append("Full name is required")
            if not data.get("graduation_year"):
                errors.append("Graduation year is required")
            else:
                try:
                    year = int(data["graduation_year"])
                    current_year = datetime.now().year
                    if year < 2000 or year > current_year:
                        errors.append(f"Graduation year must be between 2000 and {current_year}")
                except (ValueError, TypeError):
                    errors.append("Invalid graduation year")
            
            if not data.get("college"):
                errors.append("College is required")

        elif step == 2:
            if not data.get("employment_status"):
                errors.append("Employment status is required")
            if data.get("employment_status") in ["Employed", "Self-employed"]:
                if not data.get("current_job_title"):
                    errors.append("Current job title is required")
                if not data.get("current_employer"):
                    errors.append("Current employer/institution is required")
            
            if not data.get("industry"):
                errors.append("Industry is required")
            if not data.get("highest_qualification"):
                errors.append("Highest qualification is required")

        elif step == 3:
            # Check if at least one contribution option is selected
            contribution_options = [
                data.get("want_to_mentor"),
                data.get("guest_lectures"),
                data.get("review_projects"),
                data.get("contribute_content"),
                data.get("alumni_events"),
            ]
            
            if not any(contribution_options):
                errors.append("Please select at least one way you'd like to contribute")
            
            # If any contribution is selected, contribution_topics should be provided
            if any(contribution_options) and not data.get("contribution_topics"):
                errors.append("Please specify topics/areas for contribution")

        elif step == 4:
            # Only validate if mentorship is enabled
            if data.get("want_to_mentor"):
                if not data.get("available_time_slots"):
                    errors.append("Available time slots are required for mentorship")
                if not data.get("session_mode"):
                    errors.append("Session mode is required")
                if not data.get("sessions_per_month"):
                    errors.append("Expected sessions per month is required")

        return {
            "valid": len(errors) == 0,
            "errors": errors,
        }

    def _get_required_fields(self, step: int) -> List[str]:
        required = {
            1: ["full_name", "graduation_year", "college"],
            2: ["employment_status", "industry", "highest_qualification"],
            3: ["contribution_topics"],
            4: [],  # Conditional based on mentorship opt-in
        }
        return required.get(step, [])

    def _get_optional_fields(self, step: int) -> List[str]:
        optional = {
            1: ["profile_photo", "roll_number", "current_location"],
            2: ["current_job_title", "current_employer", "linkedin_url"],
            3: ["want_to_mentor", "guest_lectures", "review_projects", "contribute_content", "alumni_events"],
            4: ["available_time_slots", "session_mode", "sessions_per_month"],
        }
        return optional.get(step, [])

    async def _post_onboarding_setup(self, user_id: str, current_user: Dict[str, Any]) -> None:
        """
        Setup alumni profile after onboarding.
        - Create alumni profile record
        - Initialize contribution tracking
        - Set up mentorship if opted in
        """
        from datetime import datetime
        
        try:
            # Get step data from onboarding_progress
            progress = await self._get_progress(user_id)
            step_data = progress.get("step_data", {})
            
            # Collect alumni data from steps
            step_1_data = step_data.get("step_1", {})
            step_2_data = step_data.get("step_2", {})
            step_3_data = step_data.get("step_3", {})
            
            now = datetime.utcnow().isoformat()
            
            # Create alumni profile
            alumni_profile = {
                "user_id": user_id,
                "graduation_year": step_1_data.get("graduation_year"),
                "degree_obtained": step_1_data.get("degree_obtained", ""),
                "branch": step_1_data.get("branch", ""),
                "college": step_1_data.get("college", ""),
                "current_location": step_1_data.get("current_location", ""),
                "employment_status": step_2_data.get("employment_status", ""),
                "current_job_title": step_2_data.get("current_job_title", ""),
                "current_employer": step_2_data.get("current_employer", ""),
                "industry": step_2_data.get("industry", ""),
                "highest_qualification": step_2_data.get("highest_qualification", ""),
                "linkedin_url": step_2_data.get("linkedin_url", ""),
                "want_to_mentor": step_3_data.get("want_to_mentor", False),
                "guest_lectures": step_3_data.get("guest_lectures", False),
                "review_projects": step_3_data.get("review_projects", False),
                "contribute_content": step_3_data.get("contribute_content", False),
                "alumni_events": step_3_data.get("alumni_events", False),
                "contribution_topics": step_3_data.get("contribution_topics", []),
                "is_active": True,
                "created_at": now,
                "updated_at": now,
            }
            
            # Note: If mentorship opted in, alumni uses mentor profile system
            # Mentorship setup (if opted in) would be handled by mentor system
            
            await self.db.table("alumni_profiles").insert(alumni_profile).execute()
            self.logger.info("alumni_profile_created", user_id=user_id)
            
        except Exception as e:
            self.logger.error("alumni_profile_creation_failed", user_id=user_id, error=str(e))
            # Don't fail onboarding if profile creation fails
            pass
