# DATA_FLOW

## 📝 Scenario: AI-Assisted Assessment Grading

This flow describes how a student submission is processed, graded by AI, and verified by a teacher.

```mermaid
sequenceDiagram
    participant S as Student
    participant B as Backend (FastAPI)
    participant D as Database (Supabase)
    participant A as AI Tutor Agent
    participant F as Faculty (Teacher)

    S->>B: Post Submission (Text/Image)
    B->>D: Store Raw Submission
    B->>A: Trigger Grading Pipeline
    A->>A: RAG Scan + Knowledge Graph Check
    A->>B: Return Suggested Grade + Feedback
    B->>D: Store in `teacher_verified_queue` (is_verified = false)
    F->>B: Fetch Verification Queue
    F->>B: Approve/Adjust Grade
    B->>D: Update Submission (is_verified = true)
    B->>S: Notify Result
```

## 🔄 Scenario: Student Onboarding & BKT Initialization
1. Student registers via **Clerk/Supabase Auth**.
2. **Onboarding Webhook** triggers backend logic.
3. System initializes **Bayesian Knowledge Tracing (BKT)** parameters for the student.
4. **Learning Pathway Agent** generates the first week's content recommendations.

---
[[PROJECT_OVERVIEW]] | [[SYSTEM_ARCHITECTURE]] | [[MODULE_MAP]]
