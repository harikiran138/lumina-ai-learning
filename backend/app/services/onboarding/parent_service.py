"""
Parent onboarding service.

5-step parent onboarding flow:
1. Personal information
2. Child linking & enrollment
3. Relationship & communication preferences
4. Privacy & safety settings
5. Notification preferences
"""

from typing import Any, Dict, List
import structlog
from .base_service import BaseOnboardingService

logger = structlog.get_logger(__name__)


class ParentOnboardingService(BaseOnboardingService):
    """Parent-specific onboarding with child linking."""

    TOTAL_STEPS = 5
    ROLE_NAME = "parent"

    @property
    def TOTAL_STEPS(self) -> int:
        return 5

    @property
    def ROLE_NAME(self) -> str:
        return "parent"

    async def get_step_options(self, step: int) -> Dict[str, Any]:
        """Get parent onboarding options per step."""
        options = {
            1: {
                "title": "Personal Information",
                "description": "Tell us about yourself",
                "fields": ["first_name", "last_name", "contact_phone", "relationship_to_student"],
            },
            2: {
                "title": "Link Child(ren)",
                "description": "Add your child(ren) from the system",
                "fields": ["children"],
                "text": "Search for your child by email or student ID",
            },
            3: {
                "title": "Communication Preferences",
                "description": "How should we communicate with you?",
                "fields": ["preferred_language", "communication_channels"],
                "dropdowns": {
                    "preferred_language": ["English", "Hindi", "Tamil", "Bengali", "Marathi"],
                    "communication_channels": ["Email", "SMS", "In-app", "WhatsApp"],
                }
            },
            4: {
                "title": "Safety & Privacy",
                "description": "Your data is always protected",
                "fields": ["accept_privacy_policy", "accept_data_usage"],
                "text": "Review our privacy policy and confirm your preferences",
            },
            5: {
                "title": "Notifications",
                "description": "Customize notification preferences",
                "fields": ["notification_frequency", "notification_types"],
                "dropdowns": {
                    "notification_frequency": ["Real-time", "Daily digest", "Weekly digest", "Disabled"],
                }
            },
        }
        return options.get(step, {})

    async def validate_step(self, step: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate parent onboarding step data."""
        errors: List[str] = []

        if step == 1:
            if not data.get("first_name", "").strip():
                errors.append("First name is required")
            if not data.get("last_name", "").strip():
                errors.append("Last name is required")

        elif step == 2:
            if not data.get("children") or not isinstance(data["children"], list):
                errors.append("At least one child must be linked")

        elif step == 3:
            if data.get("preferred_language") not in ["English", "Hindi", "Tamil", "Bengali", "Marathi"]:
                errors.append("Valid language preference is required")

        elif step == 4:
            if not data.get("accept_privacy_policy"):
                errors.append("Privacy policy must be accepted")

        elif step == 5:
            if data.get("notification_frequency") not in ["Real-time", "Daily digest", "Weekly digest", "Disabled"]:
                errors.append("Valid notification frequency is required")

        return {
            "valid": len(errors) == 0,
            "errors": errors,
        }

    def _get_required_fields(self, step: int) -> List[str]:
        required = {
            1: ["first_name", "last_name"],
            2: ["children"],
            3: ["preferred_language"],
            4: ["accept_privacy_policy"],
            5: ["notification_frequency"],
        }
        return required.get(step, [])

    def _get_optional_fields(self, step: int) -> List[str]:
        optional = {
            1: ["contact_phone", "relationship_to_student"],
            2: [],
            3: ["communication_channels"],
            4: ["accept_data_usage"],
            5: ["notification_types"],
        }
        return optional.get(step, [])
