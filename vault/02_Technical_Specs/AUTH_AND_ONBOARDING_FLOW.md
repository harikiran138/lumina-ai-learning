# 🔐 Authentication & Onboarding Flow Documentation

**Last Updated:** April 15, 2026  
**Status:** Current Implementation  
**Scope:** Frontend (Next.js), Backend (FastAPI), Database (Supabase/PostgreSQL)

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Sign Up Flow](#sign-up-flow)
3. [Login Flow](#login-flow)
4. [Onboarding Flow](#onboarding-flow)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Security & Validation](#security--validation)
8. [Role-Based Access](#role-based-access)

---

## System Overview

The Lumina platform implements a **multi-role authentication system** with:
- **13+ distinct roles** (student, teacher, faculty, HOD, admin, parent, mentor, peer_tutor, counselor, researcher, alumni, content_creator)
- **Role-aware onboarding** with adaptive learning style profiling for students
- **Three-phase authentication**: Sign Up → Login → Onboarding
- **JWT-based session management** with token refresh and blacklisting
- **Brute-force protection** (5 failed attempts = 15-minute lockout)

---

## Sign Up Flow

### Frontend Entry Point
**File:** `frontend/web/src/app/register/page.tsx`
- Component: `AuthGateway` with `mode="signup"`
- Route: `/register`

### User Journey

#### Step 1: Role Selection
```
User selects role from: student, teacher, parent, mentor, 
peer_tutor, counselor, researcher, alumni, content_creator
```

**Available Signup Roles** (from `AuthGateway.tsx`):
| Role | Description | Icon |
|------|-------------|------|
| student | Adaptive learning & AI tutor | GraduationCap |
| teacher | Content creation & AI verification | BookOpen |
| counselor | Student wellbeing & support | Heart |
| parent | Monitor child progress | Users |
| mentor | Guidance & career support | Compass |
| peer_tutor | Collaborative learning | HeartHandshake |
| researcher | Educational impact studies | FlaskConical |
| alumni | Professional network & mentorship | School |
| content_creator | Build & share educational content | Compass |

#### Step 2: Form Submission
**Validation Schema** (`lib/schemas/auth.ts`):
```typescript
registerSchema = {
  name: string (min 2 chars),
  email: EmailStr (valid email format),
  password: string (min 8 chars, 1 uppercase, 1 number),
  confirmPassword: string (must match password),
  role: SignupRole (from list above)
}
```

#### Step 3: API Call
```
POST /api/auth/register
Headers: Content-Type: application/json
Body: {
  "full_name": string,
  "email": string,
  "password": string,
  "role": SignupRole,
  "phone": string (optional)
}
```

#### Step 4: Backend Processing (`backend/app/routers/auth.py`)

**Signup Endpoint:**
```python
@router.post("/register")
async def register(user_create: UserCreate, user_store: UserStore):
    # 1. Validate password complexity
    # 2. Hash password using bcrypt
    # 3. Check if email already exists
    # 4. Resolve role - check SELF_SIGNUP_ROLES vs INVITE_ONLY_ROLES
    # 5. Create user in database
    # 6. Return JWT token + user data
```

**Role Classification:**
- **Self-Signup Roles:** student, teacher, parent, mentor, peer_tutor, researcher, alumni, content_creator, counselor
- **Invite-Only Roles:** faculty, HOD, college_admin, system_admin

#### Step 5: Response
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "fullName": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "onboardingStep": 0,
    "onboardingCompleted": false,
    "adaptiveOnboardingCompleted": false
  }
}
```

#### Step 6: Frontend Redirect
```
After successful signup:
- Store token in/sessionStorage (managed by Zustand persist)
- If onboardingCompleted === false → Redirect to /onboarding
- Otherwise → Redirect to role-specific dashboard
```

---

## Login Flow

### Frontend Entry Point
**File:** `frontend/web/src/app/login/page.tsx`
- Component: `AuthGateway` with `mode="login"`
- Route: `/login`

### User Journey

#### Step 1: Choose Login Role
User selects role hint (5 attempts = 15 min lockout per role):

**Available Login Roles:**
| Role | Helper Text | ID |
|------|-------------|-----|
| student | Roll number or student email | student |
| teacher | Teacher email or ID | teacher |
| faculty | Faculty ID or institutional email | faculty |
| hod | Department head credentials | hod |
| admin | Administrative email access | admin |
| parent | Parent portal email | parent |
| mentor | Mentor email | mentor |
| counselor | Counselor email | counselor |
| researcher | Research portal access | researcher |
| alumni | Alumni network login | alumni |
| content_creator | Studio access | content_creator |

#### Step 2: Enter Credentials
**Validation Schema** (`lib/schemas/auth.ts`):
```typescript
loginSchema = {
  email: EmailStr (valid email),
  password: string (min 8 chars, 1 uppercase, 1 number)
}
```

The form accepts:
- **identifier**: Roll number (format: `\d{2}NU\dA\d{4}`), employee ID (format: `(FAC|HOD|ADM)\d{3}`), or email
- **email**: Email address (backward compatibility)
- **password**: User password
- **role_hint**: Selected role (used for validation)

#### Step 3: API Call
```
POST /api/auth/token
Body: {
  "identifier": "25NU1A1001" | "john@example.com",
  "password": "SecurePass123",
  "role_hint": "student"
}
```

#### Step 4: Backend Processing

**Identifier Resolution** (`backend/app/routers/auth.py`):
```python
def _get_identifier_type(identifier: str) -> str:
    if matches pattern \d{2}NU\dA\d{4}:
        return "roll_number"  # e.g., 25NU1A1001
    if matches pattern (FAC|HOD|ADM)\d{3}:
        return "employee_id"   # e.g., FAC001, HOD001, ADM001
    return "email"             # e.g., john@example.com
```

**Login Endpoint:**
```python
@router.post("/token")
async def login(request: LoginRequest, user_store: UserStore):
    # 1. Resolve identifier (roll_number/employee_id/email)
    # 2. Query user from database
    # 3. Check brute-force lockout (Sentinel L5)
    # 4. Verify password using bcrypt
    # 5. Check if password change is required
    # 6. Build JWT claims with role normalization
    # 7. Generate access token (1-hour expiry default)
    # 8. Return token + user data + onboarding status
```

**Brute-Force Protection:**
- Threshold: 5 failed attempts
- Lockout Duration: 15 minutes
- Tracked per: (email OR roll_number) + role_hint
- Uses Redis for lockout cache

#### Step 5: Response

**Success Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "fullName": "Rajesh Kumar",
    "email": "rajesh@college.edu",
    "role": "student",
    "departmentId": "dept_123",
    "collegeName": "NIT Warangal",
    "collegeId": "col_456",
    "batchId": "batch_789",
    "onboardingStep": 0,
    "onboardingCompleted": false,
    "adaptiveOnboardingCompleted": false,
    "profilePhotoUrl": null,
    "mustChangePassword": false
  }
}
```

**Error Response (401):**
```json
{
  "detail": "Invalid credentials",
  "error": "invalid_login"
}
```

**Lockout Response (429):**
```json
{
  "detail": "Account locked due to multiple failed login attempts. Try again in 15 minutes.",
  "error": "account_locked"
}
```

#### Step 6: Frontend State Management

**Zustand Store** (`frontend/web/src/store/useAuthStore.ts`):
```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  login(identifier, password, roleHint?, collegeId?): Promise<User>
  logout(): Promise<void>
  refreshUser(): Promise<void>
}
```

Actions:
1. Store token in `sessionStorage` / `localStorage` (persisted via Zustand middleware)
2. Store user object in state
3. Set `isAuthenticated = true`
4. Navigate to next screen

#### Step 7: Post-Login Routing

The middleware (`frontend/web/src/middleware.ts`) and `AuthGateway` enforce routing:

```typescript
function redirectAfterAuth(router, user) {
  // Only redirect to /onboarding if:
  // onboardingCompleted === false (explicit flag)
  
  if (!user.onboardingCompleted) {
    return router.push("/onboarding");
  }
  
  // Otherwise go to role-specific dashboard
  const homeRoute = getRoleHome(user.role, user.collegeId);
  return router.push(homeRoute);
}
```

**Role-Based Routing:**
```
student → /student/dashboard
teacher → /teacher/dashboard
faculty → /faculty/dashboard
hod → /hod/dashboard
admin → /admin/dashboard
parent → /parent/dashboard
counselor → /counselor/dashboard
mentor → /mentor/dashboard
peer_tutor → /peer_tutor/dashboard
researcher → /research/dashboard
alumni → /alumni/dashboard
content_creator → /content_creator/dashboard
```

---

## Onboarding Flow

### Entry Point
**File:** `frontend/web/src/app/onboarding/page.tsx`
**Route:** `/onboarding`
**Trigger:** After signup or first login when `onboardingCompleted === false`

### Architecture

The onboarding system uses **role-specific flows**:

```typescript
const structuredRoleFlows = [
  "student",            // Special: StudentOnboardingFlow
  "college_admin",      // Special: 2-step flow
  "teacher",            // RoleOnboardingFlow
  "parent",             // RoleOnboardingFlow
  "mentor",             // RoleOnboardingFlow
  "peer_tutor",         // RoleOnboardingFlow
  "counselor",          // RoleOnboardingFlow
  "researcher",         // RoleOnboardingFlow
  "content_creator",    // RoleOnboardingFlow
  "alumni",             // RoleOnboardingFlow
  "hod",                // RoleOnboardingFlow
  "faculty"             // RoleOnboardingFlow
];
```

Roles NOT in flow (admin, system_admin) skip onboarding and go directly to dashboard.

### Student Onboarding (Special Flow)

**File:** `frontend/web/src/components/onboarding/StudentOnboardingFlow.tsx`

#### Phase 1: Academic Information Collection
Steps:
1. Select/create college
2. Select department (HOD/Dean approval required for some)
3. Select batch/year
4. Enter roll number
5. Verify enrollment

**Data Collected:**
```json
{
  "collegeId": "string",
  "deptId": "string",
  "batchId": "string",
  "rollNumber": "string",
  "enrollmentVerified": boolean
}
```

#### Phase 2: Adaptive Learning Style Profiling
- Quiz-based assessment (10-15 questions)
- Identifies learning style: Visual, Auditory, Kinesthetic, Reading/Writing
- Stores result in `user_data` table with `learning_style` field

**Backend Validation:**
```python
def _is_adaptive_onboarding_completed(user: dict) -> bool:
    # Check if user_data record exists for user_id
    # If exists → Adaptive phase is complete
    # Zustand store persists as: useOnboardingStore.snapshots[role]
```

**State Management:**
```typescript
// useOnboardingStore.ts
saveSnapshot(role, snapshot) // Persist form draft
clearSnapshot(role)            // Clear on completion
```

#### Phase 3: Preferences & Goals
- Preferred learning time
- Study duration/frequency
- Goals (academic, career, personal)
- Communication preferences

### Other Role Onboarding (Standard 5-Step Flow)

**File:** `frontend/web/src/components/onboarding/RoleOnboardingFlow.tsx`

Roles: teacher, parent, mentor, peer_tutor, counselor, researcher, content_creator, alumni, hod, faculty

Standard 5-step flow (final onboarding_step = 5):
1. **Profile Setup**: Name, Photo, Bio
2. **Preferences**: Language, Timezone, Notification settings
3. **Role-Specific Data**: Department assignment, availability, qualifications
4. **Institutional Affiliation**: Connect to college/department
5. **Review & Confirm**: Summary before completion

### college_admin Onboarding (Special 2-Step Flow)

**File:** `frontend/web/src/app/onboarding/page.tsx` (line 119)  
**Backend:** `backend/app/routers/auth.py` (line 155: `required_steps = 2`)

college_admin has a **special brief 2-step flow** (final onboarding_step = 2):
1. **College Setup**: Configure institutional details
2. **Review & Confirm**: Summary before completion

**Note:** college_admin is NOT in bypass roles - it has a special shorter flow due to its administrative nature.

### Completion Flow

**Backend Endpoint:**
```
POST /api/onboarding/complete
Headers: Authorization: Bearer <token>
Body: (optional completion_data)
```

**Backend Processing:**
```python
@router.post("/complete")
async def complete_onboarding(user_id: str, db: AsyncSession):
    # 1. Update user.onboarding_completed = True
    # 2. Update user.onboarding_step to final value:
    #    - college_admin: 2
    #    - student: 7 (includes adaptive quiz)
    #    - others: 5
    # 3. Mark adaptiveOnboardingCompleted = True (if student and passed quiz)
    # 4. Audit log: "Onboarding completed"
    # 5. Return updated user object
```

**Frontend Post-Completion:**
```typescript
// Clear drafts
useOnboardingStore.clearSnapshot(role);

// Clear auth loading state
useAuthStore.setLoading(false);

// Redirect to dashboard
window.location.href = getRoleHome(role, collegeId);
```

### Onboarding Status Check

**Frontend:**
```typescript
const status = await api.getOnboardingStatus();
// Returns: { role, onboardingCompleted, adaptiveOnboardingCompleted }
```

**Backend:**
```python
@router.get("/onboarding-status")
async def get_onboarding_status(current_user: dict = Depends(get_current_user)):
    onboarding_completed, adaptive_completed = is_onboarding_complete(current_user)
    return {
        "role": current_user["role"],
        "onboardingCompleted": onboarding_completed,
        "adaptiveOnboardingCompleted": adaptive_completed,
        "onboardingStep": current_user.get("onboarding_step", 0)
    }
```

---

## Database Schema

### Users Table

**Table:** `users`

| Column | Type | Not Null | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | ✓ | uuid_generate_v4() | Primary Key |
| email | VARCHAR(255) | ✓ | | Unique |
| full_name | VARCHAR(255) | ✓ | | User display name |
| password_hash | VARCHAR(255) | ✓ | | bcrypt hash |
| role | VARCHAR(50) | ✓ | 'student' | Normalized role |
| college_id | UUID | | | Foreign key to institution |
| department_id | UUID | | | Foreign key to department |
| batch_id | UUID | | | Foreign key to batch |
| onboarding_step | INT | | 0 | Step number (0-5+) |
| onboarding_completed | BOOLEAN | | FALSE | Completion flag |
| must_change_password | BOOLEAN | | FALSE | Force password change |
| profile_photo_url | TEXT | | | Profile image URL |
| phone | VARCHAR(20) | | | Contact number |
| status | VARCHAR(50) | | 'active' | active, inactive, suspended |
| created_at | TIMESTAMP | ✓ | CURRENT_TIMESTAMP | Account creation time |
| updated_at | TIMESTAMP | ✓ | CURRENT_TIMESTAMP | Last update time |
| last_login | TIMESTAMP | | | Last login timestamp |

### User Data Table

**Table:** `user_data`

Stores additional profile and adaptive data:

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary Key |
| user_id | UUID | Foreign key to users |
| learning_style | VARCHAR(50) | Visual, Auditory, Kinesthetic, Reading/Writing |
| preferences | JSONB | User preferences (timezone, language, etc.) |
| goals | JSONB | Learning/career goals |
| metadata | JSONB | Additional adaptive data |
| created_at | TIMESTAMP | Record creation |
| updated_at | TIMESTAMP | Last update |

### Password Reset Tokens

**Table:** `password_reset_tokens`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary Key |
| user_id | UUID | Foreign key |
| token | VARCHAR(255) | Reset token (unique, hashed) |
| expires_at | TIMESTAMP | Expiration time (usually 1 hour) |
| used_at | TIMESTAMP | Completion timestamp (null if unused) |

### Login Audit Log

**Table:** `audit_logs`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary Key |
| user_id | UUID | User who performed action |
| action | VARCHAR(100) | login, logout, signup, password_reset, etc. |
| status | VARCHAR(50) | success, failure, locked |
| ip_address | INET | Client IP |
| user_agent | TEXT | Browser/client info |
| timestamp | TIMESTAMP | When action occurred |

---

## API Endpoints

### Authentication Routes

**Base URL:** `http://localhost:9000/api/auth`

#### 1. Sign Up
```
POST /register
Content-Type: application/json

Request:
{
  "email": "john@example.com",
  "password": "SecurePass123",
  "full_name": "John Doe",
  "role": "student",
  "phone": "+91 9876543210"
}

Response (201):
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... },
  "token_type": "bearer"
}

Error (400):
{
  "detail": "Email already exists",
  "error": "email_exists"
}

Error (422):
{
  "detail": [
    {
      "field": "password",
      "msg": "Password must contain at least one uppercase letter"
    }
  ]
}
```

#### 2. Login
```
POST /token
Content-Type: application/json

Request:
{
  "identifier": "john@example.com",
  "password": "SecurePass123",
  "role_hint": "student"
}

Response (200):
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... },
  "forcePasswordChange": false
}

Error (401):
{
  "detail": "Invalid credentials",
  "error": "invalid_login"
}

Error (429):
{
  "detail": "Account locked due to multiple failed attempts",
  "error": "account_locked"
}
```

#### 3. Logout
```
POST /logout
Headers: Authorization: Bearer <token>

Response (200):
{
  "message": "Successfully logged out",
  "success": true
}
```

#### 4. Refresh Token
```
POST /refresh
Cookie: refresh_token=<jwt_refresh_token>
(No Authorization header needed - token passed via secure HttpOnly cookie)

Response (200):
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

**Important Details:**
- Refresh token is stored in secure HttpOnly cookie (not accessible to JavaScript)
- Implements **token rotation**: old refresh token is blacklisted after new one is issued
- Checks for token reuse (replay attack detection)
- Refresh token has `type="refresh"` claim for verification

#### 5. Get Current User
```
GET /me
Headers: Authorization: Bearer <token>

Response (200):
{
  "id": "uuid",
  "email": "john@example.com",
  "fullName": "John Doe",
  "role": "student",
  ...
}
```

#### 6. Forgot Password
```
POST /forgot-password
Content-Type: application/json

Request:
{
  "email": "john@example.com"
}

Response (200):
{
  "message": "Password reset email sent",
  "success": true
}
```

#### 7. Reset Password
```
POST /reset-password
Content-Type: application/json

Request:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "newPassword": "NewSecurePass456"
}

Response (200):
{
  "message": "Password reset successful",
  "success": true
}
```

**Token Details:**
- Reset token is JWT-based with `type="reset"` claim
- 1-hour expiry from creation
- Contains `userId` in claims for verification
- Sent via email link to user
- Must meet password complexity requirements (uppercase + digit)

#### 8. Change Password
```
POST /change-password
Headers: Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "oldPassword": "CurrentPass123",
  "newPassword": "NewSecurePass456"
}

Response (200):
{
  "message": "Password changed successfully",
  "success": true
}
```

### Onboarding Routes

#### 1. Get Onboarding Status
```
GET /onboarding-status
Headers: Authorization: Bearer <token>

Response (200):
{
  "role": "student",
  "onboardingCompleted": false,
  "adaptiveOnboardingCompleted": false,
  "onboardingStep": 0
}
```

#### 2. Complete Onboarding
```
POST /onboarding/complete
Headers: Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "role": "student",
  "payload": { ... role-specific data ... }
}

Response (200):
{
  "message": "Onboarding completed",
  "success": true
}
```

**Note:** Frontend uses Zustand store (`useOnboardingStore`) for draft persistence. Backend stores final completion in `user` table (onboarding_completed flag and final onboarding_step value).

---

## Security & Validation

### Password Requirements
- **Minimum length:** 8 characters
- **Uppercase:** At least 1 uppercase letter (A-Z)
- **Digit:** At least 1 number (0-9)
- **Hashing:** bcrypt with salt rounds = 10
- **Expiration Policy:** Optional (configurable)

**Example Valid Passwords:**
- `SecurePass123` ✓
- `MyPassword99` ✓
- `password123` ✗ (no uppercase)
- `PASSWORD` ✗ (no number)
- `Pass1` ✗ (too short)

### Email Validation
- RFC 5322 compliant via Pydantic `EmailStr`
- Unique per system
- Case-insensitive storage
- Verified via confirmation link (if enabled)

### JWT Token Structure

**Header:**
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload (Claims - Minimized for Security):**
```json
{
  "sub": "user_id",
  "role": "student",
  "onboardingStep": 0,
  "onboardingCompleted": false,
  "adaptiveOnboardingCompleted": false,
  "iat": 1713175436,
  "exp": 1713179036
}
```

⚠️  **Security Note:** JWT is base64-decodable client-side. We minimize PII exposure by including only:
- `sub`: User ID (required by OAuth2)
- `role`: For authorization/RBAC
- `onboarding*`: For UX flow control
- Removed (fetch via /auth/me instead): email, fullName, collegeId, deptId, batchId

**Signature:** HMAC-SHA256 with SECRET_KEY

### Rate Limiting
- **Failed Login Attempts:** 5 per 15 minutes (per identifier + role)
- **Password Reset:** 3 per hour (per email)
- **API Calls:** 100 requests per minute (per IP)

Uses Redis for tracking and `slowapi` library for enforcement.

### Token Blacklisting
When user logs out:
1. Token is added to Redis blacklist
2. Key: `blacklist:{token_hash}`
3. TTL: Token expiration time
4. Middleware checks blacklist on every protected endpoint

### CORS & Security Headers
**Allowed Origins:** Configured in `app.core.config` (localhost:3000, production domain)

**Headers:**
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

## Role-Based Access

### Role Normalization

All roles are normalized to lowercase by `normalize_role()`:

**Mapping:**
```
Input Role → Normalized Output
"ADMIN" → "admin"
"Admin" → "admin"
"TEACHER" → "teacher"
"student" → "student"
"SUPER_ADMIN" → "super_admin"
...
```

### Role Classifications

#### Self-Signup Roles
Users can register themselves via `/register` endpoint:
- student
- teacher
- parent
- mentor
- peer_tutor
- researcher
- alumni
- content_creator
- counselor

#### Invite-Only Roles
Only created by admin invitation or direct database insertion:
- faculty
- hod
- college_admin
- system_admin
- super_admin
- institution_admin

#### Bypass Roles (Skip Onboarding)
These roles skip onboarding and go directly to dashboard:
- super_admin
- system_admin
- admin
- institution_admin
- college_admin

### Permission Scope

**Student:**
- Access own courses (enrolled semester)
- Submit assignments
- View grades
- Interact with AI tutor
- No admin access

**Teacher:**
- Create/edit course content
- View enrolled students
- Grade submissions
- Access teacher queue/verification
- No admin access

**Faculty:**
- Manage multiple courses/semesters
- Request course assignments
- View student analytics
- Oversight of teacher content

**HOD:**
- Department-level analytics
- Teacher assignment/approval
- Curriculum management
- Budget/resource requests

**Admin:**
- Full system access
- Create users/roles
- Manage institutions
- Configure system settings
- Access all audit logs

**Parent:**
- View child's progress
- Receive notifications
- Limited contact with teachers
- No admin access

**Mentor:**
- Connect with students
- Provide guidance
- Access mentee profiles
- No classroom admin

---

## Implementation Checklist

### Frontend
- [x] Login page UI (`/login`)
- [x] Signup page UI (`/register`)
- [x] Onboarding page UI (`/onboarding`)
- [x] Role selection in signup/login
- [x] Form validation (Zod)
- [x] Error handling & messages
- [x] Token storage (sessionStorage/localStorage)
- [x] Zustand auth state management
- [x] Auth middleware (`/src/middleware.ts`)
- [x] Protected route guards
- [x] Role-based routing
- [x] Profile picture upload
- [x] Password strength indicator

### Backend
- [x] User registration endpoint
- [x] User login endpoint
- [x] Brute-force protection
- [x] JWT token generation
- [x] Password hashing (bcrypt)
- [x] Email validation
- [x] Role normalization
- [x] Onboarding completion tracking
- [x] Password reset flow
- [x] Token refresh
- [x] Logout/blacklist
- [x] Audit logging
- [x] Rate limiting

### Database
- [x] Users table
- [x] User data table (adaptive learning)
- [x] Password reset tokens table
- [x] Audit logs table
- [x] Indexes on frequently queried columns

### Additional
- [ ] Email confirmation (optional)
- [ ] Two-factor authentication (future)
- [ ] SSO integration (future)
- [ ] Social login (future)

---

## Troubleshooting

### Issue: "Invalid credentials" on login
**Causes:**
- Incorrect email/password
- Account doesn't exist
- Email/role mismatch

**Solution:**
1. Verify email is correct
2. Try password reset if forgotten
3. Check role selection matches user type

### Issue: "Account locked" error
**Cause:** 5 failed login attempts in 15 minutes

**Solution:**
- Wait 15 minutes for automatic unlock
- Admin can manually reset via database

### Issue: "Onboarding not completing"
**Causes:**
- Frontend not calling `/onboarding/complete` endpoint
- Backend error during completion
- Session timeout

**Solution:**
1. Check browser console for errors
2. Verify API endpoint URL
3. Check authentication token validity
4. Review backend logs

### Issue: Token expired after login
**Cause:** JWT token has 1-hour expiry

**Solution:**
- Implement token refresh endpoint
- Use refresh token for renewal
- Redirect to login if refresh fails

---

## References

- Frontend Auth Component: `frontend/web/src/components/auth/AuthGateway.tsx`
- Backend Auth Router: `backend/app/routers/auth.py`
- Auth Store: `frontend/web/src/store/useAuthStore.ts`
- Onboarding Page: `frontend/web/src/app/onboarding/page.tsx`
- Student Onboarding: `frontend/web/src/components/onboarding/StudentOnboardingFlow.tsx`
- Role Onboarding: `frontend/web/src/components/onboarding/RoleOnboardingFlow.tsx`
- Database Migrations: `supabase/migrations/20260329000001_login_system.sql`
- Middleware: `frontend/web/src/middleware.ts`

---

**Document Owner:** Platform Architecture Team  
**Last Reviewed:** April 15, 2026  
**Next Review:** Quarterly or upon major changes
