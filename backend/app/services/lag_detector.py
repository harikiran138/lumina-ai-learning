"""
lag_detector.py
---------------
Concept Lag Detector for the Lumina AI Learning Platform.

Computes a lag score for each concept using the formula:

    lag_score(C) = (1 - mastery(C)) × dependency_depth(C)

A high lag score means the student has low mastery on a deeply depended-upon
concept — i.e., a bottleneck that will block downstream learning.

Concepts are described by plain dicts with at minimum:
    - "id"                (str)  — unique concept identifier
    - "dependency_depth"  (int)  — depth of the concept in the prerequisite tree
                                   (root = 0, deeper = higher number)

Mastery scores are floats in [0.0, 1.0] keyed by concept_id.
If a concept has no entry in mastery_scores its mastery defaults to 0.0
(i.e., completely unknown → maximum possible lag contribution).
"""

from __future__ import annotations

from typing import Dict, List, Optional


# ---------------------------------------------------------------------------
# Core computation
# ---------------------------------------------------------------------------

def compute_lag_scores(
    mastery_scores: Dict[str, float],
    concepts: List[dict],
) -> Dict[str, float]:
    """
    Compute a lag score for every concept.

    Parameters
    ----------
    mastery_scores:
        Mapping of concept_id → mastery value in [0.0, 1.0].
        Missing concept IDs are treated as mastery = 0.0.
    concepts:
        List of concept dicts, each containing at least:
            - "id": str
            - "dependency_depth": int

    Returns
    -------
    Dict[str, float]
        Mapping of concept_id → lag_score, where
        lag_score = (1 - mastery) × dependency_depth.
    """
    scores: Dict[str, float] = {}

    for concept in concepts:
        concept_id: str = concept["id"]
        depth: int = int(concept["dependency_depth"])
        mastery: float = float(mastery_scores.get(concept_id, 0.0))

        # Clamp mastery to [0, 1] defensively in case of upstream data issues.
        mastery = max(0.0, min(1.0, mastery))

        scores[concept_id] = (1.0 - mastery) * depth

    return scores


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_lag_zones(
    mastery_scores: Dict[str, float],
    concepts: List[dict],
    top_n: int = 3,
) -> List[str]:
    """
    Return the top-N concept IDs that represent the student's biggest lag zones.

    Lag zones are concepts with the highest lag scores — they are prerequisites
    that the student has not yet mastered and that many other concepts depend on.

    Parameters
    ----------
    mastery_scores:
        Mapping of concept_id → mastery value in [0.0, 1.0].
    concepts:
        List of concept dicts (must include "id" and "dependency_depth").
    top_n:
        Number of lag zones to return. Defaults to 3.

    Returns
    -------
    List[str]
        Up to `top_n` concept IDs sorted by descending lag score.
        May be shorter than `top_n` if fewer concepts exist.
    """
    scores = compute_lag_scores(mastery_scores, concepts)

    sorted_concepts = sorted(scores.items(), key=lambda kv: kv[1], reverse=True)

    return [concept_id for concept_id, _ in sorted_concepts[:top_n]]


def get_highest_priority_lag(
    mastery_scores: Dict[str, float],
    concepts: List[dict],
) -> Optional[str]:
    """
    Return the single concept ID with the highest lag score.

    This is the most critical bottleneck for the student's current learning path.

    Parameters
    ----------
    mastery_scores:
        Mapping of concept_id → mastery value in [0.0, 1.0].
    concepts:
        List of concept dicts (must include "id" and "dependency_depth").

    Returns
    -------
    str | None
        The concept ID with the highest lag score, or None if `concepts` is empty.
    """
    if not concepts:
        return None

    lag_zones = get_lag_zones(mastery_scores, concepts, top_n=1)
    return lag_zones[0] if lag_zones else None
