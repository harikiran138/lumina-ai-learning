# Tutor & Content Integration (Phase 9.2)

The Pathway Agent acts as the "Director," while the **Tutor Agent** and **Content Agent** are the "Actors" who deliver the experience.

## 1. Directive Contract (To Tutor)
When the Pathway Agent makes a decision, it sends a directive to the Tutor.

*   **Directive**: `instruction.set_context`
*   **Payload**:
    ```json
    {
      "mode": "Socratic",
      "targetConcept": "math.geometry.triangles",
      "depth": "Deep",
      "pacing": "Slow",
      "goal": "RepairMisconception",
      "context": "Student is struggling with Isosceles vs Equilateral."
    }
    ```
*   **Impact**: Even if the content is the same, the Tutor (LLM) alters its tone and scaffolding strategy based on `pacing` and `goal` provided by Pathway.

## 2. Content Request (To Content Agent)
*   **Request**: `content.fetch_modules`
*   **Filter**:
    *   `concept`: Target Concept ID
    *   `difficulty`: Derived from current Mastery
    *   `format`: User Preference (Video vs Text)
*   **Logic**: Pathway Agent does *not* pick the specific video file. It says "I need 5 minutes of Intro level Linear Algebra". The Content Agent resolves this to a concrete asset.

## 3. Feedback Loop
*   Tutor reports `interaction.engagement_signal` (e.g., "Student is asking many clarifying questions") back to Pathway to adjust real-time $Engagement$ state.
