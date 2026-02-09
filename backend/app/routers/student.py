from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.store.user_data_store import UserDataStore
from app.store.student_store import StudentStore
from app.dependencies import get_user_data_store, get_student_store
from .auth import get_current_user

router = APIRouter()


class QuizResultRequest(BaseModel):
    # user_id: str  <-- REMOVED (Security Fix)
    topic: str
    score: float
    total_questions: int
    correct_count: int
    difficulty: str
    details: Optional[Dict[str, Any]] = None


class NoteRequest(BaseModel):
    # user_id: str  <-- REMOVED (Security Fix)
    content: str


class EnrollmentRequest(BaseModel):
    course_id: str


class LessonCompletionRequest(BaseModel):
    course_id: str
    lesson_id: str


@router.post("/quiz-result")
async def save_quiz_result(
    request: QuizResultRequest,
    current_user: dict = Depends(get_current_user),
    store: UserDataStore = Depends(get_user_data_store),
):
    """
    Save the result of a quiz attempt for the CURRENT user.
    """
    # Use ID from token, not request body
    await store.add_quiz_attempt(current_user["id"], request.dict())
    return {"status": "success", "message": "Quiz result saved"}


@router.post("/note")
async def save_note(
    request: NoteRequest,
    current_user: dict = Depends(get_current_user),
    store: UserDataStore = Depends(get_user_data_store),
):
    """
    Save a student note for the CURRENT user.
    """
    await store.add_note(current_user["id"], request.content)
    return {"status": "success", "message": "Note saved"}


@router.get("/dashboard")
async def get_student_dashboard(
    current_user: dict = Depends(get_current_user),
):
    """
    Get the full student dashboard data (courses, progress, stats).
    """
    from app.store.analytics_store import AnalyticsStore

    analytics = AnalyticsStore()

    dashboard_data = await analytics.get_student_full_dashboard(current_user["id"])

    if not dashboard_data:
        # Return empty structure if not found
        return {
            "currentStreak": 0,
            "enrolledCourses": [],
            "overallMastery": 0,
            "totalHours": 0,
            "badges": [],
        }

    return dashboard_data


@router.post("/enroll")
async def enroll_in_course(
    request: EnrollmentRequest,
    current_user: dict = Depends(get_current_user),
    store: StudentStore = Depends(get_student_store),
):
    """
    Enroll the CURRENT student in a course.
    """
    success = await store.enroll_in_course(current_user["id"], request.course_id)
    if not success:
        raise HTTPException(status_code=400, detail="Enrollment failed or already enrolled")

    return {"status": "success", "message": "Enrolled successfully"}


@router.post("/complete-lesson")
async def complete_lesson(
    request: LessonCompletionRequest,
    current_user: dict = Depends(get_current_user),
    store: StudentStore = Depends(get_student_store),
):
    """
    Mark a lesson as complete for the CURRENT student.
    """
    result = await store.complete_lesson(current_user["id"], request.course_id, request.lesson_id)
    if not result.get("success"):
        raise HTTPException(status_code=500, detail="Failed to mark lesson as complete")

    return {"status": "success", "message": "Lesson completed"}


@router.get("/badges")
async def get_badges(
    current_user: dict = Depends(get_current_user), store: StudentStore = Depends(get_student_store)
):
    """
    Get all badges for the CURRENT student.
    """
    return await store.get_badges(current_user["id"])


@router.get("/certificates")
async def get_certificates(
    current_user: dict = Depends(get_current_user), store: StudentStore = Depends(get_student_store)
):
    """
    Get all certificates for the CURRENT student.
    """
    return await store.get_certificates(current_user["id"])


@router.post("/profile/update")
async def update_profile(
    data: Dict[str, Any],
    current_user: dict = Depends(get_current_user),
    store: UserDataStore = Depends(get_user_data_store),
):
    """
    Update profile data for the CURRENT student.
    """
    # Logic to update user in DB
    # ... (simplistic for now)
    return {"status": "success", "message": "Profile updated"}


@router.get("/profile")  # Changed from /profile/{user_id}
async def get_profile(
    current_user: dict = Depends(get_current_user),
    store: UserDataStore = Depends(get_user_data_store),
):
    """
    Get the full profile for the CURRENT user.
    """
    from app.store.analytics_store import AnalyticsStore

    analytics = AnalyticsStore()

    quiz_stats = await store.get_recent_quiz_stats(current_user["id"])
    dashboard_stats = await analytics.get_student_dashboard_stats(current_user["id"])
    notes = await store.get_notes(current_user["id"])

    return {
        "stats": quiz_stats,
        "dashboard_stats": dashboard_stats,
        "notes": notes,
        "user_info": {"name": current_user.get("full_name"), "email": current_user.get("email")},
    }
