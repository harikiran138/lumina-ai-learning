# Lumina Feature Audit

Last updated: 2026-03-08

## 1. Summary

Lumina already has many real product modules. The main problem is not lack of ideas. The main problem is uneven integration.

The strongest parts today are:

- authentication and role-based surfaces
- course CRUD and learning pages
- AI tutor routing with RAG hooks
- adaptive assessment session flow
- assignment upload and grading pipeline
- AI course and PPT generation utilities

The weakest parts today are:

- unified learner profile
- teacher intervention workflows
- explainable and calibrated scoring
- end-to-end subject specialization
- automation and orchestration

## 2. Capability Matrix

| Capability | Status | Current implementation | Main gap |
| --- | --- | --- | --- |
| User auth and role routing | Implemented | JWT login, role-based dashboards | Session handling is basic |
| Student dashboard | Partial | Progress, streak, badges placeholders, mastery reads | Some data is still aggregate or sparse |
| Student profile | Partial | Notes, quiz stats, user info | Needs richer learner history and preferences |
| Course catalog and enrollment | Implemented core | Course listing, detail, enroll, completion | Recommendation quality is basic |
| Teacher course authoring | Implemented core | Create, update, modules, lessons, publish | Better validations and collaboration missing |
| Community | Implemented basic | Messaging routes and UI | Moderation and analytics are limited |
| AI tutor | Partial | Prompting, RAG, pathway hooks, guardrails | Needs subject specialization and stronger state |
| Adaptive assessment | Partial | Session manager, next question, submit, report | Needs concept graph and remediation plan output |
| Mastery tracking | Partial | Session difficulty and mastery read endpoints | Not yet a full concept-level source of truth |
| Assignment grading | Partial | Upload, OCR/text extraction, semantic grading | Rubrics, confidence, appeals, and human review missing |
| Handwriting support | Partial | OCR upload pipeline | Deep feedback and handwriting pedagogy are limited |
| PPT generation | Implemented basic | Slide plan plus `.pptx` creation | Needs template control and course linkage |
| AI course generation | Implemented basic | Topic-based and assignment-based course outline generation | Output should be converted into full course objects |
| Teacher insights | Partial | Teacher dashboard and student list | Needs recommended actions and risk ranking |
| Admin controls | Partial | Users, logs, high-level stats | Needs policy, compliance, and model governance |
| Mobile experience | Prototype | Flutter and mobile preview apps | No unified production mobile path |
| AI automation | Missing | No general workflow engine | Needed for weekly plans, reports, interventions |

## 3. Pain Points Blocking a Full AI LMS

### Pain point: one learner, many disconnected states

The same student is represented across:

- `progress`
- `user_data`
- `assessment_sessions`
- tutor session memory
- learner profile fallback files

This prevents reliable personalization.

### Pain point: teacher sees metrics, not decisions

Teachers can view totals and lists, but the system does not yet answer:

- which students need help now
- what misconception they likely have
- what intervention to try first
- what the AI is confident about versus unsure about

### Pain point: scoring is not yet trustworthy enough

Current grading is useful for speed, but not for high-trust classroom use because it still lacks:

- rubric decomposition
- confidence scores
- teacher override workflow
- calibration against exemplar answers
- explanation of deduction logic

### Pain point: tutor is smart but not specialized enough

The tutor can answer questions, but it is not yet strongly constrained by:

- subject-specific pedagogy
- grade band
- course outcomes
- remediation protocol
- teacher-approved materials only

## 4. What Must Be Improved Next

### Highest priority

1. Build a learner-profile service that merges assessment, assignments, tutor signals, and course activity.
2. Add teacher intervention objects such as `risk_level`, `probable_gap`, `suggested_action`, and `confidence`.
3. Turn assignment grading into rubric scoring with teacher moderation.
4. Make question generation concept-aware so assessments and tutor quizzes update the same mastery graph.

### Second priority

1. Add subject tutor modes: math tutor, science tutor, coding tutor, language tutor.
2. Convert AI course generation from outlines into publishable course records.
3. Build an automation layer for recurring reports, remediation plans, and class summaries.

### Third priority

1. Improve explainability and analytics exports.
2. Add parent/guardian and institution reporting if needed.
3. Add stronger A/B testing and outcome tracking.

## 5. Definition of “Full AI LMS” for This Repo

Lumina should only be called a full AI LMS when all of the following are true:

- every student has a persistent learner profile
- assessments, assignments, tutor sessions, and lesson behavior update that profile
- the tutor, question generator, and pathway engine all use the same profile
- teachers receive prioritized, explainable intervention recommendations
- grading is rubric-aware, confidence-aware, and reviewable
- course and PPT generation are attached to curriculum objects, not isolated outputs
- admin controls cover safety, governance, and auditability
