# Runtime Adaptation Strategy

The offline "Candidate Path" is just a prior. The Pathway Agent deviates from it in real-time based on the user's actual performance.

## 1. Divergence Logic
The agent follows the `Candidate Path` **unless**:

1.  **Blockage**: The learner fails to master the current step $c_i$.
    *   *Adaptation*: Insert remedial nodes or prerequisite refreshers ($c_{remedial}$) before retrying $c_i$.
    *   *Action*: `Insert(Review Subtree)`
2.  **Accelerator**: The learner masters $c_i$ instantly (Pre-knowledge).
    *   *Adaptation*: Skip $c_{i+1}$ if it is highly correlated or trivial given the performance.
    *   *Action*: `Skip(NextNode)`
3.  **Fatigue/Interest Shift**: The learner is bored or requests a change.
    *   *Adaptation*: Switch branches in the graph to a different topic (Lateral Move).

## 2. Re-Routing Frequency
We do **not** re-run the full combinatorial optimization every step.
*   **Local Repair**: Look-ahead 1-3 steps for minor adjustments (Greedy).
*   **Global Re-plan**: Triggered only if the learner diverges by $> 20\%$ from the original plan or fails 3 consecutive critical concepts.

## 3. Divergence Log
We track *why* the path changed to improve future offline generation.
*   `DIVERGENCE_EVENT`: { timestamp, planned_node, actual_node, reason="remedial_loop" }
