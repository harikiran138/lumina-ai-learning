from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.api.deps import get_current_parent as get_current_user
from app.store.parent_store import ParentStore
from app.dependencies import get_parent_store

router = APIRouter()

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
