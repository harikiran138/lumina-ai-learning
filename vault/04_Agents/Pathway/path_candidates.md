# Quantum-Inspired Path Optimization

Before a user starts, we generate **Near-Optimal Learning Paths** offline. This reduces real-time computation and ensures pedagogical soundness.

## 1. The Optimization Problem
**Traveling Scholar Problem**: Find a sequence of concepts $\pi = [c_1, c_2, ..., c_n]$ that covers the syllabus while minimizing:
*   Total Estimated Time.
*   Cognitive Jump Costs (Difficulty spikes).
*   Prerequisite violations (must be 0).

## 2. Algorithm: Simulated Annealing (SA) / QUBO
We model the problem as a constraint satisfaction problem solvable by SA or Quantum-Inspired techniques (e.g., Fujitsu DA, D-Wave heuristics).

*   **State**: A permutation of concepts.
*   **Energy Function ($E$)**:
    $$ E(\pi) = \sum_{i} Cost(c_i, c_{i+1}) + \lambda \cdot Violations(\pi) $$
*   **Process**:
    1.  Start with a topological sort (valid initial path).
    2.  Perturb path (swap non-dependent nodes).
    3.  Accept if energy lowers or with probability $e^{-\Delta E / T}$.
    4.  Cool down $T$.

## 3. Candidate Paths Table
We store top $k$ distinct paths for different learner types:

| Path ID | Persona Tag | Features | Sequence |
| :--- | :--- | :--- | :--- |
| `path_001` | `linear_standard` | Minimized jumps, steady slope | `[A, B, C, D, ...]` |
| `path_002` | `spiral_review` | Frequent interleaving (A, B, A, C) | `[A, B, A', C, B', ...]` |
| `path_003` | `challenge_first` | Front-loads hard topics | `[C, A, B, D, ...]` |

The Pathway Agent selects a base path from this table at initialization.
