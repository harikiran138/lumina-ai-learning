# Decision Flows

The Lumina documentation system is not just a static map; it is a description of how the system "thinks" and reacts to changes in learner and institutional data.

## 🧠 Core Cross-System Decisions

### 1. The Intervention Trigger (Student → AI → Faculty)
**Condition**: A student's mastery in a critical topic falls below 45%.
1. **AI Detection**: The `classifier.py` or background analyzer identifies the gap.
2. **Action**: Metadata is updated, and a `REVIEW` signal is generated.
3. **Notify Faculty**: An entry appears in the Faculty "At-Risk" dashboard ([teacher.py:L131](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/routers/teacher.py#L131)).
4. **Log Governance**: The intervention and its outcome are logged for HOD review.
- → [[Features/AI/Flow]] | [[Features/Faculty/Backend]]

### 2. The Adaptive Difficulty Shift (Student → AI)
**Condition**: Student answers 3 consecutive questions correctly under 15 seconds each.
1. **Analysis**: AI identifies "Low Cognitive Load" state.
2. **Shift**: Increases the `fsrs_engine` difficulty parameter for the next set of cards.
3. **Feedback**: Student UI displays a "Level Up" signal.
- → [[Features/Student/Backend]] | [[Features/AI/Backend]]

### 3. The OCR Grading Confidence (Faculty → Governance)
**Condition**: Handwritten assignment OCR returns a confidence level < 0.70.
1. **Detection**: `ocr_service.py` flags the image node.
2. **Action**: AI Grading is paused; the submission is routed to a "Manual Review" queue.
3. **Intervention**: Teacher manually corrects the text before the AI Grader generates the marks.
- → [[Features/Faculty/Flow]]

---

## 🏗 Decision Logic Index

| Trigger | System Reaction | Key Logic File |
| :--- | :--- | :--- |
| **Login Failure** | Sentinel L5 Lockout | `auth.py` |
| **New Course Enroll** | Populate Progress JSON | `student_store.py` |
| **Mastery Drop** | Notify Faculty | `teacher.py` |
| **Token Expiry** | Automatic Refresh | `useAuthStore.ts` |

---
[[START_HERE]] | [[SYSTEM_MAP]] | [[USE_CASES]]
