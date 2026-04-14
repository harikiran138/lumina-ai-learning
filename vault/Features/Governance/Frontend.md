# Academic Governance: Frontend Implementation

The Governance interfaces provide multi-level administrative views, from departmental oversight (HOD) to global system management (Admin).

## 🏢 HOD (Departmental) Portal
Located in `frontend/web/src/app/(hod)/`. This portal focuses on academic quality and faculty coordination.

### Key Views
- **Departmental Dashboard**: `(hod)/dashboard/` - High-level metrics for student success, teacher attendance, and pending approvals.
- **Syllabus Tracker**: `(hod)/syllabus-tracker/` - Real-time progress monitoring of all courses within the department.
- **Faculty Performance**: `(hod)/faculty-performance/` - Comparative analytics of teacher engagement and intervention response times.
- **SLA Monitor**: `(hod)/sla-monitor/` - Alerts when teacher interventions or AI verifications exceed the defined time-to-reply SLA.

## ⚙️ Admin (System) Portal
Located in `frontend/web/src/app/(admin)/`. This is the global "Command Center" for the institution.

### Key Modules
- **Identity & Access**: `(admin)/users/` - Centralized user lifecycle management (Roles, Status, 2FA status).
- **Institutional Config**: `(admin)/institutions/` & `(admin)/departments/` - Tools for defining the academic hierarchy and resource limits.
- **Security & Observation**:
  - `(admin)/guardian-log/`: Monitoring the AI Guardian's policy enforcement actions.
  - `(admin)/system/`: Real-time system health (Latency, DB load, Queue backlog).
- **Governance Console**: `(admin)/governance/` - Interface for updating the **Role-Permission Matrix** (`config_store`).

## 🖼 Design Strategy
- **Hierarchical Navigation**: The sidebar dynamically adjusts based on whether the user is viewing a specific department or the entire institution.
- **Audit-First**: Most administrative actions (e.g., deleting a user, changing a config) trigger an immediate audit-log confirmation overlay.
- **Data Densification**: Uses advanced filtering and sorting across all tables to manage thousands of users and courses efficiently.

---
[[Governance/Overview]] | [[Governance/API]] | [[Governance/Backend]] | [[Governance/Flow]]
