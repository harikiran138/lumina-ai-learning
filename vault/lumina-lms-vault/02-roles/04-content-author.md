# Support Roles — Mentor, Peer Tutor, Counselor, Parent, Researcher

> **File:** `02-roles/04-content-author.md`
> **Related:** [[02-roles/00-roles-index]], [[02-roles/06-role-permissions-matrix]]
> **Last Updated:** 2026-04-15

This file documents the five support-ring and external-lane roles: Mentor, Peer Tutor, Counselor, Parent/Guardian, and Researcher.

---

## Mentor

### Definition
Mentor is assigned to a group of Students (mentees) to provide academic guidance. Mentors see summary academic performance — not full detail.

### Data access
- Assigned mentees' cumulative GPA and attendance percentage
- Dropout risk badge (HIGH/MEDIUM/LOW — not SHAP scores)
- No access to: AI tutor conversation history, knowledge trace internals, submission details, counselling notes

### How created
Institution Admin creates Mentor accounts and assigns mentee lists via the admin panel.

### Workflow
Mentor logs in → sees mentee list with risk badges → clicks a mentee → sees attendance % and grade summary → records notes in their own mentor_notes table (visible only to Mentor and HOD).

---

## Peer Tutor

### Definition
Peer Tutor is a high-performing Student granted write access to the peer discussion channel within their own enrolled courses. This is not a separate account — it is an elevated flag on an existing Student account.

### Permissions (additions over Student)
- Post in the "Peer Channel" of courses they are enrolled in (Teacher-moderated)
- Pin their own posts in the peer channel
- Cannot access any backend analytics, knowledge traces, or queue items

### How created
Teacher promotes a Student to Peer Tutor from the course management panel. The flag `is_peer_tutor = TRUE` is set on the enrollment record for that specific course.

---

## Counselor

### Definition
Counselor manages student welfare. Their primary data — counselling session notes — is encrypted client-side. No other role, including Super Admin, can read session content.

### Data access
- Write and read their own encrypted session notes (per student)
- Flag a welfare concern to HOD with severity level (LOW/MEDIUM/HIGH/CRITICAL) — severity only, no session content
- Read the student directory for their institution (name, email) to book sessions

### Encryption model
Session notes are encrypted with AES-256-GCM in the browser before transmission. The encryption key is derived from the Counselor's password using PBKDF2. The server stores only ciphertext. Key rotation requires the Counselor to re-encrypt all notes.

### How created
Institution Admin creates Counselor accounts.

---

## Parent / Guardian

### Definition
Parent accounts provide a read-only view of a specific student's progress to their legal guardian.

### Data access
- Attendance percentage for the current semester
- Grade summary per course (letter grade + percentage — no raw scores)
- Dropout risk badge (HIGH/MEDIUM/LOW — not score or SHAP breakdown)
- Cannot see: AI tutor interactions, knowledge trace, assignment submission content, counselling information

### Access gating
1. Parent submits link request with student hall_ticket
2. Institution Admin verifies and sets `verified_by_admin = TRUE`
3. Parent can now log in — data access is scoped to `student_id` from the verified link

### How created
Institution Admin creates Parent accounts after verification.

---

## Researcher

### Definition
Researcher is an external-lane role with no interaction access. Researchers receive time-limited access to anonymised, aggregated data snapshots for educational research purposes.

### Data access
- k-anonymised aggregate snapshots (k≥5 — cohorts smaller than 5 are suppressed)
- Pseudonymised student IDs (new pseudonym generated per export session — no cross-session linkage)
- Aggregated knowledge trace trends, attendance distributions, dropout rates
- Cannot see: individual student records, names, emails, grades, any PII

### Compliance
Every query Researchers execute is logged in `researcher_query_log` with: researcher_id, timestamp, query description, rows returned. Super Admin reviews this log.

### How created
Super Admin grants Researcher access with a defined institution scope, allowed dataset list, and expiry date.
