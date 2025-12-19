# Pathway Agent Orchestration Logic

The **Pathway Agent** runs the main control loop. It is designed as a distinct service (or agent actor) that wakes up on every significant learner interaction.

## 1. The Decision Loop (Step-by-Step)

1.  **Trigger**: User finishes an item, or Session Start.
2.  **Context Assembly (Fetch)**:
    *   Query `AssessmentAgent` for diagnostics ($Mastery$).
    *   Query `ProfilingService` for preferences/history ($History$).
    *   Query `SessionStore` for realtime metrics ($Engagement$, $Time$).
3.  **State Construction**:
    *   Normalize inputs according to `state_normalization.md`.
    *   Build vector $S_t$.
4.  **Policy Query**:
    *   Send $S_t$ to the trained policy network (PPO Actor).
    *   **Rule Overlay**: Apply safety masks (e.g., mask `Advance` if prerequisites not met).
    *   Sample Action $a_t$ and Target $T_t$.
5.  **Output Generation**:
    *   Construct MCP Output JSON (`pathway_output.schema.json`).
    *   Attach `reasoning` string (e.g., "Reviewing X because stability is low").
6.  **Broadcast**:
    *   Send directives to `ContentAgent` (Load materials) and `TutorAgent` (Set context).

## 2. Pseudocode

```python
def run_decision_cycle(learner_id):
    # 1. Gather Context
    raw_context = mcp_hub.get_context(learner_id)
    
    # 2. Normalize
    state_vector = state_builder.build(raw_context)
    
    # 3. Policy Execution
    action_logits = policy_model.forward(state_vector)
    valid_mask = constraint_engine.get_mask(state_vector)
    final_action = sample_action(action_logits * valid_mask)
    
    # 4. Explain
    reasoning = explainer.generate(state_vector, final_action)
    
    # 5. Emit
    return PathwayOutput(
        action=final_action.type,
        target=final_action.target_id,
        reasoning=reasoning
    )
```
