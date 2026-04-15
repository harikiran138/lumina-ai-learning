# 🎯 Lumina System Architecture & Quick Reference

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          LUMINA AI LEARNING SYSTEM                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                            CLIENT LAYER (Browser)                            │
├──────────────────────────────────────────────────────────────────────────────┤
│  Portal                 │  Portal                  │  Portal                 │
│  ┌─────────────┐        │  ┌──────────────┐       │  ┌────────────┐        │
│  │  Student    │        │  │   Faculty    │       │  │   Admin    │        │
│  │  Dashboard  │        │  │   Queue      │       │  │   Panel    │        │
│  └─────────────┘        │  └──────────────┘       │  └────────────┘        │
│  ┌─────────────────────┬──────────────────────────────────────────────────┐  │
│  │          Next.js Frontend (React 19 + TypeScript + Tailwind)          │  │
│  │   - Multi-modal portal system (12+ role-based UIs)                    │  │
│  │   - AI Tutor widget, assessments, knowledge graph, gamification       │  │
│  │   - Client-side state (auth, onboarding)                             │  │
│  │   - API proxy to backend (no CORS issues)                            │  │
│  │   Port: 3000                                                         │  │
│  └─────────────────────┬──────────────────────────────────────────────────┘  │
└──────────────┬─────────────────────────────────────────────────────────────────┘
               │
               │ HTTP/WebSocket (REST API + Real-time)
               │
┌──────────────┴─────────────────────────────────────────────────────────────────┐
│                       APPLICATION LAYER (Backend)                             │
├──────────────────────────────────────────────────────────────────────────────────┤
│
│   ┌─────────────────────────────────────┐
│   │   FastAPI Backend (Python 3.11+)    │
│   │   Port: 8000 (Dev) / Vercel (Prod)  │
│   │                                     │
│   │  +─────────────────────────────────+│
│   │  │        API Routers              │
│   │  │ ┌───────────────────────────┐  │
│   │  │ │ • Courses & Assignments   │  │
│   │  │ │ • AI Queue (⭐ Canonical) │  │
│   │  │ │ • Dropout Analysis        │  │
│   │  │ │ • Assessment & Quiz      │  │
│   │  │ │ • Tutor Sessions          │  │
│   │  │ │ • Learner Profile         │  │
│   │  │ │ • Attendance & Grading    │  │
│   │  │ │ • Notifications          │  │
│   │  │ └───────────────────────────┘  │
│   │  +─────────────────────────────────+│
│   │
│   │  +─────────────────────────────────+│
│   │  │    Business Logic Layer         │
│   │  │ ┌───────────────────────────┐  │
│   │  │ │ Services:                 │  │
│   │  │ │ • AI Engine Orchestration │  │
│   │  │ │ • Learner Profiling      │  │
│   │  │ │ • Pathway Recommendations │  │
│   │  │ │ • RAG Pipeline           │  │
│   │  │ │ • OCR Processing         │  │
│   │  │ │ • Background Jobs (Celery)│  │
│   │  │ └───────────────────────────┘  │
│   │  +─────────────────────────────────+│
│   │
│   │  +─────────────────────────────────+│
│   │  │    AI Engine Support          │
│   │  │ ┌───────────────────────────┐  │
│   │  │ │ • LLM Provider Router      │  │
│   │  │ │ • Prompt Management       │  │
│   │  │ │ • Fallback Logic         │  │
│   │  │ │ • Vector Search           │  │
│   │  │ │ • Swarm/Orchestration     │  │
│   │  │ └───────────────────────────┘  │
│   │  +─────────────────────────────────+│
│   │
│   │  +─────────────────────────────────+│
│   │  │     Supporting Packages        │
│   │  │ ┌───────────────────────────┐  │
│   │  │ │ • MCP Server/Protocol     │  │
│   │  │ │ • Learner Profile Package │  │
│   │  │ │ • ML Services            │  │
│   │  │ │ • Security & Middleware   │  │
│   │  │ └───────────────────────────┘  │
│   │  +─────────────────────────────────+│
│   │
│   └─────────────────────────────────────┘
│
│   ┌─────────────────────────────────────┐
│   │  Background Worker (Celery)         │
│   │  • Async task processing            │
│   │  • Long-running jobs                │
│   │  • Scheduled tasks (APScheduler)    │
│   └──────────────┬──────────────────────┘
│                  │
└──────────────────┼──────────────────────────────────────────────────────────────┘
                   │
     ┌─────────────┼─────────────┬──────────────────┐
     │             │             │                  │
┌────▼───┐   ┌────▼───┐   ┌────▼────┐      ┌──────▼────┐
│ Celery │   │ Redis  │   │ ChromaDB │      │ External  │
│ Queue  │   │ Cache  │   │ Vector DB│      │ LLMs:     │
└────┬───┘   └────┬───┘   └────┬────┘      │ • Ollama  │
     │            │            │           │ • Gemini  │
     │            │            │           │ • OpenAPI │
     │            │            │           │ • Groq    │
     │            │            │           └───────────┘
     └────────────┼────────────┘
                  │
     ┌────────────┴─────────────────────────┐
     │                                      │
┌────▼──────────────────────┐   ┌──────────▼────────────────────┐
│    Data Layer (Storage)    │   │   Infrastructure Services    │
├────────────────────────────┤   ├──────────────────────────────┤
│                            │   │                              │
│  PostgreSQL (Supabase)     │   │  Neo4j (Knowledge Graph)     │
│  • User Authentication     │   │  • Learning relationships    │
│  • Courses & Assessments   │   │  • Skill prerequisites       │
│  • Progress Tracking       │   │  • Domain mapping            │
│  • AI Logs & Audit Trail   │   │                              │
│  • Row-Level Security      │   │  MinIO (S3-compatible)       │
│  • JSONB Semi-structured   │   │  • Document uploads          │
│  • 35 Core Tables          │   │  • User media               │
│  • Full-text Search        │   │  • Generated artifacts       │
│  Port: 5432                │   │                              │
│                            │   │  Monitoring:                 │
│  Migrations:               │   │  • Prometheus (metrics)      │
│  • supabase/migrations/    │   │  • Sentry (error tracking)   │
│  • Versioned SQL           │   │  • FastAPI auto-docs         │
│                            │   │                              │
└────────────────────────────┘   └──────────────────────────────┘

```

---

## Data Flow Diagrams

### 1. AI Tutor Request Flow (Primary)
```
Student Input
    ↓
Frontend AI Widget
    ↓
POST /api/routers/ai_queue    [⭐ CANONICAL FLOW]
    ↓
Check Teacher Verification Queue
    ↓
AI Engine Orchestrator
    ├─→ Learner Profile (get student context)
    ├─→ RAG Pipeline (fetch relevant course content)
    ├─→ Vector Search (ChromaDB/Qdrant)
    └─→ Prompt Management (construct system + user prompt)
    ↓
LLM Provider Router
    ├─→ Try: Ollama (local)
    ├─→ Fallback: Gemini (cloud)
    ├─→ Fallback: OpenRouter (multi-provider)
    └─→ Fallback: Built-in response template
    ↓
LLM Response
    ↓
Log to ai_logs table (audit trail)
    ↓
Response to Frontend
    ↓
Student Sees Answer (with confidence, citations, follow-ups)
```

### 2. Assessment & Learner Profiling Flow
```
Student Submission (Quiz/Assignment)
    ↓
POST /api/assessment
    ↓
Store in quiz_attempts table
    ↓
Trigger background job (Celery)
    ↓
Learner Profiling Service
    ├─→ Calculate skill mastery (Bloom's levels)
    ├─→ Update learner_profiles JSONB
    ├─→ Compute risk indicators
    └─→ Check intervention thresholds
    ↓
Update Progress Entity
    ↓
Generate Notification (if needed)
    ├─→ Teacher alert (low performance)
    ├─→ Counselor alert (at-risk student)
    └─→ Parent notification (progress update)
    ↓
Pathway Recommendation Engine
    ├─→ Analyze skill gaps
    ├─→ Generate remedial pathway
    └─→ Update student_pathways table
    ↓
Complete
```

### 3. Background Job Processing
```
Trigger Event
(OCR needed, PPT generation, bulk import)
    ↓
Enqueue to Celery
    ↓
Redis Queue
    ↓
Background Worker
(backend/app/worker.py)
    ↓
Process Job
(OCR, PDF generation, etc.)
    ↓
Store Result
(uploads/, static/presentations/)
    ↓
Update Database
    ↓
Send Notification
    ↓
User Receives Alert
```

---

## Quick Command Reference

### Development Startup
```bash
# Full stack (all services including frontend, backend, DB)
./run_local.sh

# Individual services
make dev          # Full stack (backend + frontend)
make backend      # Backend only
make frontend     # Frontend only
make docker-up    # Docker services only
make docker-down  # Stop Docker services
```

### Backend Development
```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000

# Or use the starter script
./start_backend.sh
```

### Frontend Development
```bash
cd frontend/web
npm run dev

# Or use the starter script
./start_frontend.sh
```

### Database Operations
```bash
# Apply migrations (using Supabase CLI)
supabase db push          # Push local migrations to remote
supabase db pull          # Pull remote schema to local
supabase db reset         # Reset local database

# Manual SQL (if needed)
psql postgresql://lumina:password@localhost:5432/lumina_db
```

### Background Workers
```bash
# Start Celery worker
python backend/app/worker.py

# Or with debugging
celery -A backend.app.worker worker -l debug
```

### Docker Operations
```bash
# Build all images
docker-compose build

# Start all services
docker-compose up

# Stop all services
docker-compose down

# View logs
docker-compose logs -f backend      # Stream backend logs
docker-compose logs redis           # View specific service

# Clean up volumes
docker-compose down -v              # Remove all volumes
```

### Environment Setup
```bash
# Copy environment templates
cp .env.example .env.prod
cp frontend/web/.env.example frontend/web/.env.local

# Edit and add your values
nano .env.prod
nano frontend/web/.env.local

# Verify environment
echo $DATABASE_URL
echo $SUPABASE_URL
```

---

## Key File Locations & Purposes

| Action | Location | Command |
|---|---|---|
| **Start Frontend** | `frontend/web` | `npm run dev` or `./start_frontend.sh` |
| **Start Backend** | `backend/app` | `uvicorn app.main:app --reload` or `./start_backend.sh` |
| **View API Docs** | Backend running | Visit `http://localhost:8000/docs` |
| **Teacher AI Queue** | `backend/app/routers/ai_queue.py` | **CANONICAL** tutor verification logic |
| **AI Engine** | `backend/ai_engine/` | LLM routing, prompt management, orchestration |
| **Learner Analytics** | `backend/app/personalization/` | Skill mastery, risk scores, KPIs |
| **Database Schema** | `FINAL_DATABASE_SCHEMA.sql` | Current schema snapshot |
| **Migrations (Prod)** | `supabase/migrations/` | Versioned SQL migrations (Supabase CLI) |
| **Migrations (Supplemental)** | `migrations/` | Manual SQL patches for reconciliation |
| **Environment Config** | `.env.prod`, `.env.local` | Secrets and runtime configuration |
| **Docker Config** | `docker-compose.yml` | Multi-service orchestration |
| **Deployment Scripts** | `deploy/`, `deployment/aws/` | Host-side and AWS provisioning |
| **Documentation** | `vault/` | Canonical architecture & implementation docs |
| **Architecture Docs** | `vault/01_Core/` | Structure, system docs, doc-to-code mapping |
| **Technical Specs** | `vault/02_Technical_Specs/` | Detailed product & infrastructure specs |
| **Infrastructure Docs** | `vault/03_Infrastructure/` | Setup, deployment, AWS guides |

---

## System Entry Points

### Frontend
- **Landing Page:** `frontend/web/src/app/page.tsx`
- **Login:** `frontend/web/src/app/login/page.tsx`
- **Student Portal:** `frontend/web/src/app/student/*`
- **Faculty Portal:** `frontend/web/src/app/faculty/*`
- **Admin Panel:** `frontend/web/src/app/admin/*`

### Backend
- **Main App:** `backend/app/main.py`
- **API Docs:** `/docs` (Swagger) or `/redoc` (ReDoc)
- **Vercel Entrypoint:** `backend/api/index.py`
- **Worker Entrypoint:** `backend/app/worker.py`

### Database
- **Connection:** PostgreSQL 16 via Supabase
- **Port:** 5432 (local Docker)
- **Credentials:** See `.env.prod` or docker-compose.yml
- **Schema:** 35 tables with RLS policies

---

## Common Operations Checklist

### ✅ Local Setup
- [ ] Clone repository
- [ ] Install Node.js 20.x
- [ ] Install Python 3.11+
- [ ] Install Docker & Docker Compose
- [ ] Copy `.env.example` → `.env.local`
- [ ] Copy `frontend/web/.env.example` → `frontend/web/.env.local`
- [ ] Run `docker-compose up` to start services
- [ ] Run `npm install` in `frontend/web`
- [ ] Run `pip install -r backend/requirements.txt`
- [ ] Visit `http://localhost:3000` for frontend
- [ ] Visit `http://localhost:8000/docs` for API docs

### ✅ Before Committing
- [ ] Run linter: `npm run lint` (frontend)
- [ ] Run type check: TypeScript in frontend
- [ ] Run security check: `bandit` (backend)
- [ ] Test locally: `make dev`
- [ ] Check git status: `git status`
- [ ] Write clear commit message

### ✅ Adding New Features
- [ ] Create feature branch: `git checkout -b feature/name`
- [ ] Update vault docs if architecture changes
- [ ] Add database migration if needed
- [ ] Add API route in backend/app/routers/
- [ ] Add frontend component in frontend/web/src/
- [ ] Update .env.example with new variables
- [ ] Test locally and in Docker
- [ ] Create pull request with clear description

### ✅ Deployment
- [ ] Update .env files for target environment
- [ ] Run database migrations: `supabase db push`
- [ ] Build Docker images: `docker-compose build`
- [ ] Push to registry (if using container registry)
- [ ] Update deployment config (nginx, Vercel, AWS)
- [ ] Test in staging environment
- [ ] Deploy to production
- [ ] Monitor logs and metrics
- [ ] Verify health checks

---

## Troubleshooting Quick Links

| Problem | Solution |
|---|---|
| **Frontend won't start** | Check Node.js version (`node -v`), run `npm install`, check port 3000 |
| **Backend won't start** | Check Python version, run `pip install -r requirements.txt`, check port 8000 |
| **Database connection error** | Verify DATABASE_URL, check PostgreSQL running, verify docker-compose |
| **Redis connection refused** | Check redis service: `docker-compose ps`, restart: `docker-compose restart redis` |
| **API returning 401** | Check auth token, verify SUPABASE_SERVICE_ROLE_KEY, check RLS policies |
| **AI Tutor not responding** | Check ai_engine service, verify LLM provider (Ollama/Gemini), check logs |
| **OCR failing** | Verify OpenCV installed, check TrOCR model, check uploaded file format |
| **Background jobs not processing** | Check Celery worker: `ps aux \| grep celery`, verify Redis queue, check logs |
| **Database migration stuck** | Check supabase status, run `supabase db reset`, review migration SQL |
| **Docker build failing** | Clear Docker cache: `docker system prune -a`, rebuild: `docker-compose build --no-cache` |

---

## Performance Tips

1. **Frontend:** Use code splitting, lazy loading for portals, optimize images
2. **Backend:** Enable database connection pooling (PgBouncer), use Redis caching
3. **Database:** Create indexes on frequently queried columns, use JSONB wisely
4. **AI:** Cache embeddings in ChromaDB, reuse vector searches
5. **Workers:** Scale Celery workers horizontally, use task priorities
6. **Docker:** Use multi-stage builds, keep image sizes small
7. **Monitoring:** Enable Prometheus metrics, set up Sentry alerts

---

## Useful Links

- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [Docker Documentation](https://docs.docker.com/)
- [Celery Documentation](https://docs.celeryproject.io/)
- [Hugging Face Hub](https://huggingface.co/)

---

**This is a living document. Update it as the system evolves!**
