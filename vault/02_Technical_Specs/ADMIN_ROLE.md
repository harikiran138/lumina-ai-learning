# Admin Role — Login, Sidebar & Feature Connections

## 1. Login

### How to Log In
Navigate to `/login`. Use the **Sign In** tab.

> Admin accounts cannot self-register. They must be created via the database seed script (`backend/seed_user.py`) or by another admin promoting a user.

**Demo account (development only):**
```
Email:    admin@lumina.com
Password: Admin@123
```

### What Happens on Login
```
POST /api/auth/token  →  JWT token (8-day expiry)
GET  /api/auth/me     →  User profile (id, email, name, role: "admin")
sessionStorage.setItem("lumina_token", token)
sessionStorage.setItem("lumina_user", JSON.stringify(user))
Redirect → /admin/dashboard
```

---

## 2. Sidebar Navigation

All admin pages live under `/admin/` with a hover-expanding sidebar (icon-only when collapsed, full width on hover).

| Menu Item | Route | Purpose |
|-----------|-------|---------|
| Dashboard | `/admin/dashboard` | System-wide stats |
| Users | `/admin/users` | Manage all users |
| System | `/admin/system` | System health & config |
| Security | `/admin/security` | Security alerts & audit logs |
| Settings | `/admin/settings` | Platform settings |

---

## 3. Page-by-Page Feature Map

### `/admin/dashboard`
**Backend:** `GET /api/admin/dashboard`
**Returns:**
```json
{
  "totalUsers": 120,
  "totalCourses": 18,
  "activeUsers": 120,
  "systemStatus": "healthy"
}
```
**UI:** Stat cards for Users / Courses / System Health / Security Alerts.

---

### `/admin/users`
**Backend calls used by this page:**
```
GET  /api/admin/users                     → all users (no passwords returned)
POST /api/admin/users/{userId}/status
     ?status=active|suspended|inactive    → change user status
POST /api/admin/users/{userId}/role
     ?role=student|teacher|admin          → change user role
DELETE /api/admin/users/{userId}          → permanently delete user
```

**User object shape:**
```json
{
  "id": "uuid",
  "email": "user@email.com",
  "name": "Full Name",
  "role": "student|teacher|admin",
  "status": "active|suspended|inactive",
  "created_at": "2025-01-01T00:00:00"
}
```

---

### `/admin/system`
Displays system health information including:
- Database connection status (Supabase)
- Redis/Celery worker status
- AI model availability

---

### `/admin/security`
**Backend:**
```
GET /api/admin/logs/chat   → last 100 tutor conversation logs
GET /api/admin/logs/ai     → last 100 AI interaction logs
DELETE /api/admin/logs/ai/{logId}  → delete a log entry
```

---

## 4. Admin-Only API Endpoints

All admin routes require `role: "admin"` in the JWT. Returns `403 Forbidden` otherwise.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | System-wide stats |
| GET | `/api/admin/users` | List all users |
| DELETE | `/api/admin/users/{id}` | Delete user |
| POST | `/api/admin/users/{id}/status?status=` | Change user status |
| POST | `/api/admin/users/{id}/role?role=` | Change user role |
| GET | `/api/admin/courses` | List all courses |
| GET | `/api/admin/logs/ai` | AI interaction logs |
| DELETE | `/api/admin/logs/ai/{id}` | Delete AI log |
| GET | `/api/admin/logs/chat` | Chat conversation logs |
| GET | `/api/admin/students-progress` | All students' assessment progress |

---

## 5. Promoting a User to Admin

Since admin accounts can't self-register via the UI, use one of these methods:

**Option A — Via another admin's Users page:**
1. Log in as admin
2. Go to `/admin/users`
3. Find the user
4. Click role dropdown → select "admin"

**Option B — Seed script:**
```bash
cd backend
python seed_user.py
```

**Option C — Direct Supabase query:**
```sql
UPDATE users SET role = 'admin' WHERE email = 'user@example.com';
```

---

## 6. Data Flow Diagram

```
Browser (sessionStorage: token + user)
    │
    ├── GET /api/admin/dashboard          ──► Supabase (users, courses — count queries)
    ├── GET /api/admin/users              ──► UserStore ──► Supabase (users)
    ├── POST /api/admin/users/{id}/role   ──► UserStore.update_user_role() ──► Supabase
    ├── DELETE /api/admin/users/{id}      ──► UserStore.delete_user() ──► Supabase
    ├── GET /api/admin/logs/ai            ──► Supabase (ai_logs)
    ├── GET /api/admin/logs/chat          ──► Supabase (conversations)
    └── GET /api/admin/students-progress  ──► Supabase (assessment_sessions — aggregated)
```
