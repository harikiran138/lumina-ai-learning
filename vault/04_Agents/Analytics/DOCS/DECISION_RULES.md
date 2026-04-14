# Decision Rules & Logic

The agent uses a probabilistic logic engine to determine when to act. This prevents "clippy-like" annoyance by ensuring actions are only taken when confidence is high and necessity is clear.

## 1. The Decision Matrix

| Condition | Logic | Action (MCP) |
| :--- | :--- | :--- |
| **Cognitive Overload** | `load > 0.85` AND `error_rate > 0.4` | `DIFFICULTY_ADJUSTMENT (Lower)` |
| **Boredom / Coasting** | `load < 0.3` AND `engagement > 0.8` AND `success > 0.9` | `DIFFICULTY_ADJUSTMENT (Increase)` |
| **Productive Struggle** | `load > 0.7` AND `engagement > 0.6` | **NONE** (Allow learning to happen) |
| **Dropout Risk** | `trend == declining` AND `last_seen > 48h` | `INTERVENTION_REQUIRED (Nudge)` |
| **Misconception** | `concept_error` repeated 3x | `MISCONCEPTION_SIGNAL (Tutor)` |

## 2. Confidence Thresholds

Every action has a computed confidence score.

-   **Threshold for Report**: `0.0` (Always log data)
-   **Threshold for Passive Suggestion**: `> 0.6` (e.g., Dashboard highlight)
-   **Threshold for Active Intervention**: `> 0.8` (e.g., Bot message)

## 3. Cooldowns & dampening

To prevent spamming:
1.  **Global Cooldown**: No two interventions within 5 minutes.
2.  **Type Cooldown**: No identical intervention within 24 hours.
3.  **Dampening**: If an intervention is ignored, reduce confidence for subsequent similar interventions.

## 4. MCP Message Structure

All decisions result in a structured message:

```json
{
  "type": "difficulty_adjustment",
  "direction": "decrease",
  "magnitude": 0.5,
  "reason": "Cognitive overload detected (Load=0.88)",
  "confidence": 0.92,
  "time_window": "immediate"
}
```
