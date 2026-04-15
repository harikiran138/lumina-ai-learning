# Technology Stack

> **File:** `00-overview/03-tech-stack.md`
> **Related:** [[01-architecture/01-system-architecture]], [[01-architecture/03-infrastructure]]
> **Last Updated:** 2026-04-15

Full technology stack for Lumina LMS with rationale for every choice.

---

## Frontend

| Technology | Version | Role | Rationale |
|---|---|---|---|
| Next.js | 15 | Full-stack React framework | App Router, Server Components, built-in API routes |
| React | 19 | UI library | Concurrent features, use() hook for async |
| TypeScript | 5.x | Type safety | Catches integration errors at compile time |
| Tailwind CSS | 4 | Utility-first styling | Zero-runtime CSS, design-system consistency |
| Radix UI | latest | Accessible primitives | Headless components, full a11y compliance |
| Vitest | latest | Unit testing | Fast, ESM-native, compatible with React 19 |
| React Testing Library | latest | Component testing | Behaviour-first testing |
| Playwright | latest | E2E testing | Cross-browser automated testing |
| MSW (Mock Service Worker) | latest | API mocking in tests | Intercepts fetch at the network level |

## Backend

| Technology | Version | Role | Rationale |
|---|---|---|---|
| FastAPI | 0.111+ | API server | Async-native Python, automatic OpenAPI docs, type-safe with Pydantic |
| Supabase PostgreSQL | 15 | Primary database | 52-table schema, RLS for per-row auth, real-time subscriptions |
| Redis | 7 | Session cache, queue counters | Sub-millisecond reads; JWT session storage; queue count tracking |
| MinIO | latest | Object storage | Self-hosted S3 compatibility; keeps files on-premises |
| FAISS | 1.7+ | Dense vector search | Retrieval leg of hybrid RAG |
| Neo4j | 5.x | Knowledge graph | Prerequisite graph traversal for RAG context enrichment |

**Why FastAPI over NestJS:** Lumina's AI stack is Python-native (PyTorch, scikit-learn, Hugging Face). A Python backend eliminates a cross-language bridge and keeps all ML inference in-process or in the same language ecosystem.

**Why MinIO over AWS S3:** Lumina is designed for self-hosted deployment in Indian engineering colleges. Sending assignment scans and student data to AWS violates the privacy-first design principle. MinIO provides an identical S3 API on local hardware.

## AI / ML Stack

| Technology | Version | Role |
|---|---|---|
| LangGraph | latest | Multi-agent orchestration graph |
| Claude Sonnet 4.6 (`claude-sonnet-4-6`) | — | Tutor Agent — RAG-grounded Socratic tutoring |
| Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) | — | Guardian Agent — safety filtering on all agent outputs |
| Gemini 1.5 Flash | — | Assessment Agent — question generation and rubric creation |
| PyTorch | 2.x | PPO Pathway Agent training and inference |
| Hugging Face Transformers | 4.x | TrOCR model (`microsoft/trocr-large-handwritten`) |
| scikit-learn | 1.x | BKT implementation, XGBoost wrapper |
| XGBoost | 2.x | Dropout prediction classifier |
| SHAP | latest | Explainability for dropout prediction |
| rank_bm25 | latest | BM25 retrieval leg of hybrid RAG |
| sentence-transformers | latest | Embedding generation for FAISS indexing |

## Data Stores Summary

| Store | Type | Data |
|---|---|---|
| Supabase PostgreSQL | Relational | All structured application data (52 tables) |
| Redis 7 | Key-value cache | JWT sessions, queue counters, rate-limit buckets |
| MinIO | Object store | Lecture PDFs, assignment uploads, handwriting scans, generated PPTs |
| FAISS | Vector index | Course content embeddings for semantic retrieval |
| Neo4j | Graph | Knowledge component prerequisite graph |

## Testing Stack

| Tool | Scope |
|---|---|
| Vitest | Unit tests — utilities, hooks, business logic |
| React Testing Library | Component tests — UI behaviour |
| Playwright | E2E tests — full user flows across browsers |
| MSW | Network mocking — intercepts fetch in test environment |

## Key Infrastructure Choices

**No Stripe** — Lumina is not a commercial course marketplace. There is no payment processing.
**No SendGrid / external email** — Email delivery is handled by the institution's own SMTP server configured during onboarding.
**No AWS / GCP / Azure** — All storage is MinIO; all compute is on-premises or college-managed VPS.
**No OpenRouter** — Direct API calls to Anthropic (Claude) and Google (Gemini) using official SDKs.
