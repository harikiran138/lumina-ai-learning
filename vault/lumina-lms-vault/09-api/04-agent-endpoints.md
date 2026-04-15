# Agent Endpoints

> **File:** `09-api/04-agent-endpoints.md`
> **Related:** [[09-api/00-api-overview]], [[04-data-flow/04-ai-agent-job-flow]], [[03-agents/00-agents-index]]
> **Last Updated:** 2026-04-15

Endpoints that trigger or manage AI agent jobs — the TILA queue, assessments, and dropout predictions.

---

## POST /api/queue/submit

Student submits a question to the AI Tutor. Dispatches Tutor Agent as background task.

**Allowed roles:** student

**Request body:**
```json
{
  "course_id": "uuid",
  "concept_id": "uuid",
  "question": "string (max 1000 chars)"
}
```

**Response (202 Accepted):**
```json
{
  "data": {
    "queue_id": "uuid",
    "status": "pending",
    "message": "Your question has been sent to your teacher for review."
  }
}
```

**Side effects:** Dispatches background task → Tutor Agent → Guardian → inserts into `ai_answer_queue`. Rate limited to 5 requests/minute per student.

---

## GET /api/queue

Get the AI queue for a Teacher/Faculty/HOD.

**Allowed roles:** teacher, faculty, hod

**Query params:** `?course_id=uuid&status=PENDING&page=1&per_page=20`

Teachers see only their own courses. Faculty sees their department. HOD sees their department including escalations.

**Response (200):**
```json
{
  "data": [
    {
      "queue_id": "uuid",
      "course_id": "uuid",
      "course_name": "string",
      "concept_id": "uuid",
      "concept_name": "string",
      "student_question": "string",
      "ai_generated_answer": "string",
      "ai_confidence": 0.87,
      "guardian_flagged": false,
      "guardian_flag_reason": null,
      "status": "PENDING",
      "priority_score": 0.72,
      "created_at": "datetime",
      "rag_sources_used": ["chunk_id_1"],
      "flags_for_teacher": null
    }
  ],
  "pagination": { ... }
}
```

---

## POST /api/queue/{queue_id}/approve

Approve a queue item. Delivers the answer to the student.

**Allowed roles:** teacher (own courses), faculty (escalated items in dept), hod (all in dept)

**Request body (optional — for edited approval):**
```json
{ "edited_answer": "string|null" }
```

If `edited_answer` is provided, the edited version is delivered. If null, the original AI answer is delivered.

**Response (200):**
```json
{ "data": { "queue_id": "uuid", "status": "APPROVED", "answer_delivered": true } }
```

**Side effects:** Updates `ai_answer_queue.status = 'APPROVED'`; pushes answer to student; dispatches background task to index Q+A into FAISS.

---

## POST /api/queue/{queue_id}/reject

Reject a queue item. Student is notified to rephrase.

**Allowed roles:** teacher (own courses), faculty (escalated in dept), hod (all in dept)

**Request body:**
```json
{ "reason": "string (internal note, not shown to student)" }
```

**Response (200):**
```json
{ "data": { "queue_id": "uuid", "status": "REJECTED" } }
```

---

## POST /api/queue/{queue_id}/escalate

Escalate a queue item to Faculty (from Teacher) or to HOD (from Faculty).

**Allowed roles:** teacher (escalates to faculty), faculty (escalates to hod)

**Request body:** None

**Response (200):**
```json
{ "data": { "queue_id": "uuid", "status": "ESCALATED", "escalated_to": "faculty|hod" } }
```

---

## POST /api/assessments/{assessment_id}/submit

Submit answers to an assessment (quiz).

**Allowed roles:** student

**Request body:**
```json
{
  "answers": [
    { "question_id": "uuid", "selected_option": "A|B|C|D|null", "text_answer": "string|null" }
  ],
  "time_taken_seconds": 1250
}
```

**Response (200):**
```json
{
  "data": {
    "submission_id": "uuid",
    "score": 17.5,
    "max_score": 20.0,
    "percentage": 87.5,
    "auto_graded": true,
    "pending_manual_review": false,
    "knowledge_trace_updated": true
  }
}
```

**Side effects:** Grades MCQ/TF questions; dispatches BKT+DKT update and PPO Pathway Agent as background tasks; updates FSRS card states.

---

## GET /api/dropout/scores

Get dropout risk scores for a Teacher's courses.

**Allowed roles:** teacher, faculty, hod

**Query params:** `?course_id=uuid&risk_label=HIGH&week_start=2026-04-13`

**Response (200):**
```json
{
  "data": [
    {
      "student_id": "uuid",
      "student_name": "string",
      "course_id": "uuid",
      "risk_score": 0.78,
      "risk_label": "HIGH",
      "top_risk_factors": [
        "Attendance below 60% in last 7 days",
        "No login in 5 days",
        "Quiz score declining over 4 weeks"
      ],
      "shap_values": { "attendance_rate_7d": -0.23, "days_since_last_login": 0.18, ... }
    }
  ]
}
```

Note: `shap_values` is included for Teacher/Faculty/HOD. Not returned for Student or Parent (use `/api/dropout/my-badge` instead).
