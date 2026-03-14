# Vision Alignment Audit

Last updated: 2026-03-14

## Purpose

This document checks the major architecture claims from the recent vision diagrams against the actual Lumina repository.

Use it to distinguish:

- what is implemented today
- what exists as a real skeleton
- what is only partially wired
- what is still target-state architecture

## Note About The Screenshot Noise

The `::view-transition-*`, `Vvisualize`, and `show_widget` text in the pasted prompt is presentation noise, not part of Lumina's architecture.

The architecture claims worth auditing are the ones about:

- adaptive intelligence loop
- KPI computation
- question diversity
- authenticity detection
- explanation style routing
- teacher dashboard
- personalized course architecture

## Claim-By-Claim Audit

| Vision claim | Status in repo | Evidence | Accurate wording |
| --- | --- | --- | --- |
| BKT tracks mastery per concept | Implemented foundation | `backend/learner_profile/models/bkt.py`, `backend/app/services/personalization_service.py`, `backend/app/assessment/engine/knowledge_tracing.py` | Accurate as a foundation |
| DKT predicts what the student will understand next | Partial | `backend/learner_profile/models/dkt.py`, `backend/learner_profile/engine.py` exist, but DKT is not the main live driver for tutor, dashboard, or pathway decisions | DKT scaffolding exists, but it is not yet the live cross-system prediction layer |
| PPO reinforcement learning re-sequences the course path after every single answer | Target-state only | `backend/app/pathway/policy_engine.py` is heuristic, `backend/app/pathway/orchestrator.py` uses a fallback optimizer, RL assets and docs exist under `pathway agent/` | RL groundwork exists, but production pathway decisions are currently heuristic, not PPO-driven after every answer |
| Question #2 is generated from the specific words and gaps in question #1's answer | Target-state only | `backend/app/assessment/engine/session_manager.py` generates the next question from topic and scalar difficulty; no semantic answer-conditioned follow-up generation is wired | Next-question generation is adaptive by topic and difficulty, not yet by answer semantics |
| Six question types are selected based on mastery and learning style | Target-state only | `backend/app/assessment/models/schemas.py` and `backend/app/assessment/llm/gemini_generator.py` are MCQ-oriented today | Multi-format question diversity is a design target, not current runtime behavior |
| Copy-paste and authenticity detection uses six simultaneous signals | Target-state only | no runtime keystroke/backspace/paste instrumentation pipeline was found in the assessment or tutor stack; references are mostly in docs | Authenticity detection is documented as a target system, not currently enforced in production flows |
| Explanation router continuously weights eight communication modes by mastery gain per student | Partial to target-state | tutor runtime adapts somewhat, degraded A2UI responses include multiple response modes, and Socratic simplification exists in `backend/ai_engine/swarm/tutor.py`; persistent style-weight learning does not exist yet | Tutor personalization exists, but a persisted weighted explanation-style engine is not fully implemented |
| Teacher sees a live heatmap and real-time intervention queue | Partial | teacher dashboard exists in `frontend/web/src/app/teacher/dashboard/page.tsx`, analytics aggregation exists in `backend/app/store/analytics_store.py`, intervention API exists in `backend/app/routers/personalization.py`; no live per-concept heatmap or teacher override controls were found | Teacher dashboard foundations exist, but the live heatmap and direct intervention control layer are still target-state |
| Teacher can override the next question or re-route a student from one screen | Target-state only | no teacher action API for question override or pathway override was found in the active teacher dashboard flow | This is still an intended control-plane feature |
| Two students in the same class get different topic order, example domains, question mixes, and pacing | Partial to target-state | pathway scaffolding exists, tutor can use context, and course generation exists; persisted per-student course projections are not yet implemented | Personalization foundations exist, but per-student persisted course architecture is not fully wired |
| Platform-wide learning transfers what works for one student profile to the next similar student | Target-state only | no cohort similarity or online policy-learning layer was found in production routes | This is a future optimization layer |
| `backend/ai_engine`, `backend/learner_profile`, and the assessment engine already contain the skeleton for the vision | Accurate with caveat | those directories contain real primitives for tutor, pathway, assessment, BKT, DKT, and interventions | Accurate as long as "skeleton" is interpreted as foundation, not full implementation |

## Summary By System

## 1. Adaptive Intelligence Loop

Status: `Implemented foundation`

What is real now:

- learner-profile event recording through `PersonalizationService`
- BKT-style mastery updates
- assessment session loop with difficulty updates
- tutor routing through the swarm orchestrator
- pathway recommendation scaffolding

What is not yet real:

- one unified loop where every answer updates pathway, tutor strategy, dashboard, and question generation in one atomic pipeline
- DKT- and RL-driven sequencing in production

## 2. KPI Engine

Status: `Partial`

What is real now:

- mastery
- performance averages
- weak topics
- risk summary
- cognitive load estimation
- teacher dashboard aggregates

What is missing:

- formal growth velocity
- lag-zone scoring
- authenticity score
- explanation effectiveness score
- stable shared KPI service used everywhere

## 3. Question Diversity Engine

Status: `Target-state only`

What is real now:

- concept metadata support exists in the assessment schema
- adaptive difficulty selection exists
- generated questions are usually MCQ-shaped

What is missing:

- short-answer, long-form, fill-blank, try-answer, teach-back question contracts
- answer-conditioned follow-up generation
- question-type policy by mastery, confidence, and evidence needs

## 4. Authenticity Detection

Status: `Target-state only`

What is real now:

- documentation ideas exist
- assignment and tutor flows can ask for more evidence in principle

What is missing:

- keystroke capture
- paste detection events
- edit-history scoring
- semantic fingerprinting
- non-punitive follow-up probe flow

## 5. Explanation Style Router

Status: `Partial`

What is real now:

- tutor adapts based on topic and cognitive load
- tutor supports Socratic behavior
- degraded A2UI responses already vary structure

What is missing:

- persisted explanation mode weights per learner
- exploration versus exploitation policy
- explanation outcome attribution
- teacher-visible explanation strategy state

## 6. Teacher Real-Time Dashboard

Status: `Partial`

What is real now:

- teacher command-center UI
- summary cards
- priority queue
- student momentum list
- assignment and grading workload visibility

What is missing:

- live concept heatmap
- direct intervention actions from the queue
- per-student explanation-style visibility
- teacher override of AI next steps

## 7. Personalized Course Architecture

Status: `Partial to target-state`

What is real now:

- topic-based course outline generation
- assignment-based course outline generation
- pathway recommendation scaffolding

What is missing:

- clear split between teacher-authored course blueprint and student-specific pathway projection
- persisted per-student example-domain personalization
- question mix personalization stored at learner-course level
- automated course resequencing after every answer

## Recommended Documentation Positioning

Use the following wording in core docs:

- "Implemented foundation" for BKT, learner profile scaffolding, teacher dashboard scaffolding, assessment adaptivity, and course-generation endpoints
- "Partial" for DKT integration, tutor adaptation, intervention workflows, and pathway recommendations
- "Target-state" for PPO sequencing, answer-conditioned question generation, authenticity detection, live heatmaps, teacher overrides, and platform-wide transfer learning

## Recommended Companion Docs

- `docs/STUDENT_INTELLIGENCE_LOOP.md`
- `docs/STUDENT_KPI_ENGINE.md`
- `docs/EXPLANATION_STYLE_ENGINE.md`
- `docs/QUESTION_DIVERSITY_ENGINE.md`
- `docs/AUTHENTICITY_AND_ORIGINALITY_ENGINE.md`
- `docs/TEACHER_REAL_TIME_DASHBOARD.md`
- `docs/PERSONALIZED_COURSE_ARCHITECTURE.md`
