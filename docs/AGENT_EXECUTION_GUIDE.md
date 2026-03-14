# Agent Execution Guide

Last updated: 2026-03-08

This file is for future contributors and AI agents working on Lumina.

Read this before making product or architecture changes.

## 1. Primary Objective

The main objective of this project is:

> Build a teacher-supervised AI LMS where each student has a personal learning system driven by a shared learner profile.

Do not optimize for isolated features.
Optimize for the end-to-end personalized learning loop.

## 2. Non-Negotiable System Rule

Any new major feature should answer at least one of these:

- does it improve the learner profile?
- does it improve adaptive tutoring?
- does it improve adaptive assessment?
- does it improve teacher intervention quality?
- does it reduce teacher workload meaningfully?

If the answer is no, it is probably lower priority.

## 3. Current Truth About The Codebase

### Main operational stack

- web frontend: `frontend/web`
- backend API: `backend/app`
- assessment engine: `backend/app/assessment`
- tutor and pathway logic: `backend/ai_engine`
- learner-profile logic: `backend/learner_profile`

### Known project reality

- many core pieces exist already
- several parts are partial rather than fully unified
- some docs are aspirational and broader than actual code
- state is still distributed across multiple stores

## 4. Work In The Correct Order

When choosing what to build next, use this order:

1. unified learner profile
2. concept-aware assessment and scoring
3. teacher intervention workflows
4. tutor specialization
5. generation studio
6. automation
7. governance and scale

Do not skip this order unless there is a blocking bug.

## 5. Required Reading Before Major Changes

Before making large changes, read:

- [MASTER_GUIDE.md](./MASTER_GUIDE.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [CONNECTION_MAP.md](./CONNECTION_MAP.md)
- [FEATURE_AUDIT.md](./FEATURE_AUDIT.md)
- [STUDENT_INTELLIGENCE_LOOP.md](./STUDENT_INTELLIGENCE_LOOP.md)
- [STUDENT_KPI_ENGINE.md](./STUDENT_KPI_ENGINE.md)
- [EXPLANATION_STYLE_ENGINE.md](./EXPLANATION_STYLE_ENGINE.md)
- [VISION_ALIGNMENT_AUDIT.md](./VISION_ALIGNMENT_AUDIT.md)
- [QUESTION_DIVERSITY_ENGINE.md](./QUESTION_DIVERSITY_ENGINE.md)
- [AUTHENTICITY_AND_ORIGINALITY_ENGINE.md](./AUTHENTICITY_AND_ORIGINALITY_ENGINE.md)
- [TEACHER_REAL_TIME_DASHBOARD.md](./TEACHER_REAL_TIME_DASHBOARD.md)
- [PERSONALIZED_COURSE_ARCHITECTURE.md](./PERSONALIZED_COURSE_ARCHITECTURE.md)
- [PRODUCT_STRATEGY_AND_MARKET_GAP.md](./PRODUCT_STRATEGY_AND_MARKET_GAP.md)
- [DELIVERY_ROADMAP_AND_PHASES.md](./DELIVERY_ROADMAP_AND_PHASES.md)
- [FEATURE_REQUIREMENTS_CHECKLIST.md](./FEATURE_REQUIREMENTS_CHECKLIST.md)
- [AGENT_BUILD_BACKLOG.md](./AGENT_BUILD_BACKLOG.md)

## 6. Design Rules For New Features

### Rule A: Shared learner state

Do not create a new personalization feature with isolated storage if it should belong to the learner profile.

### Rule B: Structured outputs

AI should return structured metadata when possible:

- concept ids
- difficulty
- confidence
- reason
- suggested action

Avoid raw text-only outputs for system-critical flows.

### Rule C: Teacher approval

High-stakes actions must be reviewable:

- grading
- intervention recommendations
- publishable course content
- parent-facing or official reporting

### Rule D: Explainability

When the system suggests an action, it should capture:

- evidence
- confidence
- affected student or concept
- why the action was chosen

### Rule E: Adaptive explanation, not fixed labels

Do not hard-code a student into one permanent "learning style."

Instead:

- store explanation preferences as evidence-backed tendencies
- measure which explanation patterns worked by topic and objective
- keep testing alternatives when confidence is low

## 7. Acceptance Checklist For Any New Work

Before considering a task done, verify:

- data contracts are consistent
- backend and frontend field names match
- feature connects to the right source of truth
- the change does not duplicate a learner-state concept elsewhere
- docs are updated
- tests or validation were run when possible

## 8. Execution Guidance By Area

### If working on assessment

- use concept ids
- update mastery state
- store timing and performance evidence
- ensure outputs can drive remediation

### If working on tutor

- read learner profile
- read current lesson and course context
- read recent assessment or assignment signals
- read explanation effectiveness history if available
- avoid building generic detached prompts

### If working on personalization or analytics

- prefer the canonical profile in `backend/app/services/personalization_service.py`
- treat KPI definitions in `STUDENT_KPI_ENGINE.md` as the scoring source of truth
- avoid adding new per-feature signal stores when the profile can hold the data

### If working on teacher dashboard

- prefer action queues over charts
- show why the student needs help
- include confidence and next-step recommendation

### If working on scoring

- use rubric-first logic
- surface confidence
- support manual override
- never assume AI grade is final in high-stakes contexts

### If working on generation

- output structured course objects, not only text blobs
- attach generation to review and publish workflows

## 9. What Future Agents Should Avoid

- adding more mock or placeholder data to core learning flows
- building isolated AI widgets not connected to learner state
- expanding UI breadth while the core adaptive loop is still weak
- duplicating schemas with slightly different names
- introducing new persistence layers without clear reason

## 10. Suggested Backlog Format

For future task planning, break work into:

- Epic
- Problem
- Outcome
- Backend tasks
- Frontend tasks
- Data tasks
- AI tasks
- Acceptance criteria

## 11. Definition Of Success

Lumina becomes strong when a teacher can open the system and clearly see:

- which students are struggling
- what they are struggling with
- what AI recommends next
- why that recommendation was made
- what can be automated safely

And a student can clearly feel:

- the system knows what they are learning
- the tutor remembers their needs
- the next task is personalized
- feedback arrives quickly and helpfully
