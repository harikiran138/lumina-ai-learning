from fastapi import APIRouter, HTTPException, Depends

from .auth import get_current_user
from app.store.user_store import UserStore
from app.store.course_store import CourseStore
from app.store.analytics_store import AnalyticsStore
from app.services.personalization_service import get_personalization_service
from app.database.supabase_manager import supabase_db

router = APIRouter()


def is_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.get("/dashboard")
async def get_admin_dashboard(admin: dict = Depends(is_admin)):
    """Get high-level system stats for the admin dashboard."""
    return await AnalyticsStore().get_admin_dashboard_stats()


@router.get("/users")
async def get_all_users(admin: dict = Depends(is_admin)):
    """List all users in the system."""
    user_store = UserStore()
    return await user_store.list_all_users()


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin: dict = Depends(is_admin)):
    """Delete a user from the system."""
    user_store = UserStore()
    success = await user_store.delete_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True}


@router.post("/users/{user_id}/status")
async def update_user_status(user_id: str, status: str, admin: dict = Depends(is_admin)):
    """Update a user's active status."""
    try:
        res = supabase_db.client.table("users").update({"status": status, "is_active": status == "active"}).eq("id", user_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="User not found")
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/users/{user_id}/role")
async def update_user_role(user_id: str, role: str, admin: dict = Depends(is_admin)):
    """Change a user's role."""
    if role not in ("student", "teacher", "admin"):
        raise HTTPException(status_code=400, detail="Invalid role. Must be student, teacher, or admin")
    user_store = UserStore()
    success = await user_store.update_user_role(user_id, role)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True}


@router.get("/courses")
async def get_all_courses(admin: dict = Depends(is_admin)):
    """List all courses for admin management."""
    course_store = CourseStore()
    return await course_store.list_courses()


@router.get("/logs/ai")
async def get_ai_logs(admin: dict = Depends(is_admin)):
    """Fetch AI interaction logs."""
    try:
        response = supabase_db.client.table("ai_logs").select("*").order("timestamp", desc=True).limit(100).execute()
        return response.data
    except Exception as e:
        return []

@router.delete("/logs/ai/{log_id}")
async def delete_ai_log(log_id: str, admin: dict = Depends(is_admin)):
    """Delete a specific AI log entry."""
    try:
        res = supabase_db.client.table("ai_logs").delete().eq("id", log_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Log entry not found")
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/logs/chat")
async def get_chat_logs(admin: dict = Depends(is_admin)):
    """Fetch AI tutor chat conversation logs."""
    try:
        response = supabase_db.client.table("conversations").select("*").order("last_updated", desc=True).limit(100).execute()
        return response.data
    except Exception as e:
        return []


@router.get("/students-progress")
async def get_students_progress(admin: dict = Depends(is_admin)):
    """Get progress data for all students."""
    try:
        response = supabase_db.client.table("assessment_sessions").select("student_id, current_difficulty, topic").execute()
        data = response.data
        if not data:
            return []
            
        student_stats = {}
        for d in data:
            sid = d.get("student_id")
            if not sid:
                continue
            if sid not in student_stats:
                student_stats[sid] = {"sum": 0, "count": 0, "topics": set()}
            
            diff = d.get("current_difficulty")
            if diff is not None:
                student_stats[sid]["sum"] += diff
                student_stats[sid]["count"] += 1
            if d.get("topic"):
                student_stats[sid]["topics"].add(d.get("topic"))
                
        progress_list = []
        for sid, stats in student_stats.items():
            avg = stats["sum"] / stats["count"] if stats["count"] else 0
            progress_list.append({
                "student_id": sid,
                "avg_score": round(avg * 100, 2),
                "total_sessions": stats["count"],
                "topic_count": len(stats["topics"])
            })
            
        return progress_list
    except Exception as e:
        import structlog
        structlog.get_logger().error("students_progress_failed", error=str(e))
        return []


@router.get("/interventions")
async def get_interventions(admin: dict = Depends(is_admin)):
    """List open intervention recommendations generated by the personalization engine."""
    return [
        item.model_dump(mode="json")
        for item in await get_personalization_service().get_interventions()
    ]
