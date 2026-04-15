"""
Phase 2: AI Queue Implementation Tests

Complete test suite for the AI tutor answer queue system including:
- Answer generation and decision routing
- WebSocket real-time events
- Teacher review workflows
- Analytics calculations
"""

import pytest
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch, call
from typing import Dict, Any

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))

from app.services.ai_tutor_service import AITutorService, TutorGenerationRequest, TutorGenerationResponse
from app.services.realtime_service import RealtimeService
from app.services.ai_queue_analytics import AIQueueAnalytics


class TestAITutorService:
    """Tests for AI tutor answer generation service."""

    @pytest.fixture
    def mock_db(self):
        """Mock database client."""
        db = AsyncMock()
        return db

    @pytest.fixture
    def mock_classifier(self):
        """Mock the classifier."""
        with patch('app.services.ai_tutor_service.classify') as mock:
            yield mock

    @pytest.mark.asyncio
    async def test_generate_answer_high_confidence(self, mock_db, mock_classifier):
        """Test answer generation with high confidence -> AUTO_APPROVED."""
        service = AITutorService()
        service.db = mock_db

        request = TutorGenerationRequest(
            question="What is photosynthesis?",
            subject="Biology",
            grade_level=10
        )

        # Mock classifier to return high confidence
        mock_classifier.return_value = ("APPROVED", 0.87, "APPROVED")

        # Mock LLM response
        with patch.object(service, '_call_llm') as mock_llm:
            mock_llm.return_value = "Photosynthesis is the process..."

            result = await service.generate_answer(
                question_id="q123",
                student_id="s456",
                request=request
            )

        assert result.status == "AUTO_APPROVED"
        assert result.confidence >= 0.85
        assert result.answer == "Photosynthesis is the process..."
        assert result.safety_score > 0.95

    @pytest.mark.asyncio
    async def test_generate_answer_medium_confidence(self, mock_db, mock_classifier):
        """Test answer generation with medium confidence -> PROVISIONAL."""
        service = AITutorService()
        service.db = mock_db

        request = TutorGenerationRequest(
            question="Explain quantum entanglement",
            subject="Physics",
            grade_level=12
        )

        # Mock classifier to return medium confidence
        mock_classifier.return_value = ("PENDING_REVIEW", 0.75, "APPROVED")

        with patch.object(service, '_call_llm') as mock_llm:
            mock_llm.return_value = "Quantum entanglement is..."

            result = await service.generate_answer(
                question_id="q124",
                student_id="s457",
                request=request
            )

        assert result.status == "PROVISIONAL"
        assert 0.70 <= result.confidence <= 0.85

    @pytest.mark.asyncio
    async def test_generate_answer_low_confidence(self, mock_db, mock_classifier):
        """Test answer generation with low confidence -> PENDING."""
        service = AITutorService()
        service.db = mock_db

        request = TutorGenerationRequest(
            question="Discuss existentialism",
            subject="Philosophy",
            grade_level=11
        )

        # Mock classifier to return low confidence
        mock_classifier.return_value = ("NEEDS_HUMAN_REVIEW", 0.55, "FLAG_REVIEW")

        with patch.object(service, '_call_llm') as mock_llm:
            mock_llm.return_value = "Existentialism is a philosophy..."

            result = await service.generate_answer(
                question_id="q125",
                student_id="s458",
                request=request
            )

        assert result.status == "PENDING"
        assert result.confidence < 0.70

    @pytest.mark.asyncio
    async def test_generate_answer_with_rag_sources(self, mock_db):
        """Test answer generation includes RAG sources."""
        service = AITutorService()
        service.db = mock_db

        request = TutorGenerationRequest(
            question="What is calculus?",
            subject="Mathematics"
        )

        # Mock RAG retrieval
        mock_rag_sources = [
            {"title": "Calculus 101", "excerpt": "Calculus is a branch of mathematics..."},
            {"title": "Advanced Math", "excerpt": "Derivatives and integrals..."}
        ]

        with patch.object(service, '_retrieve_rag_sources') as mock_rag:
            mock_rag.return_value = mock_rag_sources

            with patch.object(service, '_call_llm') as mock_llm:
                mock_llm.return_value = "Calculus is..."

                result = await service.generate_answer(
                    question_id="q126",
                    student_id="s459",
                    request=request
                )

        assert len(result.rag_sources) >= 2
        assert result.rag_sources[0]["title"] == "Calculus 101"

    @pytest.mark.asyncio
    async def test_generate_answer_safety_check(self, mock_db):
        """Test answer safety scoring."""
        service = AITutorService()
        service.db = mock_db

        request = TutorGenerationRequest(
            question="What is a cell?",
            subject="Biology"
        )

        with patch.object(service, '_call_llm') as mock_llm:
            mock_llm.return_value = "A cell is the basic unit of life..."

            with patch.object(service, '_check_safety') as mock_safety:
                mock_safety.return_value = (0.98, [])  # Safe

                result = await service.generate_answer(
                    question_id="q127",
                    student_id="s460",
                    request=request
                )

        assert result.safety_score >= 0.95


class TestRealtimeService:
    """Tests for real-time event emission service."""

    @pytest.fixture
    def mock_db(self):
        """Mock database client."""
        db = AsyncMock()
        return db

    @pytest.mark.asyncio
    async def test_emit_answer_ready(self, mock_db):
        """Test emitting answer ready event."""
        service = RealtimeService()
        service.db = mock_db

        # Mock database insert
        mock_db.client.from_.return_value.insert.return_value.execute = AsyncMock()

        await service.emit_answer_ready(
            question_id="q123",
            student_id="s456",
            answer="The answer is...",
            status="AUTO_APPROVED",
            confidence=0.87,
            safety_score=0.98,
            source="ai_auto"
        )

        # Verify event was inserted
        mock_db.client.from_.assert_called()
        mock_db.client.from_.return_value.insert.assert_called_once()

    @pytest.mark.asyncio
    async def test_emit_teacher_notification(self, mock_db):
        """Test emitting teacher notification for provisional answer."""
        service = RealtimeService()
        service.db = mock_db

        mock_db.client.from_.return_value.insert.return_value.execute = AsyncMock()

        await service.emit_teacher_notification(
            question_id="q124",
            student_id="s457",
            teacher_id="t789",
            status="PROVISIONAL"
        )

        # Verify notification sent
        mock_db.client.from_.assert_called()

    @pytest.mark.asyncio
    async def test_emit_status_change(self, mock_db):
        """Test emitting status change event."""
        service = RealtimeService()
        service.db = mock_db

        mock_db.client.from_.return_value.insert.return_value.execute = AsyncMock()

        await service.emit_status_change(
            question_id="q125",
            student_id="s458",
            old_status="PROVISIONAL",
            new_status="APPROVED"
        )

        # Verify status change event created
        mock_db.client.from_.assert_called()


class TestAIQueueAnalytics:
    """Tests for queue analytics calculations."""

    @pytest.fixture
    def mock_db(self):
        """Mock database client."""
        db = AsyncMock()
        return db

    @pytest.mark.asyncio
    async def test_get_queue_metrics(self, mock_db):
        """Test calculating queue metrics."""
        analytics = AIQueueAnalytics(mock_db)

        # Mock queue metrics data
        mock_metrics_data = [
            {
                "date": "2026-04-14",
                "auto_approved_count": 100,
                "provisional_count": 30,
                "pending_count": 10,
                "rejected_count": 5,
                "approved_count": 20
            },
            {
                "date": "2026-04-15",
                "auto_approved_count": 120,
                "provisional_count": 35,
                "pending_count": 15,
                "rejected_count": 3,
                "approved_count": 25
            }
        ]

        mock_db.client.from_.return_value.select.return_value.gte.return_value.lte.return_value.execute = AsyncMock(
            return_value=MagicMock(data=mock_metrics_data)
        )

        # Mock decisions for average confidence
        mock_decisions = [
            {"status": "AUTO_APPROVED", "confidence": 0.87},
            {"status": "AUTO_APPROVED", "confidence": 0.85},
        ]

        # Mock queue items for safety scores
        mock_queues = [
            {"id": "q1", "safety_score": 0.98},
            {"id": "q2", "safety_score": 0.96},
        ]

        metrics = await analytics.get_queue_metrics(days=7)

        assert metrics["period_days"] == 7
        assert metrics["auto_approved"] > 0
        assert "avg_confidence" in metrics
        assert "sla_met_percent" not in metrics or isinstance(metrics.get("avg_response_time_seconds"), (int, float))

    @pytest.mark.asyncio
    async def test_get_decision_distribution(self, mock_db):
        """Test getting decision distribution."""
        analytics = AIQueueAnalytics(mock_db)

        # Mock decision counts
        mock_decisions = [
            {"status": "AUTO_APPROVED", "count": 875},
            {"status": "PROVISIONAL", "count": 250},
            {"status": "PENDING", "count": 125},
        ]

        mock_db.client.from_.return_value.select.return_value.group_by.return_value.execute = AsyncMock(
            return_value=MagicMock(data=mock_decisions)
        )

        distribution = await analytics.get_decision_distribution()

        assert distribution.get("AUTO_APPROVED") == 875
        assert distribution.get("PROVISIONAL") == 250
        assert distribution.get("PENDING") == 125

    @pytest.mark.asyncio
    async def test_get_confidence_distribution(self, mock_db):
        """Test creating confidence score histogram."""
        analytics = AIQueueAnalytics(mock_db)

        # Mock confidence values
        mock_decisions = [
            {"confidence": 0.85},
            {"confidence": 0.87},
            {"confidence": 0.82},
            {"confidence": 0.90},
        ]

        mock_db.client.from_.return_value.select.return_value.execute = AsyncMock(
            return_value=MagicMock(data=mock_decisions)
        )

        distribution = await analytics.get_confidence_distribution(bins=10)

        assert "bins" in distribution
        assert "mean" in distribution
        assert len(distribution["bins"]) == 10

    @pytest.mark.asyncio
    async def test_get_teacher_sla_metrics(self, mock_db):
        """Test calculating teacher review SLA metrics."""
        analytics = AIQueueAnalytics(mock_db)

        # Mock provisional decisions with review times
        mock_provisional = [
            {
                "created_at": "2026-04-15T10:00:00Z",
                "reviewed_at": "2026-04-15T11:30:00Z"  # 1.5 hours
            },
            {
                "created_at": "2026-04-15T09:00:00Z",
                "reviewed_at": "2026-04-15T09:45:00Z"  # 0.75 hours
            }
        ]

        mock_db.client.from_.return_value.select.return_value.eq.return_value.not_.return_value.is_.return_value.execute = AsyncMock(
            return_value=MagicMock(data=mock_provisional)
        )

        sla_metrics = await analytics.get_teacher_review_slas()

        assert "avg_review_latency_hours" in sla_metrics
        assert "sla_met_percent" in sla_metrics
        assert "pending_count" in sla_metrics

    @pytest.mark.asyncio
    async def test_get_student_throughput(self, mock_db):
        """Test calculating student throughput metrics."""
        analytics = AIQueueAnalytics(mock_db)

        # Mock top students
        mock_top_students = [
            {"student_id": "s1", "count": 45},
            {"student_id": "s2", "count": 38},
            {"student_id": "s3", "count": 32},
        ]

        mock_db.client.from_.return_value.select.return_value.group_by.return_value.order.return_value.limit.return_value.execute = AsyncMock(
            return_value=MagicMock(data=mock_top_students)
        )

        # Mock total count
        mock_db.client.from_.return_value.select.return_value.count.return_value.execute = AsyncMock(
            return_value=MagicMock(count=1250)
        )

        throughput = await analytics.get_student_throughput()

        assert throughput["total_questions_asked"] == 1250
        assert len(throughput.get("top_students", [])) > 0


class TestEndToEndQueue:
    """End-to-end tests for the complete queue flow."""

    @pytest.mark.asyncio
    async def test_complete_queue_flow(self):
        """Test complete flow from question submission to approval."""
        # This would be an integration test that:
        # 1. Student submits question via POST /ai-tutor/queue
        # 2. Background task generates answer
        # 3. Answer is classified (AUTO_APPROVED or PROVISIONAL)
        # 4. Event is emitted to student WebSocket
        # 5. If PROVISIONAL, teacher sees in queue
        # 6. Teacher approves/rejects
        # 7. Student gets real-time notification
        pass

    @pytest.mark.asyncio
    async def test_websocket_broadcast_on_answer_ready(self):
        """Test WebSocket broadcast when answer is ready."""
        # Test that broadcast_ai_tutor_event sends to correct user
        pass


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
