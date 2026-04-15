# 📋 IMPLEMENTATION ROADMAP - STUDENT ROLE SYSTEM REFACTOR

**Status:** Ready for Development  
**Timeline:** 4-6 weeks (phased)  
**Priority:** CRITICAL (Blocks student experience)

---

## 🎯 PHASE 1: FOUNDATION (Week 1-2)

### 1.1 Database Schema Migration

**File:** `backend/app/database/migrations/002_ai_tutor_enhancements.py`

```sql
-- Step 1: Add new columns to ai_tutor_questions
ALTER TABLE ai_tutor_questions ADD COLUMN (
    confidence FLOAT NOT NULL DEFAULT 0.0,
    safety_score FLOAT NOT NULL DEFAULT 0.0,
    question_type VARCHAR(50) NOT NULL DEFAULT 'unknown',
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    auto_approved BOOLEAN NOT NULL DEFAULT FALSE,
    provisional BOOLEAN NOT NULL DEFAULT FALSE,
    reviewed_by_teacher BOOLEAN NOT NULL DEFAULT FALSE,
    teacher_id UUID REFERENCES users(id),
    teacher_reviewed_at TIMESTAMP,
    teacher_feedback TEXT,
    rag_sources JSONB,
    answer_source VARCHAR(50),
    websocket_event_sent BOOLEAN NOT NULL DEFAULT FALSE,
    websocket_sent_at TIMESTAMP,
    model_confidence_updated BOOLEAN NOT NULL DEFAULT FALSE,
    ai_generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    student_notified_at TIMESTAMP
);

-- Step 2: Create index for faster queries
CREATE INDEX idx_ai_tutor_status ON ai_tutor_questions(status);
CREATE INDEX idx_ai_tutor_auto_approved ON ai_tutor_questions(auto_approved);
CREATE INDEX idx_ai_tutor_student_latest ON ai_tutor_questions(student_id, created_at DESC);
CREATE INDEX idx_ai_tutor_confidence ON ai_tutor_questions(confidence DESC);

-- Step 3: Create metrics table
CREATE TABLE IF NOT EXISTS ai_approval_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID NOT NULL REFERENCES institutions(id),
    question_type VARCHAR(50),
    teacher_agreed BOOLEAN,
    confidence_at_approval FLOAT,
    accuracy_rate FLOAT,
    teacher_approval_count INT DEFAULT 0,
    teacher_rejection_count INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(institution_id, question_type)
);

-- Step 4: Create events table for real-time
CREATE TABLE IF NOT EXISTS ai_tutor_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES ai_tutor_questions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id),
    event_type VARCHAR(50),
    event_data JSONB,
    websocket_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_tutor_events_question ON ai_tutor_events(question_id);
CREATE INDEX idx_ai_tutor_events_student ON ai_tutor_events(student_id, created_at DESC);
```

**Testing:** 
- [ ] Run migration in staging
- [ ] Verify columns exist
- [ ] Check indexes created
- [ ] No data loss

---

### 1.2 Create Configuration Model

**File:** `backend/app/database/models.py` (add to existing)

```python
from sqlalchemy import Column, String, Float, JSON, Boolean
from sqlalchemy.orm import declarative_base

class AIApprovalConfig(Base):
    """Smart TILA Configuration per institution"""
    __tablename__ = "ai_approval_config"
    
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    institution_id: Mapped[UUID] = mapped_column(ForeignKey("institutions.id"))
    
    # Auto-Approval Thresholds
    auto_confidence_threshold: Mapped[float] = mapped_column(Float, default=0.85)
    auto_safety_threshold: Mapped[float] = mapped_column(Float, default=0.95)
    
    # Provisional Thresholds
    provisional_confidence_threshold: Mapped[float] = mapped_column(Float, default=0.70)
    provisional_safety_threshold: Mapped[float] = mapped_column(Float, default=0.85)
    
    # Question types eligible for auto-approval
    auto_approve_question_types: Mapped[list] = mapped_column(
        JSON, 
        default=["factual", "simple_recall"]
    )
    
    # Feedback loop weights
    confidence_increase_on_approval: Mapped[float] = mapped_column(Float, default=0.02)
    confidence_decrease_on_rejection: Mapped[float] = mapped_column(Float, default=0.03)
    
    # Created/Updated
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    institution: Mapped["Institution"] = relationship()
```

---

### 1.3 Create Services Foundation

**File:** `backend/app/services/ai_tutor_service.py` (NEW)

```python
"""
Smart TILA Service
Handles decision engine, notifications, and feedback loop
"""

from typing import Dict, Any, Optional
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.models import (
    AITutorQuestion, AIApprovalConfig, AIApprovalMetrics, AITutorEvent
)

class SmartTILAService:
    """Decision Engine for AI Answer Approval"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def evaluate_answer(
        self,
        confidence: float,
        safety_score: float,
        question_type: str,
        student_mastery: float,
        institution_id: str,
    ) -> Dict[str, Any]:
        """
        Smart decision engine - determines answer approval status
        
        Returns: {
            "decision": "AUTO_APPROVED" | "PROVISIONAL" | "PENDING",
            "reasoning": "Why this decision",
            "recommended_action": "Show immediately" | "Queue for teacher"
        }
        """
        
        # Load configuration
        config = await self._get_config(institution_id)
        
        # Decision logic
        if (confidence >= config.auto_confidence_threshold and 
            safety_score >= config.auto_safety_threshold and
            question_type in config.auto_approve_question_types):
            
            return {
                "decision": "AUTO_APPROVED",
                "reasoning": f"High confidence ({confidence:.2f}) + Safe ({safety_score:.2f})",
                "recommended_action": "Show immediately to student"
            }
        
        elif (confidence >= config.provisional_confidence_threshold and
              safety_score >= config.provisional_safety_threshold):
            
            return {
                "decision": "PROVISIONAL",
                "reasoning": f"Moderate confidence ({confidence:.2f}), queue for review",
                "recommended_action": "Show with caveat + queue for teacher"
            }
        
        else:
            return {
                "decision": "PENDING",
                "reasoning": f"Low confidence ({confidence:.2f}), needs teacher",
                "recommended_action": "Send to teacher queue"
            }
    
    async def record_teacher_feedback(
        self,
        question_type: str,
        teacher_agreed: bool,
        confidence_at_time: float,
        institution_id: str,
    ):
        """Feedback loop - update model weights based on teacher"""
        
        config = await self._get_config(institution_id)
        metrics = await self._get_metrics(question_type, institution_id)
        
        if teacher_agreed:
            # Increase confidence weight
            new_weight = min(
                confidence_at_time + config.confidence_increase_on_approval,
                1.0
            )
            metrics.teacher_approval_count += 1
        else:
            # Decrease confidence weight
            new_weight = max(
                confidence_at_time - config.confidence_decrease_on_rejection,
                0.0
            )
            metrics.teacher_rejection_count += 1
        
        metrics.accuracy_rate = (
            metrics.teacher_approval_count / 
            (metrics.teacher_approval_count + metrics.teacher_rejection_count)
        )
        
        await self.db.commit()
    
    async def _get_config(self, institution_id: str) -> AIApprovalConfig:
        """Get or create config for institution"""
        # Query DB, return config
        pass
    
    async def _get_metrics(self, question_type: str, institution_id: str) -> AIApprovalMetrics:
        """Get or create metrics for question type"""
        # Query DB, return metrics
        pass


class RealtimeNotificationService:
    """Handle WebSocket and event notifications"""
    
    def __init__(self, websocket_manager):
        self.websocket_manager = websocket_manager
    
    async def notify_answer_ready(
        self,
        student_id: str,
        question_id: str,
        answer_text: str,
        decision: str,  # AUTO_APPROVED, PROVISIONAL, etc.
        confidence: float,
    ):
        """Send real-time update to student via WebSocket"""
        
        event_map = {
            "AUTO_APPROVED": "answer.auto_approved",
            "PROVISIONAL": "answer.provisional_ready",
            "APPROVED": "answer.approved_by_teacher",
            "REJECTED": "answer.rejected"
        }
        
        event_type = event_map.get(decision, "answer.update")
        
        # Broadcast via WebSocket
        await self.websocket_manager.broadcast_to_student(
            student_id,
            event_type,
            {
                "question_id": question_id,
                "answer": answer_text,
                "confidence": confidence,
                "decision": decision,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
        # Store event for polling fallback
        await self._store_event(question_id, student_id, event_type)
    
    async def _store_event(self, question_id: str, student_id: str, event_type: str):
        """Store event for polling fallback"""
        # Query DB, insert event
        pass
```

---

### 1.4 Create WebSocket Manager

**File:** `backend/app/utils/websocket_manager.py` (NEW)

```python
"""
WebSocket Connection Manager
Handles real-time connections for student notifications
"""

from typing import Dict, List
from fastapi import WebSocket
import json
import logging

logger = logging.getLogger(__name__)


class WebSocketManager:
    """Manages WebSocket connections per student"""
    
    def __init__(self):
        # Maps: student_id -> List[WebSocket]
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.student_questions: Dict[str, List[str]] = {}
    
    async def connect(self, student_id: str, websocket: WebSocket):
        """Register new WebSocket connection"""
        await websocket.accept()
        
        if student_id not in self.active_connections:
            self.active_connections[student_id] = []
        
        self.active_connections[student_id].append(websocket)
        logger.info(f"Student {student_id} connected (total: {len(self.active_connections[student_id])})")
    
    async def disconnect(self, student_id: str, websocket: WebSocket):
        """Unregister WebSocket connection"""
        if student_id in self.active_connections:
            self.active_connections[student_id].remove(websocket)
            
            if not self.active_connections[student_id]:
                del self.active_connections[student_id]
            
            logger.info(f"Student {student_id} disconnected")
    
    async def broadcast_to_student(
        self, 
        student_id: str, 
        event_type: str, 
        data: dict
    ):
        """Send event to all active connections for student"""
        
        if student_id not in self.active_connections:
            logger.debug(f"No active connections for student {student_id}")
            return
        
        message = {
            "event": event_type,
            "data": data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        disconnected = []
        
        for websocket in self.active_connections[student_id]:
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Error sending to {student_id}: {e}")
                disconnected.append(websocket)
        
        # Clean up disconnected
        for ws in disconnected:
            await self.disconnect(student_id, ws)
    
    def get_connected_students(self) -> int:
        """Return count of connected students"""
        return len(self.active_connections)


# Global instance
websocket_manager = WebSocketManager()
```

---

## 🎯 PHASE 2: ROUTER REFACTORING (Week 2-3)

### 2.1 Refactor `ai_tutor.py` (Student Layer)

**File:** `backend/app/routers/ai_tutor.py` (MODIFIED)

```python
"""
Student-facing AI Tutor API
"""

from fastapi import APIRouter, Depends, WebSocket, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies import get_current_user, get_db
from app.services.ai_tutor_service import SmartTILAService, RealtimeNotificationService
from app.utils.websocket_manager import websocket_manager
from app.database.models import User, AITutorQuestion

router = APIRouter(prefix="/api/ai-tutor", tags=["AI Tutor"])


@router.post("/ask")
async def ask_question(
    request: StudentQuestionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Student asks a question
    
    Response:
    {
        "question_id": "uuid",
        "status": "PENDING",
        "message": "Question submitted",
        "websocket_url": "wss://lumina.ai/api/ai-tutor/ws/{question_id}"
    }
    """
    
    # Validate request
    if not request.question_text or len(request.question_text) < 10:
        raise HTTPException(status_code=400, detail="Question too short")
    
    # Save question to DB (PENDING status)
    question = AITutorQuestion(
        student_id=current_user.id,
        course_id=request.course_id,
        question_text=request.question_text,
        status="PENDING",
        created_at=datetime.utcnow()
    )
    
    db.add(question)
    await db.commit()
    await db.refresh(question)
    
    # Dispatch to background task (AI Engine)
    # This will: generate answer, compute confidence, run guardian agent
    # Then: make decision (AUTO / PROVISIONAL / PENDING)
    # Then: broadcast WebSocket event
    await dispatch_to_ai_engine(
        question_id=str(question.id),
        question_text=request.question_text,
        course_id=request.course_id,
        institution_id=current_user.institution_id
    )
    
    return {
        "question_id": str(question.id),
        "status": "PENDING",
        "message": "Question submitted. Please wait...",
        "websocket_url": f"wss://lumina.ai/api/ai-tutor/ws/{question.id}"
    }


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
        "status": "PENDING" | "AUTO_APPROVED" | "PROVISIONAL" | "APPROVED" | "REJECTED",
        "answer": "string",
        "confidence": 0.87,
        "source": "ai_auto" | "ai_provisional" | "teacher_approved",
        "ready": boolean
    }
    """
    
    # Fetch question (verify ownership)
    question = await db.get(AITutorQuestion, question_id)
    
    if not question or question.student_id != current_user.id:
        raise HTTPException(status_code=404, detail="Question not found")
    
    return {
        "status": question.status,
        "answer": question.answer_text or None,
        "confidence": question.confidence,
        "source": question.answer_source,
        "ready": question.status != "PENDING"
    }


@router.get("/my-questions")
async def get_my_questions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 50
):
    """Get student's questions with pagination"""
    
    stmt = select(AITutorQuestion).where(
        AITutorQuestion.student_id == current_user.id
    ).order_by(
        AITutorQuestion.created_at.desc()
    ).offset(skip).limit(limit)
    
    questions = await db.execute(stmt)
    
    return [
        {
            "id": str(q.id),
            "question": q.question_text,
            "answer": q.answer_text,
            "status": q.status,
            "confidence": q.confidence,
            "created_at": q.created_at.isoformat()
        }
        for q in questions.scalars()
    ]


@router.websocket("/ws/{question_id}")
async def websocket_endpoint(
    question_id: str,
    websocket: WebSocket
):
    """
    WebSocket for real-time answer updates
    
    Receives events:
    - answer.auto_approved
    - answer.provisional_ready
    - answer.approved_by_teacher
    - answer.rejected
    """
    
    # TODO: Verify question belongs to student
    # jwt_token from query params?
    
    await websocket_manager.connect(question_id, websocket)
    
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
            # Could implement heartbeat or client commands here
    except Exception as e:
        await websocket_manager.disconnect(question_id, websocket)


@router.post("/feedback/{answer_id}")
async def rate_answer(
    answer_id: str,
    request: RatingRequest,  # { rating: 1-5, feedback: string }
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Student rates answer quality (for feedback loop)"""
    
    question = await db.get(AITutorQuestion, answer_id)
    
    if not question or question.student_id != current_user.id:
        raise HTTPException(status_code=404)
    
    # Store feedback
    question.student_rating = request.rating
    question.student_feedback = request.feedback
    
    await db.commit()
    
    return {"status": "ok"}
```

---

### 2.2 Refactor `ai_queue.py` (Teacher Layer)

**File:** `backend/app/routers/ai_queue.py` (MODIFIED)

```python
"""
Teacher-facing AI Queue Management
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies import get_current_user, get_db, require_role
from app.services.ai_tutor_service import SmartTILAService, RealtimeNotificationService
from app.database.models import User, AITutorQuestion

router = APIRouter(prefix="/api/ai-queue", tags=["AI Queue"])


@router.get("/queue")
async def get_queue(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    require_role("teacher", "hod")
):
    """
    Teacher's pending questions queue
    
    Shows: PENDING + PROVISIONAL questions from teacher's courses
    """
    
    # Get teacher's courses
    stmt = select(AITutorQuestion).join(
        Course, AITutorQuestion.course_id == Course.id
    ).where(
        Course.teacher_id == current_user.id,
        AITutorQuestion.status.in_(["PENDING", "PROVISIONAL"])
    ).order_by(
        AITutorQuestion.created_at.asc()  # Oldest first
    )
    
    result = await db.execute(stmt)
    questions = result.scalars().all()
    
    return [
        {
            "id": str(q.id),
            "student_name": q.student.name,
            "question": q.question_text,
            "answer": q.answer_text,
            "confidence": q.confidence,
            "status": q.status,
            "created_at": q.created_at.isoformat(),
            "time_pending_sec": (datetime.utcnow() - q.created_at).total_seconds()
        }
        for q in questions
    ]


@router.post("/approve/{question_id}")
async def approve_answer(
    question_id: str,
    request: TeacherApprovalRequest,  # { feedback?: string }
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    require_role("teacher", "hod")
):
    """
    Teacher approves an answer
    
    1. Mark as APPROVED
    2. Store teacher feedback
    3. Update confidence metrics
    4. Notify student via WebSocket
    5. Index answer to RAG
    """
    
    question = await db.get(AITutorQuestion, question_id)
    
    if not question:
        raise HTTPException(status_code=404)
    
    # Verify teacher teaches the course
    course = await db.get(Course, question.course_id)
    if course.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your course")
    
    # Update question
    question.status = "APPROVED"
    question.reviewed_by_teacher = True
    question.teacher_id = current_user.id
    question.teacher_reviewed_at = datetime.utcnow()
    question.teacher_feedback = request.feedback
    
    await db.commit()
    
    # Update metrics (feedback loop)
    tila_service = SmartTILAService(db)
    await tila_service.record_teacher_feedback(
        question_type=question.question_type,
        teacher_agreed=True,
        confidence_at_time=question.confidence,
        institution_id=current_user.institution_id
    )
    
    # Notify student
    notif_service = RealtimeNotificationService(websocket_manager)
    await notif_service.notify_answer_ready(
        student_id=str(question.student_id),
        question_id=str(question.id),
        answer_text=question.answer_text,
        decision="APPROVED",
        confidence=question.confidence
    )
    
    # Index to RAG (async)
    await dispatch_to_rag_indexing(
        question_id=str(question.id),
        question_text=question.question_text,
        answer_text=question.answer_text
    )
    
    return {"status": "approved"}


@router.post("/reject/{question_id}")
async def reject_answer(
    question_id: str,
    request: TeacherRejectionRequest,  # { reason, suggestion }
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    require_role("teacher", "hod")
):
    """
    Teacher rejects an answer
    
    1. Mark as REJECTED
    2. Decrease confidence metrics
    3. Notify student with suggestion
    """
    
    question = await db.get(AITutorQuestion, question_id)
    
    if not question:
        raise HTTPException(status_code=404)
    
    # Update question
    question.status = "REJECTED"
    question.reviewed_by_teacher = True
    question.teacher_id = current_user.id
    question.teacher_reviewed_at = datetime.utcnow()
    question.teacher_feedback = request.reason
    
    await db.commit()
    
    # Update metrics (decrease confidence for this type)
    tila_service = SmartTILAService(db)
    await tila_service.record_teacher_feedback(
        question_type=question.question_type,
        teacher_agreed=False,
        confidence_at_time=question.confidence,
        institution_id=current_user.institution_id
    )
    
    # Notify student
    notif_service = RealtimeNotificationService(websocket_manager)
    await notif_service.notify_answer_ready(
        student_id=str(question.student_id),
        question_id=str(question.id),
        answer_text=None,
        decision="REJECTED",
        confidence=question.confidence
    )
    
    return {"status": "rejected"}


@router.get("/metrics")
async def get_queue_metrics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    require_role("teacher", "hod", "admin")
):
    """
    Queue performance metrics
    
    Returns: {
        "pending_count": 12,
        "avg_response_time_sec": 120,
        "auto_approved_rate": 0.45,
        "teacher_approval_rate": 0.50,
        "rejection_rate": 0.05,
        "model_accuracy": 0.92
    }
    """
    
    # Query aggregates from DB
    # ... implementation
    
    return {
        "pending_count": pending_count,
        "avg_response_time_sec": avg_time,
        "auto_approved_rate": auto_rate,
        "teacher_approval_rate": teacher_approval_rate,
        "rejection_rate": rejection_rate,
        "model_accuracy": accuracy
    }


@router.put("/config")
async def update_approval_config(
    request: AIApprovalConfigRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    require_role("hod", "admin")
):
    """Update auto-approval thresholds (HOD/Admin only)"""
    
    # Fetch or create config
    config = await db.get(
        AIApprovalConfig,
        AIApprovalConfig.institution_id == current_user.institution_id
    )
    
    if not config:
        config = AIApprovalConfig(institution_id=current_user.institution_id)
    
    # Update fields
    config.auto_confidence_threshold = request.min_confidence
    config.auto_safety_threshold = request.min_safety
    config.auto_approve_question_types = request.question_types
    
    await db.commit()
    
    return {"status": "updated"}
```

---

## 🎯 PHASE 3: FRONTEND UPDATES (Week 3-4)

### 3.1 WebSocket Hook

**File:** `frontend/web/src/hooks/useAITutorAnswer.ts` (NEW)

```typescript
import { useState, useEffect, useCallback } from 'react';

interface AnswerUpdate {
  status: 'PENDING' | 'AUTO_APPROVED' | 'PROVISIONAL' | 'APPROVED' | 'REJECTED';
  answer?: string;
  confidence?: number;
  message?: string;
}

export function useAITutorAnswer(questionId: string, options = {}) {
  const [answer, setAnswer] = useState<AnswerUpdate>({
    status: 'PENDING'
  });
  const [wsConnected, setWsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const pollForAnswer = useCallback(async () => {
    let delay = 1000;
    let attempts = 0;
    const maxAttempts = 60;
    
    while (attempts < maxAttempts && answer.status === 'PENDING') {
      await new Promise(r => setTimeout(r, delay));
      
      try {
        const res = await fetch(`/api/ai-tutor/answer/${questionId}`);
        const data = await res.json();
        
        setAnswer({
          status: data.status,
          answer: data.answer,
          confidence: data.confidence,
          message: getStatusMessage(data.status)
        });
        
        setLoading(false);
        
        if (data.status !== 'PENDING') break;
        
        delay = Math.min(delay * 1.5, 10000);  // Exponential backoff
        attempts++;
        
      } catch (error) {
        console.error('Polling error:', error);
        attempts++;
      }
    }
  }, [questionId, answer.status]);
  
  useEffect(() => {
    // Try WebSocket first
    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(
          `${process.env.REACT_APP_WS_URL}/api/ai-tutor/ws/${questionId}`
        );
        
        ws.onopen = () => {
          setWsConnected(true);
          setLoading(false);
        };
        
        ws.onmessage = (event) => {
          const { event: eventType, data } = JSON.parse(event.data);
          
          const statusMap: Record<string, AnswerUpdate['status']> = {
            'answer.auto_approved': 'AUTO_APPROVED',
            'answer.provisional_ready': 'PROVISIONAL',
            'answer.approved_by_teacher': 'APPROVED',
            'answer.rejected': 'REJECTED'
          };
          
          setAnswer({
            status: statusMap[eventType] || 'PENDING',
            answer: data.answer,
            confidence: data.confidence,
            message: getStatusMessage(statusMap[eventType])
          });
        };
        
        ws.onerror = () => {
          setWsConnected(false);
          // Fallback to polling
          pollForAnswer();
        };
        
        ws.onclose = () => setWsConnected(false);
        
        return ws;
        
      } catch (error) {
        console.error('WebSocket error:', error);
        // Fallback to polling
        pollForAnswer();
        return null;
      }
    };
    
    const ws = connectWebSocket();
    return () => ws?.close();
    
  }, [questionId, pollForAnswer]);
  
  return {
    ...answer,
    loading,
    wsConnected,
    isReady: answer.status !== 'PENDING'
  };
}

function getStatusMessage(status: string): string {
  const messages: Record<string, string> = {
    'PENDING': 'Getting expert validation...',
    'AUTO_APPROVED': 'Answer ready (AI verified)',
    'PROVISIONAL': 'Quick answer (under review)',
    'APPROVED': 'Answer approved by teacher',
    'REJECTED': 'Answer needs rephrasing'
  };
  return messages[status] || 'Updating...';
}
```

### 3.2 Status Display Component

**File:** `frontend/web/src/components/AITutorStatusBadge.tsx` (NEW)

```typescript
import React from 'react';

interface StatusBadgeProps {
  status: 'PENDING' | 'AUTO_APPROVED' | 'PROVISIONAL' | 'APPROVED' | 'REJECTED';
  confidence?: number;
  message?: string;
}

export const AITutorStatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  confidence,
  message
}) => {
  const configs = {
    'AUTO_APPROVED': {
      icon: '✓',
      label: 'Auto Verified',
      color: 'bg-green-100 text-green-800',
      badge: '⚡ Instant'
    },
    'PROVISIONAL': {
      icon: '⏳',
      label: 'Under Review',
      color: 'bg-blue-100 text-blue-800',
      badge: '🔄 Real-time'
    },
    'PENDING': {
      icon: '👁️',
      label: 'Being Reviewed',
      color: 'bg-orange-100 text-orange-800',
      badge: '⏱️ Expert'
    },
    'APPROVED': {
      icon: '✓',
      label: 'Approved',
      color: 'bg-green-100 text-green-800',
      badge: '✅ Verified'
    },
    'REJECTED': {
      icon: '✗',
      label: 'Rejected',
      color: 'bg-red-100 text-red-800',
      badge: '❌ Needs Fix'
    }
  };
  
  const config = configs[status];
  
  return (
    <div className={`p-4 rounded-lg border-l-4 ${config.color}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 font-semibold">
          <span className="text-xl">{config.icon}</span>
          <span>{config.label}</span>
        </div>
        <span className="text-xs px-2 py-1 bg-white rounded opacity-70">
          {config.badge}
        </span>
      </div>
      
      {message && (
        <p className="text-sm opacity-75">{message}</p>
      )}
      
      {confidence !== undefined && (
        <div className="mt-2 text-xs">
          <span>Confidence: {(confidence * 100).toFixed(0)}%</span>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div
              className="bg-blue-500 h-2 rounded-full"
              style={{ width: `${confidence * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
```

---

## 🎯 TIMELINE & DEPENDENCIES

```
Week 1-2: DATABASE + SERVICES
├─ Migration scripts
├─ Config model
├─ Smart TILA service
└─ WebSocket manager
    ↓
Week 2-3: ROUTERS REFACTORING
├─ Refactor ai_tutor.py (student)
├─ Refactor ai_queue.py (teacher)
├─ Integration with services
└─ Unit tests
    ↓
Week 3-4: FRONTEND
├─ WebSocket hook
├─ Status components
├─ Polling fallback
└─ Integration tests
    ↓
Week 4-5: AI ENGINE INTEGRATION
├─ Background task dispatcher
├─ Confidence scoring
├─ Guardian validation
└─ Decision engine trigger
    ↓
Week 5-6: TESTING + DEPLOYMENT
├─ Load testing (100 concurrent)
├─ Real-time testing
├─ Staging environment
└─ Production rollout
```

---

## ✅ ACCEPTANCE CRITERIA

- [ ] Auto-approved answers show within 5-7 seconds
- [ ] WebSocket connects successfully in 95% of cases
- [ ] Fallback polling works within 10 seconds
- [ ] Teacher queue shows <5 second refresh
- [ ] Confidence thresholds are configurable per institution
- [ ] Feedback loop updates model weights weekly
- [ ] Student UX clearly indicates answer status
- [ ] No data loss on disconnection
- [ ] System handles 1000+ concurrent students
- [ ] All existing APIs remain backward compatible

---

**Ready for Development**

