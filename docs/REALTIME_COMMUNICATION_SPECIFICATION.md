# 🌩️ REAL-TIME COMMUNICATION SPECIFICATION

**Status:** Technical Specification - Ready for Implementation  
**Version:** 1.0  
**Target:** WebSocket + Exponential Backoff Polling

---

## 📋 TABLE OF CONTENTS

1. [Architecture Overview](#architecture-overview)
2. [WebSocket Protocol](#websocket-protocol)
3. [Fallback Polling Strategy](#fallback-polling-strategy)
4. [Event Types](#event-types)
5. [Error Handling](#error-handling)
6. [Performance & Scalability](#performance--scalability)
7. [Deployment Considerations](#deployment-considerations)

---

## 🏗️ ARCHITECTURE OVERVIEW

### High-Level System

```
┌─────────────────────────────────────────────────────────────────┐
│                      STUDENT BROWSER                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────┐    ┌───────────────────┐                  │
│  │  WebSocket     │    │  Polling (Fallback)                   │
│  │  Connection    │◄───►  Exponential       │                  │
│  │  Primary       │    │  Backoff           │                  │
│  └────────┬───────┘    └────────┬───────────┘                  │
│           │                     │                              │
└───────────┼─────────────────────┼──────────────────────────────┘
            │                     │
            │ (wss://...)         │ (https://...)
            │                     │
┌───────────▼─────────────────────▼──────────────────────────────┐
│                    FASTAPI BACKEND                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────┐               │
│  │  WebSocketManager                           │               │
│  │  - Track active connections                 │               │
│  │  - Route events to students                 │               │
│  └──┬──────────────────────────────────────────┘               │
│     │                                                           │
│     ├─► ┌──────────────────┐                                  │
│     │   │  Redis Pub/Sub   │  ◄──── Broadcasting             │
│     │   │  Event Queue     │                                  │
│     │   └──────────────────┘                                  │
│     │                                                           │
│     ├─► ┌──────────────────┐                                  │
│     │   │  AI Tutor        │                                  │
│     │   │  Service Logic   │                                  │
│     │   └──────────────────┘                                  │
│     │                                                           │
│     └─► ┌──────────────────┐                                  │
│         │  Decision Engine │                                  │
│         │  (Smart TILA)    │                                  │
│         └──────────────────┘                                  │
│                                                                  │
│  ┌─────────────────────────────────────────────┐               │
│  │  Event Database (Fallback)                  │               │
│  │  - Stores all events for polling            │               │
│  │  - TTL: 24 hours                            │               │
│  └─────────────────────────────────────────────┘               │
│                                                                  │
└───────────────────────────────────────────────────────────────┘
            │
            ▼
┌───────────────────────────────────────────────────────────────┐
│                  POSTGRESQL / REDIS                            │
├───────────────────────────────────────────────────────────────┤
│  - AI Tutor Questions (persistence)                            │
│  - Event Log (for polling fallback)                            │
│  - Real-time streams (Redis)                                   │
└───────────────────────────────────────────────────────────────┘
```

---

## 🔌 WEBSOCKET PROTOCOL

### Connection Establishment

#### Client Initiates Connection

```javascript
// Frontend code
const wsUrl = `wss://${window.location.hostname}/api/ai-tutor/ws/${questionId}`;
const ws = new WebSocket(wsUrl);

ws.onopen = () => {
  console.log('✓ WebSocket connected');
  
  // Send authentication
  ws.send(JSON.stringify({
    type: 'AUTH',
    token: localStorage.getItem('access_token')
  }));
};
```

#### Server Validates & Accepts

```python
# Backend WebSocket endpoint
@router.websocket("/ws/{question_id}")
async def websocket_endpoint(question_id: str, websocket: WebSocket):
    # Verify JWT token
    token = websocket.query_params.get('token')
    if not verify_jwt(token):
        await websocket.close(code=4001, reason="Unauthorized")
        return
    
    student_id = get_student_id_from_token(token)
    
    # Verify question ownership
    question = await db.get(AITutorQuestion, question_id)
    if question.student_id != student_id:
        await websocket.close(code=4003, reason="Forbidden")
        return
    
    # Accept connection
    await websocket_manager.connect(student_id, websocket)
    
    # Keep connection alive (listen for events)
    try:
        while True:
            # Receive messages (keep-alive pings or client commands)
            data = await websocket.receive_text()
            
            # Handle client commands if needed
            message = json.loads(data)
            if message.get('type') == 'PING':
                await websocket.send_json({'type': 'PONG'})
    
    except WebSocketDisconnect:
        await websocket_manager.disconnect(student_id, websocket)
```

### Message Format

All WebSocket messages follow this structure:

```json
{
  "event": "answer.auto_approved",
  "timestamp": "2024-04-15T10:30:45.123Z",
  "data": {
    "question_id": "550e8400-e29b-41d4-a716-446655440000",
    "answer": "...",
    "confidence": 0.87,
    "source": "ai_auto"
  },
  "metadata": {
    "server_time": "2024-04-15T10:30:45.123Z",
    "ttl_seconds": 3600
  }
}
```

### Connection Lifecycle

```
┌─────────────────────────────────────────────┐
│   Client: New WebSocket(url)                │
└────────────────┬────────────────────────────┘
                 │ (wss connection)
                 ▼
┌─────────────────────────────────────────────┐
│   Server: websocket.accept()                │
│   Register in active_connections            │
└────────────┬────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│   LISTENING (server waits for updates)      │
│                                              │
│   When answer ready:                         │
│   ├─ Manager.broadcast_to_student()         │
│   ├─ Send: {event: "answer.auto_..."}       │
│   └─ Event stored in DB (fallback)          │
└──────────┬───────────────────────────────────┘
           │
           ├─ Student receives msg? 
           │  │ YES → Process update
           │  │ NO  → Connection lost
           │
           ▼
┌──────────────────────────────────────────────┐
│   DISCONNECT                                 │
│   ├─ Unregister from active_connections     │
│   ├─ Close socket                           │
│   └─ Client switches to polling              │
└──────────────────────────────────────────────┘
```

---

## 🔄 FALLBACK POLLING STRATEGY

### When Polling is Used

1. WebSocket connection fails to establish
2. WebSocket connection drops unexpectedly
3. Network switches (mobile: WiFi → LTE)
4. Server firewall blocks WebSocket

### Polling Algorithm (Exponential Backoff)

```python
async def poll_for_answer(question_id: str, config: PollConfig = None):
    """
    Poll with exponential backoff
    
    Config:
    - initial_delay: 1000ms
    - max_delay: 10000ms
    - backoff_factor: 1.5
    - max_attempts: 60 (1 minute total)
    """
    
    if config is None:
        config = PollConfig(
            initial_delay=1000,     # ms
            max_delay=10000,        # ms
            backoff_factor=1.5,
            max_attempts=60
        )
    
    delay = config.initial_delay
    attempt = 0
    
    while attempt < config.max_attempts:
        # Wait before polling
        await asyncio.sleep(delay / 1000)  # Convert to seconds
        attempt += 1
        
        try:
            response = await client.get(f"/api/ai-tutor/answer/{question_id}")
            data = response.json()
            
            # Check if answer is ready
            if data['status'] != 'PENDING':
                return data  # Got answer!
            
            # Not ready yet, increase delay
            delay = min(delay * config.backoff_factor, config.max_delay)
            
        except Exception as e:
            logger.error(f"Poll error: {e}")
            # Continue polling, increase delay
            delay = min(delay * config.backoff_factor, config.max_delay)
    
    raise TimeoutError("Answer not ready within timeout")
```

### Polling Timeline

```
Time    Attempt  Delay (ms)   Status         Action
─────   ───────  ──────────   ────────────   ──────────────
0       -        -            PENDING        Send question
1000    1        1000         PENDING        Wait 1s, poll
2500    2        1500         PENDING        Wait 1.5s, poll
4250    3        2250         PENDING        Wait 2.25s, poll
6937    4        3375         PENDING        Wait 3.375s, poll
...
Variable Auto-adjustment until ready
└─ Total: < 60 seconds

Best case (AUTO_APPROVED): 3-7 seconds (WebSocket)
Worst case (PENDING): 30-60 seconds (polling)
```

### Database Query for Polling

```sql
-- Optimized query for polling
SELECT 
    id,
    status,
    answer_text,
    confidence,
    answer_source,
    student_notified_at
FROM ai_tutor_questions
WHERE id = $1
  AND student_id = $2
  AND status != 'PENDING'  -- Quick exit if no update
LIMIT 1;

-- Index: idx_ai_tutor_status
-- Result: ~1ms query time
```

---

## 📨 EVENT TYPES

### 1. Answer Ready (Auto-Approved)

```json
{
  "event": "answer.auto_approved",
  "timestamp": "2024-04-15T10:30:45.123Z",
  "data": {
    "question_id": "550e8400-e29b-41d4-a716-446655440000",
    "answer": "To solve a recursive problem, you need to identify base case and recursive case. Base: if n == 0 return 1. Recursive: return n * factorial(n-1).",
    "confidence": 0.87,
    "safety_score": 0.96,
    "source": "ai_auto",
    "rag_sources": [
      {
        "document": "CS101 Recursion Lecture",
        "similarity": 0.92
      }
    ]
  }
}
```

**Frontend Display:**
```
✓ AUTO
Answer ready (AI verified)
Confidence: 87%
```

### 2. Provisional Answer (Under Review)

```json
{
  "event": "answer.provisional_ready",
  "timestamp": "2024-04-15T10:30:45.123Z",
  "data": {
    "question_id": "550e8400-e29b-41d4-a716-446655440000",
    "answer": "...",
    "confidence": 0.75,
    "source": "ai_provisional",
    "message": "Quick answer (expert verification in progress)"
  }
}
```

**Frontend Display:**
```
⏳ QUICK
Quick answer (under review)
Expert validation in progress...
```

### 3. Teacher Approval

```json
{
  "event": "answer.approved_by_teacher",
  "timestamp": "2024-04-15T10:35:22.456Z",
  "data": {
    "question_id": "550e8400-e29b-41d4-a716-446655440000",
    "answer": "...",
    "teacher_name": "Dr. Sharma",
    "teacher_feedback": "Great question! Your recursion thinking is correct. Just note that iterative solutions can be more efficient.",
    "source": "teacher_approved"
  }
}
```

**Frontend Display:**
```
✓ APPROVED
Answer approved by teacher
Feedback: Great question! Your recursion thinking...
```

### 4. Answer Rejected

```json
{
  "event": "answer.rejected",
  "timestamp": "2024-04-15T10:40:10.789Z",
  "data": {
    "question_id": "550e8400-e29b-41d4-a716-446655440000",
    "rejection_reason": "The answer assumes O(n) complexity is acceptable, but for n>1000 it could stack overflow. Need to mention iterative approach.",
    "suggestion": "Try rephrasing: 'For acceptable performance, consider iterative approach for large n.'",
    "teacher_name": "Dr. Sharma"
  }
}
```

**Frontend Display:**
```
✗ REJECTED
Answer needs rephrasing
Teacher suggests: Try rephrasing: "For acceptable..."
```

### 5. Queue Position Update

```json
{
  "event": "queue_position_updated",
  "timestamp": "2024-04-15T10:30:50.000Z",
  "data": {
    "question_id": "550e8400-e29b-41d4-a716-446655440000",
    "position": 3,
    "queue_length": 12,
    "estimated_wait_seconds": 180,
    "avg_review_time_min": 3
  }
}
```

**Frontend Display:**
```
👁️ PENDING
Position in queue: 3 of 12
Estimated wait: ~3 minutes
```

---

## ⚠️ ERROR HANDLING

### WebSocket Connection Errors

```python
async def websocket_endpoint(question_id: str, websocket: WebSocket):
    try:
        await websocket.accept()
        await websocket_manager.connect(student_id, websocket)
        
        while True:
            data = await websocket.receive_text()
    
    except WebSocketDisconnect:
        # Normal disconnect (client closed connection)
        await websocket_manager.disconnect(student_id, websocket)
        logger.info(f"Student {student_id} disconnected")
    
    except WebSocketException as e:
        # Protocol error
        logger.error(f"WebSocket error: {e}")
        await websocket_manager.disconnect(student_id, websocket)
    
    except Exception as e:
        # Unexpected error
        logger.error(f"Unexpected error: {e}")
        try:
            await websocket.close(code=1011, reason="Server error")
        except:
            pass
```

### Polling Timeout

```typescript
async function pollWithTimeout(questionId: string, maxWait: number = 60000) {
  const startTime = Date.now();
  let delay = 1000;
  
  while (Date.now() - startTime < maxWait) {
    try {
      const response = await fetch(`/api/ai-tutor/answer/${questionId}`);
      const data = await response.json();
      
      if (data.status !== 'PENDING') {
        return data;  // Success!
      }
      
      delay = Math.min(delay * 1.5, 10000);
      await sleep(delay);
      
    } catch (error) {
      console.warn('Poll error, retrying...', error);
      delay = Math.min(delay * 1.5, 10000);
      await sleep(delay);
    }
  }
  
  // Timeout reached
  throw new Error('Answer not available after 1 minute. Please refresh.');
}
```

### Network Resilience

```typescript
const NetworkAwareAITutor = ({ questionId }) => {
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const { answer, status, wsConnected } = useAITutorAnswer(questionId);
  
  useEffect(() => {
    // Detect network changes
    window.addEventListener('online', () => {
      setConnectionStatus('online');
      // Retry connection if needed
    });
    
    window.addEventListener('offline', () => {
      setConnectionStatus('offline');
      // Switch to polling if WebSocket fails
    });
    
    return () => {
      window.removeEventListener('online', () => {});
      window.removeEventListener('offline', () => {});
    };
  }, []);
  
  return (
    <div>
      <StatusBadge status={status} confidence={answer.confidence} />
      
      {connectionStatus === 'offline' && (
        <Alert type="warning">
          You're offline. Using cached/polling updates.
        </Alert>
      )}
      
      {!wsConnected && connectionStatus === 'online' && (
        <Alert type="info">
          Using fallback polling (slower updates)
        </Alert>
      )}
    </div>
  );
};
```

---

## ⚡ PERFORMANCE & SCALABILITY

### Capacity Planning

```
┌─────────────────┬──────────────┬────────────────┐
│ Metric          │ Target       │ Implementation │
├─────────────────┼──────────────┼────────────────┤
│ Concurrent WS   │ 5,000        │ Redis + HAProxy │
│ Connections     │              │ load balancing  │
├─────────────────┼──────────────┼────────────────┤
│ Msg/sec         │ 10,000       │ Redis Pub/Sub   │
│ (peak)          │              │ event queue     │
├─────────────────┼──────────────┼────────────────┤
│ Answer ready    │ < 7 sec      │ WebSocket       │
│ (auto-approved) │              │ (p99)           │
├─────────────────┼──────────────┼────────────────┤
│ Polling latency │ < 30 sec     │ Exponential     │
│ (p95)           │              │ backoff         │
├─────────────────┼──────────────┼────────────────┤
│ DB query time   │ < 1 ms       │ Indexed status  │
│                 │              │ + student_id    │
├─────────────────┼──────────────┼────────────────┤
│ Memory/conn     │ < 100 KB     │ Lightweight     │
│ (WebSocket)     │              │ event queue     │
└─────────────────┴──────────────┴────────────────┘
```

### Load Testing Script

```python
# Load test: 100 concurrent students asking questions
import asyncio
import websockets
import json
import time

async def simulate_student(student_id: int, question_id: str):
    """Simulate one student connecting and receiving answer"""
    
    try:
        # Connect
        uri = f"wss://lumina.local/api/ai-tutor/ws/{question_id}?token=test_{student_id}"
        
        async with websockets.connect(uri) as websocket:
            print(f"✓ Student {student_id} connected")
            
            start = time.time()
            
            # Wait for answer
            while time.time() - start < 60:
                message = await asyncio.wait_for(
                    websocket.recv(),
                    timeout=10
                )
                
                data = json.loads(message)
                
                if data.get('event') in ['answer.auto_approved', 'answer.provisional_ready']:
                    elapsed = time.time() - start
                    print(f"✓ Student {student_id}: Got answer in {elapsed:.2f}s")
                    return True
    
    except Exception as e:
        print(f"✗ Student {student_id}: {e}")
        return False

async def load_test():
    """Run load test"""
    tasks = [
        simulate_student(i, f"question-{i}")
        for i in range(100)
    ]
    
    results = await asyncio.gather(*tasks)
    success = sum(results)
    print(f"\nResults: {success}/100 successful")

# Run
asyncio.run(load_test())
```

---

## 🚀 DEPLOYMENT CONSIDERATIONS

### Docker Compose Setup

```yaml
version: '3.8'

services:
  # API Server (Multiple instances)
  api-1:
    image: lumina-backend:latest
    ports:
      - "9001:8000"
    environment:
      REDIS_URL: redis://redis:6379
      DATABASE_URL: postgresql://...
    depends_on:
      - redis
      - postgres
  
  api-2:
    image: lumina-backend:latest
    ports:
      - "9002:8000"
    environment:
      REDIS_URL: redis://redis:6379
      DATABASE_URL: postgresql://...
  
  # Redis (for Pub/Sub)
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
  
  # Load Balancer
  haproxy:
    image: haproxy:2.8
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./haproxy.cfg:/usr/local/etc/haproxy/haproxy.cfg
    depends_on:
      - api-1
      - api-2

volumes:
  redis-data:
```

### Nginx Configuration (WebSocket Proxy)

```nginx
upstream lumina_backend {
    server api-1:8000;
    server api-2:8000;
    keepalive 32;
}

server {
    listen 443 ssl http2;
    server_name lumina.ai;
    
    ssl_certificate /etc/ssl/lumina.crt;
    ssl_certificate_key /etc/ssl/lumina.key;
    
    # WebSocket
    location /api/ai-tutor/ws/ {
        proxy_pass http://lumina_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400;  # 24 hours
    }
    
    # Regular API
    location /api/ {
        proxy_pass http://lumina_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Monitoring

```python
# Prometheus metrics
from prometheus_client import Counter, Gauge

# Track WebSocket connections
ws_connections = Gauge(
    'websocket_connections_total',
    'Total active WebSocket connections'
)

# Track events
answer_events = Counter(
    'answer_events_total',
    'Total answer events',
    ['status']  # Labels: auto_approved, provisional, approved, rejected
)

# Track polling
poll_requests = Counter(
    'poll_requests_total',
    'Total polling requests',
    ['status']  # Labels: pending, ready, timeout
)

# Track response times
response_time = Histogram(
    'answer_response_time_seconds',
    'Answer response time',
    ['decision_type']  # Labels: auto, provisional, pending
)
```

---

## ✅ TESTING CHECKLIST

### Unit Tests

- [ ] `test_websocket_connect_authenticated_student.py`
- [ ] `test_websocket_reject_unauthorized.py`
- [ ] `test_websocket_broadcast_to_student.py`
- [ ] `test_polling_exponential_backoff.py`
- [ ] `test_event_storage_for_fallback.py`

### Integration Tests

- [ ] Test auto-approved answer delivery via WebSocket
- [ ] Test provisional answer delivery + background review
- [ ] Test WebSocket disconnect + fallback to polling
- [ ] Test 100 concurrent connections
- [ ] Test message ordering (no race conditions)

### E2E Tests

- [ ] Student connects, asks question, receives auto-approved answer (< 10 sec)
- [ ] Student on mobile network, switches to polling, gets answer
- [ ] Teacher approves answer, student receives update instantly
- [ ] Student has multiple tabs open, both receive updates

---

**Status:** ✅ Ready for Development

