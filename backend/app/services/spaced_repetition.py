"""
spaced_repetition.py — SM-2 Spaced Repetition Scheduler

Uses the SuperMemo SM-2 algorithm adapted for the Lumina KPI engine.
Each concept in skill_mastery gets an ease factor, repetition count, and
next-review date that are updated after every quiz result.

Review urgency is computed as:
    urgency = days_overdue * (1 / ease_factor) * (1 - mastery_score)

Topics with low mastery AND long overdue get the highest urgency.
"""

import logging
import math
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# SM-2 defaults
DEFAULT_EASE_FACTOR = 2.5
MIN_EASE_FACTOR = 1.3
EASE_FACTOR_STEP = 0.1    # δ applied per review

# Initial interval schedule (days): first two repetitions are fixed
INITIAL_INTERVALS = [1, 6]


def _sm2_update(
    ease_factor: float,
    repetitions: int,
    interval_days: int,
    quality: int,  # 0-5 (SM-2 quality grade)
) -> Dict[str, Any]:
    """
    Returns updated SM-2 state after a review with the given quality score.
    quality: 0-2 = failure; 3-5 = pass (SM-2 convention)
    """
    if quality < 3:
        # Reset on failure: start over from interval 1
        repetitions = 0
        interval_days = 1
    else:
        if repetitions == 0:
            interval_days = INITIAL_INTERVALS[0]
        elif repetitions == 1:
            interval_days = INITIAL_INTERVALS[1]
        else:
            interval_days = max(1, round(interval_days * ease_factor))
        repetitions += 1

    # Update ease factor
    ease_factor = max(
        MIN_EASE_FACTOR,
        ease_factor + EASE_FACTOR_STEP * (5 - quality) * (0.08 + 0.02 * (5 - quality) - 0.02),
    )

    next_review = datetime.now(timezone.utc) + timedelta(days=interval_days)

    return {
        "ease_factor": round(ease_factor, 3),
        "repetitions": repetitions,
        "interval_days": interval_days,
        "next_review_at": next_review.isoformat(),
    }


def _mastery_to_quality(mastery_score: float, accuracy: Optional[float] = None) -> int:
    """
    Convert mastery score (0-1) to SM-2 quality (0-5).
    Optionally blended with accuracy from a recent quiz.
    """
    score = mastery_score
    if accuracy is not None:
        score = 0.6 * mastery_score + 0.4 * accuracy

    if score >= 0.9:
        return 5
    if score >= 0.75:
        return 4
    if score >= 0.6:
        return 3
    if score >= 0.4:
        return 2
    if score >= 0.2:
        return 1
    return 0


def _urgency(
    mastery_score: float,
    ease_factor: float,
    next_review_at: Optional[str],
) -> float:
    """
    Higher urgency = review more overdue + lower mastery.
    """
    now = datetime.now(timezone.utc)
    if next_review_at:
        try:
            review_dt = datetime.fromisoformat(next_review_at)
            if review_dt.tzinfo is None:
                review_dt = review_dt.replace(tzinfo=timezone.utc)
            days_overdue = max(0, (now - review_dt).total_seconds() / 86400)
        except ValueError:
            days_overdue = 1.0
    else:
        days_overdue = 7.0  # No review scheduled → treat as overdue by a week

    forgetting_penalty = 1.0 / max(ease_factor, 0.5)
    mastery_gap = 1.0 - mastery_score

    return round(days_overdue * forgetting_penalty * (0.5 + mastery_gap), 4)


class SpacedRepetitionScheduler:
    """
    Computes spaced-repetition review schedules using SM-2 + KPI mastery data.
    """

    def __init__(self, db: Any):
        self.db = db

    async def get_due_reviews(
        self,
        user_id: str,
        course_id: Optional[str] = None,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """
        Returns topics/skills due for review, ranked by urgency.
        """
        now_iso = datetime.now(timezone.utc).isoformat()

        try:
            q = (
                self.db.table("skill_mastery")
                .select(
                    "id, skill_name, course_id, mastery_score, confidence, "
                    "bkt_p_l0, assessment_count, last_assessed, "
                    "ease_factor, repetitions, interval_days, next_review_at"
                )
                .eq("user_id", user_id)
            )
            if course_id:
                q = q.eq("course_id", course_id)
            result = await q.execute()
            rows = result.data or []
        except Exception as exc:
            logger.warning("spaced_repetition_fetch_failed", error=str(exc))
            return []

        if not rows:
            return []

        # Filter to topics that are due (next_review_at <= now OR None)
        due: List[Dict[str, Any]] = []
        for row in rows:
            nra = row.get("next_review_at")
            if nra:
                try:
                    review_dt = datetime.fromisoformat(nra)
                    if review_dt.tzinfo is None:
                        review_dt = review_dt.replace(tzinfo=timezone.utc)
                    if review_dt > datetime.now(timezone.utc):
                        continue  # Not yet due
                except ValueError:
                    pass

            mastery = float(row.get("mastery_score") or 0.1)
            ef = float(row.get("ease_factor") or DEFAULT_EASE_FACTOR)
            urgency = _urgency(mastery, ef, nra)

            due.append({
                "skill_id": row["id"],
                "skill_name": row["skill_name"],
                "course_id": row["course_id"],
                "mastery_score": round(mastery, 3),
                "confidence": round(float(row.get("confidence") or 0.5), 3),
                "assessment_count": row.get("assessment_count") or 0,
                "last_assessed": row.get("last_assessed"),
                "next_review_at": nra,
                "ease_factor": round(ef, 3),
                "repetitions": row.get("repetitions") or 0,
                "interval_days": row.get("interval_days") or 1,
                "urgency": urgency,
            })

        # Sort by urgency descending
        due.sort(key=lambda x: x["urgency"], reverse=True)
        return due[:limit]

    async def update_after_review(
        self,
        user_id: str,
        course_id: str,
        skill_name: str,
        mastery_score: float,
        accuracy: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Called after a student completes a quiz/assessment for a skill.
        Updates SM-2 state in skill_mastery table.
        """
        quality = _mastery_to_quality(mastery_score, accuracy)

        # Fetch current SM-2 state
        try:
            result = (
                await self.db.table("skill_mastery")
                .select("id, ease_factor, repetitions, interval_days, next_review_at")
                .eq("user_id", user_id)
                .eq("course_id", course_id)
                .eq("skill_name", skill_name)
                .maybe_single()
                .execute()
            )
            row = result.data if result else None
        except Exception as exc:
            logger.warning("sm2_fetch_current_state_failed", error=str(exc))
            row = None

        current_ef = float(row["ease_factor"]) if row and row.get("ease_factor") else DEFAULT_EASE_FACTOR
        current_reps = int(row["repetitions"]) if row and row.get("repetitions") else 0
        current_interval = int(row["interval_days"]) if row and row.get("interval_days") else 1

        updated = _sm2_update(current_ef, current_reps, current_interval, quality)

        update_payload = {
            "ease_factor": updated["ease_factor"],
            "repetitions": updated["repetitions"],
            "interval_days": updated["interval_days"],
            "next_review_at": updated["next_review_at"],
            "mastery_score": round(mastery_score, 4),
            "last_assessed": datetime.now(timezone.utc).isoformat(),
        }
        if accuracy is not None:
            update_payload["confidence"] = round(accuracy, 4)

        try:
            if row:
                await (
                    self.db.table("skill_mastery")
                    .update(update_payload)
                    .eq("id", row["id"])
                    .execute()
                )
            else:
                await (
                    self.db.table("skill_mastery")
                    .insert({
                        "user_id": user_id,
                        "course_id": course_id,
                        "skill_name": skill_name,
                        **update_payload,
                    })
                    .execute()
                )
        except Exception as exc:
            logger.warning("sm2_update_failed", error=str(exc))

        return {
            "skill_name": skill_name,
            "quality_grade": quality,
            "sm2": updated,
        }
