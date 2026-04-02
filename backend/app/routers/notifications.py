"""
Notifications Router
--------------------
Provides GET/POST endpoints so every role can read and acknowledge
in-app notifications stored by NotificationService in Redis.
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any

from app.api.deps import get_current_active_user
from app.services.notification import NotificationService

router = APIRouter()


def _get_service() -> NotificationService:
    return NotificationService()


@router.get("/", response_model=List[Dict[str, Any]])
async def list_notifications(
    limit: int = 20,
    current_user: dict = Depends(get_current_active_user),
    svc: NotificationService = Depends(_get_service),
):
    """Return up to *limit* unread in-app notifications for the authenticated user."""
    user_id = str(current_user["id"])
    return svc.get_unread(user_id, limit=min(limit, 50))


@router.post("/{notif_id}/read")
async def mark_notification_read(
    notif_id: str,
    current_user: dict = Depends(get_current_active_user),
    svc: NotificationService = Depends(_get_service),
):
    """Mark a single notification as read."""
    user_id = str(current_user["id"])
    updated = svc.mark_read(user_id, notif_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"status": "ok"}


@router.post("/read-all")
async def mark_all_notifications_read(
    current_user: dict = Depends(get_current_active_user),
    svc: NotificationService = Depends(_get_service),
):
    """Mark all of the user's in-app notifications as read."""
    user_id = str(current_user["id"])
    count = svc.mark_all_read(user_id)
    return {"status": "ok", "updated": count}
