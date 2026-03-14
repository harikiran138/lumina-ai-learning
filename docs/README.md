# Lumina AI-Powered LMS Documentation

Welcome to the comprehensive documentation for **Lumina**, an AI-powered, self-hosted Learning Management System that revolutionizes personalized education at scale.

## Quick Start

### For Different Audiences

**Architects & Designers**
- Start with: [MASTER.md](MASTER.md)
- Focus on: System Architecture, Technology Stack, Component Design
- Read time: 45-60 minutes

**Backend Developers**
- Start with: [DATA_FLOW.md](DATA_FLOW.md)
- Focus on: API endpoints, data flows, state management, code examples
- Read time: 60-90 minutes

**DevOps/Infrastructure Engineers**
- Start with: [MASTER.md](MASTER.md) → Deployment Architecture section
- Then review: [DATA_FLOW.md](DATA_FLOW.md) → Error Handling & Resilience
- Read time: 40-50 minutes

**Product Managers**
- Start with: [MASTER.md](MASTER.md) → Executive Summary & Problem Statement
- Then review: Advanced Features & Roadmap section
- Read time: 20-30 minutes

## Documentation Structure

### Execution Docs

- [MASTER_GUIDE.md](MASTER_GUIDE.md) - fastest entry point for the real current system
- [STUDENT_INTELLIGENCE_LOOP.md](STUDENT_INTELLIGENCE_LOOP.md) - the end-to-end learner signal loop, canonical state contract, and system boundaries
- [STUDENT_KPI_ENGINE.md](STUDENT_KPI_ENGINE.md) - KPI formulas, thresholds, and shared scoring rules for mastery, risk, engagement, and readiness
- [EXPLANATION_STYLE_ENGINE.md](EXPLANATION_STYLE_ENGINE.md) - how the tutor should adapt explanations, pacing, modality, and scaffolding per learner
- [VISION_ALIGNMENT_AUDIT.md](VISION_ALIGNMENT_AUDIT.md) - claim-by-claim check of the bold architecture vision against what is actually implemented today
- [QUESTION_DIVERSITY_ENGINE.md](QUESTION_DIVERSITY_ENGINE.md) - answer-conditioned multi-format question planning and evidence-driven assessment design
- [AUTHENTICITY_AND_ORIGINALITY_ENGINE.md](AUTHENTICITY_AND_ORIGINALITY_ENGINE.md) - non-punitive copy-paste and originality verification architecture
- [TEACHER_REAL_TIME_DASHBOARD.md](TEACHER_REAL_TIME_DASHBOARD.md) - the teacher control plane, intervention queue, and heatmap design
- [PERSONALIZED_COURSE_ARCHITECTURE.md](PERSONALIZED_COURSE_ARCHITECTURE.md) - blueprint vs learner-projection design for per-student course delivery
- [AGENT_BUILD_BACKLOG.md](AGENT_BUILD_BACKLOG.md) - strategic implementation tasks for future agents building the learner intelligence system
- [PRODUCT_STRATEGY_AND_MARKET_GAP.md](PRODUCT_STRATEGY_AND_MARKET_GAP.md) - problem statement, market gap, positioning, and why Lumina should exist
- [FEATURE_REQUIREMENTS_CHECKLIST.md](FEATURE_REQUIREMENTS_CHECKLIST.md) - complete feature checklist for a full AI LMS
- [DELIVERY_ROADMAP_AND_PHASES.md](DELIVERY_ROADMAP_AND_PHASES.md) - phase-by-phase program roadmap with tasks and acceptance criteria
- [AGENT_EXECUTION_GUIDE.md](AGENT_EXECUTION_GUIDE.md) - instructions for future agents and contributors

### MASTER.md - System Architecture & Design (2,369 lines)
**Comprehensive overview of the entire Lumina system**

- **[Executive Summary](MASTER.md#executive-summary)** - Mission, key statistics, innovation
- **[Problem Statement & Solution](MASTER.md#problem-statement--solution)** - The 1-to-many teaching challenge
- **[System Architecture Overview](MASTER.md#system-architecture-overview)** - Complete topology with diagram
- **[Technology Stack](MASTER.md#technology-stack)** - Backend, frontend, AI/ML, deployment tech
- **[Component Connectivity Matrix](MASTER.md#component-connectivity-matrix)** - How every component talks to each other
- **[User Roles & Capabilities](MASTER.md#user-roles--capabilities)** - Student, teacher, admin, super-admin
- **[AI Agent System](MASTER.md#ai-agent-system)** - 7 specialized AI agents
- **[Database Schema](MASTER.md#database-schema)** - 20+ tables with ERD diagram
- **[API Endpoint Catalog](MASTER.md#api-endpoint-catalog)** - 90+ endpoints organized by domain
- **[Frontend Architecture](MASTER.md#frontend-architecture)** - Next.js 15 page structure & components
- **[Student Profiling & Personalization](MASTER.md#student-profiling--personalization)** - Learner models, BKT, DKT
- **[AI-Powered Features](MASTER.md#ai-powered-features)** - 3-tier responses, adaptive paths
- **[Deployment Architecture](MASTER.md#deployment-architecture)** - Docker, Kubernetes configs
- **[Advanced Features & Roadmap](MASTER.md#advanced-features--roadmap)** - Future capabilities
- **[Pain Points Solved](MASTER.md#pain-points-solved)** - Problems Lumina addresses
- **[Integration Points](MASTER.md#integration-points)** - Third-party integrations

### DATA_FLOW.md - Request Processing & Data Flows (2,609 lines)
**Detailed documentation of how data moves through Lumina**

- **[Overview](DATA_FLOW.md#overview)** - Closed-loop learning system principle
- **[Authentication Flow](DATA_FLOW.md#authentication-flow)** - Login → JWT → session → role redirect
- **[Student Learning Flow](DATA_FLOW.md#student-learning-flow)** - Lesson → AI tutor → response
- **[AI Tutor 3-Tier Response Flow](DATA_FLOW.md#ai-tutor-3-tier-response-flow)** - Cache → RAG → LLM
- **[Assessment & Knowledge Tracing Flow](DATA_FLOW.md#assessment--knowledge-tracing-flow)** - Quiz → BKT update
- **[Adaptive Pathway Flow](DATA_FLOW.md#adaptive-pathway-flow)** - Signals → recommendations
- **[Course Generation Flow](DATA_FLOW.md#course-generation-flow)** - PDF → vectors → course
- **[Assignment Grading Flow](DATA_FLOW.md#assignment-grading-flow)** - Submit → grade → notify
- **[PPT Generation Flow](DATA_FLOW.md#ppt-generation-flow)** - Lesson → structure → PPTX
- **[Handwriting Analysis Flow](DATA_FLOW.md#handwriting-analysis-flow)** - Image → OCR → score
- **[Behavior Tracking & Real-Time Adaptation](DATA_FLOW.md#behavior-tracking--real-time-adaptation)** - Continuous monitoring
- **[Master Data Flow Diagram](DATA_FLOW.md#master-data-flow-diagram)** - All systems interconnected
- **[State Management Architecture](DATA_FLOW.md#state-management-architecture)** - 5-layer state hierarchy
- **[Error Handling & Resilience](DATA_FLOW.md#error-handling--resilience)** - Circuit breakers, fallbacks

## Key Concepts

### The Problem Lumina Solves
Traditional LMS platforms fail at personalization. One teacher can meaningfully mentor 20-30 students, but modern education needs to reach thousands. Lumina uses AI to create a "virtual tutor" for each student—handling personalized explanations, adaptive assessment, real-time feedback, and learning path optimization.

### Core Innovation: Multi-Agent AI Swarm
Instead of a single general-purpose AI, Lumina deploys 7 specialized agents:

1. **Orchestrator** - Routes requests to correct agent
2. **Tutor Agent** - Explains concepts via Socratic method
3. **Pathway Agent** - Recommends personalized learning sequences
4. **Assessment Agent** - Generates adaptive quizzes
5. **Intervention Agent** - Detects at-risk students and triggers support
6. **Guardian Agent** - Ensures safety and filters harmful content
7. **Handwriting Agent** - Analyzes handwritten student work

### Knowledge Tracing
Lumina uses advanced ML models to track true understanding:

- **BKT (Bayesian Knowledge Tracing)** - Probabilistic model of skill mastery
- **DKT (Deep Knowledge Tracing)** - LSTM-based sequential learning patterns
- **50+ Behavioral Signals** - Real-time engagement, cognitive load, misconceptions

### 3-Tier Response System
Every student question is answered via:

1. **Cache** (0-50ms) - Check if we've answered this before
2. **RAG** (50-200ms) - Retrieve relevant course materials
3. **LLM** (1-5s) - Generate personalized response via Gemini

## Technology at a Glance

```
┌─────────────────────────────────────────────────────────┐
│  Frontend: Next.js 15, TailwindCSS, IndexedDB Cache     │
├─────────────────────────────────────────────────────────┤
│  Backend: FastAPI (Python), async/await                 │
├─────────────────────────────────────────────────────────┤
│  AI: Gemini API (primary), Ollama (local)               │
├─────────────────────────────────────────────────────────┤
│  Database: PostgreSQL (Supabase), TimescaleDB, Redis    │
├─────────────────────────────────────────────────────────┤
│  Vector Store: ChromaDB (RAG embeddings)                │
├─────────────────────────────────────────────────────────┤
│  Task Queue: Celery (async grading, PPT gen, etc.)      │
├─────────────────────────────────────────────────────────┤
│  Deployment: Docker Compose / Kubernetes               │
└─────────────────────────────────────────────────────────┘
```

## API Overview

### Main Domains

| Domain | Purpose | Key Endpoints |
|--------|---------|---------------|
| `/api/auth/` | Authentication | login, register, me, refresh |
| `/api/tutor/` | AI tutor interactions | chat, generate-course, generate-ppt, ingest |
| `/api/courses/` | Course CRUD | GET/POST/PUT courses, lessons |
| `/api/student/` | Student actions | dashboard, progress, adaptive-pathway |
| `/api/assessment/` | Quizzes | start, submit-response, results |
| `/api/assignments/` | Assignments | create, submit, grade |
| `/api/community/` | Discussion forum | messages, replies, upvotes |
| `/api/admin/` | System admin | users, analytics, moderation |
| `/api/ai/` | Hybrid AI routes | respond, analyze-student |
| `/api/handwriting/` | Handwriting analysis | extract, grade |

**Total: 90+ endpoints documented in DATA_FLOW.md and MASTER.md**

## Database Overview

### Core Tables
- `users` - Student, teacher, admin accounts
- `courses` - Course metadata
- `lessons` - Individual lessons within courses
- `enrollments` - Student → Course relationships
- `progress` - Student progress tracking
- `assignments` - Teacher-created assignments
- `submissions` - Student assignment submissions
- `assessment_sessions` - Quiz/test sessions
- `community_messages` - Forum discussions
- `conversations` - AI tutor conversations
- `ai_logs` - Audit trail of AI interactions

### 20+ tables total with relationships documented in MASTER.md

## Learning Models

### Bayesian Knowledge Tracing (BKT)
Estimates P(L) = probability a student has learned a skill

```
Update rule after response:
P(L_new) = P(L) * P(correct|L) / P(correct)
         + P(T) * (1 - P(L))

Where:
- P(T) = learning rate per attempt (~20%)
- P(L_0) = prior knowledge (~10%)
- P(G) = guess rate (~10%)
- P(S) = slip rate (~10%)
```

### Deep Knowledge Tracing (DKT)
LSTM neural network that learns sequential patterns of mastery

## Real-Time Features

### Cognitive Load Estimation
Monitors mental effort in real-time:
- Response time analysis
- Error pattern detection
- Help-seeking frequency
- Session duration tracking

### Predictive Interventions
Detects at-risk students:
- Low engagement patterns
- High error rates
- Help-seeking overload
- Disengagement signals

## Deployment Options

### Local Development
```bash
docker-compose up
# Backend: http://localhost:8000
# Frontend: http://localhost:3000
# ChromaDB: http://localhost:8001
```

### Production
- Kubernetes manifests included
- Support for AWS, GCP, Azure
- Self-hosted on-premise option
- Scalable to 10,000+ concurrent users

## Development Roadmap

### Phase 2 (In Progress)
- Real-time collaboration features
- Advanced assessment types (proctored exams, oral assessments)
- Flutter mobile app
- Gamification system

### Phase 3 (Planned)
- Parent portal
- Advanced analytics dashboard
- Fine-tuned models per institution
- Multi-language support
- Voice-based tutoring

## Glossary

- **BKT** - Bayesian Knowledge Tracing (probabilistic skill model)
- **DKT** - Deep Knowledge Tracing (LSTM-based learning model)
- **RAG** - Retrieval-Augmented Generation (retrieve docs + generate response)
- **Mastery** - Demonstrated understanding (typically >80% accuracy)
- **Cognitive Load** - Mental effort required for learning task
- **Adaptive Pathway** - Personalized sequence of lessons
- **Misconception** - Incorrect understanding despite evidence
- **Engagement** - Level of active participation and focus
- **Intervention** - Proactive support for struggling students

## FAQ

**Q: Can Lumina be self-hosted?**
A: Yes! Lumina is designed for self-hosted deployment. Docker Compose and Kubernetes configs included.

**Q: What LLMs does Lumina support?**
A: Google Gemini (primary), Ollama (local), with plugin architecture for others.

**Q: How does Lumina handle privacy?**
A: Self-hosted means full data control. No student data leaves your servers.

**Q: Can teachers override AI grades?**
A: Yes, fully! Teachers can review and override any AI-generated grade.

**Q: How many students can Lumina support?**
A: Architecture scales to 10,000+ concurrent users with proper infrastructure.

**Q: What's the learning curve?**
A: Students typically find it intuitive. Teachers need 30 mins to create courses.

## Contributing

Lumina is open-source and welcomes contributions! See the main repository for:
- Code style guidelines
- Pull request process
- Issue templates
- Development setup

## Support & Community

- **Issues & Bug Reports** - GitHub Issues
- **Discussions** - GitHub Discussions
- **Documentation** - This repository
- **Community Forum** - (Coming soon)

## License

Lumina is released under [LICENSE TYPE - TBD]

## Authors & Acknowledgments

Lumina is built by the open-source education community with support from:
- AI researchers specializing in personalized learning
- Educational technologists
- Open-source software engineers

---

**Last Updated:** March 2026
**Version:** 1.0
**Status:** Production-Ready

For the complete technical specification, see [MASTER.md](MASTER.md) and [DATA_FLOW.md](DATA_FLOW.md).
