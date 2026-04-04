import asyncio
import json
from collections import defaultdict
from datetime import datetime, timedelta, timezone
import structlog
logger = structlog.get_logger()
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from app.store.redis_client import redis_client
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
from app.store.analytics_store import AnalyticsStore
from app.dependencies import get_user_data_store, get_student_store, get_assignment_store, get_analytics_store
from app.api.deps import get_current_student as get_current_user
from app.database.supabase_manager import supabase_db
from app.database.scoped_db import get_scoped_db
from app.services.risk_service import get_risk_analysis_service
from app.services.student_analytics import compute_student_analytics
from app.core.audit import audit_logger
import uuid
import secrets

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


class StudentOnboardingCompleteRequest(BaseModel):
    class_id: Optional[str] = None
    subject_ids: List[str] = []
    learning_styles: List[str] = []
    skill_levels: Dict[str, float] = {}
    goal: str
    device_type: str
    internet_type: str
    consents: Dict[str, bool]
    batch_confirmed: bool = False
    batch_confirmation_note: Optional[str] = None


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


def _clamp_unit_interval(value: Any, default: float = 0.5) -> float:
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return default
    return max(0.0, min(1.0, numeric))


def _pick_preferred_class(class_rows: List[Dict[str, Any]], user_section: Optional[str]) -> Optional[Dict[str, Any]]:
    if not class_rows:
        return None

    normalized_section = str(user_section or "").strip().lower()
    if normalized_section:
        for row in class_rows:
            row_section = str(row.get("section") or row.get("section_name") or "").strip().lower()
            if row_section == normalized_section:
                return row

    if len(class_rows) == 1:
        return class_rows[0]

    return None


def _build_weekly_activity(events: List[Any]) -> List[Dict[str, Any]]:
    today = datetime.now(timezone.utc).date()
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
            payload = getattr(event, "payload", None) or {}
            bucket["minutes"] += float(payload.get("duration_minutes", 0) or 0)

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
    now = datetime.now(timezone.utc).replace(tzinfo=None)

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
    db = get_scoped_db(current_user)
    await store.add_quiz_attempt(current_user["id"], payload)
    await get_personalization_service(db=db).record_event(
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

    db = get_scoped_db(current_user)
    await get_personalization_service(db=db).record_event(
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
    cache_key = f"dashboard:student:{current_user['id']}"
    try:
        cached = await redis_client.get(cache_key)
        if cached:
            return json.loads(cached)
    except Exception:
        pass

    db = get_scoped_db(current_user)
    personalization = get_personalization_service(db=db)

    analytics_scoped = AnalyticsStore(db=db)
    dashboard_data = await analytics_scoped.get_student_full_dashboard(current_user["id"])

    if not dashboard_data:
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
        personalization.store.list_events(current_user["id"], limit=100),
    )

    enrolled_courses = dashboard_data.get("enrolledCourses", [])
    weak_topics = _build_weak_topics(profile)
    weekly_activity = _build_weekly_activity(events)
    assignment_store_scoped = AssignmentStore(db=db)
    due_assignments = await _build_due_assignments(enrolled_courses, current_user["id"], assignment_store_scoped)
    resume_course = _pick_resume_course(enrolled_courses)

    # ── AI Analytics (tier, pattern, growth) ──────────────────────────────────
    ai_analytics = profile.metadata.get("ai_analytics") or {}
    if not ai_analytics:
        try:
            ai_analytics = compute_student_analytics(profile, events)
            profile.metadata["ai_analytics"] = ai_analytics
            asyncio.ensure_future(personalization.store.upsert_profile(profile))
        except Exception as _ae:
            logger.warning("dashboard_analytics_failed", error=str(_ae))
            ai_analytics = {}

    next_action = _build_next_action(
        due_assignments,
        weak_topics,
        resume_course,
        enrolled_courses,
        float(dashboard_data.get("overallMastery", 0) or 0),
    )
    coach_insight = _build_coach_insight(profile, interventions, weak_topics)
    
    display_name = (
        current_user.get("full_name")
        or current_user.get("name")
        or current_user.get("email", "Scholar").split("@")[0]
    )

    result = {
        "stats": [
            {"label": "Overall Mastery", "value": f"{dashboard_data.get('overallMastery', 0)}%", "trend": "+2%", "icon": "GraduationCap"},
            {"label": "Current Streak", "value": f"{dashboard_data.get('currentStreak', 0)} days", "trend": "Stable", "icon": "Flame"},
            {"label": "Learning Hours", "value": f"{dashboard_data.get('totalHours', 0)}h", "trend": "+5h", "icon": "Clock"},
            {"label": "Badges Earned", "value": str(len(dashboard_data.get("badges", []))), "trend": "New!", "icon": "Award"},
        ],
        "alerts": [
            {
                "id": str(i.id),
                "type": "warning" if i.priority in ["high", "critical"] else "info",
                "title": i.recommended_action,
                "description": i.reason,
                "priority": i.priority,
            }
            for i in interventions if i.status == "open"
        ] + [
            {
                "id": f"assignment-{a['id']}",
                "type": "deadline",
                "title": f"Due Soon: {a['title']}",
                "description": f"Due in {a['days_until']} days",
                "priority": "high" if a['days_until'] <= 2 else "medium",
            }
            for a in due_assignments if a.get('days_until') is not None and a['days_until'] <= 5
        ],
        "charts": {
            "masteryHistory": [
                {"date": s.recorded_at.isoformat(), "score": round(s.readiness * 100, 1)}
                for s in profile.kpi_history[-14:]
            ],
            "engagement": weekly_activity
        },
            "feed": [
                {
                    "id": str(getattr(e, "id", e.get("id") if isinstance(e, dict) else None)),
                    "type": getattr(getattr(e, "event_type", e.get("event_type") if isinstance(e, dict) else ""), "value", getattr(e, "event_type", e.get("event_type") if isinstance(e, dict) else "")),
                    "title": str(getattr(getattr(e, "event_type", e.get("event_type") if isinstance(e, dict) else ""), "value", getattr(e, "event_type", e.get("event_type") if isinstance(e, dict) else ""))).replace("_", " ").title(),
                    "time": getattr(e, "created_at", e.get("created_at") if isinstance(e, dict) else None).isoformat() if hasattr(getattr(e, "created_at", e.get("created_at") if isinstance(e, dict) else None), "isoformat") else getattr(e, "created_at", e.get("created_at") if isinstance(e, dict) else None),
                    "meta": getattr(e, "payload", e.get("payload") if isinstance(e, dict) else {})
                }
                for e in events
            ],
        "meta": {
            "studentName": display_name,
            "riskLevel": profile.risk_summary.risk_level,
            "nextAction": next_action,
            "coachInsight": coach_insight,
            "enrolledCourses": enrolled_courses,
            "resumeCourse": resume_course,
        },
        # ── AI Analytics block (consumed by dashboard + AI Tutor) ──────────
        "aiAnalytics": {
            "tier":               ai_analytics.get("tier", "developing"),
            "tierScore":          ai_analytics.get("tier_score", 0),
            "growthTrend":        ai_analytics.get("growth_trend", "plateauing"),
            "growthVelocity":     ai_analytics.get("growth_velocity", 0),
            "studyPattern":       ai_analytics.get("study_pattern", "inactive"),
            "studyPatternDetail": ai_analytics.get("study_pattern_detail", ""),
            "recommendedSection": ai_analytics.get("recommended_section", "C"),
            "scoreBreakdown":     ai_analytics.get("score_breakdown", {}),
            "topStrengths":       ai_analytics.get("top_strengths", []),
            "topWeaknesses":      ai_analytics.get("top_weaknesses", []),
            "riskFlags":          ai_analytics.get("risk_flags", []),
            "computedAt":         ai_analytics.get("computed_at"),
        },
    }

    try:
        await redis_client.setex(cache_key, 300, json.dumps(result, default=str))
    except Exception:
        pass

    return result


# ── AI Analytics endpoint ──────────────────────────────────────────────────────

@router.get("/analytics")
async def get_student_analytics(
    current_user: dict = Depends(get_current_user),
):
    """
    Returns AI-computed analytics for the authenticated student:
      - Performance tier (struggling / developing / proficient / advanced)
      - Study pattern (consistent / cramming / bursty / declining / inactive)
      - Growth trend (improving / plateauing / declining) + weekly velocity
      - Recommended section (A / B / C / D)
      - Score breakdown across quiz, assessment, assignment
      - Top strengths and weaknesses (concept-level)
      - Risk flags for student + teacher visibility

    Results are computed fresh each call (≤50 ms) and cached for 5 minutes.
    """
    cache_key = f"analytics:student:{current_user['id']}"
    try:
        cached = await redis_client.get(cache_key)
        if cached:
            return json.loads(cached)
    except Exception:
        pass

    db = get_scoped_db(current_user)
    personalization = get_personalization_service(db=db)

    profile, events = await asyncio.gather(
        personalization.get_profile(current_user["id"], role=current_user.get("role", "student")),
        personalization.store.list_events(current_user["id"], limit=100),
    )

    analytics = compute_student_analytics(profile, events)

    # Persist back into profile metadata so other services can read it
    try:
        profile.metadata["ai_analytics"] = analytics
        await personalization.store.upsert_profile(profile)
    except Exception as exc:
        logger.warning("analytics_persist_failed", user_id=current_user["id"], error=str(exc))

    # Cache for 5 minutes
    try:
        await redis_client.setex(cache_key, 300, json.dumps(analytics, default=str))
    except Exception:
        pass

    return analytics


@router.post("/activity")
async def log_student_activity(
    request: ActivityLogRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Log a study session activity event.
    Triggers analytics recomputation in background so dashboard reflects updated
    pattern + growth after each session.
    """
    student_id = current_user["id"]
    db = get_scoped_db(current_user)
    personalization = get_personalization_service(db=db)

    await personalization.record_event(
        student_id,
        LearningEventType.ACTIVITY_LOGGED,
        payload=ActivityLoggedPayload(
            course_id=request.course_id,
            duration_minutes=request.duration_minutes,
        ).model_dump(exclude_none=True),
        source="student_router",
        course_id=request.course_id,
        role=current_user.get("role", "student"),
    )

    # Invalidate analytics + dashboard cache so next fetch is fresh
    try:
        await asyncio.gather(
            redis_client.delete(f"analytics:student:{student_id}"),
            redis_client.delete(f"dashboard:student:{student_id}"),
        )
    except Exception:
        pass

    return {"status": "success", "message": "Activity logged"}


@router.post("/enroll")
async def enroll_in_course(
    request: EnrollmentRequest,
    current_user: dict = Depends(get_current_user),
    store: StudentStore = Depends(get_student_store),
):
    """
    Enroll the CURRENT student in a course.
    """
    db = get_scoped_db(current_user)
    student_store = StudentStore(db=db)
    success = await student_store.enroll_in_course(current_user["id"], request.course_id)
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
    db = get_scoped_db(current_user)
    student_store = StudentStore(db=db)
    result = await student_store.complete_lesson(current_user["id"], request.course_id, request.lesson_id)
    if not result.get("success"):
        raise HTTPException(status_code=500, detail="Failed to mark lesson as complete")

    await get_personalization_service(db=db).record_event(
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
    db = get_scoped_db(current_user)
    student_store = StudentStore(db=db)
    success = await student_store.log_activity(
        current_user["id"], request.course_id, request.duration_minutes
    )
    if not success:
        raise HTTPException(status_code=500, detail="Failed to log activity")

    await get_personalization_service(db=db).record_event(
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
    db = get_scoped_db(current_user)
    student_store = StudentStore(db=db)
    return await student_store.get_badges(current_user["id"])


@router.get("/certificates")
async def get_certificates(
    current_user: dict = Depends(get_current_user), store: StudentStore = Depends(get_student_store)
):
    """
    Get all certificates for the CURRENT student.
    """
    db = get_scoped_db(current_user)
    student_store = StudentStore(db=db)
    return await student_store.get_certificates(current_user["id"])


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

    db = get_scoped_db(current_user)
    user_store = UserStore(db=db)
    user_data_store = UserDataStore(db=db)

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
        saved_settings = await user_data_store.update_profile_settings(current_user["id"], profile_settings)
        if not saved_settings:
            raise HTTPException(status_code=500, detail="Failed to update profile settings")

    await get_personalization_service(db=db).record_event(
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
    db = get_scoped_db(current_user)
    profile = await get_personalization_service(db=db).get_profile(
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
    db = get_scoped_db(current_user)
    profile = await get_personalization_service(db=db).get_profile(
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
):
    """
    Get the full profile for the CURRENT user.
    """
    from app.store.analytics_store import AnalyticsStore

    db = get_scoped_db(current_user)
    user_data_store = UserDataStore(db=db)
    analytics = AnalyticsStore(db=db)
    profile_data = await get_personalization_service(db=db).get_profile(
        current_user["id"], role=current_user.get("role", "student")
    )
    quiz_stats = await user_data_store.get_recent_quiz_stats(current_user["id"])
    profile_settings = await user_data_store.get_profile_settings(current_user["id"])
    dashboard_stats = await analytics.get_student_dashboard_stats(current_user["id"])
    notes = await user_data_store.get_notes(current_user["id"])
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


@router.get("/leaderboard")
async def get_leaderboard(
    timeframe: str = "weekly",
    current_user: dict = Depends(get_current_user),
):
    """
    Returns a ranked leaderboard of students ordered by computed XP from learner_events.
    """
    db = get_scoped_db(current_user)
    client = db.get_client()
    entries: List[Dict[str, Any]] = []

    if client:
        try:
            events_res = (
                client.table("learner_events")
                .select("user_id, event_type, payload")
                .order("created_at", desc=True)
                .limit(2000)
                .execute()
            )
            events = events_res.data or []

            xp_map: Dict[str, int] = defaultdict(int)
            for ev in events:
                uid = ev.get("user_id")
                if not uid:
                    continue
                ev_type = ev.get("event_type", "")
                payload = ev.get("payload") or {}
                if ev_type == "quiz_submitted":
                    xp_map[uid] += max(0, int(float(payload.get("score", 0)) * 1.5))
                elif ev_type == "lesson_completed":
                    xp_map[uid] += 50
                elif ev_type == "activity_logged":
                    xp_map[uid] += min(int(payload.get("duration_minutes", 0)), 60)

            top_user_ids = sorted(xp_map, key=lambda u: xp_map[u], reverse=True)[:50]

            if top_user_ids:
                users_res = (
                    client.table("users")
                    .select("id, name, full_name, avatar")
                    .in_("id", top_user_ids)
                    .execute()
                )
                user_info = {u["id"]: u for u in (users_res.data or [])}

                streak_map: Dict[str, int] = defaultdict(int)
                progress_res = (
                    client.table("progress")
                    .select("user_id, streak")
                    .in_("user_id", top_user_ids)
                    .execute()
                )
                for p in (progress_res.data or []):
                    uid = p["user_id"]
                    streak_map[uid] = max(streak_map[uid], p.get("streak") or 0)

                for rank, uid in enumerate(top_user_ids, start=1):
                    u = user_info.get(uid, {})
                    display = u.get("name") or u.get("full_name") or "Anonymous"
                    entries.append({
                        "rank": rank,
                        "userId": uid,
                        "name": display,
                        "avatar": u.get("avatar") or f"https://ui-avatars.com/api/?name={display}&background=random",
                        "xp": xp_map[uid],
                        "streak": streak_map.get(uid, 0),
                        "isCurrentUser": uid == current_user.get("id"),
                    })
        except Exception as exc:
            log.warning("leaderboard_fetch_failed", error=str(exc))

    if not entries:
        name = current_user.get("name") or current_user.get("full_name") or "You"
        entries = [{
            "rank": 1,
            "userId": current_user.get("id"),
            "name": name,
            "avatar": current_user.get("avatar") or f"https://ui-avatars.com/api/?name={name}&background=random",
            "xp": 0,
            "streak": 0,
            "isCurrentUser": True,
        }]

    return {"timeframe": timeframe, "entries": entries}


@router.get("/subjects")
async def list_student_subjects(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Student access required")
    student_id = current_user.get("id")
    db = get_scoped_db(current_user)
    client = db.get_client()
    enrollment_rows = (
        client.table("enrollments")
        .select("*")
        .eq("student_id", student_id)
        .execute()
        .data
        or []
    )
    enrollment_by_course = {
        str(row.get("course_id")): row
        for row in enrollment_rows
        if row.get("course_id")
    }

    subject_rows = (
        client.table("student_subjects")
        .select("subject_id")
        .eq("student_id", student_id)
        .execute()
        .data
        or []
    )
    subject_ids = {
        str(s["subject_id"])
        for s in subject_rows
        if s.get("subject_id")
    } | set(enrollment_by_course.keys())

    if not subject_ids:
        return []

    courses_res = client.table("courses").select("*").in_("id", list(subject_ids)).execute()
    courses = courses_res.data or []

    # attach faculty if assignment exists for student's batch/section
    batch_id = current_user.get("batch_id")
    section = current_user.get("section")
    assignments = (
        client.table("teacher_assignments")
        .select("course_id, teacher_id")
        .eq("batch_id", batch_id)
        .eq("section", section)
        .execute()
    )
    teacher_ids = [a["teacher_id"] for a in (assignments.data or []) if a.get("teacher_id")]
    teachers = (
        client.table("users").select("id, full_name, email").in_("id", teacher_ids).execute()
        if teacher_ids
        else None
    )
    teacher_lookup = {t["id"]: t for t in (teachers.data or [])} if teachers else {}
    assign_lookup = {a["course_id"]: a for a in (assignments.data or [])}

    results = []
    for course in courses:
        assign = assign_lookup.get(course.get("id"))
        teacher = teacher_lookup.get(assign.get("teacher_id")) if assign else None
        progress_data = (enrollment_by_course.get(str(course.get("id"))) or {}).get("progress") or {}
        results.append({
            "id": course.get("id"),
            "name": course.get("course_name") or course.get("name") or course.get("title"),
            "code": course.get("code") or course.get("course_code"),
            "description": course.get("description"),
            "thumbnail": course.get("thumbnail_url") or course.get("thumbnail"),
            "credits": course.get("credits"),
            "semester": course.get("semester"),
            "type": course.get("type") or course.get("category"),
            "facultyName": teacher.get("full_name") if teacher else None,
            "facultyEmail": teacher.get("email") if teacher else None,
            "assignedSection": section,
            "progress": float(progress_data.get("percentage", 0) or 0),
            "mastery": float(progress_data.get("mastery", 0) or 0),
            "streak": int(progress_data.get("streak", 0) or 0),
            "hoursSpent": float(progress_data.get("hoursSpent", 0) or 0),
            "lastAccessed": progress_data.get("lastAccessed"),
            "status": (enrollment_by_course.get(str(course.get("id"))) or {}).get("status", "active"),
        })
    results.sort(key=lambda item: ((item.get("progress") or 0) <= 0, str(item.get("name") or "").lower()))
    return results


@router.get("/onboarding/options")
async def get_student_onboarding_options(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Student access required")

    student_id = current_user.get("id")
    dept_id = current_user.get("dept_id") or current_user.get("department_id")
    batch_id = current_user.get("batch_id")
    db = get_scoped_db(current_user)
    client = db.get_client()
    if client is None:
        return {
            "classes": [],
            "subjects": [],
            "selectedSubjectIds": [],
            "currentEnrollment": None
        }

    batch = await db.fetch_one("batches", {"id": batch_id}) if batch_id else None

    class_rows: List[Dict[str, Any]] = []
    try:
        class_query = client.table("classes").select("*")
        if dept_id:
            class_query = class_query.eq("department_id", dept_id)
        if batch_id:
            class_query = class_query.eq("batch_id", batch_id)
        class_rows = class_query.execute().data or []
    except Exception:
        if dept_id:
            class_rows = client.table("classes").select("*").eq("department_id", dept_id).execute().data or []

    if current_user.get("section"):
        user_section = str(current_user.get("section"))
        class_rows.sort(
            key=lambda row: (
                0 if str(row.get("section") or row.get("section_name") or "") == user_section else 1,
                str(row.get("class_name") or row.get("section_name") or ""),
            )
        )

    semester = batch.get("current_semester") if batch else None
    subjects: List[Dict[str, Any]] = []
    if dept_id and semester:
        subjects = await db.fetch_all("courses", {"department_id": dept_id, "semester": semester})

    selected_subjects = (
        client.table("student_subjects")
        .select("subject_id")
        .eq("student_id", student_id)
        .execute()
        .data
        or []
    )
    selected_subject_ids = [row["subject_id"] for row in selected_subjects if row.get("subject_id")]

    _enroll_res = (
        client.table("student_enrollments")
        .select("*")
        .eq("student_id", student_id)
        .maybe_single()
        .execute()
    )
    enrollment = _enroll_res.data if _enroll_res is not None else None

    _profile_res = (
        client.table("learner_profiles")
        .select("*")
        .eq("user_id", student_id)
        .maybe_single()
        .execute()
    )
    learner_profile = _profile_res.data if _profile_res is not None else None

    try:
        _mastery_res = (
            client.table("skill_mastery")
            .select("course_id, mastery_score, skill_name")
            .eq("user_id", student_id)
            .eq("skill_name", "initial_self_assessment")
            .execute()
        )
        mastery_rows = (_mastery_res.data if _mastery_res is not None else None) or []
    except Exception:
        mastery_rows = []
    skill_levels = {
        str(row["course_id"]): float(row.get("mastery_score") or 0)
        for row in mastery_rows
        if row.get("course_id")
    }

    preferred_class = _pick_preferred_class(class_rows, current_user.get("section"))
    issues = {
        "missingDepartmentLink": not bool(dept_id),
        "missingBatchLink": not bool(batch_id),
        "missingSubjects": len(subjects) == 0,
        "missingClasses": len(class_rows) == 0,
        "missingProgramLink": not bool(
            (enrollment or {}).get("program_id")
            or (preferred_class or {}).get("program_id")
        ),
    }

    return {
        "batch": batch,
        "classes": class_rows,
        "subjects": subjects,
        "selectedSubjectIds": selected_subject_ids,
        "enrollment": enrollment,
        "learnerProfile": learner_profile,
        "skillLevels": skill_levels,
        "section": current_user.get("section"),
        "preferredClassId": (preferred_class or {}).get("id"),
        "issues": issues,
    }


@router.post("/onboarding/complete")
async def complete_student_onboarding(
    payload: StudentOnboardingCompleteRequest,
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Student access required")

    student_id = current_user.get("id")
    dept_id = current_user.get("dept_id") or current_user.get("department_id")
    batch_id = current_user.get("batch_id")

    db = get_scoped_db(current_user)
    if not payload.batch_confirmed:
        raise HTTPException(status_code=400, detail="Batch details must be confirmed before finishing onboarding")
    if not payload.subject_ids:
        raise HTTPException(status_code=400, detail="Select at least one engineering subject")

    required_consents = ("teacherVerifiedAi", "academicIntegrity", "dataPolicy")
    if not all(payload.consents.get(key) is True for key in required_consents):
        raise HTTPException(status_code=400, detail="All mandatory consents must be accepted")

    batch = await db.fetch_one("batches", {"id": batch_id}) if batch_id else None
    if not batch:
        raise HTTPException(status_code=400, detail="Batch details are missing from your account")

    selected_class = await db.fetch_one("classes", {"id": payload.class_id}) if payload.class_id else None
    enrollment_record = await db.fetch_one("student_enrollments", {"student_id": student_id})
    if not selected_class and batch_id:
        class_candidates = await db.fetch_all("classes", {"batch_id": batch_id})
        selected_class = _pick_preferred_class(class_candidates, current_user.get("section"))

    if selected_class and dept_id and selected_class.get("department_id") not in {None, dept_id}:
        raise HTTPException(status_code=403, detail="Selected class is outside your department scope")
    if selected_class and batch_id and selected_class.get("batch_id") not in {None, batch_id}:
        raise HTTPException(status_code=403, detail="Selected class does not belong to your batch")

    course_lookup: Dict[str, Dict[str, Any]] = {}
    for subject_id in payload.subject_ids:
        course = await db.fetch_one("courses", {"id": subject_id})
        if course:
            course_lookup[str(subject_id)] = course

    program_id = (
        (selected_class or {}).get("program_id")
        or (enrollment_record or {}).get("program_id")
        or next(
            (
                course.get("program_id")
                for course in course_lookup.values()
                if course.get("program_id")
            ),
            None,
        )
    )
    current_semester_id = (
        (selected_class or {}).get("semester_id")
        or (enrollment_record or {}).get("current_semester_id")
        or next(
            (
                course.get("semester_id")
                for course in course_lookup.values()
                if course.get("semester_id")
            ),
            None,
        )
    )

    if not program_id and dept_id:
        program_rows = await supabase_db.fetch_all("programs", {"department_id": dept_id})
        active_programs = [row for row in program_rows if (row.get("status") or "active") == "active"]
        fallback_programs = active_programs or program_rows
        if len(fallback_programs) == 1:
            program_id = fallback_programs[0].get("id")
        elif fallback_programs:
            batch_label = str(batch.get("label") or "").lower()
            program_id = next(
                (
                    row.get("id")
                    for row in fallback_programs
                    if batch_label and batch_label in str(row.get("program_name") or "").lower()
                ),
                fallback_programs[0].get("id"),
            )

    if not current_semester_id and program_id and batch.get("current_semester"):
        semester_match = await supabase_db.fetch_one(
            "semesters",
            {"program_id": program_id, "semester_number": batch.get("current_semester")},
        )
        current_semester_id = semester_match.get("id") if semester_match else None

    year_of_study = max(1, ((int(batch.get("current_semester") or 1) + 1) // 2))
    now = datetime.utcnow().isoformat()

    enrollment_upsert = None
    if program_id:
        enrollment_upsert = await supabase_db.upsert(
            "student_enrollments",
            {
                "student_id": student_id,
                "program_id": program_id,
                "current_semester_id": current_semester_id,
                "class_id": (selected_class or {}).get("id") or payload.class_id or (enrollment_record or {}).get("class_id"),
                "year_of_study": year_of_study,
                "status": "active",
                "updated_at": now,
            },
            on_conflict="student_id, program_id",
        )
        if not enrollment_upsert:
            raise HTTPException(status_code=500, detail="Failed to update student enrollment")

    user_updates: Dict[str, Any] = {"onboarding_step": 5}
    if (selected_class or {}).get("section"):
        user_updates["section"] = selected_class.get("section")
    elif (selected_class or {}).get("section_name"):
        user_updates["section"] = selected_class.get("section_name")
    db = get_scoped_db(current_user)
    updated_user = await db.update("users", user_updates, {"id": student_id})
    if updated_user is None:
        raise HTTPException(status_code=500, detail="Failed to update student onboarding state")

    await db.delete("student_subjects", {"student_id": student_id})
    for subject_id in payload.subject_ids:
        course = course_lookup.get(str(subject_id))
        if not course:
            continue
        await db.insert(
            "student_subjects",
            {"student_id": student_id, "subject_id": subject_id},
        )

        score = _clamp_unit_interval(payload.skill_levels.get(subject_id), default=0.5)
        await db.delete(
            "skill_mastery",
            {"user_id": student_id, "course_id": subject_id, "skill_name": "initial_self_assessment"},
        )
        await db.insert(
            "skill_mastery",
            {
                "user_id": student_id,
                "course_id": subject_id,
                "skill_name": "initial_self_assessment",
                "mastery_score": score,
                "confidence": 0.6,
                "bkt_p_l0": score,
                "assessment_count": 1,
                "last_assessed": now,
                "updated_at": now,
            },
        )

        await db.upsert(
            "enrollments",
            {
                "student_id": student_id,
                "course_id": subject_id,
                "status": "active",
                "enrolled_at": now,
                "progress": {
                    "percentage": 0,
                    "mastery": round(score * 100, 2),
                    "streak": 0,
                    "hoursSpent": 0,
                    "lastAccessed": None,
                },
            },
            on_conflict="student_id, course_id",
        )

    strengths = [
        course_lookup[sid].get("course_name") or course_lookup[sid].get("name") or sid
        for sid in payload.subject_ids
        if sid in course_lookup and _clamp_unit_interval(payload.skill_levels.get(sid), 0.5) >= 0.7
    ]
    weaknesses = [
        course_lookup[sid].get("course_name") or course_lookup[sid].get("name") or sid
        for sid in payload.subject_ids
        if sid in course_lookup and _clamp_unit_interval(payload.skill_levels.get(sid), 0.5) < 0.4
    ]
    mastery_state = {
        sid: {
            "score": _clamp_unit_interval(payload.skill_levels.get(sid), 0.5),
            "confidence": 0.6,
            "attempts": 1,
        }
        for sid in payload.subject_ids
    }

    learner_profile = await db.upsert(
        "learner_profiles",
        {
            "user_id": student_id,
            "role": "student",
            "grade_level": f"Semester {batch.get('current_semester')}" if batch.get("current_semester") else None,
            "goals": [payload.goal],
            "preferences": {
                "learning_styles": payload.learning_styles,
                "device_type": payload.device_type,
                "internet_type": payload.internet_type,
                "class_id": payload.class_id,
                "subject_ids": payload.subject_ids,
                "batch_confirmed": payload.batch_confirmed,
            },
            "mastery_state": mastery_state,
            "learning_style": ", ".join(payload.learning_styles),
            "strengths": strengths,
            "weaknesses": weaknesses,
            "metadata": {
                "engineering_onboarding_completed_at": now,
                "batch_id": batch_id,
                "batch_label": batch.get("label"),
                "batch_confirmation_note": payload.batch_confirmation_note,
                "section": user_updates.get("section") or current_user.get("section"),
                "program_id": program_id,
                "program_link_resolved": bool(program_id),
            },
            "updated_at": now,
        },
        on_conflict="user_id",
    )
    if not learner_profile:
        raise HTTPException(status_code=500, detail="Failed to initialize learner profile")

    existing_user_data = await db.fetch_one("user_data", {"user_id": student_id})
    progress = (existing_user_data or {}).get("progress") or {}
    progress["step_5"] = {
        "classId": payload.class_id,
        "subjectIds": payload.subject_ids,
        "learningStyles": payload.learning_styles,
        "skillLevels": payload.skill_levels,
        "goal": payload.goal,
        "deviceType": payload.device_type,
        "internetType": payload.internet_type,
        "consents": payload.consents,
        "batchConfirmed": payload.batch_confirmed,
        "batchConfirmationNote": payload.batch_confirmation_note,
        "preferredClassId": (selected_class or {}).get("id"),
        "programId": program_id,
        "programLinked": bool(program_id),
    }
    progress["onboarding_status"] = "COMPLETED"
    progress["onboarding_step"] = 5

    if existing_user_data:
        await db.update(
            "user_data",
            {"progress": progress, "updated_at": now},
            {"user_id": student_id},
        )
    else:
        await db.insert(
            "user_data",
            {"user_id": student_id, "progress": progress, "updated_at": now},
        )

    return {
        "success": True,
        "studentId": student_id,
        "classId": (selected_class or {}).get("id") or payload.class_id,
        "subjectCount": len(course_lookup),
        "batchLabel": batch.get("label"),
        "programLinked": bool(program_id),
    }


@router.get("/attendance")
async def get_student_attendance_summary(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Student access required")
    db = get_scoped_db(current_user)
    
    # Fetch records for student
    records_res = db.table("attendance_records").select("*").eq("student_id", current_user.get("id")).execute()
    records = records_res.data or []
    if not records:
        return {"subjects": [], "threshold": 75}
        
    session_ids = list({r.get("session_id") for r in records if r.get("session_id")})
    sessions_res = db.table("attendance_sessions").select("*").in_("id", session_ids).execute() if session_ids else None
    sessions = {s["id"]: s for s in (sessions_res.data or [])} if sessions_res else {}
    
    course_ids = list({s.get("course_id") for s in sessions.values() if s.get("course_id")})
    courses = db.table("courses").select("id,title,course_name,name").in_("id", course_ids).execute() if course_ids else None
    course_lookup = {c["id"]: c for c in (courses.data if courses else [])}
    
    summary = {}
    for row in records:
        session = sessions.get(row.get("session_id"))
        if not session:
            continue
        cid = session.get("course_id")
        if not cid:
            continue
        item = summary.setdefault(cid, {"total": 0, "present": 0})
        item["total"] += 1
        if row.get("is_present"):
            item["present"] += 1

    results = []
    for cid, stats in summary.items():
        course = course_lookup.get(cid, {})
        name = course.get("title") or course.get("course_name") or course.get("name") or "Course"
        percent = round((stats["present"] / stats["total"]) * 100, 2) if stats["total"] else 0
        results.append({
            "courseId": cid,
            "courseName": name,
            "totalClasses": stats["total"],
            "presentClasses": stats["present"],
            "attendancePercent": percent,
        })
    return {"subjects": results, "threshold": 75}


@router.get("/attendance/{course_id}/detail")
async def get_student_attendance_detail(course_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Student access required")
    db = get_scoped_db(current_user)
    
    sessions_res = db.table("attendance_sessions").select("id, class_date").eq("course_id", course_id).execute()
    sessions = sessions_res.data or []
    if not sessions:
        return {"classes": [], "total": 0, "attended": 0}
        
    session_lookup = {s["id"]: s for s in sessions}
    
    records_res = (
        db.table("attendance_records")
        .select("session_id,is_present")
        .eq("student_id", current_user.get("id"))
        .in_("session_id", list(session_lookup.keys()))
        .execute()
    )
    records = records_res.data or []
    
    classes = []
    for r in records:
        sess = session_lookup.get(r.get("session_id"))
        if sess:
            classes.append({
                "class_date": sess.get("class_date"),
                "is_present": r.get("is_present")
            })
            
    classes.sort(key=lambda x: x.get("class_date") or "")
    total = len(classes)
    attended = len([c for c in classes if c.get("is_present")])
    return {"classes": classes, "total": total, "attended": attended}


@router.get("/assignments")
async def list_student_assignments(current_user: dict = Depends(get_current_user), status: Optional[str] = None):
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Student access required")
    dept_id = current_user.get("dept_id") or current_user.get("department_id")
    batch_id = current_user.get("batch_id")
    section = current_user.get("section")

    db = get_scoped_db(current_user)

    courses = []
    course_ids = set()
    if dept_id:
        courses_res = db.table("courses").select("id,title,course_name,name").eq("department_id", dept_id).execute()
        courses = courses_res.data or []
        course_ids.update(str(course["id"]) for course in courses if course.get("id"))

    submissions_res = db.table("assignment_submissions").select("*").eq("student_id", current_user.get("id")).execute()
    submissions = submissions_res.data or []

    submission_map = {}
    submitted_assignment_ids = set()
    for s in submissions:
        key = s.get("assignment_id")
        if key:
            normalized_score = s.get("marks")
            if normalized_score is None:
                normalized_score = s.get("grade")
            if normalized_score is None:
                normalized_score = s.get("score")
            submission_map[key] = {
                **s,
                "content_url": s.get("content_url") or s.get("file_path"),
                "score": normalized_score,
            }
            submitted_assignment_ids.add(str(key))

    assignments = []
    if course_ids:
        assignments_res = db.table("assignments").select("*").in_("course_id", list(course_ids)).execute()
        assignments.extend(assignments_res.data or [])

    existing_assignment_ids = {str(assignment.get("id")) for assignment in assignments if assignment.get("id")}
    missing_assignment_ids = list(submitted_assignment_ids - existing_assignment_ids)
    if missing_assignment_ids:
        submitted_assignments_res = db.table("assignments").select("*").in_("id", missing_assignment_ids).execute()
        assignments.extend(submitted_assignments_res.data or [])

    assignment_course_ids = {
        str(assignment.get("course_id"))
        for assignment in assignments
        if assignment.get("course_id")
    }
    missing_course_ids = list(assignment_course_ids - course_ids)
    if missing_course_ids:
        extra_courses_res = db.table("courses").select("id,title,course_name,name").in_("id", missing_course_ids).execute()
        extra_courses = extra_courses_res.data or []
        courses.extend(extra_courses)
        course_ids.update(str(course["id"]) for course in extra_courses if course.get("id"))

    if not assignments:
        return []

    course_lookup = {str(c["id"]): c for c in courses if c.get("id")}
    results = []
    for assignment in assignments:
        if assignment.get("batch_id") and batch_id and assignment.get("batch_id") != batch_id:
            continue
        if assignment.get("section") and section and assignment.get("section") != section:
            continue
        course = course_lookup.get(str(assignment.get("course_id")), {})
        submission = submission_map.get(assignment.get("id"))
        status_value = "pending"
        normalized_score = submission.get("score") if submission else None
        if submission:
            status_value = "graded" if normalized_score is not None else "submitted"
        elif assignment.get("due_date") and assignment.get("due_date") < datetime.now(timezone.utc).isoformat():
            status_value = "overdue"

        if status and status != "all" and status_value != status:
            continue

        results.append({
            **assignment,
            "courseName": course.get("title") or course.get("course_name") or course.get("name"),
            "course_name": course.get("title") or course.get("course_name") or course.get("name"),
            "submitted": bool(submission),
            "submission": submission,
            "status": status_value,
        })
    return results


@router.post("/assignments/{assignment_id}/submit")
async def submit_student_assignment(
    assignment_id: str,
    payload: dict,
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Student access required")
    # Validate assignment
    db = get_scoped_db(current_user)
    assignment = await db.fetch_one("assignments", {"id": assignment_id})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if assignment.get("due_date") and assignment.get("due_date") < datetime.now(timezone.utc).isoformat():
        raise HTTPException(status_code=400, detail="Submission deadline has passed")
    if assignment.get("batch_id") and current_user.get("batch_id") != assignment.get("batch_id"):
        raise HTTPException(status_code=403, detail="This assignment is not assigned to your batch")
    if assignment.get("section") and current_user.get("section") != assignment.get("section"):
        raise HTTPException(status_code=403, detail="This assignment is not assigned to your section")
    if not payload.get("content_url") and not payload.get("text_content"):
        raise HTTPException(status_code=400, detail="Submission content is required")

    existing = await db.fetch_one(
        "assignment_submissions",
        {"assignment_id": assignment_id, "student_id": current_user.get("id")},
    )
    if existing:
        raise HTTPException(status_code=409, detail="Already submitted")

    data = {
        "assignment_id": assignment_id,
        "student_id": current_user.get("id"),
        "course_id": assignment.get("course_id"),
        "content_url": payload.get("content_url"),
        "text_content": payload.get("text_content"),
        "submission_type": "online",
        "status": "submitted",
        "submitted_at": datetime.now(timezone.utc).isoformat(),
    }
    submission = await db.insert("assignment_submissions", data)
    if not submission:
        raise HTTPException(status_code=500, detail="Failed to save submission")

    audit_logger.log(
        action="assignment_submitted",
        user_id=str(current_user.get("id")),
        resource_id=str(submission.get("id")),
        metadata={
            "assignment_id": assignment_id,
            "course_id": assignment.get("course_id"),
            "submission_type": "online",
        },
    )
    return submission


@router.get("/grades")
async def list_student_grades(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Student access required")
    db = get_scoped_db(current_user)
    submissions_res = db.table("assignment_submissions").select("*").eq("student_id", current_user.get("id")).execute()
    submissions = submissions_res.data or []
    
    assignment_ids = list({
        s.get("assignment_id")
        for s in submissions
        if s.get("assignment_id")
    })
    assignments_res = db.table("assignments").select("*").in_("id", assignment_ids).execute() if assignment_ids else None
    assignments = assignments_res.data if assignments_res else []
    course_ids = list({a.get("course_id") for a in assignments if a.get("course_id")})
    courses_res = db.table("courses").select("id,title,course_name,name").in_("id", course_ids).execute() if course_ids else None
    course_lookup = {c["id"]: c for c in (courses_res.data if courses_res else [])}
    assignment_lookup = {a["id"]: a for a in assignments}

    results = []
    for submission in submissions:
        assignment_id = submission.get("assignment_id")
        assignment = assignment_lookup.get(assignment_id)
        course = course_lookup.get(assignment.get("course_id")) if assignment else {}
        normalized_grade = submission.get("grade")
        if normalized_grade is None:
            normalized_grade = submission.get("marks")
        if normalized_grade is None:
            normalized_grade = submission.get("score")
        results.append({
            "submissionId": submission.get("id"),
            "assignmentId": assignment_id,
            "assignmentTitle": assignment.get("title") if assignment else None,
            "courseName": course.get("title") or course.get("course_name") or course.get("name"),
            "grade": normalized_grade,
            "marks": submission.get("marks", normalized_grade),
            "feedback": submission.get("feedback"),
            "gradedAt": submission.get("graded_at"),
        })
    return results


@router.get("/materials/{course_id}")
async def list_student_materials(course_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Student access required")
    db = get_scoped_db(current_user)
    enrolled = await db.fetch_one("student_subjects", {"student_id": current_user.get("id"), "subject_id": course_id})
    if not enrolled:
        raise HTTPException(status_code=403, detail="Not enrolled in this course")
    return await db.fetch_all("course_materials", {"course_id": course_id})


@router.get("/risk-score")
async def get_my_risk_score(current_user: dict = Depends(get_current_user)):
    """Fetch the latest risk analysis for the current student."""
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Student access required")
    
    service = get_risk_analysis_service()
    return await service.get_student_risk(current_user["id"])


@router.post("/analyze-risk")
async def trigger_risk_analysis(current_user: dict = Depends(get_current_user)):
    """Trigger a fresh risk analysis for the current student."""
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Student access required")
    
    institution_id = current_user.get("institution_id")
    if not institution_id:
        # Fallback for dev/old users
        institution_id = "00000000-0000-0000-0000-000000000000"
        
    service = get_risk_analysis_service()
    return await service.run_risk_analysis(current_user["id"], institution_id)
@router.get("/connection-token")
async def get_connection_token(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Generates a temporary connection token for parent-student linking.
    Expires in 10 minutes (600 seconds).
    """
    try:
        # Generate a unique token
        token = secrets.token_urlsafe(16)
        key = f"student_connect:{token}"
        
        # Store in Redis: token -> student_id
        await redis_client.setex(key, 600, current_user["id"])
        
        return {
            "token": token,
            "expires_in": 600,
            "display_id": current_user["id"] # Optional: use for manual entry if needed
        }
    except Exception as e:
        logger.error(f"get_connection_token_failed | user_id={current_user['id']} error={e}")
        raise HTTPException(status_code=500, detail="Failed to generate connection token")
