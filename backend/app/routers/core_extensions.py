from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Any, Optional
from .auth import get_current_user
from app.services.video_service import get_video_service
from app.database.supabase_manager import supabase_db

router = APIRouter(prefix="/api", tags=["Lumina Core Extensions"])

# Video Analytics Endpoints
@router.get("/video/analytics/{course_id}")
async def get_video_analytics(
    course_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Fetch video insights for a specific course and institution."""
    institution_id = current_user.get("institution_id")
    if not institution_id:
         raise HTTPException(status_code=400, detail="Institutional scoping required")
         
    service = get_video_service()
    return await service.get_video_analytics(course_id, institution_id)

@router.post("/video/analyze")
async def analyze_video(
    course_id: str,
    video_url: str,
    current_user: dict = Depends(get_current_user)
):
    """Trigger AI analysis for a new video (Faculty only)."""
    if current_user.get("role") not in ("faculty", "teacher", "admin"):
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    institution_id = current_user.get("institution_id")
    service = get_video_service()
    return await service.analyze_video(course_id, video_url, institution_id)

# Support Ticket Endpoints
@router.post("/support/tickets")
async def create_support_ticket(
    subject: str,
    description: str,
    category: str = "technical",
    priority: str = "medium",
    current_user: dict = Depends(get_current_user)
):
    """Create a new support ticket."""
    institution_id = current_user.get("institution_id")
    ticket = await supabase_db.insert("support_tickets", {
        "user_id": current_user["id"],
        "subject": subject,
        "description": description,
        "category": category,
        "priority": priority,
        "institution_id": institution_id
    })
    return ticket or {"error": "Failed to create ticket"}

@router.get("/support/my-tickets")
async def list_my_tickets(current_user: dict = Depends(get_current_user)):
    """List tickets for the current user."""
    return await supabase_db.fetch_all("support_tickets", {"user_id": current_user["id"]})

@router.get("/support/tickets/queue")
async def list_support_queue(current_user: dict = Depends(get_current_user)):
    """List all tickets in the institution (Admin/Staff only)."""
    if current_user.get("role") not in ("admin", "super_admin", "staff"):
         raise HTTPException(status_code=403, detail="Access denied")
    
    institution_id = current_user.get("institution_id")
    return await supabase_db.fetch_all("support_tickets", {"institution_id": institution_id})
