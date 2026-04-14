# Academic Governance: Resource Approval Flow

The governance flow ensures that high-impact academic changes (e.g. teacher assignments) are subject to a verifiable multi-stage approval audit trail.

## 🔄 Approval Cascade Flow

```mermaid
sequenceDiagram
    participant T as Teacher
    participant H as HOD (hod.py)
    participant A as Admin (admin.py)
    participant DB as Supabase
    participant N as Notifications

    T->>DB: POST /teacher/requests/program
    DB->>DB: Set status: PENDING_HOD
    H->>DB: PATCH /hod/requests/{id} (State: APPROVE)
    Note over H,DB: Trigger logic in hod.py -> approve_request_by_hod
    DB->>DB: Set status: PENDING_ADMIN
    A->>DB: PATCH /admin/requests/{id} (State: APPROVE)
    Note over A,DB: Final resolution in admin.py
    DB->>DB: Set status: APPROVED
    DB->>DB: Activate teacher_assignments record
```

## 🛤 Full System Traceability

| Stage | Component | Implementation Reference |
| :--- | :--- | :--- |
| **Request** | Teacher Store | `teacher_store.py -> create_assignment_request` |
| **HOD Gate** | HOD Router | `hod.py -> approve_request_by_hod` |
| **Admin Gate** | Admin Router | `admin.py -> finalize_assignment` |
| **Validation** | RBAC Logic | `hod.py -> check_hod_role` |
| **Persistence** | State Sync | `teacher_requests` table updates |

## ⚙️ Governance Verification
- **Test Command**: `pytest tests/test_governance_flows.py` (Verify that an Admin cannot approve a request that hasn't passed the HOD gate).
- **Manual Verification**: Observe the `status` column in the `teacher_requests` table transition from `PENDING_HOD` -> `PENDING_ADMIN` -> `APPROVED`.
