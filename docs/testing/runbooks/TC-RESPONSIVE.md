# 📱 TC-RESPONSIVE — Responsive Design Test Cases
# ⚡ TC-PERFORMANCE — Performance & Load Test Cases

---

# PART 1: TC-RESPONSIVE — Responsive Design Tests

> **Module:** Responsive Layout across all breakpoints  
> **Tool:** Browser DevTools → Device Toolbar (Ctrl+Shift+M / Cmd+Shift+M)

## Breakpoints to Test

| Breakpoint | Width | Device |
|------------|-------|--------|
| Mobile S | 320px | iPhone SE |
| Mobile M | 375px | iPhone 14 |
| Mobile L | 425px | Large phone |
| Tablet | 768px | iPad |
| Laptop | 1024px | Small laptop |
| Desktop | 1280px | Standard desktop |
| Large | 1440px | Large monitor |

---

## TC-RES-001 — No Horizontal Scroll on Any Page
**Priority:** 🔴 P0

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Set viewport to 375px | Mobile view |
| 2 | Visit each main page: Dashboard, Courses, Profile, Settings | Pages load |
| 3 | Check for horizontal scrollbar | No horizontal scroll on any page |
| 4 | Set to 768px (tablet) | Tablet view |
| 5 | Repeat same checks | No horizontal scroll |

**Pages to check:**
- [ ] `/login`
- [ ] `/register`
- [ ] `/dashboard`
- [ ] `/courses`
- [ ] `/courses/:id`
- [ ] `/profile`
- [ ] `/settings`

**Status:** 🔄 PENDING

---

## TC-RES-002 — Mobile Navigation (375px)
**Priority:** 🔴 P0

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Set viewport to 375px | Mobile |
| 2 | Check sidebar | Sidebar hidden (not taking space) |
| 3 | Check hamburger icon | ☰ icon visible in header |
| 4 | Click hamburger | Drawer slides open |
| 5 | All nav links visible in drawer | Same links as desktop |
| 6 | Click a link | Drawer closes, page navigates |
| 7 | Verify no clipping | All text readable, no overflow |

**Status:** 🔄 PENDING

---

## TC-RES-003 — Tablet Layout (768px)
**Priority:** 🟠 P1

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Set viewport to 768px | Tablet view |
| 2 | Check navigation | Sidebar visible OR hamburger (either is ok) |
| 3 | Check card grid | Cards in 2-column layout (not 1 or 4) |
| 4 | Check font sizes | Readable, not too small |
| 5 | Check form inputs | Full width or appropriate sizing |
| 6 | Check buttons | Touch targets at least 44px tall |

**Status:** 🔄 PENDING

---

## TC-RES-004 — Desktop Layout (1280px)
**Priority:** 🟠 P1

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Set viewport to 1280px | Desktop view |
| 2 | Check sidebar | Sidebar visible with full labels |
| 3 | Check card grid | 3–4 columns for course cards |
| 4 | Check content max-width | Content doesn't stretch to full 1280px edges |
| 5 | Check whitespace | Appropriate padding/margins |
| 6 | Check dashboard stats | Cards in a row, not stacked |

**Status:** 🔄 PENDING

---

## TC-RES-005 — Touch Target Sizes
**Priority:** 🟠 P1

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Set viewport to 375px | Mobile |
| 2 | Inspect all interactive elements | DevTools available |
| 3 | Measure all buttons | Height and width ≥ 44px |
| 4 | Measure nav menu items | Each item ≥ 44px height |
| 5 | Check icon buttons (close, expand) | At least 44x44px click area |
| 6 | Check form inputs | Height ≥ 44px |

**Status:** 🔄 PENDING

---

## TC-RES-006 — Images Responsive Behavior
**Priority:** 🟡 P2

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find pages with images (course cards, profile) | Images located |
| 2 | Resize viewport from 1280px to 375px | Drag viewport smaller |
| 3 | Watch image behavior | Images scale down, don't overflow |
| 4 | Check profile avatar at mobile | Still circular, not distorted |
| 5 | Check course thumbnail at mobile | Visible, correct aspect ratio |

**Status:** 🔄 PENDING

---

## TC-RES-007 — Font Size Readability Across Breakpoints
**Priority:** 🟡 P2

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | At 375px, inspect body text size | At least 14px |
| 2 | Check heading sizes | At least 20px for H1 |
| 3 | Check form label sizes | At least 14px |
| 4 | Check button text | At least 14px |
| 5 | Check no text overflow | Text wraps properly, no clipping |

**Status:** 🔄 PENDING

---

# PART 2: TC-PERFORMANCE — Performance Tests

> **Tool:** Chrome DevTools → Lighthouse, Network, Performance tabs

---

## TC-PERF-001 — Initial Page Load Time
**Priority:** 🟠 P1

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open DevTools → Network | Clear cache |
| 2 | Reload the app | Note time-to-fully-loaded |
| 3 | Check "Load" event time | Under 3 seconds on fast connection |
| 4 | Check "DOMContentLoaded" | Under 1.5 seconds |
| 5 | Check total transfer size | Under 2MB initial load |

**Benchmarks:**
- 🟢 Excellent: < 1s
- 🟡 Acceptable: 1–3s
- 🔴 Poor: > 3s

**Status:** 🔄 PENDING | **Actual Load Time:** ___

---

## TC-PERF-002 — Lighthouse Performance Score
**Priority:** 🟠 P1

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open Chrome DevTools → Lighthouse | Lighthouse tab |
| 2 | Select "Performance" category | Checked |
| 3 | Select "Mobile" device | Mobile mode |
| 4 | Click "Analyze page load" | Report generated |
| 5 | Note Performance score | Score ≥ 70 (target: ≥ 85) |
| 6 | Check Core Web Vitals | LCP, FID, CLS in green |

**Score Targets:**
| Metric | Target |
|--------|--------|
| Performance | ≥ 70 |
| Accessibility | ≥ 80 |
| Best Practices | ≥ 80 |
| SEO | ≥ 70 |

**Status:** 🔄 PENDING | **Score:** ___

---

## TC-PERF-003 — No Memory Leaks (Long Session)
**Priority:** 🟡 P2

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open DevTools → Performance | Performance tab |
| 2 | Click "Record" button | Recording starts |
| 3 | Navigate through 10+ pages quickly | Simulate heavy usage |
| 4 | Stop recording | Report generated |
| 5 | Check JS Heap size over time | Should not grow unbounded |
| 6 | Watch for memory warnings | No "Out of memory" warnings |

**Status:** 🔄 PENDING

---

## TC-PERF-004 — API Request Count on Dashboard Load
**Priority:** 🟡 P2

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open DevTools → Network | Ready |
| 2 | Clear network log | Log cleared |
| 3 | Navigate to dashboard | Page loads |
| 4 | Count API requests made | Note total request count |
| 5 | Check for duplicate requests | No same endpoint called twice |
| 6 | Check for unnecessary requests | No requests to unused resources |

**Benchmark:** ≤ 10 API calls on initial dashboard load

**Status:** 🔄 PENDING | **Actual count:** ___

---

## TC-PERF-005 — Bundle Size Check
**Priority:** 🟡 P2

```bash
# Run in project directory
npm run build
# or
yarn build

# Check output sizes
ls -lh dist/assets/*.js
ls -lh dist/assets/*.css
```

| Asset | Target Size |
|-------|-------------|
| Main JS bundle | < 500KB gzipped |
| CSS bundle | < 50KB gzipped |
| Total initial JS | < 1MB uncompressed |

**Status:** 🔄 PENDING | **Actual size:** ___

---

## Responsive & Performance Summary

### Responsive
| TC ID | Description | Priority | Status |
|-------|-------------|----------|--------|
| TC-RES-001 | No horizontal scroll | 🔴 P0 | 🔄 |
| TC-RES-002 | Mobile navigation | 🔴 P0 | 🔄 |
| TC-RES-003 | Tablet layout | 🟠 P1 | 🔄 |
| TC-RES-004 | Desktop layout | 🟠 P1 | 🔄 |
| TC-RES-005 | Touch targets | 🟠 P1 | 🔄 |
| TC-RES-006 | Responsive images | 🟡 P2 | 🔄 |
| TC-RES-007 | Font readability | 🟡 P2 | 🔄 |

### Performance
| TC ID | Description | Priority | Status |
|-------|-------------|----------|--------|
| TC-PERF-001 | Page load time | 🟠 P1 | 🔄 |
| TC-PERF-002 | Lighthouse score | 🟠 P1 | 🔄 |
| TC-PERF-003 | Memory leaks | 🟡 P2 | 🔄 |
| TC-PERF-004 | API request count | 🟡 P2 | 🔄 |
| TC-PERF-005 | Bundle size | 🟡 P2 | 🔄 |
