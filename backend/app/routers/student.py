from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.personalization.schemas import LearningEventType
from app.services.personalization_service import get_personalization_service
from app.store.user_data_store import UserDataStore
from app.store.student_store import StudentStore
from app.dependencies import get_user_data_store, get_student_store
from .auth import get_current_user

router = APIRouter()


class QuizResultRequest(BaseModel):
    # user_id: str  <-- REMOVED (Security Fix)
    topic: Optional[str] = None
    difficulty: str
    score: float
    total_questions: Optional[int] = None
    correct_count: Optional[int] = None
    course_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


class NoteRequest(BaseModel):
    # user_id: str  <-- REMOVED (Security Fix)
    content: str


class EnrollmentRequest(BaseModel):
    course_id: str


class LessonCompletionRequest(BaseModel):
    course_id: str
    lesson_id: str


class ActivityLogRequest(BaseModel):
    course_id: str
    duration_minutes: int


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
    payload = request.model_dump()
    await store.add_quiz_attempt(current_user["id"], payload)
    await get_personalization_service().record_event(
        current_user["id"],
        LearningEventType.QUIZ_RESULT,
        payload=payload,
        source="student_router",
        course_id=request.course_id,
        topic_id=request.topic,
        role=current_user.get("role", "student"),
    )
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
    await get_personalization_service().record_event(
        current_user["id"],
        LearningEventType.NOTE_ADDED,
        payload={"content": request.content},
        source="student_router",
        role=current_user.get("role", "student"),
    )
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

    await get_personalization_service().record_event(
        current_user["id"],
        LearningEventType.LESSON_COMPLETED,
        payload={
            "lesson_id": request.lesson_id,
            "course_id": request.course_id,
            "progress": result.get("progress", 0),
        },
        source="student_router",
        course_id=request.course_id,
        role=current_user.get("role", "student"),
    )

    return {"status": "success", "message": "Lesson completed"}


@router.post("/log-activity")
async def log_activity(
    request: ActivityLogRequest,
    current_user: dict = Depends(get_current_user),
    store: StudentStore = Depends(get_student_store),
):
    """
    Log student activity time and update streak.
    """
    success = await store.log_activity(
        current_user["id"], request.course_id, request.duration_minutes
    )
    if not success:
        raise HTTPException(status_code=500, detail="Failed to log activity")

    await get_personalization_service().record_event(
        current_user["id"],
        LearningEventType.ACTIVITY_LOGGED,
        payload={
            "course_id": request.course_id,
            "duration_minutes": request.duration_minutes,
        },
        source="student_router",
        course_id=request.course_id,
        role=current_user.get("role", "student"),
    )

    return {"status": "success", "message": "Activity logged"}


@router.get("/test-user")
async def test_user(current_user: dict = Depends(get_current_user)):
    return current_user


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
):
    """
    Update profile data for the CURRENT student.
    """
    from app.store.user_store import UserStore
    user_store = UserStore()
    success = await user_store.update_user_fields(current_user["id"], data)
    
    if not success:
         raise HTTPException(status_code=500, detail="Failed to update profile")

    await get_personalization_service().record_event(
        current_user["id"],
        LearningEventType.PROFILE_UPDATED,
        payload={"updated_fields": list(data.keys())},
        source="student_router",
        role=current_user.get("role", "student"),
    )
    return {"status": "success", "message": "Profile updated", "data": data}


@router.get("/profile/analytics")
async def get_learner_analytics(
    current_user: dict = Depends(get_current_user),
):
    """
    Get deep learner analytics (cognitive load, engagement, behavior).
    """
    profile = await get_personalization_service().get_profile(
        current_user["id"], role=current_user.get("role", "student")
    )
    mastery_scores = [item.score for item in profile.mastery_state.values()]
    engagement_score = min(
        100,
        int(
            profile.engagement_summary.total_minutes
            + (profile.engagement_summary.current_streak * 5)
            + (profile.engagement_summary.total_lessons_completed * 2)
        ),
    )
    return {
        "userId": current_user["id"],
        "cognitiveLoad": profile.behavior_signals.get("cognitive_load", 50),
        "engagementScore": engagement_score,
        "behaviorLabel": profile.behavior_signals.get("behavior_label", "neutral"),
        "recentMasteryTrend": {topic: item.score for topic, item in profile.mastery_state.items()},
        "riskSummary": profile.risk_summary.model_dump(mode="json"),
        "overallMastery": round(sum(mastery_scores) / max(len(mastery_scores), 1), 2),
    }


@router.get("/profile/mastery")
async def get_mastery_projections(
    current_user: dict = Depends(get_current_user),
):
    """
    Get mastery projections based on BKT/DKT models.
    """
    profile = await get_personalization_service().get_profile(
        current_user["id"], role=current_user.get("role", "student")
    )
    mastery_map = {topic: item.score for topic, item in profile.mastery_state.items()}
    return {
        "masteryMap": mastery_map,
        "dktProjections": {},
        "overallMastery": round(
            sum(mastery_map.values()) / max(len(mastery_map), 1),
            2,
        ),
    }

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
    profile_data = await get_personalization_service().get_profile(
        current_user["id"], role=current_user.get("role", "student")
    )
    quiz_stats = await store.get_recent_quiz_stats(current_user["id"])
    dashboard_stats = await analytics.get_student_dashboard_stats(current_user["id"])
    notes = await store.get_notes(current_user["id"])
    display_name = current_user.get("name") or current_user.get("full_name")
    
    recent_activity = [
        {
            "type": "quiz",
            "title": item.get("topic") or item.get("course_id") or "Quiz Attempt",
            "description": (
                f"Score: {item.get('score', 0)}%"
                + (
                    f" on {item.get('difficulty')} difficulty"
                    if item.get("difficulty")
                    else ""
                )
            ),
            "timestamp": item.get("timestamp"),
        }
        for item in reversed(quiz_stats.get("recent_history", [])[-5:])
    ]

    return {
        "name": display_name,
        "username": current_user.get("username"),
        "email": current_user.get("email"),
        "phone": current_user.get("phone"),
        "avatar": current_user.get("avatar") or current_user.get("profile_image"),
        "bio": current_user.get("bio"),
        "skills": current_user.get("skills", []),
        "location": current_user.get("location"),
        "joinedDate": current_user.get("created_at"),
        "recentActivity": recent_activity,
        "stats": quiz_stats,
        "dashboard_stats": dashboard_stats,
        "learner_profile": profile_data.model_dump(mode="json"),
        "notes": notes,
        "user_info": {"name": display_name, "email": current_user.get("email")},
    }
