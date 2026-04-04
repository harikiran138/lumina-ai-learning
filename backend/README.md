# Lumina Backend

FastAPI application powering the Lumina AI Learning Platform. Built with Python 3.11, fully async, and structured around institution-scoped data access and role-based authorization.

---

## Prerequisites

| Requirement | Version |
|---|---|
| Python | 3.11+ |
| pip / venv | standard library |
| Supabase project | PostgreSQL database with RLS enabled |
| OpenRouter API key | for LLM routing (required) |
| Gemini API key | optional fallback LLM |
| Redis | optional — for caching and task queues |

---

## Setup and Installation

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create and activate a virtual environment
python3.11 -m venv .venv
source .venv/bin/activate         # macOS / Linux
# .venv\Scripts\activate          # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Copy and configure environment variables
cp .env.example .env
# Edit .env with your Supabase credentials, API keys, and JWT secret
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | Yes | Supabase project URL (`https://<project>.supabase.co`) |
| `SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public key — used for client-level RLS-enforced queries |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key — bypasses RLS for privileged backend operations (migrations, admin) |
| `OPENROUTER_API_KEY` | Yes | OpenRouter API key for LLM routing (Claude Haiku / Claude Sonnet) |
| `GEMINI_API_KEY` | No | Google Gemini API key used as LLM fallback |
| `JWT_SECRET` | Yes | Long random string used to sign and verify JWT tokens |
| `REDIS_URL` | No | Redis connection URL (default: `redis://localhost:6379/0`) |

---

## Running the Backend

### Development (with hot reload)

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

### Production

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Docker

```bash
docker build -t lumina-backend .
docker run -p 8000:8000 --env-file .env lumina-backend
```

Once running:
- **API base**: http://localhost:8000
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## Project Structure

```
backend/
├── app/
│   ├── main.py               # FastAPI app instantiation, router registration,
│   │                         # CORS configuration, middleware
│   ├── dependencies.py       # Role-based dependency guards:
│   │                         # is_student, is_faculty, is_admin, is_hod,
│   │                         # is_counselor, is_parent, is_mentor, ...
│   ├── core/                 # Application configuration and settings
│   │   ├── config.py         # Pydantic Settings — reads from .env
│   │   └── security.py       # JWT creation, verification, cookie helpers
│   ├── database/             # Supabase client and query helpers
│   │   ├── client.py         # Async Supabase client singleton
│   │   └── scoped.py         # institution_id scoping helper for all queries
│   ├── routers/              # One module per domain — see API Endpoints below
│   │   ├── auth.py
│   │   ├── admin.py
│   │   ├── faculty.py
│   │   ├── hod.py
│   │   ├── student.py
│   │   ├── counselor.py
│   │   ├── parent.py
│   │   ├── mentor.py
│   │   ├── peer_tutor.py
│   │   ├── alumni.py
│   │   ├── researcher.py
│   │   ├── content_creator.py
│   │   ├── content_designer.py
│   │   ├── courses.py
│   │   ├── assignments.py
│   │   ├── attendance.py
│   │   ├── ai_queue.py
│   │   ├── ai_tutor.py
│   │   ├── community.py
│   │   ├── flashcards.py
│   │   ├── knowledge_graph.py
│   │   ├── pathway.py
│   │   ├── personalization.py
│   │   ├── handwriting.py
│   │   ├── generation.py
│   │   ├── notifications.py
│   │   ├── realtime.py
│   │   ├── academic.py
│   │   ├── gamification.py
│   │   └── ...               # additional supporting routers
│   ├── services/             # Business logic layer (stateless service functions)
│   │   ├── assessment.py     # Assessment session management and auto-grading
│   │   ├── evaluation.py     # Answer evaluation pipelines
│   │   ├── grading.py        # Assignment and submission grading
│   │   └── ...
│   ├── store/                # Data access layer (direct Supabase queries)
│   │   ├── analytics_store.py
│   │   ├── config_store.py
│   │   └── ...
│   ├── rag/                  # Hybrid RAG pipeline
│   │   ├── faiss_index.py    # FAISS dense retrieval
│   │   ├── bm25_retriever.py # BM25 sparse retrieval
│   │   ├── neo4j_graph.py    # Neo4j knowledge graph queries
│   │   └── rrf.py            # Reciprocal Rank Fusion
│   ├── personalization/      # Learner modeling
│   │   ├── bkt.py            # Bayesian Knowledge Tracing
│   │   ├── dkt.py            # Deep Knowledge Tracing (LSTM)
│   │   └── learner_profile.py
│   ├── pathway/              # Adaptive learning pathway engine
│   │   └── engine.py
│   ├── ml_services/          # Machine learning inference services
│   │   ├── dropout.py        # XGBoost dropout risk prediction
│   │   └── shap_explainer.py # SHAP feature explanations
│   └── ai_engine/            # LLM orchestration
│       ├── router.py         # OpenRouter provider selection (Haiku/Sonnet)
│       └── guardian.py       # AI Guardian agent for queue management
├── requirements.txt
├── Dockerfile
├── railway.toml              # Railway deployment configuration
└── pytest.ini
```

---

## API Endpoints by Domain

### Authentication and Onboarding
| Router | Description |
|---|---|
| `auth` | Register, login, logout, token refresh, password reset |
| `onboarding` | Multi-step onboarding flow for new users |

### Role Portals
| Router | Description |
|---|---|
| `admin` | Platform administration, user management, AI model configuration, system health |
| `faculty` | Course management, student oversight, grading, AI assistant |
| `hod` | Department analytics, faculty oversight, curriculum approval |
| `student` | Student profile, dashboard, progress summary |
| `counselor` | At-risk student list, intervention records, referrals |
| `parent` | Child progress read access |
| `mentor` | Mentoring session scheduling and management |
| `peer_tutor` | Peer tutoring request and session management |
| `alumni` | Career resources, mentoring enrollment |
| `researcher` | Aggregated analytics data access |
| `content_creator` | Course content authoring endpoints |
| `content_designer` | Design tool integration |

### Academic Core
| Router | Description |
|---|---|
| `courses` | Course CRUD, enrollment, lesson and unit management |
| `assignments` | Assignment creation, student submission, grading |
| `attendance` | Attendance recording, reporting, and analytics |
| `assessment` | Quiz/exam session management, auto-grading, result retrieval |
| `academic` | Academic records, grades, transcripts |

### AI and Learning
| Router | Description |
|---|---|
| `ai_queue` | Teacher-Verified AI Queue — list, approve, edit-approve, reject, escalate |
| `ai_tutor` | AI Tutor conversation endpoints (multi-turn, per course) |
| `generation` | AI content generation — questions, summaries, explanations |
| `handwriting` | TrOCR handwriting OCR submission and evaluation |
| `flashcards` | Deck and card CRUD, FSRS v5 scheduling |
| `knowledge_graph` | Concept graph queries and traversal |
| `pathway` | Adaptive learning pathway generation and updates |
| `personalization` | Learner profile, BKT/DKT mastery state retrieval |

### Platform Features
| Router | Description |
|---|---|
| `community` | Course forum posts, replies, threading |
| `gamification` | Points, badges, leaderboard events |
| `notifications` | User notification creation and read management |
| `realtime` | WebSocket endpoints for real-time updates |

---

## Auth System

Lumina uses **JWT tokens** delivered via **HTTP-only cookies** for session management.

**Flow:**
1. On login, the backend issues a signed JWT containing `user_id`, `role`, and `institution_id`.
2. The token is set as an HTTP-only cookie (not accessible from JavaScript).
3. Every subsequent request carries the cookie automatically.
4. The backend validates and decodes the JWT on every protected route using `dependencies.py`.

**Role Guards (`app/dependencies.py`):**

Each role has a corresponding `Depends()` guard function:

```python
async def get_current_user(request: Request) -> User: ...
async def is_student(user: User = Depends(get_current_user)) -> User: ...
async def is_faculty(user: User = Depends(get_current_user)) -> User: ...
async def is_admin(user: User = Depends(get_current_user)) -> User: ...
async def is_hod(user: User = Depends(get_current_user)) -> User: ...
async def is_counselor(user: User = Depends(get_current_user)) -> User: ...
# ... and so on for all roles
```

Routes declare their required role as a dependency:

```python
@router.get("/my-courses")
async def get_my_courses(user: User = Depends(is_student)):
    ...
```

**Supabase Row Level Security:**

All database tables have RLS policies that enforce `institution_id` scoping. The backend uses the service role key for privileged operations (seeding, migrations) and the anonymous key (with the user's JWT context) for user-facing queries, ensuring RLS is always active for application traffic.

---

## Teacher-Verified AI Queue

The `ai_answer_queue` table is the enforcement point for Lumina's core safety guarantee: no AI-generated answer reaches a student without faculty approval.

### Table Schema (key columns)

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `student_id` | UUID | The student who asked the question |
| `course_id` | UUID | The course context |
| `question` | text | The student's original question |
| `ai_answer` | text | The LLM-generated candidate answer |
| `status` | enum | `pending` / `approved` / `edited_approved` / `rejected` / `escalated` |
| `faculty_note` | text | Optional faculty annotation or correction |
| `reviewed_by` | UUID | Faculty member who acted on the item |
| `reviewed_at` | timestamptz | Timestamp of the review action |
| `institution_id` | UUID | Institution scope (RLS key) |

### Review Flow

```
Student asks question
        │
        ▼
 LLM generates answer
        │
        ▼
 ai_answer_queue row created
 status = 'pending'
        │
        ▼
 Faculty opens Verification Queue
        │
   ┌────┴───────────────────────────────────┐
   ▼           ▼             ▼              ▼
approve   edit+approve    reject        escalate
   │           │             │              │
   ▼           ▼             ▼              ▼
answer      edited       student        HOD/senior
released    answer       notified       faculty
to student  released                    reviews
```

The `ai_queue` router exposes:
- `GET /ai-queue/pending` — list items awaiting review (faculty-scoped)
- `POST /ai-queue/{id}/approve` — release the AI answer as-is
- `POST /ai-queue/{id}/edit-approve` — submit an edited answer and release
- `POST /ai-queue/{id}/reject` — reject and notify the student
- `POST /ai-queue/{id}/escalate` — flag for senior review

---

## Testing

Tests use **pytest**. Configuration is in `pytest.ini`.

```bash
cd backend
source .venv/bin/activate

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run a specific test file
pytest tests/test_auth.py

# Run with coverage
pytest --cov=app tests/
```

---

## Key Design Patterns

### 1. Institution-Scoped Data Access

Every database query is scoped by `institution_id` using a helper in `app/database/scoped.py`. No query can return data from a different institution, regardless of user role.

```python
# All queries go through the scoped helper
async def get_courses(institution_id: str, db) -> list[Course]:
    return await db.table("courses").select("*").eq("institution_id", institution_id).execute()
```

### 2. Role-Based `Depends()` Guards

FastAPI's dependency injection system enforces role checks at the router level. An incorrect role receives a `403 Forbidden` response before any business logic executes.

### 3. Async Throughout

All route handlers, service functions, and database calls are `async def`. The Supabase client is initialized with async support. This enables high concurrency with a single uvicorn worker process.

### 4. Separation of Layers

- **Routers** — HTTP concerns only (request parsing, response shaping, auth guards).
- **Services** — Business logic, orchestration, complex workflows.
- **Store** — Data access, Supabase queries, mapping to domain models.

This layering keeps routers thin and services independently testable.
