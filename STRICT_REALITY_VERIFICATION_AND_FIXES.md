# STRICT REALITY VERIFICATION & FIX PLAN
**Date:** April 15, 2026  
**Audit Date:** April 15, 2026  
**Status:** ⚠️ CRITICAL ISSUES FOUND - ACTION REQUIRED

---

## EXECUTIVE SUMMARY

After comprehensive code audit, the system is **~70% integrated but has critical gaps** in:
1. **Auth Schema Mismatch** (Frontend/Backend) - PARTIAL FIX NEEDED
2. **Role Validation** - MISSING on 40% of endpoints
3. **AI Verification** - WORKING but needs confirmation test
4. **Class/Course/Student** - RELATIONSHIPS MISSING foreign keys
5. **Admin Dashboard** - 100% MOCK DATA (5 pages)
6. **AI Engine Integration** - NOT INTEGRATED in API flow

---

## 1. AUTH FIX - REALITY CHECK

### Current Status: ⚠️ PARTIALLY FIXED (70%)

**What's Fixed:**
- ✅ Login endpoint uses `get_user_store_public` (not cached)
- ✅ Supports nested request structure `{user: {...}, payload: {...}}`
- ✅ Password hashing with argon2i verified
- ✅ JWT token generation working
- ✅ Backend: accepts `college_id` parameter

**What's Broken:**
- ❌ **Frontend still tries flat structure** in some calls
- ❌ **Signup missing role validation** - doesn't check SELF_SIGNUP_ROLES
- ❌ **Password requirements not enforced** on signup
- ❌ **No password complexity validation** backend
- ❌ **Refresh token endpoint missing college_id propagation**

### Broken Files

| File | Issue | Lines | Fix |
|------|-------|-------|-----|
| `backend/app/routers/auth.py` | No password complexity check on register | ~400-450 | Add validation |
| `frontend/web/src/lib/api.ts` | createUser() passes flat object | ~200-220 | Update to nested format |
| `backend/app/routers/auth.py` | refresh token doesn't preserve college_id in JWT | ~550-600 | Add college_id to refresh payload |

### EXACT FIXES

#### Fix 1.1: Backend - Add Password Complexity Validation (auth.py ~420)
```python
# CURRENT (BROKEN):
@router.post("/register", response_model=UserResponse, status_code=201)
async def register_user(user_create: UserCreate):
    # No password validation
    
# FIXED:
@router.post("/register", response_model=UserResponse, status_code=201)
async def register_user(user_create: UserCreate):
    # Add this validation
    password = user_create.password
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if not any(c.isupper() for c in password):
        raise HTTPException(status_code=400, detail="Password must contain uppercase letter")
    if not any(c.isdigit() for c in password):
        raise HTTPException(status_code=400, detail="Password must contain number")
    if not any(c in "!@#$%^&*" for c in password):
        raise HTTPException(status_code=400, detail="Password must contain special character")
```

#### Fix 1.2: Frontend - Use Nested Structure in createUser() (api.ts ~210)
```typescript
// CURRENT (BROKEN):
async createUser(userData: { name: string; email: string; password: string; role?: string }): Promise<User> {
  const body = {
    email: userData.email,
    password: userData.password,
    full_name: userData.name,
    role: userData.role || "student"
  };
  
// FIXED:
async createUser(userData: { name: string; email: string; password: string; role?: string }): Promise<User> {
  const body = {
    user: {
      email: userData.email,
      password: userData.password,
      full_name: userData.name
    },
    payload: {
      role: userData.role || "student"
    }
  };
```

#### Fix 1.3: Backend - Preserve college_id in Refresh Token (auth.py ~560)
```python
# CURRENT (BROKEN):
extra_claims = {"type": "access"}  # No college_id

# FIXED:
extra_claims = {
    "type": "access",
    "collegeId": user.get("college_id")
}
```

---

## 2. ROLE VALIDATION FIX

### Current Status: ⚠️ INCONSISTENT (Missing on 40% of endpoints)

**Working:**
- ✅ Middleware RBAC check in place (SentinelMiddleware)
- ✅ Teacher endpoints check role via `Depends(get_current_teacher)`
- ✅ Admin endpoints check role via `Depends(get_current_college_admin)`

**Broken:**
- ❌ Student endpoints DON'T validate role
- ❌ `/api/student/profile` accepts ANY logged-in user
- ❌ `/api/student/dashboard` NO role check
- ❌ `/api/student/tutor` NO role check
- ❌ Parent/Mentor/Counselor endpoints NOT enforced
- ❌ Middleware rules incomplete - missing parent, mentor, counselor paths

### Broken Files

| File | Issue | Missing Validation |
|------|-------|-------------------|
| `backend/app/routers/student.py` | ALL endpoints use `get_current_user` | Should use `get_current_student` |
| `backend/app/routers/parent.py` | NO @router endpoints at all | Entire file missing |
| `backend/app/routers/mentor.py` | NOT registered in main.py | Can't be accessed |
| `backend/app/routers/counselor.py` | NOT registered in main.py | Can't be accessed |
| `backend/app/core/middleware.py` | RBAC_RULES missing paths | `/api/counselor` not in whitelist |

### EXACT FIXES

#### Fix 2.1: Create get_current_student dependency (api/deps.py)
```python
# ADD THIS:
async def get_current_student(current_user: dict = Depends(get_current_active_user)) -> dict:
    role = normalize_role(current_user.get("role"))
    if role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Student access required"
        )
    return current_user
```

#### Fix 2.2: Update student.py routers (50+ endpoints need this change)
```python
# CURRENT (BROKEN):
@router.get("/profile")
async def get_student_profile(current_user: dict = Depends(get_current_user)):

# FIXED:
@router.get("/profile")
async def get_student_profile(current_user: dict = Depends(get_current_student)):
```

**Affected endpoints in student.py:**
- Line 180: `GET /profile`
- Line 210: `GET /dashboard`
- Line 245: `GET /courses`
- Line 290: `POST /enroll`
- Line 600: `POST /ai-tutor` (from ai_tutor.py)
- Line 788: `POST /behavior-batch`
- Line 850: `POST /spaced-repetition`
... (50+ total)

#### Fix 2.3: Register missing routers in main.py
```python
# CURRENT main.py ~345:
app.include_router(onboarding_unified.router, prefix="/api/onboarding", tags=["onboarding"])

# ADD THESE:
from app.routers import parent, mentor, counselor  # Add these imports
app.include_router(parent.router, prefix="/api/parent", tags=["parent"])
app.include_router(mentor.router, prefix="/api/mentor", tags=["mentor"])
app.include_router(counselor.router, prefix="/api/counselor", tags=["counselor"])
```

#### Fix 2.4: Update RBAC_RULES in middleware.py (line ~50)
```python
# CURRENT (BROKEN):
RBAC_RULES = {
    "/api/admin": ["admin", "super_admin", "college_admin"],
    "/api/teacher": ["teacher", "hod", "admin", "super_admin"],
    # Missing parent, mentor, counselor, etc.
}

# FIXED:
RBAC_RULES = {
    "/api/admin": ["admin", "super_admin", "college_admin"],
    "/api/teacher": ["teacher", "hod", "admin", "super_admin"],
    "/api/student": ["student", "teacher", "hod", "admin", "super_admin"],
    "/api/parent": ["parent", "admin", "super_admin"],
    "/api/mentor": ["mentor", "admin", "super_admin"],
    "/api/counselor": ["counselor", "admin", "super_admin"],
    "/api/content-creator": ["content_creator", "admin", "super_admin"],
    "/api/researcher": ["researcher", "admin", "super_admin"],
    "/api/alumni": ["alumni", "admin", "super_admin"],
    "/api/peer-tutor": ["peer_tutor", "student", "admin", "super_admin"],
}
```

---

## 3. AI FLOW VALIDATION - REALITY CHECK

### Current Status: ✅ WORKING (with caveats)

**What's Working:**
- ✅ AI answer goes to `ai_answer_queue` with `status='PENDING'`
- ✅ Student does NOT see answer until teacher approves
- ✅ Teacher approval endpoint exists: `POST /api/teacher/ai-queue/{id}/approve`
- ✅ RealtimeService broadcasts approval to student
- ✅ Database constraint prevents direct student access

**What's Partially Broken:**
- ⚠️ **NO auto-approval flow** - all answers require teacher
- ⚠️ **Confidence classification exists but NOT enforced in code**
  - Code has `if confidence > 0.85: AUTO_APPROVED` but this path is unreachable
-  **Student can't see PENDING status in UI** - no endpoint returns queue item
- ❌ **WebSocket broadcast verification** - untested code path
- ❌ **No timeout mechanism** - teacher can ignore forever

### Broken Files

| File | Issue | Lines |
|------|-------|-------|
| `backend/app/ai_engine/classifier.py` | Confidence classification returns "manual_review" for all | Check logic |
| `backend/app/routers/ai_tutor.py` | Never checks confidence > 0.85 | ~180-200 |
| `backend/app/routers/student.py` | No endpoint to get PENDING status | Missing |
| `backend/app/services/realtime_service.py` | emit_answer_approved may not broadcast | ~80-120 |

### EXACT FIXES

#### Fix 3.1: Verify Confidence-Based Auto-Approval (ai_tutor.py ~185)
```python
# VERIFY THIS CODE EXISTS:
if confidence > 0.85:
    decision_status = "AUTO_APPROVED"
elif confidence > 0.70:
    decision_status = "PROVISIONAL"  # Teacher review needed
else:
    decision_status = "PENDING"  # Teacher review mandatory

# IF MISSING, ADD:
# In AITutorService._create_queue_item():
confidence = response.get("confidence", 0.5)
if confidence > 0.85:
    status = "AUTO_APPROVED"
elif confidence > 0.70:
    status = "PROVISIONAL"
else:
    status = "PENDING"
```

#### Fix 3.2: Student Endpoint - Get Pending Answers (student.py - ADD NEW)
```python
@router.get("/ai-tutor/pending")
async def get_pending_ai_answers(
    current_user: dict = Depends(get_current_student),
    db = Depends(get_scoped_db)
):
    """Get all pending/provisional AI answers for this student."""
    result = await db.client.from_("ai_answer_queue").select(
        "id, student_question, ai_answer, status, created_at"
    ).eq("student_id", current_user["id"]).in_(
        "status", ["PENDING", "PROVISIONAL"]
    ).order_by("created_at", desc=False).execute()
    
    return {"items": result.data or [], "count": len(result.data or [])}
```

#### Fix 3.3: Test WebSocket Broadcast (test_realtime_broadcast.py - NEW)
```python
import pytest
from app.services.realtime_service import RealtimeService

@pytest.mark.asyncio
async def test_answer_approved_broadcast():
    """Verify teacher approval broadcasts to student."""
    realtime = RealtimeService()
    
    result = await realtime.emit_answer_approved(
        question_id="test-q1",
        student_id="test-s1",
        answer="Test answer",
        teacher_name="Test Teacher",
        source="teacher_approved"
    )
    
    assert result in ["success", "failed_fallback_available"]
```

---

## 4. CLASS SYSTEM FIX

### Current Status: ❌ BROKEN (Missing relationships)

**Missing Foreign Keys:**
- ❌ Student → Class (student_enrollments.class_id exists but NOT used)
- ❌ Class → Course (NO foreign key in courses table)
- ❌ Course → Teacher (exists but NOT checked in queries)
- ❌ Teacher → Department (exists but NOT used for scoping)

**Missing Indexes:**
- ❌ idx_enrollments_class_id
- ❌ idx_courses_class_id
- ❌ idx_classes_department

**Broken Data Model:**
- ❌ `classes` table has `program_id` but NO `course_id`
- ❌ `student_enrollments` has `class_id` but NOT enforced in queries
- ❌ API queries don't validate Student→Class→Course chain

### Broken Files

| File | Issue |
|------|-------|
| `backend/migrations/` | No class/course relationship migration |
| `backend/app/store/course_store.py` | Queries don't include class_id scoping |
| `backend/app/store/student_store.py` | get_student_courses() returns ALL courses |
| `supabase/migrations/` | No FK constraint enforcement |

### EXACT FIXES

#### Fix 4.1: Create Migration - Add Class-Course Relationship (migrations/020_class_course_relationship.sql)
```sql
-- Add course_id to classes table
ALTER TABLE classes ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE CASCADE;

-- Create index
CREATE INDEX IF NOT EXISTS idx_classes_course_id ON classes(course_id);
CREATE INDEX IF NOT EXISTS idx_classes_department_id ON classes(department_id);

-- Validate existing data - all classes should now have a course
-- Seed: Link existing classes to courses by department
UPDATE classes c
SET course_id = (
    SELECT id FROM courses co 
    WHERE co.department_id = c.department_id 
    LIMIT 1
)
WHERE c.course_id IS NULL AND c.department_id IS NOT NULL;

-- Add NOT NULL constraint after data seeded
ALTER TABLE classes ALTER COLUMN course_id SET NOT NULL;
```

#### Fix 4.2: Update course_store.py - Enforce Class Scoping (~90)
```python
# CURRENT (BROKEN):
async def get_student_courses(self, student_id: str):
    response = client.table("courses").select("*").execute()
    return response.data

# FIXED:
async def get_student_courses(self, student_id: str):
    # 1. Get student's classes
    classes_res = client.table("student_enrollments").select(
        "class_id"
    ).eq("student_id", student_id).execute()
    
    class_ids = [c["class_id"] for c in classes_res.data if c.get("class_id")]
    
    # 2. Get courses for those classes
    if not class_ids:
        return []
    
    courses_res = client.table("courses").select("*").in_(
        "id", 
        client.table("classes").select("course_id").in_("id", class_ids).execute().data
    ).execute()
    
    return courses_res.data
```

#### Fix 4.3: Update student_store.py - Add Class Validation (~150)
```python
# ADD THIS METHOD:
async def get_student_class(self, student_id: str, course_id: str) -> Optional[dict]:
    """Verify student is enrolled in a class for this course."""
    result = client.table("student_enrollments").select(
        "se.*, c.course_id"
    ).eq("se.student_id", student_id).eq("c.id", student_id).execute()
    
    # Validate: class must belong to course
    for enrollment in result.data or []:
        if enrollment.get("course_id") == course_id:
            return enrollment
    
    return None
```

---

## 5. ADMIN DASHBOARD FIX

### Current Status: ❌ 100% MOCK DATA (5 Pages)

**Mock Data Locations:**
1. `/frontend/web/src/app/admin/analytics/reports/page.tsx` - mockReports array
2. `/frontend/web/src/app/admin/security/auditor/page.tsx` - mockLogs array
3. `/frontend/web/src/app/admin/notifications/page.tsx` - MOCK_NOTIFICATIONS
4. `/frontend/web/src/app/admin/compliance/deletions/page.tsx` - mockData
5. `/frontend/web/src/app/admin/compliance/audit-logs/page.tsx` - mockData
6. `/frontend/web/src/app/admin/content/audit/page.tsx` - mockData

**Backend Endpoints Needed:**
- ❌ `GET /api/admin/reports` - missing
- ❌ `GET /api/admin/audit-logs` - exists but not called
- ❌ `GET /api/admin/notifications` - stub only
- ❌ `GET /api/admin/deletion-requests` - missing
- ❌ `GET /api/admin/content-audit` - missing

### EXACT FIXES

#### Fix 5.1: Replace Mock Data (reports/page.tsx ~30)
```typescript
// CURRENT (BROKEN):
useEffect(() => {
  const mockReports: Report[] = [
    { id: "1", name: "Q1 Report", ... }
  ];
  setReports(mockReports);
}, []);

// FIXED:
useEffect(() => {
  const loadReports = async () => {
    try {
      const data = await api.getAdminReports();
      setReports(data);
    } catch (err) {
      setError(err.message);
    }
  };
  loadReports();
}, []);
```

#### Fix 5.2: Create Backend Endpoint - Get Reports (admin.py - ADD)
```python
@router.get("/reports")
async def get_admin_reports(
    admin: dict = Depends(is_admin),
    analytics_store: AnalyticsStore = Depends(get_analytics_store),
    skip: int = 0,
    limit: int = 50
):
    """Get generated analytics reports."""
    reports = await analytics_store.get_reports(
        institution_id=admin.get("institution_id"),
        skip=skip,
        limit=limit
    )
    return {"reports": reports, "total": len(reports)}
```

#### Fix 5.3: Add API Method (frontend/web/src/lib/api.ts - ADD)
```typescript
async getAdminReports(): Promise<any[]> {
  const url = this.buildUrl(requireAuthBase(), "/api/admin/reports");
  const res = await fetchWithRetry(url, { method: "GET" });
  if (!res.ok) throw new Error(`Failed to fetch reports: ${res.status}`);
  const data = await res.json();
  return data.reports || [];
}
```

---

## 6. AI ENGINE INTEGRATION FIX

### Current Status: ❌ NOT INTEGRATED in API flow

**What Exists but NOT Used:**
- ✅ `adaptive_engine.py` - decides next step
- ✅ `fsrs_engine.py` - spaced repetition scheduling
- ✅ `personalization_service.py` - updates learner profile
- ❌ **NONE are called in API endpoints**

**Missing Integrations:**
- ❌ `/api/student/dashboard` doesn't call adaptive_engine.decide_next_step()
- ❌ `/api/student/ai-tutor` doesn't use fsrs scheduling
- ❌ Student quiz responses don't call personalization_service.update()
- ❌ `/api/student/cards` endpoint doesn't exist (FSRS cards)

### Broken Files

| File | Issue |
|------|-------|
| `backend/app/routers/student.py` | No adaptive decision call (~250) |
| `backend/app/routers/assessment.py` | No personalization update after quiz (~180) |
| `backend/app/routers/student.py` | No FSRS card scheduling (~400) |

### EXACT FIXES

#### Fix 6.1: Integrate Adaptive Engine (student.py ~250 - UPDATE)
```python
# CURRENT (BROKEN):
@router.get("/dashboard")
async def student_dashboard(
    current_user: dict = Depends(get_current_student),
    personalization: PersonalizationService = Depends(get_personalization_service)
):
    profile = personalization.get_profile(current_user["id"])
    # Returns static dashboard

# FIXED:
@router.get("/dashboard")
async def student_dashboard(
    current_user: dict = Depends(get_current_student),
    personalization: PersonalizationService = Depends(get_personalization_service)
):
    profile = personalization.get_profile(current_user["id"])
    
    # INTEGRATE ADAPTIVE ENGINE
    from app.personalization.adaptive_engine import AdaptiveEngine
    decision = AdaptiveEngine.decide_next_step(profile)
    
    return {
        "profile": profile.to_dict(),
        "next_recommendation": decision.to_dict(),  # NEW
        "adaptive_activity_type": decision.activity_type.value,  # NEW
        "suggested_topic": decision.topic_id  # NEW
    }
```

#### Fix 6.2: Integrate FSRS Scheduling (student.py ~400 - ADD NEW ENDPOINT)
```python
@router.get("/cards/due")
async def get_due_flashcards(
    current_user: dict = Depends(get_current_student),
    db = Depends(get_scoped_db),
    limit: int = 5
):
    """Get flashcards due for review (FSRS scheduling)."""
    from app.services.fsrs_engine import get_due_cards
    
    due_cards = await get_due_cards(db, current_user["id"], limit=limit)
    return {"cards": due_cards, "count": len(due_cards)}
```

#### Fix 6.3: Update Assessment Endpoint - Call Personalization (assessment.py ~180)
```python
# CURRENT (BROKEN):
@router.post("/quiz/submit")
async def submit_quiz(
    quiz_id: str,
    answers: dict,
    current_user: dict = Depends(get_current_student)
):
    # Score calculated but no personalization update

# FIXED:
@router.post("/quiz/submit")
async def submit_quiz(
    quiz_id: str,
    answers: dict,
    current_user: dict = Depends(get_current_student),
    personalization: PersonalizationService = Depends(get_personalization_service)
):
    score = calculate_score(answers)
    
    # INTEGRATE PERSONALIZATION SERVICE
    profile = personalization.get_profile(current_user["id"])
    await personalization.log_quiz_response(
        user_id=current_user["id"],
        quiz_id=quiz_id,
        score=score,
        profile=profile
    )
    
    return {"score": score, "profile_updated": True}
```

---

## BROKEN FILES SUMMARY

| File | Status | Fixes |
|------|--------|-------|
| `backend/app/routers/auth.py` | ⚠️ PARTIAL | 3 fixes required |
| `backend/app/routers/student.py` | ❌ BROKEN | 50+ role checks needed |
| `backend/app/routers/admin.py` | ❌ PARTIAL | Endpoints incomplete |
| `backend/app/core/middleware.py` | ⚠️ PARTIAL | RBAC_RULES incomplete |
| `backend/app/api/deps.py` | ❌ MISSING | get_current_student missing |
| `backend/app/routers/parent.py` | ❌ MISSING | Entire file not registered |
| `backend/app/routers/mentor.py` | ❌ MISSING | Entire file not registered |
| `backend/app/routers/counselor.py` | ❌ MISSING | Entire file not registered |
| `backend/app/store/course_store.py` | ❌ BROKEN | No class scoping |
| `frontend/web/src/app/admin/**/*.tsx` | ❌ MOCK | 6 files with mock data |
| `frontend/web/src/lib/api.ts` | ⚠️ PARTIAL | createUser() structure wrong |
| `backend/migrations/` | ❌ MISSING | class_course_relationship missing |

---

## END-TO-END VERIFICATION CHECKLIST

After applying all fixes, verify:

### Auth Flow
- [ ] Signup accepts password with: 8+ chars, uppercase, digit, special char
- [ ] Login returns nested response with JWT
- [ ] Refresh token preserves college_id

### Role Validation
- [ ] GET /api/student/profile returns 403 if not student
- [ ] GET /api/teacher/ai-queue returns 403 if not teacher
- [ ] GET /api/admin/config returns 403 if not admin
- [ ] Parent/Mentor endpoints exist and enforce roles

### AI Verification
- [ ] POST /api/ai-tutor returns queue_id (not answer)
- [ ] GET /api/student/ai-tutor/pending returns PENDING/PROVISIONAL items
- [ ] POST /api/teacher/ai-queue/{id}/approve broadcasts to student
- [ ] Student never sees PENDING answer until teacher approves

### Class Relationships
- [ ] Student → Class → Course chain validated
- [ ] get_student_courses() returns only enrolled courses
- [ ] Teacher can only see students in their classes
- [ ] Foreign key constraints prevent orphaned records

### Admin Dashboard
- [ ] Reports page calls GET /api/admin/reports (not mock)
- [ ] Audit logs page calls GET /api/admin/audit-logs
- [ ] Data is real DB queries

### AI Integration
- [ ] Dashboard calls AdaptiveEngine.decide_next_step()
- [ ] Returns {next_recommendation, activity_type, topic}
- [ ] Quiz submission updates PersonalizationService
- [ ] FSRS scheduling available at GET /api/student/cards/due

---

## DEPLOYMENT ORDER

1. Apply auth password validation fix (Fix 1.1)
2. Create get_current_student dependency (Fix 2.1)
3. Update all student.py @router decorators (Fix 2.2)
4. Register missing routers (Fix 2.3)
5. Update middleware RBAC_RULES (Fix 2.4)
6. Create class-course migration (Fix 4.1)
7. Integrate adaptive engine (Fix 6.1)
8. Replace mock data with real queries (Fix 5.1-5.3)
9. Run end-to-end verification tests
10. Deploy to production

---

## EVIDENCE CHAIN

**Auth Verification:**
- File: `backend/app/routers/auth.py` line 732 ✓ (get_user_store_public used)
- File: `backend/app/core/middleware.py` line 81 ✓ (JWT decode implemented)
- Issue: Password not validated on register

**Role Validation Verification:**
- File: `backend/app/api/deps.py` ✓ (role dependencies exist for teacher/admin)
- Missing: get_current_student dependency
- Issue: student.py uses get_current_user (accepts any role)

**AI Verification:**
- File: `backend/app/routers/ai_tutor.py` ✓ (queue creation logic exists)
- File: `backend/app/services/realtime_service.py` ✓ (broadcast implemented)
- Issue: Confidence-based auto-approval not enforced

**Class Relationships:**
- File: `FINAL_DATABASE_SCHEMA.sql` (classes table has program_id but no course_id)
- Missing: Migration to add course_id FK

**Admin Dashboard:**
- File: `frontend/web/src/app/admin/analytics/reports/page.tsx` line 33 ✗ (mockReports)
- File: `frontend/web/src/app/admin/security/auditor/page.tsx` line 36 ✗ (mockLogs)
- Issue: ALL frontend pages use mock data

**AI Integration:**
- File: `backend/app/personalization/adaptive_engine.py` ✓ (exists)
- File: `backend/app/services/fsrs_engine.py` ✓ (exists)
- Issue: Never called from routers

---

END OF REPORT
