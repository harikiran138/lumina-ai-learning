# Uncertainty Handling Logic

The agent must operate robustly even when signals are noisy or missing. We define specific heuristics to handle uncertainty.

## 1. Epistemic Uncertainty (Unknown Knowledge State)
*   **Scenario**: A new student with no history, or a student returning after a long break.
*   **Signal**: High variance in mastery estimates, or sparse data points.
*   **Strategy**: **Exploratory Probe**.
    *   Select `Review` action on random foundational topics to calibrate mastery.
    *   *Reasoning*: "I need to check your fundamentals before we move on."

## 2. Aleatoric Uncertainty (Noisy Performance)
*   **Scenario**: Student gets an easy question wrong (slip) or a hard question right (guess).
*   **Signal**: Inconsistent history `[Correct, Wrong, Correct, Wrong]`.
*   **Strategy**: **Confirmation Loop**.
    *   Do not `Advance` or demote immediately.
    *   Serve another item of similar difficulty to confirm the signal.

## 3. High Fatigue / Out-of-Distribution
*   **Scenario**: User behavior is erratic (very fast answers, random inputs).
*   **Signal**: $Fatigue \to 1$ or anomaly score > threshold.
*   **Strategy**: **Fail-Safe Rest**.
    *   Force `Rest` action or switch to "Passive Review" (reading/watching vs. solving).
    *   *Reasoning*: "You seem tired. Let's take a break to keep learning efficient."

## 4. Conflict Resolution
*   **Scenario**: "Engaged" signal says Continue, but "Fatigue" says Stop.
*   **Priority Rule**: **Safety First**.
    *   Health/Fatigue constraints override Engagement metrics.
    *   Retention (Stability) overrides Efficiency (Speed).
