"""
Peer Tutor onboarding service.

4-step peer tutor onboarding flow:
1. Personal information
2. Subject expertise (must have > 0.80 mastery)
3. Availability schedule
4. Tutoring preferences & rates
Auto-verification after first successful session
"""

from typing import Any, Dict, List
from datetime import datetime
import structlog
from .base_service import BaseOnboardingService

logger = structlog.get_logger(__name__)


class PeerTutorOnboardingService(BaseOnboardingService):
    """Peer tutor-specific onboarding with expertise & availability setup."""

    TOTAL_STEPS = 4
    ROLE_NAME = "peer_tutor"

    @property
    def TOTAL_STEPS(self) -> int:
        return 4

    @property
    def ROLE_NAME(self) -> str:
        return "peer_tutor"

    async def get_step_options(self, step: int) -> Dict[str, Any]:
        """Get peer tutor onboarding options per step."""
        options = {
            1: {
                "title": "Personal Information",
                "description": "Tell us about yourself",
                "fields": ["first_name", "last_name", "contact_phone", "bio"],
            },
            2: {
                "title": "Subject Expertise",
                "description": "Subjects you can tutor (must have >80% mastery)",
                "fields": ["tutor_subjects", "expertise_levels", "certifications"],
                "text": "You must have 80%+ mastery in selected subjects",
                "subjects": [
                    "Math", "Physics", "Chemistry", "Biology",
                    "English", "History", "Geography", "Economics",
                    "Computer Science", "Psychology", "Philosophy"
                ],
                "expertise_levels": ["Beginner", "Intermediate", "Advanced", "Expert"],
            },
            3: {
                "title": "Availability Schedule",
                "description": "When are you available to tutor?",
                "fields": ["availability", "timezone"],
                "text": "Set your preferred tutoring hours",
                "dropdowns": {
                    "timezone": ["IST", "EST", "PST", "GMT", "UTC"],
                }
            },
            4: {
                "title": "Tutoring Preferences & Rates",
                "description": "Set your rates and tutoring style",
                "fields": ["rate_per_hour", "currency", "tutoring_style", "max_students_per_week"],
                "dropdowns": {
                    "currency": ["INR", "USD", "EUR", "GBP"],
                    "tutoring_style": ["One-on-one", "Small groups", "Flexible"],
                }
            },
        }
        return options.get(step, {})

    async def validate_step(self, step: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate peer tutor onboarding step data."""
        errors: List[str] = []

        if step == 1:
            if not data.get("first_name", "").strip():
                errors.append("First name is required")
            if not data.get("last_name", "").strip():
                errors.append("Last name is required")

        elif step == 2:
            # HARD GATE: Verify subject expertise with database lookup
            if not data.get("tutor_subjects") or not isinstance(data["tutor_subjects"], list):
                errors.append("At least one subject must be selected")
            elif len(data["tutor_subjects"]) > 6:
                errors.append("Maximum 6 subjects can be selected")
            else:
                # Check mastery scores against actual database values (HARD GATE)
                try:
                    # Get user's actual mastery scores from database
                    result = await self.db.from_("user_data").select(
                        "metadata"
                    ).eq("user_id", data.get("_user_id", "")).single().execute()
                    
                    actual_mastery = result.data.get("metadata", {}).get("subject_mastery", {}) if result else {}
                    
                    # Verify each subject has >= 80% mastery
                    for subject in data.get("tutor_subjects", []):
                        db_mastery = float(actual_mastery.get(subject, 0.0))
                        
                        if db_mastery < 0.80:
                            errors.append(
                                f"Your mastery in {subject} is {db_mastery*100:.1f}%. "
                                f"You need at least 80% mastery to tutor this subject. Keep practicing!"
                            )
                except Exception as e:
                    logger.warning("mastery_lookup_failed", subject=None, error=str(e))
                    errors.append(
                        "Could not verify your mastery. Please run a diagnostic test first."
                    )

        elif step == 3:
            if not data.get("availability"):
                errors.append("At least one availability slot must be set")
            if data.get("timezone") not in ["IST", "EST", "PST", "GMT", "UTC"]:
                errors.append("Valid timezone is required")

        elif step == 4:
            if not data.get("rate_per_hour"):
                errors.append("Hourly rate is required")
            else:
                try:
                    rate = float(data["rate_per_hour"])
                    if rate <= 0 or rate > 10000:
                        errors.append("Rate must be between 1 and 10000")
                except (ValueError, TypeError):
                    errors.append("Rate must be a valid number")
            
            if data.get("currency") not in ["INR", "USD", "EUR", "GBP"]:
                errors.append("Valid currency is required")
            
            if data.get("tutoring_style") not in ["One-on-one", "Small groups", "Flexible"]:
                errors.append("Valid tutoring style is required")

        return {
            "valid": len(errors) == 0,
            "errors": errors,
        }

    def _get_required_fields(self, step: int) -> List[str]:
        required = {
            1: ["first_name", "last_name"],
            2: ["tutor_subjects", "expertise_levels"],
            3: ["availability", "timezone"],
            4: ["rate_per_hour", "currency", "tutoring_style"],
        }
        return required.get(step, [])

    def _get_optional_fields(self, step: int) -> List[str]:
        optional = {
            1: ["contact_phone", "bio"],
            2: ["certifications"],
            3: [],
            4: ["max_students_per_week"],
        }
        return optional.get(step, [])

    async def _post_onboarding_setup(self, user_id: str, current_user: Dict[str, Any]) -> None:
        """
        Setup peer tutor profile after onboarding.
        - Create peer tutor profile record
        - Initialize matching engine
        - Set verification pending
        """
        try:
            # Create peer tutor profile
            now = datetime.utcnow().isoformat()
            peer_tutor_data = {
                "user_id": user_id,
                "verification_status": "pending",
                "verified_at": None,
                "is_active": True,
                "created_at": now,
            }
            await self.db.table("peer_tutor_profiles").insert(peer_tutor_data).execute()
            self.logger.info("peer_tutor_profile_created", user_id=user_id)
        except Exception as e:
            self.logger.error("peer_tutor_profile_creation_failed", user_id=user_id, error=str(e))
            pass
