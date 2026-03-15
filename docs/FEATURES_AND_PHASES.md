# Lumina — Complete Features & Phases Roadmap

> **Author:** Chepuri Hari Kiran
> **Last Updated:** March 2026
> **Version:** 1.0.0
> **Status:** Living Document — updated with every major release

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Core Architecture](#2-core-architecture)
3. [Feature Inventory — Current State](#3-feature-inventory--current-state)
4. [AI Agent System](#4-ai-agent-system)
5. [Phase 0 — Stabilize Core](#5-phase-0--stabilize-core)
6. [Phase 1 — Unify Learner State](#6-phase-1--unify-learner-state)
7. [Phase 2 — Adaptive Assessment Engine](#7-phase-2--adaptive-assessment-engine)
8. [Phase 3 — Teacher Intervention System](#8-phase-3--teacher-intervention-system)
9. [Phase 4 — Specialized AI Tutor](#9-phase-4--specialized-ai-tutor)
10. [Phase 5 — Generation Studio](#10-phase-5--generation-studio)
11. [Phase 6 — Automation Layer](#11-phase-6--automation-layer)
12. [Phase 7 — Governance & Scale](#12-phase-7--governance--scale)
13. [Handwriting Analysis Module](#13-handwriting-analysis-module)
14. [Cross-Phase Engineering Workstreams](#14-cross-phase-engineering-workstreams)
15. [Release Milestones](#15-release-milestones)
16. [Definition of Done](#16-definition-of-done)

---

## 1. Platform Overview

**Lumina** is a next-generation, self-hosted AI-powered Learning Management System (LMS) that transforms static educational content into intelligent, adaptive learning experiences. Rather than treating education as a content distribution problem, Lumina deploys a **multi-agent AI swarm** that gives every student their own dedicated AI tutor while simultaneously equipping teachers with real-time intelligence to intervene at exactly the right moment.

### Mission

> Democratize high-quality, personalized education by automating the one-to-many teaching problem through intelligent AI agents that adapt to each learner in real-time.

### Strategic Pillars

| Pillar | Description |
|--------|-------------|
| **Intelligence That Compounds** | Every student interaction improves the learner model, the next explanation, the next question, and the teacher's intervention context |
| **AI That Amplifies Humans** | Reduces teacher cognitive load without replacing teacher judgment |
| **Privacy-First Architecture** | Self-hosted, FERPA/GDPR/COPPA-compliant, local LLM inference support |
| **Radical Accessibility** | Multilingual, offline-first, low-bandwidth ready |
| **Ecosystem Platform** | Supports students, teachers, parents, mentors, admins, and support staff |

### Core Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend Web | Next.js 15, React 19, TypeScript, Tailwind CSS |
| Backend API | FastAPI (Python), async/await, JWT auth |
| Database | Supabase (PostgreSQL), ChromaDB (vector), local JSON fallback |
| AI Models | Google Gemini API, Ollama (local LLM), TrOCR (handwriting OCR) |
| Task Queue | Celery + APScheduler for async jobs |
| Mobile | Flutter (in progress) |
| Handwriting | Microsoft TrOCR, Tesseract OCR, Gemini Vision |

---

## 2. Core Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     Browser / Mobile                          │
│          Next.js 15 Web App  |  Flutter (planned)            │
└─────────────────────┬────────────────────────────────────────┘
                      │  REST / WebSocket
                      ▼
┌──────────────────────────────────────────────────────────────┐
│                FastAPI Backend (Port 8000)                    │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌──────────────┐  │
│  │  Auth    │ │ Courses  │ │ Students  │ │  Teachers    │  │
│  │  (JWT)   │ │  CRUD    │ │ Progress  │ │  Dashboard   │  │
│  └──────────┘ └──────────┘ └───────────┘ └──────────────┘  │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌──────────────┐  │
│  │Assessment│ │ AI Tutor │ │ Grading   │ │  Automation  │  │
│  │  Engine  │ │  (RAG)   │ │ (OCR+AI)  │ │   Layer      │  │
│  └──────────┘ └──────────┘ └───────────┘ └──────────────┘  │
└──────────────────────────┬───────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌──────────────┐  ┌───────────────┐  ┌──────────────────┐
│  Supabase    │  │   ChromaDB    │  │  Gemini / Ollama  │
│ (PostgreSQL) │  │  (Vectors)    │  │  (LLM Provider)  │
└──────────────┘  └───────────────┘  └──────────────────┘
```

### AI Agent Swarm (MCP-coordinated)

```
                    ┌──────────────────┐
                    │   Orchestrator   │
                    │  (MCP Host)      │
                    └────────┬─────────┘
          ┌─────────┬────────┼────────┬─────────┐
          ▼         ▼        ▼        ▼         ▼
      ┌───────┐ ┌────────┐ ┌────┐ ┌────────┐ ┌────────┐
      │ Tutor │ │Pathway │ │ AS │ │ Inter- │ │Guard-  │
      │ Agent │ │ Agent  │ │SESS│ │vention │ │ ian    │
      └───────┘ └────────┘ └────┘ └────────┘ └────────┘
      Assessment Agent ─────────────────────────────────^
```

---

## 3. Feature Inventory — Current State

### ✅ Implemented & Working

| Feature Area | Details |
|---|---|
| **Authentication** | JWT login, role-based routing (student / teacher / admin), 8-day expiry |
| **Course Management** | Create, update, module/lesson structure, publish, enrollment |
| **Student Dashboard** | Progress tracking, streak display, enrolled courses, badges |
| **AI Tutor** | RAG-powered responses, Gemini + Ollama support, guardrails, pathway hooks |
| **Adaptive Assessment** | Session manager, adaptive next-question logic, submit & report |
| **Assignment Grading** | Upload, OCR text extraction (Tesseract), AI semantic grading |
| **Handwriting OCR** | Upload pipeline, Tesseract + Gemini Vision analysis |
| **AI Course Generator** | Topic-based course outline generation |
| **AI PPT Generator** | Lesson-to-PPTX conversion |
| **Automation Jobs** | Class digest, remediation plan, inactivity alerts, progress digest (APScheduler + Celery) |
| **Community** | Messaging routes and basic UI |
| **Teacher Dashboard** | Student list, grade overview, basic course analytics |
| **Admin Panel** | User management, basic logs, system stats |
| **RAG Pipeline** | ChromaDB vector store, document ingestion, semantic retrieval |
| **Knowledge Tracing** | BKT scaffolding in assessment engine |
| **Mastery Tracking** | Session difficulty and mastery read endpoints |
| **Personalization Store** | JSON-based fallback learner preference store |

### ⚠️ Partial / Skeletal

| Feature Area | What Exists | What's Missing |
|---|---|---|
| **Learner Profile** | Schema defined, partial reads | Not a unified single source of truth |
| **AI Pathway Agent** | Basic structure, route logic | Full BKT/DKT integration |
| **Intervention Agent** | Template only | Real risk detection and actionable guidance |
| **Guardian Agent** | Not fully wired | Parent/guardian summaries and escalation |
| **Scoring System** | 4-dimension model designed | Rubric decomposition, confidence scores, teacher override |
| **Concept Graph** | Identified in schema | Not yet used for assessment routing |
| **Mobile (Flutter)** | Basic scaffolding | No offline sync, no production path |
| **Subject Tutor Modes** | Generic tutor only | Math / Science / Coding specialization missing |

### ❌ Not Yet Built

- Voice/audio input for AI tutor
- AR/VR integration hooks
- Peer study groups and peer tutoring
- Parent portal (comprehensive)
- Multilingual UI and multilingual tutor
- Competitive-exam prep mode
- Social annotation
- Flashcard generation engine (complete)
- Spaced repetition scheduler
- Emotional intelligence / behavioral adaptation
- Fine-tuned TrOCR model

---

## 4. AI Agent System

Lumina's intelligence is delivered through six specialized agents coordinated by an Orchestrator via the Model Context Protocol (MCP).

### Orchestrator

Routes all incoming queries to the correct specialist agent. Maintains conversation context and enforces guardrails.

### Tutor Agent (`swarm/tutor.py`)

The primary student-facing agent.

| Capability | Status |
|---|---|
| RAG-powered subject answers | ✅ Live |
| Socratic hint generation | ✅ Live |
| Lesson-context injection | ✅ Live |
| Session memory across messages | ✅ Live |
| Subject specialization (Math/Science/Coding) | ⚠️ Partial |
| Emotional adaptation from behavioral signals | ❌ Planned |
| Voice-input support | ❌ Planned |

### Pathway Agent (`swarm/pathway.py` + `backend/app/pathway`)

Generates personalized learning sequences.

| Capability | Status |
|---|---|
| Basic next-lesson recommendation | ✅ Live |
| BKT-driven mastery-aware routing | ⚠️ Partial |
| DKT-based trajectory prediction | ❌ Planned |
| RL-optimized pathway optimization | ❌ Planned |
| Concept-graph-linked spaced repetition | ❌ Planned |

### Assessment Agent (`swarm/assessment.py`)

Powers the adaptive quiz and evaluation engine.

| Capability | Status |
|---|---|
| Adaptive difficulty selection | ✅ Live |
| Knowledge tracing per session | ✅ Live |
| Weakness detection | ✅ Live |
| Concept-aware question selection | ⚠️ Partial |
| Misconception cluster detection | ❌ Planned |
| Psychometric IRT scoring | ❌ Planned |

### Intervention Agent (`swarm/intervention.py`)

Detects student-at-risk signals and recommends teacher actions.

| Capability | Status |
|---|---|
| Inactivity detection | ✅ Live (via automation) |
| Risk-level classification | ⚠️ Skeletal |
| Recommended teacher action | ❌ Planned |
| Confidence score on recommendation | ❌ Planned |

### Handwriting Agent (`swarm/handwriting_agent.py`)

Processes uploaded handwritten documents.

| Capability | Status |
|---|---|
| PDF upload and OCR extraction | ✅ Live |
| Gemini Vision analysis | ✅ Live |
| Score (0–100) and feedback generation | ✅ Live |
| TrOCR local model support | ✅ Live (ML service) |
| Semantic answer comparison | ✅ Live (sentence-transformers) |

### Guardian Agent (`swarm/guardian.py`)

Parent/guardian-facing summary and escalation agent.

| Capability | Status |
|---|---|
| Weekly student summary | ⚠️ Skeleton |
| Alert escalation to guardians | ❌ Planned |
| Progress snapshot reports | ❌ Planned |

---

## 5. Phase 0 — Stabilize Core

**Goal:** Make the current system internally consistent before deeper product work.

**Status:** In Progress

### Tasks

- Normalize course payloads across backend and frontend
- Normalize student profile response shapes
- Make tutor response schema consistent
- Remove dead storage assumptions
- Harden fallbacks when DB or provider is unavailable
- Verify OCR, grading, and assessment compatibility paths
- Document what is implemented, partial, and missing

### Deliverables

- Backend compatibility fixes
- Documentation baseline (this document, FEATURE_AUDIT.md, VISION_ALIGNMENT_AUDIT.md)
- Stable route contracts

### Acceptance Criteria

- Student, teacher, and tutor pages load from normalized data
- Key backend modules pass syntax checks
- Docs clearly describe the real current state

### Recent Progress (2026-03-14)

- Supabase service-role fallback + local JSON store auto-enabled for tests and dev
- Frontend API base alignment (`NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_API_BASE`)
- Assignment creation now uses authenticated backend route (no more unauthenticated POST)
- Tutor RAG engine mockability fixed for swarm tests

---

## 6. Phase 1 — Unify Learner State

**Goal:** Create one real learner-profile service that becomes the single source of truth for personalization.

**Priority:** Highest

**Status:** Completed (2026-03-14)

### Tasks

- Define canonical learner profile schema
- Define event schema for student learning actions
- Create learner profile store/service
- Ingest events from: lesson completion, quiz result, assessment session, assignment grade, tutor interaction
- Create profile update jobs
- Expose learner-profile read API for tutor, teacher dashboard, and recommendations
- Add explanation profile and KPI snapshot fields
- Add knowledge-graph identifiers and spaced-repetition state fields
- Add offline sync and multilingual preference fields

### Student Profile Object (Target)

```json
{
  "student_id": "uuid",
  "identity": { "name": "...", "grade_level": "..." },
  "goals": [...],
  "enrollments": [...],
  "mastery_map": { "concept_id": 0.0–1.0 },
  "weak_topics": [...],
  "misconception_clusters": [...],
  "preferred_pace": "fast|normal|slow",
  "preferred_modality": "visual|text|audio",
  "language": { "primary": "en", "secondary": ["hi-IN"], "locale": "en-IN" },
  "knowledge_graph_state": { "graph_id": "...", "graph_version": "..." },
  "spaced_repetition_state": { "algorithm": "fsrs", "pending_review_count": 0 },
  "offline_sync_state": { "enabled": false, "last_synced_at": null },
  "tutor_interaction_history": [...],
  "assignment_performance": {...},
  "attention_signals": {...},
  "confidence_score": 0.0–1.0,
  "risk_level": "low|medium|high",
  "recovery_signals": [...]
}
```

### Deliverables

- Learner profile schema (Supabase migration)
- Learner profile persistence layer
- Profile update service
- Profile read endpoints

### Acceptance Criteria

- Single learner profile endpoint returns merged state
- Profile updates when a student completes a lesson, quiz, or assignment
- Tutor and teacher dashboard read from the same source

### Recent Progress (2026-03-14)

- Added knowledge graph, spaced repetition, and offline sync fields to the canonical learner profile schema
- Added multilingual preference fields in learner preferences
- Added tutor/teacher/pathway projections under `/api/personalization/projection/*`
- Added AUTO-005 profile refresh job and manual trigger endpoint
- Grading pipeline now attaches rubric metadata and rubric scorecards when available

---

## 7. Phase 2 — Adaptive Assessment Engine

**Goal:** Strengthen assessment with concept-aware adaptive learning.

**Status:** Completed (2026-03-14)

### Tasks

- Build concept graph for course subjects
- Link questions to concept nodes
- Implement IRT (Item Response Theory) scoring
- Make assessment sessions update the concept-level mastery map
- Add misconception detection from wrong-answer patterns
- Generate remediation plan from assessment evidence
- Add confidence scoring to every assessment output

### Scoring Model (4-Dimension)

```
Score = Correctness × Understanding × Effort × Growth

Dimension       Weight   Measurement
────────────────────────────────────────────────────
Correctness       40%    Answer accuracy
Understanding     30%    Explanation quality
Effort            20%    Attempt count, time invested
Growth            10%    Improvement delta from prior
```

### Deliverables

- Concept graph schema and seed data
- Question-concept linking
- IRT adaptive logic
- Remediation plan generator
- Updated assessment report format

### Acceptance Criteria

- Assessment sessions update the student's concept mastery map
- Remediation plans are generated from assessment evidence
- Wrong-answer patterns are stored and surfaced to teachers

### Recent Progress (2026-03-14)

- Knowledge graph storage added (`knowledge_nodes`) with API to upsert/list nodes
- IRT-based ability updates wired into assessment session flow
- Questions now carry concept metadata across generators
- Misconception tracking aggregated into learner profiles
- Remediation plans generated on low-confidence/low-accuracy sessions

---

## 8. Phase 3 — Teacher Intervention System

**Goal:** Give teachers action-oriented intelligence, not just reports.

**Status:** Completed (2026-03-14)

### Teacher Intervention Object (Target)

```json
{
  "student_id": "uuid",
  "course_id": "uuid",
  "topic": "Quadratic Equations",
  "problem_type": "misconception",
  "evidence": "3 consecutive wrong answers on factoring",
  "recommended_action": "Review factoring with worked examples",
  "confidence": 0.87,
  "urgency": "high",
  "suggested_message": "Hi [student], I noticed you..."
}
```

### Tasks

- Build risk detection pipeline from learner profile signals
- Create intervention queue API
- Build teacher risk dashboard UI (student list with risk badges)
- Add concept heatmap view (class-wide mastery overview)
- Add misconception summary per student
- Add recommended action with confidence label
- Add teacher override for AI-generated next steps
- Build weekly teacher digest automation
- Add student regrouping / support cluster suggestions

### Deliverables

- Risk classification service
- Intervention queue endpoint
- Teacher dashboard with risk queue, heatmap, and actions
- Weekly digest template

### Acceptance Criteria

- Teachers see a prioritized list of students needing intervention
- Each intervention card includes evidence, suggested action, and confidence
- Teachers can mark interventions as reviewed or override them

### Recent Progress (2026-03-14)

- Teacher dashboard now includes intervention queue, concept heatmap, and support clusters
- Intervention queue supports acknowledge/resolve/override actions
- Misconception summaries are surfaced in teacher-facing views
- Risk badges are driven from canonical learner profile signals

---

## 9. Phase 4 — Specialized AI Tutor

**Goal:** Make the AI tutor subject-aware, learner-aware, and curriculum-constrained.

### Subject Tutor Modes

| Mode | Specialization |
|------|---------------|
| Math Tutor | Step-by-step proofs, equation solving, graph interpretation |
| Science Tutor | Hypothesis formation, experiment design, concept explanation |
| Coding Tutor | Code review, debugging, algorithm design, Socratic hints |
| Language Tutor | Grammar, writing feedback, vocabulary, essay structure |
| General Tutor | Cross-subject scaffolding |

### Tasks

- Add subject-mode routing in orchestrator
- Build subject-specific prompt templates per mode
- Wire tutor to learner profile (mastery map + weak topics)
- Add lesson-awareness (tutor knows which lesson the student is on)
- Add assignment-awareness (tutor can explain current assignment context)
- Add tutor memory across sessions (persistent conversation store)
- Implement explanation effectiveness tracking (did student understand after explanation?)
- Add metacognitive calibration prompts
- Add multimodal input: text, image upload, voice (planned)
- Ensure privacy-preserving behavioral adaptation

### Deliverables

- Subject-mode routing layer
- Subject prompt libraries (math, science, coding, language)
- Tutor-profile integration
- Tutor session persistence store

### Acceptance Criteria

- Math tutor uses step-by-step breakdown for equation questions
- Coding tutor gives hints rather than full solutions
- Tutor reads student's weak topics from learner profile and adapts difficulty
- Tutor memory persists across multiple sessions

### Recent Progress (2026-03-14)

- Added subject-mode routing in the Orchestrator with keyword + context heuristics
- Built subject-specific prompt layers for math, science, coding, and language
- Tutor now ingests lesson + assignment context and prioritizes weak topics
- Added persistent tutor memory store (Supabase when available, local JSON fallback)
- Added metacognitive calibration prompts with confidence rating (1–5)
- Tutor interactions now log strategy + comprehension signal for effectiveness tracking

---

## 10. Phase 5 — Generation Studio

**Goal:** Allow teachers to generate full courses, rubrics, PPTs, and remediation content.

### Generation Capabilities (Target)

| Generator | Input | Output |
|-----------|-------|--------|
| Course Generator | Topic or source document | Full course with modules, lessons, outcomes |
| Question Bank Generator | Concept + difficulty | Diverse question set (MCQ, short-answer, essay) |
| Rubric Generator | Assignment description | Structured rubric with weighted criteria |
| PPT Generator | Lesson content | PPTX presentation with slides and speaker notes |
| Remediation Generator | Assessment/assignment evidence | Targeted practice content for weak topics |
| Flashcard Generator | Lesson text or concept list | Spaced-repetition flashcard deck |

### Tasks

- Build generation orchestration backend (one endpoint per generator)
- Connect generation output to course publishing workflow
- Add curriculum standards alignment metadata to outputs
- Build content-designer review and versioning workflow
- Create generation studio UI for teachers
- Integrate Handwriting Analysis Project as an assignment grading module

### Deliverables

- Generation studio API layer
- Teacher-facing generation UI
- Publish flow from generated content to live course

### Acceptance Criteria

- Teacher generates a course from a topic and it creates a publishable course object
- PPT can be generated from any existing lesson
- Remediation content is generated from assessment evidence and linked back to the student's profile

---

## 11. Phase 6 — Automation Layer

**Goal:** Automate recurring academic workflows so teachers spend time teaching, not administrating.

### Automation Jobs

| Job Name | Trigger | Output |
|----------|---------|--------|
| Class Weekly Digest | Every Monday | Summary of class progress, at-risk students, this week's plan |
| Student Progress Digest | Weekly per student | Individual progress summary sent to student and teacher |
| Post-Assessment Remediation | After every assessment | Remediation plan auto-generated and queued for teacher approval |
| Post-Assignment Improvement | After graded assignment | Improvement suggestions sent to student |
| Inactivity Alert | Student inactive 3+ days | Teacher notified with suggested outreach message |
| Pre-Class PPT Prep | Night before lesson | AI-generated lesson slide deck ready for teacher review |
| Guardian Weekly Summary | Weekly per guardian | Child's progress and any flags sent to parent/guardian |
| Mentor Follow-up Reminder | After mentor session | Next steps reminder to mentor and student |

**Current Status:** Class digest, remediation, inactivity alerts, and progress digest are live. Guardian summaries and pre-class PPT prep are pending.

### Infrastructure

- APScheduler for time-based jobs
- Celery for heavy async tasks
- `automation_job_logs` table for audit trail
- REST API to enable/disable jobs per teacher

### Deliverables

- Complete automation job library (all 8 jobs above)
- Job audit log dashboard for teachers
- Guardian notification pipeline

### Acceptance Criteria

- Teachers can enable or disable any automation
- All automation outputs are reviewable before being sent
- Automations use real learner and course data, not placeholders

---

## 12. Phase 7 — Governance & Scale

**Goal:** Make Lumina safe, explainable, and deployable at institutional scale.

### Tasks

- Add confidence labels to every high-stakes AI output
- Add AI audit logs and export tools (CSV/JSON)
- Build model provider management (switch between Gemini, Ollama, local models)
- Add usage analytics and AI cost visibility dashboard
- Add stronger monitoring and alerting (Prometheus/Grafana hooks)
- Implement background queue health metrics
- Optimize data pipelines and caching
- Define privacy and data-retention rules
- Add differential privacy for aggregate analytics
- Add experimentation framework (A/B testing for interventions)
- Plan federated learning for multi-institution deployments
- Add interoperability for LTI, xAPI, SCORM standards
- Add role ecosystem: parent, mentor, peer tutor, counselor, content designer

### Compliance Targets

| Regulation | Requirement | Status |
|---|---|---|
| FERPA | No student PII shared without consent | ✅ Architecture supports |
| GDPR | Right to erasure, data portability | ⚠️ Partial |
| COPPA | Parental consent for under-13 | ❌ Needs enforcement layer |

### Deliverables

- Governance dashboard (admin-only)
- AI decision audit log viewer
- Model management settings
- Privacy and retention settings
- Observability dashboards

### Acceptance Criteria

- Admin can inspect any AI decision with its confidence and reasoning
- Low-confidence outputs are visually flagged in UI
- System health is fully observable
- Retention and privacy rules are documented and enforced

---

## 13. Handwriting Analysis Module

The **Handwriting Analysis Project** (`Handwriting_Analysis_Project/`) is a standalone prototype module inside Lumina that enables automated handwriting evaluation.

### Architecture

```
Student Browser
    │
    ▼ (PDF Upload)
Next.js 16 App (Port 3000)
    │
    ├──▶ Google Gemini 1.5 Flash
    │    (Vision OCR + Score + Feedback)
    │
    ├──▶ SQLite (Prisma ORM)
    │    (Analysis history per student)
    │
    └──▶ Python FastAPI ML Service (Port 9000)
         ├── Microsoft TrOCR (local handwriting OCR)
         └── SentenceTransformers (semantic scoring)
```

### Capabilities

| Capability | Status |
|---|---|
| PDF handwriting upload | ✅ Live |
| Gemini Vision transcription + score | ✅ Live |
| Score 0–100 with color-coded feedback | ✅ Live |
| Analysis history (SQLite) | ✅ Live |
| Local TrOCR ML service | ✅ Live |
| Semantic answer comparison | ✅ Live |
| Multi-page PDF support | ❌ Planned |
| Integration into main Lumina grading pipeline | 🔜 Phase 5 |

### Models Used

| Model | Purpose |
|-------|---------|
| `gemini-1.5-flash` | Cloud OCR, scoring, feedback generation |
| `microsoft/trocr-base-handwritten` | Local on-device handwriting recognition |
| `all-MiniLM-L6-v2` | Semantic similarity for answer grading |

### Integration Plan (Phase 5)

In Phase 5, this module will be wired into Lumina's main assignment grading pipeline so that:
- Students can submit handwritten assignments directly from their student dashboard
- The AI grades and scores them automatically
- Results appear in the teacher's grading interface with confidence labels
- Analysis history is stored in Supabase alongside other assignment records

Current state:
- The standalone handwriting module stores history in SQLite.
- The main Lumina app uses a JSON fallback store for handwriting artifacts when Supabase is not configured.

---

## 14. Cross-Phase Engineering Workstreams

These workstreams run continuously across all phases.

### Workstream A — Data Model Cleanup

- Standardize naming conventions across all tables and APIs
- Remove duplicate state definitions (student represented in 5+ places → unified profile)
- Build shared schemas for events, scores, and interventions

### Workstream B — Testing

- Add route-level tests for all API endpoints
- Add integration tests for assessment, grading, and tutor pipelines
- Add learner-profile update tests
- Add grading and OCR regression tests
- Add tutor contract tests

### Workstream C — Design System

- Improve UI consistency across student, teacher, and admin surfaces
- Create consistent AI status and confidence components
- Remove stale prototype assumptions from frontend

### Workstream D — Documentation

- Update docs after every major phase completion
- Add Architecture Decision Records (ADRs) for major choices
- Keep this feature matrix current with every release

### Workstream E — Offline-First & Multilingual

- Keep low-bandwidth use cases in scope across all product surfaces
- Preserve multilingual extensibility in tutor, content, and assessment pipelines
- Implement offline lesson caching in Flutter and PWA

### Workstream F — Privacy & Safety

- Review every new signal for necessity and proportionality
- Keep role-based access boundaries current (RLS on all Supabase tables)
- Add explicit human-in-the-loop review for all sensitive AI escalations
- Audit all 17+ tables needing Row Level Security policies

### Workstream G — Experimentation & Evaluation

- Instrument features for treatment-effect measurement
- Compare intervention and explanation strategies on consistent learner traces
- Keep outcome evaluation separate from vanity metrics

### Workstream H — Role Ecosystem Expansion

Design and add these roles as bounded first-class participants:

| Role | Core Workflow |
|------|--------------|
| Parent / Guardian | Weekly progress summaries, alert notifications |
| Mentor | Goal setting, session follow-up, progress commentary |
| Peer Tutor | Student-led study session facilitation |
| Counselor | Escalation recipient for at-risk flags |
| Content Designer | Review and version AI-generated content |
| Researcher | Anonymized analytics export for academic research |
| Alumni | Re-engagement and career pathway features |

---

## 15. Release Milestones

### Milestone A — Personalized Learning Core

- Unified learner profile live
- Assessment sessions write to mastery map
- Tutor reads mastery and adapts responses

### Milestone B — Teacher Action System

- Intervention queue live
- Risk-level detection on every student
- Confidence-aware grading with teacher moderation
- Weekly teacher digest automation active

### Milestone C — AI Teaching Studio

- Course generation produces publishable course objects
- Rubric generation produces structured rubrics
- PPT generation linked to lessons
- Remediation content linked to assessment evidence
- Handwriting grading integrated into main pipeline

### Milestone D — Operational AI LMS

- Automation layer fully active (all 8 jobs)
- Governance layer with AI decision audit logs
- Observability dashboards (Prometheus + Grafana)
- Offline-first caching active
- Multilingual tutor support active
- Privacy-bounded guardian role active

---

## 16. Definition of Done

Lumina is considered a complete AI LMS only when **all** of the following are true:

- [ ] Every student has a persistent, real learner profile
- [ ] Assessments, assignments, tutor sessions, and lesson behavior all update that profile
- [ ] The tutor, question generator, pathway engine, and teacher dashboard all read from the same profile
- [ ] Teachers receive prioritized, explainable, confidence-labeled intervention recommendations
- [ ] Assignment grading is rubric-aware, confidence-aware, and teacher-reviewable
- [ ] Course and PPT generation are attached to curriculum publishing workflows
- [ ] Automation handles all 8 recurring academic operations
- [ ] Governance, auditability, and observability are fully operational
- [ ] System is FERPA, GDPR, and COPPA compliant
- [ ] Offline-first and multilingual support are available
- [ ] Handwriting analysis is wired into the main grading pipeline
- [ ] Guardian and parent roles receive bounded, privacy-safe summaries

---

*This document is the single source of truth for Lumina's feature set and delivery plan.*
*Contact: harikiran1388@gmail.com*
*Repository: https://github.com/harikiran138/lumina-ai-learning*
