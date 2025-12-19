# Evaluation Framework — Lumina Analytics Agent

## 1. Core Metrics

We evaluate the agent across five dimensions to ensure research-grade reliability.

| Dimension | Metric | Definition | Success Threshold |
| :--- | :--- | :--- | :--- |
| **Engagement** | **Latency-Correlation** | Correlation between `engagement_score` and time-to-next-interaction. | `r > 0.6` |
| **Cognitive** | **Load Accuracy** | Accuracy of classifying `high_load` vs `optimal` against labeled session data. | `acc > 85%` |
| **Knowledge** | **RMSE (Mastery)** | Root Mean Square Error of BKT predictions vs actual next-step results. | `RMSE < 0.3` |
| **Prediction** | **Recall@24h** | Percentage of dropouts predicted 24 hours in advance. | `Recall > 70%` |
| **System** | **Inference Latency** | Time to process one 30s batch window. | `< 50ms` |

## 2. Testing Scenarios

We utilize a comprehensive test suite (`tests/` and `simulation.py`) covering:

### A. The "Flow State" Scenario
*Input:* Regular intervals, moderate velocity, correct answers.
*Expected Output:* `engagement > 0.8`, `cognitive_load = optimal`, `MCP = None`.

### B. The "Productive Struggle" Scenario
*Input:* Variable velocity, pauses (thinking), incorrect answers, eventual success.
*Expected Output:* `engagement > 0.6`, `loading = high`, `MCP = None` (Allow struggle).

### C. The "Frustration/Dropout" Scenario
*Input:* Erratic velocity, rapid errors, rage-clicks, sudden exit.
*Expected Output:* `engagement < 0.4`, `risk > 0.7`, `MCP = INTERVENTION`.

## 3. Validation Strategy (Prototype Phase)

Since this is a research prototype without live user traffic, validation relies on:

1.  **Synthetic Stress Testing:** Running 100+ randomized sessions via `simulation.py`.
2.  **Expert Review:** Learning Scientists reviewing the `docs/MASTER_PROMPT.md` logic.
3.  **Unit Regression:** Ensuring `test_integration.py` passes on every commit.
