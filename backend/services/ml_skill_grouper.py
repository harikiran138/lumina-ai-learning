"""
Machine Learning-Based Skill Grouper Service
Uses advanced clustering algorithms to create optimal skill groupings based on embeddings and student profiles.
"""

from datetime import datetime
from typing import Dict, List, Any
from loguru import logger
import numpy as np
from sklearn.cluster import KMeans, DBSCAN, AgglomerativeClustering
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from collections import defaultdict

from .base import AnalyticsSubscriber
from .optimized_embedding import OptimizedEmbeddingService

# Support both production and test models
import sys
def get_models():
    """Detect whether we are running in test mode and import appropriate models"""
    if any('pytest' in arg for arg in sys.argv) or 'test_' in __name__:
        from tests.models import (
            TestUser as User,
            TestCourse as Course,
            TestLearningPathway as LearningPathway,
            TestSkillLevel as SkillLevel,
            TestSkill as Skill,
            TestStudentProgress as StudentProgress
        )
    else:
        from models import User, Course, LearningPathway, SkillLevel, Skill, StudentProgress
    return User, Course, LearningPathway, SkillLevel, Skill, StudentProgress

# Get the appropriate models
User, Course, LearningPathway, SkillLevel, Skill, StudentProgress = get_models()


class MLSkillGrouper(AnalyticsSubscriber):
    """
    Uses machine learning algorithms to create optimal skill groupings
    based on semantic similarity, difficulty, and learning patterns.
    """

    def __init__(self, embedding_service: OptimizedEmbeddingService):
        super().__init__()
        self.embedding_service = embedding_service
        self.grouping_cache = {}
        self.cache_ttl = 3600  # 1 hour

        # Clustering parameters
        self.clustering_configs = {
            'kmeans': {
                'n_clusters_range': (2, 8),
                'init': 'k-means++',
                'n_init': 10,
                'max_iter': 300
            },
            'hierarchical': {
                'n_clusters_range': (2, 8),
                'linkage': 'ward'
            },
            'dbscan': {
                'eps_range': (0.3, 0.8),
                'min_samples_range': (2, 5)
            }
        }

        # Feature weights for grouping
        self.feature_weights = {
            'semantic_similarity': 0.4,
            'difficulty': 0.3,
            'prerequisites': 0.2,
            'learning_time': 0.1
        }

    async def create_optimal_groups(
        self,
        skills: List[Dict[str, Any]],
        student_profiles: List[Dict[str, Any]],
        grouping_criteria: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Create optimal skill groups using ML clustering algorithms.

        Args:
            skills: List of skill dictionaries
            student_profiles: List of student profile dictionaries
            grouping_criteria: Criteria for grouping (size, similarity, etc.)

        Returns:
            Dictionary containing groups and metadata
        """
        try:
            criteria = grouping_criteria or self._get_default_criteria()

            # Generate embeddings for skills
            skill_embeddings = await self._generate_skill_embeddings(skills)

            # Create feature matrix
            feature_matrix = await self._create_feature_matrix(
                skills, skill_embeddings, criteria
            )

            # Determine optimal number of clusters
            optimal_clusters = await self._find_optimal_clusters(feature_matrix, criteria)

            # Perform clustering
            clusters = await self._perform_clustering(feature_matrix, optimal_clusters, criteria)

            # Create skill groups
            skill_groups = await self._create_skill_groups(skills, clusters, criteria)

            # Optimize groups based on student profiles
            if student_profiles:
                skill_groups = await self._optimize_for_students(
                    skill_groups, student_profiles, criteria
                )

            # Validate and refine groups
            final_groups = await self._validate_and_refine_groups(skill_groups, criteria)

            result = {
                'groups': final_groups,
                'metadata': {
                    'total_skills': len(skills),
                    'num_groups': len(final_groups),
                    'avg_group_size': np.mean([len(g['skills']) for g in final_groups]),
                    'clustering_method': criteria.get('method', 'kmeans'),
                    'optimal_clusters': optimal_clusters,
                    'created_at': datetime.utcnow().isoformat()
                }
            }

            # Cache result
            cache_key = f"groups_{hash(str(skills) + str(criteria))}"
            self.grouping_cache[cache_key] = result

            logger.info(f"Created {len(final_groups)} optimal skill groups")
            return result

        except Exception as e:
            logger.error(f"Error creating optimal groups: {str(e)}")
            # Fallback to simple grouping
            return await self._create_fallback_groups(skills, criteria)

    async def _generate_skill_embeddings(self, skills: List[Dict[str, Any]]) -> np.ndarray:
        """Generate embeddings for skills."""
        try:
            skill_texts = []
            for skill in skills:
                # Create rich text representation for embedding
                text = f"{skill.get('name', '')} {skill.get('description', '')} "
                text += f"difficulty:{skill.get('difficulty', 0.5)} "
                text += f"category:{skill.get('category', 'general')} "
                text += f"prerequisites:{','.join(skill.get('prerequisites', []))}"
                skill_texts.append(text)

            # Generate embeddings
            embeddings = []
            for text in skill_texts:
                embedding = await self.embedding_service.generate_embedding(text)
                embeddings.append(embedding)

            return np.array(embeddings)

        except Exception as e:
            logger.error(f"Error generating skill embeddings: {str(e)}")
            # Return random embeddings as fallback
            return np.random.rand(len(skills), 384)

    async def _create_feature_matrix(
        self,
        skills: List[Dict[str, Any]],
        embeddings: np.ndarray,
        criteria: Dict[str, Any]
    ) -> np.ndarray:
        """Create comprehensive feature matrix for clustering."""
        try:
            features = []

            for i, skill in enumerate(skills):
                skill_features = []

                # Embedding features (weighted)
                embedding_features = embeddings[i] * self.feature_weights['semantic_similarity']
                skill_features.extend(embedding_features)

                # Difficulty feature
                difficulty = skill.get('difficulty', 0.5)
                skill_features.append(difficulty * self.feature_weights['difficulty'])

                # Prerequisite count
                prereq_count = len(skill.get('prerequisites', []))
                skill_features.append(prereq_count * self.feature_weights['prerequisites'])

                # Estimated learning time
                learning_time = skill.get('estimated_time', 30)  # minutes
                skill_features.append(learning_time * self.feature_weights['learning_time'])

                features.append(skill_features)

            # Normalize features
            scaler = StandardScaler()
            feature_matrix = scaler.fit_transform(np.array(features))

            # Apply PCA if requested
            if criteria.get('use_pca', False):
                pca = PCA(n_components=min(50, feature_matrix.shape[1]))
                feature_matrix = pca.fit_transform(feature_matrix)

            return feature_matrix

        except Exception as e:
            logger.error(f"Error creating feature matrix: {str(e)}")
            return embeddings  # Fallback to embeddings only

    async def _find_optimal_clusters(
        self,
        feature_matrix: np.ndarray,
        criteria: Dict[str, Any]
    ) -> int:
        """Find optimal number of clusters using silhouette analysis."""
        try:
            method = criteria.get('method', 'kmeans')
            max_clusters = min(criteria.get('max_clusters', 6), len(feature_matrix) - 1)

            if max_clusters < 2:
                return 2

            best_score = -1
            optimal_clusters = 2

            for n_clusters in range(2, max_clusters + 1):
                try:
                    if method == 'kmeans':
                        clusterer = KMeans(
                            n_clusters=n_clusters,
                            init='k-means++',
                            n_init=10,
                            max_iter=300,
                            random_state=42
                        )
                    elif method == 'hierarchical':
                        clusterer = AgglomerativeClustering(
                            n_clusters=n_clusters,
                            linkage='ward'
                        )
                    else:
                        continue

                    labels = clusterer.fit_predict(feature_matrix)

                    # Calculate silhouette score
                    if len(set(labels)) > 1:
                        score = silhouette_score(feature_matrix, labels)
                        if score > best_score:
                            best_score = score
                            optimal_clusters = n_clusters

                except Exception as e:
                    logger.warning(f"Error evaluating {n_clusters} clusters: {str(e)}")
                    continue

            logger.info(f"Optimal number of clusters: {optimal_clusters} (score: {best_score:.3f})")
            return optimal_clusters

        except Exception as e:
            logger.error(f"Error finding optimal clusters: {str(e)}")
            return min(4, len(feature_matrix) // 2)

    async def _perform_clustering(
        self,
        feature_matrix: np.ndarray,
        n_clusters: int,
        criteria: Dict[str, Any]
    ) -> np.ndarray:
        """Perform clustering with the specified method."""
        try:
            method = criteria.get('method', 'kmeans')

            if method == 'kmeans':
                clusterer = KMeans(
                    n_clusters=n_clusters,
                    init='k-means++',
                    n_init=10,
                    max_iter=300,
                    random_state=42
                )
            elif method == 'hierarchical':
                clusterer = AgglomerativeClustering(
                    n_clusters=n_clusters,
                    linkage='ward'
                )
            elif method == 'dbscan':
                # Use DBSCAN with automatic parameter selection
                clusterer = DBSCAN(
                    eps=0.5,
                    min_samples=2,
                    metric='euclidean'
                )
            else:
                # Default to K-means
                clusterer = KMeans(n_clusters=n_clusters, random_state=42)

            labels = clusterer.fit_predict(feature_matrix)
            return labels

        except Exception as e:
            logger.error(f"Error performing clustering: {str(e)}")
            # Fallback to random assignment
            return np.random.randint(0, n_clusters, size=len(feature_matrix))

    async def _create_skill_groups(
        self,
        skills: List[Dict[str, Any]],
        cluster_labels: np.ndarray,
        criteria: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Create skill groups from cluster labels."""
        try:
            groups = defaultdict(list)
            skill_indices = defaultdict(list)

            # Group skills by cluster
            for i, label in enumerate(cluster_labels):
                groups[label].append(skills[i])
                skill_indices[label].append(i)

            # Convert to list format
            skill_groups = []
            for label, group_skills in groups.items():
                # Calculate group properties
                difficulties = [s.get('difficulty', 0.5) for s in group_skills]
                categories = [s.get('category', 'general') for s in group_skills]
                prereqs = [s.get('prerequisites', []) for s in group_skills]

                group = {
                    'id': f"group_{label}",
                    'skills': group_skills,
                    'size': len(group_skills),
                    'avg_difficulty': np.mean(difficulties),
                    'categories': list(set(categories)),
                    'total_prerequisites': sum(len(p) for p in prereqs),
                    'estimated_time': sum(s.get('estimated_time', 30) for s in group_skills),
                    'cluster_id': int(label)
                }
                skill_groups.append(group)

            # Sort groups by difficulty
            skill_groups.sort(key=lambda x: x['avg_difficulty'])

            return skill_groups

        except Exception as e:
            logger.error(f"Error creating skill groups: {str(e)}")
            return []

    async def _optimize_for_students(
        self,
        skill_groups: List[Dict[str, Any]],
        student_profiles: List[Dict[str, Any]],
        criteria: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Optimize groups based on student profiles and learning styles."""
        try:
            if not student_profiles:
                return skill_groups

            # Calculate student compatibility scores for each group
            for group in skill_groups:
                compatibility_scores = []

                for profile in student_profiles:
                    score = await self._calculate_student_group_compatibility(
                        group, profile
                    )
                    compatibility_scores.append(score)

                group['avg_student_compatibility'] = np.mean(compatibility_scores)
                group['student_count'] = len(student_profiles)

            # Reorder groups based on compatibility if requested
            if criteria.get('optimize_for_students', False):
                skill_groups.sort(key=lambda x: x['avg_student_compatibility'], reverse=True)

            return skill_groups

        except Exception as e:
            logger.error(f"Error optimizing for students: {str(e)}")
            return skill_groups

    async def _calculate_student_group_compatibility(
        self,
        group: Dict[str, Any],
        student_profile: Dict[str, Any]
    ) -> float:
        """Calculate how well a student fits with a skill group."""
        try:
            compatibility = 0.0

            # Learning style compatibility
            student_style = student_profile.get('learning_style', 'visual')
            group_categories = group.get('categories', [])

            # Simple style matching (can be enhanced with ML)
            if student_style == 'visual' and 'visual' in group_categories:
                compatibility += 0.3
            elif student_style == 'auditory' and 'auditory' in group_categories:
                compatibility += 0.3
            elif student_style == 'kinesthetic' and 'practical' in group_categories:
                compatibility += 0.3

            # Difficulty compatibility
            student_level = student_profile.get('current_level', 0.5)
            group_difficulty = group.get('avg_difficulty', 0.5)
            difficulty_diff = abs(student_level - group_difficulty)

            if difficulty_diff < 0.2:
                compatibility += 0.4
            elif difficulty_diff < 0.4:
                compatibility += 0.2

            # Time availability
            student_time = student_profile.get('available_time', 60)  # minutes
            group_time = group.get('estimated_time', 30)

            if student_time >= group_time:
                compatibility += 0.3
            elif student_time >= group_time * 0.7:
                compatibility += 0.15

            return min(compatibility, 1.0)  # Cap at 1.0

        except Exception as e:
            logger.error(f"Error calculating compatibility: {str(e)}")
            return 0.5

    async def _validate_and_refine_groups(
        self,
        skill_groups: List[Dict[str, Any]],
        criteria: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Validate groups and apply final refinements."""
        try:
            max_size = criteria.get('max_group_size', 5)
            min_size = criteria.get('min_group_size', 1)

            refined_groups = []

            for group in skill_groups:
                group_size = len(group['skills'])

                # Split oversized groups
                if group_size > max_size:
                    subgroups = await self._split_group(group, max_size)
                    refined_groups.extend(subgroups)
                # Merge undersized groups if possible
                elif group_size < min_size and refined_groups:
                    # Try to merge with the last group
                    last_group = refined_groups[-1]
                    if len(last_group['skills']) + group_size <= max_size:
                        last_group['skills'].extend(group['skills'])
                        last_group['size'] = len(last_group['skills'])
                        # Recalculate averages
                        difficulties = [s.get('difficulty', 0.5) for s in last_group['skills']]
                        last_group['avg_difficulty'] = np.mean(difficulties)
                    else:
                        refined_groups.append(group)
                else:
                    refined_groups.append(group)

            return refined_groups

        except Exception as e:
            logger.error(f"Error validating groups: {str(e)}")
            return skill_groups

    async def _split_group(self, group: Dict[str, Any], max_size: int) -> List[Dict[str, Any]]:
        """Split an oversized group into smaller groups."""
        try:
            skills = group['skills']
            subgroups = []

            for i in range(0, len(skills), max_size):
                subgroup_skills = skills[i:i + max_size]
                subgroup = {
                    'id': f"{group['id']}_part{len(subgroups) + 1}",
                    'skills': subgroup_skills,
                    'size': len(subgroup_skills),
                    'avg_difficulty': np.mean([s.get('difficulty', 0.5) for s in subgroup_skills]),
                    'categories': list(set(s.get('category', 'general') for s in subgroup_skills)),
                    'total_prerequisites': sum(len(s.get('prerequisites', [])) for s in subgroup_skills),
                    'estimated_time': sum(s.get('estimated_time', 30) for s in subgroup_skills),
                    'cluster_id': group.get('cluster_id')
                }
                subgroups.append(subgroup)

            return subgroups

        except Exception as e:
            logger.error(f"Error splitting group: {str(e)}")
            return [group]

    async def _create_fallback_groups(
        self,
        skills: List[Dict[str, Any]],
        criteria: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create fallback groups when ML clustering fails."""
        try:
            max_size = criteria.get('max_group_size', 4)
            groups = []

            for i in range(0, len(skills), max_size):
                group_skills = skills[i:i + max_size]
                group = {
                    'id': f"fallback_group_{len(groups) + 1}",
                    'skills': group_skills,
                    'size': len(group_skills),
                    'avg_difficulty': np.mean([s.get('difficulty', 0.5) for s in group_skills]),
                    'categories': list(set(s.get('category', 'general') for s in group_skills)),
                    'total_prerequisites': sum(len(s.get('prerequisites', [])) for s in group_skills),
                    'estimated_time': sum(s.get('estimated_time', 30) for s in group_skills),
                    'cluster_id': -1  # Fallback indicator
                }
                groups.append(group)

            return {
                'groups': groups,
                'metadata': {
                    'total_skills': len(skills),
                    'num_groups': len(groups),
                    'avg_group_size': np.mean([len(g['skills']) for g in groups]),
                    'clustering_method': 'fallback',
                    'optimal_clusters': len(groups),
                    'created_at': datetime.utcnow().isoformat()
                }
            }

        except Exception as e:
            logger.error(f"Error creating fallback groups: {str(e)}")
            return {'groups': [], 'metadata': {}}

    def _get_default_criteria(self) -> Dict[str, Any]:
        """Get default grouping criteria."""
        return {
            'method': 'kmeans',
            'max_clusters': 6,
            'max_group_size': 4,
            'min_group_size': 1,
            'use_pca': False,
            'optimize_for_students': True
        }

    async def get_grouping_history(self, cache_key: str = None) -> Dict[str, Any]:
        """Get grouping history or cached results."""
        try:
            if cache_key and cache_key in self.grouping_cache:
                return self.grouping_cache[cache_key]
            else:
                # Return all cached groupings
                return {
                    'cached_groupings': list(self.grouping_cache.values()),
                    'total_cached': len(self.grouping_cache)
                }

        except Exception as e:
            logger.error(f"Error getting grouping history: {str(e)}")
            return {}


# Global instance
ml_skill_grouper = MLSkillGrouper(None)  # Will be initialized with embedding service
