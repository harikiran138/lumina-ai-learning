# Component Map

> **File:** `01-architecture/02-component-map.md`
> **Related:** [[01-architecture/01-system-architecture]], [[08-features/00-features-index]]
> **Last Updated:** 2026-04-15

Every module in Lumina, what it does, and how it connects to other modules.

---

## Frontend Modules

| Module | Path | Role dashboards | Connects to |
|---|---|---|---|
| Auth pages | `/app/(auth)/` | All | Backend `/api/auth` |
| Student Dashboard | `/app/student/` | Student | Backend `/api/student` |
| Teacher Dashboard | `/app/teacher/` | Teacher, Faculty | Backend `/api/teacher` |
| HOD Dashboard | `/app/hod/` | HOD | Backend `/api/hod` |
| Admin Dashboard | `/app/admin/` | IA, SA | Backend `/api/admin` |
| AI Answer Queue UI | `/app/teacher/queue/` | Teacher, Faculty, HOD | Backend `/api/queue`, Supabase realtime |
| Flashcard Player | `/app/student/flashcards/` | Student | Backend `/api/flashcards` |
| Community Board | `/app/community/` | Student, Teacher, Faculty | Backend `/api/community` |
| Attendance Panel | `/app/attendance/` | Teacher, Student | Backend `/api/attendance` |
| Dropout Dashboard | `/app/analytics/dropout/` | Teacher, Faculty, HOD | Backend `/api/dropout` |
| MLFD Video Analysis | `/app/teacher/mlfd/` | Teacher | Backend `/api/mlfd` |
| Parent Portal | `/app/parent/` | Parent | Backend `/api/parent` |
| Researcher Portal | `/app/researcher/` | Researcher | Backend `/api/researcher` |
| Profile Pages | `/app/profile/` | All | Backend `/api/profile` |

## Backend Modules (FastAPI Routers)

| Router | Prefix | Primary responsibility |
|---|---|---|
| auth | `/api/auth` | Login, logout, token refresh, JWT issuance |
| courses | `/api/courses` | Course CRUD, module/lesson management |
| queue | `/api/queue` | AI Answer Queue — submit, approve, reject, escalate |
| flashcards | `/api/flashcards` | FSRS v5 card scheduling and review sessions |
| attendance | `/api/attendance` | QR-based attendance, manual entry, analytics |
| assessments | `/api/assessments` | Quiz submission, grading, TrOCR handwriting |
| community | `/api/community` | Posts, replies, upvotes, anonymous posting |
| dropout | `/api/dropout` | XGBoost prediction, SHAP scores, alert dispatch |
| mlfd | `/api/mlfd` | Video upload, frame analysis, engagement reports |
| analytics | `/api/analytics` | Cohort reports, knowledge trace dashboard |
| admin | `/api/admin` | User management, bulk import, institution config |
| parent | `/api/parent` | Child progress view, attendance summary |
| researcher | `/api/researcher` | k-anonymised export endpoints |
| profile | `/api/profile` | Profile read/update for all roles |

## AI Engine Modules

| Module | Technology | Triggered by |
|---|---|---|
| Tutor agent | Claude Sonnet 4.6 + LangGraph | Student submits question via `/api/queue` |
| Guardian agent | Claude Haiku 4.5 + LangGraph | Every agent output (runs last in graph) |
| Assessment agent | Gemini 1.5 Flash + LangGraph | Teacher requests quiz/assignment generation |
| Pathway agent | PyTorch PPO model | After every student quiz submission |
| TrOCR pipeline | `trocr-large-handwritten` | Handwritten assignment upload |
| BKT+DKT pipeline | scikit-learn + LSTM | After every quiz submission |
| Dropout pipeline | XGBoost + SHAP | Weekly cron job |
| FAISS indexer | sentence-transformers + FAISS | Course content publish event |
| Neo4j graph | Neo4j Python driver | Course KC mapping updates |
| FSRS scheduler | Pure Python | Student completes flashcard review |

## Data Store Usage by Module

| Module | PostgreSQL | Redis | MinIO | FAISS | Neo4j |
|---|---|---|---|---|---|
| Auth | ✅ (users, sessions) | ✅ (JWT cache, rate-limit) | — | — | — |
| Courses | ✅ | — | ✅ (PDFs, videos) | ✅ (embeddings) | ✅ (KC graph) |
| AI Queue | ✅ (queue table) | ✅ (count cache) | — | — | — |
| Flashcards | ✅ (FSRS state) | — | — | — | — |
| Attendance | ✅ | — | — | — | — |
| Assessments | ✅ | — | ✅ (submissions) | — | — |
| Community | ✅ | — | ✅ (attachments) | — | — |
| Dropout | ✅ (features, predictions) | — | — | — | — |
| MLFD | ✅ (analysis results) | — | ✅ (video files) | — | — |
| Parent | ✅ (read-only views) | — | — | — | — |
| Researcher | ✅ (anonymised views) | — | — | — | — |
