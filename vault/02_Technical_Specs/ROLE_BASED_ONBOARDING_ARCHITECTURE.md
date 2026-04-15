# Role-Based Onboarding Architecture

**Date:** April 15, 2026  
**Status:** Current Analysis + Recommended Enhancements  

---

## 📋 Executive Summary

The Lumina platform currently has **16 distinct roles** with **role-specific onboarding paths**, but they are not fully leveraged. This document outlines:

1. **Current State:** How each role's onboarding currently works
2. **Gaps:** Where consistency is missing
3. **Recommendations:** How to create truly independent onboarding flows per role

---

## 🔍 Current Onboarding Structure

### Routes Overview

| Route | Purpose | Roles |
|-------|---------|-------|
| `/api/onboarding/status` | Check global onboarding progress | All |
| `/api/onboarding/complete` | Finalize onboarding (generic) | All |
| `/api/student/onboarding/options` | Student-specific flow | student |
| `/api/student/onboarding/complete` | Student-specific finalization | student |
| `/api/teacher/onboarding/options` | Teacher-specific flow | teacher, hod |
| `/api/teacher/onboarding/complete` | Teacher-specific finalization | teacher |
| `/api/parent/onboarding` | Parent onboarding flow | parent |
| N/A | Mentor/Peer Tutor/Researcher flows | Missing dedicated endpoints |
| N/A | Admin (college_admin, super_admin) flows | Generic only |

---

## 🎯 Current Role Onboarding Flows

### 1. **STUDENT** (7 steps)
**File:** `backend/app/routers/student.py` (lines 1038-1100+)

**Current Flow:**
- Step 1: Personal info
- Step 2: Educational background
- Step 3: Learning style preference (Visual/Auditory/Kinesthetic/Reading-Writing)
- Step 4: Profile picture upload
- Step 5: Learning goals
- Step 6: Course selection
- Step 7: Adaptive quiz for recommendations

**Endpoints:**
```
GET  /api/student/onboarding/options
POST /api/student/onboarding/complete
```

**Database:** Stores in `user_data.progress` object and migrates to student profiles

---

### 2. **TEACHER** (5 steps)
**File:** `backend/app/routers/teacher.py` (lines 212-295+)

**Current Flow:**
- Step 1: Professional info
- Step 2: Subject expertise & qualifications
- Step 3: Teaching experience
- Step 4: Classroom setup (institution, dept, batch assignment)
- Step 5: Preferences (profile photo, notification settings)

**Endpoints:**
```
GET  /api/teacher/onboarding/options
POST /api/teacher/onboarding/complete
```

**Note:** HOD also uses this flow but with additional role-specific data

---

### 3. **PARENT** (5 steps approx)
**File:** `backend/app/routers/parent.py` (lines 28-50+)

**Current Flow:**
- Step 1: Parent info
- Step 2: Child(ren) information & enrollment
- Step 3: Relationship & contact preferences
- Step 4: Safety & privacy settings
- Step 5: Notification preferences

**Endpoints:**
```
POST /api/parent/onboarding
```

---

### 4. **MENTOR** (Generic)
**Current:** Uses generic `/api/onboarding/complete` endpoint  
**Missing:** Dedicated mentor onboarding flow  
**Should include:**
- Expertise areas
- Mentee matching preferences
- Session scheduling preferences
- Rates/availability

---

### 5. **PEER_TUTOR** (Generic)
**Current:** Uses generic `/api/onboarding/complete` endpoint  
**Missing:** Dedicated peer tutor onboarding flow  
**Should include:**
- Subject expertise
- Peer tutee matching preferences
- Availability hours
- Rate/credits setup

---

### 6. **RESEARCHER** (Generic)
**Current:** Uses generic `/api/onboarding/complete` endpoint  
**Missing:** Dedicated onboarding flow  
**Should include:**
- Research interests
- Publication links
- Data access requirements
- Collaboration preferences

---

### 7. **ADMIN ROLES** (college_admin, super_admin, system_admin)
**Current:** Uses generic `/api/onboarding/complete` endpoint  
**Missing:** Dedicated admin onboarding flow  
**Should include:**
- Institution/system configuration
- Permissions & RBAC setup
- Integration preferences
- Audit & monitoring settings

---

### 8. **COUNSELOR** (Generic)
**Current:** Uses generic `/api/onboarding/complete` endpoint  
**Missing:** Dedicated onboarding flow  
**Should include:**
- Counseling specialization
- Available time slots
- Confidentiality preferences
- Resource library setup

---

### 9. **CONTENT_CREATOR** (Generic)
**Current:** Uses generic `/api/onboarding/complete` endpoint  
**Missing:** Dedicated content creation onboarding flow  
**Should include:**
- Content types (video, quiz, text, etc.)
- Subject matter expertise
- Publishing preferences
- Quality standards

---

### 10. **HOD** (Head of Department)
**Current:** Uses teacher onboarding + admin features  
**Issue:** HOD role characteristics poorly defined  
**Should include:**
- Department info
- Faculty management permissions
- Budget allocation
- Student batch oversight

---

### 11. **GUEST** (Limited)
**Current:** Minimal/no onboarding  
**Should include:**
- Limited profile setup
- Content access preferences

---

### 12. **INSTITUTION_ADMIN** (Generic)
**Current:** Uses generic `/api/onboarding/complete` endpoint  
**Missing:** Dedicated onboarding flow  
**Should include:**
- Institution details
- Campus setup
- Department structure
- User provisioning settings

---

### 13. **ALUMNI** (Generic)
**Current:** No dedicated onboarding  
**Missing:** Dedicated onboarding flow  
**Should include:**
- Graduation info
- Alumni network preferences
- Mentorship willingness
- Career updates

---

## 🔴 Current Issues

### 1. **Inconsistent Endpoint Naming**
```
❌ /api/student/onboarding/options
❌ /api/student/onboarding/complete
❌ /api/teacher/onboarding/options
❌ /api/teacher/onboarding/complete
❌ /api/parent/onboarding
✅ /api/onboarding/complete (generic fallback)
```

**Problem:** No consistent pattern. Some roles are in role-specific routes, others in generic.

---

### 2. **Missing Role Onboarding Flows**
10 out of 16 roles use the generic endpoint. Only 3 roles have dedicated flows:
- student ✅
- teacher ✅
- parent ✅

**Missing:**
- mentor
- peer_tutor
- researcher
- counselor
- content_creator
- hod (separate from teacher)
- college_admin
- super_admin
- system_admin
- institution_admin
- alumni
- guest

---

### 3. **Weak Authorization**
Generic `/api/onboarding/complete` doesn't enforce role-specific requirements.

---

### 4. **No Role-Specific Validation**
- Schema validation is missing for peer_tutor expertise
- No mentor rate validation
- No researcher publication validation
- No admin permission setup

---

### 5. **Inconsistent Progress Tracking**
Some roles store progress in `user_data.progress`, others don't have structured tracking.

---

## ✅ Recommended Architecture

### Unified Pattern for All Roles

```
GET  /api/onboarding/{role}/options      # Get role-specific onboarding options
POST /api/onboarding/{role}/step/{step}   # Submit individual step
GET  /api/onboarding/{role}/status        # Check progress for specific role
POST /api/onboarding/{role}/complete      # Finalize role onboarding
```

### Example: New STUDENT Endpoints
```
GET  /api/onboarding/student/options
     Returns: {steps: 7, required_fields: [...], learning_styles: [...]}

POST /api/onboarding/student/step/1
     Body: {fullName, email, dateOfBirth, contactPhone}
     Returns: {step: 1, status: "completed", next: 2}

POST /api/onboarding/student/step/2
     Body: {schools: [...], qualifications: [...]}

...

POST /api/onboarding/student/complete
     Returns: {success: true, onboarding_step: 7, onboardingCompleted: true}
```

### Example: New PEER_TUTOR Endpoints
```
GET  /api/onboarding/peer_tutor/options
     Returns: {steps: 5, subjects: [...], expertise_levels: [...], rates: {...}}

POST /api/onboarding/peer_tutor/step/1
     Body: {fullName, phone, experience_years}

POST /api/onboarding/peer_tutor/step/2
     Body: {subjects: ["Math", "Physics"], expertise_levels: [...]}

POST /api/onboarding/peer_tutor/step/3
     Body: {availability: {mon: {start: "09:00", end: "17:00"}, ...}}

POST /api/onboarding/peer_tutor/step/4
     Body: {rate_per_hour: 100, currency: "INR", credits_per_session: 50}

POST /api/onboarding/peer_tutor/complete
     Returns: {success: true, onboarding_step: 4, verification_pending: true}
```

---

## 🏗️ Implementation Plan

### Phase 1: Create Role-Specific Services (Week 1)

Create dedicated onboarding service classes:
```python
# backend/app/services/onboarding/

student_onboarding.py       # 7 steps
teacher_onboarding.py       # 5 steps
parent_onboarding.py        # 5 steps
mentor_onboarding.py        # 5 steps (NEW)
peer_tutor_onboarding.py    # 4 steps (NEW)
researcher_onboarding.py    # 4 steps (NEW)
counselor_onboarding.py     # 5 steps (NEW)
content_creator_onboarding.py  # 4 steps (NEW)
admin_onboarding.py         # 6 steps (NEW)
```

### Phase 2: Create Unified Router (Week 1-2)

```python
# backend/app/routers/onboarding_unified.py

@router.get("/onboarding/{role}/options")
@router.post("/onboarding/{role}/step/{step}")
@router.get("/onboarding/{role}/status")
@router.post("/onboarding/{role}/complete")
```

### Phase 3: Add Database Tracking (Week 2)

Create `onboarding_progress` table:
```sql
CREATE TABLE onboarding_progress (
    id UUID PRIMARY KEY,
    user_id UUID,
    role VARCHAR(50),
    current_step INT,
    total_steps INT,
    completed_steps JSONB,        -- {1: true, 2: true, ...}
    step_data JSONB,              -- Role-specific data per step
    status VARCHAR(20),           -- in_progress, completed, skipped
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Phase 4: Update Frontend Routes (Week 2-3)

Create unified frontend components:
```typescript
// frontend/web/components/onboarding/

<OnboardingFlow role={currentUserRole} />
  ├── OnboardingStep (generic step container)
  ├── StudentOnboardingStep (role-specific component)
  ├── TeacherOnboardingStep
  ├── PeerTutorOnboardingStep
  └── ... (one per role)
```

### Phase 5: Add Role-Specific Validation (Week 3)

```python
# backend/app/services/onboarding/validators.py

def validate_peer_tutor_expertise(subjects: List[str], levels: List[str]):
    # Ensure subjects exist in SUBJECT_CATALOG
    # Ensure expertise levels are valid: beginner, intermediate, expert

def validate_mentor_rates(rate: float, currency: str):
    # Validate currency codes (INR, USD, etc.)
    # Validate rate range ($10-500/hr reasonable)

def validate_admin_permissions(permissions: List[str]):
    # Ensure permissions exist in RBAC system
    # Check for conflicting permissions
```

### Phase 6: Add Role Verification (Week 4)

```python
# backend/app/services/onboarding/verification.py

async def verify_peer_tutor_qualifications(user_id: str):
    # Auto-invite peer_tutors to trial sessions
    # Mark as "verified" after successful first session
    # Add badge to profile

async def verify_mentor_profile(user_id: str):
    # Check completeness of profile
    # Mark as "ready to mentor"
```

---

## 🚀 Proposed Endpoints

### Universal Onboarding Endpoints

```http
# Get onboarding options for a specific role
GET /api/onboarding/{role}/options
Response: {
  role: "student",
  steps: 7,
  current_step: 1,
  required_fields: {...},
  optional_fields: {...},
  role_specific: {...}
}

# Submit a step
POST /api/onboarding/{role}/step/{step}
Body: {step_data: {...}}
Response: {
  step: 1,
  status: "completed",
  next_step: 2
}

# Get current progress
GET /api/onboarding/{role}/status
Response: {
  role: "student",
  progress: 14%,
  current_step: 1,
  completed_steps: [1],
  pending_steps: [2,3,4,5,6,7]
}

# Complete onboarding
POST /api/onboarding/{role}/complete
Body: {final_confirmation: true}
Response: {
  success: true,
  onboarded: true,
  next_action: "dashboard"
}
```

---

## 🔑 Key Differences by Role

| Role | Steps | Purpose | Complexity | Verification |
|------|-------|---------|-----------|-----------------|
| **student** | 7 | Learn | High | Learning style quiz |
| **teacher** | 5 | Teach | High | Qualifications check |
| **parent** | 5 | Monitor | Medium | Child enrollment |
| **mentor** | 5 | Guide | Medium | Experience + rating |
| **peer_tutor** | 4 | Help peers | Medium | Trial session |
| **counselor** | 5 | Support | Medium | License verification |
| **researcher** | 4 | Research | Medium | Publication check |
| **content_creator** | 4 | Create | Medium | Portfolio check |
| **hod** | 6 | Manage | High | Department setup |
| **college_admin** | 6 | Configure | High | Institution setup |
| **super_admin** | 6 | Control | High | Permissions setup |
| **institution_admin** | 5 | Administer | High | Multi-tenant setup |
| **counselor** | 5 | Advise | Medium | Certification |
| **alumni** | 3 | Connect | Low | Graduation year verify |
| **guest** | 1 | Browse | Low | None |

---

## 📝 Database Schema Updates

### New Tables

```sql
-- Onboarding progress tracking
CREATE TABLE onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  role VARCHAR(50) NOT NULL,
  step_number INT,
  total_steps INT,
  step_data JSONB,
  status VARCHAR(20) DEFAULT 'in_progress',
  verification_status VARCHAR(20),
  started_at TIMESTAMP DEFAULT now(),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_onboarding_user_role 
  ON onboarding_progress(user_id, role);

-- Role-specific data (peer_tutor expertise, mentor rates, etc.)
CREATE TABLE role_specialized_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  role VARCHAR(50) NOT NULL,
  specialization JSONB,  -- role-specific: subjects, expertise, rates, etc.
  verification_status VARCHAR(20),
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

---

## 🎯 Implementation Status

### ✅ Complete (Implemented)
- [x] student onboarding flow (7 steps)
- [x] teacher onboarding flow (5 steps)
- [x] parent onboarding flow (5 steps)
- [x] Generic onboarding endpoint

### ⏳ Recommended (High Priority)
- [ ] mentor onboarding service
- [ ] peer_tutor onboarding service (with expertise + rates)
- [ ] counselor onboarding service
- [ ] content_creator onboarding service
- [ ] Unified router pattern
- [ ] onboarding_progress table

### 📋 Recommended (Medium Priority)
- [ ] hod-specific onboarding (separate from teacher)
- [ ] college_admin onboarding service
- [ ] researcher onboarding service
- [ ] super_admin onboarding service
- [ ] institution_admin onboarding service
- [ ] alumni onboarding service
- [ ] Role-specific verification workflows

### ❌ Not Recommended (Low Priority)
- guest onboarding (minimal/no setup needed)

---

## 💡 Benefits

1. **Clear Separation of Concerns:** Each role has its own flow
2. **Better UX:** Users see exactly what they need for their role
3. **Stronger RBAC:** Permissions set up during onboarding
4. **Verification:** Auto-verify qualifications (peer_tutors, counselors, etc.)
5. **Scalability:** Easy to add new roles
6. **Analytics:** Track completion rates per role
7. **Consistency:** Unified endpoint pattern
8. **Flexibility:** Skip/customize steps per role

---

## 🔗 Related Documentation

- [AUTH_AND_ONBOARDING_FLOW.md](AUTH_AND_ONBOARDING_FLOW.md) - Current flows
- [AUTH_AND_ONBOARDING_QUICK_REFERENCE.md](AUTH_AND_ONBOARDING_QUICK_REFERENCE.md) - Quick lookup
- [backend/app/services/onboarding_service.py](../../../backend/app/services/onboarding_service.py) - Current implementation

---

**Next Step:** Develop peer_tutor, mentor, and admin onboarding services as Phase 1 priority.
