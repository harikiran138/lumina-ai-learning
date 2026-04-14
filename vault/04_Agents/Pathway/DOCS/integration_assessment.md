# Assessment Agent Integration (Phase 9.1)

The Pathway Agent relies on the **Assessment Agent** for the "Ground Truth" of learner mastery. The relationship is Consumer-Provider.

## 1. Input Contract (Consumption)
The Pathway Agent subscribes to the `AssessmentUpdate` event stream.

*   **Event**: `assessment.completed`
*   **Payload**:
    ```json
    {
      "learnerId": "123",
      "conceptId": "math.algebra",
      "newMastery": 0.85,
      "delta": +0.05,
      "confidence": 0.9,
      "diagnostics": ["weakness_in_negative_signs"]
    }
    ```
*   **Action**: Update internal State Vector $S_t$. If `newMastery` crosses a threshold (e.g., 0.8 -> 0.9), trigger an immediate `Advance` decision evaluation.

## 2. Output Contract (Request)
The Pathway Agent can *request* specific assessments when uncertainty is high.

*   **Request**: `assessment.request_probe`
*   **Payload**:
    ```json
    {
      "targetConcept": "math.algebra",
      "reason": "VerifyRetention",
      "minReliability": 0.8
    }
    ```
*   **Condition**: Triggered when the Policy outputs `Action=Review` but `Confidence` is also Low (Epistemic Uncertainty). "I think they know this, but I'm not sure. Double check."

## 3. Latency & Fallbacks
*   **Async Nature**: Assessment results are not instantaneous. The Pathway Agent must continue making decisions (e.g., "Continue Practice") while waiting for the Assessment Agent to grade a complex task.
*   **Optimistic Updates**: assume success until proven otherwise for high-performing students.
