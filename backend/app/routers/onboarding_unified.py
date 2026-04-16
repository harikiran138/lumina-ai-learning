"""
Unified Onboarding Router

Single router handling all role-based onboarding flows.

Endpoints:
GET    /api/onboarding/{role}/options      - Get role-specific onboarding options
POST   /api/onboarding/{role}/step/{step}  - Submit a step
GET    /api/onboarding/{role}/status       - Check progress
POST   /api/onboarding/{role}/complete     - Finalize onboarding
"""

from fastapi import APIRouter, HTTPException, Depends, Path, Body
from typing import Dict, Any, Optional
import structlog
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.core.rbac import normalize_role
from app.services.onboarding import (
    BaseOnboardingService,
    StudentOnboardingService,
    TeacherOnboardingService,
    ParentOnboardingService,
    PeerTutorOnboardingService,
    MentorOnboardingService,
    CounselorOnboardingService,
    ContentCreatorOnboardingService,
    ResearcherOnboardingService,
    AdminOnboardingService,
    AlumniOnboardingService,
    HODOnboardingService,
)
from app.services.onboarding.base_service import StandardOnboardingResponse

router = APIRouter()
logger = structlog.get_logger(__name__)

# ═══════════════════════════════════════════════════════════════════════════
# SERVICE FACTORY
# ═══════════════════════════════════════════════════════════════════════════

SERVICE_MAP = {
    "student": StudentOnboardingService,
    "teacher": TeacherOnboardingService,
    "parent": ParentOnboardingService,
    "peer_tutor": PeerTutorOnboardingService,
    "mentor": MentorOnboardingService,
    "counselor": CounselorOnboardingService,
    "content_creator": ContentCreatorOnboardingService,
    "researcher": ResearcherOnboardingService,
    "alumni": AlumniOnboardingService,
    "college_admin": AdminOnboardingService,
    "super_admin": AdminOnboardingService,
    "system_admin": AdminOnboardingService,
    "institution_admin": AdminOnboardingService,
    "hod": HODOnboardingService,
}


def get_onboarding_service(role: str) -> BaseOnboardingService:
    """Factory to get the appropriate onboarding service for a role."""
    role_lower = str(role).lower().strip()
    service_class = SERVICE_MAP.get(role_lower)
    
    if not service_class:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role '{role}'. Supported roles: {list(SERVICE_MAP.keys())}"
        )
    
    return service_class(role=role_lower)


# ═══════════════════════════════════════════════════════════════════════════
# REQUEST/RESPONSE MODELS
# ═══════════════════════════════════════════════════════════════════════════

class StepSubmissionRequest(BaseModel):
    """Request body for submitting a step."""
    data: Dict[str, Any] = Body(..., description="Step-specific data")


class OnboardingCompleteRequest(BaseModel):
    """Request body for completing onboarding."""
    confirmation: bool = Body(True, description="Confirmation that user wants to complete")


# ═══════════════════════════════════════════════════════════════════════════
# ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════

@router.get(
    "/{role}/options",
    summary="Get onboarding options for a role",
    description="Returns role-specific onboarding options, steps, and requirements",
    tags=["Onboarding"]
)
async def get_onboarding_options(
    role: str = Path(..., description="User role (student, teacher, peer_tutor, etc.)"),
    step: Optional[int] = None,
    current_user: dict = Depends(get_current_user),
):
    """
    Get available options for onboarding steps.
    
    If step is provided, returns options for that specific step.
    If not provided, returns all steps overview.
    """
    try:
        service = get_onboarding_service(role)
        
        if step:
            if step < 1 or step > service.TOTAL_STEPS:
                return StandardOnboardingResponse.from_dict({
                    "success": False,
                    "role": role,
                    "step": step,
                    "status": "error",
                    "errors": [f"Invalid step {step}. Valid range: 1-{service.TOTAL_STEPS}"],
                    "message": "Invalid step number",
                })
            options = await service.get_options(step)
        else:
            # Return overview of all steps
            options = {
                "role": role,
                "total_steps": service.TOTAL_STEPS,
                "steps": [
                    {
                        "step": i,
                        "title": (await service.get_options(i)).get("title", f"Step {i}"),
                    }
                    for i in range(1, service.TOTAL_STEPS + 1)
                ]
            }
        
        return StandardOnboardingResponse.from_dict({
            "success": True,
            "role": role,
            "step": step,
            "status": "ready",
            "message": f"Options available for {role} onboarding",
            "required_fields": options.get("required_fields", []),
        }) | {"options": options}  # Add options field separately
    
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error("get_options_failed", role=role, error=str(e), exc_info=True)
        return StandardOnboardingResponse.from_dict({
            "success": False,
            "role": role,
            "status": "error",
            "errors": ["Failed to get onboarding options"],
            "message": "Server error while retrieving options",
        })


@router.post(
    "/{role}/step/{step}",
    summary="Submit onboarding step",
    description="Validate and save a specific onboarding step",
    tags=["Onboarding"]
)
async def submit_onboarding_step(
    role: str = Path(..., description="User role"),
    step: int = Path(..., description="Step number"),
    request: StepSubmissionRequest = Body(..., description="Step data to submit"),
    current_user: dict = Depends(get_current_user),
):
    """
    Submit and validate onboarding step data.
    
    - Validates step data according to role-specific rules
    - Persists data to database
    - Returns progress information
    """
    try:
        user_id = str(current_user.get("id"))
        service = get_onboarding_service(role)
        
        # Validate step number
        if step < 1 or step > service.TOTAL_STEPS:
            return StandardOnboardingResponse.from_dict({
                "success": False,
                "role": role,
                "step": step,
                "status": "error",
                "errors": [f"Invalid step {step}. Valid range: 1-{service.TOTAL_STEPS}"],
                "message": f"Step {step} is not valid for {role} onboarding",
            })
        
        # Validate request body is not empty
        if not request or not request.data:
            return StandardOnboardingResponse.from_dict({
                "success": False,
                "role": role,
                "step": step,
                "status": "error",
                "errors": ["Step data cannot be empty"],
                "message": "Request body must contain step data",
            })
        
        # Get current status first
        try:
            progress = await service._get_progress(user_id)
            current_step = progress.get("current_step", 1)
            completed_steps = progress.get("completed_steps", [])
        except:
            current_step = 1
            completed_steps = []
        
        result = await service.save_step(user_id, step, request.data)
        
        if not result.get("success"):
            return StandardOnboardingResponse.from_dict({
                "success": False,
                "role": role,
                "step": step,
                "current_step": current_step,
                "completed_steps": completed_steps,
                "status": "error",
                "errors": result.get("errors", [result.get("error", "Unknown error")]),
                "message": result.get("error") or "Validation failed",
            })
        
        # Get updated status
        next_step = min(step + 1, service.TOTAL_STEPS)
        updated_completed = list(set(completed_steps + [step]))
        
        return StandardOnboardingResponse.from_dict({
            "success": True,
            "role": role,
            "step": step,
            "current_step": current_step,
            "completed_steps": sorted(updated_completed),
            "next_step": next_step if step < service.TOTAL_STEPS else None,
            "progress_percent": result.get("progress_percent", 0),
            "status": "in_progress",
            "message": f"Step {step} completed successfully",
        })
    
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error("submit_step_failed", role=role, step=step, error=str(e), exc_info=True)
        return StandardOnboardingResponse.from_dict({
            "success": False,
            "role": role,
            "step": step,
            "status": "error",
            "errors": ["Failed to submit step. Please try again."],
            "message": "Server error while processing step",
        })


@router.get(
    "/{role}/status",
    summary="Get onboarding status",
    description="Check current onboarding progress for a role",
    tags=["Onboarding"]
)
async def get_onboarding_status(
    role: str = Path(..., description="User role"),
    current_user: dict = Depends(get_current_user),
):
    """Get current onboarding status and progress."""
    try:
        user_id = str(current_user.get("id"))
        service = get_onboarding_service(role)
        
        status = await service.get_status(user_id)
        
        return StandardOnboardingResponse.from_dict({
            "success": True,
            "role": role,
            "current_step": status.get("current_step", 1),
            "completed_steps": status.get("completed_steps", []),
            "progress_percent": status.get("progress_percent", 0),
            "status": status.get("status", "in_progress"),
            "message": f"{role.title()} onboarding progress",
        })
    
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error("get_status_failed", role=role, error=str(e), exc_info=True)
        return StandardOnboardingResponse.from_dict({
            "success": False,
            "role": role,
            "status": "error",
            "errors": ["Failed to get onboarding status"],
            "message": "Server error while checking status",
        })


@router.post(
    "/{role}/complete",
    summary="Complete onboarding",
    description="Mark onboarding as complete for a role",
    tags=["Onboarding"]
)
async def complete_onboarding(
    role: str = Path(..., description="User role"),
    request: OnboardingCompleteRequest = Body(None),
    current_user: dict = Depends(get_current_user),
):
    """
    Finalize onboarding for a role.
    
    - Marks all steps as completed
    - Triggers role-specific post-onboarding setup
    - Assigns role in RBAC system
    - Syncs permissions
    - Sets up verification pipelines if needed
    - Returns success confirmation
    """
    try:
        user_id = str(current_user.get("id"))
        service = get_onboarding_service(role)
        
        result = await service.complete(user_id, current_user)
        
        if not result.get("success"):
            return StandardOnboardingResponse.from_dict({
                "success": False,
                "role": role,
                "status": "error",
                "errors": [result.get("error", "Failed to complete onboarding")],
                "message": result.get("error"),
            })
        
        logger.info("onboarding_completed_with_systems", user_id=user_id, role=role)
        
        return StandardOnboardingResponse.from_dict({
            "success": True,
            "role": role,
            "status": "completed",
            "message": f"{role.title()} onboarding completed. Systems initialized.",
            "completed_steps": list(range(1, service.TOTAL_STEPS + 1)),
            "progress_percent": 100.0,
        })
    
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error("complete_failed", role=role, error=str(e), exc_info=True)
        return StandardOnboardingResponse.from_dict({
            "success": False,
            "role": role,
            "status": "error",
            "errors": ["Failed to complete onboarding. Please contact support."],
            "message": "Server error while completing onboarding",
        })


# ═══════════════════════════════════════════════════════════════════════════
# HEALTH CHECK
# ═══════════════════════════════════════════════════════════════════════════

@router.get(
    "/onboarding/health",
    summary="Health check",
    tags=["Onboarding"]
)
async def health_check():
    """Simple health check endpoint."""
    return {
        "status": "healthy",
        "supported_roles": list(SERVICE_MAP.keys()),
        "endpoint_pattern": "/api/onboarding/{role}/{action}"
    }
