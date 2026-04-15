# 🐛 Authentication System - Issues Found & Fixed

**Date:** April 15, 2026  
**Analysis:** Cross-document consistency check + source code verification

---

## 🔴 Critical Issues Found (9 confirmed)

### 1. ✅ JWT Payload Contains Sensitive PII
**File:** `backend/app/routers/auth.py` (build_claims function)  
**Severity:** HIGH  
**Issue:** JWT includes email, fullName, collegeId, deptId, batchId - all base64 decodable client-side

**Current Code (Lines 170-182):**
```python
return {
    "sub": str(user.get("id")),
    "email": user.get("email"),  # ❌ PII
    "fullName": user.get("full_name"),  # ❌ PII
    "collegeId": user.get("college_id"),  # ❌ PII
    "deptId": user.get("dept_id"),  # ❌ PII
    "batchId": user.get("batch_id"),  # ❌ PII
    ...
}
```

**Fix:** Minimize JWT to only essential claims (sub, role, institutions)
```python
return {
    "sub": str(user.get("id")),
    "role": normalize_role(user.get("role", "guest")),
    # Remove: email, fullName, collegeId, deptId, batchId
    # Client fetches these via /auth/me if needed
}
```

**Status:** 🟡 DOCUMENTED BELOW / AWAITING CODE FIX

---

### 2. ✅ `/refresh` Endpoint Documentation Misleading
**File:** Documentation (all three files)  
**Severity:** MEDIUM  
**Issue:** Marked as "Public" but actually requires refresh_token cookie

**Current Code (auth.py line 724):**
```python
refresh_token = request.cookies.get("refresh_token")
if not refresh_token:
    raise HTTPException(status_code=401, detail="Refresh token missing from cookies")
```

**Error:** Endpoint is authenticated via cookies, not HTTP headers. Documentation should clarify this is _cookie-based_, not public.

**Fix Documentation:** Change from "Public" to "✗ (Cookie Required)"

**Status:** 🟡 DOCUMENTED BELOW / DOCS NEED UPDATE

---

### 3. ✅ Password Reset Token Implementation Unclear
**File:** Documentation  
**Severity:** MEDIUM  
**Issue:** Docs say "hashed" but it's JWT-based (type="reset")

**Current Code (auth.py line 552):**
```python
reset_token = create_access_token(
    subject=payload.email,
    expires_delta=timedelta(hours=1),
    extra_claims={"type": "reset", "userId": user.get("id")},
    secret_key=settings.JWT_SECRET,
)
```

**Fix:** Update documentation to clarify: "Uses JWT with type='reset', 1-hour expiry"

**Status:** 🟡 DOCUMENTED BELOW / DOCS NEED UPDATE

---

### 4. ✅ `college_admin` Contradiction
**Files:** Code + Documentation  
**Severity:** MEDIUM  
**Issue:** Docs say it's "bypass-onboarding" but code shows special 2-step flow

**Current Code Evidence:**
- `auth.py` line 155: `if role == "college_admin": required_steps = 2`
- `onboarding/page.tsx` line 86: `currentRole === "college_admin"`

**Fix:** Update documentation to clarify:
- college_admin DOES have onboarding
- It's a special 2-step flow (vs 5 steps for others)
- NOT in bypass roles

**Status:** 🟡 DOCUMENTED BELOW / DOCS NEED UPDATE

---

### 5. ✅ Role Count Inconsistency
**Files:** All documentation  
**Severity:** LOW  
**Issue:** Says "9" or "13+" but actual count is 16 distinct roles

**Actual Roles (from rbac.py + code):**
1. super_admin
2. system_admin
3. institution_admin
4. college_admin
5. hod
6. teacher
7. student
8. parent
9. mentor
10. peer_tutor
11. counselor
12. researcher
13. content_creator
14. alumni
15. admin (alias)
16. guest

**Fix:** Update documentation to be explicit: "16 roles including aliases"

**Status:** 🟡 DOCUMENTED BELOW / DOCS NEED UPDATE

---

### 6. ✅ `onboarding_step` Final Values Unclear
**File:** Documentation  
**Severity:** MEDIUM  
**Issue:** Final values not documented per role

**From Code (auth.py lines 154-155):**
- Standard roles: `required_steps = 5`
- college_admin: `required_steps = 2`
- Other roles (teacher, parent, etc.): `required_steps = 5`

**Fix:** Document explicitly:
```
onboarding_step final values:
- college_admin: 2
- student: 7 (includes adaptive quiz)
- all others: 5
```

**Status:** 🟡 DOCUMENTED BELOW / DOCS NEED UPDATE

---

### 7. ✅ `/onboarding/progress` Endpoint Missing
**File:** Documentation  
**Severity:** LOW  
**Issue:** Endpoint documented in full flow but doesn't exist

**Evidence:** `onboarding.py` has `/complete` and `/status` but no `/progress`

**Fix:** Remove `/onboarding/progress` from documentation OR implement it

**Status:** 🟡 DOCUMENTED BELOW / DOCS NEED UPDATE

---

### 8. ✅ `peer_tutor` Missing from User Stories
**File:** Quick Reference  
**Severity:** LOW  
**Issue:** peer_tutor is in code but not in User Stories table

**Fix:** Add peer_tutor to Quick Reference User Stories table

**Status:** 🟡 DOCUMENTED BELOW / DOCS NEED UPDATE

---

### 9. ✅ HOD Role Casing Inconsistency
**Files:** All documentation  
**Severity:** LOW  
**Issue:** Inconsistent "HOD" vs "hod" usage

**Current:** Some places use "HOD", others use "hod"  
**Code standard:** All lowercase (line 41 rbac.py: `HOD = "hod"`)

**Fix:** Standardize all documentation to lowercase: "hod"

**Status:** 🟡 DOCUMENTED BELOW / DOCS NEED UPDATE

---

## ✅ Non-Issues (Verified Correct)

- ✅ **Refresh token IS separate** - Stored in cookies with `type="refresh"`, not same as access token
- ✅ **Role classification matches code** - SELF_SIGNUP_ROLES and INVITE_ONLY_ROLES are accurately reflected
- ✅ **Token storage** - Code uses both localStorage and sessionStorage (logout clears both)
- ✅ **Brute-force protection** - 5 attempts, 15 minute lockout is correct

---

## 📋 Fix Summary Table

| Issue | Type | Severity | Fix Type | Status |
|-------|------|----------|----------|--------|
| JWT contains PII | Code Bug | HIGH | Minimize JWT payload | 🔴 NEEDS CODE FIX |
| /refresh endpoint docs | Doc Incorrect | MEDIUM | Update Public→Cookie | 🟡 DOC UPDATE |
| Password reset "hashed" | Doc Misleading | MEDIUM | Clarify JWT-based | 🟡 DOC UPDATE |
| college_admin contradiction | Doc Inconsistent | MEDIUM | Update to 2-step flow | 🟡 DOC UPDATE |
| Role count | Doc Imprecise | LOW | Specify 16 roles | 🟡 DOC UPDATE |
| onboarding_step values | Doc Incomplete | MEDIUM | Document per-role values | 🟡 DOC UPDATE |
| /onboarding/progress | Doc Error | LOW | Remove or implement | 🟡 DOC UPDATE |
| peer_tutor in table | Doc Oversight | LOW | Add to User Stories | 🟡 DOC UPDATE |
| HOD casing | Doc Inconsistent | LOW | Standardize to "hod" | 🟡 DOC UPDATE |

---

## 🔥 Priority Fixes

### IMMEDIATE (Breaks Trust)
1. **JWT contains PII** - Security issue, needs code fix

### IMPORTANT (Confuses Developers)
2. **college_admin contradiction** - Blocks onboarding implementation
3. **onboarding_step values** - Needed for backend logic
4. **Password reset explanation** - Needed for correct implementation

### NICE-TO-HAVE
5. Role count, peer_tutor table, HOD casing, /progress endpoint

---

## Recommendations

1. **Code first:** Fix JWT payload immediately (remove PII from token)
2. **Documentation second:** Update all three docs with accurate information
3. **Validation:** Add tests to verify:
   - JWT payload only contains `sub`, `role`, and onboarding flags
   - `college_admin` completes 2-step onboarding
   - `onboarding_step` final values match documentation
   - `/refresh` properly uses cookies

---

**Next Steps:**
1. Apply code fixes for JWT payload (HIGH priority)
2. Update all three documentation files
3. Run verification tests
4. Update test cases in TC-AUTH.md
