"""
course_path_engine.py — Dynamic Course Path Sequencer
------------------------------------------------------
Implements RL/PPO-style dynamic course path resequencing using a weighted
scoring system that mimics PPO reward-driven reordering without requiring
an external RL library.

Sequencing philosophy:
  - Prerequisite gates: topics whose dependencies are unmastered are deferred.
  - Lag-first ordering: highest (1 - mastery) × dependency_depth topics come first.
  - Skip mastered topics (mastery > 0.80) to maintain engagement and pace.
  - Remediate deeply lagging topics (mastery < 0.40) with full restarts.
  - Fast-track topics where growth velocity is positive and mastery is solid (> 0.60).
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

# ─── Thresholds ────────────────────────────────────────────────────────────────

MASTERY_SKIP_THRESHOLD        = 0.80   # Topic is considered mastered → skip
MASTERY_REMEDIATION_THRESHOLD = 0.40   # Topic needs full remediation
MASTERY_PREREQ_GATE           = 0.60   # Minimum mastery to consider a prereq met
MASTERY_CHALLENGE_THRESHOLD   = 0.60   # Minimum mastery to be fast-tracked
VELOCITY_CHALLENGE_THRESHOLD  = 0.0    # Growth velocity must be positive to challenge


# ─── Dataclasses ──────────────────────────────────────────────────────────────

@dataclass
class TopicNode:
    topic_id: str
    title: str
    mastery: float           # current student mastery (0.0–1.0)
    velocity: float          # growth velocity (+ = growing, 0 = stuck, - = regressing)
    dependency_depth: int    # depth in prerequisite tree (root = 0)
    dependencies: List[str]  # prerequisite topic IDs that must be ≥ MASTERY_PREREQ_GATE
    lag_score: float = 0.0   # computed: (1 - mastery) × dependency_depth


@dataclass
class CoursePathPlan:
    student_id: str
    ordered_topic_ids: List[str]          # recommended sequence
    skip_topic_ids: List[str]             # topics student can skip (mastery > 0.80)
    remediate_topic_ids: List[str]        # topics needing extra attention (mastery < 0.40)
    challenge_topic_ids: List[str]        # topics student is ready to advance on
    rationale: Dict[str, str] = field(default_factory=dict)  # topic_id → reason


# ─── Core functions ───────────────────────────────────────────────────────────

def compute_lag_scores(topics: List[TopicNode]) -> List[TopicNode]:
    """
    Fill in the lag_score field for every TopicNode in-place and return the list.

    Formula:
        lag_score = (1 - mastery) × dependency_depth

    A high lag_score signals a bottleneck prerequisite the student has not yet
    mastered and that many downstream concepts depend on.

    Parameters
    ----------
    topics : List[TopicNode]
        Nodes whose lag_score fields will be populated.

    Returns
    -------
    List[TopicNode]
        The same list, each node's lag_score field updated.
    """
    for node in topics:
        mastery = max(0.0, min(1.0, node.mastery))
        node.lag_score = round((1.0 - mastery) * max(0, node.dependency_depth), 4)

    return topics


def check_prerequisites_met(
    topic: TopicNode,
    mastery_map: Dict[str, float],
    threshold: float = MASTERY_PREREQ_GATE,
) -> bool:
    """
    Return True if all prerequisite topics for this node meet the mastery threshold.

    A topic with no dependencies is always considered unblocked.

    Parameters
    ----------
    topic : TopicNode
        The topic whose prerequisites are being evaluated.
    mastery_map : Dict[str, float]
        Current mastery values keyed by topic_id.
        Topics not present in the map are treated as mastery = 0.0.
    threshold : float
        Minimum mastery score a prerequisite must have to be considered met.
        Defaults to MASTERY_PREREQ_GATE (0.60).

    Returns
    -------
    bool
        True if all dependencies have mastery ≥ threshold, False otherwise.
    """
    for dep_id in topic.dependencies:
        dep_mastery = mastery_map.get(dep_id, 0.0)
        if dep_mastery < threshold:
            return False
    return True


def plan_course_path(
    student_id: str,
    topics: List[TopicNode],
    mastery_map: Dict[str, float],
) -> CoursePathPlan:
    """
    Build a personalised, dynamically resequenced course path for the student.

    Algorithm (PPO-style weighted scoring):
      1. Compute lag scores for all topics.
      2. Classify each topic into one of: skip / remediate / challenge / standard.
      3. Separate topics whose prerequisites are not yet met — defer to end.
      4. Sort active (non-skipped, non-deferred) topics by lag_score DESC.
      5. Place remediation topics first within the active set (highest lag = most urgent).
      6. Append deferred (blocked) topics last.
      7. Build rationale strings for teacher/student transparency.

    Parameters
    ----------
    student_id : str
        The student this plan is being built for.
    topics : List[TopicNode]
        All topics in the course, with up-to-date mastery and velocity.
    mastery_map : Dict[str, float]
        Flat mastery map keyed by topic_id, used for prerequisite gate checking.

    Returns
    -------
    CoursePathPlan
        Full plan with ordered sequence, category lists, and per-topic rationale.
    """
    if not topics:
        return CoursePathPlan(
            student_id        = student_id,
            ordered_topic_ids = [],
            skip_topic_ids    = [],
            remediate_topic_ids = [],
            challenge_topic_ids = [],
            rationale         = {},
        )

    # Step 1: Compute lag scores
    topics = compute_lag_scores(topics)

    skip_ids:      List[str] = []
    remediate_ids: List[str] = []
    challenge_ids: List[str] = []
    rationale:     Dict[str, str] = {}

    # Working buckets for sequencing
    active_nodes:   List[TopicNode] = []  # prereqs met, non-skipped
    deferred_nodes: List[TopicNode] = []  # prereqs NOT met

    for node in topics:
        mastery  = max(0.0, min(1.0, node.mastery))
        velocity = node.velocity

        # ── Classification ──────────────────────────────────────────────

        if mastery >= MASTERY_SKIP_THRESHOLD:
            # Already mastered — skip entirely
            skip_ids.append(node.topic_id)
            rationale[node.topic_id] = (
                f"Mastery {mastery:.0%} exceeds skip threshold. "
                "Student has demonstrated competency — topic skipped to maintain pace."
            )
            continue

        if mastery < MASTERY_REMEDIATION_THRESHOLD:
            remediate_ids.append(node.topic_id)
            rationale[node.topic_id] = (
                f"Mastery {mastery:.0%} is below remediation threshold. "
                "Full concept restart recommended with foundational scaffolding."
            )

        if velocity > VELOCITY_CHALLENGE_THRESHOLD and mastery >= MASTERY_CHALLENGE_THRESHOLD:
            challenge_ids.append(node.topic_id)
            rationale.setdefault(
                node.topic_id,
                f"Mastery {mastery:.0%} with positive growth velocity ({velocity:+.3f}). "
                "Student is ready to advance — place in fast-track challenge sequence.",
            )

        # ── Prerequisite gate ────────────────────────────────────────────

        prereqs_met = check_prerequisites_met(node, mastery_map)

        if prereqs_met:
            active_nodes.append(node)
            rationale.setdefault(
                node.topic_id,
                f"Lag score {node.lag_score:.3f} — prerequisites met. "
                f"Mastery {mastery:.0%}, velocity {velocity:+.3f}.",
            )
        else:
            deferred_nodes.append(node)
            unmet = [
                dep for dep in node.dependencies
                if mastery_map.get(dep, 0.0) < MASTERY_PREREQ_GATE
            ]
            rationale[node.topic_id] = (
                f"Prerequisite(s) not met: {', '.join(unmet)}. "
                "Topic deferred until upstream concepts reach "
                f"{MASTERY_PREREQ_GATE:.0%} mastery."
            )

    # Step 2: Sort active topics — lag_score DESC (highest lag = most urgent)
    # Within the same lag tier, remediation topics take priority.
    def _sort_key(node: TopicNode) -> tuple:
        is_remediation = 1 if node.topic_id in remediate_ids else 0
        return (-node.lag_score, -is_remediation)

    active_nodes.sort(key=_sort_key)

    # Step 3: Sort deferred topics by lag_score DESC too (so when they unlock
    # they bubble to the front naturally on next re-plan)
    deferred_nodes.sort(key=lambda n: -n.lag_score)

    # Step 4: Build final ordered list (active first, then deferred)
    ordered_ids: List[str] = [n.topic_id for n in active_nodes] + [n.topic_id for n in deferred_nodes]

    logger.debug(
        "course_path_engine.plan",
        student_id    = student_id,
        total_topics  = len(topics),
        active        = len(active_nodes),
        deferred      = len(deferred_nodes),
        skipped       = len(skip_ids),
        remediate     = len(remediate_ids),
        challenge     = len(challenge_ids),
    )

    return CoursePathPlan(
        student_id          = student_id,
        ordered_topic_ids   = ordered_ids,
        skip_topic_ids      = skip_ids,
        remediate_topic_ids = remediate_ids,
        challenge_topic_ids = challenge_ids,
        rationale           = rationale,
    )
