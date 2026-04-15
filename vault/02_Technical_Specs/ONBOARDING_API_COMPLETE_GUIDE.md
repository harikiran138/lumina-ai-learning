# 🚀 Role-Based Onboarding System - API GUIDE

**Status:** Production-Ready  
**Implementation:** Complete  
**Last Updated:** April 15, 2026  

---

## 📋 Overview

This document provides complete API specifications, examples, and integration guidance for the production-grade role-based onboarding system.

**Key Features:**
- ✅ 9 dedicated onboarding services (Student, Teacher, Parent, Peer Tutor, Mentor, Counselor, Content Creator, Researcher, Admin)
- ✅ Unified endpoint pattern: `/api/onboarding/{role}/{action}`
- ✅ Role-specific validation & data persistence
- ✅ Post-onboarding setup hooks (profile initialization, permissions setup, etc.)
- ✅ Comprehensive database schema with audit logging
- ✅ Analytics views for completion rates and bottleneck detection

---

## 🔗 Base URL

```
https://your-domain.com/api/onboarding
```

---

## 📚 Endpoint Reference

### 1. Get Onboarding Options

**Request:**
```http
GET /api/onboarding/{role}/options?step=1
Authorization: Bearer {access_token}
```

**Path Parameters:**
- `role` (required): One of: `student`, `teacher`, `parent`, `peer_tutor`, `mentor`, `counselor`, `content_creator`, `researcher`, `college_admin`, `super_admin`, `hod`, `alumni`

**Query Parameters:**
- `step` (optional): Specific step number. If omitted, returns all steps overview

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "role": "student",
    "step": 1,
    "total_steps": 7,
    "progress_percent": 14.3,
    "options": {
      "title": "Personal Information",
      "description": "Tell us about yourself",
      "fields": ["first_name", "last_name", "date_of_birth", "contact_phone"]
    },
    "required_fields": ["first_name", "last_name"],
    "optional_fields": ["date_of_birth", "contact_phone"]
  }
}
```

---

### 2. Submit Onboarding Step

**Request:**
```http
POST /api/onboarding/{role}/step/{step}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "data": {
    "first_name": "John",
    "last_name": "Doe",
    "date_of_birth": "2005-03-15",
    "contact_phone": "+91-9876543210"
  }
}
```

**Path Parameters:**
- `role`: User's role
- `step`: Step number (1-based)

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "step": 1,
    "next_step": 2,
    "progress_percent": 14.3
  }
}
```

**Response (Validation Error):**
```json
{
  "success": false,
  "errors": [
    "First name is required",
    "Last name is required"
  ],
  "step": 1
}
```

---

### 3. Get Onboarding Status

**Request:**
```http
GET /api/onboarding/{role}/status
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "role": "student",
    "current_step": 3,
    "total_steps": 7,
    "completed_steps": [1, 2],
    "status": "in_progress",
    "progress_percent": 28.6
  }
}
```

---

### 4. Complete Onboarding

**Request:**
```http
POST /api/onboarding/{role}/complete
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "confirmation": true
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "role": "student",
    "onboarded": true,
    "message": "Student onboarding completed"
  }
}
```

---

## 📝 Role-Specific Examples

### Example 1: Student Onboarding (7 steps)

#### Step 1: Personal Information
```bash
curl -X POST "https://api.lumina.io/api/onboarding/student/step/1" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "first_name": "Alice",
      "last_name": "Smith",
      "date_of_birth": "2008-06-15",
      "contact_phone": "+91-9876543210"
    }
  }'
```

#### Step 3: Learning Style
```bash
curl -X POST "https://api.lumina.io/api/onboarding/student/step/3" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "learning_style": "visual"
    }
  }'
```

#### Step 7: Complete with Adaptive Quiz
```bash
curl -X POST "https://api.lumina.io/api/onboarding/student/step/7" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "quiz_completed": true,
      "quiz_score": 85.5,
      "quiz_responses": {
        "q1": "B",
        "q2": "A",
        ...
      }
    }
  }'
```

#### Finalize
```bash
curl -X POST "https://api.lumina.io/api/onboarding/student/complete" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"confirmation": true}'
```

---

### Example 2: Peer Tutor Onboarding (4 steps)

#### Step 1: Personal Info
```bash
curl -X POST "https://api.lumina.io/api/onboarding/peer_tutor/step/1" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "first_name": "Rajesh",
      "last_name": "Kumar",
      "contact_phone": "+91-8765432109",
      "bio": "IIT graduate, Math specialist with 3 years tutoring experience"
    }
  }'
```

#### Step 2: Subject Expertise (CRITICAL: Must have >80% mastery)
```bash
curl -X POST "https://api.lumina.io/api/onboarding/peer_tutor/step/2" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "tutor_subjects": ["Math", "Physics", "Chemistry"],
      "expertise_levels": {
        "Math": 0.95,
        "Physics": 0.88,
        "Chemistry": 0.82
      },
      "certifications": ["IIT JEE Advanced Qualified", "Physics Olympiad"]
    }
  }'
```

**⚠️ Validation:** If mastery < 0.80 for any subject, request fails:
```json
{
  "success": false,
  "errors": [
    "Mastery in Chemistry must be at least 80%"
  ]
}
```

#### Step 3: Availability Schedule
```bash
curl -X POST "https://api.lumina.io/api/onboarding/peer_tutor/step/3" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "availability": {
        "monday": {"start": "14:00", "end": "20:00"},
        "tuesday": {"start": "14:00", "end": "20:00"},
        "wednesday": {"start": "14:00", "end": "20:00"},
        "thursday": {"start": "14:00", "end": "20:00"},
        "friday": {"start": "14:00", "end": "20:00"},
        "saturday": {"start": "10:00", "end": "18:00"}
      },
      "timezone": "IST"
    }
  }'
```

#### Step 4: Rates and Tutoring Style
```bash
curl -X POST "https://api.lumina.io/api/onboarding/peer_tutor/step/4" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "rate_per_hour": 500,
      "currency": "INR",
      "tutoring_style": "One-on-one",
      "max_students_per_week": 10
    }
  }'
```

#### Auto-Verification After First Session
- System creates `peer_tutor_profiles` record with `verification_status = "pending"`
- After first successful 1-hour session, automatically sets `verification_status = "verified"`
- Sends verification badge to profile

---

### Example 3: Researcher Onboarding (4 steps - STRICT)

#### Step 1: Personal Info
```bash
curl -X POST "https://api.lumina.io/api/onboarding/researcher/step/1" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "first_name": "Dr.",
      "last_name": "Sharma",
      "email": "sharma@iit.edu",
      "contact_phone": "+91-9999999999"
    }
  }'
```

#### Step 3: IRB Approval & Data Agreement (REQUIRED)
```bash
curl -X POST "https://api.lumina.io/api/onboarding/researcher/step/3" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "irb_approval_document": "https://s3.amazonaws.com/irb_approval_2026.pdf",
      "data_access_agreement_signed": true
    }
  }'
```

**⚠️ CRITICAL:** Without IRB approval document, request fails:
```json
{
  "success": false,
  "errors": [
    "IRB approval document is REQUIRED"
  ]
}
```

---

### Example 4: Mentor Onboarding (5 steps)

```bash
# Step 1: Professional background
curl -X POST "https://api.lumina.io/api/onboarding/mentor/step/1" \
  -d '{
    "data": {
      "first_name": "Priya",
      "last_name": "Gupta",
      "current_title": "VP Engineering at TechCorp",
      "company_name": "TechCorp",
      "years_of_experience": 12
    }
  }'

# Step 2: Expertise
curl -X POST "https://api.lumina.io/api/onboarding/mentor/step/2" \
  -d '{
    "data": {
      "expertise_areas": ["Career Guidance", "Technical Skills", "Leadership"],
      "specializations": ["Python", "System Design"]
    }
  }'

# Step 3: Rates and availability
curl -X POST "https://api.lumina.io/api/onboarding/mentor/step/3" \
  -d '{
    "data": {
      "availability_hours_per_month": 10,
      "rate_per_session": 1500,
      "currency": "INR",
      "session_duration_minutes": 60
    }
  }'

# Step 4: Mentee preferences  
curl -X POST "https://api.lumina.io/api/onboarding/mentor/step/4" \
  -d '{
    "data": {
      "mentee_goals": ["Career transitions", "Skill development"],
      "max_mentees": 5
    }
  }'

# Step 5: Complete
curl -X POST "https://api.lumina.io/api/onboarding/mentor/complete"
```

---

## 📊 Response Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Step submitted successfully |
| 400 | Validation Error | Missing required field |
| 401 | Unauthorized | Invalid/expired token |
| 404 | Not Found | Invalid role or endpoint |
| 500 | Server Error | Database error |

---

## 🔐 Error Handling

### Invalid Role
```json
{
  "detail": "Invalid role 'xyz'. Supported roles: [student, teacher, ...]"
}
```

### Invalid Step Number
```json
{
  "detail": "Invalid step 10. Valid range: 1-7"
}
```

---

## 🎯 Integration Checklist

- [ ] Install role-specific onboarding services
- [ ] Run SQL migrations to create tables
- [ ] Register unified router in `main.py`
- [ ] Update frontend to use new endpoint pattern
- [ ] Test all 9 role flows end-to-end
- [ ] Configure notification system for completion
- [ ] Set up analytics dashboard
- [ ] Document for users/admins
- [ ] Monitor completion rates via analytics views
- [ ] Set up audit logging

---

## 📈 Analytics

### Completion Rates (View)
```sql
SELECT * FROM onboarding_completion_stats;
```

Output:
```
role              completion_rate    avg_hours_to_complete
student           87.3%             2.5
teacher           92.1%             3.2
peer_tutor        78.9%             1.8
...
```

### Bottlenecks (View)
```sql
SELECT * FROM onboarding_bottlenecks;
```

Output:
```
role              current_step       users_stuck_at_step
student           3                  45
student           5                  12
peer_tutor        2                  34
```

---

## 🔄 Database Functions

### Mark Onboarding Complete
```sql
SELECT mark_onboarding_complete(user_id, 'student');
```

### Reset Onboarding
```sql
SELECT reset_onboarding(user_id, 'peer_tutor');
```

---

## 🛠️ Implementation Steps

### Step 1: Database Setup
```bash
# Run migrations
psql -U postgres -d lumina < backend/app/migrations/onboarding_schema.sql
```

### Step 2: Register Router in main.py
```python
# In backend/app/main.py

from app.routers.onboarding_unified import router as onboarding_router

# After other routes
app.include_router(
    onboarding_router,
    prefix="/api/onboarding",
    tags=["Onboarding"]
)
```

### Step 3: Frontend Integration
```typescript
// Get options for current step
const response = await fetch(
  `/api/onboarding/${role}/options?step=${currentStep}`,
  { headers: { Authorization: `Bearer ${token}` }}
);

// Submit step
const submitResponse = await fetch(
  `/api/onboarding/${role}/step/${currentStep}`,
  {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ data: stepData })
  }
);

// Complete onboarding
const completeResponse = await fetch(
  `/api/onboarding/${role}/complete`,
  {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ confirmation: true })
  }
);
```

---

## 📖 Supported Roles

| Role | Steps | Complexity | Key Feature |
|------|-------|-----------|-------------|
| **student** | 7 | High | Adaptive quiz + learning profile |
| **teacher** | 5 | High | Subject expertise + classroom setup |
| **parent** | 5 | Medium | Child linking + notification prefs |
| **peer_tutor** | 4 | High | **Mastery > 80% verification** |
| **mentor** | 5 | Medium | Expertise + availability + rates |
| **counselor** | 5 | High | **License verification + confidentiality** |
| **content_creator** | 4 | High | **Portfolio review** |
| **researcher** | 4 | High | **IRB approval REQUIRED** |
| **admin** (college, super, system, institution) | 6 | High | **Permissions + security setup** |

---

## ✅ Validation Rules Summary

### Student
- ✅ All personal fields required
- ✅ Learning style must be: visual, auditory, kinesthetic, reading_writing
- ✅ Quiz score: 0-100

### Peer Tutor
- ✅ **Mastery > 0.80 for all selected subjects (STRICT)**
- ✅ Rate: 1-10000
- ✅ Timezone: IST, EST, PST, GMT, UTC

### Researcher
- ✅ **IRB approval document REQUIRED**
- ✅ Data access agreement must be signed
- ✅ Ethics guidelines must be accepted

### Counselor
- ✅ License number required (unique)
- ✅ Certification document required
- ✅ Confidentiality agreement required

### All Roles
- ✅ First name & last name required
- ✅ Auto-deduplicates by user_id + role
- ✅ POST-onboarding setup triggered automatically

---

## 📞 Support

For issues or questions:
1. Check analytics views for completion bottlenecks
2. Review audit logs in `onboarding_audit` table
3. Reset onboarding with `reset_onboarding()` function
4. Check server logs for detailed errors

---

**End of API Documentation**
