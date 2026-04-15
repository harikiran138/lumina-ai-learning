"""
Teacher onboarding service.

5-step teacher onboarding flow:
1. Personal information
2. Subject expertise & qualifications
3. Teaching experience
4. Classroom setup (institution, dept, batch)
5. Preferences (profile photo, AI settings)
"""

from typing import Any, Dict, List
import structlog
from .base_service import BaseOnboardingService

logger = structlog.get_logger(__name__)


class TeacherOnboardingService(BaseOnboardingService):
    """Teacher-specific onboarding with qualification verification."""

    TOTAL_STEPS = 5
    ROLE_NAME = "teacher"

    @property
    def TOTAL_STEPS(self) -> int:
        return 5

    @property
    def ROLE_NAME(self) -> str:
        return "teacher"

    async def get_step_options(self, step: int) -> Dict[str, Any]:
        """Get teacher onboarding options per step."""
        options = {
            1: {
                "title": "Personal Information",
                "description": "Tell us about yourself",
                "fields": ["first_name", "last_name", "contact_phone", "employment_type"],
                "dropdowns": {
                    "employment_type": ["Full-time", "Part-time", "Contract", "Freelance"],
                }
            },
            2: {
                "title": "Subject Expertise",
                "description": "What subjects do you teach?",
                "fields": ["subjects", "qualifications", "years_of_experience"],
                "subjects": [
                    "Math", "Physics", "Chemistry", "Biology",
                    "English", "History", "Geography", "Economics",
                    "Computer Science", "Psychology", "Philosophy"
                ]
            },
            3: {
                "title": "Teaching Experience",
                "description": "Share your professional background",
                "fields": ["previous_institutions", "certifications", "teaching_methodology_preference"],
                "dropdowns": {
                    "teaching_methodology_preference": ["Lecture", "Interactive", "Project-based", "Hybrid"],
                }
            },
            4: {
                "title": "Classroom Setup",
                "description": "Configure your classroom",
                "fields": ["institution_name", "department", "grade_levels", "class_sections"],
                "dropdowns": {
                    "grade_levels": ["6-8", "9-10", "11-12", "Undergraduate", "Postgraduate"],
                }
            },
            5: {
                "title": "Preferences",
                "description": "Set up your profile and AI preferences",
                "fields": ["profile_photo_url", "ai_assistant_preference", "notification_settings"],
                "dropdowns": {
                    "ai_assistant_preference": ["Full support", "Suggestions only", "Manual"],
                }
            },
        }
        return options.get(step, {})

    async def validate_step(self, step: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate teacher onboarding step data."""
        errors: List[str] = []

        if step == 1:
            if not data.get("first_name", "").strip():
                errors.append("First name is required")
            if not data.get("last_name", "").strip():
                errors.append("Last name is required")
            if data.get("employment_type") not in ["Full-time", "Part-time", "Contract", "Freelance"]:
                errors.append("Valid employment type is required")

        elif step == 2:
            if not data.get("subjects") or not isinstance(data["subjects"], list):
                errors.append("At least one subject must be selected")
            elif len(data["subjects"]) > 5:
                errors.append("Maximum 5 subjects can be selected")
            
            if data.get("years_of_experience"):
                try:
                    years = int(data["years_of_experience"])
                    if years < 0 or years > 60:
                        errors.append("Years of experience must be between 0 and 60")
                except ValueError:
                    errors.append("Years of experience must be a valid number")

        elif step == 3:
            if data.get("teaching_methodology_preference") not in ["Lecture", "Interactive", "Project-based", "Hybrid"]:
                errors.append("Valid teaching methodology preference is required")

        elif step == 4:
            if not data.get("institution_name", "").strip():
                errors.append("Institution name is required")
            if data.get("grade_levels"):
                if not isinstance(data["grade_levels"], list) or len(data["grade_levels"]) == 0:
                    errors.append("At least one grade level must be selected")

        elif step == 5:
            if data.get("ai_assistant_preference") not in ["Full support", "Suggestions only", "Manual"]:
                errors.append("Valid AI assistant preference is required")

        return {
            "valid": len(errors) == 0,
            "errors": errors,
        }

    def _get_required_fields(self, step: int) -> List[str]:
        required = {
            1: ["first_name", "last_name", "employment_type"],
            2: ["subjects"],
            3: ["teaching_methodology_preference"],
            4: ["institution_name", "grade_levels"],
            5: ["ai_assistant_preference"],
        }
        return required.get(step, [])

    def _get_optional_fields(self, step: int) -> List[str]:
        optional = {
            1: ["contact_phone"],
            2: ["qualifications", "years_of_experience"],
            3: ["previous_institutions", "certifications"],
            4: ["department", "class_sections"],
            5: ["profile_photo_url", "notification_settings"],
        }
        return optional.get(step, [])

    async def _post_onboarding_setup(self, user_id: str, current_user: Dict[str, Any]) -> None:
        """Initialize teacher-specific systems after onboarding."""
        try:
            # Initialize teacher dashboard and class setup
            self.logger.info("teacher_setup_initialized", user_id=user_id)
        except Exception as e:
            self.logger.error("teacher_setup_failed", user_id=user_id, error=str(e))
            pass
