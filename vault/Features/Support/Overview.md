# Support Ecosystem: Overview

The **Support Ecosystem** connects students with their primary external motivators—Parents and Mentors—ensuring that learning progress is visible and supported outside the classroom.

## 🎯 Purpose
- **Holistic Visibility**: Providing parents with a real-time, non-technical view of student progress.
- **Motivational Alignment**: Enabling parents to set non-academic goals that complement schoolwork.
- **Pastoral Care**: Empowering mentors/counselors to intervene in student wellbeing and long-term academic health.
- **Retention Guardrails**: Automated weekly reporting that keeps the support network engaged with the student's journey.

## 📸 Student OCR Success Guide
To ensure the AI correctly reads student submissions, the following guidelines are published to the Support dashboard:

| Category | Guideline |
| :--- | :--- |
| **Ink** | Use **dark blue or black pen**. Pencil is often too light for the `0.70` threshold. |
| **Spacing** | Maintain at least **one blank line** between question answers. |
| **Labelling** | Prefix every answer clearly with **"Q1:"**, **"Q2:"**, etc. |
| **Diagrams** | Draw all diagrams inside a **boxed border** clearly separated from text. |
| **Capture** | Use natural lighting and hold the camera directly parallel to the paper. |

## 🏗 Key Components
- **Identity Linkage**:
  - `backend/app/routers/parent.py` (Parent-Student linking via unique codes).
  - `backend/app/routers/mentor.py` (Mentor assignment and session management).
- **Reporting Engine**: `backend/app/store/parent_store.py` (Generates weekly scannable reports).
- **Wellbeing Service**: `backend/app/routers/wellbeing.py` (Monitors stress and burnout signals).

### 🔗 Related Paths
- [[Features/Student/Backend|Student Dashboard Orchestration]]
- [[Features/Faculty/Backend|OCR Handwriting Digitization]]
- [[DECISION_FLOW|Parent-Student Link Generation Logic]]

---
[[START_HERE]] | [[Support/API]] | [[Support/Backend]] | [[Support/Frontend]] | [[Support/Flow]]
