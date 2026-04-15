"""
HOD (Head of Department) onboarding service.

3-step HOD onboarding flow:
1. HOD identity verification
2. Department configuration
3. Approval and notification settings
"""

from typing import Any, Dict, List
from datetime import datetime
import structlog
from .base_service import BaseOnboardingService

logger = structlog.get_logger(__name__)


class HODOnboardingService(BaseOnboardingService):
    """HOD-specific onboarding for department-level configuration and approval flows."""

    TOTAL_STEPS = 3
    ROLE_NAME = "hod"

    @property
    def TOTAL_STEPS(self) -> int:
        return 3

    @property
    def ROLE_NAME(self) -> str:
        return "hod"

    async def get_step_options(self, step: int) -> Dict[str, Any]:
        """Get HOD onboarding options per step."""
        options = {
            1: {
                "title": "HOD Identity Verification",
                "description": "Verify your identity and department assignment",
                "fields": ["full_name", "profile_photo", "employee_id", "mobile", "department", "institution", "designation", "years_in_hod_role"],
                "text": "Your department and institution have been pre-assigned by the admin.",
                "dropdowns": {
                    "years_in_hod_role": ["New to HOD role", "1-2 years", "3-5 years", "5-10 years", "10+ years"],
                }
            },
            2: {
                "title": "Department Configuration",
                "description": "Configure your department settings",
                "fields": ["subjects", "faculty", "batches_sections", "current_semester", "exam_schedule"],
                "text": "Define the subjects, faculty, and batches under your department.",
            },
            3: {
                "title": "Approval Settings",
                "description": "Set up approval workflows and notifications",
                "fields": ["auto_approve_content", "require_hod_curriculum_approval", "notification_preferences"],
                "checkboxes": [
                    "Auto-approve teacher content",
                    "Require HOD sign-off for curriculum changes",
                    "Notify me for new teacher joins",
                    "Notify me for student complaints",
                    "Notify me for flagged content",
                    "Notify me for exam results",
                ]
            },
        }
        return options.get(step, {})

    async def validate_step(self, step: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate HOD onboarding step data."""
        errors: List[str] = []

        if step == 1:
            if not data.get("full_name", "").strip():
                errors.append("Full name is required")
            if not data.get("employee_id", "").strip():
                errors.append("Employee ID is required")
            else:
                # Validate format: HOD###
                if not data["employee_id"].upper().startswith("HOD"):
                    errors.append("Employee ID must start with 'HOD'")
            
            if not data.get("mobile", "").strip():
                errors.append("Mobile number is required")
            
            if not data.get("department"):
                errors.append("Department is required")
            
            if not data.get("institution"):
                errors.append("Institution is required")
            
            if not data.get("designation", "").strip():
                errors.append("Designation is required")

        elif step == 2:
            if not data.get("subjects") or len(data.get("subjects", [])) == 0:
                errors.append("At least one subject must be configured under your department")
            
            if not data.get("faculty") or len(data.get("faculty", [])) == 0:
                errors.append("At least one faculty member must be assigned")
            
            if not data.get("batches_sections") or len(data.get("batches_sections", [])) == 0:
                errors.append("At least one batch/section must be configured")
            
            if not data.get("current_semester"):
                errors.append("Current semester is required")

        elif step == 3:
            # At least one notification preference should be selected
            notification_prefs = data.get("notification_preferences", [])
            if len(notification_prefs) == 0:
                errors.append("Please select at least one notification preference")

        return {
            "valid": len(errors) == 0,
            "errors": errors,
        }

    def _get_required_fields(self, step: int) -> List[str]:
        required = {
            1: ["full_name", "employee_id", "mobile", "department", "institution", "designation"],
            2: ["subjects", "faculty", "batches_sections", "current_semester"],
            3: ["notification_preferences"],
        }
        return required.get(step, [])

    def _get_optional_fields(self, step: int) -> List[str]:
        optional = {
            1: ["profile_photo", "years_in_hod_role"],
            2: ["exam_schedule"],
            3: ["auto_approve_content", "require_hod_curriculum_approval"],
        }
        return optional.get(step, [])

    async def _post_onboarding_setup(self, user_id: str, current_user: Dict[str, Any]) -> None:
        """
        Setup HOD profile after onboarding.
        - Create HOD profile record
        - Initialize department configuration
        - Set up approval workflow
        - Create approval notification system
        """
        from datetime import datetime
        
        try:
            # Get step data from onboarding_progress
            progress = await self._get_progress(user_id)
            step_data = progress.get("step_data", {})
            
            # Collect HOD data from steps
            step_1_data = step_data.get("step_1", {})
            step_2_data = step_data.get("step_2", {})
            step_3_data = step_data.get("step_3", {})
            
            now = datetime.utcnow().isoformat()
            
            # Create HOD profile
            hod_profile = {
                "user_id": user_id,
                "employee_id": step_1_data.get("employee_id", ""),
                "department": step_1_data.get("department", ""),
                "institution": step_1_data.get("institution", ""),
                "designation": step_1_data.get("designation", ""),
                "years_in_hod_role": step_1_data.get("years_in_hod_role", ""),
                "subjects": step_2_data.get("subjects", []),
                "faculty": step_2_data.get("faculty", []),
                "batches_sections": step_2_data.get("batches_sections", []),
                "current_semester": step_2_data.get("current_semester", ""),
                "auto_approve_content": step_3_data.get("auto_approve_content", False),
                "require_hod_curriculum_approval": step_3_data.get("require_hod_curriculum_approval", False),
                "notification_preferences": step_3_data.get("notification_preferences", []),
                "is_active": True,
                "created_at": now,
                "updated_at": now,
            }
            
            await self.db.table("hod_profiles").insert(hod_profile).execute()
            self.logger.info("hod_profile_created", user_id=user_id, department=step_1_data.get("department"))
            
        except Exception as e:
            self.logger.error("hod_profile_creation_failed", user_id=user_id, error=str(e))
            # Don't fail onboarding if profile creation fails
            pass
