# Project Overview

> **File:** `00-overview/01-project-overview.md`
> **Related:** [[00-overview/02-glossary]], [[00-overview/03-tech-stack]], [[01-architecture/01-system-architecture]]
> **Last Updated:** 2026-04-15

Lumina LMS is an AI-powered, self-hosted, privacy-first adaptive Learning Management System designed specifically for Indian engineering colleges.

---

## Vision

To deliver fully personalised, adaptive education at scale by combining cognitive science, multi-agent AI, and human-in-the-loop verification — while keeping every byte of institutional data on-premises.

## Problem Statement

Indian engineering colleges face three structural problems that no existing LMS solves simultaneously:

1. **Static content delivery** — Moodle and Canvas deliver files. They do not teach. Students who fall behind have no personalised support.
2. **Unverified AI tutoring** — Generic AI chatbots answer student questions with no teacher oversight, no pedagogical grounding, and no accountability.
3. **No adaptive sequencing** — Course content is fixed. A student who masters a topic still watches the same videos and takes the same quiz as a student who struggles.

Lumina solves all three by combining: a four-agent AI system, a mandatory teacher verification queue, and BKT+DKT knowledge tracing that adapts every student's learning path in real time.

## Core Design Principles

| Principle | What it means in practice |
|---|---|
| **Privacy-first** | Self-hosted, no third-party cloud for student data; MinIO not AWS S3; all LLM calls strip PII |
| **Teacher authority** | No AI answer reaches a student without Teacher APPROVE — the TILA pattern |
| **Institutional scoping** | Every SQL query filters by `institution_id` — enforced at the FastAPI layer |
| **Non-blocking AI** | All LLM calls are background tasks; no synchronous blocking in API handlers |
| **Research-grade ML** | BKT+DKT, PPO, FSRS v5, XGBoost+SHAP — not prompt wrappers |

## What Lumina Is Not

- Not a course marketplace (no Stripe, no public catalog)
- Not a video streaming platform (lectures are uploaded files, not live streams)
- Not a generic chatbot wrapper (four specialised agents with defined responsibilities)
- Not a cloud-first SaaS (self-hosted by design)

## Team

| Role | Person |
|---|---|
| Developer 1 | Hari Kiran |
| Developer 2 | P. Laxmi Ram Charan (Roll: 22NU1A0591) |
| Faculty Guide | Dr. Rayudu Srinivas, Professor and Head of CSE, NSRIT |
| Institution | NSRIT — Nadimpalli Satyanarayana Raju Institute of Technology, Visakhapatnam, India |

## Repository

The project repository is named **busy-bardeen**. It is a monorepo containing the Next.js 15 frontend and the FastAPI backend as separate top-level services, with a shared `/ai-engine` service for LangGraph orchestration.

## Scope — What Is Built

| Module | Status |
|---|---|
| Auth (JWT + Redis sessions) | ✅ Implemented |
| Role hierarchy (11 roles) | ✅ Implemented |
| Course management (CRUD) | ✅ Implemented |
| AI Answer Queue (TILA) | ✅ Implemented |
| Tutor Agent (Claude Sonnet) | ✅ Implemented |
| Guardian Agent (Claude Haiku) | ✅ Implemented |
| Assessment Agent (Gemini) | ✅ Implemented |
| Pathway Agent (PPO) | ✅ Implemented |
| TrOCR handwriting pipeline | ✅ Implemented |
| FSRS v5 spaced repetition | ✅ Implemented |
| BKT+DKT knowledge tracing | ✅ Implemented |
| XGBoost dropout prediction | ✅ Implemented |
| Hybrid RAG (FAISS+BM25+Neo4j) | ✅ Implemented |
| Community module | ✅ Implemented |
| Attendance analytics | ✅ Implemented |
| MLFD video analysis | ✅ Implemented |
| Admin panel | ✅ Implemented |
| Parent portal | ✅ Implemented |
