"""
Tests for ML Skill Grouper Service
"""

import pytest
import asyncio
import numpy as np
from unittest.mock import Mock, patch, AsyncMock
from sklearn.cluster import KMeans

from services.ml_skill_grouper import MLSkillGrouper
from services.optimized_embedding import OptimizedEmbeddingService


class TestMLSkillGrouper:
    """Test cases for ML-based skill grouping."""

    @pytest.fixture
    def mock_embedding_service(self):
        """Mock embedding service."""
        mock = Mock(spec=OptimizedEmbeddingService)
        mock.generate_embedding = AsyncMock(return_value=np.random.rand(384))
        return mock

    @pytest.fixture
    def grouper(self, mock_embedding_service):
        """Create grouper instance with mock."""
        grouper = MLSkillGrouper(mock_embedding_service)
        return grouper

    @pytest.mark.asyncio
    async def test_create_optimal_groups_success(self, grouper):
        """Test successful group creation."""
        skills = [
            {"id": "skill_1", "name": "Algebra", "difficulty": 0.5, "category": "math"},
            {"id": "skill_2", "name": "Geometry", "difficulty": 0.6, "category": "math"},
            {"id": "skill_3", "name": "Calculus", "difficulty": 0.8, "category": "math"}
        ]

        student_profiles = [
            {"student_id": "s1", "avg_skill_level": 0.5, "learning_style": "visual"},
            {"student_id": "s2", "avg_skill_level": 0.6, "learning_style": "auditory"}
        ]

        criteria = {"method": "kmeans", "max_clusters": 2}

        with patch.object(grouper, '_generate_skill_embeddings') as mock_gen_embeddings, \
             patch.object(grouper, '_create_feature_matrix') as mock_create_features, \
             patch.object(grouper, '_find_optimal_clusters') as mock_find_clusters, \
             patch.object(grouper, '_perform_clustering') as mock_cluster, \
             patch.object(grouper, '_create_skill_groups') as mock_create_groups, \
             patch.object(grouper, '_validate_and_refine_groups') as mock_validate:

            mock_gen_embeddings.return_value = np.random.rand(3, 384)
            mock_create_features.return_value = np.random.rand(3, 10)
            mock_find_clusters.return_value = 2
            mock_cluster.return_value = np.array([0, 0, 1])
            mock_create_groups.return_value = [
                {"id": "group_0", "skills": [skills[0], skills[1]], "size": 2},
                {"id": "group_1", "skills": [skills[2]], "size": 1}
            ]
            mock_validate.return_value = mock_create_groups.return_value

            result = await grouper.create_optimal_groups(skills, student_profiles, criteria)

            assert "groups" in result
            assert "metadata" in result
            assert len(result["groups"]) == 2
            assert result["metadata"]["total_skills"] == 3

    @pytest.mark.asyncio
    async def test_generate_skill_embeddings(self, grouper, mock_embedding_service):
        """Test skill embedding generation."""
        skills = [
            {"name": "Algebra", "description": "Basic algebra", "difficulty": 0.5},
            {"name": "Geometry", "description": "Geometric concepts", "difficulty": 0.6}
        ]

        embeddings = await grouper._generate_skill_embeddings(skills)

        assert embeddings.shape[0] == 2  # Two skills
        assert embeddings.shape[1] == 384  # Embedding dimension
        assert mock_embedding_service.generate_embedding.call_count == 2

    @pytest.mark.asyncio
    async def test_create_feature_matrix(self, grouper):
        """Test feature matrix creation."""
        skills = [
            {"difficulty": 0.5, "prerequisites": ["prereq1"], "estimated_time": 30},
            {"difficulty": 0.7, "prerequisites": [], "estimated_time": 45}
        ]
        embeddings = np.random.rand(2, 384)

        feature_matrix = await grouper._create_feature_matrix(skills, embeddings, {})

        # Should have embedding features + difficulty + prereqs + time
        expected_features = 384 + 3  # embeddings + 3 additional features
        assert feature_matrix.shape == (2, expected_features)

    @pytest.mark.asyncio
    async def test_find_optimal_clusters(self, grouper):
        """Test optimal cluster finding."""
        feature_matrix = np.random.rand(10, 5)

        with patch('services.ml_skill_grouper.silhouette_score') as mock_silhouette:
            mock_silhouette.return_value = 0.8

            n_clusters = await grouper._find_optimal_clusters(feature_matrix, {"max_clusters": 3})

            assert isinstance(n_clusters, int)
            assert 2 <= n_clusters <= 3

    @pytest.mark.asyncio
    async def test_perform_clustering_kmeans(self, grouper):
        """Test K-means clustering."""
        feature_matrix = np.random.rand(6, 5)
        n_clusters = 3

        labels = await grouper._perform_clustering(feature_matrix, n_clusters, {"method": "kmeans"})

        assert len(labels) == 6
        assert len(set(labels)) <= 3

    @pytest.mark.asyncio
    async def test_create_skill_groups(self, grouper):
        """Test skill group creation from clusters."""
        skills = [
            {"id": "s1", "difficulty": 0.5, "category": "math"},
            {"id": "s2", "difficulty": 0.6, "category": "math"},
            {"id": "s3", "difficulty": 0.8, "category": "science"}
        ]
        cluster_labels = np.array([0, 0, 1])

        groups = await grouper._create_skill_groups(skills, cluster_labels, {})

        assert len(groups) == 2
        assert groups[0]["size"] == 2  # First cluster
        assert groups[1]["size"] == 1  # Second cluster
        assert "avg_difficulty" in groups[0]
        assert "categories" in groups[0]

    @pytest.mark.asyncio
    async def test_optimize_for_students(self, grouper):
        """Test student-based optimization."""
        skill_groups = [
            {"id": "g1", "skills": [{"difficulty": 0.5}], "avg_difficulty": 0.5},
            {"id": "g2", "skills": [{"difficulty": 0.8}], "avg_difficulty": 0.8}
        ]

        student_profiles = [
            {"avg_skill_level": 0.6, "learning_style": "visual"},
            {"avg_skill_level": 0.7, "learning_style": "visual"}
        ]

        with patch.object(grouper, '_calculate_student_group_compatibility') as mock_compat:
            mock_compat.return_value = 0.8

            optimized = await grouper._optimize_for_students(skill_groups, student_profiles, {})

            assert len(optimized) == 2
            assert "avg_student_compatibility" in optimized[0]

    @pytest.mark.asyncio
    async def test_calculate_student_group_compatibility(self, grouper):
        """Test student-group compatibility calculation."""
        group = {
            "avg_difficulty": 0.6,
            "categories": ["math"],
            "estimated_time": 30
        }

        student_profile = {
            "avg_skill_level": 0.5,
            "learning_style": "visual",
            "available_time": 45
        }

        compatibility = await grouper._calculate_student_group_compatibility(group, student_profile)

        assert 0 <= compatibility <= 1

    @pytest.mark.asyncio
    async def test_validate_and_refine_groups(self, grouper):
        """Test group validation and refinement."""
        skill_groups = [
            {"id": "g1", "skills": [{"id": "s1"}, {"id": "s2"}, {"id": "s3"}, {"id": "s4"}, {"id": "s5"}], "size": 5},
            {"id": "g2", "skills": [{"id": "s6"}], "size": 1}
        ]

        refined = await grouper._validate_and_refine_groups(skill_groups, {"max_group_size": 4, "min_group_size": 2})

        # Should split the large group and merge the small one
        total_groups = len(refined)
        assert total_groups >= 2  # At least 2 groups

        # Check sizes
        for group in refined:
            assert group["size"] <= 4
            assert group["size"] >= 2

    @pytest.mark.asyncio
    async def test_split_group(self, grouper):
        """Test group splitting."""
        group = {
            "id": "large_group",
            "skills": [{"id": f"s{i}"} for i in range(6)],
            "size": 6,
            "avg_difficulty": 0.6,
            "categories": ["math"],
            "total_prerequisites": 2,
            "estimated_time": 180
        }

        subgroups = await grouper._split_group(group, 3)

        assert len(subgroups) == 2
        assert all(subgroup["size"] == 3 for subgroup in subgroups)
        assert all("part" in subgroup["id"] for subgroup in subgroups)

    @pytest.mark.asyncio
    async def test_create_fallback_groups(self, grouper):
        """Test fallback group creation."""
        skills = [{"id": "s1"}, {"id": "s2"}, {"id": "s3"}]
        criteria = {"max_group_size": 2}

        result = await grouper._create_fallback_groups(skills, criteria)

        assert "groups" in result
        assert "metadata" in result
        assert len(result["groups"]) >= 1
        assert result["metadata"]["clustering_method"] == "fallback"

    def test_get_default_criteria(self, grouper):
        """Test default criteria retrieval."""
        criteria = grouper._get_default_criteria()

        assert "method" in criteria
        assert "max_clusters" in criteria
        assert "max_group_size" in criteria
        assert "min_group_size" in criteria

    @pytest.mark.asyncio
    async def test_get_grouping_history(self, grouper):
        """Test grouping history retrieval."""
        # Add cached grouping
        cache_key = "test_cache"
        grouper.grouping_cache[cache_key] = {"groups": [], "metadata": {}}

        history = await grouper.get_grouping_history(cache_key)

        assert "groups" in history
        assert "metadata" in history

    @pytest.mark.asyncio
    async def test_get_grouping_history_all(self, grouper):
        """Test getting all grouping history."""
        grouper.grouping_cache = {
            "cache1": {"groups": [1, 2], "metadata": {}},
            "cache2": {"groups": [3, 4], "metadata": {}}
        }

        history = await grouper.get_grouping_history()

        assert "cached_groupings" in history
        assert history["total_cached"] == 2
