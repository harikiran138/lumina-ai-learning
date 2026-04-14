# Support Ecosystem: API Reference

The Support API facilitates the secure connection between students and their support network (Parents/Mentors) and provides access to filtered progress data.

## 👨‍👩‍👦 Parent Endpoints
Scoped to the authenticated parent's `user_id`.

### 1. Connection Management
- `POST /parent/link-by-code`: Links a parent to a student using the student's unique `parent_link_code`.
- `POST /parent/connection/connect`: Connects using a temporary token stored in Redis (`student_connect:{token}`).
- `DELETE /parent/connection/{child_id}`: Severs the link between parent and child.

### 2. Progress & Goals
- `GET /parent/dashboard`: Aggregated scannable view of all linked children's progress.
- `GET /parent/weekly-reports`: Fetches the AI-summarized weekly activity reports.
- `POST /parent/goals`: Sets a motivational goal (e.g., "Complete 10 Concept Blocks") for a specific child.

## 🎓 Mentor Endpoints
Scoped to the mentor's specialization and assigned student list.

- `GET /mentor/students`: Lists all students assigned to the mentor for pastoral care.
- `POST /mentor/intervene`: Similar to the Faculty intervention, but focused on behavioral or wellbeing guidance.
- `GET /mentor/wellbeing/{student_id}`: Retrieves burnout and stress signals from the `WellbeingService`.

## 📡 Live Notifications
The `notifications` system broadcasts events to parents and mentors for:
- **Low Performance Alerts**: When a student fails multiple assessments.
- **Goal Completion**: When a student completes a parent-set goal.
- **Direct Messages**: Encrypted communication between mentors and faculty.

---
[[Support/Overview]] | [[Support/Backend]] | [[Support/Backend]] | [[Support/Frontend]] | [[Support/Flow]]
