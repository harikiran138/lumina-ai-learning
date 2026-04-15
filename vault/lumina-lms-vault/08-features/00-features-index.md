# Features Index

> **File:** `08-features/00-features-index.md`
> **Related:** [[01-architecture/02-component-map]]
> **Last Updated:** 2026-04-15

All Lumina features with implementation status and the roles that interact with each.

---

## Feature Status Legend

- ✅ Implemented
- ⚠️ Partially implemented (stub replaced with real logic)
- 🔲 Planned — not yet implemented

## Feature Table

| Feature | File | Status | Roles |
|---|---|---|---|
| Course Management (CRUD) | [[08-features/01-course-management]] | ✅ | Teacher |
| AI Course Builder | [[08-features/02-ai-course-builder]] | ✅ | Teacher |
| Learner Dashboard | [[08-features/03-learner-dashboard]] | ✅ | Student |
| AI Tutor (TILA Queue) | [[08-features/04-ai-tutor]] | ✅ | Student, Teacher, Faculty, HOD |
| Assessments & Quizzes | [[08-features/05-assessments-quizzes]] | ✅ | Student, Teacher |
| Analytics & Reporting | [[08-features/06-analytics-reporting]] | ✅ | Teacher, Faculty, HOD, IA |
| Authentication & Auth | [[06-auth/01-auth-overview]] | ✅ | All |
| Role Hierarchy (11 roles) | [[02-roles/00-roles-index]] | ✅ | All |
| FSRS v5 Spaced Repetition | [[08-features/05-assessments-quizzes]] | ✅ | Student, Teacher |
| BKT+DKT Knowledge Tracing | [[03-agents/04-curriculum-agent]] | ✅ | Student (transparent), Teacher |
| PPO Pathway Agent | [[03-agents/04-curriculum-agent]] | ✅ | Student (transparent), Teacher |
| TrOCR Handwriting Pipeline | [[03-agents/03-grading-agent]] | ✅ | Student, Teacher |
| XGBoost Dropout Prediction | [[03-agents/05-reporting-agent]] | ✅ | Teacher, Faculty, HOD |
| Hybrid RAG | [[01-architecture/01-system-architecture]] | ✅ | System (internal) |
| Community Board | [[08-features/01-course-management]] | ✅ | Student, Teacher, Peer Tutor |
| Attendance Analytics | [[08-features/06-analytics-reporting]] | ✅ | Teacher, Student, Parent |
| MLFD Video Analysis | [[08-features/02-ai-course-builder]] | ✅ | Teacher |
| Parent Portal | [[02-roles/04-content-author]] | ✅ | Parent |
| Researcher Portal | [[02-roles/04-content-author]] | ✅ | Researcher |
| Counselor Portal | [[02-roles/04-content-author]] | ✅ | Counselor |
