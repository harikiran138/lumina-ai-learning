# RL Learning Environment (Simulated Learner)

To train the Pathway Agent policy without burning out real students, we define a **Simulated Learner Environment** (Gym/PettingZoo compatible).

## 1. Environment Specifications

*   **Observation Space**: The State Vector $S_t$ (Mastery, Engagement, Context, History).
*   **Action Space**: Discrete(4) + Parameter selection (TopicID).
*   **Step Function**:
    1.  Agent submits Action $a_t$.
    2.  Simulator calculates $P(Success)$ based on current "True" hidden mastery.
    3.  Simulator samples Outcome (Correct/Incorrect).
    4.  Simulator updates internal Hidden State (Mastery $\uparrow$, Fatigue $\uparrow$).
    5.  Simulator emits Observation $S_{t+1}$ and Reward $r_t$.

## 2. Simulated Student Profiles

The environment supports different "personas" to ensure the policy generalizes:

*   **The Fast Learner**: High learning rate $\alpha$, slow forgetting, high initial engagement.
*   **The Struggler**: Low $\alpha$, fast forgetting, easily frustrated (Engagement drops fast on failure).
*   **The Binge Learner**: High energy initially, but Fatigue accumulates very rapidly.
*   **The Distracted Learner**: Engagement has high variance (random noise).

## 3. Episode Termination

An episode ends when:
1.  **Goal Reached**: All target concepts mastered to threshold (Success).
2.  **Time Limit**: Max steps or max session time exceeded.
3.  **Quit**: Engagement drops to 0 (Simulated user dropout).
