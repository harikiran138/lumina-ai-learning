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
from app.routers.ai_tutor import build_tutor_response_payload, WAITING_MESSAGE
from ai_engine.classifier import classify, RoutingTier, SAFE_INSTANT_WAITING, RESTRICTED_REDIRECT
from app.services.fsrs_engine import get_due_cards, update_card as fsrs_update_card # Import FSRS engine

router = APIRouter()
_student_tutor_answers: Dict[str, Dict[str, Any]] = {}
_student_tutor_tasks: Dict[str, asyncio.Task] = {}


class EnrollmentRequest(BaseModel):
    course_id: str


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



# Enrollment and activity logic moved to enrollment.py and personalization.py


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
    try:
        logger.info("profile_fetch_init", user_id=current_user.get("id"))
        from app.store.analytics_store import AnalyticsStore
        db = get_scoped_db(current_user)
        user_data_store = UserDataStore(db=db)
        analytics = AnalyticsStore(db=db)
        
        # 1. Fetch Personalization Profile
        profile_data = await get_personalization_service(db=db).get_profile(
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
            inst = await db.fetch_one("institutions", {"id": inst_id})
            hierarchy["institution"] = (inst.get("name") if inst else None) if isinstance(inst, dict) else None
        if dept_id:
            dept = await db.fetch_one("departments", {"id": dept_id})
            hierarchy["department"] = (dept.get("name") if dept else None) if isinstance(dept, dict) else None
        if batch_id:
            batch = await db.fetch_one("batches", {"id": batch_id})
            if batch and isinstance(batch, dict):
                hierarchy["batch"] = f"{batch.get('batch_name') or batch.get('name')} ({batch.get('year') or ''})"
        if section_id:
            section = await db.fetch_one("sections", {"id": section_id})
            hierarchy["section"] = (section.get("name") if section else None) if isinstance(section, dict) else None
        if ay_id:
            ay = await db.fetch_one("academic_years", {"id": ay_id})
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

    db = get_scoped_db(current_user)
    try:
        # Fetch recent quiz submission events
        query = db.table("learning_events").select("user_id, payload")
        query = query.eq("event_type", "quiz_submitted")
        
        if timeframe == "weekly":
            last_week = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
            query = query.query.gte("created_at", last_week)

        res = await query.limit(2000).async_execute()
        events = res.data or []

        # Aggregate XP in Python
        xp_map = defaultdict(int)
        for ev in events:
            u_id = ev.get("user_id")
            pl = ev.get("payload") or {}
            xp_map[u_id] += int(pl.get("score", 0))

        sorted_ids = sorted(xp_map.keys(), key=lambda x: xp_map[x], reverse=True)[:50]
        
        entries = []
        curr_uid = str(current_user.get("id"))
        
        for idx, u_id in enumerate(sorted_ids):
            user_doc = await db.fetch_one("users", {"id": u_id})
            entries.append({
                "rank": idx + 1,
                "userId": str(u_id),
                "name": user_doc.get("full_name") if user_doc else "Scholar",
                "avatar": user_doc.get("avatar_url") if user_doc else "",
                "xp": xp_map[u_id],
                "streak": user_doc.get("streak", 0) if user_doc else 0,
                "isCurrentUser": str(u_id) == curr_uid
            })

        # Ensure current user is included
        if not any(e["isCurrentUser"] for e in entries):
            user_doc = await db.fetch_one("users", {"id": curr_uid})
            if user_doc:
                entries.append({
                    "rank": 99,
                    "userId": curr_uid,
                    "name": user_doc.get("full_name"),
                    "avatar": user_doc.get("avatar_url"),
                    "xp": xp_map.get(curr_uid, 0),
                    "streak": user_doc.get("streak", 0),
                    "isCurrentUser": True
                })

        if entries: await redis_client.setex(cache_key, 300, json.dumps(entries))
        if response: response.headers["X-Cache"] = "MISS"
        return success_response(data={"timeframe": timeframe, "entries": entries})

    except Exception as e:
        logger.error("leaderboard_failed", error=str(e))
        return success_response(data={"timeframe": timeframe, "entries": []})



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

    section_rows: List[Dict[str, Any]] = []
    try:
        class_query = client.table("classes").select("*")
        if dept_id:
            class_query = class_query.eq("department_id", dept_id)
        if batch_id:
            class_query = class_query.eq("batch_id", batch_id)
        section_rows = class_query.execute().data or []
    except Exception:
        if dept_id:
            section_rows = client.table("sections").select("*").eq("department_id", dept_id).execute().data or []

    if current_user.get("section"):
        user_section = str(current_user.get("section"))
        section_rows.sort(
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

    preferred_class = _pick_preferred_class(section_rows, current_user.get("section"))
    issues = {
        "missingDepartmentLink": not bool(dept_id),
        "missingBatchLink": not bool(batch_id),
        "missingSubjects": len(subjects) == 0,
        "missingClasses": len(section_rows) == 0,
        "missingProgramLink": not bool(
            (enrollment or {}).get("program_id")
            or (preferred_class or {}).get("program_id")
        ),
    }

    return {
        "batch": batch,
        "sections": section_rows,
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

    selected_section = await db.fetch_one("sections", {"id": payload.section_id}) if payload.section_id else None
    enrollment_record = await db.fetch_one("student_enrollments", {"student_id": student_id})
    if not selected_section and batch_id:
        section_candidates = await db.fetch_all("sections", {"batch_id": batch_id})
        selected_section = _pick_preferred_class(section_candidates, current_user.get("section"))

    if selected_section and dept_id and selected_section.get("department_id") not in {None, dept_id}:
        raise HTTPException(status_code=403, detail="Selected class is outside your department scope")
    if selected_section and batch_id and selected_section.get("batch_id") not in {None, batch_id}:
        raise HTTPException(status_code=403, detail="Selected class does not belong to your batch")

    course_lookup: Dict[str, Dict[str, Any]] = {}
    for subject_id in payload.subject_ids:
        course = await db.fetch_one("courses", {"id": subject_id})
        if course:
            course_lookup[str(subject_id)] = course

    program_id = (
        (selected_section or {}).get("program_id")
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
        (selected_section or {}).get("semester_id")
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
                "class_id": (selected_section or {}).get("id") or payload.class_id or (enrollment_record or {}).get("class_id"),
                "year_of_study": year_of_study,
                "status": "active",
                "updated_at": now,
            },
            on_conflict="student_id, program_id",
        )
        if not enrollment_upsert:
            raise HTTPException(status_code=500, detail="Failed to update student enrollment")

    user_updates: Dict[str, Any] = {"onboarding_step": 5}
    if (selected_section or {}).get("section"):
        user_updates["section"] = selected_section.get("section")
    elif (selected_section or {}).get("section_name"):
        user_updates["section"] = selected_section.get("section_name")
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
        "preferredClassId": (selected_section or {}).get("id"),
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
        "classId": (selected_section or {}).get("id") or payload.class_id,
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
    current_user: Dict[str, Any] = Depends(get_current_user),
    student_store: StudentStore = Depends(get_student_store)
):
    """
    Returns an 8-character connection code for parent-student linking.
    Format: LUM-XXXXXX
    Expires in 10 minutes (600 seconds).
    """
    try:
        # Check if there's already an active code
        status = await student_store.get_parent_link_status(current_user["id"])
        
        if status["status"] == "pending":
            code = status["code"]
            from datetime import datetime
            expires_at = datetime.fromisoformat(status["expires_at"].replace("Z", "+00:00")).replace(tzinfo=None)
            remaining = int((expires_at - datetime.utcnow()).total_seconds())
        else:
            # Generate a new code
            code = await student_store.generate_parent_link_code(current_user["id"])
            remaining = 600
        
        return {
            "token": code,
            "expires_in": max(0, remaining),
            "display_id": current_user["id"],
            "status": status["status"]
        }
    except Exception as e:
        logger.error("get_connection_token_failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to generate connection code")


@router.post("/refresh-link-code")
async def refresh_link_code(
    current_user: Dict[str, Any] = Depends(get_current_user),
    student_store: StudentStore = Depends(get_student_store)
):
    """
    Forces the generation of a new 8-character connection code.
    """
    try:
        code = await student_store.generate_parent_link_code(current_user["id"])
        return {
            "token": code,
            "expires_in": 600,
            "display_id": current_user["id"]
        }
    except Exception as e:
        logger.error("refresh_link_code_failed", error=str(e))
        # Returning actual error message for deep debug
        raise HTTPException(status_code=500, detail=f"Failed to refresh connection code: {str(e)}")


@router.get("/parent-connection-status")
async def get_parent_connection_status(
    current_user: Dict[str, Any] = Depends(get_current_user),
    student_store: StudentStore = Depends(get_student_store)
):
    """
    Polls for the status of the parent-student link.
    """
    try:
        status = await student_store.get_parent_link_status(current_user["id"])
        return status
    except Exception as e:
        logger.warning("poll_parent_connection_status_failed", student_id=current_user["id"], error=str(e))
        return {"status": "pending"}


# ─── Behavior Tracking Pipeline ───────────────────────────────────────────────

@router.post("/behavior")
async def ingest_behavior_batch(
    request: BehaviorBatchRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Receives a batch of real-time behavior signals from the frontend.

    Signal types: typing_burst, paste_detected, scroll, idle, focus_lost,
    focus_regained, mouse_idle, time_on_question, session_heartbeat.

    Signals are stored in behavior_logs and used to update the student's
    cognitive load and authenticity KPIs via the personalization service.
    """
    if current_user.get("role") not in ("student", "peer_tutor"):
        raise HTTPException(status_code=403, detail="Student access required")

    user_id = current_user["id"]
    db = get_scoped_db(current_user)
    signals = request.signals

    # ── 1. Persist to behavior_logs ───────────────────────────────────────
    rows = [
        {
            "user_id": user_id,
            "course_id": request.course_id,
            "event_type": s.event_type,
            "event_data": {
                **s.payload,
                "question_id": request.question_id,
                "session_id": request.session_id,
            },
            "timestamp": s.ts,
        }
        for s in signals
    ]
    try:
        await supabase_db.table("behavior_logs").insert(rows).execute()
    except Exception as exc:
        logger.warning("behavior_logs_insert_failed", user_id=user_id, error=str(exc))

    # ── 2. Derive quick cognitive / authenticity signals ──────────────────
    paste_events = [s for s in signals if s.event_type == "paste_detected"]
    idle_events = [s for s in signals if s.event_type in ("idle", "mouse_idle")]
    time_on_q_events = [s for s in signals if s.event_type == "time_on_question"]

    # Build a lightweight assessment-answer-like payload so the KPI engine
    # can update authenticity without a quiz answer
    if paste_events or time_on_q_events:
        for s in paste_events:
            char_count = s.payload.get("char_count", 0)
            # Model paste as very fast typing: chars_per_sec = char_count / 0.1s
            synthetic_payload = {
                "is_correct": None,
                "time_taken": 0.1,
                "answer_text": "x" * int(char_count),
                "source": "paste_detection",
                "session_id": request.session_id,
                "course_id": request.course_id,
            }
            await get_personalization_service(db=db).record_event(
                user_id,
                LearningEventType.ASSESSMENT_ANSWER,
                payload=synthetic_payload,
                source="behavior_tracker",
                course_id=request.course_id,
                role=current_user.get("role", "student"),
            )

    # ── 3. Log idle signals as activity events ────────────────────────────
    if idle_events:
        await get_personalization_service(db=db).record_event(
            user_id,
            LearningEventType.ACTIVITY_LOGGED,
            payload={
                "idle_signal": True,
                "idle_count": len(idle_events),
                "session_id": request.session_id,
                "course_id": request.course_id,
            },
            source="behavior_tracker",
            course_id=request.course_id,
            role=current_user.get("role", "student"),
        )

    return {
        "status": "ok",
        "accepted": len(signals),
        "session_id": request.session_id,
    }


# ─── Adaptive Question Engine ─────────────────────────────────────────────────

@router.post("/adaptive-question")
async def get_adaptive_question(
    request: AdaptiveQuestionRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Returns the next best question for the student using BKT mastery scores.

    Selection algorithm:
      1. Load student mastery_state for the course/topic
      2. Fetch published quiz questions for the course (optionally filtered by topic)
      3. Score each question by how well its difficulty matches the student's
         current mastery (zone-of-proximal-development targeting)
      4. Return the highest-scoring question not in exclude_ids
    """
    if current_user.get("role") not in ("student", "peer_tutor"):
        raise HTTPException(status_code=403, detail="Student access required")

    user_id = current_user["id"]
    db = get_scoped_db(current_user)

    from app.services.adaptive_engine import AdaptiveEngine
    engine = AdaptiveEngine(db=db)
    result = await engine.select_next_question(
        user_id=user_id,
        course_id=request.course_id,
        topic_id=request.topic_id,
        exclude_ids=request.exclude_ids,
    )

    if result is None:
        raise HTTPException(status_code=404, detail="No suitable question found")

    return result


# ─── Spaced Repetition Review Schedule ───────────────────────────────────────

@router.get("/review-schedule")
async def get_review_schedule(
    course_id: Optional[str] = None,
    limit: int = 10,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Returns topics/concepts due for spaced-repetition review using the SM-2
    algorithm applied to the student's skill_mastery and KPI history.

    Topics are ranked by urgency (overdue first, then by forgetting-curve decay).
    """
    if current_user.get("role") not in ("student", "peer_tutor"):
        raise HTTPException(status_code=403, detail="Student access required")

    user_id = current_user["id"]
    db = get_scoped_db(current_user)

    from app.services.spaced_repetition import SpacedRepetitionScheduler
    scheduler = SpacedRepetitionScheduler(db=db)
    schedule = await scheduler.get_due_reviews(
        user_id=user_id,
        course_id=course_id,
        limit=limit,
    )
    return {"schedule": schedule, "count": len(schedule)}


@router.get("/spaced-repetition")
async def get_student_spaced_repetition(
    limit: int = 10,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Returns flashcards due for review using the FSRS engine.
    Matches frontend /api/student/spaced-repetition call.
    """
    if current_user.get("role") not in ("student", "peer_tutor"):
        raise HTTPException(status_code=403, detail="Student access required")

    student_id = current_user["id"]
    db_client = supabase_db.get_client()

    try:
        # 1. Fetch due cards from FSRS engine
        cards = await get_due_cards(db_client, student_id, limit=limit)
        
        # 2. Count reviews today
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
        reviewed_today_res = await db_client.table("fsrs_cards").select("card_id", count="exact").eq("student_id", student_id).gte("last_reviewed_at", today_start).async_execute()
        reviewed_today = reviewed_today_res.count if reviewed_today_res.count is not None else 0

        # 3. Format cards for frontend
        formatted_cards = []
        for card in cards:
            formatted_cards.append({
                "id": card.get("card_id"),
                "front": card.get("front"),
                "back": card.get("back"),
                "category": card.get("source") or "General",
                "difficulty": "medium" if card.get("difficulty", 0.5) < 0.7 else "hard" if card.get("difficulty", 0.5) >= 0.7 else "easy",
                "lastReviewed": card.get("last_reviewed_at"),
                "nextReview": card.get("next_review_date"),
                "status": "review" if card.get("review_count", 0) > 0 else "new",
            })

        return {
            "cards": formatted_cards,
            "reviewedToday": reviewed_today,
            "dueToday": len(cards),
            "streak": 5, # Mock streak, could be fetched from user_stats
            "nextReviewIn": "Tomorrow at 9:00 AM" if not cards else "Now",
        }
    except Exception as exc:
        logger.error("get_spaced_repetition_failed", user_id=student_id, error=str(exc))
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/spaced-repetition/review")
async def submit_student_spaced_repetition_review(
    body: SpacedRepetitionReviewRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Submits a review for an FSRS card.
    Matches frontend /api/student/spaced-repetition/review call.
    """
    if current_user.get("role") not in ("student", "peer_tutor"):
        raise HTTPException(status_code=403, detail="Student access required")

    student_id = current_user["id"]
    db_client = supabase_db.get_client()

    try:
        updated_card = await fsrs_update_card(
            db_client,
            student_id=student_id,
            card_id=body.cardId,
            grade=body.grade,
        )
        if not updated_card:
            raise HTTPException(status_code=404, detail="Card not found or update failed")
            
        return {"status": "ok", "card": updated_card}
    except Exception as exc:
        logger.error("submit_review_failed", user_id=student_id, error=str(exc))
        raise HTTPException(status_code=500, detail=str(exc))


# ─── Master Orchestrator Endpoint ─────────────────────────────────────────────

@router.post("/answer")
async def submit_answer(
    request: StudentAnswerRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    MASTER INTELLIGENCE PIPELINE — submit a student answer.

    Triggers the full on_student_answer() orchestration:
      1. Multi-dimensional answer analysis (40/30/20/10 scoring)
      2. BKT mastery update
      3. DKT sequence update
      4. KPI recompute
      5. RL explanation style reward
      6. Trait detection update
      7. Adaptive next question selection
      8. Intervention check

    Returns: learning_score, next_question, kpi_snapshot, traits, probes.
    """
    if current_user.get("role") not in ("student", "peer_tutor"):
        raise HTTPException(status_code=403, detail="Student access required")

    db = get_scoped_db(current_user)

    from app.services.orchestrator import AdaptiveOrchestrator
    orchestrator = AdaptiveOrchestrator(db=db)

    try:
        result = await orchestrator.on_student_answer(
            user_id          = current_user["id"],
            course_id        = request.course_id,
            topic_id         = request.topic_id,
            question_id      = request.question_id,
            question_text    = request.question_text,
            answer_text      = request.answer_text,
            is_correct       = request.is_correct,
            correct_answer   = request.correct_answer,
            difficulty       = request.difficulty,
            time_taken_s     = request.time_taken_s,
            correction_count = request.correction_count,
            behavior_signals = request.behavior_signals,
            session_id       = request.session_id,
            exclude_q_ids    = request.exclude_q_ids,
            debug_mode       = request.debug_mode,
            current_user     = current_user,
        )
    except Exception as exc:
        logger.error("orchestrator_failed", user_id=current_user["id"], error=str(exc))
        raise HTTPException(status_code=500, detail=f"Pipeline error: {exc}")

    return {
        "status": "ok",
        # Answer analysis
        "learning_score":      result.learning_score,
        "dimensions": {
            "correctness":     result.correctness,
            "depth":           result.depth,
            "effort":          result.effort,
            "growth_delta":    result.growth_delta,
        },
        # Authenticity
        "authenticity": {
            "score":           result.authenticity_score,
            "probe_question":  result.probe_question,
        },
        # Knowledge state
        "knowledge": {
            "mastery_after":   result.mastery_after,
            "dkt_knowledge":   result.dkt_knowledge,
            "lag_concepts":    result.lag_concepts,
            "mastered":        result.mastered_concepts,
        },
        # Next adaptive step
        "next": {
            "question":        result.next_question,
            "question_type":   result.next_question_type,
        },
        # Student state
        "kpi":        result.kpi_snapshot,
        "traits":     result.traits,
        # Intervention
        "intervention": {
            "triggered": result.intervention_triggered,
            "reason":    result.intervention_reason,
        },
        "latency_ms": result.pipeline_latency_ms,
        # Debug trace (only when debug_mode=True)
        **({"debug": result.debug_trace} if request.debug_mode else {}),
    }


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
