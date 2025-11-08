"""
Real-Time Pathway Adapter Service
Provides dynamic learning pathway adaptation based on live student progress and performance data.
"""

import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from loguru import logger
import numpy as np
from sklearn.linear_model import LinearRegression
from collections import defaultdict

from .base import AnalyticsSubscriber
from .skill_graph_service import SkillGraphService
from .realtime_analytics import RealTimeAnalytics
from db import get_db

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


class RealTimePathwayAdapter(AnalyticsSubscriber):
    """
    Adapts learning pathways in real-time based on student performance,
    learning patterns, and environmental factors.
    """

    def __init__(self, skill_graph: SkillGraphService, analytics_service: RealTimeAnalytics):
        super().__init__()
        self.skill_graph = skill_graph
        self.analytics = analytics_service
        self.adaptation_cache = {}
        self.cache_ttl = 300  # 5 minutes

        # Adaptation thresholds
        self.difficulty_thresholds = {
            'easy': 0.8,      # Score threshold for easy content
            'medium': 0.6,    # Score threshold for medium content
            'hard': 0.4       # Score threshold for hard content
        }

        # Learning velocity thresholds (points per minute)
        self.velocity_thresholds = {
            'fast': 0.5,
            'normal': 0.3,
            'slow': 0.1
        }

    async def adapt_pathway(
        self,
        student_id: str,
        current_pathway: Dict[str, Any],
        progress_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Adapt the learning pathway based on real-time progress data.

        Args:
            student_id: The student's ID
            current_pathway: Current pathway structure
            progress_data: Recent progress data

        Returns:
            Adapted pathway with modifications
        """
        try:
            # Get student learning context
            context = await self._get_learning_context(student_id)

            # Analyze current performance
            performance_analysis = await self._analyze_performance(
                student_id, progress_data, context
            )

            # Determine adaptation strategy
            adaptations = await self._determine_adaptations(
                student_id, current_pathway, performance_analysis, context
            )

            # Apply adaptations
            adapted_pathway = await self._apply_adaptations(
                current_pathway, adaptations
            )

            # Cache the adaptation
            cache_key = f"{student_id}_{current_pathway.get('id', 'default')}"
            self.adaptation_cache[cache_key] = {
                'adapted_pathway': adapted_pathway,
                'adaptations': adaptations,
                'timestamp': datetime.utcnow()
            }

            # Log adaptation
            await self._log_adaptation(student_id, adaptations, performance_analysis)

            logger.info(f"Adapted pathway for student {student_id}: {len(adaptations)} changes")
            return adapted_pathway

        except Exception as e:
            logger.error(f"Error adapting pathway for student {student_id}: {str(e)}")
            return current_pathway

    async def _get_learning_context(self, student_id: str) -> Dict[str, Any]:
        """Get comprehensive learning context for the student."""
        try:
            db = next(get_db())

            # Get recent progress (last 24 hours)
            recent_progress = db.query(StudentProgress).filter(
                StudentProgress.student_id == student_id,
                StudentProgress.completed_at >= datetime.utcnow() - timedelta(hours=24)
            ).all()

            # Get current skill levels
            skill_levels = db.query(SkillLevel).filter(
                SkillLevel.student_id == student_id
            ).all()

            # Calculate learning velocity
            velocity = self._calculate_learning_velocity(recent_progress)

            # Get learning pattern
            pattern = await self.analytics.detect_learning_patterns(student_id, None)

            return {
                'recent_progress': recent_progress,
                'skill_levels': skill_levels,
                'learning_velocity': velocity,
                'learning_pattern': pattern,
                'session_count': len(recent_progress),
                'avg_score': np.mean([p.score for p in recent_progress]) if recent_progress else 0
            }

        except Exception as e:
            logger.error(f"Error getting learning context: {str(e)}")
            return {}

    async def _analyze_performance(
        self,
        student_id: str,
        progress_data: Dict[str, Any],
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze current student performance."""
        try:
            current_score = progress_data.get('score', 0)
            time_spent = progress_data.get('time_spent', 0)
            skill_id = progress_data.get('skill_id')

            # Calculate efficiency (score per minute)
            efficiency = current_score / max(time_spent, 1)

            # Compare with historical performance
            historical_avg = context.get('avg_score', 0)
            performance_trend = 'improving' if current_score > historical_avg else 'declining'

            # Assess difficulty perception
            difficulty_perceived = progress_data.get('difficulty_perceived', 0.5)

            # Determine mastery level
            mastery_level = self._determine_mastery_level(current_score, efficiency)

            return {
                'current_score': current_score,
                'efficiency': efficiency,
                'performance_trend': performance_trend,
                'difficulty_perceived': difficulty_perceived,
                'mastery_level': mastery_level,
                'skill_id': skill_id,
                'time_spent': time_spent
            }

        except Exception as e:
            logger.error(f"Error analyzing performance: {str(e)}")
            return {}

    async def _determine_adaptations(
        self,
        student_id: str,
        current_pathway: Dict[str, Any],
        performance_analysis: Dict[str, Any],
        context: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Determine what adaptations to make to the pathway."""
        adaptations = []

        try:
            # Difficulty adjustment
            difficulty_adaptation = await self._adapt_difficulty(
                performance_analysis, current_pathway
            )
            if difficulty_adaptation:
                adaptations.append(difficulty_adaptation)

            # Pacing adjustment
            pacing_adaptation = await self._adapt_pacing(
                performance_analysis, context, current_pathway
            )
            if pacing_adaptation:
                adaptations.append(pacing_adaptation)

            # Content reordering
            reorder_adaptation = await self._adapt_content_order(
                student_id, performance_analysis, current_pathway
            )
            if reorder_adaptation:
                adaptations.append(reorder_adaptation)

            # Remediation insertion
            remediation_adaptation = await self._insert_remediation(
                performance_analysis, current_pathway
            )
            if remediation_adaptation:
                adaptations.append(remediation_adaptation)

        except Exception as e:
            logger.error(f"Error determining adaptations: {str(e)}")

        return adaptations

    async def _adapt_difficulty(
        self,
        performance_analysis: Dict[str, Any],
        current_pathway: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Adapt difficulty based on performance."""
        try:
            score = performance_analysis.get('current_score', 0)
            efficiency = performance_analysis.get('efficiency', 0)

            # Determine new difficulty level
            if score >= self.difficulty_thresholds['easy'] and efficiency > self.velocity_thresholds['fast']:
                new_difficulty = 'advanced'
                reason = 'High performance, ready for advanced content'
            elif score >= self.difficulty_thresholds['medium']:
                new_difficulty = 'current'
                reason = 'Maintaining current difficulty'
            elif score >= self.difficulty_thresholds['hard']:
                new_difficulty = 'easier'
                reason = 'Struggling, reducing difficulty'
            else:
                new_difficulty = 'remedial'
                reason = 'Significant difficulty, remedial content needed'

            if new_difficulty != 'current':
                return {
                    'type': 'difficulty_adjustment',
                    'new_difficulty': new_difficulty,
                    'reason': reason,
                    'trigger_score': score,
                    'trigger_efficiency': efficiency
                }

        except Exception as e:
            logger.error(f"Error adapting difficulty: {str(e)}")

        return None

    async def _adapt_pacing(
        self,
        performance_analysis: Dict[str, Any],
        context: Dict[str, Any],
        current_pathway: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Adapt pacing based on learning velocity."""
        try:
            velocity = context.get('learning_velocity', 0)
            session_count = context.get('session_count', 0)

            if velocity > self.velocity_thresholds['fast'] and session_count > 5:
                new_pacing = 'accelerated'
                reason = 'Fast learner, accelerating pace'
            elif velocity < self.velocity_thresholds['slow']:
                new_pacing = 'slowed'
                reason = 'Slow progress, slowing pace'
            else:
                new_pacing = 'current'
                reason = 'Maintaining current pace'

            if new_pacing != 'current':
                return {
                    'type': 'pacing_adjustment',
                    'new_pacing': new_pacing,
                    'reason': reason,
                    'current_velocity': velocity
                }

        except Exception as e:
            logger.error(f"Error adapting pacing: {str(e)}")

        return None

    async def _adapt_content_order(
        self,
        student_id: str,
        performance_analysis: Dict[str, Any],
        current_pathway: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Reorder content based on current skill levels."""
        try:
            skill_id = performance_analysis.get('skill_id')
            mastery_level = performance_analysis.get('mastery_level')

            if mastery_level == 'mastered' and skill_id:
                # Skip this skill and move to next
                return {
                    'type': 'content_reorder',
                    'action': 'skip_mastered',
                    'skill_id': skill_id,
                    'reason': 'Skill already mastered'
                }
            elif mastery_level == 'struggling' and skill_id:
                # Move struggling skills to earlier position
                return {
                    'type': 'content_reorder',
                    'action': 'prioritize_struggling',
                    'skill_id': skill_id,
                    'reason': 'Skill needs immediate attention'
                }

        except Exception as e:
            logger.error(f"Error adapting content order: {str(e)}")

        return None

    async def _insert_remediation(
        self,
        performance_analysis: Dict[str, Any],
        current_pathway: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Insert remediation content when needed."""
        try:
            score = performance_analysis.get('current_score', 0)
            skill_id = performance_analysis.get('skill_id')

            if score < self.difficulty_thresholds['hard'] and skill_id:
                # Find prerequisite skills that might need remediation
                prerequisites = await self.skill_graph.get_prerequisites(skill_id)

                if prerequisites:
                    return {
                        'type': 'remediation_insertion',
                        'skill_id': skill_id,
                        'prerequisites': prerequisites,
                        'reason': 'Low performance on current skill'
                    }

        except Exception as e:
            logger.error(f"Error inserting remediation: {str(e)}")

        return None

    async def _apply_adaptations(
        self,
        current_pathway: Dict[str, Any],
        adaptations: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Apply the determined adaptations to the pathway."""
        try:
            adapted_pathway = current_pathway.copy()

            for adaptation in adaptations:
                adaptation_type = adaptation.get('type')

                if adaptation_type == 'difficulty_adjustment':
                    adapted_pathway = await self._apply_difficulty_adjustment(
                        adapted_pathway, adaptation
                    )
                elif adaptation_type == 'pacing_adjustment':
                    adapted_pathway = await self._apply_pacing_adjustment(
                        adapted_pathway, adaptation
                    )
                elif adaptation_type == 'content_reorder':
                    adapted_pathway = await self._apply_content_reorder(
                        adapted_pathway, adaptation
                    )
                elif adaptation_type == 'remediation_insertion':
                    adapted_pathway = await self._apply_remediation_insertion(
                        adapted_pathway, adaptation
                    )

            return adapted_pathway

        except Exception as e:
            logger.error(f"Error applying adaptations: {str(e)}")
            return current_pathway

    async def _apply_difficulty_adjustment(
        self,
        pathway: Dict[str, Any],
        adaptation: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Apply difficulty adjustment to pathway."""
        # This would modify skill difficulties in the pathway
        pathway['difficulty_adjusted'] = True
        pathway['difficulty_level'] = adaptation.get('new_difficulty')
        return pathway

    async def _apply_pacing_adjustment(
        self,
        pathway: Dict[str, Any],
        adaptation: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Apply pacing adjustment to pathway."""
        pathway['pacing_adjusted'] = True
        pathway['pacing_mode'] = adaptation.get('new_pacing')
        return pathway

    async def _apply_content_reorder(
        self,
        pathway: Dict[str, Any],
        adaptation: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Apply content reordering to pathway."""
        pathway['content_reordered'] = True
        pathway['reorder_actions'] = pathway.get('reorder_actions', []) + [adaptation]
        return pathway

    async def _apply_remediation_insertion(
        self,
        pathway: Dict[str, Any],
        adaptation: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Apply remediation insertion to pathway."""
        pathway['remediation_inserted'] = True
        pathway['remediation_content'] = pathway.get('remediation_content', []) + [adaptation]
        return pathway

    def _calculate_learning_velocity(self, recent_progress: List) -> float:
        """Calculate learning velocity from recent progress."""
        if not recent_progress:
            return 0.0

        # Calculate points per minute over recent sessions
        total_score = sum(p.score for p in recent_progress)
        total_time = sum(getattr(p, 'time_spent', 1) for p in recent_progress)  # Assume 1 min if not tracked

        return total_score / max(total_time, 1)

    def _determine_mastery_level(self, score: float, efficiency: float) -> str:
        """Determine mastery level based on score and efficiency."""
        if score >= 90 and efficiency > 0.8:
            return 'mastered'
        elif score >= 70:
            return 'proficient'
        elif score >= 50:
            return 'developing'
        else:
            return 'struggling'

    async def _log_adaptation(
        self,
        student_id: str,
        adaptations: List[Dict[str, Any]],
        performance_analysis: Dict[str, Any]
    ):
        """Log adaptation details for analytics."""
        try:
            db = next(get_db())

            # This would typically insert into a realtime_adaptations table
            # For now, we'll just log it
            logger.info(f"Adaptation logged for student {student_id}: {len(adaptations)} changes")

        except Exception as e:
            logger.error(f"Error logging adaptation: {str(e)}")

    async def get_adaptation_history(self, student_id: str) -> List[Dict[str, Any]]:
        """Get adaptation history for a student."""
        try:
            # Return cached adaptations
            student_adaptations = []
            for key, data in self.adaptation_cache.items():
                if key.startswith(f"{student_id}_"):
                    student_adaptations.append({
                        'timestamp': data['timestamp'],
                        'adaptations': data['adaptations']
                    })

            return sorted(student_adaptations, key=lambda x: x['timestamp'], reverse=True)

        except Exception as e:
            logger.error(f"Error getting adaptation history: {str(e)}")
            return []


# Global instance
realtime_pathway_adapter = RealTimePathwayAdapter(None, None)  # Will be initialized with proper services
