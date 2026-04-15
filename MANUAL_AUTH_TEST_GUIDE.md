# 🧪 Manual Auth Testing Guide - All Roles

**Purpose:** Step-by-step guide to manually test signup and login for every role  
**Duration:** ~20-30 minutes for all roles  
**Difficulty:** Easy - Just follow the steps

---

## 📌 Pre-Test Setup

### Backend Check:
```bash
# Verify backend is running
curl http://localhost:8000/api/auth/health
# Expected: 200 OK or similar

# Check database connection
curl http://localhost:8000/api/health
```

### Frontend Check:
```bash
# Verify frontend is running
curl http://localhost:3000
# Should return HTML (frontend running)

# Check console for auth module loaded
# Navigate to http://localhost:3000/login
# Open DevTools → Console → Should see no errors
```

### Test Data:
- **Password:** `SecurePass123!` (use same for all tests)
- **API Base:** `http://localhost:8000`
- **Frontend:** `http://localhost:3000`

---

## 🧑‍🎓 Test 1: Student Role

### Step 1.1: Signup as Student
1. Open `http://localhost:3000/signup`
2. Select **Role:** Student
3. Enter:
   - Email: `student_test_$(date +%s)@lumina-test.com`
   - Password: `SecurePass123!`
   - Full Name: `Test Student`
   - College: (optional) Select or leave empty
4. Click **Sign Up**
5. **Expected:** 
   - ✅ Dashboard loads
   - ✅ User profile shows "Student" role
   - ✅ Access token in localStorage (`auth.accessToken`)

### Step 1.2: Verify Dashboard
- [ ] Student dashboard displays correctly
- [ ] Can access student resources
- [ ] Profile shows correct role

### Step 1.3: Logout
- [ ] Click Logout
- [ ] Redirects to login page
- [ ] localStorage cleared

### Step 1.4: Login as Student
1. Navigate to `http://localhost:3000/login`
2. Select **Role:** Student
3. Enter:
   - Email: `student_test_[SAME_EMAIL]@lumina-test.com`
   - Password: `SecurePass123!`
4. Click **Login**
5. **Expected:**
   - ✅ Dashboard loads
   - ✅ User data matches signup
   - ✅ Access token valid

### Step 1.5: Invalid Password Test
1. From login page, try same email with wrong password
2. Password: `WrongPassword123!`
3. Click **Login**
4. **Expected:**
   - ✅ 401 error displayed
   - ✅ Not redirected to dashboard
   - ✅ Error message: "Invalid credentials"

---

## 👨‍🏫 Test 2: Teacher Role

### Step 2.1: Signup as Teacher
1. Open `http://localhost:3000/signup`
2. Select **Role:** Teacher
3. Enter:
   - Email: `teacher_test_$(date +%s)@lumina-test.com`
   - Password: `SecurePass123!`
   - Full Name: `Test Teacher`
4. Click **Sign Up**
5. **Expected:** ✅ Dashboard loads, role shows "Teacher"

### Step 2.2: Verify Teacher Features
- [ ] Teacher dashboard displays
- [ ] Can create assignments/lessons
- [ ] Can view student submissions

### Step 2.3: Login Test
1. Logout
2. Login with same credentials
3. **Expected:** ✅ Teacher dashboard loads again

---

## 👨‍👩‍👧 Test 3: Parent Role

### Step 3.1: Signup as Parent
1. Open `http://localhost:3000/signup`
2. Select **Role:** Parent
3. Enter:
   - Email: `parent_test_$(date +%s)@lumina-test.com`
   - Password: `SecurePass123!`
   - Full Name: `Test Parent`
4. Click **Sign Up**
5. **Expected:** ✅ Parent dashboard loads

### Step 3.2: Verify Parent Features
- [ ] Can see child's activities
- [ ] Parent-specific dashboard displays
- [ ] Can track progress

### Step 3.3: Login Test
- [ ] Logout and login again successfully

---

## 🎓 Test 4: Mentor Role

### Step 4.1: Signup as Mentor
1. Open `http://localhost:3000/signup`
2. Select **Role:** Mentor
3. Enter:
   - Email: `mentor_test_$(date +%s)@lumina-test.com`
   - Password: `SecurePass123!`
   - Full Name: `Test Mentor`
4. Click **Sign Up**
5. **Expected:** ✅ Mentor dashboard loads

### Step 4.2: Verify Mentor Features
- [ ] Can view mentee list
- [ ] Can send guidance/feedback
- [ ] Mentor-specific tools available

### Step 4.3: Login Test
- [ ] Logout and login again successfully

---

## 👥 Test 5: Peer Tutor Role

### Step 5.1: Signup as Peer Tutor
1. Open `http://localhost:3000/signup`
2. Select **Role:** Peer Tutor
3. Enter:
   - Email: `peertut_test_$(date +%s)@lumina-test.com`
   - Password: `SecurePass123!`
   - Full Name: `Test Peer Tutor`
4. Click **Sign Up**
5. **Expected:** ✅ Peer Tutor dashboard loads

### Step 5.2: Verify Features
- [ ] Peer tutor dashboard shows
- [ ] Can create tutoring sessions
- [ ] Can message students

### Step 5.3: Login Test
- [ ] Logout and login again successfully

---

## 🔬 Test 6: Researcher Role

### Step 6.1: Signup as Researcher
1. Open `http://localhost:3000/signup`
2. Select **Role:** Researcher
3. Enter:
   - Email: `researcher_test_$(date +%s)@lumina-test.com`
   - Password: `SecurePass123!`
   - Full Name: `Test Researcher`
4. Click **Sign Up**
5. **Expected:** ✅ Researcher dashboard loads

### Step 6.2: Verify Features
- [ ] Can access research data
- [ ] Can run analytics
- [ ] Research tools available

### Step 6.3: Login Test
- [ ] Logout and login again successfully

---

## 🔒 Test 7: Invite-Only Roles (Should REJECT)

### Test 7.1: Admin Role - Should Fail
1. Open `http://localhost:3000/signup`
2. Select **Role:** Admin (if visible in dropdown)
3. Enter credentials
4. Click **Sign Up**
5. **Expected:** 
   - ❌ **Error:** "Cannot self-signup for admin role"
   - ❌ Not redirected to dashboard
   - ❌ Email NOT created in database

### Test 7.2: HOD Role - Should Fail
1. Try to signup with **Role:** HOD
2. **Expected:** Error "Cannot self-signup for HOD role"

### Test 7.3: College Admin - Should Fail
1. Try to signup with **Role:** College Admin
2. **Expected:** Error "Cannot self-signup for College Admin role"

---

## ⚠️ Test 8: Error Scenarios

### Test 8.1: Missing Email
1. On signup form, leave **Email** empty
2. Click **Sign Up**
3. **Expected:** Validation error "Email is required"

### Test 8.2: Weak Password
1. Enter password: `123` (too weak)
2. Click **Sign Up**
3. **Expected:** Error "Password must be at least 8 characters"

### Test 8.3: Invalid Email Format
1. Enter email: `not-an-email`
2. Click **Sign Up**
3. **Expected:** Error "Please enter a valid email"

### Test 8.4: Duplicate Email
1. Signup with `student_test_1234@lumina-test.com`
2. Logout
3. Try signup again with SAME email
4. **Expected:** Error "Email already exists"

### Test 8.5: Non-existent User Login
1. On login page, enter: `notexist_12345@lumina-test.com`
2. Password: `SecurePass123!`
3. Click **Login**
4. **Expected:** Error "Invalid credentials"

---

## 🔍 DevTools Console Checks

For each role test, open **DevTools Console** and verify:

### After Signup/Login:
```javascript
// In browser console:
console.log(localStorage.getItem('auth'))
// Should show: {"accessToken": "eyJ...", "user": {...}}

console.log(JSON.parse(localStorage.getItem('auth')).user.role)
// Should show: "student" (or respective role)
```

### Check API Request Body:
1. Open **DevTools → Network**
2. Filter for `POST /api/auth/login`
3. Click request
4. Check **Request Body:**
```json
{
  "user": {
    "identifier": "student_test_1234@lumina-test.com",
    "password": "SecurePass123!"
  },
  "payload": {
    "role": "student"
  }
}
```
**Expected:** Matches nested structure (NOT flat)

### Check API Response:
1. In same Network tab, view **Response:**
```json
{
  "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": "...",
    "email": "student_test_1234@lumina-test.com",
    "role": "student",
    ...
  }
}
```

---

## 📊 Test Results Template

### Testing Session: [DATE & TIME]

**Tester:** [Name]  
**Environment:** `http://localhost:3000` and `http://localhost:8000`  
**Duration:** [Start - End]

#### Self-Signup Roles:

| Role | Signup | Login | Invalid Login | Dashboard | Status |
|------|--------|-------|---------------|-----------|--------|
| Student | ✅ | ✅ | ✅ | ✅ | ✅ PASS |
| Teacher | ⬜ | ⬜ | ⬜ | ⬜ | ⏳ TODO |
| Parent | ⬜ | ⬜ | ⬜ | ⬜ | ⏳ TODO |
| Mentor | ⬜ | ⬜ | ⬜ | ⬜ | ⏳ TODO |
| Peer Tutor | ⬜ | ⬜ | ⬜ | ⬜ | ⏳ TODO |
| Researcher | ⬜ | ⬜ | ⬜ | ⬜ | ⏳ TODO |

#### Invite-Only Roles:

| Role | Signup (Should Fail) | Error Message | Status |
|------|----------------------|---------------|--------|
| Admin | ✅ (Rejected) | "Cannot self-signup..." | ✅ PASS |
| HOD | ⬜ | ⬜ | ⏳ TODO |
| College Admin | ⬜ | ⬜ | ⏳ TODO |

#### Error Scenarios:

| Scenario | Result | Status |
|----------|--------|--------|
| Missing Email | Validation error | ✅ PASS |
| Weak Password | Validation error | ✅ PASS |
| Invalid Email | Validation error | ✅ PASS |
| Duplicate Email | 400 error | ⏳ TODO |
| Wrong Password | 401 error | ⏳ TODO |

**Overall Status:** ⏳ IN PROGRESS

**Issues Found:**
- [ ] None yet

**Notes:**
- All tests following nested request structure
- Console shows correct auth tokens
- Dashboard routing working

---

## ✅ Completion Checklist

After completing all tests:

- [ ] All 6 self-signup roles pass signup test
- [ ] All 6 self-signup roles pass login test
- [ ] All 6 self-signup roles handle invalid credentials correctly
- [ ] All 3+ invite-only roles reject self-signup
- [ ] All error scenarios handled properly
- [ ] DevTools shows correct request structure
- [ ] DevTools shows valid JWT tokens
- [ ] Browser localStorage has auth data
- [ ] Each role routes to correct dashboard
- [ ] Logout clears authentication state
- [ ] No console errors during any test

**Final Status:** 
- [ ] 🟢 All Tests Passed - Ready for Production
- [ ] 🟡 Some Issues Found - See Notes
- [ ] 🔴 Critical Failures - Need Fixes

---

## 📞 If Tests Fail

1. **Check Backend Logs:**
   ```bash
   docker logs lumina-backend
   # Or wherever backend is running
   ```

2. **Check Frontend Logs:**
   - Open DevTools console for error messages
   - Check Network tab for failed requests

3. **Verify Request Structure:**
   - Network tab → POST /api/auth/login
   - Request body should be:
   ```json
   {
     "user": {...},
     "payload": {...}
   }
   ```

4. **Verify Response:**
   - Should include `accessToken` and `user` data

5. **Database Check:**
   - Verify user was created in database
   - Check role value is correct

---

**Total Test Time:** ~30 minutes for all 11 roles + error scenarios  
**Recommended:** Complete in one session for consistency
