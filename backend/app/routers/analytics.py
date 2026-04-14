from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List
from datetime import datetime
import structlog

from app.api.deps import get_current_college_admin
from app.store.analytics_store import AnalyticsStore
from app.database.scoped_db import get_scoped_db

router = APIRouter()
log = structlog.get_logger(__name__)

def is_admin(current_user: dict = Depends(get_current_college_admin)):
    if not current_user.get("two_factor_enabled"):
        log.warning("admin_access_without_2fa", user_id=current_user.get("id"))
    return current_user

@router.get("/dashboard")
async def get_admin_dashboard(admin: dict = Depends(is_admin)):
    """Get high-level system stats for the admin dashboard."""
    db = get_scoped_db(admin)
    analytics = AnalyticsStore(db=db)
    stats = await analytics.get_admin_dashboard_stats()
    
    return {
        "stats": [
            {"label": "Total Students", "value": str(stats.get("total_users", 0)), "trend": "+12%", "icon": "Users"},
            {"label": "System Courses", "value": str(stats.get("total_courses", 0)), "trend": "Active", "icon": "BookOpen"},
            {"label": "Overall Retention", "value": "94%", "trend": "+0.5%", "icon": "TrendingUp"},
            {"label": "System Health", "value": "99.9%", "trend": "Stable", "icon": "ShieldCheck"},
        ],
        "meta": {"stats": stats}
    }

@router.get("/health")
async def get_system_health(admin: dict = Depends(is_admin)):
    """Comprehensive system-wide health audit."""
    db = get_scoped_db(admin)
    return await AnalyticsStore(db=db).get_system_health_audit()

@router.get("/queue-health")
async def get_queue_health(admin: dict = Depends(is_admin)):
    """AI verification backlog and throughput signals."""
    db = get_scoped_db(admin)
    return await AnalyticsStore(db=db).get_verification_queue_stats()
