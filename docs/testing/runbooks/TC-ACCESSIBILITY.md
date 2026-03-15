# ♿ TC-ACCESSIBILITY — Accessibility & Keyboard Navigation Test Cases

> **Standard:** WCAG 2.1 Level AA  
> **Tools:** axe DevTools browser extension, keyboard only, screen reader

---

## TC-A11Y-001 — Keyboard-Only Navigation
**Priority:** 🟠 P1

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Put mouse aside — keyboard only | Mouse not used |
| 2 | Press Tab from top of any page | Focus starts at skip link or first interactive element |
| 3 | Continue tabbing through page | All interactive elements receive focus in logical order |
| 4 | Press Enter on focused link | Navigation works |
| 5 | Press Space on focused button | Button activates |
| 6 | Verify no "focus trap" (stuck) | Can always Tab past all elements |

**Status:** 🔄 PENDING

---

## TC-A11Y-002 — Visible Focus Indicators
**Priority:** 🟠 P1

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Tab through the page | Each focused element has visible outline |
| 2 | Check buttons | Blue/brand-colored ring visible |
| 3 | Check form inputs | Focus ring visible around input |
| 4 | Check nav links | Focus indicator clearly visible |
| 5 | Verify contrast | Focus ring visible against background |

**Status:** 🔄 PENDING

---

## TC-A11Y-003 — Image Alt Text
**Priority:** 🟠 P1

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Right-click any image → Inspect | Dev tools open |
| 2 | Check `<img>` element | `alt` attribute present |
| 3 | Check course thumbnail alt text | Descriptive alt text, not empty |
| 4 | Check logo image | Alt text = "Lumina logo" or similar |
| 5 | Check decorative images | `alt=""` (empty) for decorative-only images |

**Status:** 🔄 PENDING

---

## TC-A11Y-004 — Color Contrast Ratio
**Priority:** 🟠 P1

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Install "axe DevTools" browser extension | Extension active |
| 2 | Run axe scan on login page | Scan completes |
| 3 | Check "Color Contrast" violations | Zero contrast violations |
| 4 | Run on dashboard | No violations |
| 5 | Check small text specifically | Contrast ratio ≥ 4.5:1 for body text |

**Status:** 🔄 PENDING

---

## TC-A11Y-005 — Form Labels and ARIA
**Priority:** 🟠 P1

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Inspect login form email field | `<label>` element linked via `for`/`id` OR `aria-label` present |
| 2 | Check password field | Labeled correctly |
| 3 | Check error messages | Associated with field via `aria-describedby` |
| 4 | Check required fields | `required` or `aria-required="true"` set |
| 5 | Check submit button | Has text or `aria-label` |

**Status:** 🔄 PENDING

---

## TC-A11Y-006 — Modal Accessibility
**Priority:** 🟠 P1

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open any modal | Modal opens |
| 2 | Check focus | Focus moves inside modal |
| 3 | Tab through modal | Focus cycles within modal (not behind) |
| 4 | Press Escape | Modal closes |
| 5 | Verify focus return | Focus returns to triggering element |
| 6 | Check `role="dialog"` | Modal has dialog role |
| 7 | Check `aria-modal="true"` | Attribute present |

**Status:** 🔄 PENDING

---

## TC-A11Y-007 — Screen Reader Compatibility (Basic)
**Priority:** 🟡 P2

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enable screen reader (Windows Narrator / Mac VoiceOver) | Reader active |
| 2 | Navigate to login page | Reader announces page title |
| 3 | Tab to email field | Reader announces "Email address, text field" |
| 4 | Tab to password field | Reader announces "Password, password field" |
| 5 | Submit invalid form | Error announced by reader |
| 6 | Navigate to dashboard | Page heading announced |

**Status:** 🔄 PENDING

---

## Accessibility Summary

| TC ID | Description | Priority | Status |
|-------|-------------|----------|--------|
| TC-A11Y-001 | Keyboard-only navigation | 🟠 P1 | 🔄 |
| TC-A11Y-002 | Visible focus indicators | 🟠 P1 | 🔄 |
| TC-A11Y-003 | Image alt text | 🟠 P1 | 🔄 |
| TC-A11Y-004 | Color contrast | 🟠 P1 | 🔄 |
| TC-A11Y-005 | Form labels/ARIA | 🟠 P1 | 🔄 |
| TC-A11Y-006 | Modal accessibility | 🟠 P1 | 🔄 |
| TC-A11Y-007 | Screen reader | 🟡 P2 | 🔄 |
