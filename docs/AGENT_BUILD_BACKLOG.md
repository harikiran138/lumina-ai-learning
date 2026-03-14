# Agent Build Backlog

Last updated: 2026-03-14

## Purpose

This is the strategic implementation backlog for the student intelligence system described in:

- `docs/STUDENT_INTELLIGENCE_LOOP.md`
- `docs/STUDENT_KPI_ENGINE.md`
- `docs/EXPLANATION_STYLE_ENGINE.md`
- `docs/QUESTION_DIVERSITY_ENGINE.md`
- `docs/AUTHENTICITY_AND_ORIGINALITY_ENGINE.md`
- `docs/TEACHER_REAL_TIME_DASHBOARD.md`
- `docs/PERSONALIZED_COURSE_ARCHITECTURE.md`

Use this backlog when the goal is to turn Lumina into a fully operational personalized learning system.

This file is different from the root `AGENT_TASK_LIST.md`:

- `AGENT_TASK_LIST.md` tracks operational bug and coverage work from the audit pass
- this file tracks product-system build work for the learner intelligence loop

## Workstream Summary

| Workstream | Outcome |
| --- | --- |
| WS1 | One canonical learner-state pipeline |
| WS2 | One KPI engine used across tutor, assessment, pathway, and teacher views |
| WS3 | One explanation style engine with measurable outcomes |
| WS4 | One question-diversity and authenticity layer for evidence-rich assessment |
| WS5 | One intervention loop teachers can act on and close |
| WS6 | One personalized course and evaluation layer for trustworthy rollout |

## Recommended Execution Order

1. Build shared learner state.
2. Formalize KPI computation.
3. Add explanation planning and outcome logging.
4. Add question diversity and authenticity controls.
5. Connect teacher intervention workflows.
6. Add personalized course, evaluation, audit, and rollout controls.

## WS1: Canonical Learner State

### INT-001: Normalize event payloads across all learning surfaces

Why:

- the learner profile can only be trusted if tutor, assessment, assignment, and lesson actions arrive in one event shape

Primary files:

- `backend/app/personalization/schemas.py`
- `backend/app/services/personalization_service.py`
- `backend/app/assessment/api/router.py`
- `backend/app/routers/ai.py`
- `backend/app/routers/student.py`
- `backend/app/routers/assignments.py`

Deliverables:

- stable event envelope per learning action
- payload schema guidelines per event type
- removal of ad hoc state writes where possible

Acceptance:

- every major student action emits a `LearningEventRecord`
- topic ids and session ids are preserved where available
- tutor, assessment, and assignment flows use the same event contract

### INT-002: Extend the learner profile schema with KPI and explanation fields

Why:

- current profile foundation is good, but it does not yet have first-class explanation strategy memory or KPI snapshot fields

Primary files:

- `backend/app/personalization/schemas.py`
- `backend/app/services/personalization_service.py`

Deliverables:

- `explanation_profile`
- `kpi_snapshot`
- `intervention_history`
- optional `misconception_summary`

Acceptance:

- new fields are part of the canonical schema
- they serialize cleanly through existing store paths
- old profile readers remain backward compatible

### INT-003: Create a canonical learner-profile projection API

Why:

- each product surface needs a stable view of learner state without copying storage logic

Primary files:

- `backend/app/services/personalization_service.py`
- `backend/app/routers/student.py`
- `backend/app/routers/ai.py`
- `backend/app/routers/pathway.py`

Deliverables:

- student projection
- tutor projection
- teacher projection
- pathway projection

Acceptance:

- each projection is derived from the same source profile
- no consumer needs to read fallback JSON files directly

### INT-004: Reduce duplicate state logic between personalization and legacy learner profile engines

Why:

- duplicated mastery and behavior logic will diverge over time

Primary files:

- `backend/app/services/personalization_service.py`
- `backend/learner_profile/engine.py`
- `backend/learner_profile/store/state.py`

Deliverables:

- clear ownership split or migration plan
- compatibility wrapper where needed

Acceptance:

- mastery, load, and recent interaction history are not computed in two conflicting ways
- future work has one documented canonical path

## WS2: KPI Engine

### KPI-001: Build a shared KPI calculator module

Why:

- today some KPIs exist only as scattered heuristics

Primary files:

- `backend/app/services/personalization_service.py`
- `backend/learner_profile/analysis/cognitive_load.py`
- new calculator module under `backend/app/personalization` or `backend/app/services`

Deliverables:

- functions for engagement quality
- persistence
- help-seeking calibration
- retention risk
- readiness
- explanation effectiveness
- upgraded risk score

Acceptance:

- formulas match `docs/STUDENT_KPI_ENGINE.md`
- unit tests cover score boundaries and edge cases

### KPI-002: Persist KPI snapshots and historical trends

Why:

- the system needs trends, not only the latest value

Primary files:

- `backend/app/store/personalization_store.py`
- `backend/app/database/sql/001_personal_lms_foundation.sql`
- `backend/app/store/analytics_store.py`

Deliverables:

- latest KPI snapshot on the profile
- historical snapshot storage for trend analysis

Acceptance:

- KPI history is queryable by user and time range
- dashboards can show trend deltas without recomputing from scratch

### KPI-003: Expose KPI projections to tutor, teacher, and pathway flows

Why:

- a KPI engine is wasted if only analytics can see it

Primary files:

- `backend/app/routers/student.py`
- `backend/app/routers/ai.py`
- `backend/app/pathway/orchestrator.py`
- `backend/app/store/analytics_store.py`

Deliverables:

- tutor-ready KPI projection
- teacher dashboard KPI projection
- pathway recommendation KPI projection

Acceptance:

- each consumer uses the shared KPI fields
- no duplicate local formula copies remain

### KPI-004: Add simulation and regression tests for KPI updates

Why:

- KPI formulas need stability checks as the system evolves

Primary files:

- `backend/tests/`
- `pathway agent/tests/`

Deliverables:

- synthetic learner trajectories
- expected KPI transitions
- regression fixtures for risk and readiness scoring

Acceptance:

- test suite proves KPI changes are monotonic or bounded where intended
- edge cases such as inactivity or sparse evidence are covered

## WS3: Explanation Style Engine

### EXP-001: Create a structured explanation planner

Why:

- tutor behavior is currently generated without a first-class style-selection step

Primary files:

- `backend/ai_engine/swarm/tutor.py`
- optional new planner module adjacent to tutor runtime

Deliverables:

- `ExplanationPlan` contract
- style-selection policy
- modality selection logic
- confidence output

Acceptance:

- every tutor response path can produce a plan before generation
- degraded mode can still use a simplified plan

### EXP-002: Log explanation plans and explanation outcomes

Why:

- without attribution, the system cannot learn which explanation worked

Primary files:

- `backend/app/services/personalization_service.py`
- `backend/app/routers/ai.py`
- `backend/app/personalization/schemas.py`

Deliverables:

- explanation-rendered event
- explanation-feedback event
- strategy outcome update logic

Acceptance:

- the learner profile keeps per-strategy effectiveness history
- the next tutor turn can read that history

### EXP-003: Integrate explanation planning with A2UI tutor responses

Why:

- the planner should shape what the student actually sees

Primary files:

- `frontend/web/src/components/ai/AITutorChat.tsx`
- `frontend/web/src/components/advanced/A2UIRenderer.tsx`
- `frontend/web/src/components/ai/CoreVisualizer.tsx`

Deliverables:

- response metadata for depth, modality, and follow-up type
- UI support for plan-aware rendering

Acceptance:

- short explanations, step blocks, comparison tables, and quick checks render predictably from plan metadata

### EXP-004: Add topic-level explanation strategy analytics

Why:

- some strategies will work for math but not writing, or for one learner but not another

Primary files:

- `backend/app/store/analytics_store.py`
- teacher or admin analytics surfaces in `frontend/web/src/app`

Deliverables:

- strategy success rates by topic family
- strategy success rates by learner segment

Acceptance:

- the team can inspect which explanation modes improve outcomes most often

## WS4: Question Diversity And Authenticity

### QD-001: Extend assessment schemas to support multiple question formats

Why:

- the current assessment stack is effectively MCQ-shaped and cannot represent the full evidence model from the vision

Primary files:

- `backend/app/assessment/models/schemas.py`
- `backend/app/assessment/llm/gemini_generator.py`
- `backend/app/assessment/question/selector.py`

Deliverables:

- question union or richer schema
- format-specific metadata and rubric fields

Acceptance:

- MCQ, fill-blank, short answer, long explanation, try-answer, and teach-back are all representable

### QD-002: Generate answer-conditioned follow-up questions

Why:

- the vision depends on question `#2` being derived from the evidence gap in question `#1`

Primary files:

- `backend/app/assessment/engine/session_manager.py`
- `backend/app/assessment/engine/`
- question generation modules

Deliverables:

- answer analyzer
- misconception extraction
- evidence-gap-driven next-question planning

Acceptance:

- next questions can depend on previous learner answer content, not only topic and scalar difficulty

### AUTH-001: Capture authenticity telemetry in answer flows

Why:

- authenticity detection cannot exist without structured interaction evidence

Primary files:

- student assessment and tutor input UIs
- relevant backend ingestion routes

Deliverables:

- paste event capture
- typing cadence summary
- edit and backspace summary
- answer latency normalization

Acceptance:

- answer submissions can include optional authenticity evidence payloads

### AUTH-002: Build a supportive authenticity scorer and probe flow

Why:

- suspicious responses should route to supportive verification, not automatic punishment

Primary files:

- `backend/app/services/personalization_service.py`
- assessment and tutor routes
- teacher review surfaces

Deliverables:

- authenticity score
- follow-up probe generator
- teacher review routing for low-confidence cases

Acceptance:

- flagged responses can trigger a one-step follow-up probe and explainable review reason

## WS5: Teacher Intervention Loop

### INTV-001: Upgrade intervention recommendations into an actionable queue

Why:

- recommendations exist in principle but the teacher workflow is still incomplete

Primary files:

- `backend/app/services/personalization_service.py`
- `backend/app/routers/student.py`
- `backend/app/store/analytics_store.py`
- teacher pages under `frontend/web/src/app/teacher`

Deliverables:

- recommendation object with evidence, confidence, urgency, and suggested action
- queue sorted by priority and expected impact

Acceptance:

- teacher sees who needs help, why, and what to do next

### INTV-002: Track teacher action outcomes

Why:

- Lumina should learn whether interventions actually help

Primary files:

- `backend/app/personalization/schemas.py`
- `backend/app/services/personalization_service.py`
- teacher workflow routes and UI

Deliverables:

- intervention acknowledgement
- intervention resolution
- outcome capture after 3-7 days

Acceptance:

- intervention lift is measurable per recommendation
- dismissed and successful interventions are distinguishable

### INTV-003: Generate teacher digest objects from the same learner-state pipeline

Why:

- digests should not be hand-built from inconsistent aggregates

Primary files:

- `backend/app/store/analytics_store.py`
- `backend/app/worker.py`
- teacher reporting surfaces

Deliverables:

- weekly digest contract
- class heatmap inputs
- at-risk cluster suggestions

Acceptance:

- digests cite real weak topics, risk reasons, and confidence

### DASH-001: Add per-concept heatmap and direct teacher actions

Why:

- the current teacher dashboard is informative but not yet a live intervention console

Primary files:

- `backend/app/store/analytics_store.py`
- `frontend/web/src/app/teacher/dashboard/page.tsx`
- personalization and teacher action routes

Deliverables:

- concept heatmap inputs
- teacher action buttons and APIs
- student detail drawer with current AI recommendation and evidence

Acceptance:

- teacher can see concept-level class status and act directly from the dashboard

## WS6: Personalized Course, Evaluation, and Governance

### PATH-001: Feed readiness and retention risk into the pathway orchestrator

Why:

- pathway decisions should use more than raw mastery

Primary files:

- `backend/app/pathway/orchestrator.py`
- `backend/app/pathway/state_builder.py`
- `backend/app/pathway/policy_engine.py`

Deliverables:

- pathway state includes readiness and retention signals
- reasoning mentions the evidence used

Acceptance:

- pathway recommendations change when readiness or retention risk changes

### COURSE-001: Separate course blueprint from learner pathway projection

Why:

- personalized course delivery needs a clean architecture that preserves one teacher-approved source while allowing per-student variation

Primary files:

- course models and stores
- pathway modules
- personalization schema

Deliverables:

- course blueprint contract
- learner-course projection contract

Acceptance:

- the system can express one canonical course plus one per-learner delivery plan

### COURSE-002: Upgrade AI course generation from outline JSON to structured publishable objects

Why:

- current course generation is useful but still outline-first

Primary files:

- `backend/app/routers/ai.py`
- teacher AI generator flows

Deliverables:

- module objects
- concept graph
- resource references
- publish-ready draft output

Acceptance:

- generated courses can be reviewed and saved as structured drafts, not only outlines

### EVAL-001: Build an offline evaluation harness for student intelligence loops

Why:

- architecture work needs objective evaluation before rollout

Primary files:

- `backend/tests/`
- `training/`
- `pathway agent/tests/`

Deliverables:

- replay harness over synthetic and recorded event traces
- KPI and explanation-policy comparisons

Acceptance:

- the team can compare old and new scoring or explanation policies on the same traces

### GOV-001: Add audit logging and review gates for high-impact AI actions

Why:

- trust requires explainability and human review in high-stakes flows

Primary files:

- `backend/app/core/audit.py`
- `backend/app/services/personalization_service.py`
- `backend/app/routers/ai.py`
- `backend/app/routers/student.py`

Deliverables:

- audit records for interventions, grading recommendations, and explanation plans when flagged
- review-required gates for low-confidence outputs

Acceptance:

- teacher-facing high-impact recommendations expose evidence and confidence
- low-confidence actions can be held for review

## Milestone Definition

### Milestone A: Shared state

Done when `INT-001` through `INT-004` are complete.

### Milestone B: KPI-driven decisions

Done when `KPI-001` through `KPI-004` are complete.

### Milestone C: Evidence-based explanation adaptation

Done when `EXP-001` through `EXP-004` are complete.

### Milestone D: Closed-loop teacher action system

Done when `INTV-001` through `INTV-003` and `DASH-001` are complete.

### Milestone E: Trustworthy rollout

Done when `QD-001`, `QD-002`, `AUTH-001`, `AUTH-002`, `PATH-001`, `COURSE-001`, `COURSE-002`, `EVAL-001`, and `GOV-001` are complete.

## Definition Of Done

This backlog is complete when Lumina can honestly say:

- every student interaction updates one learner profile
- every major AI action uses shared KPIs
- the tutor adapts explanation style using measured effectiveness
- teachers receive explainable intervention queues
- the system logs outcomes and improves future actions
