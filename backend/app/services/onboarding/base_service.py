"""
Base onboarding service providing common interface for all role-specific onboarding flows.
"""

from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
import structlog
from app.database.supabase_manager import supabase_db

logger = structlog.get_logger(__name__)


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
        
        1. Validate step data (role + step specific)
        2. Persist to database
        3. Update progress
        
        Returns: {success, step, next_step, validation_errors}
        """
        if step < 1 or step > self.TOTAL_STEPS:
            return {
                "success": False,
                "error": f"Invalid step {step}. Valid range: 1-{self.TOTAL_STEPS}",
            }

        # Role-specific validation
        validation_result = await self.validate_step(step, data)
        if not validation_result["valid"]:
            return {
                "success": False,
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
                "error": "Failed to save step data",
            }

        next_step = min(step + 1, self.TOTAL_STEPS)
        return {
            "success": True,
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
        
        1. Mark all steps as completed
        2. Set onboarding_completed flag
        3. Trigger any role-specific post-onboarding logic
        4. Return success
        """
        try:
            # Mark as completed
            await self._mark_completed(user_id)
            
            # Role-specific post-onboarding logic
            await self._post_onboarding_setup(user_id, current_user)
            
            self.logger.info("onboarding_completed", user_id=user_id, role=self.role)
            
            return {
                "success": True,
                "role": self.role,
                "onboarded": True,
                "message": f"{self.role.title()} onboarding completed",
            }
        except Exception as e:
            self.logger.error("complete_failed", user_id=user_id, error=str(e))
            return {
                "success": False,
                "error": "Failed to complete onboarding",
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
