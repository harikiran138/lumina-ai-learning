"""
trait_detector.py — Student Cognitive Trait Classification

Classifies students into 4 learning trait profiles based on
behavior patterns and answer history:

  - systematic_thinker:  methodical, high think-time, low error, careful
  - intuitive_guesser:   fast, high variance, pattern-based, impulsive
  - careful_verifier:    many corrections, high authenticity, thorough
  - pattern_matcher:     high accuracy on familiar types, struggles with novel

Classification uses a soft multi-label approach (each trait has a confidence
score 0–1) rather than hard exclusive labels.

Trait profiles are persisted in student_traits table and used by:
  - ExplanationPlanner (tailor mode to trait)
  - AdaptiveEngine (question type selection)
  - Teacher Dashboard (student profile card)
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


# ─── Trait Model ───────────────────────────────────────────────────────────────

@dataclass
class TraitScores:
    systematic_thinker: float = 0.25
    intuitive_guesser:  float = 0.25
    careful_verifier:   float = 0.25
    pattern_matcher:    float = 0.25

    @property
    def dominant(self) -> str:
        return max(
            {
                "systematic_thinker": self.systematic_thinker,
                "intuitive_guesser":  self.intuitive_guesser,
                "careful_verifier":   self.careful_verifier,
                "pattern_matcher":    self.pattern_matcher,
            }.items(),
            key=lambda x: x[1],
        )[0]

    def to_dict(self) -> Dict[str, float]:
        return {
            "systematic_thinker": round(self.systematic_thinker, 3),
            "intuitive_guesser":  round(self.intuitive_guesser, 3),
            "careful_verifier":   round(self.careful_verifier, 3),
            "pattern_matcher":    round(self.pattern_matcher, 3),
            "dominant":           self.dominant,
        }


# ─── Feature Windows ──────────────────────────────────────────────────────────

@dataclass
class BehaviorWindow:
    """Aggregated signals from the last N interactions."""
    avg_think_time_s:      float = 0.0
    avg_corrections:       float = 0.0
    accuracy_rate:         float = 0.5
    accuracy_variance:     float = 0.0
    avg_answer_length:     float = 0.0
    paste_rate:            float = 0.0
    idle_rate:             float = 0.0
    avg_authenticity:      float = 1.0
    novel_topic_accuracy:  float = 0.5
    known_topic_accuracy:  float = 0.5
    interaction_count:     int   = 0


def _build_window(interactions: List[Dict[str, Any]]) -> BehaviorWindow:
    """Build aggregated feature window from a list of interaction records."""
    n = len(interactions)
    if n == 0:
        return BehaviorWindow()

    think_times  = [float(i.get("time_taken_s", 0))    for i in interactions]
    corrections  = [float(i.get("correction_count", 0)) for i in interactions]
    is_correct   = [bool(i.get("is_correct", False))    for i in interactions]
    auth_scores  = [float(i.get("authenticity_score", 1.0)) for i in interactions]
    lengths      = [float(i.get("answer_length", 0))    for i in interactions]
    paste_counts = [float(i.get("paste_count", 0))      for i in interactions]
    idle_counts  = [float(i.get("idle_count", 0))       for i in interactions]

    accuracy = sum(is_correct) / n
    # Variance: fraction of flip-flop patterns
    flips = sum(
        1 for a, b in zip(is_correct, is_correct[1:]) if a != b
    )
    variance = flips / max(n - 1, 1)

    # Novel vs known: use difficulty as proxy (hard = novel)
    difficulties = [i.get("difficulty", "medium") for i in interactions]
    hard_idx = [k for k, d in enumerate(difficulties) if d in ("hard", "advanced", "very_hard", "expert")]
    easy_idx = [k for k, d in enumerate(difficulties) if d in ("easy", "very_easy", "beginner")]

    novel_acc = (
        sum(is_correct[k] for k in hard_idx) / max(len(hard_idx), 1)
        if hard_idx else 0.5
    )
    known_acc = (
        sum(is_correct[k] for k in easy_idx) / max(len(easy_idx), 1)
        if easy_idx else 0.5
    )

    avg_think = sum(think_times) / n
    avg_corr  = sum(corrections) / n
    avg_len   = sum(lengths) / n
    paste_r   = sum(1 for p in paste_counts if p > 0) / n
    idle_r    = sum(1 for i in idle_counts if i > 0) / n
    avg_auth  = sum(auth_scores) / n

    return BehaviorWindow(
        avg_think_time_s=avg_think,
        avg_corrections=avg_corr,
        accuracy_rate=accuracy,
        accuracy_variance=variance,
        avg_answer_length=avg_len,
        paste_rate=paste_r,
        idle_rate=idle_r,
        avg_authenticity=avg_auth,
        novel_topic_accuracy=novel_acc,
        known_topic_accuracy=known_acc,
        interaction_count=n,
    )


# ─── Trait Classifier ─────────────────────────────────────────────────────────

class TraitDetector:
    """
    Classifies student cognitive traits from behavior + answer history.
    Uses a simple rule-based scoring model (no ML dependency).
    For future: replace scoring functions with a trained classifier.
    """

    MIN_INTERACTIONS = 5  # Need at least this many to make confident classification

    def classify(self, interactions: List[Dict[str, Any]]) -> TraitScores:
        """
        Returns soft trait scores from a list of interaction records.
        Each record should contain:
          time_taken_s, correction_count, is_correct, authenticity_score,
          answer_length, paste_count, idle_count, difficulty
        """
        if len(interactions) < self.MIN_INTERACTIONS:
            return TraitScores()  # Equal priors — not enough data

        w = _build_window(interactions)
        traits = TraitScores()

        traits.systematic_thinker = self._score_systematic(w)
        traits.intuitive_guesser  = self._score_intuitive(w)
        traits.careful_verifier   = self._score_careful(w)
        traits.pattern_matcher    = self._score_pattern(w)

        # Normalize so they sum to 1.0
        total = (
            traits.systematic_thinker +
            traits.intuitive_guesser  +
            traits.careful_verifier   +
            traits.pattern_matcher
        )
        if total > 0:
            traits.systematic_thinker /= total
            traits.intuitive_guesser  /= total
            traits.careful_verifier   /= total
            traits.pattern_matcher    /= total

        return traits

    # ── Individual trait scorers ────────────────────────────────────────────

    @staticmethod
    def _score_systematic(w: BehaviorWindow) -> float:
        """
        Systematic thinker: high think-time, low error rate,
        consistent accuracy, longer answers.
        """
        score = 0.0

        # High think time (30-120s is "systematic")
        if w.avg_think_time_s >= 60:
            score += 0.35
        elif w.avg_think_time_s >= 30:
            score += 0.25
        elif w.avg_think_time_s >= 15:
            score += 0.10

        # High accuracy with low variance = consistent
        if w.accuracy_rate >= 0.75 and w.accuracy_variance < 0.3:
            score += 0.30
        elif w.accuracy_rate >= 0.6:
            score += 0.15

        # Long answers = thorough
        if w.avg_answer_length >= 50:
            score += 0.20
        elif w.avg_answer_length >= 20:
            score += 0.10

        # High authenticity
        if w.avg_authenticity >= 0.85:
            score += 0.15

        return min(1.0, score)

    @staticmethod
    def _score_intuitive(w: BehaviorWindow) -> float:
        """
        Intuitive guesser: fast answers, high variance,
        low corrections, short answers.
        """
        score = 0.0

        # Fast answers
        if w.avg_think_time_s < 10:
            score += 0.40
        elif w.avg_think_time_s < 20:
            score += 0.25
        elif w.avg_think_time_s < 30:
            score += 0.10

        # High accuracy variance (streaky — sometimes right, sometimes wrong)
        if w.accuracy_variance >= 0.5:
            score += 0.25
        elif w.accuracy_variance >= 0.35:
            score += 0.15

        # Few corrections (not thinking it through)
        if w.avg_corrections < 1:
            score += 0.20

        # Short answers
        if w.avg_answer_length < 15:
            score += 0.15

        return min(1.0, score)

    @staticmethod
    def _score_careful(w: BehaviorWindow) -> float:
        """
        Careful verifier: moderate time, many corrections,
        high authenticity, thorough answers.
        """
        score = 0.0

        # Moderate-to-high think time
        if 20 <= w.avg_think_time_s <= 90:
            score += 0.25

        # Many corrections = re-reading and fixing
        if w.avg_corrections >= 5:
            score += 0.35
        elif w.avg_corrections >= 2:
            score += 0.20

        # High authenticity (not copy-pasting)
        if w.avg_authenticity >= 0.9:
            score += 0.25
        elif w.avg_authenticity >= 0.75:
            score += 0.10

        # Longer answers
        if w.avg_answer_length >= 30:
            score += 0.15

        # Low paste rate
        if w.paste_rate < 0.1:
            score += 0.10

        return min(1.0, score)

    @staticmethod
    def _score_pattern(w: BehaviorWindow) -> float:
        """
        Pattern matcher: high accuracy on known/easy topics,
        much lower on novel/hard topics (concept generalisation gap).
        """
        score = 0.0

        # Big gap between known and novel accuracy
        gap = w.known_topic_accuracy - w.novel_topic_accuracy
        if gap >= 0.35:
            score += 0.50
        elif gap >= 0.20:
            score += 0.30
        elif gap >= 0.10:
            score += 0.15

        # Moderate overall accuracy (not a full master, not failing)
        if 0.45 <= w.accuracy_rate <= 0.75:
            score += 0.25

        # Medium think time
        if 15 <= w.avg_think_time_s <= 50:
            score += 0.15

        # Medium accuracy variance
        if 0.25 <= w.accuracy_variance <= 0.55:
            score += 0.10

        return min(1.0, score)


# ─── DB-backed Trait Engine ────────────────────────────────────────────────────

class TraitEngine:
    """
    Maintains student trait state with DB persistence.
    """

    def __init__(self, db: Any):
        self._db = db
        self._detector = TraitDetector()

    async def _load_recent_interactions(
        self, user_id: str, limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Fetches recent answer_analytics records for the student."""
        try:
            result = (
                await self._db.table("answer_analytics")
                .select(
                    "is_correct, time_taken_s, correction_count, "
                    "authenticity_score, answer_length, paste_count, "
                    "idle_count, difficulty"
                )
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )
            return result.data or []
        except Exception as exc:
            logger.warning("trait_engine_load_interactions_failed", error=str(exc))
            return []

    async def update_traits(self, user_id: str) -> Dict[str, Any]:
        """
        Recomputes and persists trait scores for the student.
        Called from the orchestrator after each answer.
        """
        interactions = await self._load_recent_interactions(user_id)
        traits = self._detector.classify(interactions)
        trait_dict = traits.to_dict()

        try:
            await (
                self._db.table("student_traits")
                .upsert(
                    {
                        "user_id": user_id,
                        "traits": trait_dict,
                        "interaction_count": len(interactions),
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                    },
                    on_conflict="user_id",
                )
                .execute()
            )
        except Exception as exc:
            logger.warning("trait_engine_save_failed", error=str(exc))

        return trait_dict

    async def get_traits(self, user_id: str) -> Dict[str, Any]:
        """Returns current trait scores (from DB or recomputed)."""
        try:
            result = (
                await self._db.table("student_traits")
                .select("traits, updated_at")
                .eq("user_id", user_id)
                .maybe_single()
                .execute()
            )
            data = result.data if result else None
            if data and data.get("traits"):
                return data["traits"]
        except Exception:
            pass
        return TraitScores().to_dict()
