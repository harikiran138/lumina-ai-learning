# Learner Dashboard

> **File:** `08-features/03-learner-dashboard.md`
> **Related:** [[02-roles/05-learner]], [[08-features/04-ai-tutor]], [[03-agents/04-curriculum-agent]]
> **Last Updated:** 2026-04-15

Everything a Student sees when they log into Lumina — their personalised learning home.

---

## Dashboard Sections

### 1. "Start Here" — Next Lesson Recommendation
The most prominent widget on the dashboard. Shows the KC recommended by the PPO Pathway Agent, with a direct link to the lesson. Updates after every quiz submission.

Display: KC name, course name, estimated time, a brief "Why this next?" explanation drawn from the Pathway Agent's `rationale` field.

### 2. Knowledge Mastery Map
A visual grid showing the student's mastery level per KC across all enrolled courses.

- Green (> 0.8): High mastery
- Yellow (0.5–0.8): Moderate mastery
- Red (< 0.5): Low mastery — needs reinforcement

Data source: `knowledge_trace.combined_mastery` per KC.

### 3. Enrolled Courses
Cards for each enrolled course showing:
- Course name and Teacher name
- Overall progress (% of lessons completed)
- Next due flashcards count
- Attendance percentage

### 4. FSRS Flashcard Queue
"You have N cards due for review today." Direct link to the flashcard player.

The flashcard player shows: card front → student clicks "Reveal" → rates recall (Again / Hard / Good / Easy) → FSRS updates stability and schedules next review.

Rating mapping to FSRS:
- Again = 1 (forgot — reset stability)
- Hard = 2 (remembered with significant difficulty)
- Good = 3 (remembered correctly)
- Easy = 4 (remembered effortlessly — stability bonus)

### 5. AI Tutor Chat
The AI Tutor chat interface per course. Student types a question. Sees status: "Your question is with your teacher for review." On answer approval, the approved answer appears inline in the chat.

The chat displays full conversation history including: student questions, approved answers, rejection notices.

### 6. Recent Activity Feed
Timeline of: lessons completed, quizzes submitted (with score), flashcard streaks, community posts, AI tutor answers received.

### 7. Dropout Risk Badge (Self-View)
If `risk_label = 'HIGH'` or `'MEDIUM'`: a discreet banner appears at the top of the dashboard saying "We notice you may be falling behind in [course]. Reach out to your teacher or mentor." The raw score and SHAP features are not shown to the student.

### 8. Attendance Summary
Per-course attendance percentage with a warning if below the institution's threshold (default 75%).

## Mobile Responsiveness

The dashboard is fully responsive. On mobile:
- "Start Here" widget is the first visible element
- Flashcard player is designed for thumb-tap interaction
- AI tutor chat is full-screen on mobile

## Data Sources for Dashboard

| Widget | API endpoint | Data source |
|---|---|---|
| Next lesson | `GET /api/pathway/recommendation` | `student_pathway_log` |
| Mastery map | `GET /api/knowledge-trace/me` | `knowledge_trace` |
| Enrolled courses | `GET /api/enrollments/me` | `enrollments`, `courses` |
| Flashcard queue | `GET /api/flashcards/due` | `fsrs_card_state` |
| Tutor chat | `GET /api/tutor/history?course_id=` | `ai_answer_queue` (APPROVED only) |
| Activity feed | `GET /api/activity/me` | Multiple tables |
| Risk badge | `GET /api/dropout/my-badge` | `dropout_predictions` |
| Attendance | `GET /api/attendance/me` | `attendance_records` |
