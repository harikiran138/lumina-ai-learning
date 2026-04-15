"""
Researcher onboarding service.

4-step researcher onboarding flow:
1. Personal information
2. Institution affiliation & research purpose
3. IRB approval & data access agreement
4. Confirmation & access setup
"""

from typing import Any, Dict, List
import structlog
from .base_service import BaseOnboardingService

logger = structlog.get_logger(__name__)


class ResearcherOnboardingService(BaseOnboardingService):
    """Researcher-specific onboarding with IRB & ethics compliance."""

    TOTAL_STEPS = 4
    ROLE_NAME = "researcher"

    @property
    def TOTAL_STEPS(self) -> int:
        return 4

    @property
    def ROLE_NAME(self) -> str:
        return "researcher"

    async def get_step_options(self, step: int) -> Dict[str, Any]:
        """Get researcher onboarding options per step."""
        options = {
            1: {
                "title": "Personal Information",
                "description": "Tell us about yourself",
                "fields": ["first_name", "last_name", "email", "contact_phone"],
            },
            2: {
                "title": "Institution & Research",
                "description": "Details about your research",
                "fields": ["institution_name", "research_department", "research_purpose", "publication_links"],
            },
            3: {
                "title": "Ethics & Compliance",
                "description": "IRB approval and data access",
                "fields": ["irb_approval_document", "data_access_agreement_signed"],
                "text": "⚠️ CRITICAL: IRB approval required for all research involving students",
            },
            4: {
                "title": "Confirmation",
                "description": "Review and confirm access parameters",
                "fields": ["data_categories_needed", "accept_ethics_guidelines", "accept_data_privacy"],
            },
        }
        return options.get(step, {})

    async def validate_step(self, step: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate researcher onboarding step data."""
        errors: List[str] = []

        if step == 1:
            if not data.get("first_name", "").strip():
                errors.append("First name is required")
            if not data.get("email", "").strip():
                errors.append("Email is required")

        elif step == 2:
            if not data.get("institution_name"):
                errors.append("Institution name is required")
            if not data.get("research_purpose"):
                errors.append("Research purpose must be clearly described")

        elif step == 3:
            if not data.get("irb_approval_document"):
                errors.append("IRB approval document is REQUIRED")
            if not data.get("data_access_agreement_signed"):
                errors.append("Data access agreement must be signed")

        elif step == 4:
            if not data.get("accept_ethics_guidelines"):
                errors.append("Ethics guidelines must be accepted")
            if not data.get("accept_data_privacy"):
                errors.append("Data privacy agreement must be accepted")

        return {
            "valid": len(errors) == 0,
            "errors": errors,
        }

    def _get_required_fields(self, step: int) -> List[str]:
        required = {
            1: ["first_name", "last_name", "email"],
            2: ["institution_name", "research_purpose"],
            3: ["irb_approval_document", "data_access_agreement_signed"],
            4: ["accept_ethics_guidelines", "accept_data_privacy"],
        }
        return required.get(step, [])
