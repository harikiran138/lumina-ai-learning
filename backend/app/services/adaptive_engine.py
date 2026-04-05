"""
adaptive_engine.py — BKT-based Adaptive Question Selection

Implements Zone of Proximal Development (ZPD) targeting:
  - Mastery < 0.4  → easy questions (difficulty 1-2)  [remediation band]
  - Mastery 0.4-0.7 → medium questions (difficulty 2-3) [guided practice]
  - Mastery > 0.7  → hard questions (difficulty 3-5)   [challenge band]

Each question is scored by how close its difficulty is to the student's
target difficulty, with a bonus for questions on weak topics.
"""

import math
import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# Difficulty string → numeric mapping (1=easiest, 5=hardest)
DIFFICULTY_MAP: Dict[str, float] = {
    "very_easy": 1.0,
    "easy": 1.5,
    "beginner": 1.5,
    "medium": 2.5,
    "intermediate": 3.0,
    "hard": 3.5,
    "advanced": 4.0,
    "very_hard": 4.5,
    "expert": 5.0,
}

DEFAULT_DIFFICULTY = 2.5


def _difficulty_to_float(raw: Any) -> float:
    if isinstance(raw, (int, float)):
        return float(max(1, min(5, raw)))
    if isinstance(raw, str):
        return DIFFICULTY_MAP.get(raw.lower(), DEFAULT_DIFFICULTY)
    return DEFAULT_DIFFICULTY


def _mastery_to_target_difficulty(mastery: float) -> float:
    """
    Maps mastery probability (0–1) to a target question difficulty (1–5).
    Targeting slightly above current mastery to stay in the ZPD.
    """
    if mastery < 0.3:
        return 1.5   # Remediation: easy-ish
    if mastery < 0.5:
        return 2.0   # Guided: medium-easy
    if mastery < 0.7:
        return 3.0   # Practice: medium
    if mastery < 0.85:
        return 3.5   # Challenge: medium-hard
    return 4.5       # Mastered: hard


def _zpd_score(q_difficulty: float, target: float) -> float:
    """
    Returns a score (0-1) representing how well q_difficulty matches
    the target. Uses a Gaussian centred at target with σ=0.8.
    """
    sigma = 0.8
    diff = q_difficulty - target
    return math.exp(-(diff ** 2) / (2 * sigma ** 2))


class AdaptiveEngine:
    """
    Selects the next question for a student using BKT mastery and ZPD logic.
    """

    def __init__(self, db: Any):
        self.db = db

    async def _get_mastery(self, user_id: str, course_id: str, topic_id: Optional[str]) -> float:
        """
        Returns the student's current mastery probability for the given
        course/topic from learner_profiles.mastery_state.
        Falls back to skill_mastery table, then 0.1 if no data exists.
        """
        try:
            result = (
                await self.db.table("learner_profiles")
                .select("mastery_state, weak_topics")
                .eq("user_id", user_id)
                .maybe_single()
                .execute()
            )
            data = result.data if result else None

            if data and data.get("mastery_state"):
                mastery_state: Dict[str, Any] = data["mastery_state"]
                if topic_id and topic_id in mastery_state:
                    return float(mastery_state[topic_id].get("score", 0.1))

                # Average across all topics in this course if no specific topic
                scores = [
                    float(v.get("score", 0.1))
                    for v in mastery_state.values()
                    if isinstance(v, dict)
                ]
                if scores:
                    return sum(scores) / len(scores)

        except Exception as exc:
            logger.warning("adaptive_engine_mastery_lookup_failed", error=str(exc))

        # Fallback: skill_mastery table
        try:
            q = (
                self.db.table("skill_mastery")
                .select("mastery_score")
                .eq("user_id", user_id)
                .eq("course_id", course_id)
            )
            if topic_id:
                q = q.eq("skill_name", topic_id)
            result = await q.execute()
            rows = result.data or []
            if rows:
                return sum(float(r["mastery_score"]) for r in rows) / len(rows)
        except Exception as exc:
            logger.warning("adaptive_engine_skill_mastery_fallback_failed", error=str(exc))

        return 0.1  # Cold-start default

    async def _get_weak_topics(self, user_id: str) -> List[str]:
        try:
            result = (
                await self.db.table("learner_profiles")
                .select("weak_topics")
                .eq("user_id", user_id)
                .maybe_single()
                .execute()
            )
            data = result.data if result else None
            if data and data.get("weak_topics"):
                return list(data["weak_topics"])
        except Exception:
            pass
        return []

    async def _get_attempted_ids(self, user_id: str, course_id: str) -> set:
        """Returns set of quiz IDs the student has already attempted."""
        try:
            result = (
                await self.db.table("quiz_attempts")
                .select("quiz_id")
                .eq("user_id", user_id)
                .execute()
            )
            rows = result.data or []
            return {r["quiz_id"] for r in rows if r.get("quiz_id")}
        except Exception:
            return set()

    async def _fetch_questions(
        self, course_id: str, topic_id: Optional[str]
    ) -> List[Dict[str, Any]]:
        """
        Fetches published quiz questions for the course.
        Each quiz's questions JSONB is a list of question objects.
        Returns a flat list of (quiz_id, question) dicts.
        """
        try:
            q = (
                self.db.table("quizzes")
                .select("id, title, questions, quiz_type")
                .eq("course_id", course_id)
                .eq("is_published", True)
            )
            result = await q.execute()
            rows = result.data or []

            flat: List[Dict[str, Any]] = []
            for row in rows:
                questions_raw = row.get("questions") or []
                if not isinstance(questions_raw, list):
                    continue
                for idx, q_obj in enumerate(questions_raw):
                    if not isinstance(q_obj, dict):
                        continue
                    # Filter by topic if specified
                    q_topic = q_obj.get("topic_id") or q_obj.get("topic")
                    if topic_id and q_topic and q_topic != topic_id:
                        continue
                    flat.append({
                        "quiz_id": row["id"],
                        "quiz_title": row["title"],
                        "quiz_type": row["quiz_type"],
                        "question_index": idx,
                        "question_id": q_obj.get("id") or f"{row['id']}_{idx}",
                        "question": q_obj.get("question") or q_obj.get("text", ""),
                        "options": q_obj.get("options", []),
                        "answer": q_obj.get("answer") or q_obj.get("correct_answer"),
                        "explanation": q_obj.get("explanation", ""),
                        "difficulty": q_obj.get("difficulty", "medium"),
                        "topic": q_topic,
                        "tags": q_obj.get("tags", []),
                    })
            return flat
        except Exception as exc:
            logger.warning("adaptive_engine_fetch_questions_failed", error=str(exc))
            return []

    async def select_next_question(
        self,
        user_id: str,
        course_id: str,
        topic_id: Optional[str] = None,
        exclude_ids: Optional[List[str]] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Selects the optimal next question for the student.

        Returns a dict with question data + adaptive metadata:
          - mastery_before: student's current mastery
          - target_difficulty: computed ZPD target
          - zpd_score: how well this question matches the ZPD
          - is_weak_topic: whether this question is on a weak topic
        """
        exclude_ids = set(exclude_ids or [])

        # 1. Get student mastery and weak topics in parallel
        mastery, weak_topics, attempted_ids = (
            await self._get_mastery(user_id, course_id, topic_id),
            await self._get_weak_topics(user_id),
            await self._get_attempted_ids(user_id, course_id),
        )

        # 2. Compute target difficulty
        target_diff = _mastery_to_target_difficulty(mastery)

        # 3. Fetch candidate questions
        candidates = await self._fetch_questions(course_id, topic_id)

        if not candidates:
            return None

        # 4. Filter out excluded + already-attempted
        all_excluded = exclude_ids | attempted_ids
        candidates = [
            c for c in candidates
            if c["question_id"] not in all_excluded
        ]

        if not candidates:
            # Allow re-attempts if everything has been tried
            candidates = await self._fetch_questions(course_id, topic_id)
            candidates = [c for c in candidates if c["question_id"] not in exclude_ids]

        if not candidates:
            return None

        # 5. Score each question
        weak_set = set(weak_topics)

        def score(q: Dict[str, Any]) -> float:
            q_diff = _difficulty_to_float(q["difficulty"])
            zpd = _zpd_score(q_diff, target_diff)
            # Bonus +0.2 for weak topics, so we prioritise them
            weak_bonus = 0.2 if (q.get("topic") in weak_set) else 0.0
            return zpd + weak_bonus

        best = max(candidates, key=score)

        # 6. Return question + adaptive metadata (strip answer from client payload)
        return {
            "question_id": best["question_id"],
            "quiz_id": best["quiz_id"],
            "quiz_title": best["quiz_title"],
            "question": best["question"],
            "options": best["options"],
            "explanation": best.get("explanation"),
            "difficulty": best["difficulty"],
            "topic": best.get("topic"),
            "tags": best.get("tags", []),
            # Adaptive metadata
            "adaptive": {
                "mastery_before": round(mastery, 3),
                "target_difficulty": round(target_diff, 2),
                "zpd_score": round(score(best), 3),
                "is_weak_topic": best.get("topic") in weak_set,
            },
        }
