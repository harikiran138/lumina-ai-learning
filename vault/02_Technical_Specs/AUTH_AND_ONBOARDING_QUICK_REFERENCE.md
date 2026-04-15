# 🚀 Quick Start: Login, Signup & Onboarding

**For:** Developers, QA, Product Teams  
**Last Updated:** April 15, 2026

---

## 🎯 Quick Navigation

### User Stories

| User Type | Flow | Route | Time |
|-----------|------|-------|------|
| **New Student** | Signup → Onboarding → Dashboard | `/register` → `/onboarding` → `/student/dashboard` | 5-10 min |
| **Existing Student** | Login → Dashboard (if onboarded) | `/login` → `/student/dashboard` | 2-3 min |
| **Teacher/Faculty** | Signup/Login → Optional Onboarding → Dashboard | `/login` or `/register` → `/teacher/dashboard` | 2-3 min |
| **Admin** | Login → Dashboard (no onboarding) | `/login` → `/admin/dashboard` | 1-2 min |
| **Parent** | Signup → Onboarding → Dashboard | `/register` → `/onboarding` → `/parent/dashboard` | 5 min |
| **Peer Tutor** | Signup → Onboarding → Dashboard | `/register` → `/onboarding` → `/peer_tutor/dashboard` | 5 min |
| **Counselor** | Signup → Onboarding → Dashboard | `/register` → `/onboarding` → `/counselor/dashboard` | 5 min |

---

## 📋 Three-Phase Flow

### Phase 1: Sign Up (User Creates Account)
```
┌─────────────────────────────────────────────────────┐
│                   Sign Up Flow                      │
├─────────────────────────────────────────────────────┤
│ 1. Visit /register                                  │
│ 2. Select role (student, teacher, parent, etc.)    │
│ 3. Enter email, password, name                      │
│ 4. Submit → POST /api/auth/register                │
│ 5. Credentials validated, user created             │
│ 6. JWT token received, stored in sessionStorage    │
│ 7. Redirect to /onboarding                         │
└─────────────────────────────────────────────────────┘
```

**Valid Signup Roles:**
student, teacher, parent, mentor, peer_tutor, researcher, alumni, content_creator, counselor

**Invalid (Invite-Only):**
faculty, HOD, admin, system_admin

---

### Phase 2: Login (User Proves Identity)
```
┌─────────────────────────────────────────────────────┐
│                   Login Flow                        │
├─────────────────────────────────────────────────────┤
│ 1. Visit /login                                     │
│ 2. Select role (student, teacher, admin, etc.)     │
│ 3. Enter identifier (email/roll/emp_id)            │
│ 4. Enter password                                   │
│ 5. Submit → POST /api/auth/token                   │
│ 6. Password verified, JWT token created            │
│ 7. Token stored in sessionStorage                  │
│ 8. Check onboardingCompleted status               │
│    ├─ If FALSE → Redirect to /onboarding          │
│    └─ If TRUE → Redirect to role dashboard        │
└─────────────────────────────────────────────────────┘
```

**Identifier Types:**
- Email: `john@example.com`
- Roll Number: `25NU1A1001` (pattern: `\d{2}NU\dA\d{4}`)
- Employee ID: `FAC001`, `HOD001`, `ADM001`

**Security:**
- Brute-force lock: 5 failed attempts → 15-minute lockout
- Password requirements: 8+ chars, 1 uppercase, 1 digit

---

### Phase 3: Onboarding (User Completes Guided Setup)
```
┌──────────────────────────────────────────────────────┐
│                Onboarding Flow                       │
├──────────────────────────────────────────────────────┤
│                                                      │
│  STUDENT PATH:                                       │
│  1. Choose/Create College                            │
│  2. Select Department                                │
│  3. Select Batch/Year                                │
│  4. Enter Roll Number                                │
│  5. Complete Adaptive Learning Style Quiz            │
│  6. Set Preferences (goals, study time, etc.)       │
│  7. Review & Complete                                │
│  → POST /api/onboarding/complete                    │
│  → Redirect to /student/dashboard                   │
│                                                      │
│  NON-STUDENT PATHS:                                  │
│  1. Profile Setup (photo, bio, etc.)                │
│  2. Role-Specific Data (department, skills, etc.)   │
│  3. Institutional Affiliation                        │
│  4. Preferences (language, timezone, etc.)          │
│  5. Review & Complete                                │
│  → POST /api/onboarding/complete                    │
│  → Redirect to role-specific dashboard              │
│                                                      │
│  SKIPPED FOR:                                        │
│  - admin, system_admin, super_admin                  │
│  → Flash "Onboarding skipped" message               │
│  → Direct redirect to dashboard                      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Data Saved During Onboarding:**
```
Student:
- college_id
- department_id
- batch_id
- roll_number
- learning_style (from quiz)
- goals, preferences

Other Roles:
- profile_photo
- qualifications
- availability
- institution_affiliation
- preferences (timezone, language)
```

**Completion Check:**
```python
if user.onboarding_completed == True:
    → Go to dashboard
else:
    → Go to /onboarding
```

---

## 🛣️ Routes Map

### Authentication Routes (`/api/auth`)

| HTTP | Endpoint | Public | Purpose |
|------|----------|--------|---------|
| POST | `/register` | ✓ | Create new account |
| POST | `/token` | ✓ | Login (get JWT) |
| POST | `/logout` | ✗ | Logout (blacklist token) |
| POST | `/refresh` | ✗ | Refresh expired token (cookie auth) |
| GET | `/me` | ✗ | Get current user |
| POST | `/forgot-password` | ✓ | Request password reset |
| POST | `/reset-password` | ✓ | Confirm password reset |
| POST | `/change-password` | ✗ | Change password (logged in) |

### Onboarding Routes

| HTTP | Endpoint | Public | Purpose |
|------|----------|--------|---------|
| GET | `/onboarding-status` | ✗ | Check onboarding completion |
| POST | `/onboarding/complete` | ✗ | Mark onboarding done |
| POST | `/onboarding/progress` | ✗ | Save progress (draft) |

### Frontend Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/login` | `AuthGateway` (mode=login) | Login page |
| `/register` | `AuthGateway` (mode=signup) | Sign up page |
| `/onboarding` | Onboarding flow pages | Guided setup |
| `/student/dashboard` | Student dashboard | Student home |
| `/teacher/dashboard` | Teacher dashboard | Teacher home |
| `/admin/dashboard` | Admin dashboard | Admin home |
| (+ 8 more role-specific) | Role dashboards | Role homes |

---

## 🔐 Security Summary

### Password Rules
```
✓ Valid: "SecurePass123", "MyPassword99"
✗ Invalid: "password123" (no uppercase)
✗ Invalid: "PASSWORD" (no digit)
✗ Invalid: "Pass1" (too short)
```

### Session Management
```
Access Token:   JWT (HS256), 1-hour expiry
                Minimal claims: sub, role, onboarding flags
Refresh Token:  JWT in secure HttpOnly cookie (not accessible to JS)
                Longer TTL, rotated on each use (old token blacklisted)
Refresh:        via /api/auth/refresh (reads cookie automatically)
Storage:        localStorage (persisted), sessionStorage (temporary)
Revocation:     Token blacklist (Redis) for old refresh tokens
```

### Brute-Force Protection
```
Threshold:      5 failed attempts
Lockout Time:   15 minutes (per identifier + role)
Tracked By:     Redis
```

---

## 📁 File Structure

**Frontend:**
```
frontend/web/src/
├── app/
│   ├── login/page.tsx           # Login page
│   ├── register/page.tsx         # Sign up page
│   └── onboarding/page.tsx       # Onboarding entry
├── components/
│   ├── auth/
│   │   ├── AuthGateway.tsx       # Main auth component
│   │   ├── AuthSkeleton.tsx      # Loading state
│   │   └── Guards.tsx             # Route protection
│   └── onboarding/
│       ├── StudentOnboardingFlow.tsx
│       └── RoleOnboardingFlow.tsx
├── store/
│   ├── useAuthStore.ts          # Zustand auth state
│   └── useOnboardingStore.ts    # Onboarding drafts
└── lib/
    ├── schemas/auth.ts           # Zod validation
    └── role-routing.ts           # Role → Dashboard
```

**Backend:**
```
backend/app/
├── routers/
│   └── auth.py                   # All auth endpoints
├── core/
│   ├── security.py               # JWT, bcrypt
│   ├── rbac.py                   # Role rules
│   ├── limiter.py                # Rate limiting
│   └── blacklist.py              # Token revocation
└── store/
    └── user_store.py             # User CRUD
```

**Database:**
```
supabase/migrations/
├── 20260329000001_login_system.sql      # Users, auth tables
└── 20260331000003_auth_subjects_tables.sql
```

---

## ✅ Testing Checklist

### Manual Testing

```bash
# 1. Sign Up Flow
[ ] Navigate to localhost:3000/register
[ ] Select "Student" role
[ ] Fill form: email, password (with uppercase & digit), name
[ ] Confirm password matches
[ ] Submit → Should redirect to /onboarding

# 2. Login Flow
[ ] Navigate to localhost:3000/login
[ ] Select "Student" role
[ ] Enter credentials
[ ] Submit → Should redirect to /student/dashboard

# 3. Onboarding (if Student)
[ ] Start if redirected from signup
[ ] Fill college info
[ ] Take learning style quiz
[ ] Save preferences
[ ] Click "Complete Onboarding"
[ ] Should redirect to /student/dashboard

# 4. Logout
[ ] Click logout in dashboard/header
[ ] Token should be blacklisted
[ ] Redirect to /login
[ ] Accessing /dashboard should fail

# 5. Password Reset
[ ] Navigate to /reset-password
[ ] Enter email
[ ] Check email for reset link
[ ] Click link, enter new password
[ ] Login with new password
```

### API Testing (cURL)

```bash
# Sign Up
curl -X POST http://localhost:9000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "full_name": "Test User",
    "role": "student"
  }'

# Login
curl -X POST http://localhost:9000/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "test@example.com",
    "password": "TestPass123",
    "role_hint": "student"
  }'

# Get Current User
curl -X GET http://localhost:9000/api/auth/me \
  -H "Authorization: Bearer <token>"

# Get Onboarding Status
curl -X GET http://localhost:9000/api/onboarding-status \
  -H "Authorization: Bearer <token>"

# Complete Onboarding
curl -X POST http://localhost:9000/api/onboarding/complete \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## 🚨 Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "Invalid credentials" on login | Wrong email/password or account doesn't exist | Check email is spelled correctly, try signup if new user |
| "Account locked" | 5 failed login attempts | Wait 15 minutes or contact admin |
| Stuck on /onboarding | Backend endpoint error or network issue | Check browser console, verify API URL, check backend logs |
| Token expired | JWT expiry reached | Refresh token via /api/auth/refresh or login again |
| Redirect loop | Middleware issue or onboarding status mismatch | Clear localStorage, check backend onboarding_completed flag |
| "Email already exists" on signup | Email is already registered | Try login instead or use different email |
| Password validation fails | Doesn't meet complexity | Ensure 8+ chars, 1 uppercase, 1 digit, e.g. "Pass123" |

---

## 🔗 Full Documentation

**For detailed information, see:** [AUTH_AND_ONBOARDING_FLOW.md](AUTH_AND_ONBOARDING_FLOW.md)

Topics covered:
- Complete system architecture
- Step-by-step user journeys
- Full database schema
- All API endpoints with examples
- Security & validation rules
- Role-based access control
- Troubleshooting guide

---

## 📞 Support

**Issues?**
1. Check this document first
2. Review full documentation (link above)
3. Check backend logs: `docker logs backend`
4. Check browser console: `F12 → Console`
5. Check API status: `curl http://localhost:9000/health`

**Questions?**
- Platform Architecture Team
- Last Updated: April 15, 2026
