# Module Map

Document status: canonical folder-to-domain map after cleanup on 2026-04-15.

## 1. Top-Level Modules

| Folder | Domain | Status | Primary Docs |
|---|---|---|---|
| `frontend/web` | Main frontend | Active | `vault/02_Technical_Specs/FRONTEND_SPEC.md`, `vault/Features/*/Frontend.md` |
| `backend/app` | Main backend | Active | `vault/02_Technical_Specs/BACKEND_SPEC.md`, `vault/Features/*/Backend.md` |
| `backend/ai_engine` | AI orchestration support | Active | `vault/Features/AI/Backend.md`, `vault/02_Technical_Specs/AI_TUTOR_SYSTEM.md` |
| `backend/learner_profile` | Learner profiling support | Active support | `vault/02_Technical_Specs/STUDENT_INTELLIGENCE_LOOP.md` |
| `backend/mcp` | MCP protocol/runtime | Active support | `vault/02_Technical_Specs/MCP_PROTOCOL.md` |
| `backend/ml_services` | ML container service | Active support | `vault/02_Technical_Specs/BACKEND_SPEC.md` |
| `supabase` | Database migrations/config | Active | `vault/02_Technical_Specs/DATABASE_SCHEMA.md`, `vault/03_Infrastructure/DATABASE_SETUP.md` |
| `ml` | Shared ML workspace | Active support | `vault/02_Technical_Specs/AI_TUTOR_SYSTEM.md`, `vault/04_Agents/Pathway/README.md` |
| `automation` | Workflow automation | Active support | `vault/01_Core/SYSTEM_DOCUMENTATION.md` |
| `Analytics-Agent` | Analytics agent package | Supporting | `vault/04_Agents/Analytics/PROJECT_MANUAL.md` |
| `pathway agent` | Pathway experiment/training workspace | Supporting | `vault/04_Agents/Pathway/README.md` |
| `training` | Training helpers | Supporting | `vault/01_Core/PROJECT_STRUCTURE.md` |
| `deploy` | Deployment support | Active support | `vault/03_Infrastructure/DEPLOYMENT_GUIDE.md` |
| `deployment/aws` | AWS deployment automation | Active support | `vault/03_Infrastructure/AWS_DEPLOYMENT.md` |
| `migrations` | Supplemental SQL patches | Active support | `vault/01_Core/SYSTEM_DOCUMENTATION.md` |
| `infra` | Infra resources | Active support | `vault/03_Infrastructure/DEPLOYMENT_GUIDE.md` |
| `archive/legacy_sql` | Historical SQL archive | Historical | `vault/01_Core/PROJECT_STRUCTURE.md` |
| `vault` | Documentation system | Active | `vault/START_HERE.md` |

## 2. Frontend Module Breakdown

| Path | Domain |
|---|---|
| `frontend/web/src/app` | Route-level pages and layouts |
| `frontend/web/src/components` | Shared UI and domain components |
| `frontend/web/src/features` | Feature-grouped frontend modules |
| `frontend/web/src/lib` | Shared frontend logic and API layer |
| `frontend/web/src/store` | Frontend state |
| `frontend/web/src/hooks` | React hooks |

## 3. Backend Module Breakdown

| Path | Domain |
|---|---|
| `backend/app/routers` | API route layer |
| `backend/app/services` | Service/orchestration layer |
| `backend/app/store` | Data access layer |
| `backend/app/core` | Core config/security/metrics |
| `backend/app/database` | DB access and migrations |
| `backend/app/pathway` | Pathway engine |
| `backend/app/personalization` | Learner modeling and KPI logic |
| `backend/app/rag` | Retrieval and AI context support |
| `backend/app/assessment` | Assessment engine |

## 4. Reading Order

1. [[../START_HERE|START_HERE]]
2. [[../01_Core/PROJECT_STRUCTURE|PROJECT_STRUCTURE]]
3. [[../01_Core/SYSTEM_DOCUMENTATION|SYSTEM_DOCUMENTATION]]
4. [[../01_Core/DOC_CODE_RELATIONSHIP_MAP|DOC_CODE_RELATIONSHIP_MAP]]
