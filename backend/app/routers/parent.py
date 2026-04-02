from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.api.deps import get_current_parent as get_current_user
from app.store.parent_store import ParentStore
from app.dependencies import get_parent_store

from app.store.redis_client import redis_client

router = APIRouter()

class ConnectRequest(BaseModel):
    token: str

class GoalRequest(BaseModel):
    child_id: str
    goal_text: str

@router.get("/dashboard")
async def get_parent_dashboard(
    current_user: dict = Depends(get_current_user),
    store: ParentStore = Depends(get_parent_store)
):
    return await store.get_messages(current_user["id"])

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
