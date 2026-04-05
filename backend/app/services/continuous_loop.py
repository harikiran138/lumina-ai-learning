"""
continuous_loop.py — 5-Step Continuous Improvement Loop Orchestrator
----------------------------------------------------------------------
Implements the closed-loop adaptive learning pipeline from spec §8.

Loop steps:
  ① Student answers
  ② BKT + DKT update          → mastery updated via both models
  ③ Next question generated   → question_engine selects & builds prompt
  ④ Course path adjusts       → course_path_engine resequences
  ⑤ Teacher sees it all       → LoopResult contains full state snapshot

This module is an asynchronous orchestrator — it wires together all
sub-engines and returns a complete LoopResult per answer event.
"""

from __future__ import annotations

import logging
import math
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from learner_profile.models.bkt import BKTModel
from app.services.dkt_engine import DKTEngine
from app.services.lag_detector import get_lag_zones, get_highest_priority_lag
from app.services.scorer import compute_score, EXPECTED_WORD_COUNT_SHORT_ANSWER, EXPECTED_WORD_COUNT_ESSAY
from app.services.question_engine import generate_next_question, QuestionRequest, GeneratedQuestion
from app.services.course_path_engine import plan_course_path, TopicNode, CoursePathPlan

logger = logging.getLogger(__name__)

# ─── Style RL shim ────────────────────────────────────────────────────────────
# style_rl does not yet exist as a standalone module; these thin wrappers
# provide the expected interface and gracefully degrade when the module is absent.

def select_style(style_weights: Dict[str, float]) -> str:
    """
    Select a learning style via softmax-weighted sampling over style_weights.

    Falls back to 'default' if weights are empty or the import fails.
    """
    try:
        from app.services.style_rl import select_style as _select_style  # type: ignore
        return _select_style(style_weights)
    except ImportError:
        pass

    if not style_weights:
        return "default"

    total = sum(max(0.0, w) for w in style_weights.values())
    if total <= 0.0:
        return next(iter(style_weights), "default")

    roll = _lcg_rand(id(style_weights)) % 1000 / 1000.0
    cumulative = 0.0
    for style, weight in style_weights.items():
        cumulative += max(0.0, weight) / total
        if roll < cumulative:
            return style
    return next(reversed(style_weights), "default")


def update_style_weights(
    style_weights: Dict[str, float],
    style_used: str,
    mastery_delta: float,
) -> Dict[str, float]:
    """
    Exponential moving average RL update for style weights.

    Reward = mastery_delta if positive, small penalty otherwise.
    Falls back to the inline implementation when style_rl module is absent.
    """
    try:
        from app.services.style_rl import update_weights as _update  # type: ignore
        return _update(style_weights, style_used, mastery_delta)
    except ImportError:
        pass

    updated = dict(style_weights)
    alpha   = 0.15  # EMA learning rate
    reward  = mastery_delta if mastery_delta > 0 else mastery_delta * 0.3  # dampen negative
    current = updated.get(style_used, 0.5)
    updated[style_used] = round(
        max(0.01, min(2.0, (1.0 - alpha) * current + alpha * (current + reward))),
        4,
    )
    return updated


def _lcg_rand(seed: int) -> int:
    """Minimal LCG for deterministic pseudo-randomness without importing random."""
    return (seed * 1664525 + 1013904223) & 0xFFFFFFFF


# ─── Dataclasses ──────────────────────────────────────────────────────────────

@dataclass
class AnswerEvent:
    student_id: str
    session_id: str
    concept_id: str
    question_type: str
    is_correct: bool
    answer_text: str
    response_time_ms: int
    keystroke_variance: float
    avg_think_time_ms: float
    correction_ratio: float
    paste_detected: bool
    prev_answer_text: str    # previous answer text for next Q generation


@dataclass
class LoopResult:
    student_id: str
    concept_id: str
    old_mastery: float
    new_mastery: float
    growth_velocity: float
    lag_zones: List[str]                       # top 3 lag concept IDs
    score_4d: Dict[str, float]                 # 4D score breakdown
    engagement_score: float
    next_question: Any                         # GeneratedQuestion
    dropout_risk: float                        # 0–1
    cognitive_load: str                        # overloaded | optimal | bored
    intervention_needed: bool
    updated_style_weights: Dict[str, float]
    course_path: Optional[Any] = None          # CoursePathPlan (populated when concepts supplied)


# ─── Engagement computation ───────────────────────────────────────────────────

def _compute_engagement(
    keystroke_variance: float,
    avg_think_time_ms: float,
    response_time_ms: int,
    correction_ratio: float,
    paste_detected: bool,
) -> float:
    """
    Geometric mean engagement score from four behavioural signals.

    Formula: (variance_signal × think_time_signal × correction_signal × originality_signal)^(1/4)

    Each signal is in [0.0, 1.0].
    """
    # Keystroke variance: low variance → likely copy-paste or no real typing
    if keystroke_variance > 0.02:
        variance_signal = min(1.0, keystroke_variance * 5.0)
    else:
        variance_signal = 0.1

    # Think time relative to total response time
    safe_rt = max(1.0, float(response_time_ms) * 0.1)
    think_time_signal = min(1.0, avg_think_time_ms / safe_rt)

    # Correction ratio: corrections indicate genuine engagement with the answer
    correction_signal = min(1.0, correction_ratio * 4.0)

    # Originality: penalise paste detection
    originality_signal = 0.5 if paste_detected else 1.0

    # Geometric mean of four signals
    product = variance_signal * think_time_signal * correction_signal * originality_signal
    if product <= 0.0:
        return 0.0

    return round(product ** 0.25, 4)


# ─── Growth velocity computation ─────────────────────────────────────────────

def _compute_growth_velocity(
    dkt_result: Dict[str, Any],
    concept_id: str,
    new_mastery: float,
    old_mastery: float,
) -> float:
    """
    Compute rolling growth velocity from DKT sequence.

    Uses the last 3 interactions for the target concept in the DKT sequence,
    computing average mastery delta per session.
    Positive = growing, ~0 = stuck, negative = regressing.
    """
    # Pull the sequence from the DKT result if available
    all_predictions: Dict[str, float] = dkt_result.get("all_predictions", {})
    sequence: list = dkt_result.get("sequence", [])

    # Filter sequence for this concept
    concept_sequence = [
        entry for entry in sequence
        if entry.get("concept") == concept_id
    ]

    if len(concept_sequence) >= 2:
        recent = concept_sequence[-3:]
        values = [entry["value"] for entry in recent]
        if len(values) >= 2:
            deltas = [values[i + 1] - values[i] for i in range(len(values) - 1)]
            velocity = sum(deltas) / len(deltas)
            return round(velocity, 4)

    # Fallback: simple before/after delta (normalised to a per-session scale)
    return round(new_mastery - old_mastery, 4)


# ─── Cognitive load classification ───────────────────────────────────────────

def _classify_cognitive_load(
    response_time_ms: int,
    is_correct: bool,
) -> str:
    """
    Classify cognitive load from response time and correctness.

    Rules:
      - response_time_ms > 120 000 and wrong  → overloaded
      - response_time_ms < 5 000 and correct  → bored
      - otherwise                              → optimal
    """
    if response_time_ms > 120_000 and not is_correct:
        return "overloaded"
    if response_time_ms < 5_000 and is_correct:
        return "bored"
    return "optimal"


# ─── Dropout risk ─────────────────────────────────────────────────────────────

def _compute_dropout_risk(
    new_mastery: float,
    engagement_score: float,
    growth_velocity: float,
) -> float:
    """
    Compute dropout risk score in [0, 1].

    Formula:
        risk = (1 - new_mastery) × 0.4 + (1 - engagement) × 0.4 + 0.2 × [velocity < 0]
    """
    velocity_penalty = 0.2 if growth_velocity < 0 else 0.0
    risk = (
        (1.0 - new_mastery)     * 0.4
        + (1.0 - engagement_score) * 0.4
        + velocity_penalty
    )
    return round(min(1.0, max(0.0, risk)), 4)


# ─── Expected word count by question type ────────────────────────────────────

def _expected_word_count(question_type: str) -> int:
    mapping = {
        "MCQ":          10,
        "FILL_BLANK":   10,
        "SHORT_ANSWER": EXPECTED_WORD_COUNT_SHORT_ANSWER,
        "LONG_ESSAY":   EXPECTED_WORD_COUNT_ESSAY,
        "TEACH_BACK":   EXPECTED_WORD_COUNT_ESSAY,
        "TRY_ANSWER":   EXPECTED_WORD_COUNT_SHORT_ANSWER,
    }
    return mapping.get(question_type.upper(), EXPECTED_WORD_COUNT_SHORT_ANSWER)


# ─── Main loop ────────────────────────────────────────────────────────────────

async def run_loop(
    event: AnswerEvent,
    dkt_engine: DKTEngine,
    style_weights: Dict[str, float],
    mastery_scores: Dict[str, float],
    concepts: List[dict],
) -> LoopResult:
    """
    Execute the full 5-step continuous improvement loop after a student answer.

    Parameters
    ----------
    event : AnswerEvent
        All signals from the student's answer submission.
    dkt_engine : DKTEngine
        Initialised DKT engine (carries per-student hidden state).
    style_weights : Dict[str, float]
        Current RL weights for learning styles, keyed by style name.
    mastery_scores : Dict[str, float]
        Current mastery map for the student across all concepts.
    concepts : List[dict]
        Course concept graph; each entry must have 'id' and 'dependency_depth'.

    Returns
    -------
    LoopResult
        Complete result containing updated mastery, next question,
        dropout risk, cognitive load, and course path adjustments.
    """
    concept_id = event.concept_id

    # ── Step 1: BKT update ────────────────────────────────────────────────────
    old_mastery  = mastery_scores.get(concept_id, 0.3)
    bkt_model    = BKTModel()
    new_mastery  = bkt_model.update_mastery(old_mastery, event.is_correct)
    new_mastery  = round(max(0.0, min(1.0, new_mastery)), 4)

    # ── Step 2: DKT update ───────────────────────────────────────────────────
    dkt_result = await dkt_engine.update(
        user_id      = event.student_id,
        concept_id   = concept_id,
        is_correct   = event.is_correct,
    )

    # Prefer DKT's updated knowledge value as it incorporates sequence history
    dkt_knowledge = dkt_result.get("knowledge_updated", new_mastery)
    # Blend BKT and DKT for robustness (BKT is more interpretable, DKT more contextual)
    blended_mastery = round(0.5 * new_mastery + 0.5 * dkt_knowledge, 4)

    # Update the local mastery map so downstream steps use the fresh value
    updated_mastery_scores = {**mastery_scores, concept_id: blended_mastery}

    # ── Step 3: Growth velocity ───────────────────────────────────────────────
    growth_velocity = _compute_growth_velocity(
        dkt_result      = dkt_result,
        concept_id      = concept_id,
        new_mastery     = blended_mastery,
        old_mastery     = old_mastery,
    )

    # ── Step 4: Engagement score ──────────────────────────────────────────────
    engagement_score = _compute_engagement(
        keystroke_variance = event.keystroke_variance,
        avg_think_time_ms  = event.avg_think_time_ms,
        response_time_ms   = event.response_time_ms,
        correction_ratio   = event.correction_ratio,
        paste_detected     = event.paste_detected,
    )

    # ── Step 5: Lag zones ─────────────────────────────────────────────────────
    lag_zones = get_lag_zones(
        mastery_scores = updated_mastery_scores,
        concepts       = concepts,
        top_n          = 3,
    )

    # ── Step 6: 4D score ──────────────────────────────────────────────────────
    correctness     = 1.0 if event.is_correct else 0.0
    expected_wc     = _expected_word_count(event.question_type)
    score_result    = compute_score(
        correctness        = correctness,
        answer_text        = event.answer_text,
        expected_word_count = expected_wc,
        engagement_score   = engagement_score,
        old_mastery        = old_mastery,
        new_mastery        = blended_mastery,
    )
    score_4d = {
        "correctness":        score_result.correctness,
        "understanding_depth": score_result.understanding_depth,
        "effort_signals":     score_result.effort_signals,
        "growth_delta":       score_result.growth_delta,
        "total":              score_result.total,
    }

    # ── Step 7: Style RL update ───────────────────────────────────────────────
    style_used    = select_style(style_weights)
    mastery_delta = blended_mastery - old_mastery
    updated_weights = style_weights

    if mastery_delta > 0:
        updated_weights = update_style_weights(style_weights, style_used, mastery_delta)

    # ── Step 8: Next question ─────────────────────────────────────────────────
    # Target the highest-priority lag concept; fall back to current concept if
    # the lag detector returns nothing (e.g., concepts list is empty).
    target_concept = (
        get_highest_priority_lag(updated_mastery_scores, concepts)
        or concept_id
    )
    target_mastery = updated_mastery_scores.get(target_concept, blended_mastery)

    next_question = generate_next_question(
        QuestionRequest(
            student_id         = event.student_id,
            concept_id         = target_concept,
            mastery            = target_mastery,
            style              = style_used,
            prev_answer_text   = event.prev_answer_text,
            prev_answer_correct = event.is_correct,
            session_id         = event.session_id,
        )
    )

    # ── Step 9: Dropout risk ──────────────────────────────────────────────────
    dropout_risk = _compute_dropout_risk(
        new_mastery      = blended_mastery,
        engagement_score = engagement_score,
        growth_velocity  = growth_velocity,
    )

    # ── Step 10: Cognitive load ───────────────────────────────────────────────
    cognitive_load = _classify_cognitive_load(
        response_time_ms = event.response_time_ms,
        is_correct       = event.is_correct,
    )

    # ── Step 11: Intervention check ───────────────────────────────────────────
    intervention_needed = (
        dropout_risk > 0.65
        or (len(lag_zones) >= 3 and growth_velocity < 0)
    )

    # ── Step 12: Course path plan (best-effort; requires topic metadata) ──────
    course_path: Optional[CoursePathPlan] = None
    if concepts:
        topic_nodes = [
            TopicNode(
                topic_id         = c["id"],
                title            = c.get("title", c["id"]),
                mastery          = updated_mastery_scores.get(c["id"], 0.0),
                velocity         = growth_velocity if c["id"] == concept_id else 0.0,
                dependency_depth = int(c.get("dependency_depth", 0)),
                dependencies     = c.get("dependencies", []),
            )
            for c in concepts
        ]
        try:
            course_path = plan_course_path(
                student_id  = event.student_id,
                topics      = topic_nodes,
                mastery_map = updated_mastery_scores,
            )
        except Exception as exc:
            logger.warning("continuous_loop.course_path_failed", error=str(exc))

    logger.info(
        "continuous_loop.completed",
        student_id       = event.student_id,
        concept_id       = concept_id,
        old_mastery      = old_mastery,
        new_mastery      = blended_mastery,
        growth_velocity  = growth_velocity,
        engagement       = engagement_score,
        dropout_risk     = dropout_risk,
        cognitive_load   = cognitive_load,
        intervention     = intervention_needed,
        lag_zones        = lag_zones,
    )

    return LoopResult(
        student_id            = event.student_id,
        concept_id            = concept_id,
        old_mastery           = old_mastery,
        new_mastery           = blended_mastery,
        growth_velocity       = growth_velocity,
        lag_zones             = lag_zones,
        score_4d              = score_4d,
        engagement_score      = engagement_score,
        next_question         = next_question,
        dropout_risk          = dropout_risk,
        cognitive_load        = cognitive_load,
        intervention_needed   = intervention_needed,
        updated_style_weights = updated_weights,
        course_path           = course_path,
    )
