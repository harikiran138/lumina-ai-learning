# Agent Boundary Contract

This document defines the operational boundaries and contracts between the **Pathway Agent** and the rest of the **Lumina** ecosystem.

## 1. What the Pathway Agent Can Request

The Pathway Agent is authorized to request the following from other system components:

*   **From Assessment Agent**:
    *   Real-time mastery updates.
    *   Diagnostic probes (e.g., "Check understanding of concept X").
*   **From Content Agent**:
    *   Availability of learning modules for specific concepts.
    *   Estimated time to complete specific modules.
*   **From User Profile**:
    *   Learning goals, time constraints, and preferences.

## 2. What the Pathway Agent Cannot Override

The Pathway Agent operates within strict constraints to ensure safety and user autonomy:

*   **User Explicit Commands**: If a user explicitly selects a topic or mode (e.g., "I want to study Algebra now"), the agent must adapt its path to accommodate this, rather than blocking it.
*   **Safety Constraints**: The agent cannot force a user to continue if "Fatigue" metrics exceed critical safety thresholds. It must suggest "Rest".
*   **Platform Limits**: The agent cannot schedule actions outside of the user's allowed usage hours or subscription limits.

## 3. Enforcement Rules

To ensure system stability and predictability:

*   **Schema Validation**: All inputs and outputs must strictly adhere to the defined MCP JSON Schemas (`pathway_input.schema.json`, `pathway_output.schema.json`).
*   **Action Space Invariance**: The agent may only output actions defined in the allowed Action Space (`continue`, `review`, `advance`, `rest`). Unknown actions will cause a system error fallback.
*   **Stateless Execution**: The agent should perform as a stateless function of its input context. It should not rely on hidden local state that is not persisted in the shared context/database.
