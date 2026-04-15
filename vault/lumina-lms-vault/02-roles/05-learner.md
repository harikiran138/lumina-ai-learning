# Student / Learner

> **File:** `02-roles/05-learner.md`
> **Related:** [[02-roles/00-roles-index]], [[08-features/03-learner-dashboard]], [[08-features/04-ai-tutor]]
> **Last Updated:** 2026-04-15

Student is the primary end-user of Lumina. Every AI system, adaptive feature, and data pipeline ultimately serves the student's learning journey.

---

## Definition

Student (also called Learner) is enrolled in one or more courses within their department. Their learning path is personalised by the BKT+DKT knowledge tracing system and the PPO Pathway Agent. Their interactions with the AI Tutor are mediated by the TILA pattern — all answers are teacher-verified before delivery.

## Login Identifier

Students log in with their **hall ticket number** (e.g., `22NU1A0519`) as the username. The hall ticket is the primary identifier in Indian engineering colleges and is used as the `username` field in the `users` table.

## Responsibilities

Students do not have administrative responsibilities. Their primary interactions are:
- Attend lectures (or watch recorded lectures)
- Submit assignments and quizzes
- Ask questions to the AI Tutor (subject to TILA queue)
- Complete flashcard review sessions (FSRS v5 schedule)
- Participate in community discussions
- Track their own progress on the learner dashboard

## Permissions

| Resource | Create | Read | Update | Delete |
|---|---|---|---|---|
| Own profile | — | ✅ | ✅ (limited fields) | — |
| Enrolled courses (content) | — | ✅ | — | — |
| Quiz submissions | ✅ | ✅ (own only) | — | — |
| Assignment submissions | ✅ | ✅ (own only) | — | — |
| AI Tutor questions | ✅ | ✅ (own only, after TILA approval) | — | — |
| Flashcard sessions | — | ✅ | ✅ (rate self) | — |
| Community posts | ✅ | ✅ (course-scoped) | ✅ (own posts) | ✅ (own posts) |
| Own knowledge trace | — | ✅ | — | — |
| Own dropout risk score | — | ✅ (badge only, not raw score) | — | — |
| Other students' data | ❌ | ❌ | ❌ | ❌ |

## What Students Cannot Do

- See other students' grades, submissions, or knowledge traces
- Access the AI queue directly (they submit questions; Teacher approves answers)
- See the raw dropout risk score — only a badge (LOW/MEDIUM/HIGH)
- See SHAP feature contributions for their own dropout risk
- Modify their enrollment records

## Adaptive Learning Experience

1. Student completes a quiz on Knowledge Component X
2. BKT updates P(mastery|X) based on correct/incorrect responses
3. DKT LSTM ingests the sequence of (KC, correct) events and predicts mastery across all KCs
4. PPO Pathway Agent selects the next KC: if mastery is high, advance; if low, reinforce
5. Student sees personalised next-lesson recommendation on their dashboard

## Tutor Interaction Flow

1. Student types a question in the AI Tutor chat
2. System dispatches to the AI Engine (background task)
3. Tutor Agent (Claude Sonnet 4.6) generates a RAG-grounded answer
4. Guardian Agent (Claude Haiku 4.5) checks the answer
5. Answer lands in Teacher's queue with `status = PENDING`
6. Student sees: "Your question is being reviewed by your teacher"
7. Teacher APPROVES → student receives answer; answer indexed into RAG
8. Teacher REJECTS → student sees: "Your teacher suggests rephrasing this question"

## Edge Cases

**Student enrolled in multiple courses from different teachers** — Each course has its own independent queue. A student's question about Course A goes to Course A's Teacher, not Course B's Teacher.

**Student submits handwritten assignment** — Student photographs their handwritten answer sheet and uploads the image. TrOCR pipeline transcribes it, Assessment Agent grades it against the rubric, result lands in Teacher's review queue before any marks are visible to the student.

**Student's FSRS card is due but student doesn't log in** — FSRS records the missed review. Stability for that card degrades according to the retrievability formula. The card re-appears with higher priority at next login.
