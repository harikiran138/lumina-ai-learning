# 🔐 TC-AUTH — Authentication Test Cases

> **Module:** Authentication System  
> **Priority:** 🔴 P0 — All auth tests are critical  
> **Dependencies:** Backend API must be running, `.env` configured

---

## Pre-conditions
- Dev server running at `http://localhost:3000` (or configured port)
- Backend API accessible
- No active session / clear browser storage before starting
- Test user credentials available:
  - **Valid user:** `testuser@lumina.com` / `Test@1234`
  - **Invalid user:** `fake@notreal.com` / `wrongpassword`
  - **Admin user:** `admin@lumina.com` / `Admin@1234`

---

## TC-AUTH-001 — Login Page Renders
**Priority:** 🔴 P0  
**Type:** Smoke Test

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/login` | Page loads without error |
| 2 | Inspect page title | Title contains "Login" or "Sign In" |
| 3 | Check for email input field | Email input is visible and focusable |
| 4 | Check for password input field | Password input is visible, type="password" |
| 5 | Check for submit button | "Login" / "Sign In" button is visible and enabled |
| 6 | Check for registration link | Link to `/register` or `/signup` exists |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-AUTH-002 — Successful Login with Valid Credentials
**Priority:** 🔴 P0  
**Type:** Functional

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/login` | Login page loads |
| 2 | Enter `testuser@lumina.com` in email field | Email field populated |
| 3 | Enter `Test@1234` in password field | Password masked with dots |
| 4 | Click "Login" / "Sign In" button | Loading indicator appears |
| 5 | Wait for response | Redirected to `/dashboard` or `/home` |
| 6 | Check auth token in localStorage/cookies | JWT token stored |
| 7 | Check user name visible in navbar | User's name shown in header |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-AUTH-003 — Login Failure with Wrong Password
**Priority:** 🔴 P0  
**Type:** Negative

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/login` | Login page loads |
| 2 | Enter `testuser@lumina.com` | Email field populated |
| 3 | Enter `wrongpassword` | Password field populated |
| 4 | Click submit | Error message appears |
| 5 | Check error message text | Shows "Invalid credentials" or similar |
| 6 | Verify still on login page | Not redirected |
| 7 | Verify no token stored | localStorage has no auth token |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-AUTH-004 — Login Failure with Invalid Email Format
**Priority:** 🟠 P1  
**Type:** Validation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/login` | Login page loads |
| 2 | Enter `notanemail` in email field | Field accepts input |
| 3 | Enter any password | Password field populated |
| 4 | Click submit | Validation error appears before API call |
| 5 | Check error message | "Invalid email format" or similar inline error |
| 6 | Verify no API call made | Network tab shows no request sent |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-AUTH-005 — Login with Empty Fields
**Priority:** 🟠 P1  
**Type:** Validation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/login` | Login page loads |
| 2 | Leave all fields empty | Fields are blank |
| 3 | Click submit | Validation errors shown on both fields |
| 4 | Check email error | "Email is required" visible |
| 5 | Check password error | "Password is required" visible |
| 6 | Verify no API call | No network request made |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-AUTH-006 — Registration Page Renders
**Priority:** 🔴 P0  
**Type:** Smoke Test

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/register` | Page loads |
| 2 | Check for name/username field | Name input visible |
| 3 | Check for email field | Email input visible |
| 4 | Check for password field | Password input visible |
| 5 | Check for confirm password field | Confirm password field visible |
| 6 | Check for submit button | Register / Sign Up button visible |
| 7 | Check for login link | Link to `/login` present |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-AUTH-007 — Successful User Registration
**Priority:** 🔴 P0  
**Type:** Functional

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/register` | Page loads |
| 2 | Enter full name: `Test Student` | Name field populated |
| 3 | Enter unique email: `new_student_[timestamp]@test.com` | Email populated |
| 4 | Enter password: `Secure@123` | Password masked |
| 5 | Enter same in confirm password | Confirm field populated |
| 6 | Click Register | Success message or redirect |
| 7 | Check outcome | Redirected to login or dashboard |
| 8 | Verify success toast/message | "Account created" message shown |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-AUTH-008 — Registration with Duplicate Email
**Priority:** 🟠 P1  
**Type:** Negative

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/register` | Page loads |
| 2 | Enter existing email: `testuser@lumina.com` | Email populated |
| 3 | Fill all other fields with valid data | Fields populated |
| 4 | Click Register | Error response from API |
| 5 | Check error message | "Email already exists" or similar |
| 6 | Verify stays on register page | Not redirected |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-AUTH-009 — Password Mismatch on Registration
**Priority:** 🟠 P1  
**Type:** Validation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/register` | Page loads |
| 2 | Fill name and email | Fields populated |
| 3 | Enter `Secure@123` in password | Password field set |
| 4 | Enter `Different@456` in confirm password | Different value |
| 5 | Click Register | Validation error shown |
| 6 | Check error | "Passwords do not match" message |
| 7 | Verify no API call | No network request |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-AUTH-010 — Forgot Password Flow
**Priority:** 🟠 P1  
**Type:** Functional

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/login` | Login page loads |
| 2 | Click "Forgot Password?" link | Redirected to `/forgot-password` |
| 3 | Enter `testuser@lumina.com` | Email field populated |
| 4 | Click "Send Reset Link" | Success message shown |
| 5 | Check message text | "Check your email for reset link" |
| 6 | Verify no crash | Page stays functional |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-AUTH-011 — Protected Route Redirect (Unauthenticated)
**Priority:** 🔴 P0  
**Type:** Security

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Clear all cookies and localStorage | No auth token present |
| 2 | Navigate directly to `/dashboard` | Redirected to `/login` |
| 3 | Navigate directly to `/profile` | Redirected to `/login` |
| 4 | Navigate directly to `/settings` | Redirected to `/login` |
| 5 | Check URL after redirect | URL is `/login` or `/signin` |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-AUTH-012 — Session Persistence on Page Refresh
**Priority:** 🟠 P1  
**Type:** Functional

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in with valid credentials | User logged in, on dashboard |
| 2 | Refresh the browser (F5) | Page reloads |
| 3 | Check if still logged in | Dashboard still visible |
| 4 | Verify username in navbar | Name still shown |
| 5 | Verify no redirect to login | Still on dashboard |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-AUTH-013 — Logout Functionality
**Priority:** 🔴 P0  
**Type:** Functional

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in with valid credentials | User on dashboard |
| 2 | Click profile/avatar in header | Dropdown appears |
| 3 | Click "Logout" option | Action triggered |
| 4 | Check redirect | Redirected to `/login` or home |
| 5 | Check localStorage | Auth token removed |
| 6 | Navigate to `/dashboard` | Redirected to login (not dashboard) |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-AUTH-014 — Password Strength Validation
**Priority:** 🟡 P2  
**Type:** Validation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/register` | Page loads |
| 2 | Type `123` in password field | Weak password indicator shown |
| 3 | Type `password` | Still shows weak |
| 4 | Type `Secure@123` | Strong indicator shown |
| 5 | Verify strength meter renders | Visual bar or text indicator present |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-AUTH-015 — Login Page Accessibility
**Priority:** 🟡 P2  
**Type:** Accessibility

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/login` | Page loads |
| 2 | Press Tab key | Focus moves to email field |
| 3 | Press Tab again | Focus moves to password field |
| 4 | Press Tab again | Focus moves to submit button |
| 5 | Press Enter on submit | Form submitted |
| 6 | Check screen reader labels | All fields have `aria-label` or `<label>` |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## Auth Module Summary

| TC ID | Description | Priority | Status |
|-------|-------------|----------|--------|
| TC-AUTH-001 | Login page renders | 🔴 P0 | 🔄 |
| TC-AUTH-002 | Successful login | 🔴 P0 | 🔄 |
| TC-AUTH-003 | Wrong password error | 🔴 P0 | 🔄 |
| TC-AUTH-004 | Invalid email format | 🟠 P1 | 🔄 |
| TC-AUTH-005 | Empty fields validation | 🟠 P1 | 🔄 |
| TC-AUTH-006 | Register page renders | 🔴 P0 | 🔄 |
| TC-AUTH-007 | Successful registration | 🔴 P0 | 🔄 |
| TC-AUTH-008 | Duplicate email error | 🟠 P1 | 🔄 |
| TC-AUTH-009 | Password mismatch | 🟠 P1 | 🔄 |
| TC-AUTH-010 | Forgot password flow | 🟠 P1 | 🔄 |
| TC-AUTH-011 | Protected route guard | 🔴 P0 | 🔄 |
| TC-AUTH-012 | Session persistence | 🟠 P1 | 🔄 |
| TC-AUTH-013 | Logout functionality | 🔴 P0 | 🔄 |
| TC-AUTH-014 | Password strength | 🟡 P2 | 🔄 |
| TC-AUTH-015 | Login accessibility | 🟡 P2 | 🔄 |
