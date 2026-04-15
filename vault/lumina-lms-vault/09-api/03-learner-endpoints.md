# Learner Endpoints

> **File:** `09-api/03-learner-endpoints.md`
> **Related:** [[09-api/00-api-overview]], [[08-features/03-learner-dashboard]]
> **Last Updated:** 2026-04-15

Endpoints for student progress, flashcards, pathway recommendations, and attendance.

---

## GET /api/knowledge-trace/me

Get the current student's mastery state across all enrolled courses.

**Allowed roles:** student

**Response (200):**
```json
{
  "data": [
    {
      "course_id": "uuid",
      "course_name": "string",
      "kcs": [
        {
          "kc_id": "uuid",
          "kc_name": "string",
          "bkt_mastery": 0.72,
          "dkt_mastery": 0.68,
          "combined_mastery": 0.70,
          "trend": "improving|flat|declining",
          "last_updated": "datetime"
        }
      ]
    }
  ]
}
```

---

## GET /api/pathway/recommendation

Get the PPO Pathway Agent's current KC recommendation for a course.

**Allowed roles:** student

**Query params:** `?course_id=uuid`

**Response (200):**
```json
{
  "data": {
    "recommended_kc_id": "uuid",
    "recommended_kc_name": "string",
    "lesson_id": "uuid",
    "lesson_name": "string",
    "explanation_style": "conceptual|worked_example|analogy|definition|visual",
    "rationale": "string"
  }
}
```

---

## GET /api/flashcards/due

Get all flashcards due for review for the current student.

**Allowed roles:** student

**Query params:** `?course_id=uuid (optional, filter by course)`

**Response (200):**
```json
{
  "data": {
    "due_count": 14,
    "cards": [
      {
        "card_id": "uuid",
        "kc_id": "uuid",
        "kc_name": "string",
        "front": "string",
        "back": "string",
        "hint": "string|null",
        "state": "new|learning|review|relearning",
        "retrievability": 0.61
      }
    ]
  }
}
```

---

## POST /api/flashcards/{card_id}/review

Submit a review rating for a flashcard. FSRS computes the next review date.

**Allowed roles:** student

**Request body:**
```json
{ "rating": 1 }
```

`rating` must be 1 (Again), 2 (Hard), 3 (Good), or 4 (Easy).

**Response (200):**
```json
{
  "data": {
    "card_id": "uuid",
    "new_stability": 4.2,
    "new_retrievability": 1.0,
    "next_review_at": "datetime",
    "new_state": "review"
  }
}
```

---

## GET /api/attendance/me

Get the current student's attendance records.

**Allowed roles:** student

**Query params:** `?course_id=uuid`

**Response (200):**
```json
{
  "data": {
    "overall_attendance_rate": 0.78,
    "threshold": 0.75,
    "below_threshold": false,
    "sessions": [
      {
        "session_id": "uuid",
        "date": "date",
        "present": true,
        "method": "qr|manual"
      }
    ]
  }
}
```

---

## POST /api/attendance/mark

Mark attendance using a QR code token.

**Allowed roles:** student

**Request body:**
```json
{ "qr_token": "string (one-time token from QR code)" }
```

**Response (200):**
```json
{ "data": { "message": "Attendance marked successfully", "session_id": "uuid" } }
```

**Response (400):** Token expired (> 10 minutes) or already used by this student.
**Response (403):** Proxy detection — multiple students from same device.

---

## GET /api/dropout/my-badge

Get the current student's dropout risk badge (no raw score, no SHAP).

**Allowed roles:** student

**Response (200):**
```json
{
  "data": {
    "risk_label": "LOW|MEDIUM|HIGH",
    "week_start": "date"
  }
}
```
