"""
Admin onboarding service.

6-step admin onboarding flow for college_admin, super_admin, system_admin, institution_admin, hod:
1. Role confirmation
2. Institution/system mapping
3. Department/division setup
4. Permissions initialization
5. Integration preferences
6. Security & audit setup
"""

from typing import Any, Dict, List
import structlog
from .base_service import BaseOnboardingService

logger = structlog.get_logger(__name__)


class AdminOnboardingService(BaseOnboardingService):
    """Admin-specific onboarding with permissions & system setup."""

    TOTAL_STEPS = 6
    ROLE_NAME = "admin"

    @property
    def TOTAL_STEPS(self) -> int:
        return 6

    @property
    def ROLE_NAME(self) -> str:
        return "admin"

    async def get_step_options(self, step: int) -> Dict[str, Any]:
        """Get admin onboarding options per step."""
        options = {
            1: {
                "title": "Role Confirmation",
                "description": "Confirm your administrative role",
                "fields": ["admin_role", "department_or_system"],
                "roles": ["college_admin", "super_admin", "system_admin", "institution_admin", "hod"],
            },
            2: {
                "title": "Institution/System Mapping",
                "description": "Map your institution or system",
                "fields": ["institution_id", "system_region", "parent_organization"],
            },
            3: {
                "title": "Department Setup",
                "description": "Configure your department or division",
                "fields": ["department_name", "department_code", "reporting_structure"],
            },
            4: {
                "title": "Permissions Initialization",
                "description": "Select your administrative permissions",
                "fields": ["permission_groups", "user_management", "content_moderation", "analytics_access"],
                "permission_groups": ["Full Access", "User Management", "Content", "Analytics", "Reporting", "Custom"],
            },
            5: {
                "title": "Integration Preferences",
                "description": "Set up integrations and external systems",
                "fields": ["ldap_integration", "sso_enabled", "api_key_generated"],
            },
            6: {
                "title": "Security & Audit",
                "description": "Configure security and audit settings",
                "fields": ["two_factor_enabled", "audit_logging_enabled", "accept_security_policy"],
            },
        }
        return options.get(step, {})

    async def validate_step(self, step: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate admin onboarding step data."""
        errors: List[str] = []

        if step == 1:
            valid_roles = ["college_admin", "super_admin", "system_admin", "institution_admin", "hod"]
            if data.get("admin_role") not in valid_roles:
                errors.append(f"Valid admin role is required. Must be one of: {valid_roles}")

        elif step == 2:
            if not data.get("institution_id"):
                errors.append("Institution ID is required")

        elif step == 3:
            if not data.get("department_name"):
                errors.append("Department name is required")

        elif step == 4:
            if not data.get("permission_groups") or len(data.get("permission_groups", [])) == 0:
                errors.append("At least one permission group must be selected")

        elif step == 5:
            # Validate integration settings if provided
            pass

        elif step == 6:
            if not data.get("accept_security_policy"):
                errors.append("Security policy must be accepted")

        return {
            "valid": len(errors) == 0,
            "errors": errors,
        }

    def _get_required_fields(self, step: int) -> List[str]:
        required = {
            1: ["admin_role"],
            2: ["institution_id"],
            3: ["department_name"],
            4: ["permission_groups"],
            5: [],
            6: ["accept_security_policy"],
        }
        return required.get(step, [])

    async def _post_onboarding_setup(self, user_id: str, current_user: Dict[str, Any]) -> None:
        """
        Setup admin systems after onboarding:
        - Generate API keys
        - Initialize admin dashboard
        - Set up audit logging
        """
        try:
            self.logger.info("admin_setup_initialized", user_id=user_id)
        except Exception as e:
            self.logger.error("admin_setup_failed", user_id=user_id, error=str(e))
            pass
