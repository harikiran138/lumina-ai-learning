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
        - Create admin profile record
        - Generate API key for integrations
        - Initialize admin dashboard
        - Set up audit logging
        """
        from datetime import datetime
        import secrets
        import base64
        
        try:
            # Get step data from onboarding_progress
            progress = await self._get_progress(user_id)
            step_data = progress.get("step_data", {})
            
            # Collect admin data from steps
            step_1_data = step_data.get("step_1", {})
            step_2_data = step_data.get("step_2", {})
            step_3_data = step_data.get("step_3", {})
            step_4_data = step_data.get("step_4", {})
            
            # Generate API key (format: admin_RANDOM_32_CHARS)
            api_key_secret = secrets.token_urlsafe(32)
            api_key_id = f"admin_{base64.urlsafe_b64encode(secrets.token_bytes(16)).decode().rstrip('=')[:20]}"
            
            now = datetime.utcnow().isoformat()
            
            # Create admin profile
            admin_profile = {
                "user_id": user_id,
                "admin_role": step_1_data.get("admin_role", ""),
                "institution_id": step_2_data.get("institution_id"),
                "system_region": step_2_data.get("system_region", ""),
                "department_name": step_3_data.get("department_name", ""),
                "permission_groups": step_4_data.get("permission_groups", []),
                "api_key_id": api_key_id,
                "two_factor_enabled": step_5_data.get("two_factor_enabled", True),
                "audit_logging_enabled": True,
                "is_active": True,
                "created_at": now,
                "updated_at": now,
            }
            
            # Get step_5_data for 2FA setting
            step_5_data = step_data.get("step_5", {})
            admin_profile["two_factor_enabled"] = step_5_data.get("two_factor_enabled", True)
            
            await self.db.table("admin_profiles").insert(admin_profile).execute()
            self.logger.info("admin_profile_created", user_id=user_id, api_key_id=api_key_id)
            
            # Note: API key secret should be returned to admin only once
            # Store the hashed key in a separate secure table if needed
            
        except Exception as e:
            self.logger.error("admin_setup_failed", user_id=user_id, error=str(e))
            # Don't fail onboarding if admin setup fails
            pass
