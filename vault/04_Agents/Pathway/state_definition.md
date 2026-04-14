# Pathway Agent State Definition

The internal state vector $S_t$ of the Pathway Agent at time $t$ is composed of the following components. This state is reconstructed at every decision step from the MCP input context.

## 1. Mastery Components (Per Concept)
For each relevant concept $c$:
*   **Confidence ($P_c$)**: The probability that the learner currently knows the concept. Range: $[0, 1]$.
*   **Stability ($S_c$)**: Estimated durability of the memory (e.g., half-life in days). High stability means the concept is retained longer. Range: $[0, \infty)$.
*   **Recency ($R_c$)**: Time elapsed since the last interaction with this concept. Range: $[0, \infty)$ hours.

## 2. Engagement & Affective Components
*   **Engagement Index ($E_t$)**: A composite score of current attention and interaction quality. Range: $[0, 1]$.
    *   $0$: Completely disengaged.
    *   $1$: Fully immersed ("Flow").
*   **Cognitive Load ($L_t$)**: Estimate of current mental effort required. Range: $[0, 1]$.
    *   Low load -> Potential boredom.
    *   High load -> Potential frustration.
*   **Fatigue ($F_t$)**: Cumulative mental exhaustion over the session. Range: $[0, 1]$. Increases with session time and high cognitive load actions.

## 3. Session Context
*   **Session Progress ($T_{elapsed}$)**: Minutes elapsed in the current learning session.
*   **Time Budget ($T_{remaining}$)**: Minutes remaining before the user's hard stop or typical session limit.
*   **Streak ($N_{streak}$)**: Number of consecutive correct/successful interactions in the immediate history.

## 4. History Vector (Sequence)
A fixed-length sequence of the last $k$ interactions (e.g., $k=10$):
*   $H_t = [(a_{t-k}, o_{t-k}), ..., (a_{t-1}, o_{t-1})]$
    *   $a$: Action taken (e.g., "Review Concept A").
    *   $o$: Outcome (e.g., Correct, 3s response time).

## Integrated State Vector
The RL policy expects a flattened or structured tensor combining these features:
$$ S_t = [\mathbf{MasteryFeatures}, \mathbf{EngagementFeatures}, \mathbf{ContextFeatures}, \mathbf{HistoryFeatures}] $$
