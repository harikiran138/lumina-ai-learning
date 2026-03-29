# Lumina AI LMS — Master Task Checklist

**Date:** March 2026
**Status:** Living Document

---

## PHASE 0 — Stabilize Core

**FEATURE NAME:** Core Architecture & Platform Stability  
**STATUS:** Complete  
**REQUIRED COMPONENTS:** Auth Router, Course CRUD, AI Tutor routing, Local JSON stores.  
**DEPENDENCIES:** Supabase (optional fallback), FastAPI, Next.js.  
**TASKS:**  
- [x] Normalize course payloads across backend and frontend
- [x] Normalize student profile response shapes
- [x] Make tutor response schema consistent
- [x] Remove duplicate state definitions between personalization service and legacy learner profile engines
- [x] Implement Row-Level Security (RLS) policies on all 17+ high-sensitivity tables
- [x] Ensure backward compatibility with JSON store fallback for missing DB rows

---

## PHASE 1 — Unify Learner State

**FEATURE NAME:** Unified Learner Profile  
**STATUS:** Complete  
**REQUIRED COMPONENTS:** Learner Profile Service, Event Ingestion (Learning Events).  
**DEPENDENCIES:** `learner_profiles` table, `learning_events` table.  
**TASKS:**  
- [x] Define canonical learner profile schema (`learner_profiles`)
- [x] Create event schema for student learning actions
- [x] Normalize event payloads across all learning surfaces (tutor, assessment, assignments)
- [x] Create profile update jobs
- [x] Add `explanation_profile`, `kpi_snapshot`, and `intervention_history` to schema
- [x] Create canonical learner-profile projection API (`/api/personalization/projection/*`)
- [x] Refactor tutor, assessment, and teacher dashboard to exclusively read from the new Unified Profile

---

## PHASE 2 — Adaptive Assessment Engine

**FEATURE NAME:** Concept-Aware Assessment & KPIs  
**STATUS:** Complete  
**REQUIRED COMPONENTS:** Knowledge Graph, IRT Scoring Engine, Remediation Generator.  
**DEPENDENCIES:** Unified Learner Profile.  
**TASKS:**  
- [x] Build concept graph for course subjects (`knowledge_nodes`)
- [x] Link questions to concept nodes
- [x] Implement IRT (Item Response Theory) scoring
- [x] Build shared KPI calculator module (`engagement`, `persistence`, `readiness`)
- [x] Persist KPI snapshots and expose to tutor, teacher, and pathway flows
- [x] Extend assessment schemas to support diverse question formats (fill-blank, short answer)
- [x] Generate answer-conditioned follow-up questions

---

## PHASE 3 — Teacher Intervention System

**FEATURE NAME:** Actionable Intervention Queue  
**STATUS:** Complete  
**REQUIRED COMPONENTS:** Risk Detection Pipeline, Intervention Agent, Teacher Dashboard.  
**DEPENDENCIES:** Learner Profile, KPI Engine.  
**TASKS:**  
- [x] Build risk detection pipeline from learner profile signals
- [x] Create intervention queue API
- [x] Build teacher risk dashboard UI with concept heatmap
- [x] Track teacher action outcomes (did the intervention help?)
- [x] Add direct teacher action buttons from the dashboard (acknowledge, resolve, override)
- [x] Ensure digest generation uses real learner-state pipeline

---

## PHASE 4 — Specialized AI Tutor

**FEATURE NAME:** Context-Aware Multi-Mode Tutor  
**STATUS:** Complete  
**REQUIRED COMPONENTS:** Tutor Agent, Explanation Planner, Subject Modes.  
**DEPENDENCIES:** RAG Pipeline, Vector Store, Learner Profile.  
**TASKS:**  
- [x] Add subject-mode routing in orchestrator (Math/Science/Coding)
- [x] Build subject-specific prompt templates
- [x] Wire tutor to learner profile mastery map
- [x] Create structured Explanation Planner module (`ExplanationPlan` contract)
- [x] Log explanation plans and explanation effectiveness outcomes
- [x] Add authenticity telemetry in answer flows
- [x] Add supportive authenticity scorer and follow-up probe flow

---

## PHASE 5 — Generation Studio & Grading

**FEATURE NAME:** Automated Content & Rubric Grading  
**STATUS:** Complete  
**REQUIRED COMPONENTS:** Generation APIs, Handwriting Agent, Grading Pipeline.  
**DEPENDENCIES:** ML Service (TrOCR).  
**TASKS:**  
- [x] Build generation orchestration backend for course outlines and PPTs
- [x] PDF upload and local ML OCR grading (standalone)
- [x] Upgrade AI course generation from outline JSON to structured publishable objects in the DB
- [x] Separate course blueprint from learner pathway projection
- [x] Integrate Handwriting Analysis module into the main backend assignment grading pipeline
- [ ] Build content-designer review and versioning workflow

---

## PHASE 6 — Automation Layer

**FEATURE NAME:** Scheduled Academic Workflows  
**STATUS:** Partial  
**REQUIRED COMPONENTS:** APScheduler, Celery, Guardian Agent.  
**DEPENDENCIES:** Teacher intervention configurations.  
**TASKS:**  
- [x] Class Weekly Digest automation
- [x] Student Progress Digest automation
- [x] Post-Assessment Remediation and Inactivity alerts
- [x] Build Guardian Agent summary logic and parent communication flows
- [ ] Pre-Class PPT Prep automation
- [ ] Build offline evaluation harness for student intelligence loops

---

## PHASE 7 — Governance & Scale

**FEATURE NAME:** Privacy, Auditing, & Ecosystem  
**STATUS:** Missing  
**REQUIRED COMPONENTS:** Audit Logs, Offline-first caching, Role Model.  
**DEPENDENCIES:** Supabase Auth, Mobile/Web frontends.  
**TASKS:**  
- [ ] Add audit logging and review gates for high-impact AI actions
- [ ] Expand role and relationship model (Mentor, Peer Tutor, Counselor)
- [ ] Build guardian-facing progress dashboards
- [ ] Add peer tutoring matching logic and AI guardrails
- [ ] Implement offline-first sync and low-bandwidth delivery rules
- [ ] Upgrade RAG to hybrid search with attribution and confidence metadata
- [ ] Add privacy-preserving analytics and federated learning readiness scaffolding
