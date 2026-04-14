# Transition Model Dynamics

The transition model $P(S_{t+1} | S_t, a_t)$ describes how the learner's state evolves based on actions. The agent uses this mental model (implicitly or explicitly) to predict future rewards.

## 1. Mastery Dynamics (The Learning Curve)

We model mastery evolution using a simplified Bayesian Knowledge Tracing (BKT) or Performance Factor Analysis (PFA) logic.

### **If Action = CONTINUE/ADVANCE**
*   **Success**: $P(Success) \approx S_t[Mastery]$
*   **Update**: $S_{t+1}[Mastery] = S_t[Mastery] + \alpha \cdot (1 - S_t[Mastery])$
    *   Learning follows a logistic growth curve.
    *   $\alpha$ is the "Learn Rate", dependent on cognitive load and engagement.

### **If Action = REVIEW**
*   **Update**: $S_{t+1}[Stability] = S_t[Stability] \cdot \text{BoostFactor}$
    *   Reviewing primarily boosts *retention* (stability), making the decay curve flatter.

## 2. Fatigue Dynamics (Energy Depletion)

Fatigue accumulates linearly with time and cognitive load, and recovers during rest.

$$ F_{t+1} = \begin{cases} F_t + \delta_{strain} \cdot L_t & \text{if } a_t \in \{Continue, Advance, Review\} \\ F_t - \delta_{recover} & \text{if } a_t = Rest \end{cases} $$

*   $L_t$: Cognitive Load.
*   Once $F_t \to 1$, the Learning Rate $\alpha$ drops to 0 (Diminishing returns).

## 3. Engagement Dynamics

Engagement is modeled as a mean-reverting stochastic process affected by "mismatch penalty".

*   **Boredom Penalty**: If $Mastery$ is high and Action is not $Advance$, Engagement drops.
*   **Frustration Penalty**: If $Cognitive Load$ is high and Outcome is Failure, Engagement drops.
*   **Flow Bonus**: If $Mastery$ and $Challenge$ are balanced, Engagement rises.

## 4. Time Dynamics
*   Each action consumes time $\Delta t$.
*   $T_{remaining}$ decreases.
*   Policy must maximize total reward before $T_{remaining} = 0$.
