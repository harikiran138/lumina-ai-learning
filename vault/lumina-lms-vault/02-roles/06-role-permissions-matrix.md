# Role Permissions Matrix

> **File:** `02-roles/06-role-permissions-matrix.md`
> **Related:** [[02-roles/00-roles-index]], [[06-auth/02-rbac]]
> **Last Updated:** 2026-04-15

Every permission for every role across every major resource in Lumina. ✅ = allowed, ❌ = not allowed, 👁 = read-only.

---

## Core Resource Matrix

| Resource | SA | IA | HOD | Faculty | Teacher | Student | Mentor | Peer Tutor | Counselor | Parent | Researcher |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Institutions** | CRUD | 👁 own | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **IA Accounts** | CRUD | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **HOD Accounts** | 👁 | CRUD | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Faculty Accounts** | 👁 | CRUD | CRUD (own dept) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Teacher Accounts** | 👁 | CRUD | CRUD (own dept) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Student Accounts** | 👁 | CRUD | 👁 (own dept) | 👁 (own dept) | 👁 (own courses) | 👁 (own only) | 👁 (mentees) | ❌ | 👁 (directory) | 👁 (own child) | ❌ |
| **Courses (content)** | ❌ | 👁 meta | 👁 | 👁 | CRUD (own) | 👁 (enrolled) | ❌ | 👁 (enrolled) | ❌ | ❌ | ❌ |
| **AI Queue** | ❌ | 👁 count | 👁/✅ (escalations) | 👁/✅ (escalations) | CRUD (own courses) | 👁 (own questions) | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Flashcards** | ❌ | ❌ | ❌ | ❌ | CRUD (own courses) | 👁 (own) | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Attendance** | ❌ | 👁 (agg.) | 👁 (dept) | 👁 (dept) | CRUD (own courses) | 👁 (own) | ❌ | ❌ | ❌ | 👁 (own child) | anon only |
| **Quiz Submissions** | ❌ | ❌ | 👁 (dept agg.) | 👁 (dept) | 👁 (own courses) | 👁 (own) | ❌ | ❌ | ❌ | ❌ | anon only |
| **Handwritten Submissions** | ❌ | ❌ | ❌ | ❌ | 👁/✅ grade (own courses) | ✅ submit (own) | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Knowledge Trace** | ❌ | ❌ | 👁 (dept agg.) | 👁 (dept) | 👁 (own courses) | 👁 (own) | ❌ | ❌ | ❌ | ❌ | anon only |
| **Dropout Scores** | ❌ | 👁 (agg.) | 👁 (dept) | 👁 (dept) | 👁 (own courses) | 👁 badge only | 👁 badge only | ❌ | ❌ | 👁 badge only | anon only |
| **SHAP Details** | ❌ | ❌ | 👁 (dept) | 👁 (dept) | 👁 (own courses) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Community Posts** | ❌ | ❌ | 👁 | 👁 | 👁/✅ moderate | CRUD (own, enrolled) | ❌ | ✅ (peer channel) | ❌ | ❌ | ❌ |
| **Counselling Notes** | ❌ (cipher) | ❌ | 👁 severity only | ❌ | ❌ | ❌ | ❌ | ❌ | CRUD (own, encrypted) | ❌ | ❌ |
| **Mentor Notes** | ❌ | ❌ | 👁 | ❌ | ❌ | ❌ | CRUD (own) | ❌ | ❌ | ❌ | ❌ |
| **Audit Logs** | 👁 | 👁 (own inst) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Platform Config** | CRUD | 👁 (own inst config) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Researcher Grants** | CRUD | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 👁 (own grant) |

## Data Scope Enforcement

Every data scope is enforced at the FastAPI SQL layer:

| Role | SQL WHERE clause |
|---|---|
| SA | No institution filter (platform-wide, but no student data tables) |
| IA | `institution_id = :institution_id` |
| HOD | `institution_id = :institution_id AND department_id = :dept_id` |
| Faculty | `institution_id = :institution_id AND department_id = :dept_id` |
| Teacher | `institution_id = :institution_id AND course_id IN (:teacher_course_ids)` |
| Student | `institution_id = :institution_id AND student_id = :student_id` |
| Mentor | `institution_id = :institution_id AND student_id IN (:mentee_ids)` |
| Parent | `institution_id = :institution_id AND student_id = :linked_child_id` |
| Counselor | `institution_id = :institution_id` (all students for directory; own notes only) |
| Researcher | Anonymised view — no direct table access |
