# Academic Governance: Overview

The **Academic Governance** domain provides the high-level oversight and administrative authority required to scale the Lumina ecosystem across multiple departments and institutions.

## 🎯 Purpose
- **Resource Orchestration**: Managing the allocation of teachers to programs and batches.
- **Quality Assurance**: Supervising AI tutor performance and departmental grade distributions.
- **Approval Workflows**: Multi-stage validation of teacher requests and content modifications.
- **Institutional Configuration**: Defining departments, programs, and academic calendar constraints.

## 🧩 Core Components
- **Backend Routers**:
  - `backend/app/routers/hod.py` (Departmental oversight).
  - `backend/app/routers/admin.py` (Global system administration).
  - `backend/app/routers/ai_governance.py` (AI model policy controls).
- **Domain Store**: `backend/app/store/academic_store.py`
- **Frontend Portals**:
  - `frontend/web/src/app/(hod)/dashboard/`
  - `frontend/web/src/app/(admin)/dashboard/`

## 📊 Governance KPIs
1. **Approval Latency**: Time taken for a teacher assignment to move from request to activation.
2. **Resource Utilization**: Faculty workload distribution across programs.
3. **Mastery Thresholds**: Defining the "Success" criteria for dynamic lesson paths.

### 🔗 Related Paths
- [[Features/AI/Backend|Retrospective AI Audit Logging]]
- [[Features/Faculty/Backend|Teacher Dashboard Oversight]]
- [[DECISION_FLOW|Departmental Approval Cascade Logic]]

---
[[START_HERE]] | [[Governance/API]] | [[Governance/Backend]] | [[Governance/Frontend]] | [[Governance/Flow]]
