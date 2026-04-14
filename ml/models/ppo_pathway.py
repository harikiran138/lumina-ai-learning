"""
style_rl.py
-----------
Style RL Engine (PPO-like) for the Lumina AI Learning Platform.

Manages a probability distribution over 10 teaching styles and updates it
using a lightweight PPO-inspired reward signal derived from mastery change.

Design principles
~~~~~~~~~~~~~~~~~
- All functions are pure / functional — no module-level mutable state.
- The caller (PersonalizationService / student profile store) is responsible
  for loading and persisting the style weights between sessions.
- ``StyleWeights`` is a plain ``Dict[str, float]`` for easy JSON serialisation.

Style selection policy
~~~~~~~~~~~~~~~~~~~~~~
1. If ``mastery > 0.65`` → always select "socratic" (spec rule, near-mastery).
2. With probability ``epsilon`` → select a uniformly random style (exploration).
3. Otherwise → select the style with the highest weight (exploitation).

Weight update rule
~~~~~~~~~~~~~~~~~~
    weights[style] += learning_rate × mastery_delta

All weights are then clipped to [0.01, 1.0] to prevent any style from being
permanently suppressed, and normalised to sum to 1.0.
"""

from __future__ import annotations

import random
from typing import Dict

# ---------------------------------------------------------------------------
# Style registry
# ---------------------------------------------------------------------------

STYLES: Dict[str, Dict[str, str]] = {
    "story": {
        "label": "Story mode",
        "learner_type": "narrative learner",
        "trigger": "engagement spikes with 'imagine', 'once', 'picture this'",
    },
    "joke": {
        "label": "Joke/humour mode",
        "learner_type": "bored or disengaged",
        "trigger": "engagement score drops below 40",
    },
    "liveExample": {
        "label": "Live example mode",
        "learner_type": "kinesthetic learner",
        "trigger": "performs better after hands-on activities",
    },
    "analogy": {
        "label": "Analogy mode",
        "learner_type": "conceptual thinker",
        "trigger": "faster comprehension after relational comparisons",
    },
    "poem": {
        "label": "Poem/rhythm mode",
        "learner_type": "creative/arts student",
        "trigger": "creative writing interests or arts background",
    },
    "formula": {
        "label": "Formula/precision mode",
        "learner_type": "logical thinker",
        "trigger": "prefers numbered steps and exact definitions",
    },
    "socratic": {
        "label": "Socratic question mode",
        "learner_type": "near-mastery student",
        "trigger": "mastery > 0.65",
    },
    "experiment": {
        "label": "Experiment/try-it mode",
        "learner_type": "science learner",
        "trigger": "responds better when given real-world observation",
    },
    "visual": {
        "label": "Visual mode",
        "learner_type": "visual learner",
        "trigger": "faster comprehension with diagrams and charts",
    },
    "verbal": {
        "label": "Verbal mode",
        "learner_type": "verbal/reading learner",
        "trigger": "prefers detailed text explanations",
    },
}

# Type alias for clarity.
StyleWeights = Dict[str, float]

# Clipping bounds for individual style weights before normalisation.
_WEIGHT_MIN: float = 0.01
_WEIGHT_MAX: float = 1.0


# ---------------------------------------------------------------------------
# Core helpers
# ---------------------------------------------------------------------------

def normalize_weights(weights: StyleWeights) -> StyleWeights:
    """
    Normalise a style weight dict so that all values sum to 1.0.

    Parameters
    ----------
    weights:
        Raw weight mapping of style_name → weight.

    Returns
    -------
    StyleWeights
        New dict with the same keys, values scaled to sum to 1.0.

    Raises
    ------
    ValueError
        If the total weight is zero or negative (cannot normalise).
    """
    total = sum(weights.values())
    if total <= 0.0:
        raise ValueError(
            "Cannot normalise style weights: total weight is zero or negative."
        )
    return {style: w / total for style, w in weights.items()}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def default_weights() -> StyleWeights:
    """
    Return an equal-probability weight distribution across all 10 styles.

    Each style receives weight 1/10 = 0.1.

    Returns
    -------
    StyleWeights
        Dict of style_name → 0.1 for all styles in STYLES.
    """
    equal_weight = 1.0 / len(STYLES)
    return {style: equal_weight for style in STYLES}


def select_style(
    weights: StyleWeights,
    mastery: float = 0.5,
    epsilon: float = 0.1,
) -> str:
    """
    Select a teaching style using an ε-greedy policy with a mastery override.

    Selection rules (applied in order):
        1. If ``mastery > 0.65`` → return "socratic" unconditionally.
        2. With probability ``epsilon`` → return a uniformly random style
           (exploration).
        3. Otherwise → return the style with the highest weight (exploitation).

    Parameters
    ----------
    weights:
        Current style weight distribution (need not be normalised; ties in
        argmax are broken by dict insertion order).
    mastery:
        Student's current mastery level for the active concept, in [0.0, 1.0].
    epsilon:
        Exploration rate, in [0.0, 1.0]. Defaults to 0.1 (10% exploration).

    Returns
    -------
    str
        The selected style key (one of the keys in STYLES).
    """
    # Rule 1: near-mastery override.
    if mastery > 0.65:
        return "socratic"

    # Rule 2: random exploration.
    if random.random() < epsilon:
        return random.choice(list(STYLES.keys()))

    # Rule 3: greedy exploitation — pick style with highest weight.
    return max(weights, key=lambda s: weights.get(s, 0.0))


def update_weights(
    weights: StyleWeights,
    style: str,
    mastery_delta: float,
    learning_rate: float = 0.01,
) -> StyleWeights:
    """
    Apply a PPO-inspired weight update for the style that was just used.

    Update rule:
        new_weight[style] = clip(old_weight[style] + lr × mastery_delta,
                                  min=0.01, max=1.0)

    All weights are then normalised to sum to 1.0.

    This function does NOT mutate the input dict.

    Parameters
    ----------
    weights:
        Current style weight distribution.
    style:
        The style key that was applied in the most recent interaction.
    mastery_delta:
        Change in mastery observed after using this style (positive = good,
        negative = style was ineffective or harmful).
    learning_rate:
        Step size for the weight update. Defaults to 0.01.

    Returns
    -------
    StyleWeights
        New weight dict with the updated and normalised weights.

    Raises
    ------
    KeyError
        If ``style`` is not a recognised style key.
    """
    if style not in STYLES:
        raise KeyError(
            f"Unknown style '{style}'. Valid styles: {list(STYLES.keys())}"
        )

    # Copy to avoid mutating the caller's dict.
    updated = dict(weights)

    # Ensure the dict contains all known styles (fill missing with default).
    for s in STYLES:
        if s not in updated:
            updated[s] = 1.0 / len(STYLES)

    # Apply the PPO-like gradient step for the chosen style.
    updated[style] = updated[style] + learning_rate * mastery_delta

    # Clip all weights to prevent collapse (any style becoming unreachable).
    updated = {s: max(_WEIGHT_MIN, min(_WEIGHT_MAX, w)) for s, w in updated.items()}

    # Re-normalise so weights form a valid probability distribution.
    return normalize_weights(updated)
