# Pathway Agent Explainability Interface

This document defines the API and logic for generating human-readable explanations for agent decisions.

## 1. Objectives
*   **Transparency**: The user (or teacher) should always know *why* the agent changed the topic or suggested a break.
*   **Trust**: Explanations prevent the agent from feeling "random" or "broken".
*   **Debugging**: Developers need to trace bad decisions back to specific state variables.

## 2. Explanation Types

### **Type A: User-Facing (Simple)**
Short, encouraging messages shown in the UI toast or chat bubble.
*   **Template**: `[Action Verb] because [Context Trigger].`
*   *Examples*:
    *   "Let's **review** linear equations to make sure you remember them." (Retention Trigger)
    *   "You're doing great! Let's **move on** to something harder." (Mastery Trigger)
    *   "You've been working hard. Let's take a **breather**." (Fatigue Trigger)

### **Type B: Admin/Debug (Detailed)**
Full causal chain exposed in the admin dashboard.
*   **Format**: JSON structured data.
*   **Content**:
    *   `Primary Factor`: The state variable with the highest gradient/impact on the chosen action logic.
    *   `Counterfactual`: "If fatigue was 0.1 lower, I would have chosen 'Continue' instead of 'Rest'."

## 3. Explanation Generation Logic (Shapley Values)
To generate the detailed explanation, we use a lightweight feature attribution method (like SHAP or accumulated gradients) on the policy network.

1.  **Identify Top Features**: Which features pushed the Softmax probability of the chosen action up?
    *   Example: `Feature: TimeSinceLastReview(TopicA) = 48hrs` -> `Impact: +0.8` on `Action: Review`.
2.  **Map to Template**:
    *   `TimeSinceLastReview` -> "It's been a while since we saw..."
    *   `Fatigue` -> "Energy is getting low..."
    *   `Streak` -> "You are on a roll..."

## 4. API Endpoint

```http
GET /api/pathway/explain?decision_id={uuid}
```

**Response**:
```json
{
  "decision_id": "uuid-1234",
  "user_message": "Let's review Algebra to refresh your memory.",
  "admin_details": {
    "factor": "retention_decay",
    "score": 0.85,
    "confidence": "high"
  }
}
```
