# Deployment

> **File:** `07-operations/01-deployment.md`
> **Related:** [[01-architecture/03-infrastructure]], [[07-operations/02-monitoring]]
> **Last Updated:** 2026-04-15

How to deploy Lumina in development and production environments.

---

## Repository Layout

```
busy-bardeen/
├── frontend/          ← Next.js 15 application
│   ├── app/           ← App Router pages and layouts
│   ├── components/    ← Shared UI components
│   ├── lib/           ← Utilities, API clients
│   └── package.json
├── backend/           ← FastAPI application
│   ├── routers/       ← One file per API router module
│   ├── models/        ← SQLAlchemy ORM models
│   ├── schemas/       ← Pydantic request/response schemas
│   ├── dependencies/  ← FastAPI dependency functions (auth, db, redis)
│   ├── main.py        ← App entry point
│   └── requirements.txt
├── ai-engine/         ← LangGraph + ML inference service
│   ├── agents/        ← Tutor, Guardian, Assessment, Pathway nodes
│   ├── rag/           ← FAISS, BM25, Neo4j retrieval
│   ├── ml/            ← BKT, DKT, PPO, XGBoost, TrOCR
│   ├── main.py
│   └── requirements.txt
├── docker-compose.yml ← Full stack for development
├── docker-compose.prod.yml ← Production overrides
└── migrations/        ← Alembic database migrations
```

## Development Setup

```bash
# 1. Clone repository
git clone https://github.com/org/busy-bardeen.git
cd busy-bardeen

# 2. Start all infrastructure services
docker-compose up -d postgres redis minio neo4j

# 3. Run database migrations
cd backend
alembic upgrade head

# 4. Start backend
uvicorn main:app --reload --port 8000

# 5. Start AI engine
cd ../ai-engine
uvicorn main:app --reload --port 8001

# 6. Start frontend
cd ../frontend
npm install
npm run dev  # starts on port 3000
```

## Production Deployment (Single Server)

```bash
# Using docker-compose.prod.yml
docker-compose -f docker-compose.prod.yml up -d

# Services started:
# - nginx (reverse proxy, SSL termination, port 80/443)
# - frontend (Next.js, port 3000 internal)
# - backend (Uvicorn with 4 workers, port 8000 internal)
# - ai-engine (Uvicorn with 2 workers, port 8001 internal)
# - postgres (port 5432 internal only)
# - redis (port 6379 internal only)
# - minio (ports 9000/9001 internal only)
# - neo4j (ports 7474/7687 internal only)
```

## Environment Configuration Checklist

Before first deployment:
- [ ] Set `JWT_SECRET` to a 64-character random string (use `openssl rand -hex 32`)
- [ ] Set `ANTHROPIC_API_KEY` for Tutor and Guardian agents
- [ ] Set `GOOGLE_API_KEY` for Assessment agent
- [ ] Configure `INSTITUTION_SMTP_HOST` and credentials for password reset emails
- [ ] Set `MINIO_ACCESS_KEY` and `MINIO_SECRET_KEY` to strong random values
- [ ] Set `NEO4J_PASSWORD` to a strong random value
- [ ] Set `DEMO_MODE=false` in production
- [ ] Set `DATABASE_URL` with the correct PostgreSQL credentials
- [ ] Configure Nginx SSL certificate (Let's Encrypt recommended)

## Database Migrations

Migrations are managed with Alembic:

```bash
# Apply all pending migrations
alembic upgrade head

# Create a new migration after changing SQLAlchemy models
alembic revision --autogenerate -m "describe_your_change"

# Rollback one migration
alembic downgrade -1
```

Never edit a migration file after it has been applied to any environment. Create a new migration instead.

## First-Run Seeding

After migrations, run the seed script to create the Super Admin account and default platform configuration:

```bash
cd backend
python scripts/seed_super_admin.py
# Prompts for SA email and password
# Creates institution_id=NULL super_admin account
# Prints SA credentials — store securely immediately
```
