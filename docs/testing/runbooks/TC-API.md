# 🔌 TC-API — API Connections & Data Flow Test Cases

> **Module:** API Integration, HTTP Requests, State Management  
> **Priority:** 🔴 P0 — 🟠 P1  
> **Tools Needed:** Browser DevTools (Network tab), Postman (optional)

---

## Pre-conditions
- Application running locally
- Backend API accessible and running
- `.env` file configured with correct `VITE_API_URL` / `REACT_APP_API_URL`
- DevTools Network tab open during testing

---

## TC-API-001 — API Base URL Configuration
**Priority:** 🔴 P0  
**Type:** Configuration

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open `.env` file | File exists |
| 2 | Check `VITE_API_URL` or `REACT_APP_API_URL` | Variable is set (not empty) |
| 3 | Open browser DevTools → Network tab | Network panel open |
| 4 | Perform any action (login, load page) | API requests go to correct base URL |
| 5 | Verify request URL | Matches configured base URL |
| 6 | Verify no `localhost` hardcoded in production build | Requests use env variable |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-API-002 — Auth Token Attached to Private Requests
**Priority:** 🔴 P0  
**Type:** Security

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in with valid credentials | Logged in |
| 2 | Open DevTools → Network tab | Network tab open |
| 3 | Navigate to any authenticated page | API requests made |
| 4 | Click on any API request | Request details visible |
| 5 | Check Request Headers | `Authorization: Bearer <token>` present |
| 6 | Verify token is not empty | Non-empty JWT string |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-API-003 — Login API Call (POST /auth/login)
**Priority:** 🔴 P0  
**Type:** Functional

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open DevTools → Network tab | Network tab open |
| 2 | Submit login form with valid credentials | POST request sent |
| 3 | Find the login request | Request visible in Network tab |
| 4 | Check request method | Method = `POST` |
| 5 | Check request body | Contains `email` and `password` |
| 6 | Check response status | `200 OK` |
| 7 | Check response body | Contains `token` and `user` object |
| 8 | Verify token stored | Token saved to localStorage/cookies |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-API-004 — Failed Login API Response (401)
**Priority:** 🔴 P0  
**Type:** Error Handling

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open Network tab | Ready |
| 2 | Submit login with wrong password | POST request sent |
| 3 | Find the login request | Request visible |
| 4 | Check response status | `401 Unauthorized` |
| 5 | Check UI response | Error message shown to user |
| 6 | Verify app doesn't crash | Page still functional |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-API-005 — Fetch User Profile (GET /user/me or /profile)
**Priority:** 🔴 P0  
**Type:** Functional

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in and navigate to profile page | Profile page loads |
| 2 | Open Network tab | Monitor requests |
| 3 | Check for GET request to profile endpoint | Request visible |
| 4 | Check response status | `200 OK` |
| 5 | Check response data | Contains user name, email, avatar |
| 6 | Verify UI shows correct data | Profile data matches API response |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-API-006 — Update User Profile (PUT/PATCH /user/me)
**Priority:** 🟠 P1  
**Type:** Functional

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to profile edit page | Edit form loaded |
| 2 | Change display name to "Updated Name" | Field value changed |
| 3 | Click Save | PUT/PATCH request sent |
| 4 | Check Network tab | Request method is PUT or PATCH |
| 5 | Check response status | `200 OK` |
| 6 | Check UI updates | Name shown on page changed |
| 7 | Refresh page | Name persists after refresh |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-API-007 — Fetch Course List (GET /courses)
**Priority:** 🔴 P0  
**Type:** Functional (Core Lumina Feature)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/courses` | Courses page loads |
| 2 | Open Network tab | Monitor requests |
| 3 | Find GET request to courses endpoint | Request visible |
| 4 | Check response status | `200 OK` |
| 5 | Check response body | Array of course objects |
| 6 | Verify courses render on page | Course cards displayed |
| 7 | Count courses in API vs UI | Counts match |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-API-008 — Fetch Single Course Detail (GET /courses/:id)
**Priority:** 🔴 P0  
**Type:** Functional

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click on a course card | Course detail page loads |
| 2 | Check URL | Has course ID in URL `/courses/123` |
| 3 | Find GET request to course endpoint | Request visible in Network |
| 4 | Check response | Course detail object returned |
| 5 | Verify page shows course name, description, content | Data matches API response |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-API-009 — API 401 Auto-Logout (Token Expired)
**Priority:** 🔴 P0  
**Type:** Security / Error Handling

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in normally | User logged in |
| 2 | Manually delete auth token from localStorage | Token removed |
| 3 | Try to navigate to a protected page | API returns 401 |
| 4 | Check UI response | Auto-redirected to login page |
| 5 | Check for error message | "Session expired" or similar message |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-API-010 — API 500 Server Error Handling
**Priority:** 🟠 P1  
**Type:** Error Handling

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Use DevTools to block/mock API to return 500 | API returns 500 |
| 2 | Trigger any data-fetching action | Error state triggered |
| 3 | Check UI | User-friendly error message shown |
| 4 | Verify no JSON or stack trace exposed to user | Clean error message only |
| 5 | Check for retry button | Option to retry request present |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-API-011 — API Request Loading States
**Priority:** 🟠 P1  
**Type:** UX

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Throttle network to "Slow 3G" | Network slowed |
| 2 | Navigate to courses page | Loading spinner/skeleton shows |
| 3 | Wait for data | Spinner disappears, data loads |
| 4 | Throttle network to "Offline" | No connection |
| 5 | Try to load any page | Offline/error message shown |
| 6 | Restore network | Data loads on reconnect or retry |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-API-012 — No Sensitive Data in Request URLs
**Priority:** 🔴 P0  
**Type:** Security

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open Network tab | Ready |
| 2 | Log in and perform several actions | Multiple API requests made |
| 3 | Inspect all request URLs | No passwords in URL params |
| 4 | Check query strings | No auth tokens in URL |
| 5 | Check request bodies for login | Password sent in body, not URL |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-API-013 — CORS Headers Check
**Priority:** 🟠 P1  
**Type:** Configuration

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open Network tab | Ready |
| 2 | Make any API request | Request visible |
| 3 | Check response headers | `Access-Control-Allow-Origin` present |
| 4 | Check for CORS errors in console | No CORS errors in red |
| 5 | Check for preflight OPTIONS request | OPTIONS request returns 200 |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-API-014 — Enrollment API (POST /enroll or /courses/:id/enroll)
**Priority:** 🔴 P0  
**Type:** Functional (Core Lumina Feature)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to a course detail page | Course page loaded |
| 2 | Find "Enroll" button | Button visible |
| 3 | Click "Enroll" | POST request sent |
| 4 | Check response status | `200 OK` or `201 Created` |
| 5 | Check UI update | Button changes to "Enrolled" or "Continue" |
| 6 | Navigate to dashboard | Course shows in enrolled courses |
| 7 | Verify API reflects enrollment | GET /courses returns enrolled status |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## TC-API-015 — Search API (GET /search?q=...)
**Priority:** 🟠 P1  
**Type:** Functional

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Use the global search bar | Search input active |
| 2 | Type "React" (or any relevant keyword) | Request sent after typing |
| 3 | Check Network tab | GET request to `/search?q=React` or similar |
| 4 | Check query parameter | Search term encoded in URL |
| 5 | Check response | Array of matching results |
| 6 | Check UI | Results displayed correctly |

**Status:** 🔄 PENDING  
**Notes:** _______________

---

## API Module Summary

| TC ID | Description | Priority | Status |
|-------|-------------|----------|--------|
| TC-API-001 | Base URL configured | 🔴 P0 | 🔄 |
| TC-API-002 | Auth token in headers | 🔴 P0 | 🔄 |
| TC-API-003 | Login POST call | 🔴 P0 | 🔄 |
| TC-API-004 | Failed login 401 | 🔴 P0 | 🔄 |
| TC-API-005 | Fetch user profile | 🔴 P0 | 🔄 |
| TC-API-006 | Update user profile | 🟠 P1 | 🔄 |
| TC-API-007 | Fetch course list | 🔴 P0 | 🔄 |
| TC-API-008 | Fetch course detail | 🔴 P0 | 🔄 |
| TC-API-009 | Auto-logout on 401 | 🔴 P0 | 🔄 |
| TC-API-010 | 500 error handling | 🟠 P1 | 🔄 |
| TC-API-011 | Loading states | 🟠 P1 | 🔄 |
| TC-API-012 | No sensitive data in URL | 🔴 P0 | 🔄 |
| TC-API-013 | CORS headers | 🟠 P1 | 🔄 |
| TC-API-014 | Course enrollment | 🔴 P0 | 🔄 |
| TC-API-015 | Search API | 🟠 P1 | 🔄 |
