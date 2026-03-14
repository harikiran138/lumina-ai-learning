# Lumina Master Guide

Last updated: 2026-03-14

## Purpose

This document is the entry point for understanding the current Lumina codebase and the target product direction:

- what already exists in the repository
- how the major sections connect
- where the data flows today
- what is partially implemented versus production-ready
- what must be built next to become a full personalized AI LMS

## Product Goal

Lumina should become a personal AI LMS for every student:

- each student gets an evolving learner profile
- the system detects weak topics, behavior patterns, pace, and confidence
- the tutor, assessment engine, assignments, and course recommendations all use the same learner state
- teachers get intervention support instead of raw dashboards
- content generation, PPT generation, question generation, grading, and reporting are part of one loop

## Read These Docs In Order

1. [Architecture](./ARCHITECTURE.md)
2. [Connection Map](./CONNECTION_MAP.md)
3. [Feature Audit](./FEATURE_AUDIT.md)
4. [AI LMS Blueprint](./AI_LMS_BLUEPRINT.md)
5. [Student Intelligence Loop](./STUDENT_INTELLIGENCE_LOOP.md)
6. [Student KPI Engine](./STUDENT_KPI_ENGINE.md)
7. [Explanation Style Engine](./EXPLANATION_STYLE_ENGINE.md)
8. [Vision Alignment Audit](./VISION_ALIGNMENT_AUDIT.md)
9. [Image Alignment Checklist](./IMAGE_ALIGNMENT_CHECKLIST.md)
10. [Question Diversity Engine](./QUESTION_DIVERSITY_ENGINE.md)
11. [Authenticity And Originality Engine](./AUTHENTICITY_AND_ORIGINALITY_ENGINE.md)
12. [Teacher Real-Time Dashboard](./TEACHER_REAL_TIME_DASHBOARD.md)
13. [Personalized Course Architecture](./PERSONALIZED_COURSE_ARCHITECTURE.md)
14. [Research Foundation](./RESEARCH_FOUNDATION.md)
15. [Product Strategy And Market Gap](./PRODUCT_STRATEGY_AND_MARKET_GAP.md)
16. [World-Class AI LMS Strategy](./WORLD_CLASS_AI_LMS_STRATEGY.md)
17. [Role Ecosystem And Access Model](./ROLE_ECOSYSTEM_AND_ACCESS_MODEL.md)
18. [Platform And Global Deployment Strategy](./PLATFORM_AND_GLOBAL_DEPLOYMENT_STRATEGY.md)
19. [Feature Requirements Checklist](./FEATURE_REQUIREMENTS_CHECKLIST.md)
20. [Delivery Roadmap And Phases](./DELIVERY_ROADMAP_AND_PHASES.md)
21. [Agent Build Backlog](./AGENT_BUILD_BACKLOG.md)
22. [Agent Execution Guide](./AGENT_EXECUTION_GUIDE.md)

## What Exists Today

The repository already contains real implementations for the following:

- Next.js student, teacher, and admin web surfaces in `frontend/web`
- FastAPI backend in `backend/app`
- authentication, courses, assignments, community, and admin routers
- adaptive assessment session management in `backend/app/assessment`
- tutor orchestration, pathway logic, and RAG support in `backend/ai_engine`
- learner profile and behavior scaffolding in `backend/learner_profile`
- PPT generation in `backend/app/services/ppt_generator.py`
- Flutter/mobile preview apps in `frontend/flutter_app` and `frontend/mobile_preview`

## What This Pass Improved

This documentation pass also stabilized several broken cross-module connections:

- course payloads are normalized so frontend pages can reliably read `name`, `title`, and `code`
- tutor chat responses now return both `response` and `content` for UI compatibility
- the learner profile store now works without the old Mongo-style dependency
- tutor-session deduplication now persists through a local JSON store
- assignment extraction now supports text files and PDFs in addition to images
- the grading worker now correctly handles sync grading plus async submission updates
- `/api/assessment/student/mastery` now works for authenticated students
- student profile responses are flattened for the current frontend shape

## Current System Reality

Lumina is not yet a finished end-to-end AI LMS. It is a strong foundation with multiple real subsystems and several product gaps.

Status by product area:

| Area | Status | Notes |
| --- | --- | --- |
| Authentication | Implemented | JWT flow is working. |
| Course CRUD | Implemented core | Creation, listing, modules, lessons are present. |
| Student learning flow | Partial | Enrollment and completion work; deeper personalization is still uneven. |
| AI tutor | Partial | RAG, guardrails, pathway hooks exist; specialization and robust memory are not finished. |
| Adaptive assessment | Partial | Session flow exists; concept-level mastery and remediation loop need stronger integration. |
| Assignment grading | Partial | Upload and grading exist; rubric depth and calibration need work. |
| Teacher intervention tooling | Partial | Dashboards exist; intervention queues and recommendations are still missing. |
| Course generation | Implemented basic | Outline generation exists. |
| PPT generation | Implemented basic | Presentation generation exists. |
| Personalized learner model | Partial | Foundations exist; needs stronger shared state and analytics. |
| AI automation | Missing as product capability | No unified workflow engine yet. |

## North-Star Loops

### Student loop

Learn -> Ask AI -> Attempt quiz -> Submit assignment -> Update learner profile -> Receive next best action

### Teacher loop

Create content -> Review class signals -> Approve or adjust AI suggestions -> Intervene on specific students -> Measure improvement

### System loop

Collect events -> score mastery and behavior -> generate recommendations -> explain actions -> log outcomes -> improve future decisions

## Intelligence Layers To Keep In Sync

Future work should treat these as one connected system:

- the canonical learner profile and event pipeline
- the KPI engine that turns signals into action-ready scores
- the explanation style engine that adapts tutor communication
- the teacher intervention loop that closes the loop on high-risk learners

If one of these changes without the others, personalization quality will drift quickly.

## Code Areas That Matter Most

| Area | Main paths |
| --- | --- |
| Web app | `frontend/web/src/app`, `frontend/web/src/components`, `frontend/web/src/lib` |
| API layer | `backend/app/main.py`, `backend/app/routers` |
| Stores and persistence | `backend/app/store`, `backend/app/database` |
| Assessment engine | `backend/app/assessment` |
| Tutor and AI engine | `backend/ai_engine` |
| Learner profile | `backend/learner_profile` |
| Pathway agent | `backend/app/pathway`, `backend/ai_engine/swarm/pathway.py` |
| Background work | `backend/app/worker.py` |

## Immediate Build Priorities

1. Create a single learner-profile service that becomes the source of truth for tutor, assessment, assignment, and teacher insight decisions.
2. Turn adaptive assessment from session-level difficulty tracking into concept-level remediation planning.
3. Add teacher intervention workflows: at-risk queue, misconception summaries, and suggested next action.
4. Upgrade assignment grading from similarity scoring to rubric-aware grading plus confidence estimation.
5. Add subject-specialized tutor modes with curriculum constraints, not one general tutor prompt for everything.
6. Build workflow automation for course setup, weekly reports, remediation plans, and class summaries.
