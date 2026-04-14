# 📝 TC-FORMS — Form Validation & Submission Test Cases

> **Module:** All Forms in Lumina Frontend  
> **Priority:** 🟠 P1 — 🟡 P2  
> **Covers:** Login, Register, Profile Edit, Search, Settings, Contact

---

## Forms Inventory — All Forms That Must Exist

| Form | Page | Fields |
|------|------|--------|
| Login Form | `/login` | email, password |
| Register Form | `/register` | name, email, password, confirm password |
| Forgot Password | `/forgot-password` | email |
| Edit Profile | `/profile/edit` | name, bio, avatar |
| Change Password | `/settings/security` | current password, new password, confirm |
| Search Form | Header / Dashboard | query text |
| Settings Form | `/settings` | notifications, preferences |

---

## TC-FORM-001 — Required Field Validation (All Forms)
**Priority:** 🟠 P1  
**Type:** Validation

**Test for each form listed above:**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open any form | Form renders |
| 2 | Leave all required fields empty | Fields blank |
| 3 | Click submit button | Validation triggered |
| 4 | Check each required field | Red border or error message below field |
| 5 | Check error text | "This field is required" or equivalent |
| 6 | Verify no API call made | Network tab shows no request |

**Forms to test:**
- [ ] Login form
- [ ] Register form
- [ ] Forgot password form
- [ ] Profile edit form
- [ ] Change password form

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-FORM-002 — Email Field Format Validation
**Priority:** 🟠 P1  
**Type:** Validation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find any email input | Email field located |
| 2 | Type `notanemail` | No @ symbol |
| 3 | Tab away or submit | "Invalid email format" error |
| 4 | Type `test@` | Incomplete email |
| 5 | Tab away or submit | Error shown |
| 6 | Type `test@domain.com` | Valid email |
| 7 | Tab away | No error shown |

**Forms to test:**
- [ ] Login form
- [ ] Register form
- [ ] Forgot password form

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-FORM-003 — Password Minimum Length Validation
**Priority:** 🟠 P1  
**Type:** Validation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find password input on register page | Password field located |
| 2 | Type `abc` (less than minimum) | Short password |
| 3 | Submit or tab away | "Password must be at least 8 characters" |
| 4 | Type `Secure@123` (valid) | No error |
| 5 | Verify minimum enforced | Check what minimum is (6, 8, or 12 chars) |

**Status:** 🔄 PENDING  
**Notes:** Minimum length is: ___

---

## TC-FORM-004 — Confirm Password Must Match
**Priority:** 🟠 P1  
**Type:** Validation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to register form | Form loads |
| 2 | Enter password: `Secure@123` | Password set |
| 3 | Enter confirm password: `Different@456` | Different value |
| 4 | Submit or tab away from confirm field | "Passwords do not match" error |
| 5 | Change confirm to `Secure@123` | Error clears |

**Also test on:** `/settings/security` change password form

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-FORM-005 — Input Field Max Length Limits
**Priority:** 🟡 P2  
**Type:** Validation / Edge Case

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find name/title field on profile edit | Field located |
| 2 | Paste 500 characters of text | Very long input |
| 3 | Check behavior | Input truncated OR error shown |
| 4 | Verify max length enforced | Field not accept beyond limit |
| 5 | Check bio/description field | Larger limit (256–1000 chars typical) |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-FORM-006 — Form Submit Button Disabled During Loading
**Priority:** 🟠 P1  
**Type:** UX

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open login form | Form loaded |
| 2 | Enter valid credentials | Fields filled |
| 3 | Click submit | Loading state begins |
| 4 | Immediately check submit button | Button is disabled or shows spinner |
| 5 | Verify can't double-submit | Clicking again has no effect |
| 6 | Wait for response | Button re-enables after response |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-FORM-007 — Error Messages Clear on Correction
**Priority:** 🟡 P2  
**Type:** UX

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Submit login form empty | Validation errors shown |
| 2 | Type a valid email in email field | Email error clears |
| 3 | Leave password empty | Password error still shows |
| 4 | Type a password | Password error clears |
| 5 | All errors cleared | No error messages visible |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-FORM-008 — Profile Edit Form — Save Changes
**Priority:** 🟠 P1  
**Type:** Functional

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to profile edit page | Edit form loads |
| 2 | Change display name to "Updated User" | Name field changed |
| 3 | Change bio to "This is a test bio" | Bio field changed |
| 4 | Click Save | Success toast shown |
| 5 | Navigate away and return | Changes persisted |
| 6 | Verify in header/navbar | Updated name shown in nav |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-FORM-009 — Profile Picture Upload
**Priority:** 🟠 P1  
**Type:** Functional

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to profile page | Profile loads |
| 2 | Find "Upload photo" / "Change avatar" | Upload option visible |
| 3 | Click the upload button | File picker opens |
| 4 | Select a valid image (JPG/PNG < 2MB) | File selected |
| 5 | Confirm upload | Image uploads |
| 6 | Verify preview updates | New image shown |
| 7 | Save / Submit | Profile picture saved |
| 8 | Refresh page | New profile picture persists |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-FORM-010 — Profile Picture Upload Validation
**Priority:** 🟡 P2  
**Type:** Validation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Attempt to upload a `.pdf` file | Wrong file type |
| 2 | Check error message | "Only JPG/PNG/GIF allowed" or similar |
| 3 | Attempt to upload image > 5MB | Oversized file |
| 4 | Check error message | "File size too large" |
| 5 | Upload valid 100KB PNG | No error, uploads successfully |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-FORM-011 — Change Password Form
**Priority:** 🟠 P1  
**Type:** Functional

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to security settings | Change password form visible |
| 2 | Enter wrong current password | Wrong value |
| 3 | Enter new password and confirm | Fields filled |
| 4 | Click Save | Error: "Current password incorrect" |
| 5 | Enter correct current password | Corrected |
| 6 | Enter valid new password and confirm | Fields match |
| 7 | Click Save | Success message shown |
| 8 | Log out and log in with new password | Login successful |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-FORM-012 — Settings / Preferences Form
**Priority:** 🟡 P2  
**Type:** Functional

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/settings` | Settings page loads |
| 2 | Find notification toggles/checkboxes | Toggles visible |
| 3 | Toggle a setting off | Visual state changes |
| 4 | Save settings | "Settings saved" confirmation |
| 5 | Refresh page | Toggle state persists |
| 6 | Toggle back on and save | State reverts successfully |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-FORM-013 — XSS Input Prevention
**Priority:** 🔴 P0  
**Type:** Security

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | In any text input, type: `<script>alert('XSS')</script>` | Input typed |
| 2 | Submit the form | Form submitted |
| 3 | Check if alert fires | No alert box should appear |
| 4 | Check if script rendered in DOM | Script not executed |
| 5 | Verify input is sanitized or escaped | Input shown as text, not HTML |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## Forms Module Summary

| TC ID | Description | Priority | Status |
|-------|-------------|----------|--------|
| TC-FORM-001 | Required field validation | 🟠 P1 | 🔄 |
| TC-FORM-002 | Email format validation | 🟠 P1 | 🔄 |
| TC-FORM-003 | Password min length | 🟠 P1 | 🔄 |
| TC-FORM-004 | Confirm password match | 🟠 P1 | 🔄 |
| TC-FORM-005 | Max length limits | 🟡 P2 | 🔄 |
| TC-FORM-006 | Submit disabled on loading | 🟠 P1 | 🔄 |
| TC-FORM-007 | Errors clear on correction | 🟡 P2 | 🔄 |
| TC-FORM-008 | Profile edit save | 🟠 P1 | 🔄 |
| TC-FORM-009 | Profile picture upload | 🟠 P1 | 🔄 |
| TC-FORM-010 | Upload file validation | 🟡 P2 | 🔄 |
| TC-FORM-011 | Change password form | 🟠 P1 | 🔄 |
| TC-FORM-012 | Settings form | 🟡 P2 | 🔄 |
| TC-FORM-013 | XSS prevention | 🔴 P0 | 🔄 |
