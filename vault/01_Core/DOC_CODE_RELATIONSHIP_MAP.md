# Doc-Code Relationship Map

Document status: canonical doc-to-code crosswalk after cleanup on 2026-04-15.

This file answers one question: which documents describe which code.

## 1. Canonical Structure Documents

| Document | Scope | Primary Code Paths |
|---|---|---|
| `vault/START_HERE.md` | Vault entrypoint | Entire repository |
| `vault/01_Core/PROJECT_STRUCTURE.md` | Repo folder structure | Entire repository |
| `vault/01_Core/SYSTEM_DOCUMENTATION.md` | Runtime system boundary | `frontend/web`, `backend/app`, `backend/ai_engine`, `backend/mcp`, `backend/ml_services` |
| `vault/00_Meta/MODULE_MAP.md` | Folder-to-domain mapping | Top-level repo folders |

## 2. Frontend Docs To Code

| Document | Describes | Main Code Paths |
|---|---|---|
| `vault/02_Technical_Specs/FRONTEND_SPEC.md` | Web app structure and UX surface | `frontend/web/src/app`, `frontend/web/src/components`, `frontend/web/src/features`, `frontend/web/src/lib` |
| `vault/Features/Student/Frontend.md` | Student portal UI | `frontend/web/src/app/student`, `frontend/web/src/components/student` |
| `vault/Features/Faculty/Frontend.md` | Teacher/faculty UI | `frontend/web/src/app/teacher`, `frontend/web/src/components/teacher`, `frontend/web/src/components/dashboard` |
| `vault/Features/Governance/Frontend.md` | Admin and HOD UI | `frontend/web/src/app/admin`, `frontend/web/src/app/hod`, `frontend/web/src/features/admin` |
| `vault/Features/Support/Frontend.md` | Parent and mentor UI | `frontend/web/src/app/parent`, `frontend/web/src/app/mentor`, `frontend/web/src/components/parent` |
| `vault/Features/AI/Frontend.md` | Tutor and AI experience | `frontend/web/src/app/student/ai_tutor`, `frontend/web/src/components/ai`, `frontend/web/src/components/a2ui` |

## 3. Backend Docs To Code

| Document | Describes | Main Code Paths |
|---|---|---|
| `vault/02_Technical_Specs/BACKEND_SPEC.md` | Backend architecture | `backend/app`, `backend/ai_engine`, `backend/mcp`, `backend/ml_services` |
| `vault/02_Technical_Specs/BACKEND_API_MAP.md` | API endpoints and groupings | `backend/app/routers`, `backend/app/api`, `backend/api/index.py` |
| `vault/Features/Auth/Backend.md` | Auth backend | `backend/app/routers/auth.py`, `backend/app/core`, `backend/app/store/user_store.py` |
| `vault/Features/Student/Backend.md` | Student backend flows | `backend/app/routers/student.py`, `backend/app/store/student_store.py`, `backend/app/services` |
| `vault/Features/Faculty/Backend.md` | Teacher/faculty backend flows | `backend/app/routers/teacher.py`, `backend/app/services/ocr_service.py`, `backend/app/store/teacher_store.py` |
| `vault/Features/Governance/Backend.md` | Governance flows | `backend/app/routers/admin.py`, `backend/app/routers/hod.py`, `backend/app/store/academic_store.py` |
| `vault/Features/Support/Backend.md` | Parent, mentor, support flows | `backend/app/routers/parent.py`, `backend/app/routers/mentor.py`, `backend/app/store/parent_store.py` |
| `vault/Features/AI/Backend.md` | AI orchestration | `backend/app/routers/ai.py`, `backend/app/routers/ai_queue.py`, `backend/ai_engine`, `backend/app/pathway`, `backend/app/personalization` |

## 4. Database Docs To Code

| Document | Describes | Main Code Paths |
|---|---|---|
| `vault/02_Technical_Specs/DATABASE.md` | Database concepts | `supabase`, `backend/app/database`, `migrations` |
| `vault/02_Technical_Specs/DATABASE_SCHEMA.md` | Schema details | `supabase/migrations`, `backend/app/database/migrations`, `FINAL_DATABASE_SCHEMA.sql` |
| `vault/03_Infrastructure/DATABASE_SETUP.md` | DB setup workflow | `supabase/config.toml`, `supabase/migrations`, `backend/app/database` |

## 5. AI And Agent Docs To Code

| Document | Describes | Main Code Paths |
|---|---|---|
| `vault/02_Technical_Specs/AI_TUTOR_SYSTEM.md` | Tutor system design | `backend/ai_engine`, `backend/app/routers/ai.py`, `frontend/web/src/components/ai` |
| `vault/02_Technical_Specs/STUDENT_INTELLIGENCE_LOOP.md` | Learner signal loop | `backend/app/personalization`, `backend/app/services`, `backend/learner_profile` |
| `vault/04_Agents/Analytics/PROJECT_MANUAL.md` | Analytics agent | `Analytics-Agent/analytics_agent` |
| `vault/04_Agents/Pathway/README.md` | Pathway subsystem and experiments | `backend/app/pathway`, `ml/agents/pathway`, `pathway agent` |

## 6. Deployment Docs To Code

| Document | Describes | Main Code Paths |
|---|---|---|
| `vault/03_Infrastructure/LOCAL_SETUP.md` | Local startup | `run_local.sh`, `start_backend.sh`, `start_frontend.sh`, `docker-compose.yml` |
| `vault/03_Infrastructure/DEPLOYMENT_GUIDE.md` | Deployment options | `deploy`, `deploy/README.md`, `deployment/aws`, `deployment/README.md`, `.github/workflows`, `docker-compose.prod.yml` |
| `vault/03_Infrastructure/FRONTEND_DEPLOYMENT.md` | Frontend deployment | `frontend/web/Dockerfile`, `frontend/web/vercel.json`, root `vercel.json` |
| `vault/03_Infrastructure/BACKEND_SETUP.md` | Backend setup | `backend/requirements.txt`, `backend/Dockerfile`, `backend/render.yaml`, `backend/railway.toml`, `backend/vercel.json` |

## 7. Historical Documents

These documents are still valuable for history, but they may mention removed files:

- everything under `vault/05_Reports`
- old task lists in `vault/01_Core/AGENT_TASK_LIST.md`
- old implementation backlog items that reference deleted tests or scripts

Use the canonical files in sections 1 to 6 when you need a current 1-to-1 mapping.
