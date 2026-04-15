"""
Mentor onboarding service.

5-step mentor onboarding flow:
1. Professional background
2. Expertise domain & credentials
3. Availability & mentorship rates
4. Matching preferences
5. Portfolio upload & confirmation
"""

from typing import Any, Dict, List
import structlog
from .base_service import BaseOnboardingService

logger = structlog.get_logger(__name__)


class MentorOnboardingService(BaseOnboardingService):
    """Mentor-specific onboarding with expertise and portfolio setup."""

    TOTAL_STEPS = 5
    ROLE_NAME = "mentor"

    @property
    def TOTAL_STEPS(self) -> int:
        return 5

    @property
    def ROLE_NAME(self) -> str:
        return "mentor"

    async def get_step_options(self, step: int) -> Dict[str, Any]:
        """Get mentor onboarding options per step."""
        options = {
            1: {
                "title": "Professional Background",
                "description": "Tell us about your professional experience",
                "fields": ["first_name", "last_name", "current_title", "company_name", "years_of_experience"],
            },
            2: {
                "title": "Expertise Domain",
                "description": "What areas can you mentor in?",
                "fields": ["expertise_areas", "certifications", "specializations"],
                "expertise_areas": [
                    "Career Guidance", "Technical Skills", "Leadership", "Entrepreneurship",
                    "Personal Development", "Academic", "Skill Building", "Other"
                ]
            },
            3: {
                "title": "Availability & Rates",
                "description": "When are you available and what are your rates?",
                "fields": ["availability_hours_per_month", "rate_per_session", "currency", "session_duration_minutes"],
            },
            4: {
                "title": "Matching Preferences",
                "description": "Who do you want to mentor?",
                "fields": ["mentee_background", "mentee_goals", "max_mentees"],
            },
            5: {
                "title": "Portfolio & Confirmation",
                "description": "Upload your portfolio and confirm details",
                "fields": ["portfolio_url", "achievements", "accept_terms"],
            },
        }
        return options.get(step, {})

    async def validate_step(self, step: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate mentor onboarding step data."""
        errors: List[str] = []

        if step == 1:
            if not data.get("first_name", "").strip():
                errors.append("First name is required")
            if not data.get("current_title", "").strip():
                errors.append("Current title is required")

        elif step == 2:
            if not data.get("expertise_areas") or len(data.get("expertise_areas", [])) == 0:
                errors.append("At least one expertise area must be selected")

        elif step == 3:
            if not data.get("availability_hours_per_month"):
                errors.append("Availability hours is required")
            if data.get("rate_per_session"):
                try:
                    rate = float(data["rate_per_session"])
                    if rate <= 0:
                        errors.append("Rate must be greater than 0")
                except ValueError:
                    errors.append("Rate must be a valid number")

        elif step == 4:
            if not data.get("mentee_goals"):
                errors.append("Mentee goals must be specified")

        elif step == 5:
            if not data.get("accept_terms"):
                errors.append("You must accept the mentoring terms")

        return {
            "valid": len(errors) == 0,
            "errors": errors,
        }

    def _get_required_fields(self, step: int) -> List[str]:
        required = {
            1: ["first_name", "last_name", "current_title"],
            2: ["expertise_areas"],
            3: ["availability_hours_per_month"],
            4: ["mentee_goals"],
            5: ["accept_terms"],
        }
        return required.get(step, [])
