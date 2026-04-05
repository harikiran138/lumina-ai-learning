"""
scorer.py
---------
4-Dimensional Answer Scorer for the Lumina AI Learning Platform.

Computes a composite score S from four dimensions:

    S = 0.40 × correctness
      + 0.30 × understanding_depth
      + 0.20 × effort_signals
      + 0.10 × growth_delta

Dimension definitions
~~~~~~~~~~~~~~~~~~~~~
correctness (0–1):
    Factual accuracy as determined by the upstream grader.

understanding_depth (0–1):
    Semantic depth proxy based on answer length relative to the expected
    word count for the question type.
        - Short-answer: expected ~50 words
        - Essay:        expected ~200 words
    Computed as min(actual_word_count / expected_word_count, 1.0).

effort_signals (0–1):
    Proxy for engagement authenticity. Passed in directly from the
    engagement/authenticity scoring pipeline.

growth_delta (0–1):
    Mastery improvement normalised to a 0.5-point scale and capped at 1.0.
        growth_delta = clamp(max(0, new_mastery - old_mastery) / 0.5, 0, 1)
"""

from __future__ import annotations

from dataclasses import dataclass

# ---------------------------------------------------------------------------
# Public constants
# ---------------------------------------------------------------------------

WEIGHTS: dict[str, float] = {
    "correctness": 0.40,
    "understanding_depth": 0.30,
    "effort_signals": 0.20,
    "growth_delta": 0.10,
}

# Expected word counts used when the caller does not supply a custom value.
EXPECTED_WORD_COUNT_SHORT_ANSWER: int = 50
EXPECTED_WORD_COUNT_ESSAY: int = 200


# ---------------------------------------------------------------------------
# Result dataclass
# ---------------------------------------------------------------------------

@dataclass
class Score4D:
    """
    Holds all four dimension scores plus the weighted composite total.

    Attributes
    ----------
    correctness:
        Factual accuracy from the grader, in [0, 1].
    understanding_depth:
        Length-normalised depth proxy, in [0, 1].
    effort_signals:
        Engagement authenticity proxy, in [0, 1].
    growth_delta:
        Normalised mastery improvement, in [0, 1].
    total:
        Weighted composite score S = Σ(weight_i × dimension_i), in [0, 1].
    """

    correctness: float
    understanding_depth: float
    effort_signals: float
    growth_delta: float
    total: float


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _compute_understanding_depth(answer_text: str, expected_word_count: int) -> float:
    """
    Estimate semantic depth as word-count coverage of the expected length.

    Parameters
    ----------
    answer_text:
        The student's raw answer string.
    expected_word_count:
        Target word count for this question type (e.g. 50 for short-answer,
        200 for essay).

    Returns
    -------
    float in [0.0, 1.0]
    """
    if expected_word_count <= 0:
        return 1.0

    word_count = len(answer_text.split())
    return min(word_count / expected_word_count, 1.0)


def _compute_growth_delta(old_mastery: float, new_mastery: float) -> float:
    """
    Normalise mastery improvement to a 0–1 scale anchored on a 0.5-point gain.

    A gain of ≥ 0.5 in mastery yields growth_delta = 1.0.
    Negative or zero gains yield 0.0.

    Parameters
    ----------
    old_mastery:
        Prior mastery level in [0, 1].
    new_mastery:
        Updated mastery level in [0, 1].

    Returns
    -------
    float in [0.0, 1.0]
    """
    delta = max(0.0, new_mastery - old_mastery)
    return min(delta / 0.5, 1.0)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def compute_score(
    correctness: float,
    answer_text: str,
    expected_word_count: int,
    engagement_score: float,
    old_mastery: float,
    new_mastery: float,
) -> Score4D:
    """
    Compute the 4-dimensional score for a student's answer submission.

    Parameters
    ----------
    correctness:
        Factual accuracy of the answer in [0.0, 1.0], as determined by the
        grader service.
    answer_text:
        The raw text of the student's answer.
    expected_word_count:
        The expected answer length in words for this question type.
        Use ``EXPECTED_WORD_COUNT_SHORT_ANSWER`` (50) or
        ``EXPECTED_WORD_COUNT_ESSAY`` (200) as convenience constants, or supply
        a custom value.
    engagement_score:
        Engagement / authenticity score for this submission in [0.0, 1.0],
        as produced by the engagement pipeline.
    old_mastery:
        The student's mastery of the relevant concept before this submission,
        in [0.0, 1.0].
    new_mastery:
        The student's mastery of the relevant concept after this submission,
        in [0.0, 1.0].

    Returns
    -------
    Score4D
        Populated dataclass with all four dimension scores and the weighted total.
    """
    # Clamp all inputs defensively.
    correctness = max(0.0, min(1.0, correctness))
    engagement_score = max(0.0, min(1.0, engagement_score))
    old_mastery = max(0.0, min(1.0, old_mastery))
    new_mastery = max(0.0, min(1.0, new_mastery))

    understanding_depth = _compute_understanding_depth(answer_text, expected_word_count)
    effort_signals = engagement_score
    growth_delta = _compute_growth_delta(old_mastery, new_mastery)

    total = (
        WEIGHTS["correctness"] * correctness
        + WEIGHTS["understanding_depth"] * understanding_depth
        + WEIGHTS["effort_signals"] * effort_signals
        + WEIGHTS["growth_delta"] * growth_delta
    )

    return Score4D(
        correctness=correctness,
        understanding_depth=understanding_depth,
        effort_signals=effort_signals,
        growth_delta=growth_delta,
        total=round(total, 6),
    )
