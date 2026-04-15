# Phase 2 - Clean Architecture Documentation

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CLIENT APPLICATIONS                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  Student Web App                                                             │
│    └─ WebSocket: /ws/ai-tutor-updates/{user_id}                            │
│    └─ HTTP: GET /ai-tutor/queue, GET /ai-tutor/events                      │
│                                                                              │
│  Teacher Dashboard                                                           │
│    └─ HTTP: GET /teacher/ai-queue                                           │
│    └─ HTTP: POST /teacher/ai-queue/{id}/approve|reject                     │
│    └─ HTTP: GET /teacher/ai-queue/analytics/*                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────┴───────────────┐
                    │                              │
                    ▼                              ▼
        ┌───────────────────┐          ┌──────────────────┐
        │   HTTP Routers    │          │  WebSocket Conn  │
        │                   │          │   ConnectionMgr  │
        │ • ai_tutor        │          │                  │
        │ • teacher         │          │ • Tracks active  │
        │ • realtime        │          │   connections   │
        └─────────┬─────────┘          └──────────┬───────┘
                  │                               │
                  │ Delegates to services        │ Managed by
                  │                               │
        ┌─────────▼──────────────────────────────▼────────┐
        │                                                   │
        │        SERVICE LAYER (Business Logic)           │
        │                                                   │
        ├─ RealtimeService ─────────────────────────────┐ │
        │   • emit_answer_ready()                      │ │
        │   • emit_answer_approved()                   │ │
        │   • emit_answer_rejected()                   │ │
        │   • emit_queue_update()                      │ │
        │   • get_pending_events() [polling]           │ │
        │   • _broadcast_to_student() ────┐            │ │
        │   • _store_event()              │            │ │
        ├─ AITutorService ───────────────────┐         │ │
        │   • generate_answer()             │         │ │
        │   • classify_decision()           │         │ │
        │         │                         │         │ │
        │         └─────────────────────────┼────┐    │ │
        ├─ AIQueueAnalytics                │    │    │ │
        │   • get_queue_metrics()           │    │    │ │
        │   • get_decision_distribution()   │    │    │ │
        │   • get_confidence_distribution() │    │    │ │
        │   • get_teacher_review_slas()     │    │    │ │
        │   • get_student_throughput()      │    │    │ │
        │         │                         │    │    │ │
        └─────────┼─────────────────────────┼────┼────┼─┘
                  │                         │    │    │
        ┌─────────▼─────────────────────────▼────▼────▼────┐
        │         ROUTER CONNECTION DISPATCHER             │
        │  (app/routers/realtime.py - broadcast_ai_     │
        │   tutor_event function)                         │
        │                                                  │
        │  • Receives event from RealtimeService         │
        │  • Calls ConnectionManager.broadcast()         │
        │  • Sends to all WebSockets for student_id     │
        └──────────────────────────┬─────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    ▼                             ▼
        ┌───────────────────┐          ┌────────────────┐
        │   SUPABASE DB     │          │   WebSocket    │
        │                   │          │   Student UI   │
        │ • ai_answer_queue │          │                │
        │ • ai_answer_      │          │ Real-time      │
        │   decisions       │          │ display update │
        │ • ai_answer_      │          │ (120ms latency)│
        │   review          │          │                │
        │ • realtime_events │          │ Fallback:      │
        │   (polling)       │          │ polling GET    │
        │ • queue_metrics   │          │ /ai-tutor/     │
        │ • ai_answer_      │          │ events         │
        │   sources         │          │ (2-5s latency) │
        │                   │          │                │
        └───────────────────┘          └────────────────┘
```

## Data Flow - AUTO_APPROVED (Fast Path)

```
1. SUBMISSION (HTTP POST)
   │
   ├─ POST /ai-tutor/queue
   ├─ Student id: s123
   ├─ Question: "What is photosynthesis?"
   │
   └─ Response: {"queue_id": "q001", "status": "pending"}
                  ↓
2. BACKGROUND TASK SPAWNED
   │
   ├─ _generate_ai_answer_background(q001, s123, ...)
   ├─ Creates: AITutorService(), RealtimeService()
   │
   └─ Spawned in background, returns immediately
                  ↓
3. AI GENERATION (Service Layer)
   │
   ├─ AITutorService.generate_answer()
   ├─ Calls LLM: Claude/Gemini
   ├─ Returns: {"answer": "...", "confidence": 0.89, "status": "AUTO_APPROVED"}
   │
   └─ Takes 8-15 seconds
                  ↓
4. EVENT EMISSION (RealtimeService)
   │
   ├─ emit_answer_ready(q001, s123, answer, "AUTO_APPROVED", 0.89, ...)
   ├─ Creates event payload with all context
   ├─ Stores in DB: INSERT realtime_events (polling fallback)
   └─ Returns: {"event_id": "evt_001", "broadcast_result": "success"}
                  ↓
5. BROADCAST (via Router)
   │
   ├─ _broadcast_to_student(s123, event)
   ├─ Calls: broadcast_ai_tutor_event(s123, event)
   ├─ ConnectionManager finds WebSocket for s123
   ├─ Sends JSON over /ws/ai-tutor-updates/s123
   │
   └─ Takes 50-150ms
                  ↓
6. STUDENT RECEIVES (Client)
   │
   ├─ WebSocket message handler triggered
   ├─ Updates UI with answer
   ├─ Shows confidence: 89%
   ├─ Shows source: "AI (Auto-Approved)"
   │
   └─ Latency: ~120-250ms from question submission
   
TOTAL TIME: ~9-16 seconds before student sees answer
```

## Error Handling Flow

```
ERROR SCENARIOS:

1. AI GENERATION TIMEOUT (>120 seconds)
   │
   ├─ asyncio.TimeoutError raised
   ├─ Caught: except asyncio.TimeoutError
   ├─ Action: Mark queue as PENDING
   ├─ Log: "ai_answer_generation_timeout" with context
   ├─ DB: UPDATE ai_answer_queue SET status='PENDING', failed_reason='Timeout'
   │
   └─ Teacher sees in /teacher/ai-queue?status=PENDING
      └─ Can write answer manually or reject

2. WEBSOCKET BROADCAST FAILURE
   │
   ├─ Attempt 1: broadcast_ai_tutor_event() fails
   ├─ RETRY: Wait 100ms, attempt 2
   ├─ Attempt 2: Still fails
   ├─ RETRY: Wait 200ms, attempt 3
   ├─ Attempt 3: Still fails
   │
   ├─ FALLBACK: Event already in DB
   ├─ Log: "event_broadcast_failed_fallback_available"
   │
   └─ Student polls: GET /ai-tutor/events?student_id=s123
      └─ Receives event via polling (2-5s delay)

3. DATABASE FAILURE (Insert event fails)
   │
   ├─ Exception caught
   ├─ Log: "event_storage_failed" with context
   ├─ Still attempt WebSocket broadcast
   │
   └─ Partial loss (event not stored for polling fallback)
      └─ Teacher can follow up manually if needed

4. AI VALIDATION ERROR (Bad question/context)
   │
   ├─ ValueError raised
   ├─ Caught: except ValueError
   ├─ Action: Mark queue as PENDING
   ├─ DB: UPDATE with failed_reason="Validation error: ..."
   │
   └─ Teacher manually reviews and intervenes
```

## Event Format - All Events Follow Same Structure

```json
{
  "event": "answer.auto_approved|answer.provisional|answer.approved_by_teacher|answer.rejected|queue_position_updated",
  "timestamp": "2026-04-15T10:30:45.123Z",
  "data": {
    "question_id": "q123",
    "student_id": "s456",
    "answer": "Full answer text...",
    "confidence": 0.87,
    "safety_score": 0.98,
    "source": "ai_auto|ai_provisional|teacher_approved",
    "status": "AUTO_APPROVED|PROVISIONAL|APPROVED|REJECTED",
    "rag_sources": [
      {"title": "Source 1", "excerpt": "..."},
      {"title": "Source 2", "excerpt": "..."}
    ],
    "teacher_name": "John Smith",
    "teacher_feedback": "Great answer, but clarify X..."
  },
  "metadata": {
    "server_time": "2026-04-15T10:30:45.123Z",
    "priority": "high"
  }
}
```

## Service Responsibilities

### RealtimeService
**Responsibility**: Manage event lifecycle (creation, storage, broadcast)
- Create event payloads (single source of truth)
- Store in database for polling fallback
- Delegate WebSocket broadcast (not direct call)
- Handle retry logic
- Return broadcast status to caller

**Does NOT**: Direct WebSocket sending, connection management

### AITutorService
**Responsibility**: Generate answers with confidence scoring
- Call LLM APIs
- Calculate confidence/safety scores
- Extract RAG sources
- Classify decision (AUTO_APPROVED|PROVISIONAL|PENDING)

**Does NOT**: Handle events, WebSocket, database writes

### Routers (ai_tutor, teacher, realtime)
**Responsibility**: HTTP request handling + WebSocket connection management
- Parse requests, validate input
- Call appropriate services
- Manage HTTP responses
- Maintain WebSocket connections (realtime router)

**Does NOT**: Business logic, event creation, service-to-service communication

## Failure Recovery Guarantees

### Real-Time Path (WebSocket)
```
Success Path:
  Question → AI Generation → Event Creation → Store DB → Broadcast WS → Student sees (120ms)

If WebSocket Fails:
  Question → AI Generation → Event Creation → Store DB → Broadcast tries 3x → Fails gracefully
                                                 ↓
                                         Event in DB
                                                 ↓
                                    Student polls later
                                                 ↓
                                         Receives via polling (2-5s)
                                                 ↓
                                      UI updates (eventual consistency)
```

### No Data Loss Scenarios
- ✅ Event stored BEFORE broadcast attempt
- ✅ Timeout → PENDING status recorded
- ✅ Broadcast failure → DB fallback
- ✅ Student disconnect → Polling retrieves event
- ✅ Database failure → Attempt broadcast anyway

## Performance Characteristics

| Operation | Latency | Bottleneck |
|-----------|---------|------------|
| Question submission | <100ms | HTTP + DB insert |
| AI generation | 8-15s | LLM API call |
| Event creation | <50ms | JSON creation |
| DB storage | 100-200ms | Supabase I/O |
| WS broadcast | 50-150ms | Connection + serialization |
| Total (real-time) | 9-16s | AI generation |
| Polling latency | 2-5s | Poll interval |

## Security Model

```
Student s123 can receive:
  ✓ Events for questions they asked
  ✗ Events for other students
  ✗ Events from other classes

Teacher t456 can see:
  ✓ Answers for their classes
  ✗ Answers from other teachers' classes
  ✗ Student private messages

All events logged:
  ✓ Who asked question
  ✓ Who approved/rejected
  ✓ When action taken
  ✓ What was the decision
```

## Monitoring Points

### Application Metrics
- `ai_answer_generation_success` - Normal flow count
- `ai_answer_generation_timeout` - Timeout count
- `ai_answer_generation_failed` - Error count
- `event_broadcast_success` - Broadcast succeeded
- `event_broadcast_degraded` - Fallback activated
- `event_broadcast_failed` - Fallback also failed

### Business Metrics
- AUTO_APPROVED rate: 65-70% ideal
- PROVISIONAL rate: 20-25% ideal
- PENDING rate: 5-10% acceptable
- Approval latency: <5 min
- Student latency: <250ms real-time, <5s polling

### Database Queries
```SQL
-- Decision distribution
SELECT status, COUNT(*) FROM ai_answer_decisions GROUP BY status;

-- Average response time
SELECT AVG(EXTRACT(EPOCH FROM (reviewed_at - created_at))) 
FROM ai_answer_decisions WHERE reviewed_at IS NOT NULL;

-- Teacher workload
SELECT teacher_id, COUNT(*) FROM ai_answer_decisions GROUP BY teacher_id;

-- Student engagement
SELECT student_id, COUNT(*) FROM ai_answer_queue GROUP BY student_id;
```

## Deployment Considerations

### Single Process
- ✅ In-memory ConnectionManager sufficient
- ✅ WebSocket broadcast direct
- ✅ No Redis needed

### Multi-Process (Horizontal Scaling)
- ⚠️ ConnectionManager only sees local connections
- ⚠️ Need Redis pub/sub for cross-process broadcast
- ⏳ Future: Add Redis integration to RealtimeService

### Database
- ✅ Supabase suitable for all operations
- ✅ PostgREST API used for queries
- ✅ Indexes recommended on: student_id, status, created_at

