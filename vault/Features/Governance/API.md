# Academic Governance: API Reference

The Governance API provides the control plane for departmental heads and system administrators to manage the academic lifecycle and system health.

## 🏛 HOD (Departmental) Endpoints
Scoped to the user's `resolved_department_id`.

- `GET /hod/dashboard`: Aggregated stats (Students, Teachers, Programs, Pending Requests).
- `GET /hod/teachers`: Performance statistics for faculty within the department.
- `GET /hod/requests`: Queue of teacher assignments pending departmental review.
- `PATCH /hod/requests/{id}`: Approve (transitions to `PENDING_ADMIN`) or Reject a request.

## 🛠 Admin (Institutional) Endpoints
Authorized only for `college_admin` or `super_admin` roles with mandatory 2FA.

### 1. System Configuration
- `GET /admin/config`: Retrieves global feature flags and maintenance mode status.
- `POST /admin/shadow-mode`: Allows an admin to impersonate a student/teacher for debugging (logged).
- `GET /admin/roles/matrix`: The canonical mapping of functional permissions to roles.

### 2. User & Access Management
- `POST /admin/users`: Batch or single user creation with role assignment.
- `POST /admin/users/{id}/status`: Enable/Disable accounts (Active, Inactive, Suspended).
- `PATCH /admin/institutions/{id}/departments/{dept_id}/hod`: Assigns a specific user as the Department Head.

### 3. AI & Oversight
- `GET /admin/logs/ai`: Audit trail of all AI-student interactions.
- `GET /admin/queue-health`: Monitors the throughput and backlog of the Human-in-the-Loop verification queue.
- `GET /admin/guardian`: Real-time signals from the AI policy monitoring service.

### 4. Compliance & Privacy
- `GET /admin/compliance/audit-logs`: Immutable ledger of all administrative actions.
- `POST /admin/compliance/deletions/{id}/process`: Executes the multi-component data deletion pipeline for GDPR/PIPL compliance.

---
[[Governance/Overview]] | [[Governance/Backend]] | [[Governance/Frontend]] | [[Governance/Flow]]
