"""
Tests for Collaborative Learning Service
"""

import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime

from services.collaborative_learning import CollaborativeLearningService
from services.ml_skill_grouper import MLSkillGrouper
from services.advanced_analytics import AdvancedAnalyticsService


class TestCollaborativeLearningService:
    """Test cases for collaborative learning features."""

    @pytest.fixture
    def mock_ml_grouper(self):
        """Mock ML skill grouper."""
        mock = Mock(spec=MLSkillGrouper)
        return mock

    @pytest.fixture
    def mock_analytics(self):
        """Mock advanced analytics."""
        mock = Mock(spec=AdvancedAnalyticsService)
        return mock

    @pytest.fixture
    def collab_service(self, mock_ml_grouper, mock_analytics):
        """Create collaborative learning service with mocks."""
        service = CollaborativeLearningService(mock_ml_grouper, mock_analytics)
        return service

    @pytest.mark.asyncio
    async def test_create_study_group_success(self, collab_service):
        """Test successful study group creation."""
        course_id = "course_123"
        skill_focus = "algebra"

        with patch.object(collab_service, '_find_potential_members') as mock_find_members, \
             patch.object(collab_service, '_select_optimal_members') as mock_select, \
             patch.object(collab_service, '_create_group_record') as mock_create, \
             patch.object(collab_service, '_send_group_invitations') as mock_send_invites:

            mock_find_members.return_value = [
                {"student_id": "s1", "profile": {"skill_level": 0.5}},
                {"student_id": "s2", "profile": {"skill_level": 0.6}},
                {"student_id": "s3", "profile": {"skill_level": 0.7}}
            ]
            mock_select.return_value = mock_find_members.return_value[:2]
            mock_create.return_value = Mock(id="group_123", name="Test Group", created_at=datetime.utcnow())

            result = await collab_service.create_study_group(course_id, skill_focus)

            assert result["success"] is True
            assert "group_id" in result
            assert result["members"] == mock_select.return_value

    @pytest.mark.asyncio
    async def test_create_study_group_insufficient_members(self, collab_service):
        """Test group creation with insufficient members."""
        course_id = "course_123"

        with patch.object(collab_service, '_find_potential_members') as mock_find:
            mock_find.return_value = [{"student_id": "s1"}]  # Only 1 member

            result = await collab_service.create_study_group(course_id)

            assert result["success"] is False
            assert "Insufficient potential members" in result["error"]

    @pytest.mark.asyncio
    async def test_get_peer_recommendations(self, collab_service):
        """Test peer recommendation generation."""
        student_id = "student_123"

        with patch.object(collab_service, '_get_student_profile') as mock_get_profile, \
             patch.object(collab_service, '_find_potential_peers') as mock_find_peers, \
             patch.object(collab_service, '_score_peers') as mock_score:

            mock_get_profile.return_value = {"avg_skill_level": 0.6}
            mock_find_peers.return_value = [
                {"student_id": "peer1", "profile": {"avg_skill_level": 0.7}},
                {"student_id": "peer2", "profile": {"avg_skill_level": 0.5}}
            ]
            mock_score.return_value = [
                {"student_id": "peer1", "compatibility_score": 0.8},
                {"student_id": "peer2", "compatibility_score": 0.6}
            ]

            recommendations = await collab_service.get_peer_recommendations(student_id)

            assert len(recommendations) == 2
            assert recommendations[0]["compatibility_score"] >= recommendations[1]["compatibility_score"]

    @pytest.mark.asyncio
    async def test_join_study_group_success(self, collab_service):
        """Test successful group joining."""
        student_id = "student_123"
        group_id = "group_123"

        with patch('services.collaborative_learning.get_db') as mock_get_db:
            mock_db = Mock()
            mock_get_db.return_value.__enter__.return_value = mock_db

            # Mock existing group and membership check
            mock_group = Mock()
            mock_group.status = "active"
            mock_group.max_size = 5
            mock_db.query.return_value.filter.return_value.first.return_value = mock_group
            mock_db.query.return_value.filter.return_value.count.return_value = 2  # Current members

            result = await collab_service.join_study_group(student_id, group_id)

            assert result["success"] is True
            assert result["group_id"] == group_id
            mock_db.add.assert_called_once()
            mock_db.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_join_study_group_already_member(self, collab_service):
        """Test joining group when already a member."""
        student_id = "student_123"
        group_id = "group_123"

        with patch('services.collaborative_learning.get_db') as mock_get_db:
            mock_db = Mock()
            mock_get_db.return_value.__enter__.return_value = mock_db

            # Mock existing membership
            mock_membership = Mock()
            mock_db.query.return_value.filter.return_value.first.return_value = mock_membership

            result = await collab_service.join_study_group(student_id, group_id)

            assert result["success"] is False
            assert "Already a member" in result["error"]

    @pytest.mark.asyncio
    async def test_leave_study_group_success(self, collab_service):
        """Test successful group leaving."""
        student_id = "student_123"
        group_id = "group_123"

        with patch('services.collaborative_learning.get_db') as mock_get_db, \
             patch.object(collab_service, '_check_group_health') as mock_check_health, \
             patch.object(collab_service, '_notify_group_members') as mock_notify:

            mock_db = Mock()
            mock_get_db.return_value.__enter__.return_value = mock_db

            # Mock existing membership
            mock_membership = Mock()
            mock_membership.status = "active"
            mock_db.query.return_value.filter.return_value.first.return_value = mock_membership

            result = await collab_service.leave_study_group(student_id, group_id)

            assert result["success"] is True
            assert mock_membership.status == "left"
            assert mock_membership.left_at is not None
            mock_check_health.assert_called_once_with(group_id)

    @pytest.mark.asyncio
    async def test_get_study_groups(self, collab_service):
        """Test getting study groups."""
        with patch('services.collaborative_learning.get_db') as mock_get_db, \
             patch.object(collab_service, '_get_group_members') as mock_get_members:

            mock_db = Mock()
            mock_get_db.return_value.__enter__.return_value = mock_db

            # Mock groups
            mock_groups = [
                Mock(id="g1", course_id="c1", name="Group 1", skill_focus="math",
                     status="active", created_at=datetime.utcnow(), description="Test group"),
                Mock(id="g2", course_id="c1", name="Group 2", skill_focus="science",
                     status="active", created_at=datetime.utcnow(), description="Another group")
            ]
            mock_db.query.return_value.filter.return_value.all.return_value = mock_groups
            mock_get_members.side_effect = [
                [{"student_id": "s1"}, {"student_id": "s2"}],
                [{"student_id": "s3"}]
            ]

            groups = await collab_service.get_study_groups(course_id="c1")

            assert len(groups) == 2
            assert groups[0]["member_count"] == 2
            assert groups[1]["member_count"] == 1

    @pytest.mark.asyncio
    async def test_find_potential_members(self, collab_service):
        """Test finding potential group members."""
        course_id = "course_123"
        skill_focus = "algebra"

        with patch('services.collaborative_learning.get_db') as mock_get_db, \
             patch.object(collab_service, '_get_student_profile') as mock_get_profile, \
             patch.object(collab_service, '_matches_group_criteria') as mock_matches:

            mock_db = Mock()
            mock_get_db.return_value.__enter__.return_value = mock_db

            # Mock pathways
            mock_pathways = [
                Mock(student_id="s1", id="p1"),
                Mock(student_id="s2", id="p2")
            ]
            mock_db.query.return_value.filter.return_value.all.return_value = mock_pathways

            mock_get_profile.side_effect = [
                {"avg_skill_level": 0.6},
                {"avg_skill_level": 0.7}
            ]
            mock_matches.side_effect = [True, False]

            members = await collab_service._find_potential_members(course_id, skill_focus, {})

            assert len(members) == 1  # Only one matches criteria
            assert members[0]["student_id"] == "s1"

    @pytest.mark.asyncio
    async def test_select_optimal_members(self, collab_service):
        """Test optimal member selection."""
        potential_members = [
            {"student_id": "s1", "profile": {}},
            {"student_id": "s2", "profile": {}},
            {"student_id": "s3", "profile": {}},
            {"student_id": "s4", "profile": {}}
        ]

        with patch.object(collab_service, '_find_best_group_match') as mock_find_best:
            mock_find_best.side_effect = [
                potential_members[1],  # Add second member
                potential_members[2],  # Add third member
                None  # Stop adding
            ]

            selected = await collab_service._select_optimal_members(potential_members, {"size": 3})

            assert len(selected) == 3
            assert selected[0] == potential_members[0]  # First member always included

    @pytest.mark.asyncio
    async def test_calculate_peer_compatibility(self, collab_service):
        """Test peer compatibility calculation."""
        profile1 = {
            "avg_skill_level": 0.6,
            "learning_style": "visual",
            "progress_rate": 1.0
        }
        profile2 = {
            "avg_skill_level": 0.7,
            "learning_style": "visual",
            "progress_rate": 1.2
        }

        compatibility = await collab_service._calculate_peer_compatibility(profile1, profile2)

        assert 0 <= compatibility <= 1
        # Should be high compatibility due to similar skill levels and learning styles

    @pytest.mark.asyncio
    async def test_calculate_group_diversity(self, collab_service):
        """Test group diversity calculation."""
        members = [
            {"profile": {"learning_style": "visual", "avg_skill_level": 0.5}},
            {"profile": {"learning_style": "auditory", "avg_skill_level": 0.7}},
            {"profile": {"learning_style": "kinesthetic", "avg_skill_level": 0.6}}
        ]

        diversity = await collab_service._calculate_group_diversity(members)

        assert 0 <= diversity <= 1
        # Should have good diversity with different learning styles

    @pytest.mark.asyncio
    async def test_get_student_profile(self, collab_service):
        """Test student profile retrieval."""
        student_id = "student_123"

        with patch('services.collaborative_learning.get_db') as mock_get_db:
            mock_db = Mock()
            mock_get_db.return_value.__enter__.return_value = mock_db

            # Mock skill levels and progress
            mock_skill_levels = [
                Mock(level=0.6),
                Mock(level=0.7),
                Mock(level=0.8)
            ]
            mock_progress = [
                Mock(score=80, completed_at=datetime.utcnow()),
                Mock(score=85, completed_at=datetime.utcnow())
            ]

            mock_db.query.side_effect = [mock_skill_levels, mock_progress]

            profile = await collab_service._get_student_profile(student_id)

            assert profile["student_id"] == student_id
            assert profile["avg_skill_level"] == 0.7  # Average of skill levels
            assert profile["avg_score"] == 82.5  # Average of scores
            assert profile["skill_count"] == 3

    @pytest.mark.asyncio
    async def test_matches_group_criteria(self, collab_service):
        """Test group criteria matching."""
        profile = {
            "avg_skill_level": 0.6,
            "total_attempts": 10
        }
        criteria = {
            "min_skill_level": 0.4,
            "max_skill_level": 0.8,
            "min_activity": 5
        }

        matches = await collab_service._matches_group_criteria(profile, "algebra", criteria)

        assert matches is True

    @pytest.mark.asyncio
    async def test_matches_group_criteria_fail(self, collab_service):
        """Test group criteria matching failure."""
        profile = {
            "avg_skill_level": 0.3,  # Too low
            "total_attempts": 2  # Too few attempts
        }
        criteria = {
            "min_skill_level": 0.4,
            "min_activity": 5
        }

        matches = await collab_service._matches_group_criteria(profile, "algebra", criteria)

        assert matches is False

    @pytest.mark.asyncio
    async def test_score_peers(self, collab_service):
        """Test peer scoring."""
        student_id = "student_123"
        student_profile = {"avg_skill_level": 0.6}
        potential_peers = [
            {"student_id": "p1", "profile": {"avg_skill_level": 0.7}},
            {"student_id": "p2", "profile": {"avg_skill_level": 0.5}}
        ]

        with patch.object(collab_service, '_calculate_peer_compatibility') as mock_compat, \
             patch.object(collab_service, '_calculate_skill_complementarity') as mock_skill_comp:

            mock_compat.side_effect = [0.8, 0.6]
            mock_skill_comp.side_effect = [0.7, 0.5]

            scored = await collab_service._score_peers(student_id, student_profile, potential_peers, {})

            assert len(scored) == 2
            assert scored[0]["compatibility_score"] >= scored[1]["compatibility_score"]
            assert "compatibility_breakdown" in scored[0]

    @pytest.mark.asyncio
    async def test_calculate_skill_complementarity(self, collab_service):
        """Test skill complementarity calculation."""
        profile1 = {"avg_skill_level": 0.4}  # Lower skill level
        profile2 = {"avg_skill_level": 0.8}  # Higher skill level

        complementarity = await collab_service._calculate_skill_complementarity(profile1, profile2)

        assert complementarity > 0.5  # Should be complementary

    @pytest.mark.asyncio
    async def test_get_group_members(self, collab_service):
        """Test group member retrieval."""
        group_id = "group_123"

        with patch('services.collaborative_learning.get_db') as mock_get_db, \
             patch.object(collab_service, '_get_student_profile') as mock_get_profile:

            mock_db = Mock()
            mock_get_db.return_value.__enter__.return_value = mock_db

            # Mock members
            mock_members = [
                Mock(student_id="s1", joined_at=datetime.utcnow()),
                Mock(student_id="s2", joined_at=datetime.utcnow())
            ]
            mock_db.query.return_value.filter.return_value.all.return_value = mock_members

            mock_get_profile.side_effect = [
                {"skill_level": 0.6},
                {"skill_level": 0.7}
            ]

            members = await collab_service._get_group_members(group_id)

            assert len(members) == 2
            assert members[0]["student_id"] == "s1"
            assert "profile" in members[0]

    def test_get_default_group_criteria(self, collab_service):
        """Test default group criteria."""
        criteria = collab_service._get_default_criteria()

        assert "size" in criteria
        assert "max_size" in criteria
        assert "min_size" in criteria
        assert criteria["optimize_diversity"] is True
