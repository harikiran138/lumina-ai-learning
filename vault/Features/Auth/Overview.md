# Auth & Security: Overview

The **Identity & Access** feature is the gatekeeper of the Lumina ecosystem. It enforces a strict, multi-identifier login system (Email, Roll Number, or Employee ID) and a robust protection layer (Sentinel L5) to prevent unauthorized access.

## 🎯 Purpose
- **Identity Multi-Tenancy**: Resolves users across multiple institutional domains (Student, Faculty, Admin).
- **Brute-Force Protection**: Implements lockout periods and attempt tracking via the `login_attempts` table.
- **Onboarding Orchestration**: Redirects users based on their lifecycle status (e.g., `onboarding_step` and `adaptive_onboarding_completed`).

## 🧩 Core Components
- **Backend Router**: [auth.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/routers/auth.py)
- **Security Logic**: `backend/app/core/security.py`
- **User Store**: [user_store.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/store/user_store.py)
- **Frontend Store**: `frontend/web/src/store/useAuthStore.ts`

## 🛡 Security Mechanisms
1. **JWT Rotation**: Uses Access (Short-lived) and Refresh (Long-lived) tokens with Redis-backed revocation.
2. **Identifier Resolution**: Dynamic detection using institutional regex patterns.
3. **Audit Trail**: Every authentication event is captured via `audit_logger` for governance compliance.

### 🔗 Related Paths
- [[Features/Governance/Overview|Institutional RBAC Audit]]
- [[Features/Student/Flow|Onboarding Lifecycle State]]
- [[DECISION_FLOW|Sentinel L5 Protection Cascade]]

---
[[START_HERE]] | [[API|API.md]] | [[Backend|Backend.md]] | [[Frontend|Frontend.md]] | [[Flow|Flow.md]]
