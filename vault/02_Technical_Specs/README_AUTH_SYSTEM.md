# 🔐 Authentication System - Complete Guide

**Location:** `vault/02_Technical_Specs/`  
**Last Updated:** April 15, 2026  
**Status:** ✅ Current Implementation (April 2026)

---

## 📚 Documentation Map

This folder contains complete documentation for Lumina's authentication, signup, and onboarding systems.

### Start Here 👈

**For Quick Overview:**
→ Read [AUTH_AND_ONBOARDING_QUICK_REFERENCE.md](AUTH_AND_ONBOARDING_QUICK_REFERENCE.md) (5-10 min)

**For Complete Details:**
→ Read [AUTH_AND_ONBOARDING_FLOW.md](AUTH_AND_ONBOARDING_FLOW.md) (20-30 min)

---

## 📖 Document Descriptions

### 1. AUTH_AND_ONBOARDING_QUICK_REFERENCE.md
**Length:** ~500 lines  
**Audience:** Developers, QA, Product Managers  
**Purpose:** Quick lookup, testing checklist, common issues

**Contains:**
- 🎯 Quick navigation by user type
- 🛣️ Routes map (frontend + backend)
- 📋 Three-phase flow diagram
- ✅ Manual testing checklist
- 🚨 Common issues & fixes
- 📁 File structure overview

**Use When:**
- Setting up local environment
- Writing test cases
- Debugging issues
- Learning the system quickly

---

### 2. AUTH_AND_ONBOARDING_FLOW.md
**Length:** ~1500 lines  
**Audience:** Backend developers, architects, QA leads  
**Purpose:** Complete technical reference

**Contains:**
- 📊 System overview & architecture
- 👤 Sign up flow (step-by-step)
- 🔑 Login flow (step-by-step)
- 📝 Onboarding flow (all roles)
- 💾 Database schema (7 tables)
- 🔌 API endpoints (all with examples)
- 🔐 Security & validation rules
- 👥 Role-based access control

**Use When:**
- Implementing new features
- Modifying authentication logic
- Adding new roles
- Understanding data flow
- Writing API documentation
- Debugging complex issues

---

## 🎯 Quick Paths by Role

### I'm a Frontend Developer
1. Read: Quick Reference [Routes section](AUTH_AND_ONBOARDING_QUICK_REFERENCE.md)
2. Study: `components/auth/AuthGateway.tsx`
3. Understand: Zustand store in `store/useAuthStore.ts`
4. Reference: Full Flow [Sign Up](AUTH_AND_ONBOARDING_FLOW.md#sign-up-flow) & [Login](AUTH_AND_ONBOARDING_FLOW.md#login-flow) sections

### I'm a Backend Developer
1. Read: Full Flow documentation completely
2. Study: `backend/app/routers/auth.py`
3. Understand: Security layer in `backend/app/core/`
4. Reference: [Database Schema](AUTH_AND_ONBOARDING_FLOW.md#database-schema) & [API Endpoints](AUTH_AND_ONBOARDING_FLOW.md#api-endpoints)

### I'm QA / Testing
1. Read: Quick Reference [Testing Checklist](AUTH_AND_ONBOARDING_QUICK_REFERENCE.md#-testing-checklist)
2. Review: Test cases in `vault/02_Technical_Specs/testing/runbooks/TC-AUTH.md`
3. Use: cURL examples from both docs
4. Reference: Common Issues section

### I'm a Product Manager
1. Read: Quick Reference [Three-Phase Flow](AUTH_AND_ONBOARDING_QUICK_REFERENCE.md#-three-phase-flow)
2. Review: User Stories table
3. Understand: Role classification in Full Flow
4. Reference: Feature checklist

### I'm an Architect/Decision Maker
1. Read: Full Flow [System Overview](AUTH_AND_ONBOARDING_FLOW.md#system-overview)
2. Review: [Role-Based Access](AUTH_AND_ONBOARDING_FLOW.md#role-based-access)
3. Understand: [Security Model](AUTH_AND_ONBOARDING_FLOW.md#security--validation)
4. Reference: Implementation checklist for gaps

---

## 🔗 Related Documents

**In this folder:**
- [ACADEMIC_HIERARCHY_AND_ONBOARDING.md](ACADEMIC_HIERARCHY_AND_ONBOARDING.md) - Role hierarchy & permissions
- [testing/runbooks/TC-AUTH.md](testing/runbooks/TC-AUTH.md) - Test cases (detailed)

**In parent folders:**
- `vault/01_Core/SYSTEM_DOCUMENTATION.md` - System architecture overview
- `vault/01_Core/MANIFEST.md` - File manifest & components list
- `vault/DECISION_FLOW.md` - Authentication decisions

**In code:**
- `backend/app/routers/auth.py` - Backend implementation
- `frontend/web/src/components/auth/AuthGateway.tsx` - Frontend implementation
- `supabase/migrations/20260329000001_login_system.sql` - Database schema

---

## 🎯 Key Features Documented

### ✅ Sign Up System
- Multi-role signup (9 roles supported)
- Email validation
- Password complexity (8+ chars, 1 uppercase, 1 digit)
- Self vs. invite-only roles
- JWT token generation

### ✅ Login System
- Multi-identifier support (email, roll number, employee ID)
- Brute-force protection (5 attempts → 15 min lockout)
- Password verification
- Role-based routing
- Optional password change enforcement

### ✅ Onboarding System
- Role-specific flows (12 roles with flows)
- Student: College/batch selection + learning style quiz
- Others: Profile + preferences + role-specific data
- Draft persistence (sessionStorage)
- Adaptive learning profiling
- Completion tracking

### ✅ Security Features
- bcrypt password hashing (10 salt rounds)
- JWT tokens (HS256, 1-hour expiry)
- Token blacklisting on logout
- Rate limiting (100 req/min)
- CORS & security headers
- Audit logging

### ✅ Role Management
- 13+ roles with distinct permissions
- Role normalization
- Self-signup vs. invite-only distinction
- Bypass logic for admin roles
- Permission matrix per role

---

## 🔄 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER JOURNEY                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [New User] → [/register] → [AuthGateway Signup]          │
│       ↓                                                    │
│  [Select Role, Enter Email/Password/Name]                 │
│       ↓                                                    │
│  [Frontend: POST /api/auth/register]                       │
│       ↓                                                    │
│  [Backend: Validate, Hash, Store in DB]                   │
│       ↓                                                    │
│  [Return JWT + User + onboardingCompleted=false]          │
│       ↓                                                    │
│  [Frontend: Store token, Redirect to /onboarding]         │
│       ↓                                                    │
│  ┌─────────────────────────────────────┐                  │
│  │   ONBOARDING (Role-Specific)        │                  │
│  │                                     │                  │
│  │  Student: College + Quiz            │                  │
│  │  Others: Profile + Preferences      │                  │
│  │                                     │                  │
│  │  [POST /api/onboarding/complete]   │                  │
│  └─────────────────────────────────────┘                  │
│       ↓                                                    │
│  [Backend: Update onboardingCompleted=true]              │
│       ↓                                                    │
│  [Frontend: Redirect to /[role]/dashboard]               │
│       ↓                                                    │
│  [LOGGED IN - Access granted to role features]           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [Existing User] → [/login] → [AuthGateway Login]         │
│       ↓                                                    │
│  [Select Role, Enter Email/Password]                      │
│       ↓                                                    │
│  [Frontend: POST /api/auth/token]                          │
│       ↓                                                    │
│  [Backend: Verify Password, Check Onboarding Status]     │
│       ↓                                                    │
│  [Return JWT + User + onboardingCompleted]               │
│       ↓                                                    │
│  [Frontend: Check onboardingCompleted]                    │
│       ├─ If false: Redirect to /onboarding                │
│       └─ If true: Redirect to /[role]/dashboard          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing & Validation

### Unit Tests
Located in: `backend/tests/test_auth.py` (if exists)
- Password validation
- Email validation
- Token generation
- Role normalization

### Integration Tests
Located in: `TC-AUTH.md`
- Full signup flow
- Full login flow
- Onboarding completion
- Password reset
- Logout/blacklist

### Manual Testing
See: [AUTH_AND_ONBOARDING_QUICK_REFERENCE.md - Testing Checklist](AUTH_AND_ONBOARDING_QUICK_REFERENCE.md#-testing-checklist)

### Test Credentials
**Student:**
- Email: `student@example.com`
- Password: `StudentPass123`
- Roll: `25NU1A1001`

**Teacher:**
- Email: `teacher@example.com`
- Password: `TeacherPass123`
- Emp: `FAC001`

**Admin:**
- Email: `admin@example.com`
- Password: `AdminPass123`

---

## 🚀 Implementation Status

### Complete ✅
- [x] Sign up endpoint & validation
- [x] Login endpoint & validation
- [x] JWT token generation & management
- [x] Password reset flow
- [x] Onboarding status tracking
- [x] Brute-force protection
- [x] Role-based routing
- [x] Token blacklisting
- [x] Audit logging

### Planned 📋
- [ ] Email confirmation
- [ ] Two-factor authentication
- [ ] SSO integration (Google, GitHub, etc.)
- [ ] Social login
- [ ] Passwordless authentication
- [ ] Biometric login (for mobile)

---

## 📞 Support & Questions

**Need help?**

1. **Quick answers:** Check [Quick Reference Common Issues](AUTH_AND_ONBOARDING_QUICK_REFERENCE.md#-common-issues--fixes)
2. **Detailed info:** Search relevant section in [AUTH_AND_ONBOARDING_FLOW.md](AUTH_AND_ONBOARDING_FLOW.md)
3. **Specific endpoint:** Reference [API Endpoints section](AUTH_AND_ONBOARDING_FLOW.md#api-endpoints)
4. **Test case:** Review [TC-AUTH.md](testing/runbooks/TC-AUTH.md)
5. **Bug report:** Check backend logs & frontend console

**Documentation Issues:**
- Update date: April 15, 2026
- Maintainer: Platform Architecture Team
- Review Cycle: Quarterly

---

## 🔍 Quick Index

**Files & Folders:**
- Frontend Auth: `frontend/web/src/components/auth/`
- Frontend Pages: `frontend/web/src/app/{login,register,onboarding}/`
- Backend Router: `backend/app/routers/auth.py`
- Backend Core: `backend/app/core/{security,rbac,limiter,blacklist}.py`
- Database: `supabase/migrations/20260329000001_login_system.sql`
- Tests: `vault/02_Technical_Specs/testing/runbooks/TC-AUTH.md`

**Related Docs:**
- Full System: `vault/01_Core/SYSTEM_DOCUMENTATION.md`
- Decisions: `vault/DECISION_FLOW.md`
- Manifest: `vault/01_Core/MANIFEST.md`
- Hierarchy: `ACADEMIC_HIERARCHY_AND_ONBOARDING.md` (this folder)

**API Base:** `http://localhost:9000/api/auth`  
**Frontend Base:** `http://localhost:3000`

---

## 📝 Changelog

| Date | Change | Version |
|------|--------|---------|
| 2026-04-15 | Complete documentation created covering login, signup, onboarding flows | v1.0 |
| - | - | - |

---

**Next Steps:**
1. ✅ Read this index
2. ✅ Choose your path above based on your role
3. ✅ Read the relevant documentation
4. ✅ Reference code files
5. ✅ Test using provided examples
6. ✅ Refer back to docs as needed

Happy coding! 🚀
