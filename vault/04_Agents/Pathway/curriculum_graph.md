# Curriculum Graph Structure

The **Curriculum Graph** $G = (V, E)$ is the foundational map of knowledge.

## 1. Nodes ($V$): Concepts
Each node represents a distinct learning unit or concept.
*   **Properties**:
    *   `id`: Unique identifier (e.g., `math.algebra.linear_eq`).
    *   `difficulty`: Intrinsic difficulty $[0, 1]$.
    *   `granularity`: Level in the hierarchy (Topic, Subtopic, Leaf Concept).
    *   `vector_embedding`: Semantic usage for similarity search.

## 2. Edges ($E$): Dependencies
Directed edges represent prerequisites.
*   $A \to B$: Concept A must be mastered before Concept B.
*   **Edge Types**:
    *   **Hard Constraint (Blocking)**: $B$ is impossible without $A$.
    *   **Soft Constraint (Helper)**: $A$ helps $B$, but is not strictly required.
    *   **Related (Undirected)**: $A$ and $B$ strongly overlap (reinforce each other).

## 3. Weighted Graph Definition
The graph is weighted to support pathfinding algorithms.
*   **Cost($A \to B$)**: A function of:
    *   Difficulty delta ($Diff_B - Diff_A$).
    *   Semantic distance.
    *   Estimated time to master $B$ given $A$.

This structure allows the optimizer to find lowest-cost traversal paths (shortest path to goal).
