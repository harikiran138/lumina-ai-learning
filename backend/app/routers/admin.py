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
    """Get high-level system stats for the admin dashboard."""
    users_col = db.get_collection("users")
    courses_col = db.get_collection("courses")

    total_users = await users_col.count_documents({})
    total_courses = await courses_col.count_documents({})

    return {
        "totalUsers": total_users,
        "totalCourses": total_courses,
        "activeUsers": total_users,
        "systemStatus": "healthy",
    }


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
    users_col = db.get_collection("users")
    result = await users_col.update_one({"_id": user_id}, {"$set": {"status": status, "is_active": status == "active"}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True}


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
    logs_col = db.get_collection("ai_logs")
    cursor = logs_col.find().sort("timestamp", -1).limit(100)
    logs = await cursor.to_list(length=100)
    for log_entry in logs:
        log_entry["id"] = str(log_entry.pop("_id"))
    return logs


@router.delete("/logs/ai/{log_id}")
async def delete_ai_log(log_id: str, admin: dict = Depends(is_admin)):
    """Delete a specific AI log entry."""
    logs_col = db.get_collection("ai_logs")
    result = await logs_col.delete_one({"$or": [{"_id": log_id}, {"id": log_id}]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Log entry not found")
    return {"success": True}


@router.get("/logs/chat")
async def get_chat_logs(admin: dict = Depends(is_admin)):
    """Fetch AI tutor chat conversation logs."""
    convos_col = db.get_collection("conversations")
    cursor = convos_col.find().sort("timestamp", -1).limit(100)
    logs = await cursor.to_list(length=100)
    for entry in logs:
        entry["id"] = str(entry.pop("_id"))
    return logs


@router.get("/students-progress")
async def get_students_progress(admin: dict = Depends(is_admin)):
    """Get progress data for all students."""
    sessions_col = db.get_collection("assessment_sessions")
    users_col = db.get_collection("users")

    pipeline = [
        {
            "$group": {
                "_id": "$student_id",
                "avg_score": {"$avg": "$current_difficulty"},
                "total_sessions": {"$count": {}},
                "topics": {"$addToSet": "$topic"},
            }
        },
        {
            "$project": {
                "student_id": "$_id",
                "_id": 0,
                "avg_score": {"$multiply": ["$avg_score", 100]},
                "total_sessions": 1,
                "topic_count": {"$size": "$topics"},
            }
        },
    ]

    try:
        cursor = sessions_col.aggregate(pipeline)
        progress_list = await cursor.to_list(length=500)
        return progress_list
    except Exception:
        return []
