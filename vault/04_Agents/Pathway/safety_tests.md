# Pathway Agent Safety Tests (Phase 8.2)

Safety tests ensure the agent operates within defined ethical and operational boundaries, preventing harmful or unexpected behavior.

## 1. Safety Critical Constraints

### **Constraint A: Infinite Loop Prevention**
*   **Risk**: Agent gets stuck alternating between two actions (e.g., Review A <-> Review B) without progress.
*   **Test**: Initialize agent with a state that encourages reviewing A and B.
*   **Assertion**: Agent must detect cycle ($N > 3$ repetitions) and forcibly break it by selecting `Rest` or `Advance` (with overrides).

### **Constraint B: Over-Advancement Protection**
*   **Risk**: Agent advances a student to deep concepts without foundational mastery (e.g., skips prerequisites).
*   **Test**: Force high "Confidence" on a leaf node but low "Confidence" on its root dependencies.
*   **Assertion**: Agent must REFUSE to target the leaf node until root dependencies are satisfied ($P_{root} > 0.8$).

### **Constraint C: Assessment Abuse Prevention**
*   **Risk**: Agent triggers assessments too frequently, causing "Testing Fatigue".
*   **Test**: Feed a sequence of states where mastery is uncertain.
*   **Assertion**: Assessment frequency must not exceed 1 per $K$ learning items (e.g., 10 mins).

## 2. Adversarial Attacks
*   **Attack**: User inputs random noise or rapid-fire responses.
*   **Defense**: Agent enters "Safe Mode" (Rest/Pause) instead of making erratic curriculum decisions.

## 3. Implementation
These tests should be run as unit tests in the CI/CD pipeline using the policy constraints wrapper, distinct from the RL training loop.
