# 06 — Implementation Roadmap

**Lumina AI Learning Platform — Enhanced Roadmap**
**Version:** 2.0 (includes Teacher Content Pipeline + Verified AI Tutor)
**Last Updated:** March 2026

---

## Phase Overview

```
Phase 1 (Months 1–6):   Foundation + Core Differentiators
Phase 2 (Months 7–12):  Ecosystem Completion
Phase 3 (Months 13–18): Scale + Intelligence
Phase 4 (Months 19–24): Frontier Features
```

---

## Phase 1: Foundation + Core Differentiators (Months 1–6)

### Priority: Build what no other LMS has

Phase 1 focuses on three things that immediately differentiate Lumina:
1. **Teacher content pipeline** (textbook upload → course in 15 minutes)
2. **Teacher-verified AI tutor** (no answer reaches students without teacher approval)
3. **Handwritten assignment workflow** (physical paper + AI-assisted grading)

### Month 1–2: Infrastructure and Content Pipeline

| Task | Owner | Effort | Status |
|------|-------|--------|--------|
| Set up PostgreSQL + Neo4j + Redis + MinIO | Backend | 2 weeks | Pending |
| PDF extraction service (Gemini 1.5 Flash) | ML | 2 weeks | Pending |
| Course scaffold builder from extracted content | ML + Backend | 2 weeks | Pending |
| Teacher review UI for scaffold approval | Frontend | 1 week | Pending |
| Question bank schema + API | Backend | 1 week | Pending |
| PPT generation service (python-pptx) | Backend | 1 week | Pending |
| PDF generation service (WeasyPrint) | Backend | 1 week | Pending |
| Assignment generator (pulls from Q&A bank) | Backend + ML | 1 week | Pending |

**Deliverable:** Teacher can upload a textbook PDF and receive a structured course with PPT and PDF per lesson within 15 minutes.

### Month 2–3: Teacher-Verified AI Tutor

| Task | Owner | Effort | Status |
|------|-------|--------|--------|
| AI answer queue (holds answers pending review) | Backend | 1 week | Pending |
| Teacher verification panel UI | Frontend | 2 weeks | Pending |
| Student "waiting" state with productive prompts | Frontend | 1 week | Pending |
| Batch verification for similar questions | Backend + Frontend | 1 week | Pending |
| Auto-add verified answers to Q&A bank | Backend | 3 days | Pending |
| Smart queue prioritisation algorithm | ML | 1 week | Pending |
| Push notifications for verification reminders | Backend | 3 days | Pending |

**Deliverable:** Every AI tutor response passes through teacher verification before reaching students.

### Month 3–4: Handwritten Assignment Workflow

| Task | Owner | Effort | Status |
|------|-------|--------|--------|
| Physical submission assignment type | Backend | 1 week | Pending |
| Scan/photo upload interface (mobile-optimised) | Frontend | 1 week | Pending |
| TrOCR handwriting extraction service | ML | 2 weeks | Pending |
| Per-question segmentation from scanned papers | ML | 2 weeks | Pending |
| AI assessment against model answers | ML | 1 week | Pending |
| Teacher marking review interface | Frontend | 1 week | Pending |
| Mark finalisation and student feedback release | Backend + Frontend | 1 week | Pending |
| AI tutor restriction during active assignments | Backend | 3 days | Pending |

**Deliverable:** Teachers can scan handwritten papers, get AI-pre-assessed marks, review and finalise, and return feedback to students digitally.

### Month 5–6: Student Core + Admin Foundation

| Task | Owner | Effort | Status |
|------|-------|--------|--------|
| Adaptive question engine (6 question types) | ML | 2 weeks | Pending |
| BKT + DKT-LSTM knowledge tracing | ML | 2 weeks | Pending |
| Explanation style router (8 modes, PPO) | ML | 2 weeks | Pending |
| FSRS spaced repetition engine | ML | 1 week | Pending |
| Gamification (streaks, XP, tiered leaderboards) | Backend + Frontend | 2 weeks | Pending |
| Student knowledge graph visualisation | Frontend | 1 week | Pending |
| Institution admin dashboard (core) | Frontend | 2 weeks | Pending |
| Teacher management + student risk overview | Frontend | 1 week | Pending |
| AI usage cost monitoring | Backend + Frontend | 1 week | Pending |
| Guardian agent (content moderation) | ML | 1 week | Pending |

**Deliverable:** Complete Phase 1 platform ready for 50–100 student beta.

---

## Phase 2: Ecosystem Completion (Months 7–12)

### Priority: Make every stakeholder's life better

| Feature | Module | Effort |
|---------|--------|--------|
| Parent portal (progress dashboard, alerts, messaging) | New role | 3 weeks |
| Multilingual AI tutoring (AI4Bharat — 10 languages) | Core AI | 3 weeks |
| Offline-first PWA with 7-day content caching | Platform | 2 weeks |
| Predictive dropout model (SHAP explanations) | Analytics | 3 weeks |
| Peer study groups with AI matching | Social | 2 weeks |
| Peer tutoring with AI coaching | Social | 3 weeks |
| School counselor dashboard (early warning) | New role | 2 weeks |
| GNN-enhanced knowledge tracing | Core AI | 3 weeks |
| Emotion-aware adaptation (text signals only) | Core AI | 3 weeks |
| Teacher: misconception cluster map | Analytics | 2 weeks |
| Teacher: teaching strategy effectiveness | Analytics | 2 weeks |
| Attention-based DKT upgrade (AKT variant) | Core AI | 3 weeks |
| Voice-based AI tutoring (Whisper + TTS) | Student | 3 weeks |
| Metacognitive calibration tracker | Assessment | 2 weeks |

**Deliverable:** Full multi-stakeholder platform. Ready for 500+ student deployment.

---

## Phase 3: Scale + Intelligence (Months 13–18)

| Feature | Module | Effort |
|---------|--------|--------|
| Mentor/industry expert portal with AI matching | New role | 3 weeks |
| NDEAR/Sunbird interoperability (India gov't) | Integration | 4 weeks |
| Video lecture analysis for teachers | Teacher | 4 weeks |
| Knowledge graph auto-construction | Core AI | 4 weeks |
| Competitive exam prep module (JEE/NEET) | India | 3 weeks |
| Open Badges 3.0 micro-credentials | Assessment | 2 weeks |
| Content creator / curriculum designer role | New role | 3 weeks |
| Institutional researcher portal | New role | 3 weeks |
| A/B testing framework with causal inference | Analytics | 4 weeks |
| On-device inference (Phi-4-mini) | Infrastructure | 3 weeks |
| Multilingual expansion to 22 Indian languages | Platform | 4 weeks |
| Real-world project marketplace | Student | 4 weeks |

**Deliverable:** Platform ready for 5,000+ students across multiple institutions.

---

## Phase 4: Frontier Features (Months 19–24)

| Feature | Module | Effort |
|---------|--------|--------|
| Federated learning across institutions | Core AI | 6 weeks |
| Alumni network + mentoring portal | New role | 3 weeks |
| AI reading companion (ability-targeted) | Student | 3 weeks |
| AR/VR immersive modules (premium tier) | Student | 8 weeks |
| Synthetic data generation for research | Platform | 3 weeks |
| Multi-institution federated admin | Admin | 4 weeks |

---

## Technology Stack Decision Guide

### When to use which LLM

| Use case | Model | Reason |
|----------|-------|--------|
| Complex Socratic tutoring | Claude Sonnet 4 | Best reasoning, safest for students |
| Routine Q&A (simple definitions) | GPT-5 nano | 35x cheaper, sufficient quality |
| PDF/textbook extraction | Gemini 1.5 Flash | Best document understanding |
| Handwriting OCR | TrOCR (Microsoft) | Purpose-built for handwriting |
| On-device (offline) | Phi-4-mini | Runs on phones, math-capable |
| Regional language | AI4Bharat models | Purpose-built for Indian languages |

### Database responsibilities

| Database | Data stored |
|----------|------------|
| PostgreSQL | Users, courses, assignments, Q&A bank, verification queue, marks |
| Neo4j | Knowledge graph (concepts + prerequisite edges) |
| Redis | Session cache, real-time dashboard data, notification queue |
| MinIO | PDFs, PPTs, scanned assignments, uploaded textbooks |
| SQLite | Development/testing only |

---

## Development Principles

1. **Teacher is always in control.** No AI content reaches students without explicit teacher verification or approval.

2. **Physical first, digital second.** The platform supports and encourages real-paper writing and thinking — digital is the transport and feedback layer, not the learning layer.

3. **Privacy by design.** Student PII is never sent to external AI providers. All prompts are anonymised before leaving the institution's server.

4. **Offline-capable.** Every feature degrades gracefully without internet. Core learning continues offline.

5. **Teacher time savings first.** Every new feature must save at least as much time as it takes to learn to use it. The goal is giving teachers 6+ hours back per week.

6. **Verification scales with trust.** New AI-generated content requires full teacher review. After patterns establish trust, high-confidence, pre-approved topics can auto-release with admin configuration (>0.97 confidence threshold).

---

## Success Metrics by Phase

### Phase 1 success criteria

- Teacher generates complete course from textbook upload in < 15 minutes
- Teacher verification time per answer < 2 minutes average
- Handwritten paper scan-to-grade time < 20 minutes for 35-student class
- Student AI tutor answer wait time < 30 minutes during school hours
- Zero unapproved AI content reaching students

### Phase 2 success criteria

- Parent weekly summary open rate > 60%
- Predictive dropout model fires 30+ days before failure
- Student session duration increase of 20%+ vs Phase 1 baseline
- Peer tutoring sessions: 100+ per week per institution
- At-risk student count decreasing term-over-term

### Phase 3 success criteria

- Platform serving 5,000+ students across 5+ institutions
- JEE/NEET mock test quality rated 4.5+/5 by students
- Government school pilot (NDEAR integration) underway
- Institutional research team using anonymised data pipeline

### Phase 4 success criteria

- Federated learning operating across 3+ institutions
- AR/VR modules in use in 10+ science classrooms
- Alumni mentoring: 50+ sessions/week platform-wide
- Platform cost self-sustaining via institutional subscriptions

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Teachers don't verify promptly | High | High | SLA alerts, batch verification, auto-remind every 2 hours |
| TrOCR accuracy low for messy handwriting | Medium | Medium | Confidence threshold + teacher review for low-confidence papers |
| AI hallucination in student-facing content | Medium | High | Guardian agent + mandatory teacher verification loop |
| PDF extraction fails on scanned textbooks | Medium | Medium | OCR fallback + manual scaffold option |
| LLM API costs exceed budget | Low | Medium | Tiered LLM routing, cost caps per teacher |
| Student tries to bypass physical assignment via AI | High | Medium | AI detects assignment questions + blocks + alerts teacher |
| Data breach of student information | Low | Very High | Self-hosted, no third-party PII sharing, differential privacy |
| Teacher adoption resistance | Medium | High | Strong onboarding, demonstrate time savings in first session |
