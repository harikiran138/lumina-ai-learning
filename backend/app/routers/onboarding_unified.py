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
)

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
    "college_admin": AdminOnboardingService,
    "super_admin": AdminOnboardingService,
    "system_admin": AdminOnboardingService,
    "institution_admin": AdminOnboardingService,
    "hod": TeacherOnboardingService,  # HOD uses teacher flow with admin features
    "alumni": StudentOnboardingService,  # Simplified student flow
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
    "/onboarding/{role}/options",
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
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid step {step}. Valid range: 1-{service.TOTAL_STEPS}"
                )
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
        
        return {
            "success": True,
            "data": options
        }
    
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error("get_options_failed", role=role, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get onboarding options")


@router.post(
    "/onboarding/{role}/step/{step}",
    summary="Submit onboarding step",
    description="Validate and save a specific onboarding step",
    tags=["Onboarding"]
)
async def submit_onboarding_step(
    role: str = Path(..., description="User role"),
    step: int = Path(..., description="Step number"),
    request: StepSubmissionRequest = None,
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
        
        result = await service.save_step(user_id, step, request.data)
        
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error") or str(result.get("errors")))
        
        return {
            "success": True,
            "data": result
        }
    
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error("submit_step_failed", role=role, step=step, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to submit step")


@router.get(
    "/onboarding/{role}/status",
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
        
        return {
            "success": True,
            "data": status
        }
    
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error("get_status_failed", role=role, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get onboarding status")


@router.post(
    "/onboarding/{role}/complete",
    summary="Complete onboarding",
    description="Mark onboarding as complete for a role",
    tags=["Onboarding"]
)
async def complete_onboarding(
    role: str = Path(..., description="User role"),
    request: OnboardingCompleteRequest = None,
    current_user: dict = Depends(get_current_user),
):
    """
    Finalize onboarding for a role.
    
    - Marks all steps as completed
    - Triggers role-specific post-onboarding setup
    - Sets onboarding_completed flag
    - Returns success confirmation
    """
    try:
        user_id = str(current_user.get("id"))
        service = get_onboarding_service(role)
        
        result = await service.complete(user_id, current_user)
        
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error"))
        
        logger.info("onboarding_completed", user_id=user_id, role=role)
        
        return {
            "success": True,
            "data": result
        }
    
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error("complete_failed", role=role, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to complete onboarding")


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
