# 🧭 TC-NAVIGATION — Routing & Navigation Test Cases

> **Module:** Navigation, Routing, Sidebar, Header  
> **Priority:** 🔴 P0 — 🟡 P2  
> **Pre-condition:** User logged in

---

## TC-NAV-001 — All Primary Navigation Links Work
**Priority:** 🔴 P0  
**Type:** Smoke Test

Test every link in the sidebar / top navbar:

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Identify all navigation links | List all links visible in sidebar/navbar |
| 2 | Click "Dashboard" link | Navigates to `/dashboard` — page renders |
| 3 | Click "Courses" link | Navigates to `/courses` — page renders |
| 4 | Click "Profile" link | Navigates to `/profile` — page renders |
| 5 | Click "Settings" link | Navigates to `/settings` — page renders |
| 6 | Click any other nav links | Each renders without crash |
| 7 | Check console for errors | No errors after any navigation |

**Complete Link Inventory Checklist:**
- [ ] Dashboard `/dashboard`
- [ ] Courses `/courses`
- [ ] My Progress `/progress`
- [ ] Profile `/profile`
- [ ] Settings `/settings`
- [ ] Notifications `/notifications`
- [ ] Help / Support (if present)
- [ ] Admin Panel `/admin` (admin users only)

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-NAV-002 — Active Link Highlight
**Priority:** 🟠 P1  
**Type:** UI / Visual

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Dashboard | Dashboard link in nav is highlighted/active |
| 2 | Navigate to Courses | Courses link becomes highlighted, Dashboard deactivates |
| 3 | Navigate to Profile | Profile link highlighted |
| 4 | Check visual styling | Active link has distinct color, bold, or indicator |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-NAV-003 — Browser Back & Forward Navigation
**Priority:** 🟠 P1  
**Type:** Functional

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate: Dashboard → Courses | On Courses page |
| 2 | Press browser Back button | Returns to Dashboard |
| 3 | Press browser Forward button | Returns to Courses |
| 4 | Repeat with 3+ pages in sequence | All forward/back work correctly |
| 5 | Check page content on back | Correct page content loads each time |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-NAV-004 — Logo Click Returns to Home/Dashboard
**Priority:** 🟠 P1  
**Type:** Functional

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to any non-dashboard page | On a different page |
| 2 | Click the Lumina logo in the header | Navigates to `/dashboard` or `/` |
| 3 | Verify landing page | Dashboard or home page loads |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-NAV-005 — 404 Page for Unknown Routes
**Priority:** 🟠 P1  
**Type:** Edge Case

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/this-does-not-exist` | Custom 404 page shown |
| 2 | Check 404 page content | User-friendly message (not browser default) |
| 3 | Check for "Go Home" or "Back" button | Navigation option present |
| 4 | Click "Go Home" | Returns to dashboard or home |
| 5 | Navigate to `/dashboard/xyz/abc` | 404 or graceful redirect |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-NAV-006 — Mobile Hamburger Menu
**Priority:** 🔴 P0  
**Type:** Responsive

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Set viewport to 375px (mobile) | Mobile view |
| 2 | Check sidebar visibility | Sidebar hidden on mobile |
| 3 | Look for hamburger icon (☰) | Visible in header |
| 4 | Click hamburger icon | Navigation drawer/sidebar opens |
| 5 | Click a nav link | Drawer closes, new page loads |
| 6 | Click hamburger again | Drawer closes |
| 7 | Tap outside drawer (overlay) | Drawer closes |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-NAV-007 — Breadcrumb Trail on Nested Pages
**Priority:** 🟡 P2  
**Type:** UI

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to a nested page (e.g., Course Detail) | Page loads |
| 2 | Check for breadcrumbs at top | Breadcrumb trail visible |
| 3 | Read breadcrumb text | Shows `Home > Courses > [Course Name]` |
| 4 | Click a breadcrumb link | Navigates to that level |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-NAV-008 — Header User Profile Dropdown
**Priority:** 🟠 P1  
**Type:** Functional

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Look for avatar/name in header top-right | Profile indicator visible |
| 2 | Click the avatar/name | Dropdown menu appears |
| 3 | Check dropdown items | "Profile", "Settings", "Logout" visible |
| 4 | Click "Profile" | Navigates to `/profile` |
| 5 | Return to dashboard, open dropdown again | Click "Settings" → `/settings` |
| 6 | Open dropdown, click outside | Dropdown closes |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-NAV-009 — Redirect After Login to Intended Page
**Priority:** 🟠 P1  
**Type:** Functional

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log out (clear session) | On login page |
| 2 | Manually navigate to `/profile` | Redirected to `/login` |
| 3 | Log in with valid credentials | Redirected to `/profile` (intended destination) |
| 4 | Verify URL | Shows `/profile`, not `/dashboard` |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-NAV-010 — Sidebar Collapse / Expand (Desktop)
**Priority:** 🟡 P2  
**Type:** UI

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On desktop (1280px+), find sidebar | Sidebar visible |
| 2 | Look for collapse button (« or →) | Collapse toggle present |
| 3 | Click collapse button | Sidebar collapses to icon-only view |
| 4 | Verify icons still visible | Icons for each nav item shown |
| 5 | Click expand / same button | Sidebar expands back to full |
| 6 | Hover over collapsed icon | Tooltip shows section label |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-NAV-011 — Deep Link Navigation
**Priority:** 🟠 P1  
**Type:** Functional

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Copy URL of a specific course page | URL copied |
| 2 | Open new incognito window | Fresh session |
| 3 | Paste the URL | Redirected to login (no auth) |
| 4 | Log in | Redirected to originally intended course page |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-NAV-012 — Keyboard Navigation Through Menu
**Priority:** 🟡 P2  
**Type:** Accessibility

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Press Tab from top of page | Focus enters navigation |
| 2 | Press Tab repeatedly | Each nav link receives focus in order |
| 3 | Press Enter on focused link | Navigates to that page |
| 4 | Press Escape on open dropdown | Dropdown closes |
| 5 | Verify focus indicator | Visible outline on focused element |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## Navigation Module Summary

| TC ID | Description | Priority | Status |
|-------|-------------|----------|--------|
| TC-NAV-001 | All nav links work | 🔴 P0 | 🔄 |
| TC-NAV-002 | Active link highlight | 🟠 P1 | 🔄 |
| TC-NAV-003 | Browser back/forward | 🟠 P1 | 🔄 |
| TC-NAV-004 | Logo click to home | 🟠 P1 | 🔄 |
| TC-NAV-005 | 404 page | 🟠 P1 | 🔄 |
| TC-NAV-006 | Mobile hamburger | 🔴 P0 | 🔄 |
| TC-NAV-007 | Breadcrumbs | 🟡 P2 | 🔄 |
| TC-NAV-008 | Header profile dropdown | 🟠 P1 | 🔄 |
| TC-NAV-009 | Redirect after login | 🟠 P1 | 🔄 |
| TC-NAV-010 | Sidebar collapse | 🟡 P2 | 🔄 |
| TC-NAV-011 | Deep link navigation | 🟠 P1 | 🔄 |
| TC-NAV-012 | Keyboard navigation | 🟡 P2 | 🔄 |
