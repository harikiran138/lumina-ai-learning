"""
answer_analysis.py — Multi-Dimensional Answer Analysis Engine

Computes a unified learning score S per answer:

    S = 0.40 * correctness
      + 0.30 * depth
      + 0.20 * effort
      + 0.10 * growth_delta

Each dimension 0.0–1.0. Final score 0.0–1.0.

Also powers the Authenticity Engine (6-signal system).
"""

from __future__ import annotations

import math
import re
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional

# ─── Result Models ─────────────────────────────────────────────────────────────

@dataclass
class AuthenticityBreakdown:
    """6-signal authenticity result (0=suspicious, 1=authentic)."""
    keystroke_burst:    float = 1.0  # typing speed anomaly
    think_time_ratio:   float = 1.0  # time spent vs difficulty
    correction_pattern: float = 1.0  # edits before submit
    vocabulary_jump:    float = 1.0  # sudden complexity spike
    semantic_drift:     float = 1.0  # fingerprint vs history
    probe_validated:    float = 1.0  # follow-up probe result (1 if not triggered)

    @property
    def score(self) -> float:
        weights = [0.25, 0.20, 0.15, 0.15, 0.15, 0.10]
        signals = [
            self.keystroke_burst,
            self.think_time_ratio,
            self.correction_pattern,
            self.vocabulary_jump,
            self.semantic_drift,
            self.probe_validated,
        ]
        return round(sum(w * s for w, s in zip(weights, signals)), 4)

    @property
    def is_suspicious(self) -> bool:
        return self.score < 0.55

    @property
    def trigger_probe(self) -> bool:
        """True if authenticity is low enough to warrant a follow-up probe question."""
        return self.score < 0.45


@dataclass
class AnswerDimensions:
    correctness:  float = 0.0   # Binary or partial credit
    depth:        float = 0.0   # Understanding depth
    effort:       float = 0.0   # Signals of genuine attempt
    growth_delta: float = 0.0   # Delta from previous mastery

    @property
    def learning_score(self) -> float:
        """Weighted composite: S = 0.40C + 0.30D + 0.20E + 0.10G"""
        return round(
            0.40 * self.correctness +
            0.30 * self.depth +
            0.20 * self.effort +
            0.10 * self.growth_delta,
            4,
        )


@dataclass
class AnswerAnalysisResult:
    dimensions:    AnswerDimensions
    authenticity:  AuthenticityBreakdown
    probe_question: Optional[str]      # Set when authenticity triggers probe
    question_type_rec: str             # Recommended next question type
    debug_trace:   Dict[str, Any] = field(default_factory=dict)


# ─── Difficulty → expected time mapping ───────────────────────────────────────

_DIFFICULTY_EXPECTED_SECONDS: Dict[str, float] = {
    "very_easy":    15.0,
    "easy":         25.0,
    "beginner":     25.0,
    "medium":       45.0,
    "intermediate": 60.0,
    "hard":         90.0,
    "advanced":    120.0,
    "very_hard":   150.0,
    "expert":      180.0,
}


def _expected_time(difficulty: str) -> float:
    return _DIFFICULTY_EXPECTED_SECONDS.get(difficulty.lower(), 45.0)


# ─── Vocabulary complexity ────────────────────────────────────────────────────

_SIMPLE_WORDS = frozenset(
    "the a an is are was were be been being have has had do does did "
    "will would should could may might shall can need ought "
    "i you he she it we they and or but so yet for nor "
    "in on at to of with by from up about into than that this which".split()
)


def _vocab_complexity(text: str) -> float:
    """0 = simple, 1 = complex. Heuristic: fraction of non-trivial long words."""
    if not text:
        return 0.0
    words = re.findall(r"[a-z]+", text.lower())
    if not words:
        return 0.0
    complex_count = sum(
        1 for w in words if len(w) >= 7 and w not in _SIMPLE_WORDS
    )
    return min(1.0, complex_count / max(len(words), 1))


def _word_count(text: str) -> int:
    return len(text.split()) if text else 0


def _sentence_count(text: str) -> int:
    return max(1, len(re.split(r"[.!?]+", text.strip())))


# ─── Probe question templates ─────────────────────────────────────────────────

_PROBE_TEMPLATES = [
    "Can you explain in your own words why {concept} works this way?",
    "What would happen if we changed {concept}? Walk me through your reasoning.",
    "Give me a real-world example of how you would use {concept}.",
    "What is the most common mistake students make with {concept}, and why?",
    "Explain {concept} as if you're teaching it to a 10-year-old.",
]


def _make_probe(concept: str) -> str:
    import random
    template = random.choice(_PROBE_TEMPLATES)
    return template.replace("{concept}", concept or "this concept")


# ─── Recommended question type ────────────────────────────────────────────────

def _recommend_question_type(mastery: float) -> str:
    if mastery < 0.40:
        return "mcq"
    if mastery < 0.65:
        return "fill_blank"
    if mastery < 0.80:
        return "short_answer"
    if mastery < 0.90:
        return "long_answer"
    return "teach_back"


# ─── Main Analysis Engine ─────────────────────────────────────────────────────

class AnswerAnalysisEngine:
    """
    Multi-dimensional analysis for a single student answer event.
    """

    def analyze(
        self,
        *,
        # Answer payload
        answer_text:      str,
        is_correct:       bool,
        difficulty:       str        = "medium",
        topic:            str        = "",
        question_text:    str        = "",

        # Timing telemetry
        time_taken_s:     float      = 0.0,
        correction_count: int        = 0,    # number of backspaces/edits

        # Behavior batch from frontend (may be empty)
        behavior_signals: Dict[str, Any] = None,

        # Previous mastery for this concept (BKT)
        mastery_before:   float      = 0.1,
        mastery_after:    float      = 0.1,

        # Answer history for semantic fingerprint
        answer_history:   List[str]  = None,
    ) -> AnswerAnalysisResult:

        behavior_signals = behavior_signals or {}
        answer_history   = answer_history   or []

        # ── 1. Correctness dimension ─────────────────────────────────────────
        correctness = 1.0 if is_correct else 0.0

        # ── 2. Depth dimension ───────────────────────────────────────────────
        depth = self._compute_depth(
            answer_text, question_text, correctness
        )

        # ── 3. Effort dimension ──────────────────────────────────────────────
        effort = self._compute_effort(
            answer_text, time_taken_s, difficulty,
            correction_count, behavior_signals
        )

        # ── 4. Growth delta ──────────────────────────────────────────────────
        raw_delta = mastery_after - mastery_before
        growth_delta = max(0.0, min(1.0, (raw_delta + 0.2) / 0.4))  # normalize −0.2…+0.2 → 0…1

        dimensions = AnswerDimensions(
            correctness=round(correctness, 4),
            depth=round(depth, 4),
            effort=round(effort, 4),
            growth_delta=round(growth_delta, 4),
        )

        # ── 5. Authenticity (6-signal) ────────────────────────────────────────
        authenticity = self._compute_authenticity(
            answer_text, time_taken_s, difficulty,
            correction_count, behavior_signals,
            answer_history
        )

        # ── 6. Probe trigger ─────────────────────────────────────────────────
        probe = _make_probe(topic) if authenticity.trigger_probe else None

        # ── 7. Next question type recommendation ─────────────────────────────
        q_type = _recommend_question_type(mastery_after)

        trace = {
            "correctness": correctness,
            "depth":       depth,
            "effort":      effort,
            "growth_delta": growth_delta,
            "learning_score": dimensions.learning_score,
            "authenticity_score": authenticity.score,
            "authenticity_signals": {
                "keystroke_burst":    authenticity.keystroke_burst,
                "think_time_ratio":   authenticity.think_time_ratio,
                "correction_pattern": authenticity.correction_pattern,
                "vocabulary_jump":    authenticity.vocabulary_jump,
                "semantic_drift":     authenticity.semantic_drift,
                "probe_validated":    authenticity.probe_validated,
            },
            "recommended_q_type": q_type,
            "probe_triggered": probe is not None,
        }

        return AnswerAnalysisResult(
            dimensions=dimensions,
            authenticity=authenticity,
            probe_question=probe,
            question_type_rec=q_type,
            debug_trace=trace,
        )

    # ── Depth ──────────────────────────────────────────────────────────────

    def _compute_depth(self, answer: str, question: str, correctness: float) -> float:
        """
        Depth = how well the answer demonstrates understanding.
        Signals: length, vocabulary, sentence structure, keyword coverage.
        """
        if not answer:
            return 0.0

        wc = _word_count(answer)
        sc = _sentence_count(answer)
        vocab = _vocab_complexity(answer)

        # Length signal: answers under 5 words are shallow
        length_score = min(1.0, wc / 30.0)

        # Sentence complexity: average words per sentence
        avg_words_per_sent = wc / sc
        structure_score = min(1.0, avg_words_per_sent / 15.0)

        # Keyword overlap with question
        q_words = set(re.findall(r"[a-z]{4,}", question.lower())) if question else set()
        a_words = set(re.findall(r"[a-z]{4,}", answer.lower()))
        overlap = len(q_words & a_words) / max(len(q_words), 1) if q_words else 0.3

        depth = (
            0.35 * length_score +
            0.25 * vocab +
            0.20 * structure_score +
            0.20 * overlap
        )

        # Correct answers with shallow responses still get penalised
        if correctness < 0.5:
            depth *= 0.6

        return round(min(1.0, depth), 4)

    # ── Effort ─────────────────────────────────────────────────────────────

    def _compute_effort(
        self,
        answer: str,
        time_s: float,
        difficulty: str,
        corrections: int,
        behavior: Dict[str, Any],
    ) -> float:
        """
        Effort = genuine engagement with the question.
        High effort: reasonable time spent, some corrections (thinking),
        no idle/paste signals dominating.
        """
        expected_s = _expected_time(difficulty)

        # Time ratio (0.3 → 2.5x of expected = full score)
        if time_s > 0 and expected_s > 0:
            ratio = time_s / expected_s
            if ratio < 0.1:
                time_score = 0.1   # Too fast
            elif ratio > 3.0:
                time_score = 0.7   # Unusually slow (possible distraction, not effort)
            else:
                # Bell curve peaking at 1.0x expected
                time_score = min(1.0, 1.0 - abs(ratio - 1.0) * 0.3)
        else:
            time_score = 0.5  # No timing data → neutral

        # Correction signal: some corrections = thinking through
        if corrections == 0:
            correction_score = 0.5
        elif corrections <= 3:
            correction_score = 0.8
        elif corrections <= 8:
            correction_score = 1.0
        else:
            correction_score = 0.7  # Excessive corrections → floundering

        # Paste penalty: if paste was detected, reduce effort
        paste_count = behavior.get("paste_count", 0)
        paste_penalty = min(0.6, paste_count * 0.2) if paste_count else 0.0

        # Idle penalty
        idle_count = behavior.get("idle_count", 0)
        idle_penalty = min(0.3, idle_count * 0.1) if idle_count else 0.0

        effort = (
            0.50 * time_score +
            0.30 * correction_score +
            0.20 * max(0.0, 1.0 - paste_penalty - idle_penalty)
        )

        return round(min(1.0, max(0.0, effort)), 4)

    # ── Authenticity (6-signal) ────────────────────────────────────────────

    def _compute_authenticity(
        self,
        answer: str,
        time_s: float,
        difficulty: str,
        corrections: int,
        behavior: Dict[str, Any],
        history: List[str],
    ) -> AuthenticityBreakdown:

        # Signal 1: keystroke burst (chars per second)
        char_count = len(answer)
        if time_s > 0 and char_count > 0:
            cps = char_count / time_s
            if cps > 15.0:
                burst = 0.1
            elif cps > 8.0:
                burst = 0.4
            elif cps > 5.0:
                burst = 0.7
            else:
                burst = 1.0
        else:
            burst = 1.0

        # Reconcile with frontend paste signals
        paste_count = behavior.get("paste_count", 0)
        if paste_count:
            burst = min(burst, max(0.1, 1.0 - paste_count * 0.3))

        # Signal 2: think-time ratio
        expected = _expected_time(difficulty)
        if time_s > 0 and expected > 0:
            ratio = time_s / expected
            if ratio < 0.05:
                think_time = 0.1
            elif ratio < 0.15:
                think_time = 0.3
            elif ratio < 0.30:
                think_time = 0.6
            else:
                think_time = min(1.0, ratio)
        else:
            think_time = 0.5

        # Signal 3: correction pattern (some corrections = genuine thinking)
        if corrections == 0 and char_count > 50:
            # Long answer, zero corrections = suspicious
            correction_sig = 0.4
        elif 1 <= corrections <= 10:
            correction_sig = 1.0
        else:
            correction_sig = 0.7

        # Signal 4: vocabulary jump (sudden complexity vs history)
        current_vocab = _vocab_complexity(answer)
        if history:
            hist_vocab = sum(_vocab_complexity(h) for h in history[-5:]) / min(len(history), 5)
            jump = abs(current_vocab - hist_vocab)
            vocab_jump = max(0.0, 1.0 - jump * 2.5)
        else:
            vocab_jump = 0.7  # No baseline = uncertain

        # Signal 5: semantic fingerprint drift (crude word-overlap similarity)
        if history:
            recent = " ".join(history[-3:])
            hist_words = set(re.findall(r"[a-z]{4,}", recent.lower()))
            curr_words = set(re.findall(r"[a-z]{4,}", answer.lower()))
            if hist_words and curr_words:
                intersection = len(hist_words & curr_words)
                union = len(hist_words | curr_words)
                similarity = intersection / union
                # If current answer is radically different vocabulary from history
                # AND answer is long, it's potentially copy-pasted
                if similarity < 0.05 and char_count > 150:
                    semantic_drift = 0.2
                else:
                    semantic_drift = min(1.0, 0.5 + similarity)
            else:
                semantic_drift = 0.7
        else:
            semantic_drift = 0.7

        # Signal 6: probe validated (default 1.0 — updated externally on probe answer)
        probe_validated = float(behavior.get("probe_validated", 1.0))

        return AuthenticityBreakdown(
            keystroke_burst=round(burst, 3),
            think_time_ratio=round(think_time, 3),
            correction_pattern=round(correction_sig, 3),
            vocabulary_jump=round(vocab_jump, 3),
            semantic_drift=round(semantic_drift, 3),
            probe_validated=round(probe_validated, 3),
        )


# Singleton
answer_analysis_engine = AnswerAnalysisEngine()
