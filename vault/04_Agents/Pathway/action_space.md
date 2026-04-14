# Pathway Agent Action Space

The action space $A$ consists of four discrete high-level actions. At each time step $t$, the policy outputs $a_t \in A$.

## 1. Action: CONTINUE
**Description**: Stay on the current topic/concept, providing more material at the same difficulty level.
*   **Preconditions**: Current mastery is growing but not not yet saturated. Engagement is stable.
*   **Expected Outcome**: Incremental increase in mastery confidence.
*   **Risk Factors**: Diminishing returns if mastery is already high (over-learning/boredom).

## 2. Action: REVIEW
**Description**: Switch focus to a previously encountered concept with low stability or confidence.
*   **Preconditions**: forgetting curve threshold reached ($S_c < \text{threshold}$) or explicit error detected.
*   **Expected Outcome**: Large spike in stability ($S_c$), small increase in confidence ($P_c$). Refreshes long-term retention.
*   **Risk Factors**: Frustration if reviewing too frequently or reviewing material the user feels they already know.

## 3. Action: ADVANCE
**Description**: Move to the next node in the dependency graph (new concept or higher difficulty).
*   **Preconditions**: Prerequisites met ($P_{parent} > 0.85$). User shows signs of "flow" or ease.
*   **Expected Outcome**: New knowledge acquisition. Initial dip in confidence (new material is harder).
*   **Risk Factors**: "Churn" if prerequisites weren't actually solid. High cognitive load spike.

## 4. Action: REST
**Description**: Pause the intense learning interaction. Suggest a break, a gamified diversion, or a reflective summary.
*   **Preconditions**: High fatigue ($F_t > 0.8$) or significantly dropped efficiency.
*   **Expected Outcome**: Recovery of energy ($F_{t+1} < F_t$). Cognitive load reset.
*   **Risk Factors**: Breaking flow if triggered prematurely. User might end the session entirely.

## Parameterization
While the policy selects the *Category*, the *Parameters* (e.g., *which* concept to review) are often selected by deterministic heuristics or sub-policies:
*   $Action = (\text{Type}, \text{TargetID})$
