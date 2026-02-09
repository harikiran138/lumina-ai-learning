from fastapi import APIRouter, HTTPException, Depends

from .auth import get_current_user
from app.store.user_store import UserStore
from app.store.course_store import CourseStore
from app.database.manager import db

router = APIRouter()


def is_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.get("/dashboard")
async def get_admin_dashboard(admin: dict = Depends(is_admin)):
    """
    Get high-level system stats for the admin dashboard.
    """
    users_col = db.get_collection("users")
    courses_col = db.get_collection("courses")

    total_users = await users_col.count_documents({})
    total_courses = await courses_col.count_documents({})

    return {
        "totalUsers": total_users,
        "totalCourses": total_courses,
        "activeUsers": total_users,  # Simplistic
        "systemStatus": "healthy",
    }


@router.get("/users")
async def get_all_users(admin: dict = Depends(is_admin)):
    """List all users in the system."""
    user_store = UserStore()
    users = await user_store.list_all_users()  # Need to ensure this exists
    return users


@router.get("/courses")
async def get_all_courses(admin: dict = Depends(is_admin)):
    """List all courses for admin management."""
    course_store = CourseStore()
    return await course_store.list_courses()


@router.get("/logs/ai")
async def get_ai_logs(admin: dict = Depends(is_admin)):
    """Fetch AI interaction logs."""
    logs_col = db.get_collection("ai_logs")
    cursor = logs_col.find().sort("timestamp", -1).limit(100)
    logs = await cursor.to_list(length=100)
    for log_entry in logs:
        log_entry["id"] = str(log_entry.pop("_id"))
    return logs


@router.post("/users/{user_id}/status")
async def update_user_status(user_id: str, status: str, admin: dict = Depends(is_admin)):
    """Update a user's status."""
    users_col = db.get_collection("users")
    await users_col.update_one({"_id": user_id}, {"$set": {"status": status}})
    return {"success": True}
