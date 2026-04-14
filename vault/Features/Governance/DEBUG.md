# Debug Playbook: Governance & Oversight

Use this guide to diagnose issues with the institutional approval chain and policy enforcement.

## 🚨 Common Failure Scenarios

### 1. Approval Deadlock (Stuck Request)
- **Symptoms**: An assignment is graded by a teacher but remains "Pending Approval" for an extended period.
- **Check**:
    - **Logic**: Inspect [hod.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/routers/hod.py).
    - **Status**: Check if the request is correctly flagged for the specific HOD's department.
- **Resolution**: Re-trigger the approval signal or manually update the `approval_status` if the HOD is unreachable.

### 2. Teacher Request Approval Loop
- **Symptoms**: Teacher request stuck even after HOD approval.
- **Check**: [faculties.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/routers/faculties.py). 
    - **Logic**: HOD approval sets status to `PENDING_ADMIN`.
    - **Verify**: `SELECT status FROM teacher_requests WHERE id = '...';`
- **Manual Override**: If the system doesn't auto-promote, check [teacher_store.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/store/teacher_store.py) → `approve_request_by_admin()`.

### 3. Policy Block (R-003 Compliance)
- **Symptoms**: Requests are being rejected unexpectedly.
- **Check**: Governance policies in the `institutions` table. Check if the `submission_deadline_grace` period is being strictly enforced.

## 🛠 Step-by-Step Debug Path
1. **Request Chain Audit**:
   `SELECT id, teacher_id, status FROM assignments WHERE status ILIKE '%pending%';`
2. **Permission Check**: 
   Verify if the HOD has the correct `role_id` in the `user_roles` mapping.
3. **Logic Flow**:
    - [hod.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/routers/hod.py) (Department Head level)
    - [admin.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/routers/admin.py) (Institution level)

## 📊 Error Code/Log to Watch
- `HOD_UNAUTHORIZED_APPROVAL`: An attempt by a non-HOD to approve a departmental grade.
- `ADMIN_ACTION_BLOCKED`: Institutional policy preventing a manual override.

---
[[DEPENDENCY_MAP]] | [[Features/Governance/Backend]] | [[Features/Governance/Flow]]
