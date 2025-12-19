# State Normalization Strategy

To ensure stable learning and decision-making, raw inputs must be normalized and sanitized before entering the policy network.

## 1. Normalization Rules

| Feature | Raw Range | Normalized Range | Method |
| :--- | :--- | :--- | :--- |
| **Probability/Confidence** | $[0, 1]$ | $[0, 1]$ | Identity (Pass-through) |
| **Stability (Days)** | $[0, \approx 365]$ | $[0, 1]$ | Log-scale: $x' = \tanh(x / 30)$ (saturates at ~1 month) |
| **Recency (Hours)** | $[0, \infty)$ | $[0, 1]$ | Exponential Decay: $x' = e^{-\lambda x}$ (Recency factor) |
| **Cognitive Load (Index)** | $[1, 10]$ | $[0, 1]$ | Min-Max: $(x - 1) / 9$ |
| **Session Time (Mins)** | $[0, 120]$ | $[0, 1]$ | Min-Max (Capped at 120): $\min(x, 120) / 120$ |
| **Fatigue** | $[0, 1]$ | $[0, 1]$ | Identity |

## 2. Handling Missing Data (Imputation)

The system must be robust to missing signals from the MCP context.

*   **Missing Mastery**: If a concept is new or has no history, assume **Confidence = 0.5** (Uncertain) and **Stability = 0**.
*   **Missing Engagement**: Assume **Engagement = 0.5** (Neutral) if real-time tracking is unavailable.
*   **Missing Fatigue**: Estimate based on session duration: $F \approx \min(1, t_{elapsed} / 90)$ (Assume linear fatigue over 90 mins).
*   **Missing History**: Pad the history vector with "Null" actions and "Neutral" outcomes.

## 3. Signal Smoothing

To prevent erratic switching behavior (jitter), continuous signals (Fatigue, Engagement) should be smoothed using an Exponential Moving Average (EMA).

$$ V_{smooth} = \alpha \cdot V_{new} + (1 - \alpha) \cdot V_{old} $$

*   Recommended $\alpha = 0.2$ for engagement (responsive but stable).
*   Recommended $\alpha = 0.05$ for mastery (slow changing).
