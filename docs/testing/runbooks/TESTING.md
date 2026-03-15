# 🧪 Lumina — Complete Test Verification Suite

> **Purpose:** This document is the master guide for verifying every feature, function, component, and connection in the Lumina frontend. An agent or student can use this document end-to-end to confirm the entire system is working correctly.

---

## 📁 Documentation Index

| File | Purpose |
|------|---------|
| `TESTING.md` | ← You are here — Master test guide & feature inventory |
| `tests/TC-AUTH.md` | Authentication test cases |
| `tests/TC-DASHBOARD.md` | Dashboard & home screen tests |
| `tests/TC-NAVIGATION.md` | Routing & navigation tests |
| `tests/TC-COMPONENTS.md` | UI component-level tests |
| `tests/TC-API.md` | API connection & data flow tests |
| `tests/TC-FORMS.md` | Form validation & submission tests |
| `tests/TC-RESPONSIVE.md` | Mobile/tablet/desktop responsive tests |
| `tests/TC-ACCESSIBILITY.md` | Accessibility & keyboard nav tests |
| `tests/TC-PERFORMANCE.md` | Performance & load tests |
| `tests/AGENT-RUNBOOK.md` | Step-by-step agent verification runbook |

---

## 🗺️ Feature Inventory — What Must Exist in Lumina

Before running any test, verify these features are **present and accessible** in the project:

### ✅ Core Features Checklist

#### 1. Authentication System
- [ ] Login page (`/login` or `/signin`)
- [ ] Registration page (`/register` or `/signup`)
- [ ] Forgot password flow
- [ ] Password reset via email link
- [ ] JWT / session token management
- [ ] Auto-logout on token expiry
- [ ] Protected route guards
- [ ] Remember me functionality
- [ ] OAuth / Social login (if applicable)

#### 2. Dashboard / Home
- [ ] Personalized greeting with user name
- [ ] Summary cards / statistics widgets
- [ ] Recent activity feed
- [ ] Quick action buttons
- [ ] Notification badge/bell
- [ ] Search bar (global)
- [ ] Loading skeleton states

#### 3. Navigation
- [ ] Sidebar / navbar with all main links
- [ ] Active state highlighting on current route
- [ ] Breadcrumb trail on nested pages
- [ ] Mobile hamburger menu
- [ ] Logo links back to home/dashboard
- [ ] User profile dropdown in header
- [ ] Logout button accessible from nav

#### 4. User Profile
- [ ] View profile page
- [ ] Edit profile (name, bio, avatar)
- [ ] Change password
- [ ] Upload/change profile picture
- [ ] Account settings page
- [ ] Notification preferences

#### 5. Main Content Modules (Lumina-specific)
- [ ] Course / module listing page
- [ ] Individual course / detail page
- [ ] Progress tracking indicators
- [ ] Content cards with image, title, description
- [ ] Filter / sort / search functionality
- [ ] Pagination or infinite scroll
- [ ] Enrollment or bookmark actions

#### 6. Data & State Management
- [ ] Global state (Redux / Zustand / Context)
- [ ] API calls with loading states
- [ ] Error states with user-friendly messages
- [ ] Empty states with helpful UI
- [ ] Data caching / re-fetch logic

#### 7. UI/UX Components
- [ ] Button variants (primary, secondary, danger, ghost)
- [ ] Form inputs with validation feedback
- [ ] Modal / dialog boxes
- [ ] Toast / snackbar notifications
- [ ] Dropdown menus
- [ ] Tables with sorting
- [ ] Cards
- [ ] Badges / tags
- [ ] Tooltips
- [ ] Loaders / spinners

#### 8. Routing
- [ ] All defined routes render without crash
- [ ] 404 page for unknown routes
- [ ] Protected routes redirect unauthenticated users
- [ ] Redirect after login goes to intended page
- [ ] Browser back/forward works correctly

#### 9. API Connections
- [ ] Base URL configured via environment variable
- [ ] Auth header attached to all private requests
- [ ] Error interceptor handles 401/403/500
- [ ] Retry logic or fallback on failure
- [ ] All CRUD endpoints wired to UI actions

#### 10. Responsive Design
- [ ] Mobile (320px – 767px) — no overflow, usable layout
- [ ] Tablet (768px – 1023px) — adapted layout
- [ ] Desktop (1024px+) — full feature layout
- [ ] No horizontal scroll on any page
- [ ] Touch targets ≥ 44px on mobile

---

## 🔢 Test Case Numbering Convention

All test cases follow this format:

```
TC-[MODULE]-[NUMBER]
e.g. TC-AUTH-001, TC-DASH-003, TC-API-012
```

### Severity Levels

| Level | Code | Meaning |
|-------|------|---------|
| Critical | 🔴 P0 | System unusable if this fails |
| High | 🟠 P1 | Major feature broken |
| Medium | 🟡 P2 | Feature degraded but workaround exists |
| Low | 🟢 P3 | Minor cosmetic/UX issue |

### Status Codes

| Status | Meaning |
|--------|---------|
| ✅ PASS | Feature works as expected |
| ❌ FAIL | Feature does not work |
| ⚠️ PARTIAL | Partially works, some issues |
| ⏭️ SKIP | Not applicable for this build |
| 🔄 PENDING | Not yet tested |

---

## 🚀 Quick Start — How to Run These Tests

### Prerequisites
```bash
# 1. Clone and install the project
git clone <lumina-repo-url>
cd lumina
npm install   # or yarn install / pnpm install

# 2. Set up environment variables
cp .env.example .env
# Fill in all required values in .env

# 3. Start dev server
npm run dev   # or yarn dev

# 4. Verify it starts on expected port
# Expected: http://localhost:3000 (or 5173 for Vite)
```

### Running Automated Tests
```bash
# Unit tests
npm run test

# Component tests (if using Vitest or Jest)
npm run test:unit

# E2E tests (if using Playwright or Cypress)
npm run test:e2e

# Coverage report
npm run test:coverage

# Lint check
npm run lint
```

### Running Manual Tests
Follow each test case in `tests/` directory in order:
1. Start with `TC-AUTH.md` (authentication must work first)
2. Then `TC-NAVIGATION.md`
3. Then feature-specific files
4. End with `TC-API.md` and `TC-PERFORMANCE.md`

---

## 📊 Test Results Tracker

Copy this table and fill it in as you test:

| Test File | Total Cases | PASS | FAIL | SKIP | Notes |
|-----------|------------|------|------|------|-------|
| TC-AUTH | | | | | |
| TC-DASHBOARD | | | | | |
| TC-NAVIGATION | | | | | |
| TC-COMPONENTS | | | | | |
| TC-API | | | | | |
| TC-FORMS | | | | | |
| TC-RESPONSIVE | | | | | |
| TC-ACCESSIBILITY | | | | | |
| **TOTAL** | | | | | |

---

## 🤖 Agent Instructions

If you are an automated agent running these tests:

1. **Read `tests/AGENT-RUNBOOK.md` first** — it has step-by-step ordered instructions
2. **Report every test case result** with TC number, status, and any error message
3. **Screenshot failures** if browser automation is available
4. **Do not skip P0 tests** — if a P0 fails, document it and continue with remaining tests
5. **Log console errors** during each test step
6. **Test in this order:** Auth → Navigation → Dashboard → Components → API → Forms → Responsive
