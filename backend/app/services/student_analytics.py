"""
Student Analytics Service
=========================
Provides AI-driven analysis of student performance that runs on top of the
existing event log and learner profile.  Results are stored back into
``profile.metadata["ai_analytics"]`` so every consumer (dashboard, teacher
queue, AI tutor, assessment) can read them without extra API calls.

Analyses performed:
  1. Score Classification   – tier derived from quiz + assessment averages
  2. Study Pattern Detection – from weekly event distribution (7-day window)
  3. Growth Trend Analysis   – direction + velocity from KPI history
  4. Section Recommendation  – automatic cohort suggestion driven by tier + growth
  5. Strength / Weakness Map – per-concept mastery ranked for the AI tutor
"""

from __future__ import annotations

import math
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

from app.core.logging import structlog
from app.personalization.schemas import (
    LearnerProfileRecord,
    LearningEventRecord,
    LearningEventType,
)

log = structlog.get_logger()

# ── Tier thresholds (score as percentage 0-100) ────────────────────────────────
_TIER_THRESHOLDS = [
    (80.0, "advanced"),
    (65.0, "proficient"),
    (45.0, "developing"),
    (0.0,  "struggling"),
]

# ── Section labels that map to tier ───────────────────────────────────────────
_TIER_TO_SECTION: Dict[str, str] = {
    "advanced":   "A",
    "proficient": "B",
    "developing": "C",
    "struggling": "D",
}

# ── How many KPI snapshots to use for trend regression ────────────────────────
_TREND_WINDOW = 10


# ═══════════════════════════════════════════════════════════════════════════════
# Public entry point
# ═══════════════════════════════════════════════════════════════════════════════

def compute_student_analytics(
    profile: LearnerProfileRecord,
    recent_events: List[LearningEventRecord],
) -> Dict[str, Any]:
    """
    Runs all analyses and returns a single dict ready for storage and API
    delivery.  Never raises; always returns something useful.
    """
    try:
        tier, tier_score = _classify_tier(profile)
        pattern, pattern_detail = _detect_study_pattern(recent_events)
        trend, trend_velocity = _compute_growth_trend(profile)
        section = _recommend_section(tier, trend)
        strengths, weaknesses = _rank_concepts(profile)
        score_breakdown = _build_score_breakdown(profile, recent_events)
        risk_flags = _build_risk_flags(profile, pattern, trend, tier)

        analytics = {
            # ── Tier / Section ────────────────────────────────────────────
            "tier": tier,                          # struggling / developing / proficient / advanced
            "tier_score": round(tier_score, 1),    # 0-100
            "recommended_section": section,        # A / B / C / D
            # ── Study pattern ─────────────────────────────────────────────
            "study_pattern": pattern,              # consistent / cramming / bursty / declining / inactive
            "study_pattern_detail": pattern_detail,
            # ── Growth ────────────────────────────────────────────────────
            "growth_trend": trend,                 # improving / plateauing / declining
            "growth_velocity": round(trend_velocity, 3),  # Δ per week (-1 to +1)
            # ── Score breakdown ───────────────────────────────────────────
            "score_breakdown": score_breakdown,
            # ── Concept map ───────────────────────────────────────────────
            "top_strengths": strengths[:5],
            "top_weaknesses": weaknesses[:5],
            # ── Risk flags ────────────────────────────────────────────────
            "risk_flags": risk_flags,
            # ── Meta ──────────────────────────────────────────────────────
            "computed_at": datetime.utcnow().isoformat(),
            "event_window_used": len(recent_events),
        }

        log.info(
            "student_analytics_computed",
            user_id=profile.user_id,
            tier=tier,
            pattern=pattern,
            trend=trend,
        )
        return analytics

    except Exception as exc:  # pragma: no cover
        log.error("student_analytics_failed", user_id=profile.user_id, error=str(exc))
        return {"error": str(exc), "computed_at": datetime.utcnow().isoformat()}


# ═══════════════════════════════════════════════════════════════════════════════
# 1. Score Tier Classification
# ═══════════════════════════════════════════════════════════════════════════════

def _classify_tier(profile: LearnerProfileRecord) -> Tuple[str, float]:
    """
    Blends quiz_average, assessment_average, and recent_average_score into
    a single 0-100 representative score, then maps it to a tier.
    Weights: assessment 50 %, recent_avg 30 %, quiz 20 %.
    """
    perf = profile.performance_summary
    assessment_avg = _pct(perf.assessment_average)
    quiz_avg       = _pct(perf.quiz_average)
    recent_avg     = _pct(perf.recent_average_score)

    # Weighted blend
    if assessment_avg == 0 and quiz_avg == 0:
        blended = recent_avg
    else:
        weights = {"assessment": 0.5, "recent": 0.3, "quiz": 0.2}
        blended = (
            assessment_avg * weights["assessment"]
            + recent_avg   * weights["recent"]
            + quiz_avg     * weights["quiz"]
        )

    for threshold, label in _TIER_THRESHOLDS:
        if blended >= threshold:
            return label, blended

    return "struggling", blended


# ═══════════════════════════════════════════════════════════════════════════════
# 2. Study Pattern Detection
# ═══════════════════════════════════════════════════════════════════════════════

def _detect_study_pattern(
    events: List[LearningEventRecord],
    window_days: int = 14,
) -> Tuple[str, str]:
    """
    Analyses the temporal distribution of events over the last *window_days* days.

    Patterns:
      consistent  – activity on ≥5 distinct days
      cramming    – ≥60 % of sessions concentrated in 1-2 days
      bursty      – activity on 3-4 days but with long (>3-day) gaps
      declining   – activity in first half of window but not second
      inactive    – fewer than 3 events total
    """
    if not events:
        return "inactive", "No learning activity detected in the recent window."

    now = datetime.utcnow()
    cutoff = now - timedelta(days=window_days)

    # Filter to window
    windowed = [
        e for e in events
        if e.created_at.replace(tzinfo=None) >= cutoff
    ]

    if len(windowed) < 3:
        return "inactive", "Fewer than 3 learning events in the past two weeks."

    # Map events → day offsets from today
    day_counts: Dict[int, int] = defaultdict(int)
    for e in windowed:
        offset = (now.date() - e.created_at.date()).days
        day_counts[offset] += 1

    active_days = len(day_counts)
    total_events = len(windowed)

    # Declining: activity in days 8-14 but almost none in 0-7
    recent_half  = sum(v for k, v in day_counts.items() if k <= 7)
    earlier_half = sum(v for k, v in day_counts.items() if k > 7)
    if earlier_half > 0 and recent_half < (earlier_half * 0.4):
        return (
            "declining",
            f"Study activity is dropping off — {recent_half} events this week vs "
            f"{earlier_half} the week before.",
        )

    # Consistent: spread across many days
    if active_days >= 5:
        return (
            "consistent",
            f"Great work! Activity spread across {active_days} different days — "
            "this spaced practice is optimal for long-term retention.",
        )

    # Cramming: most events in 1-2 days
    top_two_days = sorted(day_counts.values(), reverse=True)[:2]
    if sum(top_two_days) / total_events >= 0.6:
        return (
            "cramming",
            f"{round(sum(top_two_days)/total_events*100)}% of your activity is "
            "concentrated in just 1-2 days. Try spreading sessions across more days "
            "for better retention.",
        )

    # Bursty: active but with gaps
    sorted_days = sorted(day_counts.keys())
    max_gap = max(
        (sorted_days[i+1] - sorted_days[i] for i in range(len(sorted_days) - 1)),
        default=0,
    )
    if max_gap > 3:
        return (
            "bursty",
            f"Your sessions are uneven — there was a {max_gap}-day gap between study "
            "sessions. Short daily sessions outperform infrequent long ones.",
        )

    return (
        "consistent",
        f"Reasonably consistent study pattern detected across {active_days} days.",
    )


# ═══════════════════════════════════════════════════════════════════════════════
# 3. Growth Trend Analysis
# ═══════════════════════════════════════════════════════════════════════════════

def _compute_growth_trend(
    profile: LearnerProfileRecord,
) -> Tuple[str, float]:
    """
    Fits a simple linear regression through the last _TREND_WINDOW KPI snapshots
    (using readiness as the mastery proxy) to compute direction and velocity.

    Returns (trend_label, slope_per_week).
    trend_label: improving | plateauing | declining
    slope_per_week: estimated weekly change in readiness (−1 to +1)
    """
    history = profile.kpi_history or []

    if len(history) < 2:
        # Fall back to single-snapshot comparison against performance summary
        perf_score = _pct(profile.performance_summary.recent_average_score) / 100.0
        if perf_score >= 0.7:
            return "improving", 0.0
        if perf_score >= 0.4:
            return "plateauing", 0.0
        return "declining", 0.0

    # Use the most recent _TREND_WINDOW snapshots
    snapshots = list(history)[-_TREND_WINDOW:]
    n = len(snapshots)

    # x = ordinal (0 = oldest, n-1 = newest)
    # y = readiness (proxy for overall mastery)
    xs = list(range(n))
    ys = [s.readiness for s in snapshots]

    slope = _linear_slope(xs, ys)

    # Convert ordinal slope to per-week velocity.
    # Snapshots are recorded after each assessment; average ~2 per week.
    slope_per_week = slope * 2.0

    # Classify
    if slope > 0.01:
        label = "improving"
    elif slope < -0.01:
        label = "declining"
    else:
        label = "plateauing"

    return label, round(slope_per_week, 3)


def _linear_slope(xs: List[float], ys: List[float]) -> float:
    """Ordinary least squares slope."""
    n = len(xs)
    if n < 2:
        return 0.0
    mean_x = sum(xs) / n
    mean_y = sum(ys) / n
    num = sum((xs[i] - mean_x) * (ys[i] - mean_y) for i in range(n))
    den = sum((xs[i] - mean_x) ** 2 for i in range(n))
    return (num / den) if den != 0 else 0.0


# ═══════════════════════════════════════════════════════════════════════════════
# 4. Section Recommendation
# ═══════════════════════════════════════════════════════════════════════════════

def _recommend_section(tier: str, trend: str) -> str:
    """
    Combines tier and growth trend to recommend a section.
    Rapid improvers may be bumped up; declining students flagged for support.

    Section A = advanced / top cohort
    Section B = proficient
    Section C = developing
    Section D = struggling / needs support
    """
    base = _TIER_TO_SECTION.get(tier, "C")

    # A developing student who is rapidly improving may be ready for B
    if tier == "developing" and trend == "improving":
        return "B"

    # A proficient student who is consistently declining may need C support
    if tier == "proficient" and trend == "declining":
        return "C"

    # Advanced student declining → keep in A but flag
    return base


# ═══════════════════════════════════════════════════════════════════════════════
# 5. Concept Strength / Weakness Map
# ═══════════════════════════════════════════════════════════════════════════════

def _rank_concepts(
    profile: LearnerProfileRecord,
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Returns (strengths, weaknesses) sorted by mastery score descending / ascending.
    Each item: {topic, score, confidence, attempts, trend_hint}
    """
    items = []
    for topic_id, mastery in profile.mastery_state.items():
        score_pct = round(mastery.score * 100, 1)
        items.append({
            "topic": topic_id,
            "score": score_pct,
            "confidence": round(mastery.confidence * 100, 1),
            "attempts": mastery.attempts,
            "integrity": round(mastery.integrity_score, 2),
            "trend_hint": (
                "needs_practice" if mastery.score < 0.45
                else "on_track" if mastery.score < 0.75
                else "mastered"
            ),
        })

    strengths  = sorted(items, key=lambda x: x["score"], reverse=True)
    weaknesses = sorted(items, key=lambda x: x["score"])
    return strengths, weaknesses


# ═══════════════════════════════════════════════════════════════════════════════
# 6. Score Breakdown
# ═══════════════════════════════════════════════════════════════════════════════

def _build_score_breakdown(
    profile: LearnerProfileRecord,
    events: List[LearningEventRecord],
) -> Dict[str, Any]:
    """
    Returns structured score breakdown from profile + recent events.
    Includes: quiz, assessment, assignment, overall, recent trend (7-day).
    """
    perf = profile.performance_summary
    now = datetime.utcnow()
    seven_days_ago = now - timedelta(days=7)

    # 7-day score trend from events
    recent_scores: List[float] = []
    for e in events:
        if e.created_at.replace(tzinfo=None) < seven_days_ago:
            continue
        if e.event_type in (
            LearningEventType.ASSESSMENT_ANSWER,
            LearningEventType.QUIZ_RESULT,
        ):
            score_raw = e.payload.get("score")
            if score_raw is not None:
                recent_scores.append(float(score_raw))
            elif e.payload.get("is_correct") is not None:
                recent_scores.append(1.0 if e.payload["is_correct"] else 0.0)

    recent_avg_7d = (
        round(sum(recent_scores) / len(recent_scores) * 100, 1)
        if recent_scores
        else None
    )

    return {
        "quiz_average":        round(_pct(perf.quiz_average), 1),
        "assessment_average":  round(_pct(perf.assessment_average), 1),
        "assignment_average":  round(_pct(perf.assignment_average), 1),
        "recent_average":      round(_pct(perf.recent_average_score), 1),
        "recent_7d_average":   recent_avg_7d,
        "low_score_count":     perf.low_score_count,
        "high_score_count":    perf.high_score_count,
        "total_assessments":   profile.engagement_summary.total_assessments_completed,
        "total_quiz_attempts": profile.engagement_summary.total_quiz_attempts,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# 7. Risk Flags
# ═══════════════════════════════════════════════════════════════════════════════

def _build_risk_flags(
    profile: LearnerProfileRecord,
    pattern: str,
    trend: str,
    tier: str,
) -> List[Dict[str, str]]:
    """
    Emits structured risk flags visible to both the student and the teacher.
    """
    flags: List[Dict[str, str]] = []

    if tier == "struggling":
        flags.append({
            "code": "LOW_PERFORMANCE",
            "level": "critical",
            "message": "Overall score is below 45%. Immediate remediation recommended.",
        })

    if trend == "declining":
        flags.append({
            "code": "DECLINING_TREND",
            "level": "high",
            "message": "Performance is trending downward over the last several assessments.",
        })

    if pattern == "cramming":
        flags.append({
            "code": "CRAMMING_PATTERN",
            "level": "medium",
            "message": "Study sessions are heavily concentrated. Encourage spaced practice.",
        })

    if pattern == "inactive":
        flags.append({
            "code": "LOW_ENGAGEMENT",
            "level": "high",
            "message": "Fewer than 3 learning activities detected in the last 2 weeks.",
        })

    if pattern == "declining":
        flags.append({
            "code": "DECREASING_ACTIVITY",
            "level": "medium",
            "message": "Study activity is dropping week over week.",
        })

    risk_level = profile.risk_summary.risk_level
    if risk_level in ("high", "critical") and not any(f["code"] == "RISK_PROFILE" for f in flags):
        flags.append({
            "code": "RISK_PROFILE",
            "level": risk_level,
            "message": f"Student risk profile is {risk_level.upper()}. "
                       f"Reasons: {', '.join(profile.risk_summary.reasons[:2]) or 'see profile'}.",
        })

    return flags


# ═══════════════════════════════════════════════════════════════════════════════
# Helpers
# ═══════════════════════════════════════════════════════════════════════════════

def _pct(value: Any, scale: float = 1.0) -> float:
    """Safe conversion; if value is already 0-100 return as-is, else scale."""
    try:
        v = float(value or 0)
    except (TypeError, ValueError):
        return 0.0
    # Detect 0-1 scale vs 0-100 scale
    if v <= 1.0 and scale == 1.0:
        return v * 100.0
    return v
