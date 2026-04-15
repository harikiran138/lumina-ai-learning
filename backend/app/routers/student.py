import asyncio
import json
import traceback
from collections import defaultdict
from datetime import datetime, timedelta, timezone
import structlog
logger = structlog.get_logger()
from app.core.responses import success_response, error_response
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends, Body, Response
from pydantic import BaseModel
from app.store.redis_client import redis_client
from app.personalization.schemas import (
    LearningEventType,
    QuizResultPayload,
    NoteAddedPayload,
    LessonCompletedPayload,
    ActivityLoggedPayload,
)
from app.dependencies import (
    get_user_data_store, 
    get_student_store, 
    get_assignment_store, 
    get_analytics_store,
    get_personalization_service,
    get_user_store,
    get_course_store,
    get_onboarding_service,
    get_attendance_store,
    get_risk_analysis_service
)
from app.store.user_data_store import UserDataStore
from app.store.student_store import StudentStore
from app.store.assignment_store import AssignmentStore
from app.store.analytics_store import AnalyticsStore
from app.store.user_store import UserStore
from app.store.course_store import CourseStore
from app.store.attendance_store import AttendanceStore
from app.services.personalization_service import PersonalizationService
from app.services.onboarding_service import OnboardingService
from app.services.risk_service import RiskAnalysisService
from app.api.deps import get_current_student as get_current_user
from app.database.supabase_manager import supabase_db
from app.services.risk_service import get_risk_analysis_service # Kept temporarily for reference
from app.services.student_analytics import compute_student_analytics
from app.core.audit import audit_logger
import uuid
import secrets
from app.routers.ai_tutor import build_tutor_response_payload, WAITING_MESSAGE
from ai_engine.classifier import classify, RoutingTier, SAFE_INSTANT_WAITING, RESTRICTED_REDIRECT
from app.services.fsrs_engine import get_due_cards, update_card as fsrs_update_card # Import FSRS engine

router = APIRouter()
_student_tutor_answers: Dict[str, Dict[str, Any]] = {}
_student_tutor_tasks: Dict[str, asyncio.Task] = {}


class EnrollmentRequest(BaseModel):
    course_id: str



class StudentOnboardingCompleteRequest(BaseModel):
    section_id: Optional[str] = None
    class_id: Optional[str] = None
    program_id: Optional[str] = None
    subject_ids: List[str] = []
    learning_styles: List[str] = []
    skill_levels: Dict[str, float] = {}
    goal: str
    device_type: str
    internet_type: str
    consents: Dict[str, bool]
    batch_confirmed: bool = False
    batch_confirmation_note: Optional[str] = None


class BehaviorSignal(BaseModel):
    event_type: str
    ts: str
    payload: Dict[str, Any] = {}


class BehaviorBatchRequest(BaseModel):
    course_id: Optional[str] = None
    question_id: Optional[str] = None
    session_id: str
    signals: List[BehaviorSignal]


class ActivityLogRequest(BaseModel):
    course_id: Optional[str] = None
    duration_minutes: int = 0


class SpacedRepetitionReviewRequest(BaseModel):
    cardId: str
    grade: int
    responseTimeMs: int = 0


class AdaptiveQuestionRequest(BaseModel):
    course_id: str
    topic_id: Optional[str] = None
    exclude_ids: List[str] = []


class StudentAnswerRequest(BaseModel):
    """Unified answer submission — triggers the full orchestrator pipeline."""
    course_id:        str
    topic_id:         str
    question_id:      str
    question_text:    str       = ""
    answer_text:      str
    is_correct:       bool
    correct_answer:   str       = ""
    difficulty:       str       = "medium"
    time_taken_s:     float     = 0.0
    correction_count: int       = 0
    behavior_signals: Dict[str, Any] = {}
    session_id:       str       = ""
    exclude_q_ids:    List[str] = []
    debug_mode:       bool      = False


def _student_tutor_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def _infer_tutor_answer_type(response_text: str) -> str:
    try:
        parsed = json.loads(response_text)
    except (TypeError, json.JSONDecodeError):
        return "text"

    flow = parsed.get("flow")
    if isinstance(flow, list) and flow:
        first_type = flow[0].get("type")
        if isinstance(first_type, str) and first_type.strip():
            return first_type
    return "text"


async def _run_student_tutor_answer(
    answer_id: str,
    payload: Dict[str, Any],
    current_user: Dict[str, Any],
) -> None:
    job = _student_tutor_answers.get(answer_id)
    if not job:
        return

    job["status"] = "processing"
    job["updated_at"] = _student_tutor_timestamp()

    try:
        result = await build_tutor_response_payload(payload, current_user)
        # "content" is the canonical key (Agent 1); fall back to "response" for compatibility
        response_text = result.get("content") or result.get("response") or ""
        # Prefer the type already resolved by the router; fall back to parsing
        answer_type = result.get("type") or _infer_tutor_answer_type(response_text)
        answer_meta = result.get("meta") or {}

        job.update(
            {
                "status": "completed",
                "message": "Answer ready",
                "response": response_text,
                "mode": result.get("mode"),
                "type": answer_type,
                "meta": answer_meta,
                "queued": result.get("queued", False),
                "answer": {
                    "id": answer_id,
                    "type": answer_type,
                    "content": response_text,
                    "mode": result.get("mode"),
                    "meta": answer_meta,
                },
                "updated_at": _student_tutor_timestamp(),
                "completed_at": _student_tutor_timestamp(),
            }
        )
    except HTTPException as exc:
        job.update(
            {
                "status": "failed",
                "message": exc.detail if isinstance(exc.detail, str) else "Tutor request failed",
                "error": exc.detail,
                "updated_at": _student_tutor_timestamp(),
            }
        )
    except Exception as exc:
        logger.exception("student_tutor_answer_failed", answer_id=answer_id, error=str(exc))
        job.update(
            {
                "status": "failed",
                "message": "I hit a problem while preparing your answer.",
                "error": str(exc),
                "updated_at": _student_tutor_timestamp(),
            }
        )
    finally:
        _student_tutor_tasks.pop(answer_id, None)


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


def _pick_preferred_class(section_rows: List[Dict[str, Any]], user_section: Optional[str]) -> Optional[Dict[str, Any]]:
    if not section_rows:
        return None

    normalized_section = str(user_section or "").strip().lower()
    if normalized_section:
        for row in section_rows:
            row_section = str(row.get("section") or row.get("section_name") or "").strip().lower()
            if row_section == normalized_section:
                return row

    if len(section_rows) == 1:
        return section_rows[0]

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



# Endpoints migrated to specialized routers (assessment.py, personalization.py)


@router.post("/tutor/ask")
async def ask_tutor(
    payload: Dict[str, Any] = Body(...),
    current_user: dict = Depends(get_current_user),
):
    prompt = (
        payload.get("prompt")
        or payload.get("question")
        or payload.get("message")
        or ""
    )
    if not str(prompt).strip():
        raise HTTPException(status_code=400, detail="Prompt is required")

    # ── Pre-classify so we set the right waiting message and can short-circuit
    # RESTRICTED questions without spawning a background task at all.
    ctx_raw = payload.get("context") or payload.get("context_filters") or {}
    clf = classify(str(prompt).strip(), ctx_raw if isinstance(ctx_raw, dict) else {})
    tier = clf["tier"]

    answer_id = uuid.uuid4().hex
    now = _student_tutor_timestamp()
    poll_path = f"/api/student/tutor/answer/{answer_id}"

    # ── RESTRICTED: pre-fill job as already completed — zero background work ──
    if tier == RoutingTier.RESTRICTED:
        _student_tutor_answers[answer_id] = {
            "id": answer_id,
            "student_id": str(current_user.get("id") or ""),
            "status": "completed",
            "message": "Response ready",
            "response": RESTRICTED_REDIRECT,
            "content": RESTRICTED_REDIRECT,
            "answer": {
                "id": answer_id,
                "type": "text",
                "content": RESTRICTED_REDIRECT,
                "mode": "explain",
                "meta": {},
            },
            "type": "text",
            "tier": tier,
            "mode": payload.get("mode"),
            "queued": False,
            "meta": {},
            "created_at": now,
            "updated_at": now,
            "completed_at": now,
            "poll_url": poll_path,
        }
        return {
            "success": True,
            "id": answer_id,
            "status": "pending",
            "message": "Processing…",
            "poll_url": poll_path,
            "tier": tier,
        }

    # ── SAFE_INSTANT / ACADEMIC_VERIFIED: start background task ──────────────
    waiting_msg = SAFE_INSTANT_WAITING if tier == RoutingTier.SAFE_INSTANT else WAITING_MESSAGE

    # Pass pre-computed tier to the background task so it doesn't re-classify
    payload_copy = dict(payload)
    payload_copy["_routing_tier"] = tier

    _student_tutor_answers[answer_id] = {
        "id": answer_id,
        "student_id": str(current_user.get("id") or ""),
        "status": "pending",
        "message": waiting_msg,
        "response": None,
        "answer": None,
        "type": None,
        "tier": tier,
        "mode": payload.get("mode"),
        "created_at": now,
        "updated_at": now,
        "poll_url": poll_path,
    }
    _student_tutor_tasks[answer_id] = asyncio.create_task(
        _run_student_tutor_answer(answer_id, payload_copy, dict(current_user))
    )

    return {
        "success": True,
        "id": answer_id,
        "status": "pending",
        "message": waiting_msg,
        "poll_url": poll_path,
        "tier": tier,
    }


@router.get("/tutor/answer/{answer_id}")
async def get_tutor_answer(
    answer_id: str,
    current_user: dict = Depends(get_current_user),
):
    job = _student_tutor_answers.get(answer_id)
    if not job:
        raise HTTPException(status_code=404, detail="Tutor answer not found")

    if str(job.get("student_id") or "") != str(current_user.get("id") or ""):
        raise HTTPException(status_code=403, detail="Not your tutor answer")

    return {
        "success": True,
        "id": answer_id,
        "status": job.get("status", "pending"),
        "message": job.get("message") or WAITING_MESSAGE,
        "response": job.get("response"),
        "content": job.get("response"),   # alias so extractAnswerText finds it either way
        "answer": job.get("answer"),
        "type": job.get("type"),
        "mode": job.get("mode"),
        "tier": job.get("tier"),
        "meta": job.get("meta") or {},
        "queued": job.get("queued", False),
        "created_at": job.get("created_at"),
        "updated_at": job.get("updated_at"),
        "completed_at": job.get("completed_at"),
        "poll_url": job.get("poll_url"),
    }


@router.get("/dashboard")
async def get_student_dashboard(
    current_user: dict = Depends(get_current_user),
    analytics: AnalyticsStore = Depends(get_analytics_store),
    assignment_store: AssignmentStore = Depends(get_assignment_store),
    personalization: PersonalizationService = Depends(get_personalization_service),
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

    dashboard_data = await analytics.get_student_full_dashboard(current_user["id"])

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
    due_assignments = await _build_due_assignments(enrolled_courses, current_user["id"], assignment_store)
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
            "parentLinkCode": current_user.get("parent_link_code"),
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
    personalization: PersonalizationService = Depends(get_personalization_service),
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
    personalization: PersonalizationService = Depends(get_personalization_service),
):
    """
    Log a study session activity event.
    Triggers analytics recomputation in background so dashboard reflects updated
    pattern + growth after each session.
    """
    student_id = current_user["id"]
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



# Enrollment and activity logic moved to enrollment.py and personalization.py


@router.get("/test-user")
async def test_user(current_user: dict = Depends(get_current_user)):
    return current_user


@router.get("/badges")
async def get_badges(
    current_user: dict = Depends(get_current_user), 
    student_store: StudentStore = Depends(get_student_store)
):
    """
    Get all badges for the CURRENT student.
    """
    return await student_store.get_badges(current_user["id"])


@router.get("/subjects/list")
async def list_student_subjects(
    current_user: dict = Depends(get_current_user),
    course_store: CourseStore = Depends(get_course_store),
):
    """
    List all courses the student is currently enrolled in.
    """
    return await course_store.get_student_enrollments(current_user["id"])


@router.get("/onboarding/options")
async def get_student_onboarding_options(
     current_user: dict = Depends(get_current_user),
     onboarding_service: OnboardingService = Depends(get_onboarding_service),
):
    """
    Fetch onboarding configuration for student setup.
    """
    return await onboarding_service.get_student_onboarding_options(current_user["id"])


@router.post("/onboarding/complete")
async def complete_student_onboarding(
    data: Dict[str, Any],
    current_user: dict = Depends(get_current_user),
    onboarding_service: OnboardingService = Depends(get_onboarding_service),
):
    """
    Save onboarding preferences and update student status.
    """
    return await onboarding_service.complete_student_onboarding(
        current_user["id"], 
        data
    )


@router.get("/certificates")
async def get_certificates(
    current_user: dict = Depends(get_current_user), 
    student_store: StudentStore = Depends(get_student_store)
):
    """
    Get all certificates for the CURRENT student.
    """
    return await student_store.get_certificates(current_user["id"])


@router.post("/profile/update")
async def update_profile(
    data: Dict[str, Any],
    current_user: dict = Depends(get_current_user),
    user_store: UserStore = Depends(get_user_store),
    user_data_store: UserDataStore = Depends(get_user_data_store),
    personalization: PersonalizationService = Depends(get_personalization_service),
):
    """
    Update profile data for the CURRENT student.
    """
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

    await personalization.record_event(
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
    personalization: PersonalizationService = Depends(get_personalization_service),
):
    """
    Get deep learner analytics (cognitive load, engagement, behavior).
    """
    return await personalization.get_legacy_state(
        current_user["id"], role=current_user.get("role", "student")
    )


@router.get("/profile/projections")
async def get_mastery_projections(
    current_user: dict = Depends(get_current_user),
    personalization: PersonalizationService = Depends(get_personalization_service),
):
    """
    Get future mastery projections based on DKT modeling.
    """
    return await personalization.get_student_projection(current_user["id"])


@router.get("/profile")
async def get_profile(
    current_user: dict = Depends(get_current_user),
    personalization: PersonalizationService = Depends(get_personalization_service),
    user_data_store: UserDataStore = Depends(get_user_data_store),
    analytics: AnalyticsStore = Depends(get_analytics_store),
):
    """
    Get the full profile for the CURRENT user.
    """
    try:
        logger.info("profile_fetch_init", user_id=current_user.get("id"))
        
        # 1. Fetch Personalization Profile
        profile_data = await personalization.get_profile(
            current_user["id"], role=current_user.get("role", "student")
        )
        if not profile_data:
             from app.personalization.schemas import LearnerProfileRecord
             profile_data = LearnerProfileRecord(user_id=current_user["id"], role=current_user.get("role", "student"))

        # 2. Resolve Academic Hierarchy
        hierarchy = {
            "institution": None,
            "department": None,
            "batch": None,
            "section": None,
            "academicYear": None,
        }
        
        inst_id = current_user.get("college_id")
        dept_id = current_user.get("dept_id") or current_user.get("department_id")
        batch_id = current_user.get("batch_id")
        section_id = current_user.get("section_id")
        ay_id = current_user.get("academic_year_id")
        
        if inst_id:
            inst = await personalization.db.fetch_one("institutions", {"id": inst_id})
            hierarchy["institution"] = (inst.get("name") if inst else None) if isinstance(inst, dict) else None
        if dept_id:
            dept = await personalization.db.fetch_one("departments", {"id": dept_id})
            hierarchy["department"] = (dept.get("name") if dept else None) if isinstance(dept, dict) else None
        if batch_id:
            batch = await personalization.db.fetch_one("batches", {"id": batch_id})
            if batch and isinstance(batch, dict):
                hierarchy["batch"] = f"{batch.get('batch_name') or batch.get('name')} ({batch.get('year') or ''})"
        if section_id:
            section = await personalization.db.fetch_one("sections", {"id": section_id})
            hierarchy["section"] = (section.get("name") if section else None) if isinstance(section, dict) else None
        if ay_id:
            ay = await personalization.db.fetch_one("academic_years", {"id": ay_id})
            hierarchy["academicYear"] = (ay.get("name") if ay else None) if isinstance(ay, dict) else None

        # 3. Fetch Supplemental Data
        quiz_stats = await user_data_store.get_recent_quiz_stats(current_user["id"])
        profile_settings = await user_data_store.get_profile_settings(current_user["id"])
        dashboard_stats = await analytics.get_student_dashboard_stats(current_user["id"])
        notes = await user_data_store.get_notes(current_user["id"])
        
        display_name = current_user.get("name") or current_user.get("full_name") or "Student"
        
        # 4. Formulate Response
        recent_activity = []
        for item in reversed(quiz_stats.get("recent_history", [])[-5:]):
            recent_activity.append({
                "type": "quiz",
                "title": item.get("topic") or item.get("course_id") or "Quiz Attempt",
                "description": f"Score: {item.get('score', 0)}% on {item.get('difficulty', 'standard')} difficulty",
                "timestamp": item.get("timestamp")
            })

        return {
            "name": display_name,
            "username": profile_settings.get("username") or current_user.get("username"),
            "email": current_user.get("email"),
            "phone": current_user.get("phone"),
            "avatar": profile_settings.get("avatar") or current_user.get("avatar") or current_user.get("profile_image"),
            "bio": profile_settings.get("bio") or current_user.get("bio"),
            "skills": current_user.get("skills") if isinstance(current_user.get("skills"), list) else [],
            "location": profile_settings.get("location") or current_user.get("location"),
            "language": profile_settings.get("language") or current_user.get("language"),
            "preferences": profile_settings.get("preferences") or current_user.get("preferences", {}),
            "notification_preferences": profile_settings.get("notification_preferences") or current_user.get("notification_preferences", {}),
            "security_preferences": profile_settings.get("security_preferences") or current_user.get("security_preferences", {}),
            "privacy_settings": profile_settings.get("privacy_settings") or current_user.get("privacy_settings", {}),
            "joinedDate": current_user.get("created_at"),
            "recentActivity": recent_activity,
            "stats": quiz_stats,
            "dashboard_stats": dashboard_stats,
            "learner_profile": profile_data.model_dump(mode="json"),
            "notes": notes,
            "user_info": {"name": display_name, "email": current_user.get("email")},
            "hierarchy": hierarchy,
            "parentLinkCode": getattr(profile_data.preferences, "parent_link_code", None) or current_user.get("parent_link_code")
        }
    except Exception as e:
        error_msg = f"student_profile_api_failure: {str(e)}"
        logger.error(error_msg, user_id=current_user.get("id"), exc_info=True)
        # Print to stdout for terminal visibility
        print(f"❌ FULL ERROR in /profile: {e}")
        import traceback
        traceback.print_exc()
        
        raise HTTPException(
            status_code=500, 
            detail={
                "message": str(e),
                "traceback": traceback.format_exc(),
                "user_id": current_user.get("id")
            }
        )


@router.get("/leaderboard")
async def get_leaderboard(
    timeframe: str = "weekly",
    current_user: dict = Depends(get_current_user),
    response: Response = None,
    analytics_store: AnalyticsStore = Depends(get_analytics_store),
):
    """
    Returns a ranked leaderboard of students based on XP from learning_events.
    Includes a 5-minute Redis cache.
    """
    cache_key = f"leaderboard:{timeframe}"
    try:
        cached_data = await redis_client.get(cache_key)
        if cached_data:
            if response: response.headers["X-Cache"] = "HIT"
            return success_response(data={"timeframe": timeframe, "entries": json.loads(cached_data)})
    except: pass

    try:
        # Fetch recent quiz submission events
        query = analytics_store.db.table("learning_events").select("user_id, payload")
        query = query.eq("event_type", "quiz_submitted")
        
        if timeframe == "weekly":
            last_week = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
            query = query.gte("created_at", last_week)

        res = await query.limit(2000).async_execute()
        events = res.data or []

        # Aggregate XP in Python
        xp_map = defaultdict(int)
        for ev in events:
            payload = ev.get("payload", {})
            score = payload.get("score", 0)
            xp_map[ev["user_id"]] += int(score * 10) # 10XP per percent
            
        # Get Student Names
        user_ids = list(xp_map.keys())
        entries = []
        curr_uid = str(current_user.get("id"))

        if user_ids:
            # Batch fetch user names
            users_res = await analytics_store.db.table("users").select("id, name, full_name, avatar_url")\
                .in_("id", user_ids[:100]).async_execute()
            
            user_data = {u["id"]: u for u in users_res.data or []}
            
            for uid, xp in xp_map.items():
                u_info = user_data.get(uid, {})
                entries.append({
                    "id": uid,
                    "name": u_info.get("full_name") or u_info.get("name") or "Student",
                    "avatar": u_info.get("avatar_url"),
                    "xp": xp,
                    "level": (xp // 500) + 1,
                    "isCurrentUser": str(uid) == curr_uid
                })
        
        # Sort and take top 50
        entries.sort(key=lambda x: x["xp"], reverse=True)
        top_entries = entries[:50]

        # Ensure current user is included if not in top 50
        if not any(e["isCurrentUser"] for e in top_entries):
             curr_info = await analytics_store.db.table("users").select("id, name, full_name, avatar_url")\
                 .eq("id", curr_uid).maybe_single().async_execute()
             if curr_info.data:
                 u = curr_info.data
                 top_entries.append({
                     "id": curr_uid,
                     "name": u.get("full_name") or u.get("name") or "You",
                     "avatar": u.get("avatar_url"),
                     "xp": xp_map.get(curr_uid, 0),
                     "level": (xp_map.get(curr_uid, 0) // 500) + 1,
                     "rank": 99,
                     "isCurrentUser": True
                 })

        # Cache for 5 mins
        try:
            await redis_client.setex(cache_key, 300, json.dumps(top_entries))
        except: pass

        if response: response.headers["X-Cache"] = "MISS"
        return success_response(data={"timeframe": timeframe, "entries": top_entries})
    except Exception as e:
        logger.error(f"leaderboard_fetch_failed: {str(e)}")
        return success_response(data={"timeframe": timeframe, "entries": []})


@router.get("/attendance/summary")
async def get_student_attendance_summary(
    current_user: dict = Depends(get_current_user),
    attendance_store: AttendanceStore = Depends(get_attendance_store),
):
    """
    Get overall attendance percentage and trends.
    """
    return await attendance_store.get_student_summary(current_user["id"])


@router.get("/attendance/detail")
async def get_student_attendance_detail(
    course_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    attendance_store: AttendanceStore = Depends(get_attendance_store),
):
    """
    Get day-by-day attendance log for a specific course or all courses.
    """
    return await attendance_store.get_student_detail(current_user["id"], course_id)


@router.get("/assignments/list")
async def list_student_assignments(
    course_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    assignment_store: AssignmentStore = Depends(get_assignment_store),
):
    """
    List assignments with submission status and grades.
    """
    return await assignment_store.list_student_assignments(
        current_user["id"], course_id=course_id, status=status
    )


@router.post("/assignments/submit")
async def submit_student_assignment(
    assignment_id: str,
    submission_data: Dict[str, Any],
    current_user: dict = Depends(get_current_user),
    assignment_store: AssignmentStore = Depends(get_assignment_store),
):
    """
    Submit an assignment.
    """
    return await assignment_store.submit_assignment(
        current_user["id"], assignment_id, submission_data
    )


@router.get("/grades/list")
async def list_student_grades(
    course_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    student_store: StudentStore = Depends(get_student_store),
):
    """
    List grades and feedback for courses.
    """
    return await student_store.get_grades(current_user["id"], course_id=course_id)


@router.get("/materials/list")
async def list_student_materials(
    course_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    course_store: CourseStore = Depends(get_course_store),
):
    """
    List learning materials (PDFs, Videos, etc.) for enrolled subjects.
    """
    return await course_store.get_student_materials(current_user["id"], course_id=course_id)


@router.post("/behavior/ingest")
async def ingest_behavior_batch(
    payload: Dict[str, Any],
    current_user: dict = Depends(get_current_user),
    personalization: PersonalizationService = Depends(get_personalization_service),
):
    """
    Ingest a batch of behavior signals (clicks, dwell time, etc.).
    """
    events = payload.get("events", [])
    for event in events:
        await personalization.record_event(
            current_user["id"],
            event.get("type", LearningEventType.BEHAVIOR_SIGNAL),
            payload=event.get("data", {}),
            source="behavior_tracker",
            role=current_user.get("role", "student")
        )
    return {"status": "ingested", "count": len(events)}


@router.get("/adaptive/next-question")
async def get_adaptive_question(
    course_id: str,
    current_user: dict = Depends(get_current_user),
    personalization: PersonalizationService = Depends(get_personalization_service),
):
    """
    Get the next best question for the student based on their mastery state.
    """
    return await personalization.get_next_adaptive_question(current_user["id"], course_id)


@router.get("/review/schedule")
async def get_review_schedule(
    current_user: dict = Depends(get_current_user),
    personalization: PersonalizationService = Depends(get_personalization_service),
):
    """
    Get FSRS-based review schedule for the student across all subjects.
    """
    return await personalization.get_review_schedule(current_user["id"])


@router.get("/spaced-repetition/list")
async def get_student_spaced_repetition(
    current_user: dict = Depends(get_current_user),
    personalization: PersonalizationService = Depends(get_personalization_service),
):
    """Get SRS cards due for review."""
    return await personalization.get_due_srs_cards(current_user["id"])


@router.post("/spaced-repetition/submit")
async def submit_student_spaced_repetition_review(
    payload: Dict[str, Any],
    current_user: dict = Depends(get_current_user),
    personalization: PersonalizationService = Depends(get_personalization_service),
):
    """Submit SRS review results."""
    return await personalization.submit_srs_review(
        current_user["id"], payload.get("card_id"), payload.get("rating")
    )


@router.post("/quiz/submit-answer")
async def submit_answer(
    payload: Dict[str, Any],
    current_user: dict = Depends(get_current_user),
    personalization: PersonalizationService = Depends(get_personalization_service),
):
    """Submit a single quiz answer and get immediate feedback / mastery update."""
    return await personalization.submit_quiz_answer(
        current_user["id"], 
        payload.get("question_id"), 
        payload.get("answer"),
        payload.get("context", {})
    )


@router.get("/intelligence/report")
async def get_student_intelligence(
    current_user: dict = Depends(get_current_user),
    personalization: PersonalizationService = Depends(get_personalization_service),
    risk_service: RiskAnalysisService = Depends(get_risk_analysis_service),
):
    """Get high-level intelligence report including risk alerts and strength/weakness analysis."""
    risk_data = await risk_service.get_student_risk(current_user["id"])
    learner_state = await personalization.get_legacy_state(current_user["id"])
    
    return {
        "userId": current_user["id"],
        "risk": risk_data,
        "mastery": learner_state.get("overallMastery"),
        "cognitiveLoad": learner_state.get("cognitiveLoad"),
        "behaviorLabel": learner_state.get("behaviorLabel")
    }


@router.get("/debug/trace")
async def get_debug_trace(
    current_user: dict = Depends(get_current_user),
    analytics_store: AnalyticsStore = Depends(get_analytics_store),
):
    """Debug endpoint to see raw event trace for a student."""
    if not current_user.get("is_debug"):
        raise HTTPException(status_code=403, detail="Debug access required")
    return await analytics_store.get_event_trace(current_user["id"])



# ─── Student Intelligence State ───────────────────────────────────────────────

@router.get("/intelligence")
async def get_student_intelligence(
    course_id: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Returns the full intelligence state for the current student:
      - KPI snapshot (all 8 metrics)
      - DKT knowledge state (all concepts + predictions)
      - Mastery per topic
      - Cognitive traits
      - Spaced repetition schedule
      - Recent learning score trend
      - Explanation style preferences
    """
    if current_user.get("role") not in ("student", "peer_tutor"):
        raise HTTPException(status_code=403, detail="Student access required")

    user_id = current_user["id"]
    db = get_scoped_db(current_user)

    from app.services.dkt_engine import DKTEngine
    from app.services.trait_detector import TraitEngine
    from app.services.spaced_repetition import SpacedRepetitionScheduler

    dkt     = DKTEngine(db=db)
    traits  = TraitEngine(db=db)
    spaced  = SpacedRepetitionScheduler(db=db)

    # Run all reads in parallel
    dkt_state, trait_data, review_schedule, profile_raw, recent_analytics = await asyncio.gather(
        dkt.get_state_summary(user_id),
        traits.get_traits(user_id),
        spaced.get_due_reviews(user_id, course_id=course_id, limit=5),
        _load_learner_profile(db, user_id),
        _load_recent_analytics(db, user_id, limit=10),
    )

    return {
        "user_id": user_id,
        "kpi":     profile_raw.get("kpi_snapshot", {}),
        "mastery": profile_raw.get("mastery_state", {}),
        "weak_topics": profile_raw.get("weak_topics", []),
        "dkt":     dkt_state,
        "traits":  trait_data,
        "review_schedule": review_schedule,
        "recent_scores": [
            {
                "learning_score": r.get("learning_score"),
                "correctness":    r.get("correctness"),
                "depth":          r.get("depth_score"),
                "effort":         r.get("effort_score"),
                "authenticity":   r.get("authenticity_score"),
                "topic":          r.get("topic_id"),
                "created_at":     r.get("created_at"),
            }
            for r in recent_analytics
        ],
        "explanation_profile": profile_raw.get("explanation_profile", {}),
        "risk":    profile_raw.get("risk_summary", {}),
        "engagement": profile_raw.get("engagement_summary", {}),
    }


# ─── Debug Trace Endpoint ──────────────────────────────────────────────────────

@router.get("/intelligence/debug/{question_id}")
async def get_debug_trace(
    question_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Returns full pipeline trace for a specific answer interaction.
    Shows WHY a question was generated, WHY the style was chosen, KPI breakdown.
    """
    if current_user.get("role") not in ("student", "peer_tutor"):
        raise HTTPException(status_code=403, detail="Student access required")

    db = get_scoped_db(current_user)
    user_id = current_user["id"]

    try:
        r = (
            await db.table("answer_analytics")
            .select("*")
            .eq("user_id", user_id)
            .eq("question_id", question_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        row = (r.data or [None])[0]
        if not row:
            raise HTTPException(status_code=404, detail="No trace found for this question")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    from app.services.dkt_engine import DKTEngine
    dkt = DKTEngine(db=db)
    sequence = await dkt.get_sequence(user_id, last_n=10)

    return {
        "question_id": question_id,
        "answer_record": row,
        "why_this_question": {
            "mastery_before":     row.get("mastery_before"),
            "target_difficulty":  row.get("difficulty"),
            "lag_concepts_detected": "See DKT sequence",
            "adaptive_reason":    "Selected by ZPD engine (mastery → target_difficulty)",
        },
        "why_this_style": {
            "last_explanation_plan": "See /student/intelligence for full plan",
            "epsilon_greedy_mode":   "10% explore, 90% exploit best effectiveness",
        },
        "kpi_breakdown": {
            "learning_score":     row.get("learning_score"),
            "correctness_40pct":  row.get("correctness"),
            "depth_30pct":        row.get("depth_score"),
            "effort_20pct":       row.get("effort_score"),
            "growth_10pct":       row.get("growth_delta"),
        },
        "authenticity_signals": row.get("authenticity_signals", {}),
        "dkt_sequence_last10":  sequence,
    }


# ─── Helper functions ─────────────────────────────────────────────────────────

async def _load_learner_profile(db: Any, user_id: str) -> Dict[str, Any]:
    try:
        r = (
            await db.table("learner_profiles")
            .select(
                "mastery_state, weak_topics, kpi_snapshot, "
                "explanation_profile, risk_summary, engagement_summary"
            )
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
        return r.data or {}
    except Exception:
        return {}


async def _load_recent_analytics(db: Any, user_id: str, limit: int = 10) -> List[Dict]:
    try:
        r = (
            await db.table("answer_analytics")
            .select(
                "learning_score, correctness, depth_score, effort_score, "
                "authenticity_score, topic_id, created_at"
            )
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return r.data or []
    except Exception:
        return []
