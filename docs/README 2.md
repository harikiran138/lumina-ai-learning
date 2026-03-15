# Lumina AI Learning Platform — Project Documentation

**Authors:** Chepuri Hari Kiran & Dr. Rayudu Srinivas
**Version:** 2.0 — Enhanced Feature Set
**Last Updated:** March 2026

---

## What is Lumina?

Lumina is a **privacy-first, self-hosted, multi-agent AI Learning Management System** designed to deliver fully personalised, adaptive education at scale. It combines cognitive science (BKT, DKT, RL/PPO), multi-agent AI architecture, and human-in-the-loop verification to make every student's learning journey unique — while keeping teachers in full control.

---

## Documentation Index

| File | Description |
|------|-------------|
| `docs/01-TEACHER-CONTENT-PIPELINE.md` | Textbook upload → course builder → PPT/PDF/assignment generation |
| `docs/02-TEACHER-VERIFIED-AI-TUTOR.md` | Teacher-verified Q&A system, handwritten answer workflow |
| `docs/03-STUDENT-FEATURES.md` | All student-facing features and learning flows |
| `docs/04-ADMIN-FEATURES.md` | Admin dashboard, governance, platform management |
| `docs/05-ROLES-AND-PERMISSIONS.md` | All 10 roles, data access levels, permission matrix |
| `docs/06-IMPLEMENTATION-ROADMAP.md` | 4-phase delivery plan with milestones and tech stack |
| `specs/teacher-upload-pipeline-spec.md` | Technical spec for the content ingestion pipeline |
| `specs/ai-answer-verification-spec.md` | Technical spec for teacher Q&A verification system |
| `specs/handwritten-assignment-spec.md` | Spec for real-paper handwritten assignment workflow |
| `specs/admin-dashboard-spec.md` | Technical spec for admin management features |
| `api-specs/teacher-api.md` | API endpoints for all teacher-facing features |
| `api-specs/student-api.md` | API endpoints for student learning features |
| `database/schema-additions.md` | Database schema additions for new features |

---

## Platform Roles

| Role | Access Level | Primary Function |
|------|-------------|-----------------|
| Super Admin | Full platform | Governance, billing, institution management |
| Institution Admin | Institution-wide | School/college management, teacher onboarding |
| Teacher | Course-level | Content creation, student management, verification |
| Student | Own account | Learning, assignments, AI tutor |
| Parent/Guardian | Child's data | Progress monitoring, communication |
| Mentor/Expert | Mentee data | Career guidance, portfolio review |
| Peer Tutor | Tutee data | AI-coached peer tutoring sessions |
| School Counselor | Aggregate risk signals | Mental health early warning, support |
| Content Creator | Platform content | Curriculum design (no student access) |
| Researcher | Anonymised data | Platform research and analytics |

---

## Core Architecture Modules

```
lumina-ai-learning/
├── Content Ingestion Pipeline (NEW)
│   ├── Textbook/syllabus PDF upload
│   ├── Concept extraction & knowledge graph builder
│   ├── Auto-course scaffolding
│   ├── Lecture PPT generator
│   ├── Lecture PDF generator
│   └── Assignment generator
│
├── Teacher-Verified AI Tutor (NEW)
│   ├── AI answer queue (unverified)
│   ├── Teacher verification interface
│   ├── Approved answer bank
│   └── Handwritten submission workflow
│
├── Student Learning Engine (ENHANCED)
│   ├── BKT + DKT + RL/PPO adaptive core
│   ├── 8-KPI student intelligence profile
│   ├── Explanation style router (8 modes)
│   └── Real-paper assignment submission
│
└── Admin & Governance (NEW)
    ├── Platform health dashboard
    ├── Content moderation console
    ├── AI usage & cost monitoring
    └── Compliance & privacy management
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Backend | FastAPI (Python), Node.js API routes |
| AI / ML | LangGraph (multi-agent), FAISS + BM25 (RAG), PyTorch (DKT) |
| LLMs | Claude Sonnet (tutoring), GPT-5 nano (routine), Phi-4-mini (on-device) |
| Document AI | Google Gemini 1.5 Flash (PDF extraction), Microsoft TrOCR (handwriting) |
| Database | PostgreSQL 16 (pgvector), Redis, Neo4j (knowledge graph), SQLite (dev) |
| Storage | MinIO (self-hosted S3-compatible) |
| Auth | NextAuth.js with role-based access control |

---

## Quick Start for Developers

```bash
# Clone and install
git clone https://github.com/lumina-ai/lumina-ai-learning
cd lumina-ai-learning
npm install

# Start services
docker-compose up -d       # PostgreSQL, Redis, Neo4j, MinIO
npm run dev                # Next.js frontend + API routes
cd ml_service && uvicorn api.server:app --reload --port 9000

# Environment variables
cp .env.example .env.local
# Fill in: DATABASE_URL, GEMINI_API_KEY, ANTHROPIC_API_KEY, REDIS_URL, NEO4J_URI
```
