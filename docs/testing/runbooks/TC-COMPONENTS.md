# 🧩 TC-COMPONENTS — UI Component-Level Test Cases

> **Module:** Reusable UI Components  
> **Priority:** 🟠 P1 — 🟡 P2  
> **Approach:** Identify each component visually, interact, verify behavior

---

## Component Inventory Checklist

Before testing, verify these components exist in the UI:

| Component | Location in App | Present? |
|-----------|----------------|---------|
| Button (Primary) | Throughout | [ ] |
| Button (Secondary) | Throughout | [ ] |
| Button (Danger/Destructive) | Delete actions | [ ] |
| Input Field | Forms | [ ] |
| Dropdown Select | Filters, Settings | [ ] |
| Modal / Dialog | Confirmations | [ ] |
| Toast / Snackbar | Notifications | [ ] |
| Loading Spinner | API calls | [ ] |
| Skeleton Loader | Data loading | [ ] |
| Card | Courses, Dashboard | [ ] |
| Badge / Tag | Labels, Status | [ ] |
| Avatar | User profile | [ ] |
| Progress Bar | Course progress | [ ] |
| Table | Data lists | [ ] |
| Pagination | Course list | [ ] |
| Search Input | Global search | [ ] |
| Tooltip | Info icons | [ ] |
| Accordion / Collapse | FAQ, Course modules | [ ] |
| Tabs | Profile, Settings | [ ] |
| Checkbox / Radio | Settings, Filters | [ ] |
| Toggle Switch | Settings | [ ] |

---

## TC-COMP-001 — Button — Primary Variant
**Priority:** 🟠 P1  
**Type:** Component

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find a primary button (e.g., "Save", "Login") | Button visible |
| 2 | Check styling | Filled background, brand color |
| 3 | Hover over button | Hover state (color change, shadow) |
| 4 | Click the button | Action triggered, visual feedback |
| 5 | Tab to button | Focus ring visible |
| 6 | Find a disabled button | Grayed out, not clickable |
| 7 | Click disabled button | Nothing happens |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-COMP-002 — Modal / Dialog
**Priority:** 🟠 P1  
**Type:** Component

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find an action that triggers a modal (e.g., Delete, Confirm) | Trigger found |
| 2 | Click trigger | Modal opens with overlay |
| 3 | Check modal content | Title + body + action buttons visible |
| 4 | Click "Cancel" / "Close" | Modal closes, no action taken |
| 5 | Open modal again | Modal reopens fresh |
| 6 | Click "Confirm" / primary action | Action executes, modal closes |
| 7 | Press Escape key while modal open | Modal closes |
| 8 | Click overlay/backdrop | Modal closes |
| 9 | Check scroll behavior | Page behind modal does NOT scroll |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-COMP-003 — Toast / Snackbar Notifications
**Priority:** 🟠 P1  
**Type:** Component

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Trigger a success action (save profile) | Success toast appears |
| 2 | Check toast appearance | Green background or success icon |
| 3 | Check toast message | "Saved successfully" or equivalent |
| 4 | Wait 3–5 seconds | Toast auto-dismisses |
| 5 | Trigger an error action | Error toast appears |
| 6 | Check error toast | Red/orange, error message |
| 7 | Click X on toast (if present) | Toast dismisses immediately |
| 8 | Check position | Top-right or bottom-center (consistent) |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-COMP-004 — Course Card Component
**Priority:** 🔴 P0  
**Type:** Component (Core Lumina Feature)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to courses page | Course cards visible |
| 2 | Check card anatomy | Image/thumbnail, title, description, CTA |
| 3 | Hover over card | Hover effect (shadow, scale) |
| 4 | Click card | Navigates to course detail |
| 5 | Check card with long title | Title truncates with ellipsis |
| 6 | Check card without image | Placeholder/fallback image shown |
| 7 | Check progress indicator | Progress bar shown for enrolled courses |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-COMP-005 — Progress Bar Component
**Priority:** 🔴 P0  
**Type:** Component (Core Lumina Feature)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find a progress bar on dashboard or course | Bar visible |
| 2 | Check visual | Filled portion indicates percentage |
| 3 | Check 0% progress | Bar is empty/start |
| 4 | Check 100% progress | Bar is fully filled |
| 5 | Check label | Shows "X% complete" or similar |
| 6 | Verify correct color | Brand color or green |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-COMP-006 — Dropdown / Select Component
**Priority:** 🟠 P1  
**Type:** Component

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find a dropdown (filter, sort, settings) | Dropdown visible |
| 2 | Click dropdown | Options list opens |
| 3 | Check options count | At least 2 options visible |
| 4 | Select an option | Dropdown closes, selection applied |
| 5 | Check selected value displayed | Selected option shown in dropdown |
| 6 | Open dropdown again | Previously selected option highlighted |
| 7 | Press Escape | Dropdown closes |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-COMP-007 — Skeleton / Loading Placeholders
**Priority:** 🟡 P2  
**Type:** Component

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Throttle network to Slow 3G | Network slowed |
| 2 | Navigate to courses page | Skeleton loaders appear |
| 3 | Check skeleton count | Matches number of expected course cards |
| 4 | Check skeleton animation | Shimmer/pulse animation visible |
| 5 | Wait for data to load | Skeletons replaced by actual cards |
| 6 | Verify no layout shift | Page doesn't jump on data load |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-COMP-008 — Pagination Component
**Priority:** 🟠 P1  
**Type:** Component

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to courses list with many items | Pagination visible |
| 2 | Check pagination controls | Previous, numbers, Next buttons |
| 3 | Click "Next" | Next page of courses loads |
| 4 | Check current page highlighted | Current page number stands out |
| 5 | Click page number "2" | Page 2 loads |
| 6 | Click "Previous" | Returns to page 1 |
| 7 | On page 1, check "Previous" | Previous button disabled |
| 8 | On last page, check "Next" | Next button disabled |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-COMP-009 — Avatar Component
**Priority:** 🟡 P2  
**Type:** Component

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Check header for user avatar | Avatar visible |
| 2 | Check avatar with profile photo | User's photo displayed |
| 3 | Check avatar for user without photo | Initials or placeholder shown |
| 4 | Check avatar size | Consistent size across app |
| 5 | Check avatar in dropdown | Avatar shown in profile menu |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-COMP-010 — Tabs Component
**Priority:** 🟡 P2  
**Type:** Component

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find a tabbed interface (profile/settings) | Tabs visible |
| 2 | Note the active tab | First tab active by default |
| 3 | Click second tab | Content changes to second tab |
| 4 | Check active styling | Active tab has distinct style |
| 5 | Press arrow keys on tabs | Focus moves between tabs |
| 6 | Refresh page on second tab | Returns to first tab (or remembers) |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-COMP-011 — Toggle Switch Component
**Priority:** 🟡 P2  
**Type:** Component

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find a toggle in settings | Toggle visible |
| 2 | Note the current state (on/off) | State noted |
| 3 | Click toggle | State changes |
| 4 | Check visual change | Color/position changes |
| 5 | Save settings | Toggle state saved |
| 6 | Refresh page | Toggle reflects saved state |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-COMP-012 — Tooltip Component
**Priority:** 🟢 P3  
**Type:** Component

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find an element with tooltip (info icon, icon button) | Element found |
| 2 | Hover over element | Tooltip appears after brief delay |
| 3 | Check tooltip text | Helpful, relevant text shown |
| 4 | Move mouse away | Tooltip disappears |
| 5 | Tab to element with keyboard | Tooltip appears on focus |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## Components Module Summary

| TC ID | Description | Priority | Status |
|-------|-------------|----------|--------|
| TC-COMP-001 | Button variants | 🟠 P1 | 🔄 |
| TC-COMP-002 | Modal/dialog | 🟠 P1 | 🔄 |
| TC-COMP-003 | Toast notifications | 🟠 P1 | 🔄 |
| TC-COMP-004 | Course card | 🔴 P0 | 🔄 |
| TC-COMP-005 | Progress bar | 🔴 P0 | 🔄 |
| TC-COMP-006 | Dropdown select | 🟠 P1 | 🔄 |
| TC-COMP-007 | Skeleton loaders | 🟡 P2 | 🔄 |
| TC-COMP-008 | Pagination | 🟠 P1 | 🔄 |
| TC-COMP-009 | Avatar | 🟡 P2 | 🔄 |
| TC-COMP-010 | Tabs | 🟡 P2 | 🔄 |
| TC-COMP-011 | Toggle switch | 🟡 P2 | 🔄 |
| TC-COMP-012 | Tooltip | 🟢 P3 | 🔄 |
