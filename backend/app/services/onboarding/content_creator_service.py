"""
Content Creator onboarding service.

4-step content creator onboarding flow:
1. Personal information
2. Content expertise & experience
3. Sample portfolio upload
4. Approval workflow & confirmation
"""

from typing import Any, Dict, List
import structlog
from .base_service import BaseOnboardingService

logger = structlog.get_logger(__name__)


class ContentCreatorOnboardingService(BaseOnboardingService):
    """Content creator-specific onboarding with portfolio review."""

    TOTAL_STEPS = 4
    ROLE_NAME = "content_creator"

    @property
    def TOTAL_STEPS(self) -> int:
        return 4

    @property
    def ROLE_NAME(self) -> str:
        return "content_creator"

    async def get_step_options(self, step: int) -> Dict[str, Any]:
        """Get content creator onboarding options per step."""
        options = {
            1: {
                "title": "Personal Information",
                "description": "Tell us about yourself",
                "fields": ["first_name", "last_name", "contact_phone", "website_or_portfolio_link"],
            },
            2: {
                "title": "Content Expertise",
                "description": "What types of content do you create?",
                "fields": ["content_types", "subject_domains", "experience_level", "years_of_experience"],
                "content_types": ["Video", "Quiz", "Infographic", "Interactive", "Text", "Activity"],
                "experience_level": ["Beginner", "Intermediate", "Advanced", "Expert"],
            },
            3: {
                "title": "Portfolio",
                "description": "Upload samples of your work",
                "fields": ["portfolio_samples", "previous_platforms", "quality_standards"],
                "text": "Share 2-3 sample pieces of content you've created",
            },
            4: {
                "title": "Approval & Confirmation",
                "description": "Review and confirm your details",
                "fields": ["accept_quality_standards", "accept_copyright_agreement"],
                "text": "Your content will be reviewed by our quality team",
            },
        }
        return options.get(step, {})

    async def validate_step(self, step: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate content creator onboarding step data."""
        errors: List[str] = []

        if step == 1:
            if not data.get("first_name", "").strip():
                errors.append("First name is required")
            if not data.get("last_name", "").strip():
                errors.append("Last name is required")

        elif step == 2:
            if not data.get("content_types") or len(data.get("content_types", [])) == 0:
                errors.append("At least one content type must be selected")
            if not data.get("subject_domains") or len(data.get("subject_domains", [])) == 0:
                errors.append("At least one subject domain must be selected")

        elif step == 3:
            if not data.get("portfolio_samples") or len(data.get("portfolio_samples", [])) < 2:
                errors.append("At least 2 portfolio samples must be uploaded")

        elif step == 4:
            if not data.get("accept_quality_standards"):
                errors.append("Quality standards must be accepted")
            if not data.get("accept_copyright_agreement"):
                errors.append("Copyright agreement must be accepted")

        return {
            "valid": len(errors) == 0,
            "errors": errors,
        }

    def _get_required_fields(self, step: int) -> List[str]:
        required = {
            1: ["first_name", "last_name"],
            2: ["content_types", "subject_domains"],
            3: ["portfolio_samples"],
            4: ["accept_quality_standards", "accept_copyright_agreement"],
        }
        return required.get(step, [])

    async def _post_onboarding_setup(self, user_id: str, current_user: Dict[str, Any]) -> None:
        """
        Setup content creator profile after onboarding.
        - Create content creator profile record
        - Set portfolio approval pending
        - Initialize quality audit trail
        
        NOTE: verification_status set by base_service._set_verification_status()
              which creates verification_request with status='pending'
        """
        from datetime import datetime
        
        try:
            # Get step data from onboarding_progress
            progress = await self._get_progress(user_id)
            step_data = progress.get("step_data", {})
            
            # Collect creator data from steps
            step_2_data = step_data.get("step_2", {})
            step_3_data = step_data.get("step_3", {})
            
            now = datetime.utcnow().isoformat()
            
            # Create content creator profile
            creator_profile = {
                "user_id": user_id,
                "content_types": step_2_data.get("content_types", []),
                "subject_domains": step_2_data.get("subject_domains", []),
                "experience_level": step_2_data.get("experience_level", ""),
                "portfolio_samples": step_3_data.get("portfolio_samples", []),
                "approval_status": "pending",  # Will be updated when verification is approved
                "is_active": True,
                "created_at": now,
                "updated_at": now,
            }
            
            await self.db.table("content_creator_profiles").insert(creator_profile).execute()
            self.logger.info("content_creator_profile_created", user_id=user_id)
            
        except Exception as e:
            self.logger.error("content_creator_profile_creation_failed", user_id=user_id, error=str(e))
            # Don't fail onboarding if profile creation fails
            pass
