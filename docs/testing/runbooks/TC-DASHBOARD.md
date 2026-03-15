# 📊 TC-DASHBOARD — Dashboard & Home Screen Test Cases

> **Module:** Dashboard / Home  
> **Priority:** 🔴 P0 — P1  
> **Pre-condition:** User must be logged in before running any test here

---

## Pre-conditions
- User is authenticated (`testuser@lumina.com` / `Test@1234`)
- Navigated to `/dashboard` or `/home`
- Network connection active

---

## TC-DASH-001 — Dashboard Page Renders Without Crash
**Priority:** 🔴 P0  
**Type:** Smoke Test

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in and reach dashboard | Dashboard page loads |
| 2 | Check browser console | No JavaScript errors (red entries) |
| 3 | Check page title | Relevant title in browser tab |
| 4 | Check network tab | No failed (red) API requests |
| 5 | Verify page is fully loaded | No infinite spinner |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-DASH-002 — Personalized Greeting Displays
**Priority:** 🟠 P1  
**Type:** Functional

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as `testuser@lumina.com` | Dashboard loads |
| 2 | Look for greeting text | "Hello, Test" or "Welcome, Test User" visible |
| 3 | Verify name matches login | Shows logged-in user's name, not generic text |
| 4 | Log out and log in as different user | Greeting shows new user's name |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-DASH-003 — Statistics / Summary Cards Render
**Priority:** 🟠 P1  
**Type:** Functional

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Load dashboard | Stats cards visible |
| 2 | Count stat cards | At least 2–4 summary cards present |
| 3 | Check card values | Show numeric or text values (not 0 placeholders) |
| 4 | Check card labels | Each card has a descriptive label |
| 5 | Wait 2 seconds | No cards disappear or flicker |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-DASH-004 — Loading Skeleton Shows Before Data
**Priority:** 🟡 P2  
**Type:** UX

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Throttle network to "Slow 3G" in DevTools | Network slowed |
| 2 | Refresh dashboard | Skeleton/shimmer loaders appear |
| 3 | Wait for data | Skeletons replaced by real content |
| 4 | Restore network | Normal speed |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-DASH-005 — Notification Bell Icon
**Priority:** 🟠 P1  
**Type:** Functional

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Look for bell/notification icon in header | Icon visible |
| 2 | Click the bell icon | Notification panel/dropdown appears |
| 3 | Check for notification list | List of notifications shown OR "No notifications" |
| 4 | Click outside the panel | Panel closes |
| 5 | Verify badge count | Badge number visible if unread notifications exist |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-DASH-006 — Global Search Bar
**Priority:** 🟠 P1  
**Type:** Functional

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find search bar on dashboard | Search input visible |
| 2 | Click the search bar | Input focused |
| 3 | Type "course" or any keyword | Search results appear (dropdown or new page) |
| 4 | Type a non-existent keyword like `xyzabc999` | "No results found" message |
| 5 | Clear the search input | Results cleared |
| 6 | Press Escape key | Search closed or cleared |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-DASH-007 — Recent Activity / Feed Section
**Priority:** 🟡 P2  
**Type:** Functional

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Scroll down on dashboard | Recent activity section visible |
| 2 | Check number of items | At least 1 activity item present |
| 3 | Check item format | Each item has timestamp + description |
| 4 | Click on an activity item | Navigates to relevant page OR expands detail |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-DASH-008 — Quick Action Buttons
**Priority:** 🟠 P1  
**Type:** Functional

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Look for quick action area (buttons/CTA area) | Buttons visible on dashboard |
| 2 | Identify what quick actions exist | Note down all button labels |
| 3 | Click each action button one by one | Each navigates to the correct page |
| 4 | Use browser back button | Returns to dashboard |
| 5 | Verify no broken links | No 404 pages |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-DASH-009 — Dashboard Data Refresh
**Priority:** 🟡 P2  
**Type:** Functional

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Load dashboard and note stat values | Values recorded |
| 2 | If refresh button exists — click it | Data re-fetched |
| 3 | Manually refresh browser | Dashboard reloads with fresh data |
| 4 | Verify data is not stale | Values reflect current state |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-DASH-010 — Dashboard on Mobile View (375px)
**Priority:** 🟠 P1  
**Type:** Responsive

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open browser DevTools | DevTools open |
| 2 | Set viewport to 375px width | Mobile view active |
| 3 | Navigate to dashboard | Page renders |
| 4 | Check no horizontal scroll | Content fits within viewport |
| 5 | Check stat cards | Stack vertically, still readable |
| 6 | Check navigation | Mobile menu (hamburger) visible |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-DASH-011 — Empty State Handling
**Priority:** 🟡 P2  
**Type:** Edge Case

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in with a brand-new account | Fresh account, no data |
| 2 | Navigate to dashboard | Dashboard loads |
| 3 | Check sections with no data | Empty state UI shown (illustration + message) |
| 4 | Verify no "undefined" or "null" text | Clean empty states, no raw data showing |
| 5 | Check CTA in empty state | "Get started" or similar action button present |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-DASH-012 — Course / Module Progress Display
**Priority:** 🔴 P0  
**Type:** Functional (Core Lumina Feature)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as user enrolled in courses | Dashboard loads |
| 2 | Look for progress section | Progress bars or percentage visible |
| 3 | Check progress accuracy | Matches actual completion status |
| 4 | Click a course from dashboard | Navigates to course detail page |
| 5 | Go back to dashboard | Progress still accurate |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## Dashboard Module Summary

| TC ID | Description | Priority | Status |
|-------|-------------|----------|--------|
| TC-DASH-001 | Dashboard renders | 🔴 P0 | 🔄 |
| TC-DASH-002 | Personalized greeting | 🟠 P1 | 🔄 |
| TC-DASH-003 | Stats cards render | 🟠 P1 | 🔄 |
| TC-DASH-004 | Loading skeletons | 🟡 P2 | 🔄 |
| TC-DASH-005 | Notification bell | 🟠 P1 | 🔄 |
| TC-DASH-006 | Global search | 🟠 P1 | 🔄 |
| TC-DASH-007 | Recent activity feed | 🟡 P2 | 🔄 |
| TC-DASH-008 | Quick action buttons | 🟠 P1 | 🔄 |
| TC-DASH-009 | Data refresh | 🟡 P2 | 🔄 |
| TC-DASH-010 | Mobile responsive | 🟠 P1 | 🔄 |
| TC-DASH-011 | Empty state handling | 🟡 P2 | 🔄 |
| TC-DASH-012 | Course progress display | 🔴 P0 | 🔄 |
