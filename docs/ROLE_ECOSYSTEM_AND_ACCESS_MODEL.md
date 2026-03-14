# Role Ecosystem And Access Model

Last updated: 2026-03-14

## Purpose

This document defines the expanded human role system for Lumina.

The goal is not to create more account types without purpose.

The goal is to give each stakeholder a useful, privacy-bounded role inside one learning ecosystem.

## Design Principles

1. Every role must have a clear educational function.
2. Access should follow least-privilege rules.
3. High-sensitivity data should remain compartmentalized.
4. AI should support human roles, not blur accountability across them.

## Current Repo Reality

Current schema foundations already support:

- student
- teacher
- admin
- parent

Evidence anchors:

- `docs/DATABASE_SCHEMA.md`
- `docs/COMPLETE_SCHEMA.sql`

Important accuracy note:

- mentor, peer tutor, counselor, content designer, researcher, and alumni roles are strategic target-state additions, not fully implemented runtime roles today

## Role Matrix

| Role | Primary value | Main surfaces | Allowed data | Explicitly restricted data |
| --- | --- | --- | --- | --- |
| Student | learn, practice, reflect | student dashboard, tutor, assessments, courses | own progress, own recommendations, own submissions | other students' records, institutional analytics |
| Teacher | instruct, differentiate, intervene | teacher dashboard, generation studio, grading, messaging | assigned learners, class analytics, intervention evidence | unrelated student data, counselor-only notes |
| Parent or guardian | support learning at home | guardian portal, summaries, messaging, alerts | own child's progress, attendance, assignments, teacher communications | other students, raw tutoring logs, sensitive behavioral telemetry |
| Mentor or industry expert | connect learning to real-world pathways | mentor dashboard, scheduling, portfolio review | mentee goals, portfolio, selected skills evidence | grades, behavioral telemetry, unrelated student data |
| Peer tutor | scaffold another learner | peer support sessions, guided study tools | current topic goals, support prompts, scoped mastery view | private records, full gradebook, counselor notes |
| School counselor | support wellbeing and persistence | counselor risk dashboard, case notes, escalation tools | risk indicators, trend summaries, approved academic flags | detailed tutor transcripts by default, unrelated course internals |
| Content creator or curriculum designer | improve learning materials | blueprint studio, analytics, versioning | aggregate content performance, concept coverage, anonymized outcomes | individual student identity and personal histories |
| Institutional researcher | evaluate outcomes responsibly | research analytics workspace, export tools | anonymized aggregate data, approved research datasets | directly identifying learner records |
| Alumni | mentoring and pathway support | alumni mentorship, portfolio, lifelong learning access | own history, mentee interaction summaries | student private academic records |
| Admin or institution lead | govern platform, security, rollout | admin console, audit, configuration, policy | institution-wide configuration and compliance data | role-restricted content unless policy explicitly grants it |

## Role-Specific Product Requirements

## Parent Or Guardian

Primary features:

- weekly progress summary
- grade or attendance alerts
- teacher messaging
- goal-setting collaboration
- translated communications where possible

Guardrail:

- parent-facing views should show actionable summaries, not raw surveillance streams

## Mentor Or Industry Expert

Primary features:

- AI-assisted mentor matching
- session scheduling
- portfolio review
- skills pathway guidance

Guardrail:

- mentors should see capability and aspiration signals, not private school records

## Peer Tutor

Primary features:

- AI-guided scaffolding prompts
- tutor training modules
- topic-scoped learner goals
- session quality feedback

Guardrail:

- peer tutors should be guided toward explanation and questioning, not answer-giving

## School Counselor

Primary features:

- early-warning dashboard
- case triage
- escalation notes
- coordination with teachers when policy allows

Guardrail:

- wellbeing flags should route to trained humans only

## Content Creator Or Curriculum Designer

Primary features:

- course blueprint authoring
- standards alignment
- version control
- content effectiveness analytics

Guardrail:

- content performance should be aggregate-first and privacy-safe

## Institutional Researcher

Primary features:

- anonymized analytics exports
- equity-gap and retention analysis
- experimentation results
- approved research pipelines

Guardrail:

- this role should sit behind consent, governance, and differential privacy rules

## Alumni

Primary features:

- mentoring availability
- portfolio showcase
- selective lifelong learning access
- contribution tracking

Guardrail:

- alumni participation should never expand access to live student records by default

## Access-Control Rules

## Rule 1: Scope by relationship

A role should only see learner data if a real relationship exists:

- enrollment
- guardianship
- mentorship assignment
- peer tutoring assignment
- counselor caseload

## Rule 2: Separate academic from wellbeing data

Academic support and wellbeing support should intersect only through approved summaries and escalation logic.

## Rule 3: Use aggregate-first analytics

Whenever a role can accomplish its goal with aggregate data, prefer aggregate data over identifiable records.

## Rule 4: Make high-sensitivity access auditable

Access to flags, interventions, and exports should be logged.

## System Implications

To support this role ecosystem, Lumina should add:

- expanded role and capability model
- relationship tables beyond parent-student
- scoped dashboards by role
- role-aware notifications and messaging
- approval and consent flows for sensitive actions

## Recommended Data Relationships

Examples:

- `guardian_student_relationship`
- `mentor_mentee_relationship`
- `peer_tutoring_assignment`
- `counselor_caseload_assignment`
- `content_team_workspace`
- `research_access_grant`

## Implementation Targets In This Repo

| Goal | File targets |
| --- | --- |
| expand role and capability definitions | `backend/app/database/models.py`, auth and user schemas |
| add relationship-aware access policies | routers, service layer, DB policies, `docs/DATABASE_SCHEMA.md` |
| build parent, mentor, counselor, and peer dashboards | `frontend/web/src/app` role surfaces |
| add scoped summary generators and notifications | backend services and worker flows |

## Definition Of Done

The role ecosystem is ready when:

- each role has a clear purpose and UI surface
- access is relationship-scoped and auditable
- sensitive data remains compartmentalized
- new human support roles amplify, rather than confuse, the teacher-student loop

## Companion Docs

- `docs/WORLD_CLASS_AI_LMS_STRATEGY.md`
- `docs/TEACHER_REAL_TIME_DASHBOARD.md`
- `docs/FEATURE_REQUIREMENTS_CHECKLIST.md`
- `docs/PLATFORM_AND_GLOBAL_DEPLOYMENT_STRATEGY.md`
