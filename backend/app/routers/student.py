import asyncio
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from app.personalization.schemas import (
    LearningEventType,
    QuizResultPayload,
    NoteAddedPayload,
    LessonCompletedPayload,
    ActivityLoggedPayload,
)
from app.services.personalization_service import get_personalization_service
from app.store.user_data_store import UserDataStore
from app.store.student_store import StudentStore
from app.store.assignment_store import AssignmentStore
from app.dependencies import get_user_data_store, get_student_store, get_assignment_store, get_analytics_store
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
    title: Optional[str] = "Untitled Note"
    subject: Optional[str] = "General"
    content: str


class EnrollmentRequest(BaseModel):
    course_id: str


class LessonCompletionRequest(BaseModel):
    course_id: str
    lesson_id: str


class ActivityLogRequest(BaseModel):
    course_id: str
    duration_minutes: int


def _parse_datetime(value: Any) -> Optional[datetime]:
    if value is None:
        return None
    if isinstance(value, datetime):
        parsed = value
    else:
        normalized = str(value).replace("Z", "+00:00")
        try:
            parsed = datetime.fromisoformat(normalized)
        except ValueError:
            return None

    if parsed.tzinfo is not None:
        return parsed.astimezone(timezone.utc).replace(tzinfo=None)
    return parsed


def _build_weekly_activity(events: List[Any]) -> List[Dict[str, Any]]:
    today = datetime.utcnow().date()
    buckets: Dict[str, Dict[str, Any]] = {}

    for offset in range(6, -1, -1):
        current_day = today - timedelta(days=offset)
        key = current_day.isoformat()
        buckets[key] = {
            "date": key,
            "label": current_day.strftime("%a"),
            "minutes": 0.0,
            "interactions": 0,
        }

    for event in events:
        event_at = _parse_datetime(getattr(event, "created_at", None))
        if event_at is None:
            continue
        bucket = buckets.get(event_at.date().isoformat())
        if bucket is None:
            continue

        bucket["interactions"] += 1
        if getattr(event, "event_type", None) == LearningEventType.ACTIVITY_LOGGED:
            bucket["minutes"] += float(event.payload.get("duration_minutes", 0) or 0)

    return [
        {
            **item,
            "minutes": round(item["minutes"], 2),
        }
        for item in buckets.values()
    ]


def _mastery_status(score_pct: float) -> str:
    if score_pct < 45:
        return "urgent"
    if score_pct < 70:
        return "developing"
    return "strong"


def _build_weak_topics(profile: Any) -> List[Dict[str, Any]]:
    weak_topic_ids = set(profile.weak_topics or [])
    mastery_items: List[Dict[str, Any]] = []

    for topic_id, item in profile.mastery_state.items():
        score_pct = round(item.score * 100, 2)
        mastery_items.append(
            {
                "topic": topic_id,
                "score": score_pct,
                "confidence": round(item.confidence * 100, 2),
                "attempts": item.attempts,
                "status": _mastery_status(score_pct),
                "isWeak": topic_id in weak_topic_ids or score_pct < 70,
            }
        )

    for topic_id in weak_topic_ids:
        if any(item["topic"] == topic_id for item in mastery_items):
            continue
        mastery_items.append(
            {
                "topic": topic_id,
                "score": 0.0,
                "confidence": 0.0,
                "attempts": 0,
                "status": "urgent",
                "isWeak": True,
            }
        )

    mastery_items.sort(
        key=lambda item: (
            0 if item["isWeak"] else 1,
            item["score"],
            item["topic"].lower(),
        )
    )
    return mastery_items[:6]


def _pick_resume_course(courses: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not courses:
        return None

    def course_sort_key(course: Dict[str, Any]):
        progress = float(course.get("progress", 0) or 0)
        last_accessed = _parse_datetime(course.get("lastAccessed"))
        return (
            0 if 0 < progress < 100 else 1,
            -(last_accessed.timestamp() if last_accessed else 0),
            -progress,
        )

    selected = sorted(courses, key=course_sort_key)[0]
    return {
        "id": selected.get("id"),
        "title": selected.get("name") or selected.get("title") or "Untitled Course",
        "description": selected.get("description"),
        "progress": round(float(selected.get("progress", 0) or 0), 2),
        "mastery": round(float(selected.get("mastery", 0) or 0), 2),
        "streak": int(selected.get("streak", 0) or 0),
        "href": f"/student/courses/{selected.get('id')}",
    }


async def _build_due_assignments(
    courses: List[Dict[str, Any]],
    student_id: str,
    store: AssignmentStore,
) -> List[Dict[str, Any]]:
    deduped: Dict[str, Dict[str, Any]] = {}
    course_map = {
        str(course.get("id")): (course.get("name") or course.get("title") or "Course")
        for course in courses
        if course.get("id")
    }
    now = datetime.utcnow()

    for course in courses:
        course_id = course.get("id")
        if not course_id:
            continue

        assignments = await store.list_assignments(str(course_id))
        for assignment in assignments:
            assignment_id = assignment.get("id")
            if not assignment_id or assignment_id in deduped:
                continue

            submission = await store.get_student_submission(assignment_id, student_id)
            due_at = _parse_datetime(assignment.get("due_date"))
            days_remaining = None
            if due_at is not None:
                days_remaining = (due_at.date() - now.date()).days

            status = "submitted" if submission else "pending"
            if not submission and days_remaining is not None:
                if days_remaining < 0:
                    status = "overdue"
                elif days_remaining <= 2:
                    status = "due_soon"

            deduped[assignment_id] = {
                "id": assignment_id,
                "title": assignment.get("title", "Untitled Assignment"),
                "description": assignment.get("description"),
                "courseId": assignment.get("course_id"),
                "courseName": course_map.get(str(assignment.get("course_id")), "Course"),
                "dueDate": assignment.get("due_date"),
                "daysRemaining": days_remaining,
                "status": status,
                "submitted": submission is not None,
                "submissionStatus": submission.get("status") if submission else None,
                "href": "/student/assignments",
            }

    results = list(deduped.values())
    results.sort(
        key=lambda item: (
            1 if item["submitted"] else 0,
            item["daysRemaining"] if item["daysRemaining"] is not None else 9999,
            item["title"].lower(),
        )
    )
    return results


def _build_next_action(
    due_assignments: List[Dict[str, Any]],
    weak_topics: List[Dict[str, Any]],
    resume_course: Optional[Dict[str, Any]],
    enrolled_courses: List[Dict[str, Any]],
    overall_mastery: float,
) -> Dict[str, Any]:
    overdue = next((item for item in due_assignments if item["status"] == "overdue"), None)
    if overdue:
        return {
            "title": f"Submit {overdue['title']}",
            "description": f"This assignment is overdue in {overdue['courseName']}. Clear it first to avoid losing momentum.",
            "ctaLabel": "Open Assignments",
            "href": overdue["href"],
            "priority": "critical",
            "kind": "assignment",
        }

    due_soon = next((item for item in due_assignments if item["status"] == "due_soon"), None)
    if due_soon:
        due_in = due_soon.get("daysRemaining")
        due_text = "today" if due_in == 0 else "tomorrow" if due_in == 1 else f"in {due_in} days"
        return {
            "title": f"Finish {due_soon['title']}",
            "description": f"Your next deadline is {due_text} in {due_soon['courseName']}. Submit it before moving to lower-priority tasks.",
            "ctaLabel": "Review Assignment",
            "href": due_soon["href"],
            "priority": "high",
            "kind": "assignment",
        }

    if weak_topics:
        topic = weak_topics[0]
        return {
            "title": f"Practice {topic['topic']}",
            "description": f"You are currently weakest in this topic at {round(topic['score'])}% mastery. A short tutor session is the fastest recovery path.",
            "ctaLabel": "Open AI Tutor",
            "href": "/student/ai_tutor",
            "priority": "high" if topic["status"] == "urgent" else "medium",
            "kind": "tutor",
        }

    if resume_course:
        return {
            "title": f"Resume {resume_course['title']}",
            "description": f"You are already {round(resume_course['progress'])}% through this course. Continue where you left off to keep your streak alive.",
            "ctaLabel": "Continue Course",
            "href": resume_course["href"],
            "priority": "medium",
            "kind": "course",
        }

    if not enrolled_courses:
        return {
            "title": "Start your first course",
            "description": "You do not have any active courses yet. Explore the catalog and begin building your personal learning path.",
            "ctaLabel": "Explore Catalog",
            "href": "/student/course_explorer",
            "priority": "medium",
            "kind": "explore",
        }

    return {
        "title": "Take a quick mastery check",
        "description": f"Your current overall mastery is {round(overall_mastery)}%. A short adaptive assessment will sharpen the next recommendations.",
        "ctaLabel": "Start Assessment",
        "href": "/student/assessment",
        "priority": "medium",
        "kind": "assessment",
    }


def _build_study_plan(
    due_assignments: List[Dict[str, Any]],
    weak_topics: List[Dict[str, Any]],
    resume_course: Optional[Dict[str, Any]],
    overall_mastery: float,
) -> List[Dict[str, Any]]:
    plan: List[Dict[str, Any]] = []

    for assignment in due_assignments:
        if assignment["submitted"]:
            continue
        plan.append(
            {
                "title": assignment["title"],
                "detail": f"{assignment['courseName']} assignment",
                "status": "urgent" if assignment["status"] in {"overdue", "due_soon"} else "planned",
                "href": assignment["href"],
                "ctaLabel": "Submit work",
                "kind": "assignment",
            }
        )
        if len(plan) >= 2:
            break

    for topic in weak_topics:
        if len(plan) >= 4:
            break
        plan.append(
            {
                "title": f"Review {topic['topic']}",
                "detail": f"{round(topic['score'])}% mastery, {round(topic['confidence'])}% confidence",
                "status": "focus" if topic["status"] == "urgent" else "recommended",
                "href": "/student/ai_tutor",
                "ctaLabel": "Practice now",
                "kind": "topic",
            }
        )
        if len(plan) >= 3:
            break

    if resume_course and len(plan) < 4:
        plan.append(
            {
                "title": f"Continue {resume_course['title']}",
                "detail": f"{round(resume_course['progress'])}% complete",
                "status": "recommended",
                "href": resume_course["href"],
                "ctaLabel": "Resume course",
                "kind": "course",
            }
        )

    if len(plan) < 4:
        plan.append(
            {
                "title": "Run a mastery check",
                "detail": f"Current overall mastery: {round(overall_mastery)}%",
                "status": "recommended",
                "href": "/student/assessment",
                "ctaLabel": "Start assessment",
                "kind": "assessment",
            }
        )

    return plan[:4]


def _build_coach_insight(
    profile: Any,
    interventions: List[Any],
    weak_topics: List[Dict[str, Any]],
) -> Dict[str, Any]:
    def intervention_status(item: Any) -> str:
        status = getattr(item, "status", None)
        return getattr(status, "value", status or "")

    def intervention_priority(item: Any) -> str:
        priority = getattr(item, "priority", None)
        return getattr(priority, "value", priority or "medium")

    open_intervention = next(
        (item for item in interventions if intervention_status(item) == "open"),
        None,
    )
    if open_intervention:
        return {
            "title": "Learning coach insight",
            "summary": open_intervention.reason,
            "priority": intervention_priority(open_intervention),
            "actionLabel": "Start remediation",
            "href": "/student/ai_tutor",
        }

    if weak_topics:
        topic = weak_topics[0]
        return {
            "title": "Focus area detected",
            "summary": f"{topic['topic']} needs reinforcement. Start with worked examples before attempting a harder assessment.",
            "priority": "medium" if topic["status"] == "urgent" else "low",
            "actionLabel": "Practice with tutor",
            "href": "/student/ai_tutor",
        }

    return {
        "title": "Steady momentum",
        "summary": f"Your learner profile is currently marked as {profile.behavior_signals.get('behavior_label', 'steady')}. Keep your streak active with one focused session today.",
        "priority": "low",
        "actionLabel": "Resume learning",
        "href": "/student/courses",
    }


def _build_achievement_summary(
    current_streak: int,
    overall_mastery: float,
    enrolled_courses: List[Dict[str, Any]],
    badges: List[Any],
) -> Dict[str, Any]:
    completed_courses = len(
        [course for course in enrolled_courses if float(course.get("progress", 0) or 0) >= 100]
    )
    highlights = [
        {
            "title": "Consistency streak",
            "detail": f"{current_streak} day streak",
            "completed": current_streak >= 3,
        },
        {
            "title": "Mastery builder",
            "detail": f"{round(overall_mastery)}% overall mastery",
            "completed": overall_mastery >= 75,
        },
        {
            "title": "Course finisher",
            "detail": f"{completed_courses} courses completed",
            "completed": completed_courses >= 1,
        },
    ]
    next_milestone = next(
        (item["title"] for item in highlights if not item["completed"]),
        "Keep the streak alive",
    )
    unlocked_count = len(badges or []) + len([item for item in highlights if item["completed"]])
    return {
        "badgeCount": len(badges or []),
        "unlockedCount": unlocked_count,
        "nextMilestone": next_milestone,
        "highlights": highlights,
    }


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
        payload=QuizResultPayload(**payload).model_dump(exclude_none=True),
        source="student_router",
        course_id=request.course_id,
        topic_id=request.topic,
        role=current_user.get("role", "student"),
    )
    return {"status": "success", "message": "Quiz result saved"}


@router.get("/notes")
async def get_notes(
    current_user: dict = Depends(get_current_user),
    store: UserDataStore = Depends(get_user_data_store),
):
    """
    Get all notes for the CURRENT user.
    """
    return await store.get_notes(current_user["id"])


@router.post("/notes")
async def save_note(
    request: NoteRequest,
    current_user: dict = Depends(get_current_user),
    store: UserDataStore = Depends(get_user_data_store),
):
    """
    Save a student note for the CURRENT user.
    """
    # Note: add_note was updated to support ID generation, title, and subject
    note = await store.add_note(
        current_user["id"], 
        request.content, 
        title=request.title, 
        subject=request.subject
    )
    
    if not note:
        raise HTTPException(status_code=500, detail="Failed to save note")

    await get_personalization_service().record_event(
        current_user["id"],
        LearningEventType.NOTE_ADDED,
        payload=NoteAddedPayload(
            title=request.title,
            subject=request.subject,
            content=request.content,
        ).model_dump(exclude_none=True),
        source="student_router",
        role=current_user.get("role", "student"),
    )
    return {"status": "success", "success": True, "id": note["id"], "message": "Note saved"}


@router.put("/notes/{note_id}")
async def update_note(
    note_id: str,
    request: NoteRequest,
    current_user: dict = Depends(get_current_user),
    store: UserDataStore = Depends(get_user_data_store),
):
    """
    Update an existing note for the CURRENT user.
    """
    success = await store.update_note(
        current_user["id"], 
        note_id, 
        request.content, 
        title=request.title, 
        subject=request.subject
    )
    if not success:
        raise HTTPException(status_code=404, detail="Note not found")
    
    return {"status": "success", "message": "Note updated"}


@router.delete("/notes/{note_id}")
async def delete_note(
    note_id: str,
    current_user: dict = Depends(get_current_user),
    store: UserDataStore = Depends(get_user_data_store),
):
    """
    Delete a note for the CURRENT user.
    """
    success = await store.delete_note(current_user["id"], note_id)
    if not success:
        raise HTTPException(status_code=404, detail="Note not found")
    
    return {"status": "success", "message": "Note deleted"}


@router.get("/dashboard")
async def get_student_dashboard(
    current_user: dict = Depends(get_current_user),
    analytics: AnalyticsStore = Depends(get_analytics_store),
    assignment_store: AssignmentStore = Depends(get_assignment_store),
):
    """
    Get the full student dashboard data (courses, progress, stats).
    """
    personalization = get_personalization_service()

    dashboard_data = await analytics.get_student_full_dashboard(current_user["id"])

    if not dashboard_data:
        # Return empty structure if not found
        dashboard_data = {
            "currentStreak": 0,
            "enrolledCourses": [],
            "overallMastery": 0,
            "totalHours": 0,
            "badges": [],
        }

    profile, interventions, events = await asyncio.gather(
        personalization.get_profile(current_user["id"], role=current_user.get("role", "student")),
        personalization.get_interventions(user_id=current_user["id"]),
        personalization.store.list_events(current_user["id"], limit=120),
    )

    enrolled_courses = dashboard_data.get("enrolledCourses", [])
    weak_topics = _build_weak_topics(profile)
    weekly_activity = _build_weekly_activity(events)
    due_assignments = await _build_due_assignments(enrolled_courses, current_user["id"], assignment_store)
    resume_course = _pick_resume_course(enrolled_courses)
    next_action = _build_next_action(
        due_assignments,
        weak_topics,
        resume_course,
        enrolled_courses,
        float(dashboard_data.get("overallMastery", 0) or 0),
    )
    today_plan = _build_study_plan(
        due_assignments,
        weak_topics,
        resume_course,
        float(dashboard_data.get("overallMastery", 0) or 0),
    )
    coach_insight = _build_coach_insight(profile, interventions, weak_topics)
    mastery_breakdown = [
        {
            "topic": item["topic"],
            "score": item["score"],
            "confidence": item["confidence"],
            "attempts": item["attempts"],
            "status": item["status"],
        }
        for item in weak_topics
    ]
    pending_assignments = len([item for item in due_assignments if not item["submitted"]])
    weekly_minutes = round(sum(item["minutes"] for item in weekly_activity), 2)
    display_name = (
        current_user.get("full_name")
        or current_user.get("name")
        or current_user.get("email", "Scholar").split("@")[0]
    )

    dashboard_data.update(
        {
            "studentName": display_name,
            "weeklyActivity": weekly_activity,
            "weeklyMinutes": weekly_minutes,
            "pendingAssignments": pending_assignments,
            "dueAssignments": due_assignments[:5],
            "nextAction": next_action,
            "todayPlan": today_plan,
            "weakTopics": weak_topics,
            "masteryBreakdown": mastery_breakdown,
            "resumeCourse": resume_course,
            "coachInsight": coach_insight,
            "learningSignals": {
                "behaviorLabel": profile.behavior_signals.get("behavior_label", "neutral"),
                "cognitiveLoad": profile.behavior_signals.get("cognitive_load", 50),
                "riskLevel": profile.risk_summary.risk_level,
                "riskScore": round(profile.risk_summary.risk_score * 100, 2),
                "reasons": profile.risk_summary.reasons,
                "engagementScore": min(
                    100,
                    int(
                        profile.engagement_summary.total_minutes
                        + (profile.engagement_summary.current_streak * 5)
                        + (profile.engagement_summary.total_lessons_completed * 2)
                    ),
                ),
                "recentAverageScore": round(profile.performance_summary.recent_average_score, 2),
            },
            "achievementSummary": _build_achievement_summary(
                int(dashboard_data.get("currentStreak", 0) or 0),
                float(dashboard_data.get("overallMastery", 0) or 0),
                enrolled_courses,
                dashboard_data.get("badges", []),
            ),
            "openInterventions": len(
                [
                    item
                    for item in interventions
                    if getattr(getattr(item, "status", None), "value", getattr(item, "status", None))
                    == "open"
                ]
            ),
        }
    )

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
        payload=LessonCompletedPayload(
            lesson_id=request.lesson_id,
            course_id=request.course_id,
            progress=result.get("progress", 0),
        ).model_dump(exclude_none=True),
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
        payload=ActivityLoggedPayload(
            course_id=request.course_id,
            duration_minutes=request.duration_minutes,
        ).model_dump(exclude_none=True),
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
    store: UserDataStore = Depends(get_user_data_store),
):
    """
    Update profile data for the CURRENT student.
    """
    from app.store.user_store import UserStore

    user_store = UserStore()

    user_fields = {}
    for field in ("name", "phone"):
        if field in data:
            user_fields[field] = data[field]

    profile_settings = {
        key: value
        for key, value in data.items()
        if key
        in {
            "username",
            "avatar",
            "bio",
            "location",
            "language",
            "preferences",
            "notification_preferences",
            "security_preferences",
            "privacy_settings",
        }
    }

    if user_fields:
        success = await user_store.update_user_fields(current_user["id"], user_fields)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update profile")

    saved_settings = {}
    if profile_settings:
        saved_settings = await store.update_profile_settings(current_user["id"], profile_settings)
        if not saved_settings:
            raise HTTPException(status_code=500, detail="Failed to update profile settings")

    await get_personalization_service().record_event(
        current_user["id"],
        LearningEventType.PROFILE_UPDATED,
        payload={"updated_fields": list(user_fields.keys()) + list(profile_settings.keys())},
        source="student_router",
        role=current_user.get("role", "student"),
    )
    return {
        "status": "success",
        "message": "Profile updated",
        "data": {
            **user_fields,
            **saved_settings,
        },
    }


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
    profile_settings = await store.get_profile_settings(current_user["id"])
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
        "username": profile_settings.get("username") or current_user.get("username"),
        "email": current_user.get("email"),
        "phone": current_user.get("phone"),
        "avatar": profile_settings.get("avatar")
        or current_user.get("avatar")
        or current_user.get("profile_image"),
        "bio": profile_settings.get("bio") or current_user.get("bio"),
        "skills": current_user.get("skills", []),
        "location": profile_settings.get("location") or current_user.get("location"),
        "language": profile_settings.get("language") or current_user.get("language"),
        "preferences": profile_settings.get("preferences") or current_user.get("preferences", {}),
        "notification_preferences": profile_settings.get("notification_preferences")
        or current_user.get("notification_preferences", {}),
        "security_preferences": profile_settings.get("security_preferences")
        or current_user.get("security_preferences", {}),
        "privacy_settings": profile_settings.get("privacy_settings")
        or current_user.get("privacy_settings", {}),
        "joinedDate": current_user.get("created_at"),
        "recentActivity": recent_activity,
        "stats": quiz_stats,
        "dashboard_stats": dashboard_stats,
        "learner_profile": profile_data.model_dump(mode="json"),
        "notes": notes,
        "user_info": {"name": display_name, "email": current_user.get("email")},
    }
