"""
FSRS (Free Spaced Repetition Scheduler) service.
Wraps ml_services/core/fsrs.py for use in the main API.

Retrievability: R = e^(-t/S) where t=days since review, S=stability
Due card threshold: R < 0.9

Grade mapping:
  1=Again  → next_review = 1 day
  2=Hard   → next_review = 3 days
  3=Good   → next_review = 7 days * S_factor
  4=Easy   → next_review = 21+ days
"""
import math
import sys
import os
import logging
import uuid
from datetime import datetime, date, timezone, timedelta
from typing import Any, Dict, List, Optional

# Import FSRSModel from ml_services
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'ml_services'))
from core.fsrs import FSRSModel, FSRSState  # noqa: E402

logger = logging.getLogger(__name__)

_fsrs_model = FSRSModel()

RETRIEVABILITY_DUE_THRESHOLD = 0.9

# ─── Helper ───────────────────────────────────────────────────────────────────

def get_retrievability(stability: float, days_since_review: float) -> float:
    """
    R = e^(-days / S), clamped to [0.0, 1.0].
    """
    if stability <= 0:
        return 0.0
    try:
        r = math.exp(-days_since_review / stability)
        return max(0.0, min(1.0, r))
    except (OverflowError, ZeroDivisionError):
        return 0.0


# ─── DB-backed functions ──────────────────────────────────────────────────────

async def get_due_cards(db, student_id: str, limit: int = 5) -> List[dict]:
    """
    Returns up to `limit` FSRS cards that are due for review.
    A card is due if next_review_date <= today OR retrievability < 0.9.
    Sorted ascending by retrievability (most-forgotten first).
    """
    try:
        today_str = date.today().isoformat()

        # Fetch all cards for this student
        result = (
            await db.table("fsrs_cards")
            .select("*")
            .eq("student_id", student_id)
            .execute()
        )
        cards: List[dict] = result.data if result and result.data else []

        due_cards = []
        for card in cards:
            stability       = float(card.get("stability", 1.0))
            next_review_str = card.get("next_review_date", today_str)
            last_review_str = card.get("last_reviewed_at")

            # Days since last review
            if last_review_str:
                try:
                    last_review = datetime.fromisoformat(str(last_review_str)[:10]).date()
                    days_since  = (date.today() - last_review).days
                except ValueError:
                    days_since = 0
            else:
                days_since = 0

            retrievability = get_retrievability(stability, float(days_since))

            # Determine due status
            try:
                next_review_date = date.fromisoformat(str(next_review_str)[:10])
                overdue = next_review_date <= date.today()
            except ValueError:
                overdue = True

            if overdue or retrievability < RETRIEVABILITY_DUE_THRESHOLD:
                card["retrievability"] = round(retrievability, 4)
                due_cards.append(card)

        # Sort ascending by retrievability (most forgotten first)
        due_cards.sort(key=lambda c: c.get("retrievability", 0.0))
        return due_cards[:limit]

    except Exception as exc:
        logger.error("get_due_cards failed: student=%s error=%s", student_id, str(exc))
        return []


async def update_card(db, card_id: str, grade: int, student_id: str) -> dict:
    """
    Apply an FSRS review to a card.
    grade: 1=Again, 2=Hard, 3=Good, 4=Easy
    Updates fsrs_cards table; returns updated card dict.
    """
    try:
        # Fetch current card state
        result = (
            await db.table("fsrs_cards")
            .select("*")
            .eq("card_id", card_id)
            .eq("student_id", student_id)
            .maybe_single()
            .execute()
        )
        if not result or not result.data:
            logger.warning("update_card: card not found card_id=%s", card_id)
            return {}

        card = result.data
        stability        = float(card.get("stability", 1.0))
        difficulty       = float(card.get("difficulty", 0.3))
        last_reviewed_at = card.get("last_reviewed_at")

        # Days since last review for elapsed_days
        if last_reviewed_at:
            try:
                last_dt  = datetime.fromisoformat(str(last_reviewed_at)[:10])
                elapsed  = (datetime.utcnow() - last_dt).days
            except ValueError:
                elapsed = 0
        else:
            elapsed = 0

        fsrs_state = FSRSState(
            stability=stability,
            difficulty=difficulty * 10,   # FSRSState uses 1-10 scale
            elapsed_days=elapsed,
        )

        outcome = _fsrs_model.calculate_next(fsrs_state, grade)

        new_stability   = outcome["stability"]
        new_difficulty  = round(outcome["difficulty"] / 10.0, 4)  # back to 0-1 scale
        next_review_iso = outcome["next_review"]

        # next_review_date as date string
        try:
            next_review_date = datetime.fromisoformat(next_review_iso).date().isoformat()
        except ValueError:
            next_review_date = (date.today() + timedelta(days=outcome.get("scheduled_days", 1))).isoformat()

        now_iso = datetime.now(timezone.utc).isoformat()

        updated = {
            "stability":        round(new_stability, 4),
            "difficulty":       new_difficulty,
            "next_review_date": next_review_date,
            "last_reviewed_at": now_iso,
            "review_count":     card.get("review_count", 0) + 1,
            "last_grade":       grade,
            "updated_at":       now_iso,
        }

        await (
            db.table("fsrs_cards")
            .update(updated)
            .eq("card_id", card_id)
            .execute()
        )

        card.update(updated)
        logger.info("update_card: card_id=%s grade=%d next_review=%s", card_id, grade, next_review_date)
        return card

    except Exception as exc:
        logger.error("update_card failed: card_id=%s error=%s", card_id, str(exc))
        return {}


async def create_card(
    db,
    student_id: str,
    concept_id: str,
    front: str,
    back: str,
    source: str = "auto_generated",
) -> dict:
    """
    Insert a new FSRS card with default stability=1.0, difficulty=0.3,
    next_review_date=today.
    Returns the created card dict.
    """
    try:
        now_iso   = datetime.now(timezone.utc).isoformat()
        today_str = date.today().isoformat()
        card_id   = str(uuid.uuid4())

        new_card = {
            "card_id":          card_id,
            "student_id":       student_id,
            "concept_id":       concept_id,
            "front":            front,
            "back":             back,
            "source":           source,
            "stability":        1.0,
            "difficulty":       0.3,
            "next_review_date": today_str,
            "last_reviewed_at": None,
            "review_count":     0,
            "created_at":       now_iso,
            "updated_at":       now_iso,
        }

        await (
            db.table("fsrs_cards")
            .insert(new_card)
            .execute()
        )

        logger.info("create_card: student=%s concept=%s card_id=%s", student_id, concept_id, card_id)
        return new_card

    except Exception as exc:
        logger.error("create_card failed: student=%s concept=%s error=%s", student_id, concept_id, str(exc))
        return {}
