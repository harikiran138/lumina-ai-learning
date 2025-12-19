# Decision Authority

## Core Responsibility
The **Pathway Agent** is the sole authority for **selecting the learner’s next best action**. It orchestrates the learning journey by analyzing context and issuing directives to other agents (Content, Tutor, Assessment).

## Allowed Actions
The agent chooses one of the following high-level actions at each decision point:

1.  **Continue**: Proceed with the current learning module or topic.
    *   *Conditions*: Engagement is high, mastery is accumulating steadily.
2.  **Review**: Revisit previous concepts to reinforce weak areas.
    *   *Conditions*: Low mastery confidence, forgetting curve threshold triggered, or explicit learner request.
3.  **Advance**: Move to the next concept or higher difficulty level.
    *   *Conditions*: High mastery confidence, stable performance, "boredom" signals (e.g., answering too quickly).
4.  **Rest**: Suggest a break or a low-cognitive-load activity.
    *   *Conditions*: High fatigue, low energy, efficiency drop, or specific pattern triggers (e.g., "The Frustration Spiral").

## Pattern-Driven Adaptations

The agent's decision logic is augmented by **Behavioral Patterns** (see `behavioral_patterns.md`). These patterns can tint or override the standard decision matrix:

*   **Engagement Patterns**:
    *   *Flow State* detected → **Force "Continue"** (Suppress interruptions).
    *   *Boredom Loop* detected → **Force "Advance"** (Spike difficulty).
    *   *Frustration Spiral* detected → **Force "Rest"** or **"Review"** (Eject to safety).
*   **Learning Styles**:
    *   *Visual Learner* → Biases content selection towards video/diagram modules.
    *   *Deep Diver* → Biases selection towards "Enrichment" paths.
*   **Temporal Patterns**:
    *   *Night Owl* → Shifts "Review" heaviness to late-night sessions.
    *   *Weekend Warrior* → Compresses "Review" queues into weekend blocks.

## Boundaries & Prohibitions

### 🚫 No Content Generation
The Pathway Agent **never** generates learning material, explanations, or questions. It delegates this to the **Content Agent** or **Tutor Agent**. It only specifies *what* to teach (Target Concept), not *how*.

### 🚫 No Grading
The Pathway Agent **does not** score answers or evaluate correctness. It consumes valid signals from the **Assessment Agent**. It trusts the diagnostic data provided to it.

### 🚫 No Direct User Interface
The Pathway Agent acts as a backend logic engine. It does not render UI or speak directly to the user. It sends signals that the UI layer translates into user-facing prompts.
