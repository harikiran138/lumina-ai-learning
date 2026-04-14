# Change Impact Analysis (Impact Matrix)

Before making changes, use this matrix to predict side effects and required regression tests.

## 📊 Feature Impact Matrix

| If you change... | You MUST check... | Potential Side Effects |
| :--- | :--- | :--- |
| **Auth Logic** (`routers/auth.py`) | All Portals (Student, Faculty, Admin) | System lockout, token expiration issues, Sentinel blocking. |
| **AI Prompting** (`ai_engine/`) | AI Tutor UI, Token usage metrics | Hallucinations, increased API costs, broken A2UI payloads. |
| **Student Store** (`store/student_store.py`) | Dashboard, Learning Pathways | Streak resets, mastery calculation errors, inconsistent progress. |
| **OCR Pipeline** (`services/ocr.py`) | Teacher Dashboard, Assignment Grading | Data loss in digitized papers, false positives in handwriting recognition. |
| **Governance Flows** (`routers/hod.py`) | Assignment visibility in portals | Infinite approval loops, deadlocked grading status. |
| **DB Schema** (`schema.prisma`) | Entire Backend, Subscriptions | Total system crash, migration lockouts, broken relational queries. |

## 🧩 Shared Component Impact

### 🛠 Backend: Sentinel Middleware
- **Change Risk**: CRITICAL (High)
- **Impact**: Affects every single API call. A failure here is a global outage.
- **Required Test**: Full authentication and RBAC sweep across all roles.

### 🎨 Frontend: Shared Layouts
- **Change Risk**: Medium
- **Impact**: Navigation headers, sidebar states, and role-based conditional rendering.
- **Required Test**: Verification across Mobile, Tablet, and Desktop views for all 5 portals.

## 🚀 Deployment Impact
- **Docker Compose**: Affects local dev parity and CI/CD staging.
- **Environment Variables**: Can break Supabase connection or Sentry reporting if mismatched.

---
[[DEPENDENCY_MAP]] | [[SYSTEM_MAP]] | [[USE_CASES]]
