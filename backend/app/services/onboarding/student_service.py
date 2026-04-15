"""
Student onboarding service.

7-step student onboarding flow:
1. Personal information
2. Educational background
3. Learning style detection
4. Profile picture upload
5. Learning goals
6. Subject selection
7. Adaptive diagnostic quiz + completion
"""

from typing import Any, Dict, List, Optional
import structlog
from datetime import datetime
from .base_service import BaseOnboardingService
from app.services.personalization_service import PersonalizationService

logger = structlog.get_logger(__name__)


class StudentOnboardingService(BaseOnboardingService):
    """Student-specific onboarding with learning style detection and adaptive setup."""

    TOTAL_STEPS = 7
    ROLE_NAME = "student"

    @property
    def TOTAL_STEPS(self) -> int:
        return 7

    @property
    def ROLE_NAME(self) -> str:
        return "student"

    async def get_step_options(self, step: int) -> Dict[str, Any]:
        """Get student learning options per step."""
        options = {
            1: {
                "title": "Personal Information",
                "description": "Tell us about yourself",
                "fields": ["first_name", "last_name", "date_of_birth", "contact_phone"],
            },
            2: {
                "title": "Educational Background",
                "description": "Share your education history",
                "fields": ["current_level", "school_name", "board_name", "gpa"],
                "dropdowns": {
                    "current_level": ["6", "7", "8", "9", "10", "11", "12", "undergraduate", "postgraduate"],
                    "board_name": ["CBSE", "ICSE", "State", "International", "Other"],
                }
            },
            3: {
                "title": "Learning Style",
                "description": "How do you learn best?",
                "text": "Your learning style helps us personalize content and recommendations.",
                "styles": [
                    {"id": "visual", "name": "Visual", "description": "Learn through images, diagrams, videos"},
                    {"id": "auditory", "name": "Auditory", "description": "Learn through listening and discussion"},
                    {"id": "kinesthetic", "name": "Kinesthetic", "description": "Learn by doing and hands-on practice"},
                    {"id": "reading_writing", "name": "Reading/Writing", "description": "Learn through text and note-taking"},
                ]
            },
            4: {
                "title": "Profile Picture",
                "description": "Upload a profile picture (optional but recommended)",
                "fields": ["profile_photo_url"],
                "file_formats": ["jpg", "jpeg", "png"],
                "max_size_mb": 5,
            },
            5: {
                "title": "Learning Goals",
                "description": "What do you want to achieve?",
                "fields": ["primary_goal", "learning_duration_hours_per_week"],
                "dropdowns": {
                    "primary_goal": [
                        "Improve grades",
                        "Prepare for exams",
                        "Build specific skills",
                        "Explore interests",
                        "Get ahead in studies",
                    ]
                }
            },
            6: {
                "title": "Subject Selection",
                "description": "Choose subjects you want to focus on",
                "fields": ["selected_subjects"],
                "subjects": [
                    "Math", "Physics", "Chemistry", "Biology",
                    "English", "History", "Geography", "Economics",
                    "Computer Science", "Psychology", "Philosophy"
                ]
            },
            7: {
                "title": "Diagnostic Quiz",
                "description": "Take a quick 10-minute assessment",
                "text": "This helps us understand your current level and personalize recommendations",
                "quiz_duration_minutes": 10,
                "question_count": 15,
            },
        }
        return options.get(step, {})

    async def validate_step(self, step: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate student onboarding step data."""
        errors: List[str] = []

        if step == 1:
            # Personal info validation
            if not data.get("first_name", "").strip():
                errors.append("First name is required")
            if not data.get("last_name", "").strip():
                errors.append("Last name is required")
            if data.get("date_of_birth"):
                try:
                    dob = datetime.fromisoformat(data["date_of_birth"])
                    age = (datetime.now() - dob).days // 365
                    if age < 5 or age > 100:
                        errors.append("Please enter a valid date of birth")
                except Exception:
                    errors.append("Invalid date of birth format")

        elif step == 2:
            # Education validation
            if not data.get("current_level"):
                errors.append("Current education level is required")
            if data.get("gpa"):
                try:
                    gpa = float(data["gpa"])
                    if gpa < 0 or gpa > 4.0:
                        errors.append("GPA must be between 0 and 4.0")
                except ValueError:
                    errors.append("GPA must be a valid number")

        elif step == 3:
            # Learning style validation
            valid_styles = ["visual", "auditory", "kinesthetic", "reading_writing"]
            if data.get("learning_style") not in valid_styles:
                errors.append(f"Invalid learning style. Must be one of: {valid_styles}")

        elif step == 4:
            # Profile picture validation (optional)
            if data.get("profile_photo_url"):
                if not data["profile_photo_url"].startswith(("http://", "https://", "data:")):
                    errors.append("Invalid image URL")

        elif step == 5:
            # Learning goals validation
            valid_goals = [
                "Improve grades", "Prepare for exams", "Build specific skills",
                "Explore interests", "Get ahead in studies"
            ]
            if data.get("primary_goal") not in valid_goals:
                errors.append(f"Invalid goal. Must be one of: {valid_goals}")
            
            if data.get("learning_duration_hours_per_week"):
                try:
                    hours = float(data["learning_duration_hours_per_week"])
                    if hours <= 0 or hours > 168:
                        errors.append("Learning hours must be between 0 and 168")
                except ValueError:
                    errors.append("Learning hours must be a valid number")

        elif step == 6:
            # Subject selection validation
            if not data.get("selected_subjects") or not isinstance(data["selected_subjects"], list):
                errors.append("At least one subject must be selected")
            elif len(data["selected_subjects"]) > 8:
                errors.append("Maximum 8 subjects can be selected")

        elif step == 7:
            # Diagnostic quiz validation
            if not data.get("quiz_completed"):
                errors.append("Diagnostic quiz must be completed")
            if data.get("quiz_score") is None:
                errors.append("Quiz score is required")
            else:
                try:
                    score = float(data["quiz_score"])
                    if score < 0 or score > 100:
                        errors.append("Quiz score must be between 0 and 100")
                except ValueError:
                    errors.append("Quiz score must be a valid number")

        return {
            "valid": len(errors) == 0,
            "errors": errors,
        }

    def _get_required_fields(self, step: int) -> List[str]:
        """Get required fields per step."""
        required = {
            1: ["first_name", "last_name"],
            2: ["current_level"],
            3: ["learning_style"],
            4: [],  # Optional
            5: ["primary_goal"],
            6: ["selected_subjects"],
            7: ["quiz_completed", "quiz_score"],
        }
        return required.get(step, [])

    def _get_optional_fields(self, step: int) -> List[str]:
        """Get optional fields per step."""
        optional = {
            1: ["date_of_birth", "contact_phone"],
            2: ["school_name", "board_name", "gpa"],
            3: [],
            4: ["profile_photo_url"],
            5: ["learning_duration_hours_per_week"],
            6: [],
            7: ["notes"],
        }
        return optional.get(step, [])

    async def _post_onboarding_setup(self, user_id: str, current_user: Dict[str, Any]) -> None:
        """
        Initialize student-specific systems after onboarding:
        - Create learner profile
        - Initialize adaptive engine
        - Set up personalization
        """
        try:
            # Initialize learner profile with default values
            personalization_service = PersonalizationService(db=self.db)
            await personalization_service.initialize_student_profile(user_id)
            
            self.logger.info("student_profile_initialized", user_id=user_id)
        except Exception as e:
            self.logger.error("student_profile_init_failed", user_id=user_id, error=str(e))
            # Don't fail onboarding if personalization setup fails
            pass
