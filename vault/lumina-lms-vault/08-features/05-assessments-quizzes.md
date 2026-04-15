# Assessments, Quizzes & FSRS Spaced Repetition

> **File:** `08-features/05-assessments-quizzes.md`
> **Related:** [[04-data-flow/05-assessment-flow]], [[03-agents/03-grading-agent]]
> **Last Updated:** 2026-04-15

Quiz types, assessment creation workflow, auto-grading, handwriting pipeline, and FSRS v5 flashcard system.

---

## Assessment Types

| Type | Grading | Teacher review required? |
|---|---|---|
| MCQ Quiz | Auto (instant) | No |
| True/False Quiz | Auto (instant) | No |
| Short-Answer (typed) | AI-suggested (Gemini) | Yes — before marks released |
| Essay (typed) | AI-suggested (Gemini) | Yes — before marks released |
| Handwritten assignment | TrOCR → AI-suggested | Yes — before marks released |

## Quiz Creation (Teacher)

```
POST /api/assessments
Body: {
  course_id, module_id, name, description,
  time_limit_minutes,
  questions: [
    {
      question_text, question_type, options, correct_answer,
      max_marks, knowledge_component_id, bloom_level
    }
  ],
  shuffle_questions: true,
  shuffle_options: true,
  attempts_allowed: 1,
  visible_after: "datetime",
  due_at: "datetime"
}
```

Or Teacher can click "Generate with AI" → Assessment Agent creates a draft question set → Teacher reviews and publishes.

## MCQ Auto-Grading

On quiz submission:
1. Backend compares each `selected_option` to `correct_answer` for all MCQ/TF questions
2. Score is computed: `sum(awarded_marks for correct answers)`
3. Score is immediately visible to the student
4. No Teacher action required for MCQ/TF grading

## Short-Answer / Essay Grading (AI-assisted)

1. Student submits typed answer
2. Assessment Agent (Gemini) compares answer to rubric and suggests marks + feedback
3. Result lands in Teacher's grading queue with `status = 'PENDING'`
4. Teacher reviews: approve AI suggestion, edit marks, or grade manually
5. On approval, marks and feedback are released to student

## Handwritten Assignment Pipeline

See [[03-agents/03-grading-agent]] for the full six-stage pipeline.

Summary: student photographs answer sheet → TrOCR transcribes → Assessment Agent grades → Teacher reviews → marks released.

## FSRS v5 — Spaced Repetition System

### Algorithm

FSRS v5 is implemented in pure Python. The core formula:

```python
import math

class FSRSScheduler:
    # Tuned weights from FSRS v5 paper
    W = [0.4072, 1.1829, 3.1262, 15.4722, 7.2102, 0.5316, 1.0651, 0.0589,
         1.4351, 0.1544, 1.0040, 1.9813, 0.0953, 0.2975, 2.2042, 0.2407,
         2.9466, 0.5034, 0.6567]

    def retrievability(self, stability: float, elapsed_days: float) -> float:
        """R(t) = e^(ln(0.9) × t / S)"""
        return math.exp(math.log(0.9) * elapsed_days / stability)

    def next_stability_after_review(self, S, D, R, rating):
        if rating == 1:  # Again (forgot)
            return (self.W[0] * D**(-self.W[1]) *
                    ((S + 1)**self.W[2] - 1) * math.exp(self.W[3] * (1 - R)))
        else:  # Hard (2), Good (3), Easy (4)
            return S * math.exp(self.W[4] * (1 - R) *
                                (11 - D) * self.W[5] * (rating - 1))

    def next_interval_days(self, stability: float, target_retention: float = 0.9) -> int:
        return max(1, round(stability * math.log(target_retention) / math.log(0.9)))
```

### Card States

| State | Meaning | Next review |
|---|---|---|
| `new` | Never reviewed | Immediate (at enrollment) |
| `learning` | In short-interval repetition | 1–10 minutes |
| `review` | In spaced repetition schedule | Days to months |
| `relearning` | Forgotten after review (rated Again) | 1–10 minutes |

### FSRS Card State Fields

| Field | Type | Description |
|---|---|---|
| `stability` | float | Current memory stability (days) |
| `difficulty` | float (1–10) | Card difficulty (higher = harder to learn) |
| `retrievability` | float (0–1) | Estimated probability of recall right now |
| `next_review_at` | timestamptz | When this card is next due |
| `state` | enum | `new`, `learning`, `review`, `relearning` |
| `reps` | integer | Total review count |
| `lapses` | integer | Times rated "Again" after being in review state |

### Student Flashcard Session

1. Student opens "Flashcards" → sees all due cards (where `next_review_at <= now`)
2. For each card: front shown → student thinks → clicks "Reveal" → sees back
3. Student rates recall: Again / Hard / Good / Easy
4. FSRS computes new stability and next review date
5. `UPDATE fsrs_card_state SET stability=..., next_review_at=..., state=..., reps=reps+1`
6. Session ends when no more due cards

## Attendance

### QR-Based Attendance

Teacher generates a QR code at the start of a session. QR code encodes a one-time token (valid for 10 minutes, stored in Redis with TTL). Students scan the QR code with their phone, which calls `POST /api/attendance/mark` with the token. The token is invalidated after first use per student to prevent sharing.

### Manual Attendance

Teacher can also open a roll call view and manually mark each student present/absent. Manual entries are distinguished from QR entries in `attendance_records.method` field (`qr` or `manual`).

### Proxy Detection

If the same device submits attendance for multiple students within 60 seconds, the system flags all submissions from that device as `proxy_suspected = true` and alerts the Teacher.

### Attendance Threshold Alert

When a student's attendance drops below the institution's configured threshold (default 75%) in any course, the student receives a warning notification and the Teacher receives an alert.
