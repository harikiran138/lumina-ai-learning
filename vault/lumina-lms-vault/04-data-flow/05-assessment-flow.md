# Assessment Flow

> **File:** `04-data-flow/05-assessment-flow.md`
> **Related:** [[04-data-flow/00-data-flow-master]], [[03-agents/03-grading-agent]], [[08-features/05-assessments-quizzes]]
> **Last Updated:** 2026-04-15

How students submit quizzes and assignments, and how grading flows back to update knowledge state.

---

## Quiz Submission Flow

**Step 1 — Student opens quiz**
```
GET /api/assessments/{assessment_id}
```
Returns questions without correct answers. Questions are shuffled per student using `student_id` as the random seed (deterministic shuffle — same student always sees the same order, preventing cheating via comparison).

**Step 2 — Student submits**
```
POST /api/assessments/{assessment_id}/submit
Body: {
  "answers": [
    { "question_id": "uuid", "selected_option": "string|null", "text_answer": "string|null" }
  ],
  "time_taken_seconds": "integer"
}
```

**Step 3 — MCQ auto-grading**
Backend compares `selected_option` to `correct_answer` in `assessment_questions`. Score computed immediately.

**Step 4 — Knowledge trace update (background)**
Background task runs the BKT+DKT pipeline:

```python
# BKT update per KC for each question answered
for question in submitted_answers:
    kc_id = question.knowledge_component_id
    correct = question.is_correct
    
    # BKT update (Bayesian)
    p_mastery_prior = knowledge_trace[kc_id].bkt_mastery
    p_mastery_posterior = bkt_update(p_mastery_prior, correct, p_slip, p_guess)
    
# DKT inference — LSTM reads full sequence of (KC, correct) pairs
dkt_mastery_vector = dkt_model.predict(student_interaction_sequence)

# Combined mastery
combined = 0.5 * bkt_mastery + 0.5 * dkt_mastery

# Update database
UPDATE knowledge_trace SET bkt_mastery=..., dkt_mastery=..., combined_mastery=...
WHERE student_id=:sid AND kc_id=:kc_id AND institution_id=:iid
```

**Step 5 — Pathway Agent runs (background)**
After knowledge trace update, PPO Pathway Agent recommends the next KC. See [[03-agents/04-curriculum-agent]].

**Step 6 — FSRS update**
Each quiz question corresponds to a flashcard. Correct = rating 3 (Good), incorrect = rating 1 (Again). FSRS updates stability and next_review_at for each card.

```python
scheduler = FSRSScheduler()
for card in quiz_cards:
    rating = 3 if card.correct else 1
    new_stability = scheduler.next_stability(card.stability, card.difficulty, card.retrievability, rating)
    new_next_review = now + timedelta(days=new_stability)
    UPDATE fsrs_card_state SET stability=new_stability, next_review_at=new_next_review ...
```

## Grade Visibility

Quiz grades are visible to the student immediately after submission. There is no manual Teacher review step for MCQ quizzes (unlike AI tutor answers). The BKT+DKT update and FSRS update happen in the background.

## Short-Answer and Essay Grading

If the assessment contains `short_answer` or `essay` questions, they are NOT auto-graded. They are placed in `handwritten_grading_queue` (for handwritten) or `text_grading_queue` (for typed). Teacher reviews and enters marks manually or approves AI-suggested marks.

## Dropout Feature Update

After every assessment submission, the student's feature vector in `dropout_features` is updated with the new quiz score. The dropout prediction model uses these features in the next weekly cron run.
