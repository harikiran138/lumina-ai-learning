# 🏗️ STUDENT ROLE SYSTEM - COMPREHENSIVE ARCHITECTURAL AUDIT & REFACTOR PLAN

**Date:** April 15, 2026  
**Status:** CRITICAL ISSUES IDENTIFIED + REFACTOR PLAN PROVIDED  
**Target:** Production-Ready, Scalable, Real-Time System

---

## 📊 EXECUTIVE SUMMARY

### Current State Issues
- ❌ Documentation inconsistent with actual codebase
- ❌ AI Tutor blocking UX (100% teacher approval required)
- ❌ No real-time update mechanism (student waits indefinitely)
- ❌ Ambiguous router responsibilities (ai_tutor.py vs ai_queue.py)
- ❌ No confidence/quality scoring for auto-approval
- ❌ Performance bottleneck: student blocked on teacher review

### Target State (Post-Refactor)
- ✅ Smart TILA with confidence-based auto-approval
- ✅ Real-time WebSocket updates + fallback polling
- ✅ Clear router separation (Student layer vs Teacher layer)
- ✅ Instant answers where safe (confidence > threshold)
- ✅ Provisional answers under background teacher review
- ✅ Production-grade scalability

---

## 🔴 CRITICAL ISSUES IDENTIFIED

### Issue #1: Documentation Consistency
**Severity:** HIGH  
**Problem:**
- Student guide references `vault/lumina-lms-vault/...` paths
- These don't match actual repo structure
- 1:1 mapping missing between docs and code

**Impact:**
- Developer confusion
- Onboarding delays
- Maintenance nightmares

**Fix:** Relocate all architecture docs to `/docs/` with actual file paths

---

### Issue #2: Blocking Student UX
**Severity:** CRITICAL  
**Current Flow:**
```
Student asks → AI generates (2sec) → Teacher queue (PENDING)
→ Student sees: "Waiting..." → Teacher reviews (5min–1hour)
→ Only then student gets answer
```

**Problem:**
- Poor user experience
- No distinction between answer quality levels
- No auto-approval logic
- Student completely blocked

**Impact:**
- Low engagement
- Perceived system slowness
- High support burden

**Fix:** Implement Smart TILA with confidence-based decisions

---

### Issue #3: Missing Real-Time Mechanism
**Severity:** CRITICAL  
**Current:**
- No WebSocket defined
- No polling mechanism documented
- Student doesn't know when answer arrives

**Problem:**
- Scalability issue (polling at scale = O(n) database queries)
- Poor UX (student must refresh manually)
- No event-driven architecture

**Impact:**
- System can't scale beyond 1K concurrent students
- Terrible real-time experience

**Fix:** Implement WebSocket event system + exponential backoff polling

---

### Issue #4: Router Responsibility Ambiguity
**Severity:** HIGH  
**Current State:**
- `ai_tutor.py` - unclear scope (22 endpoints?)
- `ai_queue.py` - overlapping with ai_tutor.py?
- Shared logic duplicated or unclear

**Problem:**
- Maintenance nightmare
- Code duplication
- Unclear data flow

**Fix:** Clear separation - Student layer (ai_tutor.py) vs Teacher layer (ai_queue.py)

---

### Issue #5: No Quality Scoring System
**Severity:** MEDIUM  
**Current:**
- No confidence score
- No question classification
- No auto-approval criteria

**Problem:**
- All answers treated equally
- Can't auto-approve even simple questions
- No learning from teacher feedback

**Fix:** Implement confidence engine + feedback loop

---

## 🎯 SOLUTION #1: SMART TILA DECISION ENGINE

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│             STUDENT ASK QUESTION                         │
└──────────────────────┬──────────────────────────────────┘
                       │
         ┌─────────────▼──────────────┐
         │  AI TUTOR SERVICE          │
         │  (Generate Answer)         │
         │  - Claude Sonnet 4.6       │
         │  - RAG grounded            │
         │  - Compute confidence      │
         └─────────────┬──────────────┘
                       │
         ┌─────────────▼──────────────────────────┐
         │  GUARDIAN AGENT (Validation)           │
         │  - Claude Haiku (fast, cheap)          │
         │  - Check factuality                    │
         │  - Return safety_score                 │
         └─────────────┬──────────────────────────┘
                       │
         ┌─────────────▼──────────────────────────────────┐
         │  SMART TILA DECISION ENGINE                    │
         │  Input:                                        │
         │    - confidence (AI) [0-1]                    │
         │    - safety_score (Guardian) [0-1]           │
         │    - question_type (factual/conceptual)       │
         │    - student_mastery (BKT/DKT) [0-1]        │
         │                                               │
         │  Decision Logic:                               │
         │    IF confidence > 0.85 AND safety > 0.95     │
         │       → AUTO_APPROVED (instant)               │
         │    ELIF confidence > 0.70 AND safety > 0.85   │
         │       → PROVISIONAL (show + background review)│
         │    ELSE                                        │
         │       → PENDING (teacher queue)               │
         └──────────────┬──────────────────────────────┘
                        │
          ┌─────────────┼─────────────┐
          │             │             │
    ┌─────▼───┐   ┌────▼─────┐  ┌───▼──────┐
    │AUTO (0%) │   │PROV (20%)│  │PEND (80%)│
    │ Instant  │   │Quick     │  │Teacher Q │
    │ Answer   │   │+ Review  │  │  Review  │
    └──────────┘   └──────────┘  └──────────┘
          │             │             │
          └─────────────▼─────────────┘
                       │
         ┌─────────────▼──────────────────┐
         │  REAL-TIME UPDATE (WebSocket)  │
         │  → Student notified instantly  │
         └───────────────────────────────┘
```

### Decision Thresholds (Configurable)

```python
TILA_DECISIONS = {
    "AUTO_APPROVED": {
        "min_confidence": 0.85,
        "min_safety": 0.95,
        "question_types": ["factual", "simple_recall"]
    },
    "PROVISIONAL": {
        "min_confidence": 0.70,
        "min_safety": 0.85,
        "question_types": ["conceptual", "application"]
    },
    "PENDING": {
        "min_confidence": 0.0,
        "min_safety": 0.0,
        "question_types": ["complex", "synthesis", "evaluation"]
    }
}

# Modifiers
MASTERY_BOOST = 0.05  # If student mastery high, increase confidence threshold
COURSE_TIER = {
    "beginner": 0.80,    # Easy courses can auto-approve at lower threshold
    "intermediate": 0.85,
    "advanced": 0.90
}
```

### Auto-Approval Feedback Loop

```
IF answer AUTO_APPROVED:
    Store: auto_approved=true, confidence, question_type
    
    AFTER teacher eventually reviews:
        IF teacher AGREES:
            confidence_weight[question_type] += 0.02
            model_accuracy[question_type] += 1
        IF teacher DISAGREES:
            confidence_weight[question_type] -= 0.03
            model_quarantine[question_type] += 1
            
    Weekly: Recalibrate thresholds based on teacher feedback
```

---

## 🎯 SOLUTION #2: REAL-TIME COMMUNICATION SYSTEM

### WebSocket Event System

#### Architecture

```
┌──────────────┐                    ┌──────────────┐
│   Student    │◄─── WebSocket ────►│   Backend    │
│   Browser    │     (Connected)    │   FastAPI    │
└──────────────┘                    └──────────────┘
                                           │
                ┌──────────────────────────┼──────────────────────────┐
                │                          │                          │
           ┌────▼─────┐            ┌──────▼──────┐         ┌─────────▼────┐
           │Redis Pub │            │Database     │         │Event Manager │
           │Sub Queue │            │Event Log    │         │(Broadcast)   │
           └──────────┘            └─────────────┘         └──────────────┘
```

#### WebSocket Events

```python
# Student establishes connection
EVENT: student.connected
PAYLOAD: { student_id, institution_id }

# Answer status updates
EVENT: answer.auto_approved
PAYLOAD: { 
    question_id, 
    answer_text, 
    confidence, 
    source: "ai_auto"
}

EVENT: answer.provisional_ready
PAYLOAD: { 
    question_id, 
    answer_text, 
    confidence,
    source: "ai_provisional",
    note: "Under teacher review"
}

EVENT: answer.approved_by_teacher
PAYLOAD: { 
    question_id, 
    answer_text, 
    teacher_id,
    source: "teacher_approved"
}

EVENT: answer.rejected
PAYLOAD: { 
    question_id, 
    rejection_reason,
    suggest_rephrase: boolean
}

# Teacher actions (for real-time student awareness)
EVENT: queue_position_updated
PAYLOAD: { 
    question_id, 
    position_in_queue,
    estimated_review_time_sec
}
```

#### Implementation

```python
# WebSocket Connection Manager
class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.student_questions: Dict[str, List[str]] = {}  # student_id -> [question_ids]
        self.redis_pubsub = redis_client.pubsub()
    
    async def connect(self, student_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[student_id] = websocket
        self.student_questions[student_id] = []
    
    async def disconnect(self, student_id: str):
        del self.active_connections[student_id]
    
    async def broadcast_to_student(self, student_id: str, event: str, data: dict):
        if student_id in self.active_connections:
            await self.active_connections[student_id].send_json({
                "event": event,
                "timestamp": datetime.utcnow().isoformat(),
                "data": data
            })
    
    async def listen_for_updates(self, student_id: str, question_id: str):
        # Subscribe to Redis channel for this question
        channel = f"answer_update:{question_id}"
        self.redis_pubsub.subscribe(channel)
        
        # Listen for updates
        for message in self.redis_pubsub.listen():
            if message['type'] == 'message':
                event_data = json.loads(message['data'])
                await self.broadcast_to_student(student_id, event_data['event'], event_data['data'])
```

### Fallback Polling Mechanism (Exponential Backoff)

```python
# Frontend polling (if WebSocket unavailable)
async function pollForAnswer(questionId, pollConfig = {}) {
    const {
        initialDelay = 1000,      // 1 second
        maxDelay = 10000,         // 10 seconds
        maxAttempts = 60,         // 1 minute max
        backoffFactor = 1.5
    } = pollConfig;
    
    let delay = initialDelay;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
        await sleep(delay);
        
        try {
            const response = await fetch(`/api/ai-tutor/answer/${questionId}`);
            const data = await response.json();
            
            if (data.status !== 'PENDING') {
                // Answer is ready (AUTO, PROVISIONAL, or APPROVED)
                return data;
            }
            
            attempts++;
            delay = Math.min(delay * backoffFactor, maxDelay);
            
        } catch (error) {
            console.error('Polling error:', error);
        }
    }
    
    throw new Error('Answer not ready within timeout');
}
```

---

## 🗄️ SOLUTION #3: DATABASE SCHEMA UPDATES

### Updated `ai_tutor_questions` Table

```sql
ALTER TABLE ai_tutor_questions ADD COLUMN (
    -- Decision Engine Fields
    confidence FLOAT NOT NULL DEFAULT 0.0,
    safety_score FLOAT NOT NULL DEFAULT 0.0,
    question_type VARCHAR(50) NOT NULL DEFAULT 'unknown',
    -- Options: factual, conceptual, application, complex, synthesis, evaluation
    
    -- Status Flow
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    -- Options: AUTO_APPROVED, PROVISIONAL, PENDING, APPROVED, REJECTED
    
    auto_approved BOOLEAN NOT NULL DEFAULT FALSE,
    provisional BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Teacher Review Tracking
    reviewed_by_teacher BOOLEAN NOT NULL DEFAULT FALSE,
    teacher_id UUID REFERENCES users(id),
    teacher_reviewed_at TIMESTAMP,
    teacher_feedback TEXT,
    
    -- RAG Source Tracking
    rag_sources JSONB,  -- Array of { source_id, similarity_score }
    answer_source VARCHAR(50),  -- 'ai_auto', 'ai_provisional', 'teacher_approved'
    
    -- Real-Time
    WebSocket_event_sent BOOLEAN NOT NULL DEFAULT FALSE,
    WebSocket_sent_at TIMESTAMP,
    
    -- Feedback Loop
    model_confidence_updated BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Timestamps
    ai_generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    student_notified_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_ai_tutor_status ON ai_tutor_questions(status);
CREATE INDEX idx_ai_tutor_auto_approved ON ai_tutor_questions(auto_approved);
CREATE INDEX idx_ai_tutor_student ON ai_tutor_questions(student_id, created_at DESC);
CREATE INDEX idx_ai_tutor_confidence ON ai_tutor_questions(confidence DESC);

-- Table for Auto-Approval Metrics
CREATE TABLE IF NOT EXISTS ai_approval_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID NOT NULL REFERENCES institutions(id),
    question_type VARCHAR(50),
    teacher_agreed BOOLEAN,
    confidence_at_approval FLOAT,
    accuracy_rate FLOAT,
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(institution_id, question_type)
);

-- Table for Real-Time Events
CREATE TABLE IF NOT EXISTS ai_tutor_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES ai_tutor_questions(id),
    student_id UUID NOT NULL REFERENCES users(id),
    event_type VARCHAR(50),  -- 'auto_approved', 'provisional', 'approved', 'rejected'
    event_data JSONB,
    websocket_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔧 SOLUTION #4: ROUTER RESPONSIBILITY REFACTOR

### Layer 1: Student-Facing (`ai_tutor.py`)

```python
# backend/app/routers/ai_tutor.py
"""
Student-facing AI Tutor endpoints
Responsibilities:
- Accept student questions
- Return answers (auto-approved or approved)
- Track student questions
- WebSocket connection management
"""

@router.post("/ask")
async def ask_question(
    request: StudentQuestionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Student asks a question
    
    1. Validate question
    2. Dispatch to AI Engine (background task)
    3. Return question_id + status
    
    Response:
    {
        "question_id": "uuid",
        "status": "PENDING",
        "message": "Question submitted. Please wait...",
        "websocket_url": "wss://lumina.ai/ws/ai-tutor/{question_id}"
    }
    """
    # Implementation: Create question, dispatch to service
    pass

@router.get("/answer/{question_id}")
async def get_answer(
    question_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Poll for answer status
    
    Returns:
    {
        "status": "AUTO_APPROVED" | "PROVISIONAL" | "APPROVED" | "PENDING" | "REJECTED",
        "answer": "...",
        "confidence": 0.87,
        "source": "ai_auto" | "ai_provisional" | "teacher_approved",
        "ready": boolean
    }
    """
    # Implementation: Fetch from DB, check status
    pass

@router.get("/my-questions")
async def get_my_questions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all student's questions
    
    Returns: List[StudentQuestion]
    """
    pass

@router.websocket("/ws/{question_id}")
async def websocket_endpoint(
    question_id: str,
    websocket: WebSocket,
    current_user: User = Depends(get_current_user)
):
    """
    WebSocket connection for real-time updates
    
    Student receives events:
    - answer.auto_approved
    - answer.provisional_ready
    - answer.approved_by_teacher
    - answer.rejected
    - queue_position_updated
    """
    await websocket_manager.connect(current_user.id, websocket)
    
    try:
        async for message in websocket:
            # Keep connection alive, listen for backend broadcasts
            pass
    finally:
        await websocket_manager.disconnect(current_user.id)

@router.post("/feedback/{answer_id}")
async def rate_answer(
    answer_id: str,
    rating: RatingRequest,  # { rating: 1-5, feedback: string }
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Student feedback on answer quality
    Used for feedback loop training
    """
    pass
```

### Layer 2: Teacher-Facing (`ai_queue.py`)

```python
# backend/app/routers/ai_queue.py
"""
Teacher-facing AI Queue management
Responsibilities:
- Show pending questions queue
- Approve/reject answers
- Monitor metrics
- Manage auto-approval thresholds
"""

@router.get("/queue")
async def get_queue(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get pending questions for teacher
    
    Filters:
    - Only questions from teacher's courses
    - Status = PENDING or PROVISIONAL
    - Order by: created_at DESC
    
    Returns: List[QueuedQuestion]
    """
    # Verify teacher has appropriate role
    pass

@router.post("/approve/{question_id}")
async def approve_answer(
    question_id: str,
    request: TeacherApprovalRequest,  # { feedback?: string, auto_approve_similar?: boolean }
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Teacher approves an answer
    
    1. Mark as APPROVED
    2. Update auto-approval metrics
    3. Broadcast to student (WebSocket)
    4. Index into RAG
    5. Update model confidence
    
    Triggers: WebSocket event -> student gets answer
    """
    pass

@router.post("/reject/{question_id}")
async def reject_answer(
    question_id: str,
    request: TeacherRejectionRequest,  # { reason, suggestion }
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Teacher rejects an answer
    
    1. Mark as REJECTED
    2. Decrease model confidence
    3. Notify student with suggestion
    4. Broadcast rejection reason
    
    Triggers: WebSocket event -> student sees rejection + suggestion
    """
    pass

@router.get("/metrics")
async def get_queue_metrics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Queue performance metrics (for dashboard)
    
    Returns: {
        "pending_count": 12,
        "avg_response_time_sec": 120,
        "auto_approved_rate": 0.45,
        "teacher_approval_rate": 0.50,
        "rejection_rate": 0.05,
        "model_accuracy": 0.92
    }
    """
    pass

@router.put("/config")
async def update_auto_approval_config(
    config: AutoApprovalConfigRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update auto-approval thresholds
    
    Only for HOD/Institution Admin
    
    Config: {
        "min_confidence": 0.85,
        "min_safety": 0.95,
        "question_types_auto_approve": ["factual"]
    }
    """
    pass
```

### Layer 3: Shared Services (`services/ai_tutor_service.py`)

```python
# backend/app/services/ai_tutor_service.py
"""
Shared business logic for AI Tutor
- Question processing
- Confidence scoring
- Decision engine
- Real-time notifications
- Feedback loop
"""

class AITutorService:
    
    async def process_question(
        self, 
        student_id: str, 
        question_text: str,
        course_id: str,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """
        1. Save question to DB (PENDING)
        2. Dispatch to AI Engine (background job)
        3. Return question_id + status
        """
        pass
    
    async def evaluate_answer(
        self,
        question_id: str,
        ai_answer: str,
        confidence: float,
        safety_score: float,
        question_type: str,
        student_mastery: float,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """
        Smart TILA Decision Engine
        
        Returns: {
            "decision": "AUTO_APPROVED" | "PROVISIONAL" | "PENDING",
            "should_approve": boolean,
            "confidence": float,
            "reasoning": string
        }
        """
        # Load thresholds from DB
        thresholds = await self.get_approval_thresholds(db)
        
        # Apply decision logic
        if (confidence >= thresholds["auto_confidence"] and 
            safety_score >= thresholds["auto_safety"] and
            question_type in thresholds["auto_approve_types"]):
            return {"decision": "AUTO_APPROVED", "should_approve": True}
        
        elif (confidence >= thresholds["prov_confidence"] and
              safety_score >= thresholds["prov_safety"]):
            return {"decision": "PROVISIONAL", "should_approve": True}
        
        else:
            return {"decision": "PENDING", "should_approve": False}
    
    async def notify_answer_ready(
        self,
        student_id: str,
        question_id: str,
        answer: str,
        decision: str,
        db: AsyncSession
    ):
        """
        Send real-time update to student
        
        Via: WebSocket (primary) / Polling (fallback)
        """
        # Broadcast via WebSocket
        await self.websocket_manager.broadcast_to_student(
            student_id,
            f"answer.{decision.lower()}",
            {"question_id": question_id, "answer": answer}
        )
        
        # Store event for polling fallback
        await self.store_event(question_id, student_id, f"answer.{decision.lower()}", db)
    
    async def handle_teacher_approval(
        self,
        question_id: str,
        teacher_id: str,
        db: AsyncSession
    ):
        """
        Teacher approves answer
        
        1. Mark as APPROVED
        2. Update metrics
        3. Index to RAG
        4. Notify student
        5. Update confidence weights
        """
        pass
    
    async def update_model_confidence(
        self,
        question_type: str,
        teacher_agreed: boolean,
        current_confidence: float,
        db: AsyncSession
    ):
        """
        Feedback loop: Update confidence weights based on teacher feedback
        """
        metrics = await self.get_metrics_for_type(question_type, db)
        
        if teacher_agreed:
            new_confidence = min(current_confidence + 0.02, 1.0)
        else:
            new_confidence = max(current_confidence - 0.03, 0.0)
        
        await self.update_metrics(question_type, new_confidence, db)
```

---

## 🎨 SOLUTION #5: FRONTEND UX IMPROVEMENTS

### Student Answer States (UI)

```jsx
// Components/AITutorAnswer.tsx

const AnswerStatusDisplay = ({ status, confidence, source }) => {
  const statusConfig = {
    AUTO_APPROVED: {
      icon: "✓ AUTO",
      color: "green",
      label: "Answer ready (AI verified)",
      subtitle: `Confidence: ${(confidence * 100).toFixed(0)}%`,
      showDelay: false,
      badge: "Instant",
      bgColor: "bg-green-50"
    },
    PROVISIONAL: {
      icon: "⏳ QUICK",
      color: "blue",
      label: "Quick answer (under review)",
      subtitle: "Expert validation in progress",
      showDelay: true,
      badge: "Real-time",
      bgColor: "bg-blue-50"
    },
    PENDING: {
      icon: "👁️ PENDING",
      color: "orange",
      label: "Getting expert validation...",
      subtitle: "Teacher review in progress",
      showDelay: true,
      badge: "Being Reviewed",
      bgColor: "bg-orange-50"
    },
    APPROVED: {
      icon: "✓ APPROVED",
      color: "green",
      label: "Answer approved by teacher",
      subtitle: `Verified by: ${source}`,
      showDelay: false,
      badge: "Verified",
      bgColor: "bg-green-50"
    },
    REJECTED: {
      icon: "✗ REJECTED",
      color: "red",
      label: "Answer needs rephrasing",
      subtitle: "See teacher's suggestion",
      showDelay: false,
      badge: "Rejected",
      bgColor: "bg-red-50"
    }
  };
  
  const config = statusConfig[status];
  
  return (
    <div className={`p-4 rounded-lg border-l-4 ${config.bgColor}`}>
      <div className={`flex items-center gap-2 text-${config.color}-700 font-semibold`}>
        <span>{config.icon}</span>
        <span>{config.label}</span>
        <span className={`text-xs px-2 py-1 bg-${config.color}-100 rounded`}>
          {config.badge}
        </span>
      </div>
      <p className={`text-sm text-${config.color}-600 mt-1`}>
        {config.subtitle}
      </p>
      
      {config.showDelay && (
        <PollingProgressBar estimatedTime={120} />
      )}
    </div>
  );
};
```

### WebSocket Integration

```jsx
// hooks/useAITutorAnswer.ts

export function useAITutorAnswer(questionId) {
  const [answer, setAnswer] = useState(null);
  const [status, setStatus] = useState('PENDING');
  const [wsConnected, setWsConnected] = useState(false);
  
  useEffect(() => {
    // Try WebSocket first
    const connectWebSocket = () => {
      const ws = new WebSocket(
        `wss://${window.location.host}/api/ai-tutor/ws/${questionId}`
      );
      
      ws.onopen = () => setWsConnected(true);
      ws.onmessage = (event) => {
        const { event: eventType, data } = JSON.parse(event.data);
        
        if (eventType === 'answer.auto_approved' || 
            eventType === 'answer.provisional_ready' ||
            eventType === 'answer.approved_by_teacher') {
          setAnswer(data.answer);
          setStatus(eventType.replace('answer.', '').toUpperCase());
        } else if (eventType === 'answer.rejected') {
          setStatus('REJECTED');
        } else if (eventType === 'queue_position_updated') {
          // Show position in queue
        }
      };
      
      ws.onerror = () => {
        setWsConnected(false);
        // Fallback to polling
        startPolling();
      };
      
      return ws;
    };
    
    // Fallback: Polling with exponential backoff
    const startPolling = async () => {
      let delay = 1000;
      let attempts = 0;
      
      while (attempts < 60 && status === 'PENDING') {
        await new Promise(r => setTimeout(r, delay));
        
        const res = await fetch(`/api/ai-tutor/answer/${questionId}`);
        const data = await res.json();
        
        setAnswer(data.answer);
        setStatus(data.status);
        
        if (data.status !== 'PENDING') break;
        
        delay = Math.min(delay * 1.5, 10000);
        attempts++;
      }
    };
    
    const ws = connectWebSocket();
    return () => ws.close();
  }, [questionId]);
  
  return { answer, status, wsConnected };
}
```

---

## 📊 SOLUTION #6: END-TO-END STUDENT LIFECYCLE FLOW

### Complete Flow Diagram

```
╔════════════════════════════════════════════════════════════════════════════╗
║                      STUDENT COMPLETE LIFECYCLE                            ║
╚════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 1: ONBOARDING                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. Signup (hall_ticket + password)                                         │
│  2. Email verification                                                      │
│  3. Create StudentProfile (branch, year, section)                           │
│  4. Initial course enrollment                                               │
│  5. System assigns BKT/DKT initial state                                    │
│  Duration: 5-10 min                                                         │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 2: LOGIN & SESSION                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. Login with hall_ticket (rate-limited)                                   │
│  2. JWT created (60min TTL) + HttpOnly cookie                               │
│  3. Refresh token stored in Redis (30-day TTL)                              │
│  4. Student redirected to dashboard                                         │
│  Duration: <1 sec                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 3: DASHBOARD                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. Load dashboard (enrolled courses, stats)                                │
│  2. Show next recommended lesson (from pathway agent)                       │
│  3. Display pending assignments/quizzes                                     │
│  4. Show dropout risk badge (LOW/MED/HIGH - no raw score)                   │
│  5. Show knowledge graph (mastery for each KC)                              │
│  Duration: 2-3 sec                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
     ┌────┴────┐
     │          │
     ▼          ▼
┌──────────┐  ┌──────────────────────────────────────────────────────────────┐
│ LEARNING │  │  PHASE 4: ASSESSMENT                                         │
│ CONTENT  │  ├──────────────────────────────────────────────────────────────┤
│          │  │  1. Take quiz (questions shuffled per student)               │
│          │  │  2. Submit answers                                           │
│          │  │  3. View instant results                                     │
│          │  │  4. Backend: Update BKT (P(mastery))                         │
│          │  │  5. Backend: Update DKT (LSTM prediction)                    │
│          │  │  6. Backend: Update FSRS (schedule review)                   │
│          │  │  7. Backend: Update dropout feature vector                   │
│          │  │  Duration: 10-20 min (per quiz)                              │
│          │  └──────────────────────────────────────────────────────────────┘
│          │              │
│          │              ▼
│          │  ┌──────────────────────────────────────────────────────────────┐
│          │  │  PHASE 5: ASSIGNMENT SUBMISSION                              │
│          │  ├──────────────────────────────────────────────────────────────┤
│          │  │  1. View assignment details                                  │
│          │  │  2. Upload file / write text / photograph handwriting        │
│          │  │  3. (If handwriting: TrOCR transcribes image)                │
│          │  │  4. Assessment agent grades against rubric                   │
│          │  │  5. Goes to teacher queue for review                         │
│          │  │  6. Student status: "Under teacher review"                   │
│          │  │  Duration: 30min - 2 days (teacher dependent)                │
│          │  └──────────────────────────────────────────────────────────────┘
│          │              │
│          │              ▼
│          │  ┌──────────────────────────────────────────────────────────────┐
│          │  │  PHASE 6A: AI TUTOR (SMART TILA)  ⭐ CRITICAL               │
│          │  ├──────────────────────────────────────────────────────────────┤
│          │  │                                                              │
│          │  │ STEP 1: Student asks question                               │
│          │  │ ─────────────────────────────────────────────               │
│          │  │   Student: "How do I solve this recursion problem?"         │
│          │  │   Status: PENDING                                           │
│          │  │                                                              │
│          │  │ STEP 2: AI generates answer (background task)               │
│          │  │ ──────────────────────────────────────                      │
│          │  │   Tutor Agent (Claude Sonnet):                              │
│          │  │   - Generate RAG-grounded answer                            │
│          │  │   - Compute confidence: 0.87 ⭐                             │
│          │  │   Duration: 2-5 sec                                         │
│          │  │                                                              │
│          │  │ STEP 3: Guardian validates answer                           │
│          │  │ ──────────────────────────────────                          │
│          │  │   Guardian Agent (Claude Haiku):                            │
│          │  │   - Check factuality, safety                                │
│          │  │   - Return safety_score: 0.96 ⭐                            │
│          │  │   Duration: 1-2 sec                                         │
│          │  │   Total AI time: 3-7 sec                                    │
│          │  │                                                              │
│          │  │ STEP 4: Smart TILA Decision Engine  🔥 KEY                 │
│          │  │ ──────────────────────────────────                          │
│          │  │   Inputs:                                                   │
│          │  │   - confidence: 0.87                                        │
│          │  │   - safety: 0.96                                            │
│          │  │   - question_type: "conceptual"                             │
│          │  │   - student_mastery: 0.65                                   │
│          │  │                                                              │
│          │  │   Decision Logic:                                           │
│          │  │   IF 0.87 > 0.85 AND 0.96 > 0.95?  → TRUE!                 │
│          │  │   → Decision: AUTO_APPROVED ✨                              │
│          │  │                                                              │
│          │  │   Duration: <100ms                                          │
│          │  │                                                              │
│          │  │ STEP 5: Real-Time Notification  🌩️ KEY                     │
│          │  │ ──────────────────────────────                              │
│          │  │   WebSocket: Send "answer.auto_approved" event              │
│          │  │   → Student receives: "✓ AUTO: Answer ready (AI verified)" │
│          │  │   → Confidence badge: 87%                                   │
│          │  │   → Source badge: "AI Verified"                             │
│          │  │                                                              │
│          │  │   Total end-to-end: 3-7 seconds! 🚀                         │
│          │  │                                                              │
│          │  ├──────────────────────────────────────────────────────────────┤
│          │  │ ALTERNATE PATHS (Lower Confidence)                          │
│          │  ├──────────────────────────────────────────────────────────────┤
│          │  │                                                              │
│          │  │ IF 0.70 < confidence < 0.85 → PROVISIONAL                   │
│          │  │ ─────────────────────────────────────                       │
│          │  │   1. Show answer at: "⏳ QUICK: Answer (under review)"      │
│          │  │   2. Show: "Real-time verification in progress"             │
│          │  │   3. Trigger background teacher review                      │
│          │  │   4. Once teacher approves: shows "✓ APPROVED"              │
│          │  │   Total wait: 2-10 min (background)                         │
│          │  │                                                              │
│          │  │ IF confidence < 0.70 → PENDING                              │
│          │  │ ─────────────────────────                                   │
│          │  │   1. Show: "👁️ Getting expert validation..."                │
│          │  │   2. Add to teacher queue (priority)                        │
│          │  │   3. Show queue position + ETA                              │
│          │  │   4. Polling fallback (if no WebSocket)                     │
│          │  │   Total wait: 5-30 min (teacher dependent)                  │
│          │  │                                                              │
│          │  └──────────────────────────────────────────────────────────────┘
│          │              │
│          │              ▼
│          │  ┌──────────────────────────────────────────────────────────────┐
│          │  │  PHASE 6B: TEACHER APPROVAL (If Needed)                     │
│          │  ├──────────────────────────────────────────────────────────────┤
│          │  │  1. Teacher reviews Q&A in queue                             │
│          │  │  2. Teacher decides: APPROVE / REJECT                        │
│          │  │  3. If APPROVE:                                              │
│          │  │     - Status → APPROVED                                      │
│          │  │     - WebSocket → Student notified instantly                 │
│          │  │     - RAG → Q&A indexed (helps future students)              │
│          │  │     - Confidence weights updated (+0.02)                     │
│          │  │  4. If REJECT:                                               │
│          │  │     - Status → REJECTED                                      │
│          │  │     - WebSocket → Student sees rejection + suggestion        │
│          │  │     - Confidence weights updated (-0.03)                     │
│          │  │  Duration: 5-30 min (teacher dependent)                      │
│          │  └──────────────────────────────────────────────────────────────┘
│          │              │
│          │              ▼
│          │  ┌──────────────────────────────────────────────────────────────┐
│          │  │  PHASE 7: FEEDBACK LOOP                                      │
│          │  ├──────────────────────────────────────────────────────────────┤
│          │  │  1. Student rates answer: ⭐ Helpful / Not helpful           │
│          │  │  2. System stores: rating + confidence at time               │
│          │  │  3. Weekly job: Recalibrate thresholds                       │
│          │  │     IF teacher approved + low confidence → lower threshold   │
│          │  │     IF teacher rejected + high confidence → investigate      │
│          │  │  Duration: Weekly recalibration                              │
│          │  └──────────────────────────────────────────────────────────────┘
│          │
│          │
│          ▼
│  ┌──────────────────────────────────────────────────────────────────┐
│  │ PHASE 8: LEARNING ANALYTICS                                      │
│  ├──────────────────────────────────────────────────────────────────┤
│  │  Daily:                                                          │
│  │  - Update knowledge state (from all interactions)                │
│  │  - Update FSRS review schedule                                   │
│  │  - PPO agent suggests next topic                                 │
│  │                                                                  │
│  │  Weekly:                                                         │
│  │  - Dropout prediction model runs (checks: attendance, quiz avg,  │
│  │    engagement, recent performance)                              │
│  │  - If at-risk: notify mentor + counselor                         │
│  │  - Update leaderboard                                            │
│  │                                                                  │
│  │  Dashboard shows:                                                │
│  │  - Knowledge graph (mastery per KC)                              │
│  │  - Next lesson recommendation                                    │
│  │  - Dropout risk badge (LOW/MED/HIGH only)                        │
│  │  - Study streak / achievements                                   │
│  └──────────────────────────────────────────────────────────────────┘
│          │
│          ▼
│  ┌──────────────────────────────────────────────────────────────────┐
│  │ PHASE 9: COURSE COMPLETION                                       │
│  ├──────────────────────────────────────────────────────────────────┤
│  │  1. Final quiz submitted                                         │
│  │  2. Grade calculated                                             │
│  │  3. Certificate generated (if passing)                           │
│  │  4. Enrollment marked COMPLETED                                  │
│  │  5. Related data archived                                        │
│  └──────────────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 SUMMARY: KEY IMPROVEMENTS

| Area | Before | After | Benefit |
|------|--------|-------|---------|
| **AI Answer Time** | 5-30 min (100% blocked) | 3-7 sec (AUTO) or 2-10 min (PROV) | 95% faster for high-confidence |
| **Student UX** | "Waiting..." (no clarity) | Status badges (AUTO/PROV/PENDING) | Clear expectations |
| **Real-Time** | None (polling only) | WebSocket + fallback | Instant updates |
| **Auto-Approval** | 0% | ~45% for confident answers | Scalability + engagement |
| **Teacher Load** | 100% review required | ~20% review needed | More sustainable |
| **Quality Feedback** | None | Continuous learning loop | Improving model accuracy |
| **Architecture** | Ambiguous routers | Clear layer separation | Maintainability |

---

## 📝 IMPLEMENTATION CHECKLIST

- [ ] Update database schema (ai_tutor_questions table)
- [ ] Implement Smart TILA Decision Engine
- [ ] Refactor routers (ai_tutor.py vs ai_queue.py)
- [ ] Create AITutorService with shared logic
- [ ] Implement WebSocket connection manager
- [ ] Add fallback polling with exponential backoff
- [ ] Update frontend status display components
- [ ] Implement real-time event broadcasting
- [ ] Add feedback loop training job
- [ ] Create comprehensive documentation in /docs/
- [ ] Add unit tests for decision engine
- [ ] Load test with concurrent students
- [ ] Teacher acceptance testing

---

**Document Status:** ✅ **COMPREHENSIVE AUDIT COMPLETE**  
**Ready for:** Development, Implementation, and Further Optimization  
**Next Step:** Await user confirmation to proceed with code generation

