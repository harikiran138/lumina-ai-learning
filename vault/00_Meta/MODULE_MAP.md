# MODULE_MAP

The project is organized into several high-level folders representing different concerns. This map provides a reference for the Obsidian vault structure.

## 📂 Project Folders

| Folder | Vault Category | Description |
| :--- | :--- | :--- |
| `backend/` | `01_Core`, `02_API` | The Python FastAPI backend. Contains models, routers, and business logic. |
| `frontend/web/` | `05_Frontend` | Next.js 15 application. Contains stakeholder portals and shared UI. |
| `skills/` | `02_API`, `04_AI_ML` | Reusable AI agent skills and tools (Agentic Framework). |
| `ml/` | `04_AI_ML` | Machine learning models, training scripts, and notebooks. |
| `supabase/` | `03_Database` | Migrations, seed data, and schema definitions. |
| `docs/` | `07_Research` | Project documentation, research papers, and audit reports. |
| `Analytics-Agent/` | `04_AI_ML` | Specialized agent for predictive analytics and signaling. |
| `pathway agent/` | `04_AI_ML` | Logic for dynamic learning pathway generation. |
| `deployment/` | `06_Deployment` | CI/CD scripts, Dockerfiles, and cloud config. |
| `infra/` | `06_Deployment` | Infrastructure setup (MinIO, Neo4j, Nginx). |

## 🔗 Critical Entry Points
- **Backend**: `backend/app/main.py` → [[FULL_PROJECT_CATALOG|Backend Entry Point & Full Catalog]]
- **Frontend**: `frontend/web/src/app/page.tsx` → [[FRONTEND_SPEC|Frontend Spec]]
- **Database**: `FINAL_DATABASE_SCHEMA.sql` → [[DATABASE_SCHEMA]]
- **System Spec**: `DETAIL.md` → [[DETAIL|Lumina Master Blueprint]]

---
[[PROJECT_OVERVIEW]] | [[SYSTEM_ARCHITECTURE]] | [[DATA_FLOW]]

