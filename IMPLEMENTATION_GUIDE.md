# Student Role System - Implementation Guide

**Status:** Ready for Phase 2 Integration  
**Created:** April 15, 2026  
**Purpose:** Step-by-step guide to align routers with services

---

## 📋 QUICK SUMMARY

**What Changed:**
- ✅ Created `services/ai_queue_service.py` - Teacher queue logic (centralized)
- ✅ Created `services/realtime_service.py` - Event broadcasting (centralized)
- ✅ Project schema documented (STUDENT_SYSTEM_PROJECT_SCHEMA.md)

**What Needs to Change:**
- 🔧 Update `routers/ai_queue.py` - Use AIQueueService instead of inline logic
- 🔧 Update `routers/ai_tutor.py` - Use RealtimeService for event emission
- 🔧 Update `routers/realtime.py` - Integrate RealtimeService callbacks

---

## 🚀 PHASE 2: ROUTER INTEGRATION

### Step 1: Update `routers/ai_queue.py` (Teacher Queue Router)

**Goal:** Remove business logic, delegate to `AIQueueService`

#### Changes needed:

1. **Add import:**
```python
from app.services.ai_queue_service import AIQueueService
```

2. **Replace teacher queue endpoint:**

**BEFORE (inline logic):**
```python
@router.get("/teacher/ai-queue")
async def teacher_queue(current_user: Dict[str, Any] = Depends(get_current_teacher)):
    client = _client()
    role = current_user.get("role")
    rows = client.table("ai_answer_queue").select("*").order("created_at", desc=True).execute().data or []
    # ... lots of filtering logic here ...
```

**AFTER (service delegate):**
```python
@router.get("/teacher/ai-queue")
async def teacher_queue(current_user: Dict[str, Any] = Depends(get_current_teacher)):
    service = AIQueueService()
    result = await service.get_queue(
        teacher_id=str(current_user["id"]),
        role=current_user.get("role", "teacher")
    )
    return result
```

3. **Replace approve endpoint:**

**BEFORE:**
```python
@router.post("/teacher/ai-queue/{queue_id}/approve")
async def approve_queue_item(
    queue_id: str,
    current_user: Dict[str, Any] = Depends(get_current_teacher),
):
    client = _client()
    existing = client.table("ai_answer_queue").select("*").eq("id", queue_id).execute()
    # ... update logic ...
    _safe_update_queue_item(client, queue_id, { ... })
    _bank_verified_answer(client, item, approved_answer, str(current_user.get("id")))
    # ...
```

**AFTER:**
```python
@router.post("/teacher/ai-queue/{queue_id}/approve")
async def approve_queue_item(
    queue_id: str,
    current_user: Dict[str, Any] = Depends(get_current_teacher),
):
    service = AIQueueService()
    try:
        result = await service.approve_answer(
            question_id=queue_id,
            teacher_id=str(current_user["id"]),
            feedback=None
        )
        # Emit real-time event
        realtime = RealtimeService()
        await realtime.emit_answer_approved(
            question_id=queue_id,
            student_id=item.get("student_id"),
            answer=approved_answer,
            teacher_name=current_user.get("full_name", "Teacher")
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
```

4. **Replace reject endpoint:**

**BEFORE:**
```python
@router.post("/teacher/ai-queue/{queue_id}/reject")
async def reject_queue_item(
    queue_id: str,
    body: RejectRequest,
    current_user: Dict[str, Any] = Depends(get_current_teacher),
):
    client = _client()
    _safe_update_queue_item(client, queue_id, {"status": "rejected", ...})
    audit_logger.log(...)
```

**AFTER:**
```python
@router.post("/teacher/ai-queue/{queue_id}/reject")
async def reject_queue_item(
    queue_id: str,
    body: RejectRequest,
    current_user: Dict[str, Any] = Depends(get_current_teacher),
):
    service = AIQueueService()
    try:
        result = await service.reject_answer(
            question_id=queue_id,
            teacher_id=str(current_user["id"]),
            reason=body.teacher_note,
            suggestion=body.suggestion if hasattr(body, 'suggestion') else None
        )
        # Emit rejection event
        realtime = RealtimeService()
        await realtime.emit_answer_rejected(
            question_id=queue_id,
            student_id=item.get("student_id"),
            reason=body.teacher_note,
            teacher_name=current_user.get("full_name", "Teacher")
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
```

---

### Step 2: Update `routers/ai_tutor.py` (Student AI Tutor Router)

**Goal:** Add RealtimeService integration for answer ready events

**Key change:** When AI answer is ready, emit event

```python
from app.services.realtime_service import RealtimeService

# Inside the background answer generation:
async def _generate_ai_answer(question_id: str, request_payload: Dict[str, Any]) -> None:
    """Background task: generate AI answer."""
    
    # ... existing AI generation code ...
    
    # After answer is generated:
    service = AITutorService()
    result = await service.generate_answer(question_id, request_payload)
    
    # NEW: Emit real-time event
    realtime = RealtimeService()
    
    if result.status == "AUTO_APPROVED":
        await realtime.emit_answer_ready(
            question_id=question_id,
            student_id=request_payload.get("student_id"),
            answer=result.answer,
            status="AUTO_APPROVED",
            confidence=result.confidence,
            safety_score=result.safety_score,
            source="ai_auto"
        )
    elif result.status == "PROVISIONAL":
        await realtime.emit_answer_ready(
            question_id=question_id,
            student_id=request_payload.get("student_id"),
            answer=result.answer,
            status="PROVISIONAL",
            confidence=result.confidence,
            source="ai_provisional"
        )
```

---

### Step 3: Update `routers/realtime.py` (WebSocket Router)

**Goal:** Integrate with RealtimeService for event delivery

**Key additions:**

```python
from app.services.realtime_service import RealtimeService

class ConnectionManager:
    """Manages WebSocket connections."""
    
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, user_id: str, websocket: WebSocket):
        """Register connection."""
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
    
    async def disconnect(self, user_id: str, websocket: WebSocket):
        """Unregister connection."""
        self.active_connections[user_id].discard(websocket)
        if not self.active_connections[user_id]:
            del self.active_connections[user_id]
    
    async def broadcast(self, user_id: str, event: Dict[str, Any]):
        """Broadcast event to all user connections."""
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(event)
                except Exception as exc:
                    log.error("websocket_send_failed", error=str(exc))

manager = ConnectionManager()

@router.websocket("/ws/ai-tutor/{question_id}")
async def websocket_endpoint(websocket: WebSocket, question_id: str, token: str):
    # Validate JWT
    user_id = validate_jwt(token)  # Your JWT validation
    
    await manager.connect(user_id, websocket)
    
    try:
        # Keep connection alive
        while True:
            data = await websocket.receive_text()
            # Can handle keepalive PINGs, etc.
    except WebSocketDisconnect:
        await manager.disconnect(user_id, websocket)

# NEW: Method for services to call
async def emit_event_to_user(user_id: str, event: Dict[str, Any]) -> None:
    """Called by services to broadcast events."""
    await manager.broadcast(user_id, event)
```

---

## 📊 INTEGRATION CHECKLIST

### Router Integration
- [ ] `ai_queue.py` line X: Import AIQueueService
- [ ] `ai_queue.py` /teacher/ai-queue: Use service.get_queue()
- [ ] `ai_queue.py` /teacher/ai-queue/{id}/approve: Use service.approve_answer() + emit event
- [ ] `ai_queue.py` /teacher/ai-queue/{id}/reject: Use service.reject_answer() + emit event
- [ ] `ai_queue.py` /teacher/ai-queue/{id}/edit-approve: Use service.edit_approve_answer()
- [ ] `ai_tutor.py` background task: Import RealtimeService, emit_answer_ready()
- [ ] `realtime.py` websocket handler: Accept events from services

### Service Integration
- [ ] AIQueueService methods return correct dict format
- [ ] RealtimeService methods handle event storage
- [ ] Both services log operations (for audit)

### Testing
- [ ] Test student asks question → answer ready event emitted
- [ ] Test teacher approves answer → student receives notification
- [ ] Test WebSocket fallback to polling
- [ ] Test event persistence (database)

---

## 🔗 DATA FLOW AFTER INTEGRATION

### Student Asks Question

```
Frontend
  └─ POST /api/ai-tutor/ask
     └─ Router: ai_tutor.py
        └─ Create question record
        └─ Dispatch background task
        └─ Return question_id
        
Backend (Background)
  └─ _generate_ai_answer()
     └─ AITutorService.generate_answer()
        └─ Call AI engine
        └─ Decision engine
        └─ Update DB
        └─ RealtimeService.emit_answer_ready()
           └─ Create event
           └─ Store in DB
           └─ Broadcast to WebSocket
           
Frontend
  └─ WebSocket receives event
     └─ Update UI
     └─ Show answer to student
```

### Teacher Approves Answer

```
Frontend (Teacher)
  └─ POST /api/ai-queue/{id}/approve
     └─ Router: ai_queue.py
        └─ AIQueueService.approve_answer()
           └─ Update status=APPROVED
           └─ Bank answer
           └─ Log action
        └─ RealtimeService.emit_answer_approved()
           └─ Create approval event
           └─ Broadcast to student
           
Frontend (Student)
  └─ WebSocket receives approval event
     └─ Update UI
     └─ Notify student
```

---

## 🎯 SUCCESS CRITERIA

✅ **After Integration Complete:**

1. **No business logic in routers** - All logic in services
2. **Clear separation** - Router handles HTTP, Service handles logic, Store handles DB
3. **Events working** - Answer ready events broadcast to WebSocket
4. **Polling fallback** - Events stored in DB for polling clients
5. **Teacher workflow** - Approval/rejection triggers student notifications
6. **Metrics tracked** - All operations logged and auditable
7. **No duplicated logic** - AI generation, queue management, events centralized
8. **Database single source of truth** - Status always comes from DB

---

## ⚠️ MIGRATION CHECKLIST

**Before going live:**

- [ ] All utility functions (_normalize_question, _sanitize_prompt, etc.) moved to mixins or base classes
- [ ] No database queries in routers
- [ ] All services have comprehensive docstrings
- [ ] Error handling consistent across services
- [ ] Logging configured (structured logs)
- [ ] Rate limiting configured
- [ ] JWT validation working
- [ ] WebSocket authentication working
- [ ] Polling fallback tested
- [ ] Load testing completed (concurrent users, concurrent questions)

---

## 📚 FILES CREATED/MODIFIED

**New Files:**
- ✅ `services/ai_queue_service.py` (352 lines) - Teacher queue logic
- ✅ `services/realtime_service.py` (407 lines) - Event broadcasting
- ✅ `docs/STUDENT_SYSTEM_PROJECT_SCHEMA.md` (500+ lines) - Architecture documentation

**To Be Modified:**
- 🔧 `routers/ai_queue.py` - Use AIQueueService (remove ~300 lines of logic)
- 🔧 `routers/ai_tutor.py` - Add RealtimeService integration
- 🔧 `routers/realtime.py` - Integrate event callbacks

**Reference:**
- 📖 `services/ai_tutor_service.py` (existing) - Pattern to follow
- 📖 `store/ai_tutor_store.py` (existing) - Data access pattern

---

## 🔄 TIME ESTIMATE

- Phase 2a: Update ai_queue.py → **2 hours**
- Phase 2b: Update ai_tutor.py → **1 hour**
- Phase 2c: Update realtime.py → **1 hour**
- Testing & debugging → **2 hours**
- **Total: ~6 hours**

---

## ❓ COMMON QUESTIONS

**Q: Should old utility functions stay in routers?**  
A: Move to services or shared mixins. Routers should only validate inputs.

**Q: How to handle errors in services?**  
A: Raise ValueError with descriptive message. Router catches and returns HTTPException.

**Q: What about database transactions?**  
A: Services handle this. Use context managers. Supabase doesn't have explicit transactions, but use batch operations when possible.

**Q: How to scale this to multi-process?**  
A: Already designed for it. Use Redis pub/sub in RealtimeService for multi-process event broadcasting.

**Q: What about backwards compatibility?**  
A: Routers maintain same API contracts. Only internal changes made.

