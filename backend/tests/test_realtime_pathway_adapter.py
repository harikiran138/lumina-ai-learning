"""
Tests for Real-Time Pathway Adapter Service
"""

import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
import numpy as np
from datetime import datetime, timedelta

from services.realtime_pathway_adapter import RealTimePathwayAdapter
from services.skill_graph_service import SkillGraphService
from services.realtime_analytics import RealTimeAnalytics


class TestRealTimePathwayAdapter:
    """Test cases for real-time pathway adaptation."""

    @pytest.fixture
    def mock_skill_graph(self):
        """Mock skill graph service."""
        mock = Mock(spec=SkillGraphService)
        mock.get_prerequisites = AsyncMock(return_value=['prereq_1', 'prereq_2'])
        return mock

    @pytest.fixture
    def mock_analytics(self):
        """Mock analytics service."""
        mock = Mock(spec=RealTimeAnalytics)
        mock.detect_learning_patterns = AsyncMock(return_value={
            'pattern_type': 'consistent',
            'confidence': 0.8
        })
        return mock

    @pytest.fixture
    def adapter(self, mock_skill_graph, mock_analytics):
        """Create adapter instance with mocks."""
        adapter = RealTimePathwayAdapter(mock_skill_graph, mock_analytics)
        return adapter

    @pytest.mark.asyncio
    async def test_adapt_pathway_success(self, adapter):
        """Test successful pathway adaptation."""
        student_id = "student_123"
        current_pathway = {"id": "pathway_1", "skills": ["skill_1", "skill_2"]}
        progress_data = {
            "skill_id": "skill_1",
            "score": 85,
            "time_spent": 30,
            "difficulty_perceived": 0.6
        }

        with patch.object(adapter, '_get_learning_context') as mock_context, \
             patch.object(adapter, '_analyze_performance') as mock_analyze, \
             patch.object(adapter, '_determine_adaptations') as mock_determine, \
             patch.object(adapter, '_apply_adaptations') as mock_apply, \
             patch.object(adapter, '_log_adaptation') as mock_log:

            mock_context.return_value = {
                'recent_progress': [],
                'skill_levels': [],
                'learning_velocity': 0.5,
                'avg_score': 80
            }
            mock_analyze.return_value = {
                'current_score': 85,
                'efficiency': 2.83,
                'mastery_level': 'proficient'
            }
            mock_determine.return_value = [{'type': 'difficulty_adjustment', 'new_difficulty': 'easier'}]
            mock_apply.return_value = {**current_pathway, 'difficulty_adjusted': True}

            result = await adapter.adapt_pathway(student_id, current_pathway, progress_data)

            assert result['difficulty_adjusted'] is True
            mock_context.assert_called_once_with(student_id)
            mock_analyze.assert_called_once()
            mock_determine.assert_called_once()
            mock_apply.assert_called_once()
            mock_log.assert_called_once()

    @pytest.mark.asyncio
    async def test_adapt_pathway_error_handling(self, adapter):
        """Test error handling in pathway adaptation."""
        student_id = "student_123"
        current_pathway = {"id": "pathway_1"}
        progress_data = {"skill_id": "skill_1", "score": 50}

        with patch.object(adapter, '_get_learning_context', side_effect=Exception("DB Error")):
            result = await adapter.adapt_pathway(student_id, current_pathway, progress_data)

            # Should return original pathway on error
            assert result == current_pathway

    def test_calculate_learning_velocity(self, adapter):
        """Test learning velocity calculation."""
        # Mock progress entries
        progress_entries = [
            Mock(score=80, time_spent=20),
            Mock(score=85, time_spent=25),
            Mock(score=90, time_spent=30)
        ]

        velocity = adapter._calculate_learning_velocity(progress_entries)

        # Expected: total_score / total_time = (80+85+90) / (20+25+30) = 255 / 75 = 3.4
        assert abs(velocity - 3.4) < 0.01

    def test_calculate_learning_velocity_empty(self, adapter):
        """Test learning velocity with no progress."""
        velocity = adapter._calculate_learning_velocity([])
        assert velocity == 0.0

    def test_determine_mastery_level(self, adapter):
        """Test mastery level determination."""
        # Mastered
        assert adapter._determine_mastery_level(95, 1.0) == 'mastered'

        # Proficient
        assert adapter._determine_mastery_level(80, 0.8) == 'proficient'

        # Developing
        assert adapter._determine_mastery_level(60, 0.5) == 'developing'

        # Struggling
        assert adapter._determine_mastery_level(40, 0.3) == 'struggling'

    @pytest.mark.asyncio
    async def test_adapt_difficulty_high_performance(self, adapter):
        """Test difficulty adaptation for high performance."""
        performance_analysis = {
            'current_score': 95,
            'efficiency': 3.0
        }
        current_pathway = {"skills": ["skill_1"]}

        result = await adapter._adapt_difficulty(performance_analysis, current_pathway)

        assert result is not None
        assert result['type'] == 'difficulty_adjustment'
        assert result['new_difficulty'] == 'advanced'

    @pytest.mark.asyncio
    async def test_adapt_difficulty_low_performance(self, adapter):
        """Test difficulty adaptation for low performance."""
        performance_analysis = {
            'current_score': 35,
            'efficiency': 1.0
        }
        current_pathway = {"skills": ["skill_1"]}

        result = await adapter._adapt_difficulty(performance_analysis, current_pathway)

        assert result is not None
        assert result['type'] == 'difficulty_adjustment'
        assert result['new_difficulty'] == 'remedial'

    @pytest.mark.asyncio
    async def test_adapt_pacing_fast_learner(self, adapter):
        """Test pacing adaptation for fast learner."""
        performance_analysis = {'current_score': 90}
        context = {
            'learning_velocity': 0.8,
            'session_count': 10
        }
        current_pathway = {"skills": ["skill_1"]}

        result = await adapter._adapt_pacing(performance_analysis, context, current_pathway)

        assert result is not None
        assert result['type'] == 'pacing_adjustment'
        assert result['new_pacing'] == 'accelerated'

    @pytest.mark.asyncio
    async def test_adapt_pacing_slow_learner(self, adapter):
        """Test pacing adaptation for slow learner."""
        performance_analysis = {'current_score': 60}
        context = {
            'learning_velocity': 0.05,
            'session_count': 5
        }
        current_pathway = {"skills": ["skill_1"]}

        result = await adapter._adapt_pacing(performance_analysis, context, current_pathway)

        assert result is not None
        assert result['type'] == 'pacing_adjustment'
        assert result['new_pacing'] == 'slowed'

    @pytest.mark.asyncio
    async def test_adapt_content_order_mastered_skill(self, adapter):
        """Test content reordering for mastered skill."""
        performance_analysis = {
            'skill_id': 'skill_1',
            'mastery_level': 'mastered'
        }
        current_pathway = {"skills": ["skill_1", "skill_2"]}

        result = await adapter._adapt_content_order("student_123", performance_analysis, current_pathway)

        assert result is not None
        assert result['type'] == 'content_reorder'
        assert result['action'] == 'skip_mastered'

    @pytest.mark.asyncio
    async def test_insert_remediation_low_score(self, adapter):
        """Test remediation insertion for low score."""
        performance_analysis = {
            'current_score': 30,
            'skill_id': 'skill_1'
        }
        current_pathway = {"skills": ["skill_1"]}

        result = await adapter._insert_remediation(performance_analysis, current_pathway)

        assert result is not None
        assert result['type'] == 'remediation_insertion'
        assert 'prerequisites' in result

    @pytest.mark.asyncio
    async def test_apply_adaptations(self, adapter):
        """Test applying adaptations to pathway."""
        current_pathway = {"id": "pathway_1", "skills": ["skill_1"]}
        adaptations = [
            {'type': 'difficulty_adjustment', 'new_difficulty': 'easier'},
            {'type': 'pacing_adjustment', 'new_pacing': 'slowed'}
        ]

        result = await adapter._apply_adaptations(current_pathway, adaptations)

        assert result['difficulty_adjusted'] is True
        assert result['pacing_adjusted'] is True
        assert result['pacing_mode'] == 'slowed'

    @pytest.mark.asyncio
    async def test_get_adaptation_history(self, adapter):
        """Test getting adaptation history."""
        student_id = "student_123"

        # Add some cached adaptations
        adapter.adaptation_cache = {
            f"{student_id}_pathway_1": {
                'adaptations': [{'type': 'difficulty'}],
                'timestamp': datetime.utcnow()
            },
            "other_student_pathway_1": {
                'adaptations': [{'type': 'pacing'}],
                'timestamp': datetime.utcnow()
            }
        }

        history = await adapter.get_adaptation_history(student_id)

        assert len(history) == 1
        assert history[0]['adaptations'][0]['type'] == 'difficulty'

    @pytest.mark.asyncio
    async def test_analyze_performance(self, adapter):
        """Test performance analysis."""
        student_id = "student_123"
        progress_data = {
            "skill_id": "skill_1",
            "score": 75,
            "time_spent": 25,
            "difficulty_perceived": 0.7
        }
        context = {
            'avg_score': 70,
            'session_count': 5
        }

        result = await adapter._analyze_performance(student_id, progress_data, context)

        assert result['current_score'] == 75
        assert result['efficiency'] == 3.0  # 75 / 25
        assert result['performance_trend'] == 'improving'
        assert result['mastery_level'] == 'proficient'
