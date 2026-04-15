"""
Counselor onboarding service.

5-step counselor onboarding flow:
1. Personal information
2. Certifications & specialization
3. Assigned institution/department
4. Availability schedule
5. Privacy & confidentiality agreement
"""

from typing import Any, Dict, List
import structlog
from .base_service import BaseOnboardingService

logger = structlog.get_logger(__name__)


class CounselorOnboardingService(BaseOnboardingService):
    """Counselor-specific onboarding with certification verification."""

    TOTAL_STEPS = 5
    ROLE_NAME = "counselor"

    @property
    def TOTAL_STEPS(self) -> int:
        return 5

    @property
    def ROLE_NAME(self) -> str:
        return "counselor"

    async def get_step_options(self, step: int) -> Dict[str, Any]:
        """Get counselor onboarding options per step."""
        options = {
            1: {
                "title": "Personal Information",
                "description": "Tell us about yourself",
                "fields": ["first_name", "last_name", "contact_phone", "license_number"],
            },
            2: {
                "title": "Certifications",
                "description": "Upload certification and choose specialization",
                "fields": ["certification_document", "specialization", "years_of_experience"],
                "specializations": ["Academic Counseling", "Career Counseling", "Mental Health", "Personal Development"],
            },
            3: {
                "title": "Institution Assignment",
                "description": "Which institution will you be counseling for?",
                "fields": ["assigned_institution", "assigned_department", "student_groups"],
            },
            4: {
                "title": "Availability",
                "description": "Set your counseling hours",
                "fields": ["available_hours", "session_duration_minutes"],
            },
            5: {
                "title": "Privacy & Confidentiality",
                "description": "Confirm your commitment to confidentiality",
                "fields": ["accept_confidentiality_agreement", "legal_name_verification"],
            },
        }
        return options.get(step, {})

    async def validate_step(self, step: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate counselor onboarding step data."""
        errors: List[str] = []

        if step == 1:
            if not data.get("first_name", "").strip():
                errors.append("First name is required")
            if not data.get("license_number"):
                errors.append("License number is required")

        elif step == 2:
            if not data.get("certification_document"):
                errors.append("Certification document must be uploaded")
            if data.get("specialization") not in ["Academic Counseling", "Career Counseling", "Mental Health", "Personal Development"]:
                errors.append("Valid specialization is required")

        elif step == 3:
            if not data.get("assigned_institution"):
                errors.append("Institution assignment is required")

        elif step == 4:
            if not data.get("available_hours"):
                errors.append("Availability hours must be set")

        elif step == 5:
            if not data.get("accept_confidentiality_agreement"):
                errors.append("Confidentiality agreement must be accepted")

        return {
            "valid": len(errors) == 0,
            "errors": errors,
        }

    def _get_required_fields(self, step: int) -> List[str]:
        required = {
            1: ["first_name", "last_name", "license_number"],
            2: ["certification_document", "specialization"],
            3: ["assigned_institution"],
            4: ["available_hours"],
            5: ["accept_confidentiality_agreement"],
        }
        return required.get(step, [])
