# Lumina Deployment Requirements Report

## 1. Purpose
This document is the complete deployment requirements reference for Lumina AI Learning.
It covers:
- Hardware requirements (CPU, RAM, storage)
- Software/runtime requirements
- Network/ports
- Required environment variables
- Deployment profiles (local, full stack, production-like)
- Capacity and growth guidance

## 2. Runtime Architecture
Primary runtime components in this repository:
- Frontend: Next.js app in `frontend/web`
- Backend: FastAPI app in `backend/app`
- Worker: Celery worker (async/background jobs)
- Datastores: PostgreSQL, Redis, Neo4j, MinIO
- ML service: `backend/ml_services`
- Monitoring: Prometheus, Grafana
- Optional edge/proxy (prod compose): Nginx

Compose references:
- Dev/full stack: `docker-compose.yml`
- Prod-style stack: `docker-compose.prod.yml`

## 3. Hardware Requirements

### 3.1 Minimal Local Development (Backend + Frontend only)
Use this for fastest local development without full containerized infra.
- CPU: 4 vCPU minimum
- RAM: 8 GB minimum, 12 GB recommended
- Storage: 8 GB minimum, 12+ GB recommended

### 3.2 Full Development Stack (all services in `docker-compose.yml`)
Includes Postgres, Redis, Neo4j, MinIO, backend, worker, ml-service, flower, prometheus, grafana, frontend.
- CPU: 6 vCPU minimum, 8+ vCPU recommended
- RAM: 14 GB minimum, 20–24 GB recommended
- Storage:
  - Initial pull/build/start: 15–20 GB free minimum
  - Ongoing day-to-day usage: 30+ GB recommended

### 3.3 Production-like Single Host (`docker-compose.prod.yml`)
- CPU: 8 vCPU recommended
- RAM: 16 GB minimum, 24 GB recommended
- Storage: 20 GB minimum, 40+ GB recommended

## 4. Storage Breakdown and Why It Grows
Storage usage in this stack is driven mainly by:
- Docker images/layers for many services
- Persistent volumes:
  - Postgres data
  - Redis AOF data
  - Neo4j graph + logs
  - MinIO object data
  - Prometheus TSDB
  - Grafana state
- Build caches (`node_modules`, Python venv, pip/npm caches)

Expected growth pattern:
- Postgres/Neo4j/MinIO grow with real usage data
- Prometheus grows continuously unless retention is capped
- Docker cache grows with rebuild frequency

## 5. Software Requirements

### 5.1 Core Tooling
- Python 3.10+ (3.11+ preferred)
- Node.js + npm
- Docker Engine / Docker Desktop (required for full stack compose and Supabase CLI shadow-db operations)
- Supabase CLI (for migration management)

### 5.2 Backend Python Dependencies
Installed via `backend/requirements.txt` (or slim/prod variant where applicable).

### 5.3 Frontend Dependencies
Installed via `frontend/web/package.json`.

## 6. Network and Port Requirements

### 6.1 Dev Compose (`docker-compose.yml`)
- Postgres: `5432`
- Redis: `6379`
- Neo4j HTTP/Bolt: `7474`, `7687`
- MinIO API/Console: `9000`, `9001`
- Backend: `8000`
- Frontend: `8001` (container port 3000)
- ML service: `9000` (conflicts if MinIO uses same host port; check profile usage)
- Flower: `5555`
- Prometheus: `9090`
- Grafana: `3003`

### 6.2 Local script-based runtime
- Backend script runs at `127.0.0.1:9000`
- Frontend script runs at `localhost:3000`

### 6.3 Prod Compose (`docker-compose.prod.yml`)
- Frontend: `3000`
- Backend: `8000`
- Nginx: `80`, `443`
- Plus datastore/worker ports as configured

## 7. Required Environment Variables
Do not store secrets in git. Use `.env`, platform secrets, or secret managers.

### 7.1 Backend critical
- `ENVIRONMENT`
- `DATABASE_URL`
- `REDIS_URL`
- `SECRET_KEY`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 7.2 Backend AI/LLM and optional integrations
- `OPENROUTER_API_KEY` (or equivalent key path)
- `GEMINI_API_KEY` (fallback path appears in code paths)
- `OPENAI_API_KEY` (if used)
- `HF_TOKEN` (if handwritten/ML pipelines require it)
- `SENTRY_DSN` (optional observability)
- AWS variables if using object-storage integrations in worker:
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_BUCKET_NAME`

### 7.3 Frontend critical
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_AUTH_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or publishable default key variable)

### 7.4 Frontend optional/toggles
- `NEXT_PUBLIC_IS_PROTOTYPE`
- `NEXT_PUBLIC_TUTOR_PROVIDER`

## 8. Deployment Profiles

### 8.1 Lightweight development (recommended on constrained laptops)
Run only:
- backend
- frontend
- optionally PostgreSQL and Redis
Skip Neo4j/MinIO/Prometheus/Grafana/ML service unless needed for task scope.

### 8.2 Full local platform validation
Run all compose services when validating full integration flow.

### 8.3 Production-like compose
Use `docker-compose.prod.yml` with:
- hardened secrets
- secure passwords
- TLS termination through Nginx
- externalized backups and retention

## 9. Operational Requirements

### 9.1 Health checks and readiness
All critical services should pass container health checks before dependent services start.

### 9.2 Backups
Minimum required backup policies:
- Daily logical backup for PostgreSQL
- Periodic Neo4j backup/export
- MinIO bucket backup/replication
- Retention policy for Prometheus data

### 9.3 Security baseline
- Never deploy with default passwords from compose examples
- Enforce strong values for `SECRET_KEY`, `JWT_SECRET`, `JWT_REFRESH_SECRET`
- Restrict network exposure of internal ports where possible
- Use HTTPS/TLS in production

## 10. Capacity Planning Guidance

### 10.1 RAM pressure indicators
- Frequent OOM kills on worker/backend
- Slow Next.js rebuild + API timeouts under load
- DB/Neo4j swap activity

### 10.2 Storage pressure indicators
- Docker pulls/build failures
- DB write failures or filesystem pressure alerts
- High churn in logs/metrics without retention limits

### 10.3 Recommended buffer
For stable operation, keep at least:
- 20% free RAM headroom under peak load
- 25–30% free disk headroom on the main volume

## 11. Run Commands (reference)

### 11.1 Script-based local run
- `./start_backend.sh`
- `./start_frontend.sh`
- or `./run_local.sh`

### 11.2 Full compose run
- `docker compose up --build`

### 11.3 Production-style compose run
- `docker compose -f docker-compose.prod.yml up -d --build`

## 12. Final Recommendation Matrix

- If host has 8–12 GB RAM and low disk: run lightweight profile only
- If host has 16 GB RAM and moderate disk (20+ GB free): run most services but monitor memory
- If host has 24 GB RAM and 40+ GB free: full stack + monitoring is practical for sustained development

---
This report is intentionally strict and deployment-focused so teams can use it as a single source of requirements truth.
