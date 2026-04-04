from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime
from app.api.deps import get_current_parent as get_current_user
from app.store.parent_store import ParentStore
from app.dependencies import get_parent_store

from app.store.redis_client import redis_client
from app.core.logging import structlog

log = structlog.get_logger()

router = APIRouter()

class ConnectRequest(BaseModel):
    token: str

class GoalRequest(BaseModel):
    child_id: str
    goal_text: str

class ParentOnboardingRequest(BaseModel):
    full_name: str
    relationship: str
    user_id: str

@router.post("/onboarding")
async def parent_onboarding(
    request: ParentOnboardingRequest,
    current_user: dict = Depends(get_current_user),
    store: ParentStore = Depends(get_parent_store)
):
    """
    Handle parent onboarding Step 1: Your Details.
    Expects full_name and relationship.
    """
    try:
        log.info("parent_onboarding_triggered", user_id=current_user["id"], payload=request.dict())
        
        # 1. Update the base user record
        from app.store.user_store import UserStore
        user_store = UserStore()
        
        updates = {
            "full_name": request.full_name,
            "name": request.full_name,
            "onboarding_step": 1,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        success = await user_store.update_user_fields(current_user["id"], updates)
        if not success:
            log.error("parent_onboarding_user_update_failed", user_id=current_user["id"])
            raise HTTPException(status_code=500, detail="Failed to update user profile")

        # 2. Update learner_profiles (Lumina's standard metadata sink)
        try:
            from app.database.supabase_manager import supabase_db
            await supabase_db.table("learner_profiles").upsert({
                "user_id": current_user["id"],
                "full_name": request.full_name,
                "role": "parent",
                "preferences": {"relationship": request.relationship, "onboarding_step": 1}
            }).async_execute()
        except Exception as pe:
            log.warning("parent_onboarding_profile_update_failed", user_id=current_user["id"], error=str(pe))

        # 3. Persist the relationship (Best effort to store in progress or a profile table)
        # For now, let's store it in user_data.progress as well for Consistency with generic flow
        from app.database.manager import db
        existing = await db.fetch_one("user_data", {"user_id": current_user["id"]})
        progress = (existing or {}).get("progress") or {}
        progress["step_1"] = request.dict()
        progress["onboarding_step"] = 1
        
        if existing:
            await db.update(
                "user_data",
                {"progress": progress, "updated_at": datetime.utcnow().isoformat()},
                {"user_id": current_user["id"]},
            )
        else:
            await db.insert(
                "user_data",
                {"user_id": current_user["id"], "progress": progress, "updated_at": datetime.utcnow().isoformat()},
            )

        return {"status": "success", "message": "Onboarding step 1 saved", "step": 1}
        
    except HTTPException:
        raise
    except Exception as e:
        log.error("parent_onboarding_failed", user_id=current_user["id"], error=str(e))
        raise HTTPException(status_code=500, detail=f"Onboarding failed: {str(e)}")

@router.get("/dashboard")
async def get_parent_dashboard(
    current_user: dict = Depends(get_current_user),
    store: ParentStore = Depends(get_parent_store)
):
    return await store.get_parent_dashboard(current_user["id"])

@router.post("/goals")
async def set_child_goal(
    request: GoalRequest,
    current_user: dict = Depends(get_current_user),
    store: ParentStore = Depends(get_parent_store)
):
    
    # Verify link
    links = await store.get_linked_children(current_user["id"])
    if not any(str(link["child_id"]) == request.child_id and link["verified_by_admin"] for link in links):
        raise HTTPException(status_code=403, detail="You can only set goals for your verified children")
    
    goal = await store.create_goal(current_user["id"], request.child_id, request.goal_text)
    if not goal:
        raise HTTPException(status_code=500, detail="Failed to create goal")
    return {"status": "success", "goal": goal}
@router.post("/connection/connect")
async def connect_student(
    request: ConnectRequest,
    current_user: dict = Depends(get_current_user),
    store: ParentStore = Depends(get_parent_store)
):
    """
    Connects a parent to a student using a temporary token.
    """
    try:
        key = f"student_connect:{request.token}"
        child_id = await redis_client.get(key)
        
        if not child_id:
            raise HTTPException(status_code=400, detail="Invalid or expired connection token")
            
        success = await store.create_link(current_user["id"], child_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to create connection")
            
        # Delete token after successful use
        await redis_client.delete(key)
        
        return {"status": "success", "message": "Connected successfully", "child_id": child_id}
    except HTTPException:
        raise
    except Exception as e:
        log.error("connect_student_failed", parent_id=current_user["id"], error=str(e))
        raise HTTPException(status_code=500, detail="An error occurred while connecting")

@router.delete("/connection/{child_id}")
async def disconnect_student(
    child_id: str,
    current_user: dict = Depends(get_current_user),
    store: ParentStore = Depends(get_parent_store)
):
    """
    Removes a connection to a student.
    """
    success = await store.delete_link(current_user["id"], child_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to remove connection")
    return {"status": "success", "message": "Disconnected successfully"}
