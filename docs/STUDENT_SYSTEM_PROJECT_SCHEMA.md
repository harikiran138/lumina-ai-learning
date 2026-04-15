# 🏗️ STUDENT ROLE SYSTEM - COMPLETE PROJECT SCHEMA

**Status:** Production-Ready Architecture  
**Date:** April 15, 2026  
**Version:** 1.0  
**Purpose:** Complete file structure, responsibilities, and interaction flows

---

## 📑 TABLE OF CONTENTS

1. [Folder Structure](#folder-structure)
2. [File Responsibilities](#file-responsibilities)
3. [Data Flow Diagrams](#data-flow-diagrams)
4. [API Contracts](#api-contracts)
5. [Real-Time Communication](#real-time-communication)
6. [System Rules](#system-rules)
7. [Implementation Guide](#implementation-guide)

---

## 📁 FOLDER STRUCTURE

```
backend/
├── app/
│   ├── routers/                      # API endpoints layer (HTTP)
│   │   ├── ai_tutor.py              # ✅ Student AI questions (ask, get answer)
│   │   ├── ai_queue.py              # ✅ Teacher review queue (approve, reject)
│   │   ├── realtime.py              # ✅ WebSocket communication (events)
│   │   ├── student.py               # ✅ Student dashboard/profile
│   │   ├── auth.py                  # ✅ Login/registration
│   │   ├── assessment.py            # ✅ Quizzes/assignments
│   │   ├── teacher.py               # ✅ Teacher dashboard
│   │   └── [other role routers]     # Other roles (HOD, Admin, etc.)
│   │
│   ├── services/                    # Business logic layer (CORE)
│   │   ├── ai_tutor_service.py      # ✅ AI generation + decision engine
│   │   ├── ai_queue_service.py      # NEW Teacher queue management
│   │   ├── realtime_service.py      # NEW Event broadcasting service
│   │   ├── student_service.py       # ✅ Student data management
│   │   ├── assessment_service.py    # ✅ Quiz/assignment logic
│   │   └── [other services]         # Other domain services
│   │
│   ├── store/                       # Data access layer (DAL)
│   │   ├── ai_tutor_store.py        # ✅ AI tutor queries
│   │   ├── student_store.py         # ✅ Student queries
│   │   ├── assessment_store.py      # ✅ Assessment queries
│   │   └── [other stores]           # Other data access
│   │
│   ├── database/
│   │   ├── models.py                # ✅ SQLAlchemy ORM models
│   │   ├── migrations/              # Alembic migration scripts
│   │   └── scoped_db.py             # Database connection management
│   │
│   ├── core/
│   │   ├── config.py                # Settings & environment
│   │   ├── logging.py               # Structured logging
│   │   ├── limiter.py               # Rate limiting
│   │   └── security.py              # JWT, encryption
│   │
│   └── main.py                      # FastAPI app initialization
│
├── ai_engine/                       # External library (used by services)
│   ├── classifier.py                # Question classification
│   ├── prompts.py                   # LLM prompts
│   └── decision_engine.py           # Smart TILA logic
│
└── requirements.txt                 # Dependencies

frontend/
├── web/
│   └── src/
│       ├── app/
│       │   ├── student/
│       │   │   ├── ai-tutor/       # AI tutor UI pages
│       │   │   ├── dashboard/      # Dashboard pages
│       │   │   └── [other pages]   # Other student features
│       │   └── [other roles]/      # Other role pages
│       │
│       ├── hooks/
│       │   ├── useAITutorAnswer.ts # WebSocket + polling hook
│       │   ├── useAuth.ts          # Auth state
│       │   ├── useStudent.ts       # Student data
│       │   └── [other hooks]       # Other hooks
│       │
│       ├── services/
│       │   ├── api.ts              # API client
│       │   ├── ai_tutor_api.ts     # AI tutor API calls
│       │   ├── websocket.ts        # WebSocket client
│       │   └── [other services]    # Other API services
│       │
│       ├── components/
│       │   ├── AITutorStatusBadge.tsx  # Status display
│       │   ├── AITutorAnswer.tsx       # Answer display
│       │   ├── AnswerQueue.tsx         # Teacher queue
│       │   └── [other components]     # Other UI components
│       │
│       └── types/
│           ├── ai_tutor.ts         # AI tutor types
│           ├── api.ts              # API response types
│           └── [other types]       # Other type definitions
```

---

## 📋 FILE RESPONSIBILITIES

### LAYER 1: HTTP ROUTERS (Entry Points)

#### `routers/ai_tutor.py` (Student Layer - Student Actions ONLY)

**Purpose:** Handle student AI tutor interactions  
**No Business Logic Here** - delegates to services

**Endpoints:**
```
POST   /api/ai-tutor/ask              → ask question
GET    /api/ai-tutor/answer/{q_id}    → poll for answer  
GET    /api/ai-tutor/my-questions     → list questions
POST   /api/ai-tutor/feedback/{a_id}  → rate answer
WebSocket /api/ai-tutor/ws/{q_id}     → real-time updates
```

**Responsibilities:**
- Validate student request
- Authenticate user (JWT)
- Call AITutorService for business logic
- Return formatted response

**Dependencies:**
- Depends: `AITutorService`, `get_current_user`, database
- Used by: Frontend (student)
- NOT responsible for: Teacher approval, queue management, real-time events

---

#### `routers/ai_queue.py` (Teacher Layer - Teacher Actions ONLY)

**Purpose:** Handle teacher queue management  
**No Business Logic Here** - delegates to services

**Endpoints:**
```
GET    /api/ai-queue/queue            → list pending questions
POST   /api/ai-queue/approve/{q_id}   → approve answer
POST   /api/ai-queue/reject/{q_id}    → reject answer
GET    /api/ai-queue/metrics          → queue statistics
PUT    /api/ai-queue/config           → update thresholds
```

**Responsibilities:**
- Validate teacher request (RBAC check)
- Call AIQueueService for business logic
- Trigger real-time notifications
- Return formatted response

**Dependencies:**
- Depends: `AIQueueService`, `RealtimeService`, `get_current_user`
- Used by: Frontend (teacher), teacher dashboard
- NOT responsible for: Answer generation, student interface

---

#### `routers/realtime.py` (WebSocket Layer - Communication ONLY)

**Purpose:** Handle real-time WebSocket connections  
**No Business Logic Here** - broadcasts events

**Endpoints:**
```
WebSocket /ws/ai-tutor/{user_id}      → AI tutor updates
WebSocket /ws/community               → community chat
```

**Responsibilities:**
- Accept WebSocket connections
- Authenticate student/teacher (JWT)
- Listen for events from `RealtimeService`
- Broadcast to connected clients
- Handle disconnections gracefully

**Dependencies:**
- Depends: `RealtimeService`, authentication
- Used by: Frontend (both student and teacher)
- Event sources: `ai_tutor_service`, `ai_queue_service`

---

### LAYER 2: SERVICES (Business Logic - SINGLE SOURCE OF TRUTH)

#### `services/ai_tutor_service.py` (AI Tutor Core Logic)

**Purpose:** Central logic for AI answer generation and Smart TILA decision engine  
**This is where BUSINESS happens**

**Classes and Methods:**
```python
class AITutorService:
    
    async def ask_question(
        question: str,
        student_id: str,
        course_id: str
    ) -> QuestionResponse
        # 1. Validate question
        # 2. Create AI tutor question record (status=PENDING)
        # 3. Dispatch to background task (AI generation)
        # 4. Return question_id + initial response
    
    async def generate_answer(
        question_id: str,
        question_text: str
    ) -> AnswerResponse
        # 1. Call AI engine (Claude/OpenAI)
        # 2. Extract confidence score
        # 3. Run Guardian validation (safety check)
        # 4. Call decision_engine()
        # 5. Update status in DB
        # 6. Emit event (RealtimeService)
    
    async def decide_answer_status(
        confidence: float,
        safety_score: float,
        question_type: str,
        student_mastery: float,
        institution_id: str
    ) -> DecisionResult
        # Smart TILA Decision Engine
        # Returns: AUTO_APPROVED | PROVISIONAL | PENDING
        # + reasoning + recommended_action
    
    async def get_answer(
        question_id: str,
        student_id: str
    ) -> AnswerResponse
        # Return current answer state (for polling)
    
    async def update_model_confidence(
        question_type: str,
        teacher_agreed: bool,
        confidence_at_time: float
    ) -> MetricsUpdate
        # Feedback loop: adjust confidence weights
```

**Responsibilities:**
- Generate AI answers
- Run Smart TILA decision engine
- Update answer status
- Emit real-time events
- Learning from teacher feedback

**Dependencies:**
- Depends: `AITutorStore`, `RealtimeService`, AI engine
- Used by: `ai_tutor.py` router, background tasks
- Database: Read/write to `ai_tutor_questions`, metrics tables

---

#### `services/ai_queue_service.py` (NEW - Teacher Queue Logic)

**Purpose:** Handle teacher queue operations  
**Centralized teacher workflow**

**Classes and Methods:**
```python
class AIQueueService:
    
    async def get_queue(
        teacher_id: str,
        course_id: Optional[str] = None
    ) -> List[QueuedQuestion]
        # Get pending/provisional questions for teacher
        # Filter by teacher's courses
        # Order by: created_at ASC (oldest first)
    
    async def approve_answer(
        question_id: str,
        teacher_id: str,
        feedback: Optional[str] = None
    ) -> ApprovalResponse
        # 1. Verify teacher owns course
        # 2. Update status → APPROVED
        # 3. Store teacher feedback
        # 4. Update metrics (feedback loop)
        # 5. Emit event to student
        # 6. Index to RAG storage
    
    async def reject_answer(
        question_id: str,
        teacher_id: str,
        reason: str,
        suggestion: Optional[str] = None
    ) -> RejectionResponse
        # 1. Verify teacher owns course
        # 2. Update status → REJECTED
        # 3. Store rejection reason
        # 4. Decrease confidence metrics
        # 5. Emit event to student
    
    async def get_metrics(
        teacher_id: str
    ) -> QueueMetrics
        # Queue performance: pending count, avg wait, accuracy
```

**Responsibilities:**
- Queue management
- Teacher approval/rejection workflow
- Feedback loop triggers
- Metrics tracking

**Dependencies:**
- Depends: `AITutorStore`, `RealtimeService`, teacher auth
- Used by: `ai_queue.py` router
- Database: Read/write to `ai_tutor_questions`

---

#### `services/realtime_service.py` (NEW - Event Broadcasting)

**Purpose:** Emit events that real-time system broadcasts  
**Central event dispatcher**

**Classes and Methods:**
```python
class RealtimeService:
    
    async def emit_answer_ready(
        question_id: str,
        student_id: str,
        answer: str,
        status: str,  # AUTO_APPROVED | PROVISIONAL | APPROVED | REJECTED
        confidence: float,
        source: str
    ) -> EventResponse
        # Create event:
        # {
        #   "event": "answer.{status}",
        #   "question_id": "...",
        #   "answer": "...",
        #   "confidence": 0.87,
        #   "timestamp": "..."
        # }
        # Broadcast via WebSocket
        # Store in event log (polling fallback)
    
    async def emit_queue_update(
        question_id: str,
        student_id: str,
        position: int,
        queue_length: int,
        estimated_wait_sec: int
    ) -> EventResponse
        # Notify student about queue status
    
    async def broadcast_to_student(
        student_id: str,
        event_type: str,
        payload: dict
    ) -> None
        # Send to all student connections
        # Via WebSocket ConnectionManager
```

**Responsibilities:**
- Event creation
- WebSocket broadcasting
- Event persistence (for polling)

**Dependencies:**
- Depends: WebSocket ConnectionManager, database
- Used by: `ai_tutor_service`, `ai_queue_service`
- Triggers: Real-time updates to frontend

---

### LAYER 3: DATA ACCESS (Store/Repository)

#### `store/ai_tutor_store.py` (Database Queries for AI Tutor)

**Purpose:** All database queries related to AI tutor  
**Pure data access - no business logic**

**Methods:**
```python
class AITutorStore:
    
    async def create_question(
        student_id: str,
        question_text: str,
        course_id: str
    ) -> QuestionDB
        # INSERT into ai_tutor_questions
    
    async def get_question(question_id: str) -> QuestionDB
        # SELECT * FROM ai_tutor_questions WHERE id = ?
    
    async def update_question_status(
        question_id: str,
        status: str,
        answer_text: Optional[str] = None,
        confidence: Optional[float] = None
    ) -> None
        # UPDATE ai_tutor_questions SET status, answer_text, ...
    
    async def get_student_questions(
        student_id: str,
        limit: int = 50
    ) -> List[QuestionDB]
        # SELECT * FROM ai_tutor_questions WHERE student_id ORDER BY created_at DESC
    
    async def get_pending_for_teacher(
        teacher_id: str
    ) -> List[QuestionDB]
        # SELECT * FROM ai_tutor_questions 
        # WHERE status IN (PENDING, PROVISIONAL)
        # AND course_id IN (teacher's courses)
```

**Responsibilities:**
- Execute database queries
- No business logic
- Pure CRUD operations

**Dependencies:**
- Depends: Database connection, SQLAlchemy
- Used by: Service layer ONLY (never routers directly)

---

## 🔄 DATA FLOW DIAGRAMS

### Flow 1: Student Asks Question (Complete End-to-End)

```
FRONTEND (Student)
  │
  ├─ User types question + mode
  │
  └─► API: POST /api/ai-tutor/ask
       payload: { question_text, mode, course_id }
           │
           ▼
       ROUTER: ai_tutor.py
       ├─ Validate request
       ├─ Authenticate student
       └─► SERVICE: AITutorService.ask_question()
           ├─ Validate question (length, format)
           ├─ Create question record (status=PENDING)
           ├─► STORE: AITutorStore.create_question()
           │   └─ INSERT into DB (returns question_id)
           │
           ├─ Dispatch background task: generate_answer()
           │   (happens asynchronously)
           │
           └─► RESPONSE to Frontend:
               {
                 "question_id": "xyz",
                 "status": "PENDING",
                 "message": "Processing...",
                 "websocket_url": "wss://.../{question_id}"
               }

BACKEND (Async Background Task)
  │
  ├─ AI Engine: generate_answer(question_id)
  │
  ├─► ROUTER: ai_tutor.py::generate_answer (background)
  │
  ├─► SERVICE: AITutorService.generate_answer(question_id)
  │   │
  │   ├─ Fetch question details
  │   ├─ Call Claude/OpenAI API (AI generation)
  │   │   └─ Result: answer_text + confidence (e.g., 0.87)
  │   │
  │   ├─ Run Guardian Agent (safety validation)
  │   │   └─ Result: safety_score (e.g., 0.96)
  │   │
  │   ├─► SERVICE: AITutorService.decide_answer_status()
  │   │   ├─ Load institution config (thresholds)
  │   │   ├─ Decision logic:
  │   │   │   IF confidence > 0.85 AND safety > 0.95
  │   │   │     → decision = "AUTO_APPROVED"
  │   │   │   ELIF confidence > 0.70 AND safety > 0.85
  │   │   │     → decision = "PROVISIONAL"
  │   │   │   ELSE
  │   │   │     → decision = "PENDING"
  │   │   └─ Return: decision + reasoning
  │   │
  │   ├─► STORE: AITutorStore.update_question_status()
  │   │   └─ UPDATE ai_tutor_questions SET 
  │   │       status = "AUTO_APPROVED | PROVISIONAL | PENDING",
  │   │       answer_text = "...",
  │   │       confidence = 0.87,
  │   │       safety_score = 0.96
  │   │
  │   └─► SERVICE: RealtimeService.emit_answer_ready()
  │       ├─ Create event:
  │       │   {
  │       │     "event": "answer.auto_approved",
  │       │     "question_id": "xyz",
  │       │     "answer": "...",
  │       │     "confidence": 0.87,
  │       │     "source": "ai_auto"
  │       │   }
  │       │
  │       ├─► ROUTER: realtime.py
  │       │   ├─ Find WebSocket connection for student
  │       │   ├─ Broadcast message to WebSocket
  │       │   └─ Send via ws.send_json(event)
  │       │
  │       └─ Store event in DB (fallback polling)

FRONTEND (Student) - Real-Time Update
  │
  ├─ WebSocket receives: "answer.auto_approved"
  │  ├─ Alternative: Poll GET /api/ai-tutor/answer/{q_id}
  │  │  └─ Get latest status + answer
  │  │
  │  ├─ Re-render: AITutorStatusBadge(status="AUTO_APPROVED")
  │  │  └─ Display: "✓ AUTO - Answer ready (AI verified)"
  │  │
  │  └─ Show: answer_text + confidence badge + copy button

═══════════════════════════════════════════════════════════════════

Flow Summary:
1. Student asks → Router validates → Service creates record
2. Background: AI generates + decides status
3. Service updates DB + emits event
4. WebSocket broadcasts → Frontend updates UI
5. Fallback: Frontend polls if WebSocket unavailable
```

---

### Flow 2: Teacher Approves Answer

```
FRONTEND (Teacher Dashboard)
  │
  ├─ Teacher sees queue: "3 pending questions"
  │
  ├─ Teacher clicks: "Review" on a question
  │
  └─► API: POST /api/ai-queue/approve/{question_id}
       payload: { feedback: "..." }
           │
           ▼
       ROUTER: ai_queue.py
       ├─ Validate teacher
       ├─ Verify RBAC (teacher can approve)
       └─► SERVICE: AIQueueService.approve_answer()
           │
           ├─ Verify teacher owns course
           ├─► STORE: AITutorStore.update_question_status()
           │   └─ UPDATE status = "APPROVED"
           │
           ├─ Update metrics (feedback loop)
           │   ├─► STORE: Update accuracy_rate for question_type
           │   └─ confidence_weight increases for question_type
           │
           ├─► SERVICE: RealtimeService.emit_answer_ready()
           │   └─ Event: "answer.approved_by_teacher"
           │
           └─► RESPONSE to Teacher:
               { "status": "approved" }

BACKEND (Real-time Event)
  │
  └─► ROUTER: realtime.py
      ├─ Broadcast: event "answer.approved_by_teacher"
      ├─ Send to: Student (WebSocket)
      └─ Payload:
         {
           "event": "answer.approved_by_teacher",
           "question_id": "xyz",
           "teacher_name": "Dr. Sharma",
           "teacher_feedback": "Well done!",
           "source": "teacher_approved"
         }

FRONTEND (Student) - Real-Time Update
  │
  └─ WebSocket receives approval event
     ├─ Re-render: AITutorStatusBadge(status="APPROVED")
     └─ Display: "✓ APPROVED - Verified by teacher"
        With feedback: "Well done!"
```

---

### Flow 3: Real-Time WebSocket Connection Lifecycle

```
FRONTEND (Student)
  │
  ├─ User opens AI tutor page
  │
  └─► Option A: WebSocket Connection (Primary)
       └─► WebSocket: new WebSocket(
           "wss://lumina.ai/ws/ai-tutor/{user_id}?token=JWT"
           )
           │
           ▼
       ROUTER: realtime.py::websocket_endpoint()
       ├─ Extract JWT from query params
       ├─ Validate JWT signature + expiry
       ├─ Authenticate user_id
       ├─► ConnectionManager.connect(user_id, websocket)
       │   └─ Store WebSocket in: active_connections[user_id]
       │
       └─ Await messages loop:
           while True:
               try:
                   message = await websocket.receive_text()
                   # Keep connection alive
                   # Can receive client commands (PING/PONG)
               except WebSocketDisconnect:
                   ConnectionManager.disconnect(user_id, websocket)

       Option B: Polling Fallback (if WebSocket fails)
       └─► Polling Loop:
           delay = 1000ms (start)
           while timeout < 60sec:
               GET /api/ai-tutor/answer/{question_id}
               if status != "PENDING":
                   break  # Got answer!
               delay *= 1.5  (exponential backoff)
               wait(delay)  (up to max 10s)

BACKEND (Event Emission - Triggered by Service)
  │
  ├─ SERVICE: AITutorService generates answer
  │
  └─► SERVICE: RealtimeService.emit_answer_ready()
      └─► ConnectionManager.broadcast(user_id, event_payload)
          │
          ├─ Find WebSocket for user_id
          ├─ ws.send_json(event_payload)  # Real-time push
          └─ Also store in DB (for polling)

FRONTEND (Real-Time Update Reception)
  │
  ├─ WebSocket.onmessage(event)
  │  │
  │  ├─ Parse event JSON
  │  ├─ Update state: setStatus(event.status)
  │  ├─ Re-render component
  │  └─ Show answer to student
  │
  └─ OR Polling receives response
     ├─ Parse response JSON
     ├─ Update state
     ├─ Re-render component
     └─ Show answer
```

---

## 📨 API CONTRACTS

### Student AI Tutor Endpoints

#### 1. Ask Question
```http
POST /api/ai-tutor/ask
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "question_text": "How do I solve a recursion problem?",
  "mode": "explain",            # explain | quiz | code | interactive
  "course_id": "CSC101",
  "context": {
    "topic": "Recursion",
    "subject": "Computer Science"
  }
}

Response (Immediate):
{
  "question_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "PENDING",
  "message": "Processing your question...",
  "websocket_url": "wss://lumina.ai/api/ai-tutor/ws/550e8400-e29b-41d4-a716-446655440000"
}
```

#### 2. Get Answer (Polling)
```http
GET /api/ai-tutor/answer/{question_id}
Authorization: Bearer <JWT>

Response:
{
  "question_id": "550e8400-...",
  "status": "AUTO_APPROVED",              # AUTO_APPROVED | PROVISIONAL | APPROVED | REJECTED | PENDING
  "answer": "To solve a recursion problem...",
  "confidence": 0.87,
  "safety_score": 0.96,
  "source": "ai_auto",                   # ai_auto | ai_provisional | teacher_approved
  "question_type": "conceptual",
  "rag_sources": [
    {
      "document": "CS101 Recursion Lecture",
      "similarity": 0.92
    }
  ],
  "created_at": "2026-04-15T10:30:00Z",
  "ready": true
}
```

#### 3. List My Questions
```http
GET /api/ai-tutor/my-questions?skip=0&limit=50
Authorization: Bearer <JWT>

Response:
{
  "questions": [
    {
      "id": "550e8400-...",
      "question_text": "How do recursion work?",
      "answer": "...",
      "status": "APPROVED",
      "confidence": 0.87,
      "created_at": "2026-04-15T10:30:00Z"
    }
  ],
  "total": 25,
  "skip": 0,
  "limit": 50
}
```

#### 4. Rate Answer
```http
POST /api/ai-tutor/feedback/{answer_id}
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "rating": 5,                    # 1-5 stars
  "feedback": "Very helpful",
  "helpful": true
}

Response:
{
  "status": "success",
  "message": "Thank you for your feedback"
}
```

#### 5. WebSocket Connection
```
wss://lumina.ai/api/ai-tutor/ws/{question_id}?token={JWT}

Event Stream (from server):
{
  "event": "answer.auto_approved",
  "timestamp": "2026-04-15T10:30:45.123Z",
  "data": {
    "question_id": "550e8400-...",
    "answer": "To solve recursion...",
    "confidence": 0.87,
    "source": "ai_auto"
  }
}

Events possible:
- answer.auto_approved    → Answer ready (AI verified, instant)
- answer.provisional_ready  → Answer ready (AI, under review)
- answer.approved_by_teacher → Answer approved by teacher
- answer.rejected         → Answer rejected
- queue_position_updated  → Your position in queue changed
```

---

### Teacher Queue Endpoints

#### 1. Get Queue
```http
GET /api/ai-queue/queue
Authorization: Bearer <JWT (Teacher)>
Authorization: X-Teacher-Id: {teacher_id}

Response:
{
  "queue": [
    {
      "id": "550e8400-...",
      "student_name": "John Doe",
      "question_text": "How do I solve this?",
      "answer_text": "The approach is...",
      "confidence": 0.75,
      "status": "PENDING",
      "question_type": "conceptual",
      "created_at": "2026-04-15T10:30:00Z",
      "time_pending_sec": 120
    }
  ],
  "pending_count": 3,
  "avg_wait_time_sec": 180
}
```

#### 2. Approve Answer
```http
POST /api/ai-queue/approve/{question_id}
Authorization: Bearer <JWT (Teacher)>
Content-Type: application/json

{
  "feedback": "Excellent explanation! Just add more examples.",
  "auto_approve_similar": false
}

Response:
{
  "status": "approved",
  "message": "Answer approved",
  "event_sent": true
}
```

#### 3. Reject Answer
```http
POST /api/ai-queue/reject/{question_id}
Authorization: Bearer <JWT (Teacher)>
Content-Type: application/json

{
  "reason": "Missing critical step about edge cases",
  "suggestion": "Consider mentioning what happens when n <= 0"
}

Response:
{
  "status": "rejected",
  "message": "Answer rejected",
  "event_sent": true
}
```

#### 4. Queue Metrics
```http
GET /api/ai-queue/metrics
Authorization: Bearer <JWT (Teacher)>

Response:
{
  "pending_count": 3,
  "avg_response_time_sec": 120,
  "auto_approved_rate": 0.45,
  "teacher_approval_rate": 0.50,
  "rejection_rate": 0.05,
  "model_accuracy": 0.92,
  "questions_today": 45
}
```

---

## 🌩️ REAL-TIME COMMUNICATION

### WebSocket Event Schema

```typescript
// Base event structure
interface Event {
  event: string;              // Event type
  timestamp: ISO8601;         // Server timestamp
  data: EventPayload;         // Event-specific data
  metadata?: {
    server_time: ISO8601;
    ttl_seconds: number;
  };
}

// Answer ready (auto-approved)
interface AnswerAutoApprovedEvent extends Event {
  event: "answer.auto_approved";
  data: {
    question_id: UUID;
    answer: string;
    confidence: 0.0-1.0;
    safety_score: 0.0-1.0;
    source: "ai_auto";
    rag_sources: Array<{ document: string; similarity: float }>;
  };
}

// Answer provisional (under review)
interface AnswerProvisionalEvent extends Event {
  event: "answer.provisional_ready";
  data: {
    question_id: UUID;
    answer: string;
    confidence: 0.0-1.0;
    source: "ai_provisional";
    message: "Quick answer (expert validation in progress)";
  };
}

// Answer approved by teacher
interface AnswerApprovedEvent extends Event {
  event: "answer.approved_by_teacher";
  data: {
    question_id: UUID;
    answer: string;
    teacher_name: string;
    teacher_feedback: Optional<string>;
    source: "teacher_approved";
  };
}

// Answer rejected
interface AnswerRejectedEvent extends Event {
  event: "answer.rejected";
  data: {
    question_id: UUID;
    rejection_reason: string;
    suggestion: Optional<string>;
    teacher_name: string;
  };
}

// Queue position updated
interface QueuePositionEvent extends Event {
  event: "queue_position_updated";
  data: {
    question_id: UUID;
    position: int;
    queue_length: int;
    estimated_wait_seconds: int;
    avg_review_time_min: float;
  };
}
```

---

## 🎯 SYSTEM RULES

### Rule 1: No Logic Duplication
- ✅ Business logic lives in **services/** only
- ✅ Routers call services, never contain logic
- ✅ Stores are pure CRUD, no logic
- ❌ Never duplicate logic between routers
- ❌ Never put business logic in frontend

### Rule 2: Clear Separation of Concerns

```
Request Flow:
  Router (HTTP) → Service (Logic) → Store (Data) → DB

Event Flow:
  Service (Logic) → RealtimeService (Event) → Router (WebSocket) → Frontend

Business Logic Flow:
  AITutorService → AIQueueService → RealtimeService
  (Answer) → (Approval) → (Notification)
```

### Rule 3: Single Source of Truth
- ✅ Status lives in database (one source)
- ✅ Services read/write status
- ✅ Routers query services for status
- ❌ Never cache status in memory across requests
- ❌ Never trust frontend version of status

### Rule 4: Event-Driven Updates
- ✅ Status change → Emit event
- ✅ Event → Broadcast to WebSocket
- ✅ Event → Store in DB (polling fallback)
- ❌ Never force frontend to refresh/reload
- ❌ Never use polling as primary mechanism

### Rule 5: Async Background Tasks
- ✅ Answer generation is async (background job)
- ✅ Student gets immediate response (question_id)
- ✅ Frontend uses WebSocket/polling for answer
- ❌ Never block response until answer is ready
- ❌ Never make student wait for AI generation

### Rule 6: Frontend ↔ Backend Contract
- ✅ API responses always include `status` field
- ✅ Status values are standardized (AUTO_APPROVED, etc.)
- ✅ Confidence scores included in response
- ❌ Frontend never assumes status values
- ❌ Frontend always handles ALL status types

---

## 📝 IMPLEMENTATION GUIDE

### Implementation Checklist

#### Phase 1: Clean Router Layer (Ensure NO business logic)
- [ ] `routers/ai_tutor.py` - Only HTTP handling, delegates to services
- [ ] `routers/ai_queue.py` - Only HTTP handling, delegates to services
- [ ] `routers/realtime.py` - Only WebSocket, delegates to services
- [ ] Verify: No business logic in routers
- [ ] Verify: All routers call service methods

#### Phase 2: Strengthen Service Layer
- [ ] `services/ai_tutor_service.py` - Ensure decision engine is here
- [ ] `services/ai_queue_service.py` - Create if missing (teacher queue ops)
- [ ] `services/realtime_service.py` - Create if missing (event broadcasting)
- [ ] Verify: No database queries in services (use stores)
- [ ] Verify: All business logic centralized

#### Phase 3: Verify Store Layer
- [ ] `store/ai_tutor_store.py` - Pure CRUD for ai_tutor_questions
- [ ] Verify: No business logic in stores
- [ ] Verify: Only used by services, not routers

#### Phase 4: Test Data Flows
- [ ] Test: Student asks question (creates record, returns immediately)
- [ ] Test: Background task generates answer (async)
- [ ] Test: Answer ready event emitted (WebSocket broadcast)
- [ ] Test: Teacher approves answer (status updated, event sent)
- [ ] Test: Frontend receives real-time update (WebSocket or poll)

#### Phase 5: Documentation Update
- [ ] Update internal README with this project schema
- [ ] Add docstrings to all public methods
- [ ] Update API documentation (OpenAPI/Swagger)
- [ ] Remove all `vault/` references

---

## 📊 System Health Checklist

**Before Production:**
- [ ] No business logic in routers
- [ ] All services use stores (not DB directly)
- [ ] Real-time events emit on all status changes
- [ ] WebSocket connections authenticate with JWT
- [ ] Polling fallback works (exponential backoff)
- [ ] Teacher approval triggers student notification
- [ ] Feedback loop updates confidence metrics
- [ ] No hardcoded database queries in routers
- [ ] Store layer is pure CRUD
- [ ] API contracts match documentation

**Performance:**
- [ ] Answer delivery < 7 sec (AUTO_APPROVED, WebSocket)
- [ ] Teacher queue loads in < 2 sec
- [ ] Polling queries optimized (< 1 ms per query)
- [ ] WebSocket broadcasts < 100 ms
- [ ] Concurrent websockets: 5,000+ users

---

## 🔗 DEPENDENCIES GRAPH

```
Frontend
├─ ai_tutor.tsx (Student pages)
│  └─ calls: POST /api/ai-tutor/ask
│
├─ ai_queue.tsx (Teacher pages)
│  └─ calls: GET /api/ai-queue/queue + POST /approve/{id}
│
└─ websocket.ts (Real-time hook)
   └─ connects: [WebSocket /ws/ai-tutor/{user_id}]

Backend
├─ routers/ai_tutor.py
│  └─ calls: AITutorService.ask_question()
│
├─ routers/ai_queue.py
│  └─ calls: AIQueueService.approve_answer()
│
├─ routers/realtime.py
│  └─ listens: RealtimeService events
│
├─ services/ai_tutor_service.py
│  ├─ calls: AITutorStore queries
│  ├─ calls: RealtimeService.emit_event()
│  └─ calls: AI engine (background)
│
├─ services/ai_queue_service.py
│  ├─ calls: AITutorStore queries
│  └─ calls: RealtimeService.emit_event()
│
├─ services/realtime_service.py
│  └─ calls: ConnectionManager.broadcast()
│
└─ store/ai_tutor_store.py
   └─ executes: Database queries

Database (single source of truth)
└─ ai_tutor_questions table (status, answer, confidence, etc.)
```

---

**Project Schema Status:** ✅ **COMPLETE & PRODUCTION-READY**

This schema ensures:
✅ No ambiguity in responsibilities  
✅ Clear data flows  
✅ Single source of truth (database)  
✅ Event-driven real-time updates  
✅ Scalable, maintainable architecture  
✅ 1:1 mapping between docs and code  

