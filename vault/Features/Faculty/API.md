# Faculty & Academics: API Reference

The Faculty API enables educators to orchestrate the learning environment and intervene in student progress with high precision.

## 🔑 Key Endpoints

### 1. Dashboard & Management
- `GET /teacher/dashboard`: The primary state fetcher. Returns student headcount, pending grading counts, active alerts (interventions), and course snapshots.
- `GET /teacher/subjects`: Lists course assignments with associated batch and section metadata.

### 2. Live Orchestration (Session Control)
- `POST /teacher/intervene`: Sends a live WebSocket message or action (e.g., "Encourage", "Schedule 1-on-1") to a student.
- `POST /teacher/override-question`: Force-injects a specific question into a student's active assessment session, overriding the AI's selection.
- `POST /teacher/attendance/mark`: Submits bulk attendance records for a specific course, batch, and section session.

### 3. Content & Grading Pipeline
- `POST /teacher/content/upload`: Logs teaching materials and triggers the "Scaffold Generation" AI job.
- `POST /teacher/submissions/physical/process/{id}`: Processes a handwritten assignment via OCR and returns an AI-generated score and feedback.
- `POST /teacher/verification/queue`: Retrieves content that requires human-in-the-loop verification (e.g., low-confidence AI answers).

### 4. Advanced Analytics
- `GET /teacher/heatmap/{course_id}`: Fetches a concept-level mastery heatmap for a cohort of students.
- `GET /teacher/analytics/misconceptions`: Identifies common logical errors or "concept gaps" clustering across multiple students.

## 📡 Live Events (WebSockets)
Teachers broadcast events on the `adaptive_channel`:
- **Type**: `teacher:intervene`
- **Payload**: `message`, `action`, `teacher_id`.

---
[[Faculty/Overview]] | [[Faculty/Backend]] | [[Faculty/Frontend]] | [[Faculty/Flow]]
