from fastapi import APIRouter, Depends, HTTPException, Body, Query
from app.api.deps import get_current_active_user, get_current_student
from app.store.community_store import CommunityStore
from typing import List, Dict, Any, Optional

router = APIRouter()

@router.get("/communities")
async def list_communities(
    current_user: dict = Depends(get_current_active_user)
):
    """Fetch all subject-based communities."""
    store = CommunityStore()
    communities = await store.get_communities()
    return {"success": True, "data": communities}

@router.post("/join/{community_id}")
async def join_community(
    community_id: str,
    current_student: dict = Depends(get_current_student)
):
    """Let a student join a community. Restricted to Students only."""
    store = CommunityStore()
    success = await store.join_community(community_id, current_student["id"])
    if not success:
        raise HTTPException(status_code=400, detail="Failed to join community")
    return {"success": True, "message": "Joined community"}

@router.get("/posts")
async def list_posts(
    community_id: Optional[str] = None,
    subject: Optional[str] = None,
    sort: str = "latest",
    limit: int = 50,
    current_user: dict = Depends(get_current_active_user)
):
    """Fetch posts with optional community/topic filtering."""
    store = CommunityStore()
    posts = await store.get_posts(community_id, subject, sort, limit)
    return {"success": True, "data": posts}

@router.post("/posts")
async def create_post(
    community_id: str = Query(...),
    payload: Dict[str, Any] = Body(...),
    current_student: dict = Depends(get_current_student)
):
    """Create a new post. Restricted to Students only."""
    store = CommunityStore()
    post = await store.create_post(community_id, current_student["id"], payload)
    if not post:
        raise HTTPException(status_code=400, detail="Failed to create post")
    return {"success": True, "data": post}

@router.get("/posts/{post_id}/comments")
async def list_comments(
    post_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Fetch comments for a specific post."""
    store = CommunityStore()
    comments = await store.get_comments(post_id)
    return {"success": True, "data": comments}

@router.post("/posts/{post_id}/comments")
async def create_comment(
    post_id: str,
    payload: Dict[str, Any] = Body(...),
    current_student: dict = Depends(get_current_student)
):
    """Post a comment or reply. Restricted to Students only."""
    store = CommunityStore()
    comment = await store.create_comment(
        post_id, 
        current_student["id"], 
        payload["content"], 
        payload.get("parent_id")
    )
    if not comment:
        raise HTTPException(status_code=400, detail="Failed to post comment")
    return {"success": True, "data": comment}

@router.post("/posts/{post_id}/like")
async def toggle_like(
    post_id: str,
    current_student: dict = Depends(get_current_student)
):
    """Toggle like/upvote on a post. Restricted to Students only."""
    store = CommunityStore()
    is_liked = await store.toggle_like(post_id, current_student["id"])
    return {"success": True, "liked": is_liked}
