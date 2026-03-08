# Delivery Roadmap And Phases

Last updated: 2026-03-08

This is the execution roadmap for turning Lumina from a strong foundation into a complete AI LMS.

The roadmap is written so product, engineering, design, and future AI agents can work from one shared plan.

## 1. Delivery Principles

### Rule 1

Do not build isolated AI features.
Every new feature should connect back to the shared learner profile and teacher intervention loop.

### Rule 2

Prefer working end-to-end loops over broad surface-area expansion.

### Rule 3

Every phase should finish with:

- user-visible value
- backend truth source
- acceptance criteria
- measurable success

## 2. Phase Overview

| Phase | Goal | Outcome |
| --- | --- | --- |
| Phase 0 | Stabilize core | remove broken integrations and normalize system contracts |
| Phase 1 | Unify learner state | one profile per student |
| Phase 2 | Strengthen assessment and scoring | concept-aware adaptive learning |
| Phase 3 | Launch teacher intervention system | action-oriented teacher workflows |
| Phase 4 | Specialize the AI tutor | subject-aware, learner-aware tutoring |
| Phase 5 | Build generation studio | course, quiz, rubric, PPT, remediation generation |
| Phase 6 | Build automation layer | recurring academic workflows |
| Phase 7 | Governance and scale | trust, safety, analytics, performance |

## 3. Phase 0: Stabilize Core

### Objective

Make the current system internally consistent before deeper product work.

### Tasks

- normalize course payloads across backend and frontend
- normalize student profile response shapes
- make tutor response schema consistent
- remove dead storage assumptions
- harden fallbacks when DB or provider is unavailable
- verify OCR, grading, and assessment compatibility paths
- document what is implemented, partial, and missing

### Deliverables

- backend compatibility fixes
- documentation baseline
- stable route contracts

### Success criteria

- student, teacher, and tutor pages can load from normalized data
- key backend modules pass syntax checks
- docs clearly describe the real current state

## 4. Phase 1: Unify Learner State

### Objective

Create one real learner-profile service that becomes the source of truth.

### Tasks

- define learner profile schema
- define event schema for student learning actions
- create learner profile store or service
- ingest events from:
  - lesson completion
  - quiz result
  - assessment session
  - assignment grade
  - tutor interaction
- create profile update jobs
- expose learner-profile read API for tutor, teacher dashboard, and recommendations

### Deliverables

- learner profile schema
- learner profile persistence layer
- profile update service
- profile read endpoints

### Acceptance criteria

- every student has one profile object
- tutor reads from it
- assessment writes to it
- assignments write to it
- teacher views can query it

## 5. Phase 2: Strengthen Assessment And Scoring

### Objective

Turn assessment and scoring into real adaptive intelligence, not only session scoring.

### Tasks

- define concept graph and concept ids
- attach concept metadata to generated questions
- update mastery model after each response
- implement misconception tagging
- upgrade weakness detection
- add question expected-time metadata
- create rubric-aware scoring model for assignments
- add confidence score and teacher review threshold
- generate remediation packs from low scores

### Deliverables

- concept-linked question schema
- updated mastery engine
- rubric-scoring engine
- confidence and review workflows

### Acceptance criteria

- question outputs contain concept ids
- student mastery changes after answering
- assignment reports show rubric sections and confidence
- low-confidence grading requires teacher review

## 6. Phase 3: Teacher Intervention System

### Objective

Make the teacher dashboard operational, not just informative.

### Tasks

- build at-risk student queue
- build weak-topic class heatmap
- build misconception summaries per student
- build recommended-action cards
- build teacher follow-up notes
- build intervention outcome tracking
- build teacher digest generation

### Deliverables

- intervention queue UI
- intervention APIs
- risk scoring engine
- teacher summary reports

### Acceptance criteria

- teacher can see who needs attention first
- each recommendation includes evidence
- teacher can approve, dismiss, or act on recommendation
- intervention outcomes are stored

## 7. Phase 4: AI Tutor Specialization

### Objective

Move from a generic tutor to subject-specialized tutoring.

### Tasks

- define tutor mode registry
- create prompts and scaffolds per subject
- connect tutor to current lesson and mastery state
- create math, science, coding, writing, language modes
- add learning-level adaptation
- add remediation and enrichment modes
- add tutor-generated practice with non-repetition logic

### Deliverables

- tutor specialization system
- specialized prompt library
- lesson-aware tutor context builder

### Acceptance criteria

- tutor behavior changes by subject
- tutor can target weak concepts
- tutor can generate remediation or stretch tasks based on profile

## 8. Phase 5: Generation Studio

### Objective

Make AI generation a serious teacher workflow, not just helper endpoints.

### Tasks

- generate course outlines into full course objects
- generate modules, lessons, quizzes, assignments, rubrics, and PPTs
- add teacher review workflow before publish
- connect generation outputs to course storage
- add assignment-to-remediation course generation
- add cohort-based PPT generation from class weak areas

### Deliverables

- generation studio UI
- generation orchestration backend
- structured publish flow

### Acceptance criteria

- teacher can generate and publish a course from topic or source material
- teacher can generate a PPT from an existing lesson
- teacher can generate remediation content from assessment or assignment evidence

## 9. Phase 6: Automation Layer

### Objective

Automate recurring academic work.

### Tasks

- design automation job model
- create weekly class summary automation
- create student progress digest automation
- create post-assessment remediation automation
- create post-assignment improvement automation
- create pre-class PPT preparation automation
- create inactivity and risk alert automation

### Deliverables

- automation framework
- task templates
- audit logs for automation outputs

### Acceptance criteria

- teachers can enable recurring jobs
- outputs are reviewable
- automations use real learner and course data

## 10. Phase 7: Governance And Scale

### Objective

Make the system safe, explainable, and scalable enough for serious deployment.

### Tasks

- add confidence and explanation to every high-stakes AI output
- add audit logs and export tools
- add provider and model settings
- add usage analytics and cost visibility
- add stronger monitoring and alerting
- add background queue health metrics
- optimize data pipelines and caching
- define privacy and retention rules

### Deliverables

- governance dashboard
- model management settings
- observability dashboards
- exportable AI audit logs

### Acceptance criteria

- admin can inspect AI decisions
- low-confidence outputs are clearly marked
- system health is observable
- retention and privacy settings are documented

## 11. Cross-Phase Engineering Workstreams

These workstreams should continue across multiple phases.

### Workstream A: Data model cleanup

- standardize naming
- remove duplicate state definitions
- build shared schemas

### Workstream B: Testing

- add route tests
- add integration tests
- add learner-profile update tests
- add grading and OCR tests
- add tutor contract tests

### Workstream C: Design system

- improve UI consistency across student, teacher, admin
- remove stale prototype assumptions
- create consistent AI status and confidence components

### Workstream D: Documentation

- update docs after every major phase
- add ADRs for major architectural decisions
- keep feature matrix current

## 12. Recommended Team Execution Order

### If only one team is working

1. Phase 1
2. Phase 2
3. Phase 3
4. Phase 4
5. Phase 5
6. Phase 6
7. Phase 7

### If multiple teams are working

- Team A: learner profile and assessment
- Team B: teacher workflows and analytics
- Team C: tutor specialization and generation studio
- Team D: governance, reliability, and platform

## 13. Release Milestones

### Milestone A

Personalized Learning Core

- unified learner profile
- assessment writes mastery
- tutor reads mastery

### Milestone B

Teacher Action System

- intervention queue
- recommended actions
- confidence-aware grading

### Milestone C

AI Teaching Studio

- course generation
- rubric generation
- PPT generation
- remediation generation

### Milestone D

Operational AI LMS

- automation layer
- governance layer
- observability and scale readiness

## 14. Definition Of Done For The Full Project

Lumina is complete only when all of the following are true:

- every student has a real personal learner profile
- the tutor, assessment engine, assignment engine, and pathway engine all use it
- teachers receive intervention guidance, not only reports
- scoring is rubric-aware and confidence-aware
- content generation is attached to course publishing workflows
- automation handles recurring academic operations
- governance, auditability, and observability are built in
