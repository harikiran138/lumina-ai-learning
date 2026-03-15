# Lumina AI LMS — Master Project Canvas

> **Author:** Chepuri Hari Kiran
> **Contact:** harikiran1388@gmail.com
> **Repository:** https://github.com/harikiran138/lumina-ai-learning
> **Last Updated:** March 2026
> **Purpose:** Single source of truth for any agent, developer, or contributor to understand the full project — what exists, how everything connects, and exactly where to add new features.

---

## How to Use This Document

Read this before touching any part of the codebase.

- **Section 1** — What Lumina is and the full folder map
- **Section 2** — Every backend API route (copy-paste ready)
- **Section 3** — Every AI agent: purpose, inputs, outputs, connections
- **Section 4** — All data models and how data flows between modules
- **Section 5** — Frontend: every page and what data it consumes
- **Section 6** — Environment variables (all of them)
- **Section 7** — Feature status matrix (✅ done / ⚠️ partial / ❌ missing)
- **Section 8** — How to add a new feature (step-by-step protocol)
- **Section 9** — Known gaps, misalignments, and technical debt
- **Section 10** — Deployment and infrastructure

---

## Section 1 — What Lumina Is & Full Folder Map

### What Lumina Is

Lumina is a **self-hosted AI-powered Learning Management System** for schools and educational institutions. It combines:

- A **multi-agent AI swarm** (6 specialized agents) that gives every student a personal AI tutor and every teacher a real-time intelligence layer
- **Adaptive assessment** that tracks concept mastery using Bayesian Knowledge Tracing (BKT)
- **Automated teaching workflows** (digests, remediation plans, inactivity alerts)
- **Handwriting analysis** (upload PDFs → AI transcription, scoring, feedback)
- **Privacy-first** architecture: self-hosted, local LLM support, FERPA/GDPR/COPPA compliant

### Full Folder Map

```
lumina-ai-learning/
│
├── backend/                          # Python FastAPI backend
│   ├── app/
│   │   ├── main.py                   # App startup, CORS, router registration
│   │   ├── dependencies.py           # Shared FastAPI dependencies (auth, db)
│   │   ├── seed.py                   # Seed data for dev
│   │   ├── worker.py                 # Celery worker entry point
│   │   │
│   │   ├── routers/                  # API route handlers (17 files)
│   │   │   ├── auth.py               # POST /register, POST /token, GET /me
│   │   │   ├── courses.py            # Full course CRUD + enrollment
│   │   │   ├── ai.py                 # Tutor chat, course gen, RAG, PPT gen
│   │   │   ├── assignments.py        # Submit, grade, view assignments
│   │   │   ├── student.py            # Student profile, progress, events
│   │   │   ├── teacher.py            # Teacher dashboard and grading queue
│   │   │   ├── admin.py              # Admin user management and logs
│   │   │   ├── handwriting.py        # Handwriting analyze + history
│   │   │   ├── handwriting_simple.py # Simplified handwriting route
│   │   │   ├── pathway.py            # Pathway recommendations
│   │   │   ├── personalization.py    # Learner profile CRUD
│   │   │   ├── community.py          # Messaging and community
│   │   │   ├── hybrid.py             # Hybrid AI routing
│   │   │   └── __init__.py
│   │   │
│   │   ├── assessment/               # Adaptive assessment engine
│   │   │   ├── api/router.py         # Assessment REST endpoints
│   │   │   ├── engine/               # Session + scoring engines
│   │   │   ├── llm/                  # LLM-based question generation
│   │   │   ├── models/               # Psychometric models (IRT scaffolding)
│   │   │   ├── question/             # Question bank management
│   │   │   └── eval/                 # Evaluation and grading
│   │   │
│   │   ├── pathway/                  # Learning pathway engine
│   │   │   ├── orchestrator.py       # Decision cycle, policy evaluation
│   │   │   ├── policy_engine.py      # Curriculum policies and constraints
│   │   │   ├── state_builder.py      # State enrichment from learner profile
│   │   │   ├── optimizer.py          # Curriculum optimization
│   │   │   ├── explainer.py          # Reasoning explanation for teacher UI
│   │   │   └── schemas.py            # PathwayInput/PathwayOutput DTOs
│   │   │
│   │   ├── personalization/          # Learner profile and KPI engine
│   │   │   ├── schemas.py            # LearnerProfileRecord, ConceptMastery
│   │   │   ├── explanation_planner.py # Strategy selection for explanations
│   │   │   ├── authenticity_engine.py # Academic integrity scoring
│   │   │   └── kpi_engine.py         # Engagement, mastery, growth KPIs
│   │   │
│   │   ├── automation/               # Background automation jobs
│   │   │   ├── jobs.py               # 4 core jobs (digest, remediation, alert)
│   │   │   ├── scheduler.py          # APScheduler integration
│   │   │   └── schemas.py            # Job data structures
│   │   │
│   │   ├── rag/                      # Retrieval-Augmented Generation
│   │   │   ├── retrieval.py          # ChromaDB vector retrieval
│   │   │   ├── vector_store.py       # Vector store initialization
│   │   │   ├── embeddings.py         # Embedding config
│   │   │   └── config.py             # RAG configuration
│   │   │
│   │   ├── core/                     # Cross-cutting concerns
│   │   │   ├── security.py           # JWT generation and verification
│   │   │   ├── logging.py            # Structured logging
│   │   │   ├── caching.py            # Redis caching layer
│   │   │   └── metrics.py            # Prometheus metrics
│   │   │
│   │   ├── database/                 # Database management
│   │   │   ├── supabase_manager.py   # Supabase client singleton
│   │   │   ├── manager.py            # Legacy Mongo manager (deprecated)
│   │   │   └── migrations/           # SQL migration files
│   │   │
│   │   ├── services/                 # Business logic services
│   │   └── store/                    # Data stores + JSON fallback
│   │       ├── course_store.py       # Courses CRUD + normalization
│   │       ├── user_store.py         # Users CRUD
│   │       ├── student_store.py      # Student dashboard and progress
│   │       ├── assignment_store.py   # Assignments and submissions
│   │       ├── personalization_store.py # Learner profile persistence
│   │       ├── tutor_memory_store.py # Tutor memory (Supabase + JSON fallback)
│   │       └── local_store.py        # Local JSON fallback (`backend/data`)
│   │
│   └── ai_engine/                    # AI/ML layer
│       ├── llm.py                    # LLM provider abstraction (Gemini/Ollama)
│       ├── rag.py                    # RAG orchestration
│       ├── prompts.py                # System prompts library
│       ├── skills.py                 # Skill management
│       ├── tutor_state.py            # Tutor session state management
│       ├── swarm/                    # Multi-agent swarm
│       │   ├── orchestrator.py       # Intent classification + agent routing
│       │   ├── tutor.py              # Tutor Agent (20KB)
│       │   ├── pathway.py            # Pathway Agent
│       │   ├── assessment.py         # Assessment Agent
│       │   ├── intervention.py       # Intervention Agent (skeletal)
│       │   ├── handwriting_agent.py  # Handwriting Agent
│       │   └── guardian.py           # Guardian Agent (skeletal)
│       ├── pathway/                  # Pathway inference engine
│       └── training/                 # ML training artifacts
│
├── frontend/
│   └── web/
│       ├── src/app/
│       │   ├── page.tsx              # Landing page
│       │   ├── layout.tsx            # Root layout
│       │   ├── login/                # Login page
│       │   ├── student/              # All student-facing pages
│       │   │   ├── dashboard/        # Student dashboard
│       │   │   ├── ai_tutor/         # AI tutor chat interface
│       │   │   ├── assessment/       # Quiz and assessment UI
│       │   │   ├── assignments/      # Assignment submission UI
│       │   │   ├── courses/          # Enrolled courses list
│       │   │   ├── course_explorer/  # Discover new courses
│       │   │   ├── lesson_page/      # Lesson content viewer
│       │   │   ├── handwriting/      # Handwriting upload UI
│       │   │   ├── progress/         # Progress tracker
│       │   │   ├── my_notes/         # Notes management
│       │   │   ├── profile/          # Student profile
│       │   │   ├── achievements/     # Badges and achievements
│       │   │   ├── community/        # Peer community
│       │   │   └── settings/         # Student settings
│       │   ├── teacher/              # All teacher-facing pages (12+ subdirs)
│       │   ├── admin/                # Admin panel (10+ subdirs)
│       │   └── dashboard/            # Generic dashboard
│       └── src/components/           # Shared UI components
│
├── docs/                             # Project documentation (50+ files)
│   ├── PROJECT_CANVAS.md             # ← This file (master reference)
│   ├── FEATURES_AND_PHASES.md        # Complete phase roadmap (Phases 0–7)
│   ├── ADVANCED_FEATURES_ROADMAP.md  # Feature evolution strategy
│   ├── AI_LMS_BLUEPRINT.md           # Product design specifications
│   ├── WORLD_CLASS_AI_LMS_STRATEGY.md # Strategic positioning
│   ├── FEATURE_AUDIT.md              # Current vs target feature audit
│   ├── AGENT_BUILD_BACKLOG.md        # Per-agent build backlog
│   ├── ARCHITECTURE.md               # System architecture deep-dive
│   └── DELIVERY_ROADMAP_AND_PHASES.md # Phase delivery timeline
│
├── Handwriting_Analysis_Project/     # Standalone handwriting module
│   ├── src/app/
│   │   ├── page.tsx                  # Upload UI + results display
│   │   └── api/
│   │       ├── analyze/route.ts      # POST /api/analyze (Gemini Vision)
│   │       └── history/route.ts      # GET /api/history (past analyses)
│   ├── ml_service/
│   │   ├── api/server.py             # FastAPI ML service (Port 9000)
│   │   ├── models/train_trocr.py     # TrOCR fine-tuning script
│   │   ├── logic/scoring.py          # QAScorer (semantic similarity)
│   │   └── data/download_datasets.py # Dataset downloader
│   └── prisma/schema.prisma          # SQLite schema (AnalysisResult)
│
├── Analytics-Agent/                  # Analytics and reporting agent
├── pathway agent/                    # Standalone pathway agent
├── skills/                           # Claude skills (17 directories)
├── data/                             # Data files and analytics
├── training/                         # ML training artifacts
├── scripts/                          # Build and utility scripts
│
├── docker-compose.yml                # Full stack Docker orchestration
├── Makefile                          # Build shortcuts
├── run_local.sh                      # Local startup script
├── start_backend.sh                  # Backend startup
├── start_frontend.sh                 # Frontend startup
├── prometheus.yml                    # Monitoring config
├── vercel.json                       # Vercel frontend deployment
├── package.json                      # Root npm config
├── README.md                         # Main project README
├── LOCAL_SETUP.md                    # Step-by-step local setup
├── DEPLOYMENT.md                     # Production deployment guide
├── API_KEY_SETUP.md                  # API key configuration guide
└── Lumina_IEEE_Research_Paper.docx   # IEEE research paper
```

---

## Section 2 — Every Backend API Route

**Base URL:** `http://localhost:8000/api`
**Auth header:** `Authorization: Bearer <JWT_TOKEN>`
All protected routes require valid JWT unless noted.

### Authentication (`/api/auth/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | None | Register new user. Body: `{email, password, full_name, role}` |
| POST | `/auth/token` | None | Login. Form: `username=email&password=...` → returns `{access_token, token_type}` |
| GET | `/auth/me` | Required | Current user profile |

### Courses (`/api/courses/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/courses/` | Required | List all available courses |
| GET | `/courses/{course_id}` | Required | Get full course with modules/lessons |
| POST | `/courses/` | Teacher | Create course (JSON body) |
| POST | `/courses/create` | Teacher | Create course (form data) |
| PATCH | `/courses/{course_id}` | Teacher | Update course details |
| DELETE | `/courses/{course_id}` | Teacher | Delete course |
| POST | `/courses/{course_id}/publish` | Teacher | Publish course |
| POST | `/courses/{course_id}/invite` | Teacher | Invite student to course |
| POST | `/courses/{course_id}/modules` | Teacher | Add module to course |
| PUT | `/courses/{course_id}/modules` | Teacher | Update all modules |
| DELETE | `/courses/{course_id}/modules/{module_id}` | Teacher | Delete module |
| POST | `/courses/{course_id}/modules/{module_id}/lessons` | Teacher | Add lesson |
| DELETE | `/courses/{course_id}/modules/{module_id}/lessons/{lesson_id}` | Teacher | Delete lesson |
| GET | `/courses/teacher/dashboard` | Teacher | Teacher dashboard stats |
| GET | `/courses/teacher/list` | Teacher | Teacher's own courses |
| GET | `/courses/teacher/students` | Teacher | Students in teacher's courses |

### AI / Tutor (`/api/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/chat` | Required | Main tutor chat. Body: `{message, user_id, session_id?, context_filters?: {context?, topic?, subject?, lesson?, assignment?}}` → `{response, personalization}` |
| POST | `/generate-course` | Teacher | Generate course from topic. Body: `{topic, grade_level?, num_modules?}` |
| POST | `/generate-course/assignment` | Teacher | Generate course from assignment description |
| POST | `/ingest-document` | Teacher | Ingest doc into RAG. Body: `{text, course_id, metadata?}` |
| POST | `/generate-ppt` | Teacher | Generate PPT from lesson. Body: `{lesson_id, course_id}` |
| GET | `/download-ppt/{filename}` | Teacher | Download generated PPTX file |
| POST | `/complete-lesson` | Student | Mark lesson complete. Body: `{lesson_id, course_id}` |

### Assessment (`/api/assessment/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/assessment/start` | Student | Start session. Body: `{student_id, topic, num_questions}` |
| GET | `/assessment/next-question/{session_id}` | Student | Get next question (adaptive) |
| POST | `/assessment/submit` | Student | Submit answer. Body: `{session_id, question_id, answer, time_taken, telemetry?}` |
| POST | `/assessment/complete/{session_id}` | Student | End session → report summary |
| GET | `/assessment/report/{session_id}` | Student | Full session report |
| GET | `/assessment/student/mastery` | Student | Mastery map for current user |

### Assignments (`/api/assignments/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/assignments/create` | Teacher | Create assignment (multipart form) |
| POST | `/assignments/submit` | Student | Submit assignment. Form: `{file, assignment_id}` |
| GET | `/assignments/list` | Any | List assignments (optional `course_id`, `student_id`) |
| GET | `/assignments/{assignment_id}/submissions` | Teacher | Submissions for assignment |
| POST | `/assignments/{assignment_id}/submissions/{submission_id}/grade` | Teacher | Trigger AI grading |
| PUT | `/assignments/{assignment_id}/submissions/{submission_id}/score` | Teacher | Update score/feedback |
| GET | `/assignments/{assignment_id}/analytics` | Teacher | Basic assignment analytics |
| GET | `/assignments/{assignment_id}/submissions/{submission_id}/report` | Teacher | Submission report |

### Handwriting (`/api/handwriting/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/handwriting/upload` | Student | Upload handwritten note or assignment |
| POST | `/handwriting/grade` | Teacher | Grade assignment in handwriting state store |
| GET | `/handwriting/list` | Any | List handwriting items (optional `type`) |

### Student (`/api/student/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/student/profile` | Student | Full learner profile |
| GET | `/student/dashboard` | Student | Dashboard: progress, streak, courses |
| GET | `/student/profile/analytics` | Student | Detailed progress and analytics |
| POST | `/student/quiz-result` | Student | Log quiz result |
| POST | `/student/enroll` | Student | Enroll in course |
| POST | `/student/complete-lesson` | Student | Mark lesson complete |
| POST | `/student/notes` | Student | Save note |
| GET | `/student/notes` | Student | List notes |
| POST | `/student/log-activity` | Student | Log learning activity |
| GET | `/student/badges` | Student | List badges |
| GET | `/student/certificates` | Student | List certificates |

### Teacher (`/api/teacher/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/teacher/dashboard/summary` | Teacher | Summary cards |
| GET | `/teacher/interventions/queue` | Teacher | Intervention queue |
| PATCH | `/teacher/interventions/{intervention_id}` | Teacher | Update intervention status |
| GET | `/teacher/heatmap/{course_id}` | Teacher | Class heatmap (scaffold) |

### Pathway (`/api/pathway/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/pathway/decision` | Student | Pathway recommendation output |

### Knowledge Graph (`/api/knowledge-graph/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/knowledge-graph/{course_id}` | Any | List knowledge nodes for a course |
| POST | `/knowledge-graph/{course_id}/nodes` | Teacher | Upsert knowledge nodes for a course |

### Personalization (`/api/personalization/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/personalization/profile` | Student | Current user profile |
| GET | `/personalization/profile/{user_id}` | Any | Fetch profile by user id |
| GET | `/personalization/interventions` | Teacher | Suggested interventions |
| GET | `/personalization/projection/tutor` | Student | Tutor-facing projection for current user |
| GET | `/personalization/projection/tutor/{user_id}` | Teacher | Tutor-facing projection for user |
| GET | `/personalization/projection/teacher/{user_id}` | Teacher | Teacher-facing projection for user |
| GET | `/personalization/projection/pathway` | Student | Pathway projection for current user |
| GET | `/personalization/projection/pathway/{user_id}` | Teacher | Pathway projection for user |

### Automation (`/api/automation/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/automation/jobs` | Teacher | List automation jobs |
| POST | `/automation/run/weekly-digest` | Teacher | Trigger weekly class digest |
| POST | `/automation/run/remediation` | Teacher | Generate remediation plan |
| POST | `/automation/run/inactivity-alert` | Teacher | Check for inactive students |
| POST | `/automation/run/progress-digest` | Teacher | Student progress digest |
| POST | `/automation/run/profile-refresh` | Teacher | Refresh KPI/risk signals for all profiles |

### Community (`/api/community/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/community/data` | Any | List channels + messages |
| POST | `/community/send` | Student | Send a community message |
| POST | `/community/messages` | Any | Post message |

### Admin (`/api/admin/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/users` | Admin | List all users |
| DELETE | `/admin/users/{user_id}` | Admin | Delete user |
| GET | `/admin/logs` | Admin | System logs |
| GET | `/admin/stats` | Admin | System statistics |

### System

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | None | Welcome message |
| GET | `/health` | None | Deep health check (Supabase, Redis, ChromaDB) |
| GET | `/metrics` | None | Prometheus metrics |

---

## Section 3 — AI Agent System (Full Contracts)

All agents live in `/backend/ai_engine/swarm/`. They are initialized by the Orchestrator and called via `process_input(user_input, context)`.

### Orchestrator (`orchestrator.py`)

**Purpose:** Routes all incoming AI requests to the correct specialist agent.

**Input:**
```python
{
  "user_input": str,         # Raw student or teacher message
  "context": {
    "course_id": str,
    "lesson_id": str,
    "student_id": str,
    "learner_profile": dict, # From /student/profile
    "session_id": str
  }
}
```

**Intent Classification:**
```
TUTORING     → TutorAgent
ASSESSMENT   → AssessmentAgent
PATHWAY      → PathwayAgent
HANDWRITING  → HandwritingAgent
SAFETY_CHECK → GuardianAgent
GENERAL      → TutorAgent (fallback)
```

**Output:**
```python
{
  "response": str,           # Agent's response text
  "intent": str,             # Classified intent
  "agent": str,              # Which agent handled it
  "metadata": dict           # Agent-specific extra data
}
```

**How to extend:** Add a new intent string and a new agent class. Register in `orchestrator.py`'s routing map.

---

### Tutor Agent (`tutor.py`)

**Purpose:** Primary student-facing AI tutor. RAG-powered, subject-aware, learner-profile-aware.

**Key Functions:**
- `infer_subject_mode(user_query, topic, context_filters)` → `math | science | coding | language | general`
- `_detect_request_mode(user_query)` → `timeline | comparison | quiz | summary | explain`
- `generate_response(...)` → A2UI JSON response with calibration prompt + subject mode metadata

**RAG Integration:** `backend/app/rag/retrieval.py` → ChromaDB (hybrid search)

**Explanation Planner Integration:** Reads learner profile → `personalization/explanation_planner.py` → selects strategy (visual, step-by-step, Socratic, etc.)

**LLM Provider:** `backend/ai_engine/llm.py` — abstracts Gemini vs Ollama

**Persistent Tutor Memory:** `backend/app/store/tutor_memory_store.py` (Supabase conversations when available, local JSON fallback)

**Session Memory (avoid repeats):** `backend/ai_engine/tutor_state.py`

**System Prompt:** `backend/ai_engine/prompts.py` → `A2UI_SYSTEM_PROMPT`

**Output format (A2UI v2):**
```python
{
  "meta": {
    "topic": "Topic Name",
    "difficulty": "easy|medium|hard",
    "estimated_time_min": 5,
    "exportable": false,
    "subject_mode": "math|science|coding|language|general"
  },
  "flow": [
    {"type": "concept", "title": "...", "summary": "...", "key_points": ["..."]},
    {"type": "steps", "title": "...", "steps": ["..."]},
    {"type": "reflection", "prompt": "...", "placeholder": "..."}
  ]
}
```

---

### Pathway Agent (`pathway.py` + `app/pathway/`)

**Purpose:** Generates personalized learning sequences and recommends next topics.

**Pipeline:**
```
User state → state_builder.py (enrich from learner profile)
           → policy_engine.py (apply curriculum constraints)
           → optimizer.py (select optimal next step)
           → explainer.py (generate teacher-readable reasoning)
           → PathwayOutput
```

**Key Schemas (`app/pathway/schemas.py`):**
```python
class PathwayInput:
    user_id: str
    current_topic: str
    mastery_map: dict[str, float]   # concept_id → 0.0–1.0
    completed_topics: list[str]
    course_id: str

class PathwayOutput:
    next_topic: str
    reasoning: str
    confidence: float
    alternative_topics: list[str]
```

**BKT Integration:** Reads from `assessment/mastery/{user_id}` endpoint output

**Where to add DKT:** `optimizer.py` — replace BKT mastery scores with DKT trajectory predictions

---

### Assessment Agent (`assessment.py` + `app/assessment/`)

**Purpose:** Drives adaptive quiz sessions using knowledge tracing.

**Session Flow:**
```
start_session()
  → generate first question (difficulty = default or from mastery map)
  → receive answer
  → update mastery probability (BKT)
  → select next question (harder if correct, easier if wrong)
  → repeat until session end condition
  → generate session report + remediation plan
```

**Key Endpoints consumed by agent:**
- Reads learner mastery: `GET /assessment/mastery/{user_id}`
- Writes mastery updates: internal via assessment engine
- Generates remediation: inline remediation plan (assessment engine) and optional automation job

**Question Generation:** `app/assessment/llm/` — uses Gemini to generate questions from topic + difficulty

**Where mastery updates go:** Assessment events update the unified learner profile via `PersonalizationService`.

---

### Intervention Agent (`intervention.py`)

**Status: OPERATIONAL — backed by learner profile signals**

**Purpose:** Detects at-risk students and generates teacher action recommendations.

**Pipeline (implemented via `PersonalizationService` + intervention queue):**
```
Learner profile signals:
  - cognitive_load
  - weak_topics
  - recent_average_score
  - engagement_summary
  → risk_classifier() → "low" | "medium" | "high" | "critical"
  → action_generator() → recommended teacher message + next step
  → confidence_scorer()
  → InterventionRecommendation (written to DB)
```

**Target Output Schema:**
```python
{
  "student_id": str,
  "course_id": str,
  "topic": str,
  "problem_type": "misconception|inactivity|low_score|disengagement",
  "evidence": str,
  "recommended_action": str,
  "confidence": float,           # 0.0–1.0
  "urgency": "low|medium|high",
  "suggested_message": str       # Draft message for teacher to send
}
```

**Where to build it:** `swarm/intervention.py` → reads from `learner_profiles` table → writes to `intervention_recommendations` table

---

### Handwriting Agent (`handwriting_agent.py`)

**Purpose:** Processes uploaded handwritten PDF documents.

**Full Pipeline:**
```
PDF upload (multipart form)
  → Tesseract OCR (local text extraction)
  → Gemini 1.5 Flash Vision (transcription + score + feedback)
  → SentenceTransformers (semantic answer comparison if answer_key provided)
  → HandwritingResult saved to DB
  → Response: {transcribedText, score, feedback, similarity_score?}
```

**Also available:** Standalone `Handwriting_Analysis_Project/` with its own Next.js + FastAPI ML service using TrOCR

**Integration into main pipeline (Phase 5):**
- Connect `POST /handwriting/upload` result → assignment submission grading pipeline
- Store results in Supabase `submission_scorecards` table alongside other grades

---

### Guardian Agent (`guardian.py`)

**Status: SKELETAL — needs real implementation**

**Purpose:** Parent/guardian-facing summaries and escalation.

**Intended Pipeline:**
```
Weekly trigger (APScheduler)
  → fetch student progress from learner_profiles
  → fetch recent assessment results
  → fetch any intervention flags
  → generate parent-friendly summary (no jargon)
  → send via notification channel (email/in-app)
```

**Where to build it:** `swarm/guardian.py` → reads `learner_profiles` + `intervention_recommendations` → writes to `guardian_notifications` table (to be created)

---

## Section 4 — Data Models & Data Flow

### Primary Database Tables (Supabase PostgreSQL)

#### `users`
```sql
id UUID PK, email TEXT UNIQUE, name TEXT,
role TEXT CHECK (role IN ('student','teacher','admin')),
hashed_password TEXT, created_at TIMESTAMPTZ
```

#### `courses`
```sql
id UUID PK, title TEXT, description TEXT, teacher_id UUID FK(users),
subject TEXT, grade_level TEXT, is_published BOOLEAN,
modules JSONB, created_at TIMESTAMPTZ
```
- `modules` is a JSONB array: `[{id, title, lessons: [{id, title, content, order}]}]`

#### `enrollments`
```sql
id UUID PK, student_id UUID FK(users), course_id UUID FK(courses),
enrolled_at TIMESTAMPTZ, progress JSONB
```

#### `learner_profiles`
```sql
user_id UUID PK FK(users), role TEXT, grade_level TEXT,
goals JSONB, preferences JSONB,
mastery_state JSONB,        -- concept_id → float (0.0–1.0)
weak_topics JSONB,          -- list of topic strings
behavior_signals JSONB,     -- 50+ behavioral signals
engagement_summary JSONB,   -- engagement KPIs
performance_summary JSONB,  -- performance KPIs
risk_summary JSONB,         -- risk level + evidence
tutor_summary JSONB,        -- tutor interaction history
assignment_summary JSONB,   -- assignment performance
assessment_summary JSONB,   -- assessment session history
metadata JSONB,
created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
```

#### `learning_events`
```sql
id UUID PK, user_id UUID FK(users), event_type TEXT,
source TEXT, course_id UUID, topic_id TEXT, session_id TEXT,
payload JSONB, created_at TIMESTAMPTZ
```
`event_type` values: `lesson_complete | quiz_result | assignment_submit | tutor_interaction | login | note_saved`

#### `assessment_sessions`
```sql
id UUID PK, user_id UUID FK(users), course_id UUID, topic_id TEXT,
status TEXT, questions JSONB, answers JSONB,
mastery_before JSONB, mastery_after JSONB,
report JSONB, created_at TIMESTAMPTZ, completed_at TIMESTAMPTZ
```

#### `assignment_submissions`
```sql
id UUID PK, student_id UUID FK(users), course_id UUID,
assignment_id TEXT, file_path TEXT, extracted_text TEXT,
grade FLOAT, feedback TEXT, graded_at TIMESTAMPTZ,
created_at TIMESTAMPTZ
```

#### `assignment_rubrics`
```sql
assignment_id TEXT PK, title TEXT, criteria JSONB, version INT,
metadata JSONB, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
```

#### `submission_scorecards`
```sql
submission_id UUID PK FK(assignment_submissions),
overall_score FLOAT, confidence FLOAT, review_required BOOLEAN,
rubric_scores JSONB, rationale TEXT,
created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
```

#### `intervention_recommendations`
```sql
id UUID PK, user_id UUID FK(users), course_id UUID,
topic_id TEXT, priority TEXT, status TEXT,
recommended_action TEXT, reason TEXT, confidence FLOAT,
evidence JSONB, created_by TEXT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
```

#### `automation_job_logs`
```sql
id UUID PK, job_name TEXT, triggered_by TEXT, status TEXT,
input JSONB, output JSONB, error TEXT,
started_at TIMESTAMPTZ, completed_at TIMESTAMPTZ
```

### Vector Store (ChromaDB)

**Path:** `CHROMA_DB_PATH` (env var, default `./chroma_db`)

**Collections:**
- `course_content` — lesson text and course materials, chunked and embedded
- `assessment_questions` — question bank embeddings

**Usage:** Every tutor response queries ChromaDB first to retrieve relevant course content context before calling the LLM.

### Local JSON Fallback Stores

When Supabase is unavailable, the system falls back to:
- `backend/app/store/courses/` — course JSON files
- `backend/app/store/users/` — user JSON files
- `backend/app/store/students/` — student JSON files
- `backend/app/store/assignments/` — assignment JSON files
- `personalization_store.json` — learner preferences (root level)

### Data Flow Diagram

```
STUDENT ACTION
    │
    ▼
[Frontend]  →  POST /student/activity-log  →  [learning_events table]
                                                      │
                                                      ▼
                                            [Personalization service]
                                            updates learner_profiles
                                                      │
                                          ┌───────────┴───────────┐
                                          ▼                       ▼
                                   [Tutor Agent]          [Pathway Agent]
                                   reads mastery_state    reads mastery_state
                                   + weak_topics          + completed_topics
                                          │                       │
                                          ▼                       ▼
                                   RAG retrieval          Next topic selection
                                   + LLM response         + policy constraints
                                          │
                                          ▼
                                   [Assessment Agent]
                                   writes mastery_after
                                   back to learner_profiles
                                          │
                                          ▼
                                   [Intervention Agent]  ← reads risk_summary
                                   writes to             ← from learner_profiles
                                   intervention_recommendations
                                          │
                                          ▼
                               [Teacher Dashboard]
                               reads intervention_recommendations
                               + risk badges per student
```

---

## Section 5 — Frontend Pages & Data Consumed

### Student Pages (`/student/`)

| Page | Route | Data Source | Key APIs Called |
|------|-------|-------------|-----------------|
| Dashboard | `/student/dashboard` | Student profile, courses, progress | `GET /student/dashboard` |
| AI Tutor | `/student/ai_tutor` | Course context, session | `POST /chat` |
| Assessment | `/student/assessment` | Session state, questions | `POST /assessment/session/start`, `/submit` |
| Assignments | `/student/assignments` | Submissions, grades | `GET /assignments/list?student_id=...`, `POST /assignments/submit` |
| Courses | `/student/courses` | Enrolled courses | `GET /courses/`, `GET /courses/list` |
| Course Explorer | `/student/course_explorer` | All published courses | `GET /courses/`, `GET /courses/list` |
| Lesson | `/student/lesson_page` | Lesson content | `GET /courses/{id}`, `POST /student/complete-lesson` |
| Handwriting | `/student/handwriting` | Upload result | `POST /handwriting/upload`, `GET /handwriting/list?type=...` |
| Progress | `/student/progress` | Mastery, completions | `GET /student/profile/analytics`, `GET /assessment/student/mastery` |
| Notes | `/student/my_notes` | Saved notes | `GET /student/notes`, `POST /student/notes` |
| Profile | `/student/profile` | Learner profile | `GET /student/profile` |
| Achievements | `/student/achievements` | Badges, streak | `GET /student/badges`, `GET /student/dashboard` |
| Community | `/student/community` | Messages | `GET /community/data`, `POST /community/send` |

### Teacher Pages (`/teacher/`)

| Page | Key APIs Called |
|------|----------------|
| Dashboard | `GET /courses/teacher/dashboard`, `GET /teacher/dashboard/summary` |
| My Courses | `GET /courses/teacher/list` |
| Course Editor | `POST /courses/`, `PATCH /courses/{id}`, module/lesson CRUD |
| Students | `GET /courses/teacher/students` |
| Grading Queue | `GET /assignments/list`, `GET /assignments/{id}/submissions` |
| AI Generator | `POST /ai/generate-course`, `POST /ai/tutor/generate-ppt` |
| Automation | `GET /api/automation/jobs`, `POST /api/automation/run/*` |

### Admin Pages (`/admin/`)

| Page | Key APIs Called |
|------|----------------|
| Users | `GET /admin/users`, `DELETE /admin/users/{id}` |
| Logs | `GET /admin/logs/ai`, `GET /admin/logs/chat` |
| Stats | `GET /admin/dashboard`, `GET /admin/students-progress` |
| Health | `GET /health` |

---

## Section 6 — Environment Variables (Complete)

Create a `.env` file in the project root with these values:

```bash
# ── DATABASE ───────────────────────────────────────────────────
DATABASE_URL=postgresql://postgres:<password>@<host>:5432/postgres
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>  # For admin operations
REDIS_URL=redis://localhost:6379
CHROMA_DB_PATH=./chroma_db
LUMINA_FORCE_LOCAL_STORE=false                 # Use local JSON fallback for dev/tests
MONGODB_URI=mongodb://localhost:27017/lumina   # Legacy, optional (docker only)

# ── AI PROVIDERS ───────────────────────────────────────────────
GEMINI_API_KEY=<your_gemini_api_key>           # Google AI Studio
AI_API_KEY=<same_as_gemini_or_other>
OLLAMA_HOST=http://host.docker.internal:11434  # Local LLM (optional)
OLLAMA_MODEL=qwen2.5:1.5b                     # Default local model

# ── AUTHENTICATION ─────────────────────────────────────────────
SECRET_KEY=<random_64_char_string>             # JWT signing key
ACCESS_TOKEN_EXPIRE_MINUTES=11520              # 8 days default

# ── APPLICATION ────────────────────────────────────────────────
API_V1_STR=/api
FRONTEND_URL=http://localhost:3000             # For CORS
DOMAIN_NAME=localhost                          # For CORS
NEXT_PUBLIC_API_URL=http://localhost:8000      # Frontend -> backend

# ── MONITORING ─────────────────────────────────────────────────
SENTRY_DSN=<optional>                          # Error tracking

# ── HANDWRITING MODULE (standalone) ───────────────────────────
DATABASE_URL=file:./dev.db                     # SQLite for standalone module
GEMINI_API_KEY=<same_key>
```

---

## Section 7 — Feature Status Matrix

### Core Platform

| Feature | Status | File(s) | Notes |
|---------|--------|---------|-------|
| JWT Auth | ✅ Done | `routers/auth.py`, `core/security.py` | 8-day token expiry |
| Role-based routing | ✅ Done | `dependencies.py` | student / teacher / admin |
| Course CRUD | ✅ Done | `routers/courses.py` | Full module/lesson hierarchy |
| Student dashboard | ✅ Done | `routers/student.py`, frontend | Progress, streak, badges |
| Teacher dashboard | ✅ Done | `routers/teacher.py` | Roster, grading queue |
| Admin panel | ✅ Done | `routers/admin.py` | User mgmt, logs |
| Community messaging | ✅ Done | `routers/community.py` | Basic routes |
| Health check | ✅ Done | `main.py` | Checks all services |
| Prometheus metrics | ✅ Done | `core/metrics.py` | `/metrics` endpoint |
| Docker deployment | ✅ Done | `docker-compose.yml` | Full stack |
| Fallback JSON stores | ✅ Done | `app/store/` | Offline-capable |

### AI & Tutor

| Feature | Status | File(s) | Notes |
|---------|--------|---------|-------|
| AI tutor (RAG + LLM) | ✅ Done | `swarm/tutor.py`, `ai_engine/rag.py` | Gemini + Ollama |
| LLM provider abstraction | ✅ Done | `ai_engine/llm.py` | Swap Gemini ↔ Ollama |
| Orchestrator routing | ✅ Done | `swarm/orchestrator.py` | Intent-based routing |
| RAG document ingestion | ✅ Done | `routers/ai.py`, `app/rag/` | ChromaDB |
| AI course generation | ✅ Done | `routers/ai.py` | Topic → full course |
| AI PPT generation | ✅ Done | `routers/ai.py` | Lesson → PPTX |
| Explanation planner | ✅ Done | `personalization/explanation_planner.py` | Strategy selection |
| Tutor session memory | ✅ Done | `ai_engine/tutor_state.py`, `app/store/tutor_memory_store.py` | Session history + cross-session memory |
| Subject tutor modes | ✅ Done | `swarm/tutor.py` | Math/Science/Coding/Language prompt specialization |

### Assessment

| Feature | Status | File(s) | Notes |
|---------|--------|---------|-------|
| Adaptive session management | ✅ Done | `app/assessment/api/router.py` | Start, submit, complete |
| BKT mastery tracking | ✅ Done | `app/assessment/engine/` | Per-topic probabilities |
| LLM question generation | ✅ Done | `app/assessment/llm/` | Gemini-generated questions |
| Session reports | ✅ Done | Assessment router | Score, weak topics |
| Mastery → learner profile sync | ✅ Done | `assessment/engine/session_manager.py` | Assessment events now update learner profiles |
| Concept graph linking | ✅ Done | `assessment/models/`, `knowledge-graph` | Questions carry concept metadata |
| IRT scoring | ✅ Done | `assessment/engine/irt.py` | Ability updates per response |
| Misconception detection | ✅ Done | `personalization_service.py` | Aggregated from wrong-answer patterns |

### Pathway

| Feature | Status | File(s) | Notes |
|---------|--------|---------|-------|
| Next topic recommendation | ✅ Done | `app/pathway/orchestrator.py` | Basic BKT-aware routing |
| Policy constraints | ✅ Done | `app/pathway/policy_engine.py` | Curriculum boundaries |
| Pathway explanation | ✅ Done | `app/pathway/explainer.py` | Teacher-readable reasoning |
| Full BKT integration | ⚠️ Partial | `swarm/pathway.py` | Reads mastery but not full BKT loop |
| DKT trajectory prediction | ❌ Missing | — | Phase 2 |
| RL pathway optimization | ❌ Missing | — | Phase 2 |
| Spaced repetition | ❌ Missing | — | Phase 2 |

### Grading & Assignments

| Feature | Status | File(s) | Notes |
|---------|--------|---------|-------|
| Assignment submission | ✅ Done | `routers/assignments.py` | File upload |
| Tesseract OCR extraction | ✅ Done | `routers/assignments.py` | Text from uploaded files |
| AI semantic grading | ✅ Done | Gemini + sentence-transformers | Score + feedback |
| Rubric-aware grading | ✅ Done | `assignment_rubrics`, `worker.py` | Rubrics applied when present |
| Confidence scoring | ✅ Done | `submission_scorecards` | Always populated during grading |
| Teacher review/override | ⚠️ Partial | `teacher/grading-queue` | UI exists; override flow incomplete |
| Handwriting grading (main pipeline) | ❌ Missing | — | Phase 5 integration needed |

### Handwriting Module

| Feature | Status | File(s) | Notes |
|---------|--------|---------|-------|
| PDF upload + Gemini analysis | ✅ Done | `routers/handwriting.py`, `swarm/handwriting_agent.py` | Score + transcription |
| Analysis history | ✅ Done | Supabase / SQLite | Both main and standalone |
| Standalone Next.js module | ✅ Done | `Handwriting_Analysis_Project/` | Full standalone app |
| TrOCR local ML service | ✅ Done | `Handwriting_Analysis_Project/ml_service/` | Port 9000 |
| Semantic answer scoring | ✅ Done | `ml_service/logic/scoring.py` | sentence-transformers |
| Integration into main pipeline | ❌ Missing | — | Phase 5 |
| Multi-page PDF | ❌ Missing | — | Planned |

### Automation

| Feature | Status | File(s) | Notes |
|---------|--------|---------|-------|
| Weekly class digest | ✅ Done | `automation/jobs.py` | Teacher gets class summary |
| Student progress digest | ✅ Done | `automation/jobs.py` | Weekly per-student summary |
| Post-assessment remediation | ✅ Done | `automation/jobs.py` | Auto-generated plan |
| Inactivity alerts | ✅ Done | `automation/jobs.py` | 3+ day dormancy detection |
| Pre-class PPT generation | ❌ Missing | — | Phase 6 |
| Guardian weekly summary | ❌ Missing | — | Phase 6 |
| Mentor follow-up reminder | ❌ Missing | — | Phase 6 |

### Personalization

| Feature | Status | File(s) | Notes |
|---------|--------|---------|-------|
| Learner profile schema | ✅ Done | `personalization/schemas.py` | Full schema |
| KPI calculation | ✅ Done | `personalization/kpi_engine.py` | Engagement, mastery, growth |
| Explanation strategy planner | ✅ Done | `personalization/explanation_planner.py` | Visual/step-by-step/Socratic |
| Authenticity scoring | ✅ Done | `personalization/authenticity_engine.py` | Academic integrity |
| Unified profile (single source) | ✅ Done | `learner_profiles` table | Events update profile in real time |
| Behavior signal collection | ✅ Done | `learning_events` | Cognitive load + KPIs computed |
| Risk level detection | ✅ Done | `personalization_service.py` | Drives intervention queue |

---

## Section 8 — How to Add a New Feature

Follow this protocol for any new feature addition to avoid breaking existing connections.

### Step 1 — Identify the Layer

Decide which layer(s) your feature touches:

| Layer | Location | Description |
|-------|----------|-------------|
| **Data model** | `backend/app/database/migrations/` | New table or column |
| **Business logic** | `backend/app/services/` or `app/<module>/` | Core processing |
| **API endpoint** | `backend/app/routers/` | New REST route |
| **AI agent** | `backend/ai_engine/swarm/` | New or updated agent behavior |
| **Automation job** | `backend/app/automation/jobs.py` | New recurring job |
| **Frontend page** | `frontend/web/src/app/` | New UI page |
| **Frontend component** | `frontend/web/src/components/` | Reusable UI component |
| **Documentation** | `docs/` | Update this file + `FEATURES_AND_PHASES.md` |

### Step 2 — Data Model (if needed)

1. Write SQL migration in `backend/app/database/migrations/`
2. Apply via Supabase dashboard or `supabase db push`
3. Add Pydantic schema in relevant module's `schemas.py`
4. Update this document's Section 4

### Step 3 — Business Logic

1. Add service function in `backend/app/services/` or the relevant module
2. Keep it pure (no HTTP concerns — those go in routers)
3. Add fallback for when Supabase is unavailable

### Step 4 — API Route

1. Add route in the relevant `backend/app/routers/<name>.py`
2. Register it in `backend/app/main.py` if it's a new router file
3. Add to this document's Section 2 route table
4. Add to `hoppscotch-collection.json` for API testing

### Step 5 — AI Agent Change (if needed)

1. If adding a **new intent**, add it to `orchestrator.py`'s routing map
2. If modifying an **existing agent**, update its `process_input()` method
3. If adding a **new agent**, create `swarm/<name>.py`, implement `process_input(user_input, context)`, register in orchestrator
4. Update Section 3 of this document

### Step 6 — Frontend

1. Create page in `frontend/web/src/app/<role>/<feature>/page.tsx`
2. Use existing API client pattern from nearby pages
3. Add navigation link in the relevant sidebar/menu component
4. Update Section 5 of this document

### Step 7 — Update Docs

After implementing, update:
- This file (`PROJECT_CANVAS.md`) — Sections 2, 4, 5, 7 as relevant
- `docs/FEATURES_AND_PHASES.md` — Move feature from ❌ to ✅

---

## Section 9 — Known Gaps, Misalignments & Technical Debt

### Critical Gaps (Block Phase 1 Milestone)

| Gap | Impact | Fix Location |
|-----|--------|-------------|
| Supabase learner profile schema not migrated to include Phase 1 fields | Profile upserts can fail on hosted DB until migration applied | Apply `backend/app/database/sql/001_personal_lms_foundation.sql` |

### Schema Misalignments

No remaining schema mismatches observed after Phase 1 updates, assuming the latest
`001_personal_lms_foundation.sql` migration is applied.

### Row-Level Security (RLS) Gaps

These tables need RLS policies in Supabase to be production-safe:
- `learner_profiles` — students should only read their own
- `assessment_sessions` — students should only read their own
- `assignment_submissions` — students see own; teachers see their course's
- `intervention_recommendations` — only teachers should read
- `automation_job_logs` — only teachers/admins

### Test Coverage Gaps

Core tests exist under `backend/tests/`, but coverage is still uneven.
Before Phase 1 milestone, add:
- Unit tests for `assessment/engine/` mastery calculations
- Integration tests for `POST /api/tutor/chat` → tutor response
- Integration tests for `POST /api/assessment/start` → complete flow
- Contract tests for learner profile read/write

### Dead Code / Legacy

- `MongoDB` is still referenced in docker-compose for legacy paths; not required for core flows
- `tutor_state (1).py` in `ai_engine/` is a duplicate; use `tutor_state.py`
- `handwriting_simple.py` router appears to duplicate `handwriting.py`

---

## Section 10 — Deployment & Infrastructure

### Local Development

```bash
# 1. Clone and set up environment
git clone https://github.com/harikiran138/lumina-ai-learning.git
cd lumina-ai-learning
cp .env.example .env              # Fill in all env vars

# 2. Start full stack
./run_local.sh

# OR start individually:
./start_backend.sh               # FastAPI on :8000
./start_frontend.sh              # Next.js on :3000

# Optional local JSON fallback (skip Supabase)
export LUMINA_FORCE_LOCAL_STORE=true

# Frontend API base (if backend is not on :8000)
export NEXT_PUBLIC_API_URL=http://localhost:8000

# 3. Standalone handwriting module
cd Handwriting_Analysis_Project
npm install
npx prisma migrate dev --name init
npm run dev                      # :3000
cd ml_service
pip install -r requirements.txt
uvicorn api.server:app --reload --host 0.0.0.0 --port 9000
```

### Docker (Full Stack)

```bash
docker-compose up --build
```

Services started:
| Service | Port | Description |
|---------|------|-------------|
| postgres | 5432 | PostgreSQL 16 |
| redis | 6379 | Redis 7 (caching, queues) |
| mongodb | 27017 | MongoDB (legacy) |
| backend | 8000 | FastAPI backend |
| celery | — | Async task worker |
| frontend | 3000 | Next.js web app |

### Production Deployment

- **Frontend:** Vercel (`vercel.json` config present)
- **Backend:** AWS ECS, GCP Cloud Run, or any Docker host
- **Database:** Supabase managed (recommended) or self-hosted PostgreSQL
- **Vector store:** ChromaDB on persistent volume
- **LLM:** Gemini API (production) or Ollama on GPU server (private)

### Monitoring

- Prometheus metrics: `GET /metrics`
- Grafana dashboard: connect to Prometheus (manual setup)
- Sentry error tracking: set `SENTRY_DSN` env var
- Health endpoint: `GET /health` — checks Supabase, Redis, ChromaDB

---

## Appendix — Related Documentation Files

| File | Purpose |
|------|---------|
| `docs/FEATURES_AND_PHASES.md` | Phase-by-phase roadmap (Phases 0–7), acceptance criteria |
| `docs/ADVANCED_FEATURES_ROADMAP.md` | Feature evolution from MVP to world-class |
| `docs/AI_LMS_BLUEPRINT.md` | Product object design (student profile, teacher alert, course intelligence) |
| `docs/WORLD_CLASS_AI_LMS_STRATEGY.md` | Strategic positioning vs Canvas, Khanmigo, Duolingo |
| `docs/ARCHITECTURE.md` | Deep-dive system architecture |
| `docs/AGENT_BUILD_BACKLOG.md` | Per-agent build backlog |
| `docs/DELIVERY_ROADMAP_AND_PHASES.md` | Phase timeline and milestones |
| `docs/FEATURE_AUDIT.md` | Current vs target feature comparison |
| `README.md` | Project overview and quick start |
| `LOCAL_SETUP.md` | Step-by-step local development setup |
| `DEPLOYMENT.md` | Production deployment instructions |
| `API_KEY_SETUP.md` | How to get and configure all API keys |
| `hoppscotch-collection.json` | Import into Hoppscotch to test all API routes |
| `Lumina_IEEE_Research_Paper.docx` | Academic paper (BKT, DKT, MCP architecture) |

---

*This document is the master reference for Lumina.*
*Update it every time you add an API route, new agent, database table, or feature.*
*Contact: harikiran1388@gmail.com | Repo: https://github.com/harikiran138/lumina-ai-learning*
