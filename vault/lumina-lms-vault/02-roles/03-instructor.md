# Teacher / Faculty / HOD

> **File:** `02-roles/03-instructor.md`
> **Related:** [[02-roles/00-roles-index]], [[04-data-flow/04-ai-agent-job-flow]], [[08-features/04-ai-tutor]]
> **Last Updated:** 2026-04-15

This file covers the three instructor-tier roles: Teacher, Faculty, and HOD. These three roles form the academic authority chain above the student.

---

## Teacher

### Definition
Teacher is the day-to-day operator of a course. They are directly responsible for the AI Answer Queue — the most critical interface in the TILA pattern. A Teacher is assigned to specific `course_id` values and can only act within those courses.

### Responsibilities
- Create and organise course content (modules, lessons, reading materials)
- Upload lecture PDFs and videos to MinIO
- Review and approve/reject/escalate AI queue items
- Create assessments (quizzes, assignments)
- Review TrOCR-graded handwritten submissions and override marks
- Take and manage attendance (QR-based or manual)
- Monitor the FSRS flashcard system for their course
- View per-student knowledge trace (BKT+DKT mastery per KC)
- Act on dropout risk alerts (XGBoost score ≥ 0.7)
- Run MLFD video analysis on lecture recordings

### Permissions

| Resource | Create | Read | Update | Delete |
|---|---|---|---|---|
| Course content (own courses) | ✅ | ✅ | ✅ | ✅ |
| AI Queue items (own courses) | — | ✅ | ✅ (approve/reject) | — |
| Flashcards (own courses) | ✅ | ✅ | ✅ | ✅ |
| Student progress (own courses) | — | ✅ | — | — |
| Dropout risk scores (own courses) | — | ✅ | — | — |
| Community posts (own courses) | — | ✅ | — | ✅ (moderation) |
| Attendance records | ✅ | ✅ | ✅ | — |
| Other teachers' courses | ❌ | ❌ | ❌ | ❌ |
| Department-level data | ❌ | ❌ | ❌ | ❌ |

### AI Queue Actions
- **APPROVE** — answer is delivered to student and indexed into RAG
- **REJECT** — answer is discarded; student is notified that their question needs rephrasing
- **EDIT + APPROVE** — teacher edits the AI answer before approval; edited version is delivered
- **ESCALATE** — answer moves to Faculty queue when Teacher lacks domain confidence

---

## Faculty

### Definition
Faculty is the senior academic oversight role above Teacher. Faculty does not manage daily course operations but handles escalations from Teachers and ensures curriculum quality. Faculty sees all courses in their department.

### Responsibilities
- Handle AI Queue items escalated from Teachers
- Review curriculum health reports per Knowledge Component
- Report concerns to HOD
- Participate in the academic calendar and syllabus review

### Permissions

| Resource | Read | Update |
|---|---|---|
| All courses in department | ✅ (metadata + queue escalations) | — |
| Escalated AI Queue items | ✅ | ✅ (approve/reject/escalate-to-HOD) |
| Department-level dropout risk | ✅ | — |
| Individual student progress | ✅ (read-only within dept) | — |
| HOD-level data | ❌ | ❌ |

---

## HOD (Head of Department)

### Definition
HOD governs a single department. They provision Faculty and Teacher accounts, approve curriculum changes, review department-level analytics, and receive highest-priority escalations from the AI Queue.

### Responsibilities
- Provision Faculty and Teacher accounts in their department
- Approve curriculum/syllabus changes
- Review department-level dropout risk and attendance trends
- Handle AI Queue items escalated beyond Faculty
- Receive and action welfare severity flags from Counselors
- Report to Institution Admin on department health

### Permissions

| Resource | Create | Read | Update | Delete |
|---|---|---|---|---|
| Faculty accounts (own dept) | ✅ | ✅ | ✅ | ✅ (deactivate) |
| Teacher accounts (own dept) | ✅ | ✅ | ✅ | ✅ (deactivate) |
| All courses in dept | — | ✅ | — | — |
| All AI Queue items in dept | — | ✅ | ✅ (final decision on escalations) | — |
| Department analytics | — | ✅ | — | — |
| Counselor welfare flags | — | ✅ (severity only, no session content) | — | — |
| Student data (dept-wide) | — | ✅ | — | — |
| Other department data | ❌ | ❌ | ❌ | ❌ |

## Queue Escalation Chain

```
Student Question
    └── Tutor Agent generates answer
        └── Guardian filters
            └── PENDING in Teacher's queue
                ├── Teacher APPROVES → delivered to student
                ├── Teacher REJECTS → discarded
                └── Teacher ESCALATES → Faculty queue
                    ├── Faculty APPROVES → delivered to student
                    ├── Faculty REJECTS → discarded
                    └── Faculty ESCALATES → HOD queue
                        └── HOD APPROVES / REJECTS (final authority)
```
