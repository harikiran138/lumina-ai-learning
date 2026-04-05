from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
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
    user_id: Optional[str] = None # Make optional to avoid 422 if frontend is slow

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
        current_uid = current_user.get("id") or current_user.get("user_id")
        log.info("parent_onboarding_triggered", 
                 user_id=current_uid, 
                 payload=request.dict())
        
        if not current_uid:
            log.error("parent_onboarding_no_user_id")
            raise HTTPException(status_code=401, detail="User identity not found in session")
        
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
            profile_data = {
                "user_id": current_uid,
                "full_name": request.full_name,
                "role": "parent",
                "preferences": {"relationship": request.relationship, "onboarding_step": 1}
            }
            log.info("parent_onboarding_upsert_profile", data=profile_data)
            await supabase_db.table("learner_profiles").upsert(profile_data).async_execute()
        except Exception as pe:
            log.warning("parent_onboarding_profile_update_failed_non_fatal", user_id=current_uid, error=str(pe))

        # 3. Persist the relationship in user_data.progress
        try:
            from app.database.scoped_db import get_scoped_db
            from app.store.user_data_store import UserDataStore
            
            db_scoped = get_scoped_db(current_user)
            data_store = UserDataStore(db=db_scoped)
            
            progress_payload = request.dict()
            progress_payload["onboarding_step"] = 1
            
            # Use the store's dedicated method if available, or manually update
            existing = await data_store.get_progress(current_uid) or {}
            existing["step_1"] = request.dict()
            existing["onboarding_step"] = 1
            
            # Simple metadata update
            await data_store.db.table("user_data").upsert({
                "user_id": current_uid,
                "progress": existing,
                "updated_at": datetime.utcnow().isoformat()
            }).async_execute()
            
            log.info("parent_onboarding_progress_saved", user_id=current_uid)
        except Exception as ude:
            log.warning("parent_onboarding_user_data_failed_non_fatal", user_id=current_uid, error=str(ude))

        return {"success": True, "status": "success", "message": "Onboarding details saved", "step": 1}
        
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
    if not any(str(link["child_id"]) == request.child_id for link in links):
        raise HTTPException(status_code=403, detail="You can only set goals for your linked children")
    
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

@router.post("/link-by-code")
async def link_student_by_code(
    request: dict,
    current_user: dict = Depends(get_current_user),
    store: ParentStore = Depends(get_parent_store)
):
    """
    Links a parent to a student using the student's unique parent_link_code.
    """
    code = request.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="Code is required")
        
    result = await store.link_student_by_code(current_user["id"], code)
    if not result:
        raise HTTPException(status_code=404, detail="Invalid code or student already linked")
        
    return {
        "status": "success", 
        "message": "Student linked successfully",
        "student": result
    }


@router.get("/weekly-reports")
async def get_weekly_reports(
    current_user: dict = Depends(get_current_user),
    store: ParentStore = Depends(get_parent_store)
):
    """
    Fetch scannable weekly activity reports for all linked children (Item 2: Retention).
    """
    return await store.get_weekly_reports(current_user["id"])


@router.get("/children")
async def get_linked_children(
    current_user: dict = Depends(get_current_user),
    store: ParentStore = Depends(get_parent_store)
):
    """
    List all children linked to this parent.
    """
    return await store.get_linked_children(current_user["id"])
