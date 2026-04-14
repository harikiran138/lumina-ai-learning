# Institutional Governance: Backend Implementation

Governance logic ensures accountability through multi-level approval cascades and retrospective AI auditing.

## 🛤 Code Traceability
- **Primary Router**: [admin.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/routers/admin.py)
- **HOD Router**: [hod.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/routers/hod.py)
- **Governance Store**: [teacher_store.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/store/teacher_store.py)
- **Key Functions**:
    - `get_hod_dashboard()`: Departmental oversight and pending request aggregation.
    - `update_teacher_request()`: The core approval state transition ([hod.py:L111](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/routers/hod.py#L111)).
    - `approve_request_by_hod()`: Transitions status from `PENDING_HOD` to `PENDING_ADMIN`.
    - `update_teacher_request()` (Admin): Final resolution to `APPROVED`.

## 🏛 Approval Cascade (Verifiable Logic)
The system enforces a strictly sequence-locked approval chain for teaching assignments:

1.  **Initiation**: Teacher requests an assignment via `POST /api/teacher/assignments/request`.
2.  **HOD Gate**: Request appears in HOD dashboard ([hod.py:L83](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/routers/hod.py#L83)).
    - HOD resolves to `APPROVED`, triggering the state transition to `PENDING_ADMIN`.
3.  **Admin Gate**: Request appears in the global Admin pool ([admin.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/routers/admin.py)).
    - Admin provides final authorization.
4.  **Traceability**: Every status change is timestamped and identifies the `approver_id`.

## 📜 Retrospective AI Audit (Audit Trail)
Unlike real-time filtering, Lumina uses a "Logged Governance" model:
- **Logging**: [ai_tutor.py:L186](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/routers/ai_tutor.py#L186) inserts every AI-first interaction into `ai_answer_queue`.
- **Verification**: Status `INSTANT_VOICE` identifies interactions that bypassed the standard academic review for speed.

## ⚠️ Failure Points & Risk Analysis

### Failure Points
- **Approval Deadlock (Orphaned Requests)**: If a teacher's department ID in `users` table is mismatched with the HOD's department, approval requests become "invisible" to the HOD.
- **Role Hijacking**: If RBAC is improperly configured in [auth.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/routers/auth.py), a non-governance user could potentially trigger `approve_request_by_hod`.
- **Audit Queue Saturation**: If the `ai_answer_queue` volume exceeds the manual review capacity of the HOD/Admin, governance oversight becomes purely theoretical.

### Risk Level: MEDIUM
- **Reasoning**: Governance is critical for compliance and institutional trust, but it does not block the real-time learning path for students (as AI Tier-1 is instant). The primary risk is administrative delay and RBAC misconfiguration.

