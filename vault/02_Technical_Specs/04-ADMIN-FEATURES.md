# 04 — Admin Features

**Module:** Platform Administration & Governance
**Version:** 1.0
**Status:** Phase 1 (core) + Phase 2 (advanced analytics)

---

## Overview

Lumina has two levels of admin:

1. **Super Admin** — Anthropic/platform-level. Full access. Manages institutions, billing, model updates.
2. **Institution Admin** — School/college level. Manages their institution's teachers, students, courses, and compliance.

This document covers the **Institution Admin** experience primarily, with Super Admin distinctions noted where relevant.

---

## 1. Institution Admin Dashboard

### Home screen

```
LUMINA ADMIN — St. Francis High School                    March 14, 2026

INSTITUTION OVERVIEW
┌────────────────────────────────────────────────────────────────────┐
│ Active Students: 1,247    Active Teachers: 48    Active Courses: 92 │
│ AI Tutor Sessions today: 3,841    Questions verified today: 412     │
│ Assignments submitted this week: 2,108                              │
└────────────────────────────────────────────────────────────────────┘

ALERTS REQUIRING ACTION                               [View all 7]
  ⚠ 3 teachers have 10+ pending verification items older than 2 hours
  ⚠ 12 students flagged as at-risk this week (dropout model alert)
  ℹ AI tutor hallucination detected in Chemistry topic — [Review]
  ℹ Monthly usage report ready                         [Download]

PLATFORM HEALTH
  API Response time:    142ms ✓ (normal)
  AI answer queue:      47 pending (3 teachers)
  Storage used:         2.3 TB / 10 TB
  Active right now:     234 students in sessions
```

---

## 2. Teacher Management

### Teacher roster

```
TEACHERS                                              [Add Teacher] [Import CSV]

Search: [_______________]   Filter: [All Departments ▼]  [Active ▼]

Name              Subject        Classes    Verification    Status   Actions
────────────────  ─────────────  ─────────  ──────────────  ───────  ───────
Dr. Anand Kumar   Physics        10A, 10B   127 verified    Active   [View] [Edit]
                                            14 pending

Ms. Priya Singh   Chemistry      11A, 12B   203 verified    Active   [View] [Edit]
                                            2 pending

Mr. Ravi Sharma   Mathematics    9A, 9B,    89 verified     Active   [View] [Edit]
                                 10C        31 pending ⚠

[Page 1 of 5]
```

### Teacher profile view (admin perspective)

```
TEACHER: Dr. Anand Kumar — Physics

ACTIVITY SUMMARY (Last 30 days)
  Q&A Verified:            127    Average verify time: 1 min 48 sec
  Assignments Created:     8      Average score (class): 71%
  Lessons Generated:       24     Student satisfaction: 4.3/5
  PPTs Generated:          18     At-risk students in class: 3
  
AI USAGE
  API calls this month:    4,820  Cost: ₹1,240
  Most asked topics:       Newton's Laws (47), Waves (31), Optics (28)
  
PERFORMANCE METRICS
  Student mastery growth:  +12.3% this term
  Assignment return time:  Avg 2.3 days
  Parent communication:    14 messages sent
  
[Email Teacher]  [Reset Password]  [Deactivate Account]  [View Full Logs]
```

### Bulk teacher onboarding

```
ONBOARD TEACHERS

Option 1: CSV Import
  [Download template] [Upload CSV]
  Required columns: name, email, subject, classes
  
Option 2: Manual add
  Name: ___________  Email: ___________  
  Subject: [__▼]    Classes: [Multi-select]
  [Send invitation email]

Option 3: Google Workspace sync
  [Connect Google Admin] → auto-imports all staff accounts
```

---

## 3. Student Management

### Student roster with risk indicators

```
STUDENTS                                              [Add Student] [Import CSV]

Filter: [All Classes ▼] [All Risk Levels ▼] [Sort: Risk Score ▼]

Name           Class   Mastery   Engagement   Risk Score   Last Active   Actions
─────────────  ──────  ────────  ───────────  ───────────  ──────────── ───────
Rohan B.       10B     34%       LOW ↓        HIGH 🔴      5 days ago   [Alert Teacher]
Kavya M.       11A     41%       DROPPING ↓   MEDIUM 🟡    2 days ago   [View Profile]
Aarav S.       9C      78%       HIGH ✓       LOW 🟢       Today        [View Profile]
Priya K.       10B     91%       HIGH ✓       LOW 🟢       Today        [View Profile]
```

### Student profile view (admin)

Admin sees aggregated information only — not individual AI tutor conversations or assignment content (those belong to the teacher).

```
STUDENT: Rohan B.  —  Class 10B

OVERVIEW
  Enrolled: June 2024       Parent: Mr. B. Rajan (contact on file)
  Risk Score: HIGH (0.78)   Teacher: Dr. Anand Kumar
  
ACADEMIC SUMMARY
  Average mastery:    34%  (below class avg of 67%)
  Assignment avg:     41%  (submitted 7/12 this term)
  AI sessions:        2 this week (was 12/week in November)
  
RISK FACTORS (SHAP explanation)
  1. Assignment submission rate dropped 58% (October → now)
  2. Average session duration down from 35 min → 8 min
  3. AI tutor queries down 70%
  4. 5 consecutive days without login last week
  
ACTIONS TAKEN
  • Teacher alerted: March 10
  • Parent notification sent: March 11
  • Counselor flagged: March 12

RECOMMENDED ACTIONS
  [Schedule counselor meeting]  [Contact parent]  [Message teacher]
```

---

## 4. Course and Content Management

### Course library overview

```
COURSE LIBRARY                           [Create Course] [Review Pending]

Filter: [All Subjects ▼] [All Classes ▼] [Status ▼]

Course                     Teacher          Students   Status     Actions
─────────────────────────  ───────────────  ─────────  ─────────  ───────
Physics Grade 10           Dr. Anand Kumar  78         Active     [View] [Audit]
Chemistry Grade 11         Ms. Priya Singh  45         Active     [View] [Audit]
Mathematics Grade 9        Mr. Ravi Sharma  112        Active     [View] [Audit]
Biology Grade 12 (NEW)     Ms. Leela Nair   0         Draft      [Review] [Publish]
```

### Content audit tool

Admin can review any course's content before it reaches students:

```
CONTENT AUDIT: Physics Grade 10

AI Answer Quality Check
  Total verified answers in bank: 834
  Flagged for potential inaccuracy: 3  [Review flags]
  Average teacher edit rate: 26.8%

Hallucination monitoring
  Detected: 1 answer with potentially incorrect formula
  Detected by: Guardian agent (confidence mismatch)
  Status: Pending teacher review
  [View flagged answer]

Content gaps (topics with <3 verified Q&As):
  Electromagnetic induction (2 Q&As)
  Doppler effect (1 Q&A)
  [Alert teacher to add more content]
```

---

## 5. AI Usage and Cost Monitoring

### Platform-wide AI usage dashboard

```
AI USAGE DASHBOARD — March 2026

COST OVERVIEW (Month to date)
  Total spend:           ₹48,420
  Budget remaining:      ₹51,580 / ₹1,00,000
  Projected monthly:     ₹62,000 (within budget ✓)

BY PROVIDER
  Anthropic Claude:      ₹22,100  (45.6%) — Socratic tutoring
  OpenAI GPT-5 nano:     ₹14,200  (29.3%) — Routine Q&A
  Google Gemini:         ₹8,900   (18.4%) — PDF extraction
  Internal (Phi-4-mini): ₹3,220   (6.7%)  — On-device sessions

BY TEACHER (Top 5)
  Dr. Anand Kumar:       ₹4,820  → 3.8 paise/student/day
  Ms. Priya Singh:       ₹3,940
  Mr. Ravi Sharma:       ₹6,200  ⚠ Above average — [Review]
  
EFFICIENCY METRICS
  Cost per verified answer:          ₹2.40
  Cost per mastery point gained:     ₹8.20
  Student sessions per ₹1000 spent:  79
```

### Cost alerts and controls

Admin can set:
- Monthly budget cap per teacher
- Daily AI call limit per student
- Automatic routing rules (use cheaper model for routine tasks)
- Alert thresholds for unusual usage spikes

---

## 6. Compliance and Privacy Dashboard

### FERPA/GDPR compliance status

```
COMPLIANCE DASHBOARD

DATA PRIVACY STATUS                                    ✓ Compliant

Student data location:        Self-hosted (your servers) ✓
Third-party data sharing:     None ✓
PII in AI prompts:            Anonymised by default ✓
Data retention policy:        18 months (configurable) ✓
Right to deletion requests:   0 pending ✓
Parent consent on file:       1,247/1,247 students ✓

CONSENT MANAGEMENT
  New students without consent: 0
  Consents expiring in 30 days: 14     [Send renewals]
  
DATA ACCESS LOG (Last 7 days)
  Admin views of student data:  23
  Teacher views:                4,820
  External access requests:     0
  
[Download Full Compliance Report]  [Export for Audit]
```

### Data deletion requests

```
DATA DELETION REQUESTS                              [0 pending]

Process:
1. Parent/student submits deletion request
2. Admin receives alert
3. Admin reviews and confirms identity
4. System deletes: personal data, conversations, submissions
5. Anonymised aggregate data retained for research (if consented)
6. Confirmation sent within 30 days (GDPR requirement)

[Process a deletion request]  [View completed deletions]
```

---

## 7. AI Content Moderation Console

### Guardian agent log review

The Guardian agent monitors all AI interactions for:
- Factually incorrect content
- Age-inappropriate responses
- PII exposure
- Off-topic responses
- Prompt injection attempts

```
GUARDIAN AGENT — Content Moderation Log

Today's summary:
  Total AI responses:        12,840
  Blocked automatically:     3  (0.02%)
  Flagged for admin review:  7
  Clean responses:           12,830

FLAGGED ITEMS REQUIRING REVIEW

[#1] Physics response — confidence mismatch
  Topic: Electromagnetic induction
  AI Answer: "The voltage is V = BLv where B is magnetic field 
              intensity, L is conductor length, v is velocity..."
  Guardian flag: Formula correct but explanation used "intensity" 
                 instead of "flux density" — potential confusion
  Action: [Send to teacher for review]  [Dismiss]

[#2] Off-topic response
  Student asked: "Who is the richest person in India?"
  AI responded: (redirected to learning topics)  ✓ Auto-handled

[#3] Prompt injection attempt
  Input detected: "Ignore previous instructions and..."
  Action: Blocked automatically. Student warned.
  Admin note: [Add to monitoring list]
```

### Topic and content boundaries

Admin configures what topics the AI tutor can discuss:

```
CONTENT BOUNDARIES                                   [Edit]

Allowed topic domains:
  ✓ All enrolled course subjects
  ✓ Study techniques and learning methods
  ✓ Exam preparation advice
  ✓ Career and education information
  ✓ General knowledge questions

Restricted topics:
  ✗ Politics and current events (beyond CBSE syllabus)
  ✗ Social media and entertainment recommendations
  ✗ Personal advice unrelated to academics
  ✗ Any content requiring adult verification

Custom blocked phrases: [Manage list]
Grade-appropriate content filter: [Grade 10 ▼]
```

---

## 8. Reports and Analytics

### Institution-wide analytics

```
INSTITUTION REPORT — Term 2, 2025–2026

OVERALL PERFORMANCE
  Students enrolled:         1,247
  Average mastery (all):     68.4%   ▲ 3.2% from last term
  At-risk students:          47      ▼ 12 from last term (improvement)
  Completion rate:           91.3%   ▲ 4.1% from last term

SUBJECT PERFORMANCE
  Best performing:           Biology (82% avg mastery)
  Needs attention:           Mathematics (54% avg mastery)
  
TEACHER EFFECTIVENESS
  Most improved class:       10B — Physics (+18% mastery this term)
  Teacher with most Q&As verified: Ms. Priya Singh (342 verified)
  
AI SYSTEM PERFORMANCE
  Tutor satisfaction (student-rated): 4.2/5
  Teacher verification edit rate:    24.6%
  Average answer wait time:          4 min 12 sec

[Download Full PDF Report]  [Export Data (CSV)]  [Share with Leadership]
```

### Custom report builder

```
BUILD CUSTOM REPORT

Select metrics:
  [✓] Student mastery by subject
  [✓] At-risk student trends
  [ ] AI usage and costs
  [ ] Teacher activity
  [✓] Assignment completion rates
  [ ] Peer tutoring effectiveness
  
Date range: [1 Jan 2026] to [31 Mar 2026]
Group by: [Class ▼]
Compare to: [Same period last year ▼]

Format: [PDF ▼]   [Generate Report]
```

---

## 9. Platform Configuration

### System settings

```
PLATFORM SETTINGS                         [Save all changes]

GENERAL
  Institution name:       St. Francis High School
  Academic year:          2025–2026
  Default language:       English (can be changed per user)
  Timezone:               Asia/Kolkata (IST)

AI SETTINGS
  AI tutor hours:         8:00 AM — 10:00 PM  [Edit]
  Verification SLA:       2 hours (teachers alerted after this)
  Auto-approve threshold: 0.97 confidence + teacher pre-approved topic
  Offline caching:        7 days ahead

GAMIFICATION
  Streaks enabled:        ✓
  Leaderboards enabled:   ✓
  Leaderboard tier size:  10 students  [Edit]
  Badge system:           ✓

ASSIGNMENT SETTINGS
  Physical submission required: ✓ (default — per-course overridable)
  Scan quality minimum:         720px
  AI pre-assessment enabled:    ✓
  Max marks AI confidence:      Show if > 90% confidence

NOTIFICATIONS
  Teacher alert: pending > 2 hours:   ✓ Push + Email
  Student: answer ready:              ✓ Push
  Parent: weekly summary:             ✓ Email (Sunday 9 AM)
  Admin: risk alerts:                 ✓ Push + Email
```

### Role and permission management

```
ROLE PERMISSIONS MATRIX

Feature                   | Super | Inst. | Teacher | Student | Parent
──────────────────────────|  Admin|  Admin|         |         |
View all student data     |   ✓   |   ✓   |   Own   |   Self  |  Child
Access AI tutor           |   ✓   |   ✓   |    ✓    |    ✓    |   ✗
Verify AI answers         |   ✓   |   ✓   |    ✓    |    ✗    |   ✗
Generate content (PPT/PDF)|   ✓   |   ✓   |    ✓    |    ✗    |   ✗
View cost dashboard       |   ✓   |   ✓   |   Own   |    ✗    |   ✗
Manage courses            |   ✓   |   ✓   |   Own   |    ✗    |   ✗
View compliance reports   |   ✓   |   ✓   |    ✗    |    ✗    |   ✗
Delete student data       |   ✓   |   ✓   |    ✗    |    ✗    |   ✗
Access platform settings  |   ✓   |   ✓   |    ✗    |    ✗    |   ✗
[Edit permissions matrix]
```

---

## 10. Admin API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Institution overview metrics |
| GET | `/api/admin/teachers` | All teachers list with stats |
| POST | `/api/admin/teachers/invite` | Invite new teacher |
| GET | `/api/admin/students` | All students with risk scores |
| GET | `/api/admin/students/{id}/profile` | Student risk and activity profile |
| POST | `/api/admin/students/{id}/alert-teacher` | Trigger at-risk alert to teacher |
| GET | `/api/admin/courses` | All courses and audit status |
| GET | `/api/admin/ai-usage` | AI cost and usage dashboard |
| GET | `/api/admin/compliance` | Compliance status overview |
| GET | `/api/admin/guardian-log` | Content moderation log |
| POST | `/api/admin/guardian-log/{id}/action` | Admin action on flagged content |
| GET | `/api/admin/reports/institution` | Full institution report |
| POST | `/api/admin/reports/custom` | Build custom report |
| GET | `/api/admin/settings` | Platform settings |
| PUT | `/api/admin/settings` | Update platform settings |
| DELETE | `/api/admin/students/{id}/data` | Process data deletion request |
