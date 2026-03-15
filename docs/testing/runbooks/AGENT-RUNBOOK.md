# 🤖 AGENT-RUNBOOK — Step-by-Step Verification Guide for Agents & Students

> **Who this is for:** An AI agent, QA engineer, or student assigned to verify the entire Lumina frontend  
> **Goal:** Run every verification in the correct order and produce a final pass/fail report  
> **Time estimate:** 2–4 hours for full manual verification

---

## ⚠️ BEFORE YOU START — Mandatory Setup

```bash
# STEP 1: Clone the project
git clone <LUMINA_REPO_URL>
cd lumina

# STEP 2: Install dependencies
npm install

# STEP 3: Configure environment
cp .env.example .env

# STEP 4: Fill in .env values (ask team for actual values)
# Required variables:
# VITE_API_URL=http://localhost:5000 (or deployed API URL)
# VITE_APP_NAME=Lumina

# STEP 5: Start the development server
npm run dev

# STEP 6: Confirm the app is running
# Open browser → http://localhost:5173 (Vite default) or http://localhost:3000
# You should see the Lumina login or home page

# STEP 7: Open Browser DevTools (F12)
# Keep the Console and Network tabs available at all times
```

---

## 🔑 Test Accounts Required

Before starting, confirm these accounts exist in the system:

| Account Type | Email | Password | Purpose |
|-------------|-------|----------|---------|
| Standard User | testuser@lumina.com | Test@1234 | General testing |
| Admin User | admin@lumina.com | Admin@1234 | Admin features |
| New User | _(create fresh during TC-AUTH-007)_ | Secure@123 | Registration test |
| Empty User | _(fresh account with no data)_ | — | Empty state tests |

---

## 📋 PHASE 1 — Environment Verification (Do First)

**Checklist — complete all before running any test cases:**

```
[ ] 1. App loads at localhost without errors
[ ] 2. Browser console shows no red errors on initial load
[ ] 3. Network tab shows no failed requests on load
[ ] 4. .env file has VITE_API_URL set correctly
[ ] 5. API base URL is reachable (ping it in browser or Postman)
[ ] 6. Test user accounts can be accessed
[ ] 7. DevTools Network tab is open and recording
```

**If any of the above fail — STOP and fix before proceeding.**

---

## 📋 PHASE 2 — Authentication (TC-AUTH)

**Run these in order. Auth must work before anything else.**

```
STEP 1: TC-AUTH-001 — Verify login page renders at /login
  → Expected: Email field, password field, submit button visible
  → Status: [ ] PASS  [ ] FAIL

STEP 2: TC-AUTH-006 — Verify register page renders at /register
  → Expected: Name, email, password, confirm password fields visible
  → Status: [ ] PASS  [ ] FAIL

STEP 3: TC-AUTH-011 — Verify protected route guard
  → Action: Clear localStorage. Navigate directly to /dashboard
  → Expected: Redirected to /login
  → Status: [ ] PASS  [ ] FAIL

STEP 4: TC-AUTH-002 — Verify successful login
  → Action: Login with testuser@lumina.com / Test@1234
  → Expected: Redirected to /dashboard, user name visible in header
  → Token stored in localStorage/cookies
  → Status: [ ] PASS  [ ] FAIL

IF STEP 4 FAILS → Do NOT continue to Phase 3. Diagnose login issue first.

STEP 5: TC-AUTH-003 — Verify wrong password error
  → Action: Login with testuser@lumina.com / wrongpassword
  → Expected: Error message visible, no redirect, no token stored
  → Status: [ ] PASS  [ ] FAIL

STEP 6: TC-AUTH-005 — Verify empty fields validation
  → Action: Submit login form with empty fields
  → Expected: Validation errors on both fields, no API call
  → Status: [ ] PASS  [ ] FAIL

STEP 7: TC-AUTH-013 — Verify logout
  → Action: Login, then click logout from profile dropdown
  → Expected: Redirected to login, token removed
  → Status: [ ] PASS  [ ] FAIL

STEP 8: TC-AUTH-012 — Verify session persistence
  → Action: Login, then press F5 to refresh
  → Expected: Still logged in after refresh
  → Status: [ ] PASS  [ ] FAIL

STEP 9: TC-AUTH-007 — Register new user
  → Action: Register with fresh email new_[timestamp]@test.com
  → Expected: Success message or redirect to login/dashboard
  → Status: [ ] PASS  [ ] FAIL
```

**Phase 2 Result:** ___/9 tests passed

---

## 📋 PHASE 3 — Navigation (TC-NAV)

**Pre-condition: Logged in as testuser@lumina.com**

```
STEP 1: TC-NAV-001 — All nav links work
  → Action: Click every link in sidebar/navbar one by one
  → Expected: Each renders without crash or 404
  → List all links found:
    [ ] Dashboard
    [ ] Courses
    [ ] Profile
    [ ] Settings
    [ ] Other: ______________
  → Status: [ ] PASS  [ ] FAIL

STEP 2: TC-NAV-005 — 404 page
  → Action: Navigate to /this-page-does-not-exist-abc123
  → Expected: Custom 404 page, not blank or browser default
  → Status: [ ] PASS  [ ] FAIL

STEP 3: TC-NAV-006 — Mobile hamburger
  → Action: Open DevTools, set width to 375px. Find hamburger, click it.
  → Expected: Navigation drawer opens with all links
  → Status: [ ] PASS  [ ] FAIL  [ ] SKIP (if mobile not yet implemented)

STEP 4: TC-NAV-008 — Profile dropdown
  → Action: Click avatar/name in header
  → Expected: Dropdown with Profile, Settings, Logout options
  → Status: [ ] PASS  [ ] FAIL

STEP 5: TC-NAV-003 — Back/Forward navigation
  → Action: Visit 3 pages, use browser back button
  → Expected: Returns to correct previous page each time
  → Status: [ ] PASS  [ ] FAIL
```

**Phase 3 Result:** ___/5 tests passed

---

## 📋 PHASE 4 — Dashboard (TC-DASH)

**Pre-condition: On /dashboard**

```
STEP 1: TC-DASH-001 — Dashboard loads without errors
  → Action: Navigate to /dashboard. Check console for red errors.
  → Expected: No errors, all content visible
  → Status: [ ] PASS  [ ] FAIL

STEP 2: TC-DASH-002 — Personalized greeting
  → Expected: User's name visible on dashboard
  → Status: [ ] PASS  [ ] FAIL

STEP 3: TC-DASH-003 — Stats cards
  → Expected: At least 2 summary cards with data
  → Status: [ ] PASS  [ ] FAIL

STEP 4: TC-DASH-005 — Notification bell
  → Action: Click notification bell icon
  → Expected: Notification panel opens, shows content or "no notifications"
  → Status: [ ] PASS  [ ] FAIL

STEP 5: TC-DASH-006 — Search bar
  → Action: Type "test" in search bar
  → Expected: Results appear, no console error
  → Status: [ ] PASS  [ ] FAIL

STEP 6: TC-DASH-012 — Course progress
  → Expected: Enrolled courses show progress bars with % complete
  → Status: [ ] PASS  [ ] FAIL
```

**Phase 4 Result:** ___/6 tests passed

---

## 📋 PHASE 5 — API Verification (TC-API)

**Open DevTools → Network tab throughout this phase**

```
STEP 1: TC-API-002 — Auth token in headers
  → Action: Perform any API action. Inspect request headers.
  → Expected: Authorization: Bearer <token> present
  → Status: [ ] PASS  [ ] FAIL
  → Token found: [ ] YES  [ ] NO

STEP 2: TC-API-007 — Courses list API
  → Action: Navigate to /courses. Find GET request.
  → Expected: 200 OK, response is array of courses
  → Status: [ ] PASS  [ ] FAIL

STEP 3: TC-API-008 — Course detail API
  → Action: Click a course. Find GET /courses/:id request.
  → Expected: 200 OK, single course object
  → Status: [ ] PASS  [ ] FAIL

STEP 4: TC-API-009 — Auto-logout on expired token
  → Action: Delete auth token from localStorage. Navigate to /dashboard.
  → Expected: Auto-redirected to login
  → Status: [ ] PASS  [ ] FAIL

STEP 5: TC-API-012 — No sensitive data in URLs
  → Action: Check all API request URLs in Network tab
  → Expected: No passwords or tokens in URL query strings
  → Status: [ ] PASS  [ ] FAIL

STEP 6: TC-API-014 — Course enrollment
  → Action: Click Enroll on a course. Check API request.
  → Expected: POST request sent, UI updates to show enrolled
  → Status: [ ] PASS  [ ] FAIL
```

**Phase 5 Result:** ___/6 tests passed

---

## 📋 PHASE 6 — Forms (TC-FORMS)

```
STEP 1: TC-FORM-001 — Required field validation
  → Action: Submit login, register, and profile edit forms empty
  → Expected: Validation errors on all required fields
  → Status: [ ] PASS  [ ] FAIL

STEP 2: TC-FORM-002 — Email format validation
  → Action: Type "notanemail" in login email field, submit
  → Expected: "Invalid email" error shown
  → Status: [ ] PASS  [ ] FAIL

STEP 3: TC-FORM-006 — Submit button disabled during loading
  → Action: Submit login. While loading, try to click submit again.
  → Expected: Button disabled during API call
  → Status: [ ] PASS  [ ] FAIL

STEP 4: TC-FORM-008 — Profile edit save
  → Action: Edit profile name, save, refresh page
  → Expected: Name change persists
  → Status: [ ] PASS  [ ] FAIL

STEP 5: TC-FORM-013 — XSS prevention
  → Action: Enter <script>alert('XSS')</script> in any text field, submit
  → Expected: No alert fires, input shown as escaped text
  → Status: [ ] PASS  [ ] FAIL
```

**Phase 6 Result:** ___/5 tests passed

---

## 📋 PHASE 7 — Components (TC-COMP)

```
STEP 1: TC-COMP-002 — Modal/Dialog
  → Action: Trigger any modal (delete, confirm action)
  → Expected: Opens, Escape closes it, overlay click closes it
  → Status: [ ] PASS  [ ] FAIL

STEP 2: TC-COMP-003 — Toast notifications
  → Action: Save any form successfully
  → Expected: Success toast appears and auto-dismisses
  → Status: [ ] PASS  [ ] FAIL

STEP 3: TC-COMP-004 — Course cards
  → Action: Navigate to /courses
  → Expected: Cards have image, title, description, CTA
  → Status: [ ] PASS  [ ] FAIL

STEP 4: TC-COMP-005 — Progress bars
  → Action: Check dashboard or enrolled course progress bar
  → Expected: Bar fills proportionally to completion %
  → Status: [ ] PASS  [ ] FAIL

STEP 5: TC-COMP-007 — Skeleton loaders
  → Action: Slow network, navigate to /courses
  → Expected: Shimmer/skeleton placeholders while loading
  → Status: [ ] PASS  [ ] FAIL
```

**Phase 7 Result:** ___/5 tests passed

---

## 📋 PHASE 8 — Responsive (Quick Check)

```
STEP 1: Set viewport to 375px (Mobile)
  → Visit Dashboard, Courses, Login pages
  → Check: No horizontal scroll on any page
  → Status: [ ] PASS  [ ] FAIL

STEP 2: Check hamburger menu on mobile
  → Expected: ☰ icon visible, opens full nav drawer
  → Status: [ ] PASS  [ ] FAIL

STEP 3: Set viewport to 768px (Tablet)
  → Check: Layout adjusts appropriately
  → Status: [ ] PASS  [ ] FAIL

STEP 4: Check touch target sizes (375px)
  → All buttons/inputs at least 44px height
  → Status: [ ] PASS  [ ] FAIL
```

**Phase 8 Result:** ___/4 tests passed

---

## 📊 FINAL REPORT — Fill This Out

```
Agent/Tester Name: ___________________________
Date Tested: ___________________________
Build/Commit: ___________________________
Environment: [ ] Local Dev  [ ] Staging  [ ] Production

RESULTS SUMMARY:
┌─────────────────────┬────────┬───────┬──────┐
│ Phase               │ Total  │ Pass  │ Fail │
├─────────────────────┼────────┼───────┼──────┤
│ Phase 2: Auth       │   9    │       │      │
│ Phase 3: Navigation │   5    │       │      │
│ Phase 4: Dashboard  │   6    │       │      │
│ Phase 5: API        │   6    │       │      │
│ Phase 6: Forms      │   5    │       │      │
│ Phase 7: Components │   5    │       │      │
│ Phase 8: Responsive │   4    │       │      │
├─────────────────────┼────────┼───────┼──────┤
│ TOTAL               │  40    │       │      │
└─────────────────────┴────────┴───────┴──────┘

OVERALL STATUS: [ ] ✅ READY  [ ] ⚠️ ISSUES FOUND  [ ] ❌ BLOCKED

P0 FAILURES (Critical — must fix before release):
1. ___________________________
2. ___________________________
3. ___________________________

P1 FAILURES (High — should fix before release):
1. ___________________________
2. ___________________________

NOTES / OBSERVATIONS:
___________________________
___________________________
___________________________
```

---

## 🐛 Bug Report Template

If you find a bug, use this format:

```
BUG-[NUMBER]: [Short Title]
TC Reference: TC-XXX-XXX
Severity: [ ] P0  [ ] P1  [ ] P2  [ ] P3
Status: [ ] Open  [ ] Fixed  [ ] Won't Fix

Steps to Reproduce:
1. 
2. 
3. 

Expected Result:
Actual Result:
Screenshot/Video: [attach]
Browser: [Chrome/Firefox/Safari] [version]
OS: [Windows/Mac/Linux]
Viewport: [desktop/tablet/mobile - px width]
Console Errors: [paste any red console messages]
```
