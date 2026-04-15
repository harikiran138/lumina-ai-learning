# 🔐 Lumina Authentication Fix Guide

## ✅ What Was Fixed

The frontend/backend auth mismatch has been corrected:

### ✓ Backend Changes
- Updated `LoginRequest` schema to accept `college_id` parameter
- All roles now properly validated during login
- College login policy enforced for institution-specific rules

### ✓ Frontend Changes  
- Added debug logging in `handleLogin()` to track request payload
- Added debug logging in `handleSignup()` to track request payload
- Better error messages for 422 (Unprocessable Entity) errors
- Proper handling for all role types (student, teacher, admin, etc.)

---

## 📋 Expected Request/Response Formats

### LOGIN FLOW

#### Frontend Request (Sent to Backend)
```typescript
POST /api/auth/login

Body:
{
  "identifier": "student@example.com",  // email, roll number, or employee ID
  "password": "SecurePass123",
  "role_hint": "student",               // optional: student|teacher|admin|hod|parent
  "college_id": "college-uuid"          // optional: for institution-specific login
}
```

#### Backend Response (Success - 200)
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "student@example.com",
    "fullName": "John Doe",
    "role": "student",
    "collegeId": "college-uuid",
    "deptId": "dept-uuid",
    "batchId": "batch-uuid",
    "onboardingStep": 0,
    "onboardingCompleted": false,
    "adaptiveOnboardingCompleted": false,
    "profilePhotoUrl": null,
    "mustChangePassword": false
  }
}
```

#### Backend Response (Invalid Credentials - 401)
```json
{
  "detail": "Invalid credentials"
}
```

#### Backend Response (Validation Error - 422)
```json
{
  "detail": [
    {
      "loc": ["body", "identifier"],
      "msg": "Field required",
      "type": "value_error.missing"
    }
  ]
}
```

---

### SIGNUP FLOW

#### Frontend Request (Sent to Backend)
```typescript
POST /api/auth/register

Body:
{
  "email": "newstudent@example.com",
  "password": "SecurePass123",          // min 8 chars, 1 uppercase, 1 number
  "full_name": "Jane Doe",
  "role": "student"                     // student|teacher|parent|mentor|peer_tutor|researcher|alumni
}
```

#### Backend Response (Success - 201)
```json
{
  "id": "uuid",
  "email": "newstudent@example.com",
  "fullName": "Jane Doe",
  "role": "student",
  "onboardingStep": 0,
  "onboardingCompleted": false,
  "adaptiveOnboardingCompleted": false
}
```

#### Backend Response (Email Exists - 400)
```json
{
  "detail": "Email already exists"
}
```

#### Backend Response (Invalid Role - 403)
```json
{
  "detail": "Registration as 'admin' requires an admin invitation."
}
```

---

## 🧪 Testing Guide - All Roles

### Test Case 1: Student Login

**Browser Console (DevTools)**
```javascript
// Add this to your frontend code to test manually in browser console

// Method 1: Via API
fetch('http://localhost:8000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    identifier: 'student@lumina.ai',
    password: 'SecurePass123',
    role_hint: 'student'
  })
})
.then(r => r.json())
.then(d => console.log('✅ Student Login:', d))
.catch(e => console.error('❌ Error:', e));
```

**Expected Output:**
```
✅ Student Login: {
  accessToken: "eyJ...",
  user: {role: "student", ...}
}
```

### Test Case 2: Teacher Login

```javascript
fetch('http://localhost:8000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    identifier: 'teacher@lumina.ai',
    password: 'SecurePass123',
    role_hint: 'teacher'
  })
})
.then(r => r.json())
.then(d => console.log('✅ Teacher Login:', d))
.catch(e => console.error('❌ Error:', e));
```

### Test Case 3: Admin Login

```javascript
fetch('http://localhost:8000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    identifier: 'admin@lumina.ai',
    password: 'SecurePass123',
    role_hint: 'admin'
  })
})
.then(r => r.json())
.then(d => console.log('✅ Admin Login:', d))
.catch(e => console.error('❌ Error:', e));
```

### Test Case 4: Student Signup

```javascript
fetch('http://localhost:8000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'newstudent@example.com',
    password: 'SecurePass123',
    full_name: 'New Student',
    role: 'student'
  })
})
.then(r => r.json())
.then(d => console.log('✅ Student Signup:', d))
.catch(e => console.error('❌ Error:', e));
```

### Test Case 5: Teacher Signup

```javascript
fetch('http://localhost:8000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'newteacher@example.com',
    password: 'SecurePass123',
    full_name: 'New Teacher',
    role: 'teacher'
  })
})
.then(r => r.json())
.then(d => console.log('✅ Teacher Signup:', d))
.catch(e => console.error('❌ Error:', e));
```

---

## 🐛 Debugging Checklist

### Browser DevTools Console (F12 → Console Tab)

When you login/signup, you should see these logs:

```
[AUTH] Login payload: {
  identifier: "student@lumina.ai",
  password: "SecurePass123",
  role_hint: "student"
}
[AUTH] Login successful: student@lumina.ai Role: student
```

Or for signup:

```
[AUTH] Signup payload: {
  name: "John Doe",
  email: "john@example.com",
  password: "SecurePass123",
  role: "student"
}
[AUTH] Signup successful: john@example.com Role: student
```

### If You See 422 Error

```
[AUTH] Login error: Error: Invalid login format. Please check your input and try again.
```

**This means:**
1. One of the required fields is missing
2. Field format is incorrect
3. Check the browser console for the exact error

**Solution:**
```
✓ Identifier must be: email, roll number, or employee ID
✓ Password must be: minimum 8 characters
✓ role_hint must be: student|teacher|admin|hod|parent (optional)
```

### If You See 401 Error

```
[AUTH] Login error: Error: Incorrect password for student@lumina.ai. Please try again.
```

**This means:**
1. User exists but password is wrong
2. Or user doesn't exist
3. Check that the account is active

**Solution:**
- Verify password is exactly correct
- Check account exists in database
- Verify account is not disabled

### If You See 400 Error (Registration)

```
[AUTH] Signup error: Error: Email student@lumina.ai is already registered. Please sign in instead.
```

**This means:**
1. Account already exists
2. Use login instead of signup

---

## 🔄 Request/Response Flow

### Complete Login Flow (Student)

```
1. User enters email + password
   ├─ Frontend validates (min 8 chars, etc.)
   └─ frontend logs: [AUTH] Login payload: {...}

2. Frontend sends: POST /api/auth/login
   Body: {identifier, password, role_hint}
   
3. Backend validates:
   ├─ Check required fields
   ├─ Resolve identifier (email/roll/empid)
   ├─ Verify password hash
   ├─ Check account is active
   ├─ Check college login policy (if college_id provided)
   └─ Generate JWT tokens

4. Backend responds:
   ├─ Set HTTP-only cookies (access_token, refresh_token)
   └─ Return:
      {
        accessToken: "...",
        user: {id, email, role, ...}
      }

5. Frontend stores:
   ├─ accessToken in localStorage
   ├─ Parse cookies (browser auto-handles)
   └─ Set currentUser in state
   
6. Frontend logs:
   └─ [AUTH] Login successful: student@lumina.ai Role: student

7. Frontend redirects to dashboard based on role
```

### Complete Signup Flow (Master)

```
1. User enters name + email + password + role
   ├─ Frontend validates form
   └─ frontend logs: [AUTH] Signup payload: {...}

2. Frontend sends: POST /api/auth/register
   Body: {email, password, full_name, role}
   
3. Backend validates:
   ├─ Check email doesn't exist
   ├─ Check password complexity
   ├─ Check role is allowed
   └─ Create user + role-specific profiles

4. Backend responds:
   └─ Return user record (201 Created)

5. Frontend automatically logs in:
   ├─ Call login() with same credentials
   └─ Follows login flow (steps 2-7 above)
```

---

## 🚀 All Valid Roles

### Self-Signup Roles (User can register)
- ✅ `student`
- ✅ `teacher`
- ✅ `parent`
- ✅ `mentor`
- ✅ `peer_tutor`
- ✅ `researcher`
- ✅ `alumni`
- ✅ `content_creator`
- ✅ `counselor`

### Invite-Only Roles (Admin must create)
- ❌ `faculty`
- ❌ `hod` (Head of Department)
- ❌ `college_admin`
- ❌ `system_admin`

---

## 🎯 Common Issues and Fixes

### Issue 1: "Field required" 422 Error

**Cause:** Missing required field in request body

**Fix:**
```typescript
// ❌ WRONG - missing role in signup
{
  name: "John",
  email: "john@example.com",
  password: "Pass123"
}

// ✅ CORRECT - all required fields
{
  name: "John",
  email: "john@example.com",
  password: "Pass123",
  role: "student"  // Required!
}
```

### Issue 2: "Invalid credentials" 401 Error

**Cause:** Wrong password or user doesn't exist

**Fix:**
```typescript
// ❌ WRONG - password doesn't match
{
  identifier: "student@lumina.ai",
  password: "WrongPassword123"
}

// ✅ CORRECT - verify password in database
// Or check that user was created in database
```

### Issue 3: "Email already exists" 400 Error

**Cause:** Trying to signup with existing email

**Fix:**
```typescript
// ❌ WRONG - signup with existing email
POST /api/auth/register
{ email: "existing@lumina.ai", ...}

// ✅ CORRECT - use login instead
POST /api/auth/login
{ identifier: "existing@lumina.ai", password: "..." }
```

### Issue 4: Password Validation Error

**Cause:** Password doesn't meet complexity requirements

**Fix:**
```typescript
// ❌ WRONG - missing uppercase
{ password: "securepass123" }

// ❌ WRONG - no number
{ password: "SecurePass" }

// ❌ WRONG - too short
{ password: "Pass1" }

// ✅ CORRECT - 8+ chars, 1 uppercase, 1 number
{ password: "SecurePass123" }
```

---

## 📊 Testing Matrix

| Scenario | Role | Signup | Login | Expected |
|----------|------|--------|-------|----------|
| New student | student | ✅ POST | ✅ POST | 201 → 200 |
| New teacher | teacher | ✅ POST | ✅ POST | 201 → 200 |
| New parent | parent | ✅ POST | ✅ POST | 201 → 200 |
| New admin | admin | ❌ 403 | ✅ POST | 403 → 200 |
| Returning user | student | ❌ 400 | ✅ POST | 400 → 200 |
| Wrong password | student | N/A | ❌ 401 | 401 |
| Invalid role | invalid | ❌ 400 | N/A | 400 |

---

## 🔗 Related Files

- Frontend Auth API: [frontend/web/src/lib/api.ts](frontend/web/src/lib/api.ts#L855)
- Frontend UI: [frontend/web/src/components/auth/AuthGateway.tsx](frontend/web/src/components/auth/AuthGateway.tsx#L211)
- Backend Auth Router: [backend/app/routers/auth.py](backend/app/routers/auth.py#L59)
- Auth Schemas: [backend/app/routers/auth.py](backend/app/routers/auth.py#L59)

---

## ✨ Next Steps

1. **Test login/signup in browser** using the test cases above
2. **Check browser console** for `[AUTH]` logs
3. **Verify network requests** in Network tab (F12)
4. **Check backend logs** for any server errors
5. **Ensure all roles work** by testing at least one from each role type

---

*Last updated: April 15, 2026*
