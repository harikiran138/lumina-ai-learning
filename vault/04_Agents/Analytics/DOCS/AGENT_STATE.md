# Agent State Definition

The Lumina Analytics Agent maintains a persistent, evolving state for each learner. This state allows it to reason causally over time rather than reacting only to instantaneous triggers.

## 1. State Object Schema

The full state is composed of four sub-state objects:

### A. Engagement State (`EngagementState`)
Tracks the learner's behavioral momentum.
-   `score` (float): 0.0 - 1.0
-   `trend` (enum): "increasing", "stable", "declining"
-   `stability` (float): Inverse variance of recent scores.
-   `last_interaction_timestamp` (unix): For calculating decay.

### B. Cognitive State (`CognitiveState`)
Tracks mental effort and capacity.
-   `load_index` (float): 0.0 (Idle) - 1.0 (Overload).
-   `fatigue_detected` (bool): True if sustained high load > threshold.
-   `flow_state` (bool): True if `load` is optimal AND `engagement` is high.
-   `time_of_day_modifier` (float): Circadian adjustment factor (0.8 - 1.2).

### C. Mastery State (`MasteryMap`)
Tracks concept-level knowledge.
-   `map` (Dict[concept_id, probability]): BKT-derived mastery probabilities.
-   *Note:* Updates are event-driven (e.g., quiz answers).

### D. Risk State (`RiskState`)
Tracks adverse outcome probabilities.
-   `dropout_probability` (float).
-   `failure_probability` (float).
-   `burnout_risk` (float).

## 2. State Transition Logic

The agent operates as a functional state machine:

$$ S_{t+1} = f(S_t, I_t, C) $$

Where:
-   $S$ is the Agent State.
-   $I$ is the Input Signal Vector.
-   $C$ is the Context (Time, Environment).

### Transitions
1.  **Decay**: If $I_t$ is empty (idle), $S_{engagement}$ decays exponentially.
2.  **Reinforcement**: If $I_t$ shows success, $S_{mastery}$ increases via Bayes Rule.
3.  **Fatigue Accumulation**: High $S_{load}$ over time increases $S_{fatigue\_risk}$.
