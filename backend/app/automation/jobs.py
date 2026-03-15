"""
WS8: Automation Layer — Core Job Implementations
Four smart recurring jobs powered by the canonical learner profile.
"""
import logging
from datetime import datetime, timedelta
from typing import List, Optional

from app.automation.schemas import (
    ClassDigest,
    InactivityAlert,
    RemediationPlan,
    StudentProgressDigest,
)
from app.core.async_utils import run_async
from app.database.supabase_manager import supabase_db
from app.pathway.optimizer import CurriculumOptimizer
from app.personalization.schemas import LearnerProfileRecord
from app.services.personalization_service import get_personalization_service

log = logging.getLogger(__name__)


# ────────────────────────────────────────────────────────────────────────────
# Helpers
# ────────────────────────────────────────────────────────────────────────────

def _load_all_profiles() -> List[LearnerProfileRecord]:
    """Load all learner profiles from the database."""
    client = supabase_db.get_client()
    if not client:
        return []
    try:
        rows = client.table("learner_profiles").select("*").execute().data
        profiles = []
        for row in rows:
            try:
                profiles.append(LearnerProfileRecord(**row))
            except Exception:
                pass
        return profiles
    except Exception as e:
        log.error(f"[Automation] Failed to load profiles: {e}")
        return []


def _get_mastered_concepts(profile: LearnerProfileRecord, threshold: float = 0.75) -> List[str]:
    """Returns concepts where mastery score >= threshold."""
    return [
        concept
        for concept, mastery in profile.mastery_state.items()
        if mastery.score >= threshold
    ]


def _difficulty_to_float(diff: str) -> float:
    return {"beginner": 0.2, "intermediate": 0.5, "advanced": 0.8}.get(diff, 0.5)


# ────────────────────────────────────────────────────────────────────────────
# AUTO-001: Weekly Class Digest
# ────────────────────────────────────────────────────────────────────────────

def run_weekly_class_digest(course_id: str) -> ClassDigest:
    """
    Aggregates learner profiles for a course and produces a teacher-facing weekly digest.
    """
    log.info(f"[AUTO-001] Running Weekly Class Digest for course {course_id}")
    profiles = _load_all_profiles()

    if not profiles:
        return ClassDigest(
            course_id=course_id,
            week_start=datetime.utcnow() - timedelta(days=7),
            at_risk_count=0,
            avg_kpi_score=0.0,
            avg_engagement_minutes=0.0,
            top_weak_concepts=[],
        )

    at_risk_count = 0
    total_kpi = 0.0
    total_minutes = 0.0
    weak_concept_counts: dict = {}
    best_improvement = -1.0
    most_improved_uid: Optional[str] = None

    for profile in profiles:
        # Risk count
        if profile.risk_summary.risk_level in ("high", "critical"):
            at_risk_count += 1

        # KPI score
        kpi = profile.kpi_snapshot.growth_velocity
        total_kpi += kpi
        if kpi > best_improvement:
            best_improvement = kpi
            most_improved_uid = profile.user_id

        # Engagement minutes
        total_minutes += profile.engagement_summary.total_minutes

        # Weak concepts aggregation
        for concept in profile.weak_topics:
            weak_concept_counts[concept] = weak_concept_counts.get(concept, 0) + 1

    n = max(len(profiles), 1)
    top_weak = sorted(weak_concept_counts, key=lambda c: -weak_concept_counts[c])[:5]

    return ClassDigest(
        course_id=course_id,
        week_start=datetime.utcnow() - timedelta(days=7),
        at_risk_count=at_risk_count,
        avg_kpi_score=round(total_kpi / n, 3),
        avg_engagement_minutes=round(total_minutes / n, 1),
        top_weak_concepts=top_weak,
        most_improved_user_id=most_improved_uid,
    )


# ────────────────────────────────────────────────────────────────────────────
# AUTO-002: Post-Assessment Remediation
# ────────────────────────────────────────────────────────────────────────────

def run_post_assessment_remediation(
    user_id: str,
    score: float,
    course_id: Optional[str] = None,
) -> Optional[RemediationPlan]:
    """
    Triggered when a student scores below 65% on an assessment.
    Generates a remediation plan using the CurriculumOptimizer.
    """
    if score >= 0.65:
        return None  # No remediation needed

    log.info(f"[AUTO-002] Generating remediation plan for user {user_id}, score={score:.0%}")

    # Validate UUID format before hitting the DB
    import re
    uuid_pattern = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE)
    if not uuid_pattern.match(user_id):
        log.warning(f"[AUTO-002] Invalid UUID format for user_id: {user_id}")
        return None

    client = supabase_db.get_client()
    if not client:
        return None

    # Load this student's profile
    rows = client.table("learner_profiles").select("*").eq("user_id", user_id).execute().data
    if not rows:
        return None
    try:
        profile = LearnerProfileRecord(**rows[0])
    except Exception as e:
        log.error(f"[AUTO-002] Profile parse error: {e}")
        return None

    weak_concepts = profile.weak_topics or list(profile.mastery_state.keys())[:3]

    # Load curriculum and get recommended next steps
    optimizer = CurriculumOptimizer(course_id=course_id) if course_id else None
    mastered = _get_mastered_concepts(profile)
    recommended: List[str] = []
    if optimizer and optimizer.nodes:
        next_c = optimizer.get_optimal_next_concept(mastered)
        if next_c:
            recommended.append(next_c)
    else:
        # Fallback: recommend revisiting weak concepts
        recommended = weak_concepts[:3]

    return RemediationPlan(
        user_id=user_id,
        triggered_by_score=score,
        weak_concepts=weak_concepts,
        recommended_concepts=recommended,
    )


# ────────────────────────────────────────────────────────────────────────────
# AUTO-003: Inactivity Alert
# ────────────────────────────────────────────────────────────────────────────

def run_inactivity_alert_scan(threshold_hours: float = 48.0) -> List[InactivityAlert]:
    """
    Scans all learner profiles for inactivity > threshold_hours.
    Returns alert objects for each inactive learner.
    """
    log.info(f"[AUTO-003] Scanning for learners inactive > {threshold_hours}h")
    profiles = _load_all_profiles()
    now = datetime.utcnow()
    alerts: List[InactivityAlert] = []

    for profile in profiles:
        last_activity = profile.engagement_summary.last_activity_at
        if last_activity is None:
            hours_inactive = threshold_hours * 2  # treat as very inactive
        else:
            # Make it offset-naive if needed
            if last_activity.tzinfo is not None:
                last_activity = last_activity.replace(tzinfo=None)
            hours_inactive = (now - last_activity).total_seconds() / 3600.0

        if hours_inactive < threshold_hours:
            continue

        risk = profile.risk_summary.risk_level
        if risk in ("high", "critical"):
            nudge = (
                f"Hi! We've noticed you haven't been active for a while. "
                f"Your learning momentum matters — let's pick up where you left off on '{profile.weak_topics[0] if profile.weak_topics else 'your course'}'!"
            )
        elif hours_inactive > 96:
            nudge = (
                "It's been a few days — just a friendly reminder that your course is waiting. "
                "Even 10 minutes today can make a big difference!"
            )
        else:
            nudge = (
                "You're making great progress! Don't break your streak — "
                "come back and continue your learning journey."
            )

        alerts.append(
            InactivityAlert(
                user_id=profile.user_id,
                last_activity_at=last_activity,
                hours_inactive=round(hours_inactive, 1),
                risk_level=risk,
                nudge_message=nudge,
            )
        )

    log.info(f"[AUTO-003] Found {len(alerts)} inactive learners.")
    return alerts


# ────────────────────────────────────────────────────────────────────────────
# AUTO-004: Student Progress Digest
# ────────────────────────────────────────────────────────────────────────────

def run_student_progress_digest(
    user_id: str, course_id: Optional[str] = None
) -> Optional[StudentProgressDigest]:
    """
    Generates a weekly progress digest for a single student.
    """
    log.info(f"[AUTO-004] Running progress digest for user {user_id}")
    client = supabase_db.get_client()
    if not client:
        return None

    rows = client.table("learner_profiles").select("*").eq("user_id", user_id).execute().data
    if not rows:
        return None
    try:
        profile = LearnerProfileRecord(**rows[0])
    except Exception as e:
        log.error(f"[AUTO-004] Profile parse error: {e}")
        return None

    mastered = _get_mastered_concepts(profile, threshold=0.75)

    # Get next recommended concept
    optimizer = CurriculumOptimizer(course_id=course_id) if course_id else None
    next_concept: Optional[str] = None
    if optimizer and optimizer.nodes:
        next_concept = optimizer.get_optimal_next_concept(mastered)

    # Build motivation message based on risk and streak
    streak = profile.engagement_summary.current_streak
    risk = profile.risk_summary.risk_level
    if streak >= 7:
        motivation = f"🔥 Incredible — you're on a {streak}-day streak! Keep pushing forward!"
    elif streak >= 3:
        motivation = f"✨ Nice! You've been consistent for {streak} days in a row. Keep it up!"
    elif risk in ("high", "critical"):
        motivation = "📚 Everyone has tough weeks. You've got this — let's take it one concept at a time."
    else:
        motivation = "👋 A new week, a fresh start! Your next learning milestone is just ahead."

    return StudentProgressDigest(
        user_id=user_id,
        current_streak=streak,
        mastered_this_week=mastered[-5:],  # last 5 mastered concepts
        next_recommended_concept=next_concept,
        motivation_message=motivation,
    )


# ────────────────────────────────────────────────────────────────────────────
# AUTO-006: Intervention Outcome Tracker
# ────────────────────────────────────────────────────────────────────────────

def run_intervention_outcome_tracker() -> dict:
    """
    Checks resolved interventions older than 3 days to see if the learner's
    mastery on the topic has improved. If so, marks as successful.
    """
    log.info("[AUTO-006] Running Intervention Outcome Tracker")
    client = supabase_db.get_client()
    if not client:
        return {"tracked": 0, "successful": 0}

    now = datetime.utcnow()
    three_days_ago = (now - timedelta(days=3)).isoformat()
    
    # Get interventions resolved > 3 days ago that don't have outcome evidence yet
    # We use a naive approach: check all resolved interventions and if they don't have "outcome_tracked" in evidence.
    try:
        rows = client.table("intervention_recommendations").select("*")\
            .eq("status", "resolved")\
            .lte("resolved_at", three_days_ago)\
            .execute().data
    except Exception as e:
        log.error(f"[AUTO-006] Query failed: {e}")
        return {"tracked": 0, "successful": 0}

    tracked = 0
    successful = 0
    service = get_personalization_service()

    for row in rows:
        evidence = row.get("evidence") or {}
        if evidence.get("outcome_tracked"):
            continue
            
        user_id = row.get("user_id")
        topic_id = row.get("topic_id")
        
        try:
            profile = run_async(service.get_profile(user_id))
        except Exception:
            continue
            
        if topic_id and topic_id in profile.mastery_state:
            current_mastery = profile.mastery_state[topic_id].score
            # Assume success if mastery > 0.65 or increased significantly
            is_success = current_mastery > 0.65
        else:
            # If no specific topic or no data, assume success if risk is low
            is_success = profile.risk_summary.risk_level == "low"
            
        if is_success:
            profile.intervention_history.successful_outcomes += 1
            successful += 1
        else:
            profile.intervention_history.failed_outcomes += 1
            
        evidence["outcome_tracked"] = True
        evidence["outcome_success"] = is_success
        evidence["outcome_date"] = now.isoformat()
        
        # Update intervention
        client.table("intervention_recommendations").update({
            "evidence": evidence
        }).eq("id", row["id"]).execute()
        
        # Update profile
        run_async(service.store.upsert_profile(profile))
        tracked += 1

    return {"tracked": tracked, "successful": successful}

# ────────────────────────────────────────────────────────────────────────────
# AUTO-007: Guardian Weekly Summary
# ────────────────────────────────────────────────────────────────────────────

def run_guardian_weekly_summary(user_id: str) -> Optional[dict]:
    """
    Generates a parent/guardian-facing summary using the GuardianAgent.
    """
    log.info(f"[AUTO-007] Running Guardian Weekly Summary for user {user_id}")
    client = supabase_db.get_client()
    if not client:
        return None

    rows = client.table("learner_profiles").select("*").eq("user_id", user_id).execute().data
    if not rows:
        return None
        
    profile_dict = rows[0]
    
    from ai_engine.swarm.guardian import GuardianAgent
    guardian = GuardianAgent()
    
    summary = guardian.generate_guardian_summary(profile_dict)
    
    # Optional: Log this summary to a notifications table or similar
    # For now, return it so the API can return it to the caller
    return summary


def run_profile_refresh(limit: int = 500) -> dict:
    """
    Recomputes KPI/risk/cognitive-load signals for all learner profiles.
    Helpful after offline sync or schema changes.
    """
    service = get_personalization_service()
    profiles = run_async(service.store.list_profiles(limit=limit))
    updated = 0
    for profile in profiles:
        run_async(service.refresh_profile(profile.user_id, role=profile.role))
        updated += 1

    return {
        "updated_profiles": updated,
        "total_profiles": len(profiles),
    }
