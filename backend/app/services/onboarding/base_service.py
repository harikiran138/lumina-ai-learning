"""
Base onboarding service providing common interface for all role-specific onboarding flows.

CRITICAL: This service connects onboarding to system initialization:
1. Role assignment (RBAC)
2. Permission sync
3. System profile initialization
4. Analytics tracking
5. Verification pipelines
"""

from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
import structlog
from app.database.supabase_manager import supabase_db

logger = structlog.get_logger(__name__)

# ═══════════════════════════════════════════════════════════════════════════
# STANDARD RESPONSE SCHEMA (FOR ALL ENDPOINTS)
# ═══════════════════════════════════════════════════════════════════════════

class StandardOnboardingResponse:
    """Standard response format for all onboarding operations."""
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "success": data.get("success", False),
            "role": data.get("role", ""),
            "step": data.get("step"),
            "current_step": data.get("current_step"),
            "completed_steps": data.get("completed_steps", []),
            "next_step": data.get("next_step"),
            "progress_percent": data.get("progress_percent", 0.0),
            "required_fields": data.get("required_fields", []),
            "status": data.get("status", "error"),
            "message": data.get("message"),
            "errors": data.get("errors", []),
            "timestamp": datetime.utcnow().isoformat(),
        }


class BaseOnboardingService(ABC):
    """
    Abstract base class for role-specific onboarding services.
    
    Each role (student, teacher, mentor, etc.) extends this class and implements:
    - get_step_options(): What options/choices for each step
    - validate_step(): Strict validation per role
    - save_step(): Persist step data
    - complete(): Finalize onboarding
    """

    def __init__(self, db: Any = None, role: str = "guest"):
        self.db = db or supabase_db
        self.role = role.lower()
        self.logger = logger.bind(role=self.role)

    @property
    @abstractmethod
    def TOTAL_STEPS(self) -> int:
        """Total number of steps for this role's onboarding."""
        pass

    @property
    @abstractmethod
    def ROLE_NAME(self) -> str:
        """Canonical role name."""
        pass

    async def get_options(self, current_step: int) -> Dict[str, Any]:
        """
        Get available options for a specific onboarding step.
        
        Returns role-specific choices, requirements, and guidance.
        """
        step_options = await self.get_step_options(current_step)
        return {
            "role": self.role,
            "step": current_step,
            "total_steps": self.TOTAL_STEPS,
            "progress_percent": round((current_step / self.TOTAL_STEPS) * 100, 1),
            "options": step_options,
            "required_fields": self._get_required_fields(current_step),
            "optional_fields": self._get_optional_fields(current_step),
        }

    async def save_step(
        self, 
        user_id: str, 
        step: int, 
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Validate and save a step's data.
        
        CRITICAL FIXES:
        1. Enforce step order (can't skip steps)
        2. Validate step data (role + step specific)
        3. Persist to database
        4. Track analytics event
        5. Update progress
        
        Returns: {success, step, next_step, validation_errors}
        """
        if step < 1 or step > self.TOTAL_STEPS:
            return {
                "success": False,
                "status": "error",
                "error": f"Invalid step {step}. Valid range: 1-{self.TOTAL_STEPS}",
            }

        try:
            # Get current progress
            progress = await self._get_progress(user_id)
            current_step = progress.get("current_step", 1)
            
            # ENFORCE STEP ORDER: Can only submit current or next step
            if step != current_step and step != current_step + 1:
                self.logger.warning(
                    "invalid_step_order",
                    user_id=user_id,
                    current_step=current_step,
                    requested_step=step
                )
                return {
                    "success": False,
                    "status": "error",
                    "error": f"Invalid step order. Current: {current_step}, Requested: {step}",
                    "current_step": current_step,
                }
        except Exception as e:
            self.logger.error("progress_check_failed", user_id=user_id, error=str(e))
            return {"success": False, "status": "error", "error": "Failed to check progress"}

        # Role-specific validation
        validation_result = await self.validate_step(step, data)
        if not validation_result["valid"]:
            # Track validation failure
            await self._track_event("onboarding_validation_failed", {
                "user_id": user_id,
                "role": self.role,
                "step": step,
                "errors": validation_result.get("errors", []),
            })
            return {
                "success": False,
                "status": "error",
                "errors": validation_result["errors"],
                "step": step,
            }

        # Persist step data
        try:
            await self._persist_step_data(user_id, step, data)
            self.logger.info("step_saved", user_id=user_id, step=step)
        except Exception as e:
            self.logger.error("step_save_failed", user_id=user_id, step=step, error=str(e))
            return {
                "success": False,
                "status": "error",
                "error": "Failed to save step data",
            }

        # TRACK ANALYTICS EVENT
        try:
            await self._track_event("onboarding_step_submitted", {
                "user_id": user_id,
                "role": self.role,
                "step": step,
            })
        except Exception as e:
            # Don't fail if analytics fails
            self.logger.warning("analytics_tracking_failed", error=str(e))

        next_step = min(step + 1, self.TOTAL_STEPS)
        return {
            "success": True,
            "status": "in_progress",
            "step": step,
            "next_step": next_step,
            "progress_percent": round((step / self.TOTAL_STEPS) * 100, 1),
        }

    async def get_status(self, user_id: str) -> Dict[str, Any]:
        """Get current onboarding status for a user."""
        try:
            progress = await self._get_progress(user_id)
            return {
                "role": self.role,
                "current_step": progress.get("current_step", 1),
                "total_steps": self.TOTAL_STEPS,
                "completed_steps": progress.get("completed_steps", []),
                "status": progress.get("status", "in_progress"),
                "progress_percent": round(
                    (len(progress.get("completed_steps", [])) / self.TOTAL_STEPS) * 100, 1
                ),
            }
        except Exception as e:
            self.logger.error("get_status_failed", user_id=user_id, error=str(e))
            return {
                "role": self.role,
                "current_step": 1,
                "total_steps": self.TOTAL_STEPS,
                "status": "error",
            }

    async def complete(self, user_id: str, current_user: Dict[str, Any]) -> Dict[str, Any]:
        """
        Complete onboarding for this role.
        
        CRITICAL FIX: Now connects to systems:
        1. Verify all steps completed
        2. Mark as completed in DB
        3. Trigger role assignment (RBAC)
        4. Trigger permission sync
        5. Trigger system initialization
        6. Track completion event
        
        Returns: {success, role, onboarded, message}
        """
        try:
            # Get progress
            progress = await self._get_progress(user_id)
            
            # Verify all steps completed
            if len(progress.get("completed_steps", [])) < self.TOTAL_STEPS:
                incomplete_steps = [
                    i for i in range(1, self.TOTAL_STEPS + 1)
                    if i not in progress.get("completed_steps", [])
                ]
                self.logger.warning(
                    "incomplete_onboarding_completion_attempt",
                    user_id=user_id,
                    missing_steps=incomplete_steps
                )
                return {
                    "success": False,
                    "error": f"Cannot complete. Missing steps: {incomplete_steps}",
                    "status": "error",
                }
            
            # Mark as completed in DB
            await self._mark_completed(user_id)
            
            # CRITICAL: NOW TRIGGER ALL SYSTEM INITIALIZATION
            await self._trigger_post_onboarding(user_id, current_user)
            
            # Track completion event
            await self._track_event("onboarding_completed", {
                "user_id": user_id,
                "role": self.role,
            })
            
            self.logger.info("onboarding_completed_with_systems", user_id=user_id, role=self.role)
            
            return {
                "success": True,
                "status": "completed",
                "role": self.role,
                "onboarded": True,
                "message": f"{self.role.title()} onboarding completed. Systems initialized.",
            }
        except Exception as e:
            self.logger.error("complete_failed", user_id=user_id, error=str(e), exc_info=True)
            return {
                "success": False,
                "status": "error",
                "error": "Failed to complete onboarding. Please contact support.",
            }

    # ═══════════════════════════════════════════════════════════════════════════
    # ABSTRACT METHODS — IMPLEMENT IN EACH ROLE
    # ═══════════════════════════════════════════════════════════════════════════

    @abstractmethod
    async def get_step_options(self, step: int) -> Dict[str, Any]:
        """Get role-specific step options."""
        pass

    @abstractmethod
    async def validate_step(self, step: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate step data.
        
        Returns: {valid: bool, errors: List[str]}
        """
        pass

    def _get_required_fields(self, step: int) -> List[str]:
        """List required fields for a step."""
        return []

    def _get_optional_fields(self, step: int) -> List[str]:
        """List optional fields for a step."""
        return []

    # ═══════════════════════════════════════════════════════════════════════════
    # INTERNAL METHODS
    # ═══════════════════════════════════════════════════════════════════════════

    async def _persist_step_data(self, user_id: str, step: int, data: Dict[str, Any]) -> None:
        """Persist step data to database."""
        now = datetime.utcnow().isoformat()
        
        # Get or create progress record
        progress = await self._get_progress(user_id)
        completed_steps = progress.get("completed_steps", [])
        
        if step not in completed_steps:
            completed_steps.append(step)
        
        # Update progress
        updates = {
            "role": self.role,
            "current_step": step,
            "completed_steps": completed_steps,
            "step_data": {
                **progress.get("step_data", {}),
                f"step_{step}": data,
            },
            "updated_at": now,
        }
        
        await self.db.table("onboarding_progress").update(updates).eq("user_id", user_id).execute()

    async def _get_progress(self, user_id: str) -> Dict[str, Any]:
        """Get current progress record for user."""
        result = await self.db.table("onboarding_progress").select("*").eq("user_id", user_id).eq("role", self.role).single().execute()
        
        if result.data:
            return result.data
        
        # Create if doesn't exist
        now = datetime.utcnow().isoformat()
        new_record = {
            "user_id": user_id,
            "role": self.role,
            "current_step": 1,
            "completed_steps": [],
            "step_data": {},
            "status": "in_progress",
            "started_at": now,
            "created_at": now,
        }
        await self.db.table("onboarding_progress").insert(new_record).execute()
        return new_record

    async def _mark_completed(self, user_id: str) -> None:
        """Mark onboarding as completed."""
        now = datetime.utcnow().isoformat()
        
        # Update progress record
        await self.db.table("onboarding_progress").update({
            "status": "completed",
            "completed_at": now,
            "updated_at": now,
        }).eq("user_id", user_id).eq("role", self.role).execute()
        
        # Update user record
        await self.db.table("users").update({
            "onboarding_completed": True,
            "updated_at": now,
        }).eq("id", user_id).execute()

    async def _post_onboarding_setup(self, user_id: str, current_user: Dict[str, Any]) -> None:
        """
        Hook for role-specific post-onboarding setup.
        Override in subclasses for role-specific logic.
        
        Examples:
        - Student: Initialize learner profile, set up adaptive engine
        - Teacher: Set up classroom, initialize AI verification
        - Mentor: Initialize matching engine
        - Peer tutor: Set availability, initialize verification
        """
        pass

    # ═══════════════════════════════════════════════════════════════════════════
    # CRITICAL SYSTEM INTEGRATION METHODS
    # ═══════════════════════════════════════════════════════════════════════════

    async def _trigger_post_onboarding(self, user_id: str, current_user: Dict[str, Any]) -> None:
        """
        Trigger ALL system initialization after onboarding completion.
        
        COORDINATION FLOW:
        1. Assign role in RBAC system
        2. Sync permissions
        3. Run role-specific post-setup
        4. Set verification status if needed
        """
        try:
            # Step 1: Assign role in RBAC
            await self._assign_role(user_id, self.role)
            self.logger.info("role_assigned", user_id=user_id, role=self.role)
            
            # Step 2: Sync permissions
            await self._sync_permissions(user_id, self.role)
            self.logger.info("permissions_synced", user_id=user_id, role=self.role)
            
            # Step 3: Role-specific setup
            await self._post_onboarding_setup(user_id, current_user)
            self.logger.info("post_setup_completed", user_id=user_id, role=self.role)
            
            # Step 4: Set verification status (some roles need verification)
            await self._set_verification_status(user_id, self.role)
            
            self.logger.info("system_initialization_complete", user_id=user_id, role=self.role)
        except Exception as e:
            self.logger.error(
                "system_initialization_failed",
                user_id=user_id,
                role=self.role,
                error=str(e),
                exc_info=True
            )
            raise

    async def _assign_role(self, user_id: str, role: str) -> None:
        """
        Assign role to user in RBAC system.
        
        Ensures user_roles table has entry for this role.
        """
        try:
            now = datetime.utcnow().isoformat()
            
            # Check if role already exists
            existing = await self.db.table("user_roles").select("*").eq("user_id", user_id).eq("role_name", role).execute()
            
            if not existing.data:
                # Insert new role
                await self.db.table("user_roles").insert({
                    "user_id": user_id,
                    "role_name": role,
                    "assigned_at": now,
                    "created_at": now,
                }).execute()
            
            self.logger.debug("role_assigned_to_rbac", user_id=user_id, role=role)
        except Exception as e:
            self.logger.error("assign_role_failed", user_id=user_id, role=role, error=str(e))
            raise

    async def _sync_permissions(self, user_id: str, role: str) -> None:
        """
        Sync permissions from role to user_permissions table.
        
        Retrieves role's permissions and assigns to user.
        """
        try:
            # Get role permissions from role_permissions table
            role_perms = await self.db.table("role_permissions").select("permission_name").eq("role_name", role).execute()
            
            if not role_perms.data:
                self.logger.debug("no_permissions_for_role", role=role)
                return
            
            now = datetime.utcnow().isoformat()
            
            # Insert user permissions
            permissions_to_insert = [
                {
                    "user_id": user_id,
                    "permission_name": perm["permission_name"],
                    "role_name": role,
                    "assigned_at": now,
                    "created_at": now,
                }
                for perm in role_perms.data
            ]
            
            await self.db.table("user_permissions").insert(permissions_to_insert).execute()
            
            self.logger.info(
                "permissions_synced",
                user_id=user_id,
                role=role,
                permission_count=len(permissions_to_insert)
            )
        except Exception as e:
            self.logger.error("sync_permissions_failed", user_id=user_id, role=role, error=str(e))
            raise

    async def _track_event(self, event_name: str, event_data: Dict[str, Any]) -> None:
        """
        Track analytics event for this onboarding action.
        
        Internal method - stores in onboarding_events table.
        """
        try:
            now = datetime.utcnow().isoformat()
            
            await self.db.table("onboarding_events").insert({
                "event_name": event_name,
                "role": self.role,
                "event_data": event_data,
                "created_at": now,
            }).execute()
        except Exception as e:
            # Don't raise - analytics failure shouldn't break onboarding
            self.logger.warning("event_tracking_failed", event_name=event_name, error=str(e))

    async def _set_verification_status(self, user_id: str, role: str) -> None:
        """
        Set verification status for roles requiring verification.
        
        Roles that need verification:
        - peer_tutor: mastery proof
        - counselor: license verification
        - content_creator: portfolio review
        - researcher: IRB approval
        """
        roles_requiring_verification = [
            "peer_tutor",
            "counselor",
            "content_creator",
            "researcher",
        ]
        
        if role not in roles_requiring_verification:
            return
        
        try:
            now = datetime.utcnow().isoformat()
            
            # Create verification request
            await self.db.table("verification_requests").insert({
                "user_id": user_id,
                "role": role,
                "verification_type": self._get_verification_type(role),
                "status": "pending",
                "created_at": now,
            }).execute()
            
            # Update progress status
            await self.db.table("onboarding_progress").update({
                "verification_status": "pending",
                "verification_type": self._get_verification_type(role),
                "updated_at": now,
            }).eq("user_id", user_id).eq("role", role).execute()
            
            self.logger.info(
                "verification_request_created",
                user_id=user_id,
                role=role,
                verification_type=self._get_verification_type(role)
            )
        except Exception as e:
            self.logger.error(
                "verification_status_failed",
                user_id=user_id,
                role=role,
                error=str(e)
            )
            # Don't raise - create verification later if this fails

    def _get_verification_type(self, role: str) -> str:
        """Get verification type for a role."""
        verification_map = {
            "peer_tutor": "mastery_proof",
            "counselor": "license_verification",
            "content_creator": "portfolio_review",
            "researcher": "irb_approval",
        }
        return verification_map.get(role, "manual_review")
