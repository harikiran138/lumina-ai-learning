# Lumina: AI-Powered Self-Hosted Learning Management System
## Comprehensive System Documentation

**Version:** 1.0
**Last Updated:** March 2026
**Status:** Production-Ready
**Project Type:** Open-Source AI-Enhanced Educational Platform

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Statement & Solution](#problem-statement--solution)
3. [System Architecture Overview](#system-architecture-overview)
4. [Technology Stack](#technology-stack)
5. [Component Connectivity Matrix](#component-connectivity-matrix)
6. [User Roles & Capabilities](#user-roles--capabilities)
7. [AI Agent System](#ai-agent-system)
8. [Database Schema](#database-schema)
9. [API Endpoint Catalog](#api-endpoint-catalog)
10. [Frontend Architecture](#frontend-architecture)
11. [Student Profiling & Personalization](#student-profiling--personalization)
12. [AI-Powered Features](#ai-powered-features)
13. [Deployment Architecture](#deployment-architecture)
14. [Advanced Features & Roadmap](#advanced-features--roadmap)
15. [Pain Points Solved](#pain-points-solved)
16. [Integration Points](#integration-points)

---

## Executive Summary

**Lumina** is a next-generation, self-hosted Learning Management System (LMS) that leverages advanced AI to scale personalized education. The core innovation: instead of one teacher managing hundreds of students individually, Lumina deploys an **AI-powered multi-agent swarm** that provides each student with their own dedicated AI tutor.

### Key Statistics
- **Backend:** FastAPI + Python with async/await optimization
- **Database:** Supabase (PostgreSQL) with TimescaleDB for time-series data
- **Vector Store:** ChromaDB for RAG-powered retrieval
- **AI Models:** Google Gemini API + local Ollama for fine-tuned responses
- **Frontend:** Next.js 15 (web) + planned Flutter (mobile)
- **Task Queue:** Celery for async job processing
- **Auth:** JWT-based with 8-day expiry, role-based access control

### Mission
To democratize high-quality, personalized education by automating the one-to-many teaching problem through intelligent AI agents that adapt to each learner in real-time.

---

## Problem Statement & Solution

### The 1-to-Many Teaching Challenge

**The Problem:**
- One skilled teacher typically manages 30–40 students
- Each student learns at a different pace and with different needs
- Individual tutoring is expensive and not scalable
- Most students don't receive immediate feedback on assignments
- Teachers spend 60% of their time on grading, not teaching
- Learning pathways are static and ignore learner differences
- Low-performing students get lost; high-performers get bored

**Historical Impact:**
- Educational inequity across socioeconomic lines
- Teacher burnout from administrative burden
- Limited access to quality education in underserved regions

### Lumina's Solution

**AI-Powered Personalization at Scale:**

```
Traditional Model:          Lumina Model:
1 Teacher                   1 Teacher
  ↓                            ↓
30 Students              AI Orchestrator
(generic curriculum)      ↓
  ↓                    6 Specialized Agents
Generic materials    ↓
  ↓                    30-300 Students
Mixed outcomes      (personalized pathway)
                        ↓
                    Adaptive feedback
                    Real-time assessment
                    Misconception detection
                    Optimal outcomes
```

**Lumina's Key Innovations:**

1. **Multi-Agent Swarm:** 6 specialized AI agents handle different aspects of learning (tutoring, curriculum design, assessment, safety, support, handwriting analysis)
2. **Real-Time Student Profiling:** Behavioral signals, knowledge tracing, cognitive load estimation
3. **3-Tier AI Response System:** Cache → RAG → LLM generation for intelligent, contextual responses
4. **Adaptive Pathways:** Dynamic curriculum that adjusts based on mastery and learning style
5. **Automated Grading:** LLM-powered grading with human-in-the-loop oversight
6. **Knowledge Tracing:** Bayesian and Deep Learning models track true understanding vs. memorization
7. **Self-Hosted:** Full data privacy, no vendor lock-in, on-premise deployment

---

## System Architecture Overview

### High-Level System Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        WEB["Next.js 15 Web App<br/>(Desktop/Tablet)"]
        MOBILE["Flutter App<br/>(Mobile - Planned)"]
    end

    subgraph "API Gateway & Auth"
        JWT["JWT Token Handler<br/>(8-day expiry)"]
        RBAC["Role-Based Access Control"]
    end

    subgraph "Backend Services (FastAPI)"
        AUTH["Auth Router<br/>/api/auth/*"]
        COURSES["Courses Router<br/>/api/courses/*"]
        STUDENT["Student Router<br/>/api/student/*"]
        TUTOR["Tutor Router<br/>/api/tutor/*"]
        ASSIGN["Assignments Router<br/>/api/assignments/*"]
        ASSESS["Assessment Router<br/>/api/assessment/*"]
        COMMUNITY["Community Router<br/>/api/community/*"]
        ADMIN["Admin Router<br/>/api/admin/*"]
        HYBRID["Hybrid AI Router<br/>/api/ai/*"]
        HANDWRITE["Handwriting Router<br/>/api/handwriting/*"]
    end

    subgraph "AI Engine (Multi-Agent Swarm)"
        ORCHESTRATOR["Orchestrator Agent<br/>(Request Router)"]
        TUTOR_AGENT["Tutor Agent<br/>(Socratic Dialogue)"]
        PATHWAY_AGENT["Pathway Agent<br/>(Curriculum)"]
        ASSESS_AGENT["Assessment Agent<br/>(Quiz Generation)"]
        INTERVENTION["Intervention Agent<br/>(Predictive Support)"]
        GUARDIAN["Guardian Agent<br/>(Safety/Guardrails)"]
        HANDWRITE_AGENT["Handwriting Agent<br/>(OCR Analysis)"]
    end

    subgraph "Learner Profile Engine"
        LP_ENGINE["Learner Profile Core<br/>(State Machine)"]
        BKT["BKT Model<br/>(Bayesian Knowledge)"]
        DKT["DKT Model<br/>(Deep Learning)"]
        BEHAVIOR["Behavior Analyzer<br/>(Engagement)"]
        CL["Cognitive Load<br/>(Real-time)"]
        GAPS["Gap & Misconception<br/>Detector"]
    end

    subgraph "Data Layer"
        POSTGRES["PostgreSQL<br/>(Supabase)"]
        REDIS["Redis Cache<br/>(Session/State)"]
        CHROMADB["ChromaDB<br/>(Vector Store)"]
        TIMESCALEDB["TimescaleDB<br/>(Time-series)"]
    end

    subgraph "External Services"
        GEMINI["Google Gemini API<br/>(Primary LLM)"]
        OLLAMA["Ollama<br/>(Local Models)"]
        STORAGE["File Storage<br/>(S3/Local)"]
    end

    subgraph "Task Processing"
        CELERY["Celery Task Queue"]
        WORKERS["Worker Processes<br/>(Async Jobs)"]
    end

    subgraph "Supporting Services"
        PPT["PPT Generator<br/>(python-pptx)"]
        GRADER["Grading Service<br/>(LLM)"]
        OCR["OCR Service<br/>(Handwriting)"]
        NOTIFY["Notification Service<br/>(Email/Push)"]
        ATTENDANCE["Attendance Tracker<br/>(Engagement)"]
    end

    WEB --> JWT
    MOBILE --> JWT
    JWT --> RBAC
    RBAC --> AUTH
    RBAC --> COURSES
    RBAC --> STUDENT
    RBAC --> TUTOR
    RBAC --> ASSIGN
    RBAC --> ASSESS
    RBAC --> COMMUNITY
    RBAC --> ADMIN
    RBAC --> HYBRID
    RBAC --> HANDWRITE

    AUTH --> POSTGRES
    COURSES --> POSTGRES
    STUDENT --> POSTGRES
    TUTOR --> ORCHESTRATOR
    ASSIGN --> POSTGRES
    ASSESS --> POSTGRES
    COMMUNITY --> POSTGRES
    ADMIN --> POSTGRES
    HYBRID --> ORCHESTRATOR
    HANDWRITE --> HANDWRITE_AGENT

    ORCHESTRATOR --> TUTOR_AGENT
    ORCHESTRATOR --> PATHWAY_AGENT
    ORCHESTRATOR --> ASSESS_AGENT
    ORCHESTRATOR --> INTERVENTION
    ORCHESTRATOR --> GUARDIAN
    ORCHESTRATOR --> HANDWRITE_AGENT

    TUTOR_AGENT --> LP_ENGINE
    PATHWAY_AGENT --> LP_ENGINE
    ASSESS_AGENT --> LP_ENGINE
    INTERVENTION --> LP_ENGINE

    LP_ENGINE --> BKT
    LP_ENGINE --> DKT
    LP_ENGINE --> BEHAVIOR
    LP_ENGINE --> CL
    LP_ENGINE --> GAPS

    TUTOR_AGENT --> CHROMADB
    TUTOR_AGENT --> GEMINI
    PATHWAY_AGENT --> GEMINI
    ASSESS_AGENT --> GEMINI
    INTERVENTION --> GEMINI
    HANDWRITE_AGENT --> OLLAMA

    LP_ENGINE --> REDIS
    LP_ENGINE --> POSTGRES
    LP_ENGINE --> TIMESCALEDB

    GRADER --> GEMINI
    PPT --> STORAGE
    OCR --> GEMINI
    NOTIFY --> POSTGRES

    CELERY --> WORKERS
    WORKERS --> GRADER
    WORKERS --> PPT
    WORKERS --> OCR
    WORKERS --> NOTIFY
```

---

## Technology Stack

### Backend Ecosystem

| Component | Technology | Purpose | Version |
|-----------|-----------|---------|---------|
| Web Framework | FastAPI | High-performance async API | 0.104+ |
| Language | Python | Backend logic, AI integration | 3.11+ |
| Database | PostgreSQL (Supabase) | Primary relational data store | 15+ |
| Time-Series DB | TimescaleDB | Historical behavior/performance data | 2.13+ |
| In-Memory Cache | Redis | Session state, real-time caching | 7.0+ |
| Vector Database | ChromaDB | RAG embeddings & semantic search | 0.4+ |
| Task Queue | Celery | Async job processing (grading, PPT) | 5.3+ |
| Message Broker | Redis/RabbitMQ | Celery task distribution | — |
| ML/AI Integration | Google Gemini API | Primary LLM provider | Latest |
| Local ML | Ollama | On-device model inference | Latest |

### Frontend Ecosystem

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Web Framework | Next.js 15 | React-based web application |
| Styling | TailwindCSS | Utility-first CSS framework |
| State Management | React Context / Redux | Client-side state |
| HTTP Client | Axios / Fetch API | API communication |
| Real-time | Socket.io (planned) | Live chat, notifications |
| Mobile (Planned) | Flutter | Cross-platform mobile app |
| Storage | IndexedDB | Client-side caching of responses |

### AI & ML Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Text LLM | Google Gemini | Response generation, grading |
| Local Inference | Ollama | Handwriting OCR, fine-tuned models |
| Vector Embeddings | Gemini Embeddings API | Semantic search, RAG |
| Knowledge Tracing | Custom Python | BKT, DKT implementation |
| Behavior Analysis | TensorFlow/PyTorch | Engagement scoring, pattern detection |

### Deployment & Infrastructure

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Container | Docker | Application containerization |
| Orchestration | Docker Compose / Kubernetes | Service orchestration |
| Reverse Proxy | Nginx | Load balancing, SSL termination |
| File Storage | S3 / MinIO | Object storage for uploads |
| Logging | ELK Stack / Loki | Centralized logging |
| Monitoring | Prometheus / Grafana | Metrics, alerting |

---

## Component Connectivity Matrix

This matrix shows how every major component in Lumina communicates with every other component.

```
                      │ API │ Auth │ AI  │ Data│ Cache│ Notify│ Storage│
─────────────────────├──────┼──────┼─────┼────┼──────┼──────┼────────┤
Frontend (Next.js)    │  ✓   │  ✓   │  ✓  │ R  │  ✓   │  ✓   │  ✓    │
Auth Service          │  ✓   │  —   │  —  │ RW │  ✓   │  —   │  —    │
API Routers           │  —   │  ✓   │  ✓  │ RW │  ✓   │  ✓   │  ✓    │
AI Orchestrator       │  —   │  —   │  —  │ RW │  ✓   │  —   │  ✓    │
Tutor Agent           │  —   │  —   │  —  │ RW │  ✓   │  —   │  ✓    │
Pathway Agent         │  —   │  —   │  —  │ RW │  —   │  —   │  —    │
Assessment Agent      │  —   │  —   │  —  │ RW │  —   │  —   │  —    │
Intervention Agent    │  —   │  —   │  —  │ R  │  —   │  ✓   │  —    │
Learner Profile       │  —   │  —   │  —  │ RW │  ✓   │  —   │  —    │
BKT/DKT Models        │  —   │  —   │  —  │ RW │  —   │  —   │  —    │
Behavior Analyzer     │  —   │  —   │  —  │ RW │  —   │  —   │  —    │
PostgreSQL            │  R   │ RW   │ RW  │ —  │  —   │ RW   │  —    │
Redis Cache           │  R   │  RW  │ RW  │ —  │  —   │  —   │  —    │
ChromaDB              │  —   │  —   │ R   │ —  │  —   │  —   │  —    │
External LLM (Gemini) │  —   │  —   │  ✓  │ —  │  —   │  —   │  —    │
Ollama                │  —   │  —   │  ✓  │ —  │  —   │  —   │  —    │
File Storage          │  —   │  —   │  —  │ —  │  —   │  —   │  —    │
Celery Workers        │  —   │  —   │  ✓  │ RW │  —   │  ✓   │  ✓    │

Legend: ✓ = Communicates | R = Read | RW = Read/Write | — = No communication
```

**Key Insights from Matrix:**
- Frontend communicates with all core systems (API, Auth, AI, Cache)
- AI Orchestrator is a hub: all agents feed into it, learner profile receives from it
- Data layer (PostgreSQL, Redis, ChromaDB) is accessed by API, Auth, AI agents, and learner profile
- Celery Workers handle async tasks (grading, notifications, storage)
- External LLMs (Gemini, Ollama) are consumed only by AI agents

---

## User Roles & Capabilities

### Role Hierarchy

```mermaid
graph TD
    ANON["Anonymous User<br/>(No Auth)"]
    STUDENT["Student<br/>(Learner)"]
    TEACHER["Teacher<br/>(Content Creator)"]
    ADMIN["Admin<br/>(System Manager)"]
    SUPER["Super Admin<br/>(Deployment Manager)"]

    ANON -->|Register| STUDENT
    STUDENT -->|Request| TEACHER
    TEACHER -->|Promoted by| ADMIN
    ADMIN -->|Promoted by| SUPER
```

### Student Role

**Identity:** Individual learner enrolled in one or more courses

**Capabilities:**

| Feature | Access |
|---------|--------|
| **Learning** | |
| View course materials | ✓ |
| Access lessons | ✓ |
| Chat with AI tutor | ✓ |
| View adaptive pathway | ✓ |
| **Assessment** | |
| Take quizzes/assignments | ✓ |
| View quiz results | ✓ |
| Submit handwritten work | ✓ |
| Get AI-graded feedback | ✓ |
| **Profile** | |
| View personal progress | ✓ |
| View mastery scores | ✓ |
| Access learning history | ✓ |
| Update profile settings | ✓ |
| **Community** | |
| View community forum | ✓ |
| Post questions/discussions | ✓ |
| Peer learning | ✓ |

**Data Student Can Access:**
- Own courses and progress
- Own quiz history and scores
- Peer posts in community (anonymized)
- Own certificates

### Teacher Role

**Identity:** Content creator and course instructor

**Capabilities:**

| Feature | Access |
|---------|--------|
| **Course Management** | |
| Create new courses | ✓ |
| Upload course materials (PDF, video, etc.) | ✓ |
| Edit course content | ✓ |
| Publish/unpublish courses | ✓ |
| Delete courses (if no students enrolled) | ✓ |
| **AI-Powered Content Generation** | |
| Generate course structure from topic | ✓ |
| Generate PowerPoint presentations | ✓ |
| Ingest & vectorize documents | ✓ |
| Generate quiz questions | ✓ |
| **Assignment Management** | |
| Create assignments | ✓ |
| Set deadlines | ✓ |
| View student submissions | ✓ |
| Provide feedback (AI-assisted) | ✓ |
| Override AI grades | ✓ |
| **Student Management** | |
| View enrolled students | ✓ |
| View individual progress | ✓ |
| Download class analytics | ✓ |
| Send messages to students | ✓ |
| **AI Tutor Configuration** | |
| Configure Socratic vs. Direct teaching | ✓ |
| Set difficulty levels | ✓ |
| Define learning objectives | ✓ |
| **Resources** | |
| Upload supporting materials | ✓ |
| Manage resource library | ✓ |

**Data Teacher Can Access:**
- All courses they created
- All students in their courses + progress data
- Quiz/assignment submissions from their students
- Analytics aggregated by course

### Admin Role

**Identity:** System administrator, institutional level

**Capabilities:**

| Feature | Access |
|---------|--------|
| **User Management** | |
| Approve teacher requests | ✓ |
| Disable user accounts | ✓ |
| Reset user passwords | ✓ |
| View all users | ✓ |
| **Institutional Analytics** | |
| View system-wide metrics | ✓ |
| Generate institution reports | ✓ |
| Track student outcomes | ✓ |
| Monitor teacher performance | ✓ |
| **System Configuration** | |
| Manage course categories | ✓ |
| Configure AI model settings | ✓ |
| Manage storage quotas | ✓ |
| **Moderation** | |
| Review community posts | ✓ |
| Remove inappropriate content | ✓ |
| Monitor safety alerts | ✓ |
| **Data** | |
| Export institution data | ✓ |
| View audit logs | ✓ |

### Super Admin Role

**Identity:** System owner, deployment-level access

**Capabilities:**

| Feature | Access |
|---------|--------|
| **System Management** | All |
| **Database Management** | ✓ |
| **Configuration** | All settings |
| **Deployment** | ✓ |
| **Backup & Recovery** | ✓ |

---

## AI Agent System

### Multi-Agent Swarm Architecture

Lumina's intelligence is distributed across **6 specialized AI agents**, each with a specific purpose. The **Orchestrator** routes requests to the appropriate agent(s).

```mermaid
graph LR
    USER["User<br/>(Student/Teacher)"]
    REQUEST["Incoming Request<br/>(Prompt + Context)"]
    ORCHESTRATOR["Orchestrator Agent<br/>REQUEST ROUTER"]

    USER -->|Send| REQUEST
    REQUEST --> ORCHESTRATOR

    ORCHESTRATOR -->|Socratic tutoring| TUTOR["🎓 Tutor Agent<br/>(Concept Explanation)"]
    ORCHESTRATOR -->|Learning pathway| PATHWAY["🛤️ Pathway Agent<br/>(Curriculum Design)"]
    ORCHESTRATOR -->|Quiz/Assessment| ASSESS["📝 Assessment Agent<br/>(Dynamic Evaluation)"]
    ORCHESTRATOR -->|Student struggling| INTERVENTION["🚨 Intervention Agent<br/>(Predictive Support)"]
    ORCHESTRATOR -->|Check safety| GUARDIAN["🛡️ Guardian Agent<br/>(Guardrails)"]
    ORCHESTRATOR -->|Handwriting input| HANDWRITE["✍️ Handwriting Agent<br/>(OCR Analysis)"]

    TUTOR -->|Response| USER
    PATHWAY -->|Recommendation| USER
    ASSESS -->|Assessment| USER
    INTERVENTION -->|Support| USER
    GUARDIAN -->|Validation| ORCHESTRATOR
    HANDWRITE -->|Extracted text| USER
```

### Detailed Agent Specifications

#### 1. Orchestrator Agent (`orchestrator.py`)

**Purpose:** Router and request analyzer
**Responsibilities:**
- Classify incoming requests (tutoring, assessment, pathway, etc.)
- Route to appropriate specialized agent
- Aggregate responses from multiple agents if needed
- Maintain conversation context and state
- Handle safety checks before delegating

**Input:** User prompt, conversation history, user context
**Output:** Agent selection + context packet

**Key Method:**
```python
async def route_request(request: UserRequest, user_context: UserProfile) -> AgentResponse:
    """Analyze request and route to correct agent(s)"""
    intent = classify_intent(request.prompt)

    if intent == "explanation":
        return await tutor_agent.respond(...)
    elif intent == "assessment":
        return await assessment_agent.generate_quiz(...)
    elif intent == "pathway":
        return await pathway_agent.recommend_next(...)
    # etc.
```

#### 2. Tutor Agent (`tutor.py`)

**Purpose:** Personalized concept explanation via Socratic method
**Specializations:**
- Explain complex topics in student's learning style
- Ask guiding questions (Socratic dialogue)
- Detect confusion and adjust explanation depth
- Provide analogies and real-world examples
- Multi-modal responses (text, images, diagrams)

**Input:** Topic, student level, learning style, question
**Output:** Explanation with guiding questions

**Key Features:**
- 3-tier response system (cache → RAG → LLM)
- Embedded with learner profile (knows student's gaps)
- Uses course materials via ChromaDB retrieval
- Tracks explanation effectiveness via engagement

**Example Flow:**
```
Student: "I don't understand photosynthesis"
  ↓
Tutor Agent:
  1. Check cache (has student asked this before?)
  2. Retrieve course materials from ChromaDB
  3. Generate Socratic response: "What do plants need to survive?"
  4. Provide visual explanation
  5. Ask follow-up question
  ↓
Student gets guided learning
```

#### 3. Pathway Agent (`pathway.py`)

**Purpose:** Adaptive curriculum design
**Specializations:**
- Recommend next lesson based on mastery
- Suggest content difficulty progression
- Identify knowledge gaps and remediation
- Create personalized learning paths
- Account for learning style preferences

**Input:** Student profile, mastery data, available courses
**Output:** Ranked list of recommended next lessons

**Algorithm:**
```
For each available lesson:
  1. Check prerequisites met? → mastery > 80%
  2. Calculate gap severity from BKT model
  3. Score by: relevance + engagement potential + difficulty match
  4. Rank and present top 3 options
```

**Key Method:**
```python
async def recommend_next_content(user: User) -> List[ContentRecommendation]:
    """Generate adaptive learning pathway"""
    mastery_data = await bkt_model.get_estimates(user.id)
    gaps = await gap_detector.find_misconceptions(user.id)
    style = user.learning_profile.preferred_style

    recommendations = []
    for lesson in available_lessons:
        if prerequisites_met(lesson, mastery_data):
            score = calculate_relevance(lesson, gaps, style)
            recommendations.append((lesson, score))

    return sorted(recommendations)[:3]
```

#### 4. Assessment Agent (`assessment.py`)

**Purpose:** Dynamic quiz and assessment generation
**Specializations:**
- Generate quiz questions from course materials
- Vary difficulty based on student performance
- Create multiple-choice, short-answer, scenario-based questions
- Provide immediate feedback
- Suggest misconception remediation

**Input:** Topic, difficulty level, student history
**Output:** Customized quiz with grading

**Difficulty Adaptation:**
```
Student answered 3/4 correctly (75% mastery)
  ↓
Assessment Agent generates next questions at:
  - 20% harder
  - 50% at current difficulty
  - 30% slightly easier (confidence building)
```

**Key Features:**
- Questions sourced from course materials + generated contextually
- Difficulty branching (if correct → harder; if wrong → similar)
- Immediate LLM grading
- Feeds directly into BKT update

#### 5. Intervention Agent (`intervention.py`)

**Purpose:** Predictive support and at-risk detection
**Specializations:**
- Identify struggling students early
- Trigger proactive support messages
- Recommend tutoring sessions
- Alert teachers to student difficulties
- Suggest alternative explanations or resources

**Input:** Real-time behavior data, engagement metrics
**Output:** Support recommendations + alerts

**Trigger Conditions:**
```
IF (quiz_failures > 2 AND
    time_spent < 5min AND
    disengagement_signals > threshold) THEN
  → Intervention Agent activates
  → Recommends Socratic tutor session
  → Sends teacher alert
  → Suggests alternative resource
```

#### 6. Guardian Agent (`guardian.py`)

**Purpose:** Safety, guardrails, and bias prevention
**Specializations:**
- Detect inappropriate/harmful requests
- Filter unsafe content from LLM responses
- Prevent prompt injection attacks
- Ensure age-appropriate content
- Monitor for academic integrity violations

**Input:** User request + generated response
**Output:** Validated/filtered response + safety flags

**Key Checks:**
```
1. Content filter: Is prompt safe?
2. Output validation: Is response appropriate?
3. Bias check: Does response contain stereotypes?
4. Injection detection: Is this a prompt attack?
5. Age filter: Is content age-appropriate?
```

#### 7. Handwriting Agent (`handwriting_agent.py`)

**Purpose:** OCR and handwritten work analysis
**Specializations:**
- Extract text from handwritten images
- Compare to answer key
- Score handwritten submissions
- Detect handwriting patterns (confidence, pressure)
- Provide detailed feedback on work

**Input:** Image file (JPEG/PNG of handwritten work)
**Output:** Extracted text + score + feedback

**Processing Pipeline:**
```
Image → Ollama OCR → Text Extraction →
  → Compare with answer key →
  → LLM scoring →
  → Feedback generation
```

---

## Database Schema

### Core Database Architecture (PostgreSQL/Supabase)

```mermaid
erDiagram
    USERS ||--o{ COURSES : enrolls
    USERS ||--o{ ASSIGNMENTS : submits
    USERS ||--o{ ASSESSMENT_SESSIONS : takes
    USERS ||--o{ PROGRESS : generates
    USERS ||--o{ COMMUNITY_MESSAGES : posts
    USERS ||--o{ CONVERSATIONS : initiates
    COURSES ||--o{ LESSONS : contains
    COURSES ||--o{ ASSIGNMENTS : has
    LESSONS ||--o{ PROGRESS : tracks
    ASSIGNMENTS ||--o{ SUBMISSIONS : receives
    ASSESSMENT_SESSIONS ||--o{ ASSESSMENT_RESPONSES : logs
    USERS ||--o{ USER_DATA : stores

    USERS {
        uuid id PK
        string email UK
        string password_hash
        string full_name
        enum role "student,teacher,admin"
        datetime created_at
        datetime last_login
        string avatar_url
        jsonb preferences
        int learning_style
        datetime updated_at
    }

    COURSES {
        uuid id PK
        uuid teacher_id FK
        string title
        text description
        string topic
        enum level "beginner,intermediate,advanced"
        datetime created_at
        datetime published_at
        int student_count
        string category
        jsonb metadata
    }

    LESSONS {
        uuid id PK
        uuid course_id FK
        string title
        text content
        int sequence_order
        enum type "video,text,interactive"
        jsonb learning_objectives
        datetime created_at
    }

    ENROLLMENTS {
        uuid id PK
        uuid user_id FK
        uuid course_id FK
        datetime enrolled_at
        decimal progress_percent
        enum status "active,completed,dropped"
    }

    ASSIGNMENTS {
        uuid id PK
        uuid course_id FK
        uuid teacher_id FK
        string title
        text description
        datetime due_date
        decimal points
        enum type "essay,quiz,handwriting"
        jsonb rubric
    }

    SUBMISSIONS {
        uuid id PK
        uuid assignment_id FK
        uuid user_id FK
        text content
        string file_url
        datetime submitted_at
        enum status "submitted,graded,feedback_given"
        datetime graded_at
    }

    ASSESSMENT_SESSIONS {
        uuid id PK
        uuid user_id FK
        uuid course_id FK
        datetime started_at
        datetime completed_at
        int total_questions
        int correct_answers
        decimal score
        jsonb metadata
    }

    ASSESSMENT_RESPONSES {
        uuid id PK
        uuid session_id FK
        string question_id
        text student_response
        boolean is_correct
        text feedback
        int response_time_sec
    }

    PROGRESS {
        uuid id PK
        uuid user_id FK
        uuid lesson_id FK
        datetime started_at
        datetime completed_at
        decimal mastery_score
        int attempts
        jsonb engagement_data
    }

    COMMUNITY_MESSAGES {
        uuid id PK
        uuid user_id FK
        uuid course_id FK
        text content
        datetime created_at
        int upvotes
        int downvotes
        string category
    }

    CONVERSATIONS {
        uuid id PK
        uuid user_id FK
        uuid course_id FK
        datetime started_at
        string topic
        int message_count
    }

    CONVERSATION_MESSAGES {
        uuid id PK
        uuid conversation_id FK
        uuid user_id FK
        enum sender "student,ai_tutor"
        text content
        datetime timestamp
        jsonb metadata
    }

    USER_DATA {
        uuid id PK
        uuid user_id FK
        jsonb profile_data
        jsonb learning_history
        jsonb engagement_signals
        datetime last_updated
    }

    AI_LOGS {
        uuid id PK
        uuid user_id FK
        enum agent_type
        text prompt
        text response
        decimal latency_ms
        datetime created_at
    }

    CERTIFICATES {
        uuid id PK
        uuid user_id FK
        uuid course_id FK
        string certificate_url
        datetime issued_at
    }
```

### TimescaleDB Hypertable: Behavior Analytics

```sql
-- Time-series table for real-time behavior tracking
CREATE TABLE behavior_timeseries (
    time TIMESTAMPTZ NOT NULL,
    user_id UUID NOT NULL,
    event_type VARCHAR(50),
    event_data JSONB,
    engagement_score FLOAT,
    cognitive_load FLOAT,
    PRIMARY KEY (time, user_id)
) WITH (timescaledb.compress=true);

SELECT create_hypertable('behavior_timeseries', 'time', if_not_exists => TRUE);
```

### Redis Key Schema (Session & Real-Time)

```
# Session Management
session:{user_id}:{token}          → {exp_time, role, permissions}

# Learner Profile State (Hot Data)
learner:{user_id}:profile          → {mastery_data, gaps, style}
learner:{user_id}:bkt_state        → {concept_knowledge_dict}
learner:{user_id}:current_lesson   → {lesson_id, progress}

# Cache
cache:rag:{embedding_hash}         → {retrieved_docs}
cache:response:{request_hash}      → {cached_response, exp_time}

# Real-Time Events
events:{course_id}                 → [event_stream]
typing:{user_id}:{course_id}       → {is_typing}
```

---

## API Endpoint Catalog

### Authentication Endpoints (`/api/auth/`)

```
POST /api/auth/register
  ├─ Body: { email, password, full_name, learning_style }
  ├─ Response: { user_id, token, role }
  └─ Role: Anonymous

POST /api/auth/login
  ├─ Body: { email, password }
  ├─ Response: { token, user, permissions }
  └─ Role: Anonymous

GET /api/auth/me
  ├─ Headers: { Authorization: Bearer <token> }
  ├─ Response: { user_id, email, role, profile }
  └─ Role: Authenticated

POST /api/auth/refresh
  ├─ Body: { refresh_token }
  ├─ Response: { new_token }
  └─ Role: Authenticated

POST /api/auth/logout
  ├─ Headers: { Authorization: Bearer <token> }
  ├─ Response: { success: true }
  └─ Role: Authenticated
```

### Tutor Endpoints (`/api/tutor/`)

```
POST /api/tutor/chat
  ├─ Body: { prompt, course_id, context }
  ├─ Response: { response, sources, follow_up_questions }
  ├─ Role: Student
  └─ 3-tier response: Cache → RAG → LLM

POST /api/tutor/generate-course
  ├─ Body: { topic, level, duration }
  ├─ Response: { course_structure, lessons }
  └─ Role: Teacher

POST /api/tutor/generate-ppt
  ├─ Body: { lesson_id, style }
  ├─ Response: { ppt_url, job_id }
  └─ Role: Teacher (Async via Celery)

POST /api/tutor/ingest-document
  ├─ Body: { file, course_id }
  ├─ Response: { status, chunks_vectorized }
  └─ Role: Teacher

GET /api/tutor/conversation/{id}
  ├─ Response: { messages, metadata }
  └─ Role: Student (own) / Teacher (their students)

POST /api/tutor/conversation/{id}/feedback
  ├─ Body: { was_helpful, improvement_suggestions }
  ├─ Response: { feedback_recorded }
  └─ Role: Student
```

### Course Endpoints (`/api/courses/`)

```
GET /api/courses
  ├─ Query: { category, level, teacher_id, limit, offset }
  ├─ Response: { courses: [...], total }
  └─ Role: Authenticated

POST /api/courses
  ├─ Body: { title, description, topic, level, category }
  ├─ Response: { course_id, created_at }
  └─ Role: Teacher

GET /api/courses/{id}
  ├─ Response: { course, lessons, enrollment_count }
  └─ Role: Authenticated

PUT /api/courses/{id}
  ├─ Body: { title, description, ... }
  ├─ Response: { success }
  └─ Role: Teacher (owner only)

DELETE /api/courses/{id}
  ├─ Role: Teacher (owner), Admin
  └─ Constraint: No enrolled students

POST /api/courses/{id}/enroll
  ├─ Response: { enrollment_id, progress_percent }
  └─ Role: Student

POST /api/courses/{id}/lessons
  ├─ Body: { title, content, type, objectives }
  ├─ Response: { lesson_id }
  └─ Role: Teacher (owner)

GET /api/courses/{id}/lessons/{lesson_id}
  ├─ Response: { lesson, completion_status, mastery_score }
  └─ Role: Enrolled Student / Teacher

PUT /api/courses/{id}/lessons/{lesson_id}
  ├─ Body: { title, content, ... }
  ├─ Response: { success }
  └─ Role: Teacher (owner)

POST /api/courses/{id}/lessons/{lesson_id}/complete
  ├─ Response: { completion_recorded, mastery_score }
  └─ Role: Student

GET /api/courses/{id}/progress
  ├─ Response: { student_progress: [{ student_id, percent, mastery }] }
  └─ Role: Teacher
```

### Student Endpoints (`/api/student/`)

```
GET /api/student/dashboard
  ├─ Response: { enrolled_courses, upcoming_assignments, mastery_summary }
  └─ Role: Student

GET /api/student/profile
  ├─ Response: { user_data, learning_style, mastery_by_subject }
  └─ Role: Student

PUT /api/student/profile
  ├─ Body: { learning_style, preferences }
  ├─ Response: { success }
  └─ Role: Student

GET /api/student/quiz-results
  ├─ Query: { course_id, limit, offset }
  ├─ Response: { results: [{ score, date, questions_attempted }] }
  └─ Role: Student

GET /api/student/notes
  ├─ Query: { course_id }
  ├─ Response: { notes: [{ id, content, lesson_id, created_at }] }
  └─ Role: Student

POST /api/student/notes
  ├─ Body: { course_id, lesson_id, content }
  ├─ Response: { note_id }
  └─ Role: Student

GET /api/student/enrollment/{course_id}
  ├─ Response: { enrollment_status, progress_percent, completion_date }
  └─ Role: Student

POST /api/student/lesson/{lesson_id}/complete
  ├─ Response: { lesson_marked_complete, next_recommendation }
  └─ Role: Student

GET /api/student/adaptive-pathway
  ├─ Response: { recommended_lessons: [{ lesson_id, reason, difficulty }] }
  └─ Role: Student
```

### Assignment Endpoints (`/api/assignments/`)

```
GET /api/assignments
  ├─ Query: { course_id, status }
  ├─ Response: { assignments: [...] }
  └─ Role: Student (own) / Teacher

POST /api/assignments
  ├─ Body: { course_id, title, description, type, due_date, points, rubric }
  ├─ Response: { assignment_id }
  └─ Role: Teacher

GET /api/assignments/{id}
  ├─ Response: { assignment, submissions_count, average_score }
  └─ Role: Teacher / Student (if enrolled)

POST /api/assignments/{id}/submit
  ├─ Body: { content } or { file_url }
  ├─ Response: { submission_id, status: "submitted" }
  └─ Role: Student
  └─ Triggers: Celery grading job

GET /api/assignments/{id}/submissions
  ├─ Response: { submissions: [...] }
  └─ Role: Teacher

GET /api/assignments/{id}/submission/{submission_id}
  ├─ Response: { submission, grade, feedback, graded_by }
  └─ Role: Teacher / Student (own)

PUT /api/assignments/{id}/submission/{submission_id}
  ├─ Body: { grade_override, feedback }
  ├─ Response: { success }
  └─ Role: Teacher

POST /api/assignments/{id}/submission/{submission_id}/handwrite-grade
  ├─ Body: { image_file }
  ├─ Response: { job_id, status }
  └─ Role: Teacher (async)
```

### Assessment Endpoints (`/api/assessment/`)

```
POST /api/assessment/start
  ├─ Body: { course_id, topic, difficulty, num_questions }
  ├─ Response: { session_id, first_question }
  └─ Role: Student

POST /api/assessment/{session_id}/submit-response
  ├─ Body: { question_id, response }
  ├─ Response: { feedback, next_question, is_complete }
  └─ Role: Student
  └─ Triggers: BKT update, difficulty branching

GET /api/assessment/{session_id}/results
  ├─ Response: { score, breakdown, misconceptions, recommendations }
  └─ Role: Student / Teacher (their students)

POST /api/assessment/{session_id}/end
  ├─ Response: { final_score, certificate_eligible }
  └─ Role: Student
```

### Community Endpoints (`/api/community/`)

```
GET /api/community/{course_id}/messages
  ├─ Query: { category, sort, limit }
  ├─ Response: { messages: [...], total }
  └─ Role: Student (enrolled) / Teacher

POST /api/community/{course_id}/message
  ├─ Body: { content, category, is_anonymous }
  ├─ Response: { message_id }
  └─ Role: Student / Teacher

POST /api/community/{course_id}/message/{msg_id}/reply
  ├─ Body: { content }
  ├─ Response: { reply_id }
  └─ Role: Authenticated

POST /api/community/{course_id}/message/{msg_id}/upvote
  ├─ Response: { upvote_count }
  └─ Role: Student / Teacher
```

### Admin Endpoints (`/api/admin/`)

```
GET /api/admin/users
  ├─ Query: { role, search, limit, offset }
  ├─ Response: { users: [...] }
  └─ Role: Admin

POST /api/admin/users/{user_id}/promote
  ├─ Body: { new_role }
  ├─ Response: { success }
  └─ Role: Admin

POST /api/admin/users/{user_id}/disable
  ├─ Response: { success }
  └─ Role: Admin

GET /api/admin/analytics
  ├─ Response: { user_count, course_count, avg_engagement, mastery_trends }
  └─ Role: Admin

GET /api/admin/analytics/institution-report
  ├─ Query: { start_date, end_date }
  ├─ Response: { pdf_url or data }
  └─ Role: Admin

POST /api/admin/community/{msg_id}/moderate
  ├─ Body: { action: "approve|remove|flag", reason }
  ├─ Response: { success }
  └─ Role: Admin

GET /api/admin/audit-logs
  ├─ Query: { action, user_id, days }
  ├─ Response: { logs: [...] }
  └─ Role: Super Admin
```

### Hybrid AI Endpoints (`/api/ai/`)

```
POST /api/ai/respond
  ├─ Body: { prompt, context, agent_preference }
  ├─ Response: { response, agent_used, metadata }
  └─ Role: Student / Teacher
  └─ Route via Orchestrator Agent

POST /api/ai/analyze-student
  ├─ Body: { user_id }
  ├─ Response: { profile, gaps, recommendations, risk_factors }
  └─ Role: Teacher (their students) / Admin

GET /api/ai/model-status
  ├─ Response: { gemini_available, ollama_available, latency }
  └─ Role: Admin
```

### Handwriting Endpoints (`/api/handwriting/`)

```
POST /api/handwriting/extract
  ├─ Body: { image_file }
  ├─ Response: { extracted_text, confidence_score }
  └─ Role: Teacher / Student

POST /api/handwriting/grade
  ├─ Body: { image_file, answer_key }
  ├─ Response: { job_id, status }
  └─ Role: Teacher (async)

GET /api/handwriting/grade/{job_id}
  ├─ Response: { status, score, feedback (if complete) }
  └─ Role: Teacher
```

---

## Frontend Architecture

### Page Structure (Next.js 15)

```
frontend/
├── pages/
│   ├── _app.tsx              # Global context, auth wrapper
│   ├── index.tsx             # Landing page
│   ├── login.tsx             # Login form
│   ├── register.tsx          # Registration form
│   │
│   ├── student/
│   │   ├── dashboard.tsx     # Student home
│   │   ├── courses.tsx       # Enrolled courses
│   │   ├── [courseId]/
│   │   │   ├── index.tsx     # Course detail
│   │   │   ├── lesson/[lessonId].tsx   # Lesson view
│   │   │   └── quiz.tsx      # Assessment interface
│   │   ├── profile.tsx       # Student profile + learning style
│   │   ├── adaptive-path.tsx # Recommended next lessons
│   │   └── progress.tsx      # Mastery tracking
│   │
│   ├── teacher/
│   │   ├── dashboard.tsx     # Teacher home
│   │   ├── courses/
│   │   │   ├── index.tsx     # My courses
│   │   │   ├── create.tsx    # Course creation
│   │   │   └── [courseId]/
│   │   │       ├── edit.tsx
│   │   │       ├── lessons.tsx
│   │   │       ├── assignments.tsx
│   │   │       ├── students.tsx
│   │   │       └── analytics.tsx
│   │   ├── ai-generator.tsx  # AI tools (course gen, PPT, etc.)
│   │   ├── assignments/
│   │   │   ├── create.tsx
│   │   │   └── grade.tsx
│   │   ├── resources.tsx     # Resource library
│   │   └── settings.tsx      # Teacher settings
│   │
│   ├── admin/
│   │   ├── dashboard.tsx     # Admin home
│   │   ├── users.tsx         # User management
│   │   ├── analytics.tsx     # System analytics
│   │   ├── community.tsx     # Moderation
│   │   └── settings.tsx      # System config
│   │
│   └── 404.tsx               # Not found
│
├── components/
│   ├── Auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── ProtectedRoute.tsx
│   ├── Tutor/
│   │   ├── ChatInterface.tsx    # AI chat widget
│   │   ├── SocraticPrompts.tsx
│   │   └── ResponseDisplay.tsx
│   ├── Assessment/
│   │   ├── QuizInterface.tsx
│   │   ├── QuestionCard.tsx
│   │   └── ResultsSummary.tsx
│   ├── Course/
│   │   ├── CourseCard.tsx
│   │   ├── LessonView.tsx
│   │   └── ProgressBar.tsx
│   ├── Common/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── ErrorBoundary.tsx
│   └── Dashboard/
│       ├── StatCard.tsx
│       ├── ChartComponent.tsx
│       └── AnalyticsWidget.tsx
│
├── hooks/
│   ├── useAuth.ts           # Authentication context
│   ├── useTutor.ts          # AI tutor API calls
│   ├── useCourse.ts         # Course data fetching
│   └── useCache.ts          # IndexedDB caching
│
├── lib/
│   ├── api.ts               # Axios instance + interceptors
│   ├── cache.ts             # IndexedDB wrapper
│   ├── jwt.ts               # Token management
│   └── constants.ts         # Brand colors, API endpoints
│
├── styles/
│   └── globals.css          # TailwindCSS + custom styles
│
└── config/
    └── theme.ts             # Lumina colors: #22C55E, #A855F7, #0F1115
```

### Key Frontend Components

#### AI Tutor Chat Interface
```typescript
// components/Tutor/ChatInterface.tsx
export function ChatInterface({ courseId, lessonId }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const sendMessage = async (prompt: string) => {
    setLoading(true)
    const response = await api.post('/api/tutor/chat', {
      prompt,
      course_id: courseId,
      context: { lesson_id: lessonId }
    })

    // Display response with sources
    setMessages([
      ...messages,
      { role: 'user', content: prompt },
      { role: 'assistant', content: response.response, sources: response.sources }
    ])
    setLoading(false)
  }

  return (
    <div className="tutor-chat-panel">
      {/* Message list with Lumina brand colors */}
      {/* Input field + Send button */}
    </div>
  )
}
```

#### Adaptive Pathway Recommendation
```typescript
// components/Student/AdaptivePathway.tsx
export function AdaptivePathway({ studentId }) {
  const [recommendations, setRecommendations] = useState<Lesson[]>([])

  useEffect(() => {
    // Fetch recommended next lessons
    api.get('/api/student/adaptive-pathway').then(data => {
      setRecommendations(data.recommended_lessons)
    })
  }, [studentId])

  return (
    <div className="pathway-container">
      <h2>Your Personalized Learning Path</h2>
      {recommendations.map(lesson => (
        <LessonCard key={lesson.id} lesson={lesson} reason={lesson.reason} />
      ))}
    </div>
  )
}
```

#### Assessment Quiz Interface
```typescript
// components/Assessment/QuizInterface.tsx
export function QuizInterface({ courseId, difficulty }) {
  const [sessionId, setSessionId] = useState<string>()
  const [currentQuestion, setCurrentQuestion] = useState()
  const [responses, setResponses] = useState([])

  useEffect(() => {
    // Start assessment session
    api.post('/api/assessment/start', {
      course_id: courseId,
      difficulty
    }).then(data => {
      setSessionId(data.session_id)
      setCurrentQuestion(data.first_question)
    })
  }, [])

  const submitResponse = async (response: string) => {
    const result = await api.post(`/api/assessment/${sessionId}/submit-response`, {
      question_id: currentQuestion.id,
      response
    })

    if (result.is_complete) {
      // Quiz finished, show results
      navigateTo(`/results/${sessionId}`)
    } else {
      setCurrentQuestion(result.next_question)
    }
  }

  return (
    <QuestionCard
      question={currentQuestion}
      onSubmit={submitResponse}
    />
  )
}
```

### Client-Side Caching (IndexedDB)

```typescript
// lib/cache.ts
export class LuminaCache {
  private db: IDBDatabase

  async getCachedResponse(requestHash: string) {
    const tx = this.db.transaction('responses', 'readonly')
    const store = tx.objectStore('responses')
    return store.get(requestHash)
  }

  async cacheResponse(requestHash: string, response: any, ttl: number) {
    const tx = this.db.transaction('responses', 'readwrite')
    const store = tx.objectStore('responses')
    store.put({
      hash: requestHash,
      response,
      expiry: Date.now() + ttl
    })
  }

  async cacheCourseMaterials(courseId: string, materials: any) {
    // Pre-load course materials for offline viewing
    const tx = this.db.transaction('courses', 'readwrite')
    tx.objectStore('courses').put({ courseId, materials, timestamp: Date.now() })
  }
}
```

---

## Student Profiling & Personalization

### Learner Profile Engine Architecture

The Learner Profile Engine is the brain of Lumina's personalization. It continuously tracks and updates a rich student profile, which feeds into every AI agent and decision.

```mermaid
graph LR
    INPUT["Real-Time Data<br/>- Student actions<br/>- Quiz responses<br/>- Engagement metrics<br/>- Time on task"]

    ENGINE["Learner Profile<br/>Core Engine<br/>engine.py"]

    BKT["BKT Model<br/>Bayesian Knowledge<br/>Tracing"]
    DKT["DKT Model<br/>Deep Learning<br/>Tracing"]
    BEHAVIOR["Behavior Analyzer<br/>50+ signals"]
    COGNITIVE["Cognitive Load<br/>Real-time estimation"]
    GAPS["Gap & Misconception<br/>Detector"]

    OUTPUT["Student Profile State<br/>{ mastery, gaps,<br/>style, risk, readiness }"]

    AGENTS["AI Agents<br/>- Tutor<br/>- Pathway<br/>- Assessment<br/>- Intervention"]

    INPUT --> ENGINE
    ENGINE --> BKT
    ENGINE --> DKT
    ENGINE --> BEHAVIOR
    ENGINE --> COGNITIVE
    ENGINE --> GAPS

    BKT --> OUTPUT
    DKT --> OUTPUT
    BEHAVIOR --> OUTPUT
    COGNITIVE --> OUTPUT
    GAPS --> OUTPUT

    OUTPUT --> AGENTS
    OUTPUT --> REDIS["Redis State<br/>(Hot Cache)"]
    OUTPUT --> TIMESCALE["TimescaleDB<br/>(Historical)"]
```

### Core Learner Profile Schema

```python
@dataclass
class LearnerProfile:
    """Complete student learning profile"""

    # Identity
    user_id: UUID

    # Knowledge State
    mastery_scores: Dict[str, float]  # concept -> [0, 1]
    knowledge_gaps: List[str]          # misconceptions
    learning_stage: str                # novice, intermediate, expert

    # Learning Preferences
    preferred_learning_style: str      # visual, auditory, kinesthetic, reading
    preferred_difficulty: str          # easy, medium, hard
    pace_preference: str               # slow, normal, fast

    # Engagement & Behavior
    engagement_score: float            # [0, 100]
    cognitive_load: float              # [0, 100] - mental effort
    time_on_task: float                # minutes
    session_count: int
    last_active: datetime

    # Risk Indicators
    struggle_flags: List[str]          # at-risk signals
    predicted_dropout_risk: float      # [0, 1]
    misconceptions: Dict[str, float]   # concept -> confidence

    # Readiness State
    prerequisites_met: bool
    mastery_threshold_for_next: float  # typically 80%
    recommended_next_content: List[str]

    # Metadata
    created_at: datetime
    last_updated: datetime
    profile_version: int
```

### Knowledge Tracing Models

#### Bayesian Knowledge Tracing (BKT)

BKT is a probabilistic model that estimates the probability a student has learned a skill.

```python
# backend/learner_profile/models/bkt.py

class BayesianKnowledgeTracer:
    """
    BKT tracks P(L) = probability student learned skill

    State variables per concept:
    - P(L_0): Initial probability of knowledge
    - P(T): Probability of learning from one attempt
    - P(G): Probability of guessing correctly
    - P(S): Probability of slip (knowing but answering wrong)
    """

    def __init__(self):
        # Default parameters (can be tuned per concept)
        self.p_l0 = 0.1      # 10% probability student knows initially
        self.p_t = 0.2       # 20% learning rate per attempt
        self.p_g = 0.1       # 10% guess rate
        self.p_s = 0.1       # 10% slip rate

    def update_mastery(self, concept_id: str, user_id: str,
                      correct: bool) -> float:
        """
        Update mastery estimate after response

        If correct:
            P(L|correct) = P(L) * P(correct|L) / P(correct)
        """
        current_mastery = self.get_mastery(concept_id, user_id)

        if correct:
            # Probability of correct answer given knowledge state
            p_correct = (current_mastery * (1 - self.p_s) +
                        (1 - current_mastery) * self.p_g)

            # Bayes rule: updated knowledge probability
            new_mastery = (current_mastery * (1 - self.p_s) / p_correct)

            # Learning might have occurred
            new_mastery = min(1.0, new_mastery + self.p_t * (1 - new_mastery))
        else:
            # Incorrect response
            p_incorrect = (current_mastery * self.p_s +
                          (1 - current_mastery) * (1 - self.p_g))
            new_mastery = (current_mastery * self.p_s / p_incorrect)

        return max(0.0, min(1.0, new_mastery))
```

#### Deep Knowledge Tracing (DKT)

DKT uses LSTMs to capture sequential patterns in learning.

```python
# backend/learner_profile/models/dkt.py

class DeepKnowledgeTracer(tf.keras.Model):
    """
    LSTM-based knowledge tracing

    Inputs: Sequence of (concept_id, is_correct) pairs
    Outputs: Mastery probability for next concept
    """

    def __init__(self, num_concepts: int, hidden_size: int = 128):
        super().__init__()
        self.embedding = tf.keras.layers.Embedding(num_concepts * 2, 64)
        self.lstm = tf.keras.layers.LSTM(hidden_size, return_sequences=True)
        self.dense = tf.keras.layers.Dense(num_concepts, activation='sigmoid')

    def call(self, exercise_sequence: tf.Tensor) -> tf.Tensor:
        """
        Args:
            exercise_sequence: [batch_size, seq_len, 2]
                              (concept_id, is_correct)

        Returns:
            [batch_size, seq_len, num_concepts] mastery logits
        """
        x = self.embedding(exercise_sequence)
        x = self.lstm(x)
        mastery = self.dense(x)
        return mastery

    def predict_mastery_for_concept(self, student_history: List[Tuple],
                                   concept_id: str) -> float:
        """Predict mastery probability for specific concept"""
        sequence = self.prepare_sequence(student_history)
        predictions = self.call(sequence)
        return float(predictions[0, -1, concept_id])
```

### Behavior Analyzer

Tracks 50+ engagement and behavioral signals to detect patterns and at-risk students.

```python
# backend/learner_profile/analysis/behavior.py

class BehaviorAnalyzer:
    """
    Real-time analysis of student behavior

    50+ signals tracked:
    - Time-on-task, session frequency, consistency
    - Click patterns, reading speed, pause patterns
    - Response latency, error patterns, help-seeking
    - Collaboration patterns, peer interaction
    - etc.
    """

    def calculate_engagement_score(self, student_id: str) -> float:
        """
        Composite engagement score [0, 100]

        Factors:
        - Session frequency (regularity)
        - Time invested (depth)
        - Completion rate (consistency)
        - Help-seeking (metacognition)
        - Peer interaction (collaboration)
        """
        signals = self.fetch_signals(student_id)

        # Normalized weightings
        weights = {
            'session_frequency': 0.2,
            'time_invested': 0.3,
            'completion_rate': 0.25,
            'help_seeking': 0.1,
            'collaboration': 0.15
        }

        score = sum(
            signals[key] * weight
            for key, weight in weights.items()
        )

        return min(100, max(0, score))

    def detect_at_risk_patterns(self, student_id: str) -> List[str]:
        """Detect early warning signs"""
        flags = []

        signals = self.fetch_signals(student_id)

        if signals['session_frequency'] < 0.3:
            flags.append('IRREGULAR_ATTENDANCE')

        if signals['time_invested'] < 0.2:
            flags.append('LOW_ENGAGEMENT')

        if signals['error_rate'] > 0.7:
            flags.append('HIGH_ERROR_RATE')

        if signals['help_seeking'] > 0.8:
            flags.append('EXCESSIVE_HELP_NEEDED')

        return flags
```

### Cognitive Load Estimation

Estimates real-time mental effort to optimize content difficulty.

```python
# backend/learner_profile/analysis/cognitive_load.py

class CognitiveLoadEstimator:
    """
    Real-time mental effort estimation

    Indicators:
    - Response time (too fast = guessing; too slow = overload)
    - Error patterns (repeated same error = confusion)
    - Help requests (frequency, timing)
    - Session duration (fatigue)
    - Biometric signals if available (eye tracking, heart rate)
    """

    def estimate_cognitive_load(self, student_id: str) -> float:
        """
        Cognitive Load Index: [0, 100]

        0-30: Underutilized (bored, needs harder content)
        30-70: Optimal zone
        70-100: Overloaded (needs break, easier content)
        """
        recent_events = self.get_recent_events(student_id, minutes=15)

        # Response time analysis
        response_times = [e.response_time for e in recent_events]
        avg_response_time = np.mean(response_times)
        optimal_time = 30  # seconds

        # If avg response time >> optimal, likely overloaded
        time_factor = min(1.0, avg_response_time / optimal_time)

        # Error pattern analysis
        errors = sum(1 for e in recent_events if e.is_error)
        error_factor = errors / len(recent_events) if recent_events else 0

        # Fatigue analysis
        session_duration = recent_events[-1].timestamp - recent_events[0].timestamp
        fatigue_factor = min(1.0, session_duration / 60)  # 60 min = max fatigue

        # Composite score
        load = (
            time_factor * 0.4 +
            error_factor * 0.35 +
            fatigue_factor * 0.25
        ) * 100

        return load
```

---

## AI-Powered Features

### Feature 1: 3-Tier AI Response System

The 3-tier system minimizes latency and maximizes relevance:

```mermaid
graph TD
    USER["User Prompt"]

    TIER1["TIER 1: IndexedDB Cache<br/>Check if exact/similar response cached"]
    CACHE_HIT["Cache Hit?"]

    TIER2["TIER 2: RAG Retrieval<br/>Search ChromaDB for relevant course materials"]
    RAG["Retrieved Documents<br/>+ Embeddings"]

    TIER3["TIER 3: LLM Generation<br/>Google Gemini or Ollama"]
    LLM["Generated Response<br/>with sources"]

    RESPONSE["Return to Student<br/>+ Cache for next time"]

    USER --> TIER1
    TIER1 --> CACHE_HIT
    CACHE_HIT -->|YES| RESPONSE
    CACHE_HIT -->|NO| TIER2
    TIER2 --> RAG
    RAG --> TIER3
    TIER3 --> LLM
    LLM --> RESPONSE
```

**Implementation:**

```python
# backend/app/routers/ai.py

async def tutor_chat(request: TutorRequest) -> TutorResponse:
    """3-tier response system"""

    # TIER 1: Cache check
    cache_key = hash(request.prompt + request.course_id)
    cached = await redis.get(f"cache:response:{cache_key}")

    if cached and not_expired(cached):
        return TutorResponse(
            response=cached['response'],
            sources=cached['sources'],
            tier=1
        )

    # TIER 2: RAG retrieval
    embeddings = gemini.embed(request.prompt)
    docs = chromadb.similarity_search(embeddings, top_k=5)
    context = "\n".join(doc.text for doc in docs)

    # TIER 3: LLM generation
    system_prompt = """You are a Socratic tutor. Use the context below
    to answer the student's question by asking guiding questions first."""

    response = gemini.generate(
        prompt=request.prompt,
        context=context,
        system=system_prompt,
        temperature=0.7
    )

    # Cache for next time
    await redis.set(
        f"cache:response:{cache_key}",
        {
            'response': response,
            'sources': [doc.url for doc in docs]
        },
        ex=3600  # 1 hour TTL
    )

    return TutorResponse(
        response=response,
        sources=[doc.url for doc in docs],
        tier=3
    )
```

### Feature 2: Adaptive Pathway Generation

```python
# backend/ai_engine/swarm/pathway.py

async def recommend_next_content(user: User) -> List[LessonRecommendation]:
    """
    Recommend next lesson based on:
    1. Knowledge state (BKT/DKT mastery)
    2. Learning gaps (misconceptions)
    3. Learning preferences (style, pace)
    4. Progress (avoiding repeats)
    """

    # Get current knowledge state
    mastery_data = await bkt_model.get_all_concepts(user.id)
    gaps = await gap_detector.get_misconceptions(user.id)

    # Filter available lessons
    available_lessons = await db.query(Lesson).all()

    recommendations = []

    for lesson in available_lessons:
        # Check prerequisites
        prereqs_met = all(
            mastery_data.get(prereq, 0) > 0.8
            for prereq in lesson.prerequisites
        )

        if not prereqs_met:
            continue

        # Score by relevance to gaps
        gap_relevance = max(
            (1 - mastery_data.get(gap, 0))
            for gap in lesson.covers_concepts
            if gap in gaps
        ) if gaps else 0

        # Score by engagement potential (historical data)
        engagement_score = lesson.avg_completion_time / 30  # normalize

        # Score by difficulty match
        avg_mastery = np.mean([
            mastery_data.get(c, 0.5)
            for c in lesson.covers_concepts
        ])

        difficulty_match = 1.0 - abs(avg_mastery - 0.5)  # optimal: 0.5

        # Composite score
        score = (
            gap_relevance * 0.4 +
            engagement_score * 0.3 +
            difficulty_match * 0.3
        )

        recommendations.append(LessonRecommendation(
            lesson_id=lesson.id,
            score=score,
            reason=f"Addresses gap in {', '.join(gaps[:2])}"
        ))

    return sorted(recommendations, key=lambda x: x.score, reverse=True)[:3]
```

### Feature 3: Dynamic Assessment Generation

```python
# backend/ai_engine/swarm/assessment.py

async def generate_adaptive_quiz(
    user: User,
    topic: str,
    difficulty: str,
    num_questions: int = 5
) -> Quiz:
    """
    Generate quiz that adapts difficulty based on performance
    """

    quiz = Quiz(
        user_id=user.id,
        topic=topic,
        initial_difficulty=difficulty,
        questions=[]
    )

    for i in range(num_questions):
        # Determine difficulty for this question
        if i == 0:
            current_difficulty = difficulty
        else:
            # Look at previous response
            prev_response = quiz.responses[-1]

            if prev_response.is_correct:
                # Increase difficulty
                current_difficulty = increase_difficulty(current_difficulty)
            else:
                # Reduce difficulty
                current_difficulty = decrease_difficulty(current_difficulty)

        # Generate question
        question = await gemini.generate(
            prompt=f"""
            Generate a {current_difficulty} question about {topic}.
            Question should be based on this course material:
            {context_from_course}

            Return as JSON: {{"question", "options", "answer_key"}}
            """,
            temperature=0.8
        )

        quiz.add_question(question)

    return quiz
```

---

## Deployment Architecture

### Docker Compose Stack

```yaml
# docker-compose.yml
version: '3.9'

services:
  # Backend
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/lumina
      - REDIS_URL=redis://redis:6379
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
      - redis
      - chromadb
    volumes:
      - ./backend:/app
    command: uvicorn app.main:app --host 0.0.0.0 --reload

  # PostgreSQL Database
  postgres:
    image: postgis/postgis:15
    environment:
      - POSTGRES_DB=lumina
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  # Redis Cache
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # ChromaDB Vector Store
  chromadb:
    image: ghcr.io/chroma-core/chroma:latest
    ports:
      - "8001:8000"
    volumes:
      - chromadb_data:/chroma/data

  # Ollama (Local LLM)
  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_models:/root/.ollama

  # Celery Worker
  celery_worker:
    build: ./backend
    command: celery -A app.celery worker --loglevel=info
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/lumina
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  # Celery Beat (Scheduler)
  celery_beat:
    build: ./backend
    command: celery -A app.celery beat --loglevel=info
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/lumina
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  # Frontend
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    depends_on:
      - backend
    command: npm run dev

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
      - frontend

volumes:
  postgres_data:
  redis_data:
  chromadb_data:
  ollama_models:
```

### Kubernetes Deployment (Production)

```yaml
# kubernetes/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: lumina-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: lumina-backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
        - name: GEMINI_API_KEY
          valueFrom:
            secretKeyRef:
              name: ai-credentials
              key: gemini-key
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: lumina-backend-service
spec:
  selector:
    app: backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8000
  type: LoadBalancer
```

---

## Advanced Features & Roadmap

### Planned Features (Phase 2 & 3)

#### Real-Time Collaboration
- Live multiplayer lessons
- Peer tutoring matching (pair students by complementary strengths)
- Group projects with AI facilitation
- Live class sessions with teacher + AI co-facilitation

#### Advanced Assessment
- Proctored exams with integrity checking
- Oral assessments (speech-to-text + evaluation)
- Project-based evaluation
- Portfolio assessment

#### Mobile App (Flutter)
- Native iOS/Android experience
- Offline lesson access
- Biometric auth
- Push notifications for interventions
- Voice-based tutoring

#### Gamification
- Mastery badges
- Leaderboards (optional, privacy-aware)
- Achievement streaks
- Virtual currency/rewards system

#### Parent Portal
- Student progress tracking
- Automated reports
- Parent-teacher communication
- Goal setting

#### Advanced Analytics
- Learning curve analytics
- Predictive retention modeling
- A/B testing framework for pedagogies
- Institutional dashboard with cohort analysis

#### AI Enhancements
- Multi-modal AI (image + text understanding)
- Personalized voice tutor
- Handwriting style matching
- Fine-tuned models per institution/subject
- Multi-language support

---

## Pain Points Solved

| Pain Point | Traditional LMS | Lumina Solution |
|-----------|-----------------|-----------------|
| **1-to-many teaching** | Teacher can't scale individual attention | AI tutor available 24/7 for each student |
| **Grading burden** | 60% of teacher time | Automated AI grading + human override |
| **Delayed feedback** | Students wait days for grades | Immediate AI feedback |
| **Generic curriculum** | All students get same content | Personalized adaptive pathways |
| **Lost students** | No early warning | Real-time intervention alerts |
| **Bored high-performers** | Static progression | Difficulty adaptation in real-time |
| **Learning style mismatch** | One-size-fits-all teaching | Adapts to visual, auditory, kinesthetic styles |
| **Knowledge verification** | Memorization often mistaken for learning | BKT/DKT models detect true understanding |
| **Student data ownership** | Locked in vendor platform | Self-hosted, full data control |
| **Vendor lock-in** | Switching platforms costs millions | Open-source, portable |
| **Teacher isolation** | Limited collaboration tools | Community features, peer learning |
| **Limited parent visibility** | Parents in dark about progress | Automated reports, parent portal (roadmap) |

---

## Integration Points

### Third-Party Integrations

#### Learning Analytics Platforms
- **xAPI (Experience API):** Emit learning events for analysis
- **Caliper Analytics:** Standards-based event tracking

#### Identity Providers
- **OAuth 2.0:** Google, Microsoft, GitHub login
- **LDAP/Active Directory:** Enterprise user sync
- **SAML:** Single sign-on for institutions

#### Notification Services
- **SendGrid:** Transactional email
- **Twilio:** SMS notifications
- **Firebase:** Push notifications

#### File Storage
- **AWS S3:** Cloud file storage
- **MinIO:** On-premise object storage
- **GCP Cloud Storage:** Alternative cloud option

#### Video Streaming
- **Mux:** Video encoding and delivery
- **Bunny CDN:** Video content delivery

### Webhook Support

Lumina emits webhooks for external system integration:

```json
POST /webhooks/external-service

{
  "event": "student.quiz.completed",
  "timestamp": "2026-03-08T14:30:00Z",
  "data": {
    "student_id": "uuid",
    "course_id": "uuid",
    "score": 0.85,
    "mastery_change": 0.15
  }
}
```

**Supported Events:**
- `student.enrolled`
- `student.completed_lesson`
- `student.quiz.completed`
- `student.assignment.submitted`
- `teacher.created_course`
- `teacher.generated_content`

---

## Conclusion

**Lumina** represents a paradigm shift in educational technology: from static, one-size-fits-all platforms to dynamic, AI-powered personalization at scale. By solving the 1-to-many teaching challenge, Lumina enables educators to focus on what they do best—mentoring, inspiring, and guiding—while AI handles the personalized content delivery and assessment.

The system's modular architecture, multi-agent AI swarm, and sophisticated learner profiling ensure that each student gets a world-class, personalized education tailored to their unique needs, pace, and learning style.

**Key Takeaways:**
1. **Personalization at Scale:** AI tutor for every student
2. **Data Privacy:** Self-hosted, on-premise deployment
3. **Teacher Empowerment:** Automates grading, enhances teaching
4. **Open Architecture:** Extensible, interoperable, community-driven
5. **Proven ML:** BKT/DKT knowledge tracing, adaptive difficulty, behavior analysis

---

**Document Version:** 1.0
**Last Updated:** March 2026
**Maintainers:** Lumina Core Team
**License:** Open Source (TBD)

---

## Appendix A: Glossary

- **BKT:** Bayesian Knowledge Tracing - probabilistic model of student learning
- **DKT:** Deep Knowledge Tracing - LSTM-based knowledge tracing
- **RAG:** Retrieval-Augmented Generation - combining retrieved docs with LLM
- **RBAC:** Role-Based Access Control
- **Socratic Method:** Teaching by asking questions to guide discovery
- **Adaptive Pathway:** Personalized learning sequence that adjusts to student
- **Misconception:** Incorrect understanding that persists despite evidence
- **Mastery:** Demonstrated understanding (typically >80% accuracy)
- **Cognitive Load:** Mental effort required for learning task
- **Engagement:** Level of active participation and focus

## Appendix B: Common API Response Formats

```json
{
  "success": true,
  "data": {
    "response": "...",
    "metadata": {}
  },
  "errors": null
}
```

Error Response:
```json
{
  "success": false,
  "data": null,
  "errors": [
    {
      "code": "UNAUTHORIZED",
      "message": "Invalid token"
    }
  ]
}
```

---
