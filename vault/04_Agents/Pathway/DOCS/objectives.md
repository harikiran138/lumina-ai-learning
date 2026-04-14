# Optimization Objectives

The Pathway Agent makes decisions to maximize a composite utility function derived from three primary objectives: **Learning Efficiency**, **Engagement**, and **Retention**.

## 1. Learning Efficiency
*   **Definition**: Maximizing the rate of knowledge acquisition per unit of time.
*   **Metric**: $\frac{\Delta \text{Mastery}}{\Delta \text{Time}}$
*   **Goal**: Reach target mastery levels in the shortest possible effective time, avoiding redundant content.

## 2. Engagement
*   **Definition**: Maintaining the learner's attention, motivation, and "flow" state.
*   **Metric**: Composite score of interaction latency, session length, and sentiment analysis (if available).
*   **Goal**: Keep the learner in the "Zone of Proximal Development" — not too hard (frustration), not too easy (boredom).

## 3. Retention
*   **Definition**: Ensuring knowledge is durable over time, countering the Ebbinghaus Forgetting Curve.
*   **Metric**: Probability of future recall (predicted by spaced repetition models).
*   **Goal**: Schedule reviews at optimal intervals to convert short-term memory to long-term mastery.

## Trade-offs & Balancing

The agent must dynamically balance these often conflicting goals:

*   **Efficiency vs. Retention**: "Cramming" is efficient in the short term but poor for retention. The agent prioritizes long-term retention over short-term speed, forcing reviews even if it slows down immediate progress.
*   **Efficiency vs. Engagement**: Highly intense learning is efficient but fatiguing. The agent injects "Rest" or easier "Review" actions to manage fatigue and sustain long-term engagement, effectively sacrificing short-term efficiency for session longevity.
*   **Advanced vs. Review**: Advancing too fast risks building on shaky foundations (churn). Staying on review too long risks boredom. The agent uses **Mastery Confidence** and **Stability** metrics to decide when to push forward.
