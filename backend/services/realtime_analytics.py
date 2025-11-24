"""
Real-time Analytics Service
Handles real-time tracking and analysis of student progress, pathway effectiveness,
and learning patterns using WebSocket connections and time-series data.
"""

import asyncio
from datetime import datetime
from typing import Dict, List, Any, Optional
from loguru import logger
from sqlalchemy.orm import Session
import numpy as np
import pandas as pd
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
            TestSkill as Skill
        )
    else:
        from models import User, Course, LearningPathway, SkillLevel, Skill
    return User, Course, LearningPathway, SkillLevel, Skill

# Get the appropriate models
User, Course, LearningPathway, SkillLevel, Skill = get_models()
from db import get_db
from .base import AnalyticsEvent, AnalyticsSubscriber, AnalyticsPublisher

class RealTimeAnalytics(AnalyticsPublisher):
    def __init__(self):
        super().__init__()
        self.analysis_cache = {}
        self.cache_ttl = 300  # 5 minutes
        self._broadcast_task = None
        
    async def track_student_progress(
        self,
        student_id: str,
        course_id: str,
        skill_id: str,
        progress_data: Dict[str, Any]
    ):
        """Track real-time student progress updates"""
        try:
            # Store progress data
            timestamp = datetime.utcnow()
            
            db = next(get_db())
            # Update skill level
            skill_level = db.query(SkillLevel).filter(
                SkillLevel.student_id == student_id,
                SkillLevel.skill_id == skill_id
            ).first()
            
            if skill_level:
                skill_level.level = progress_data.get('new_level', skill_level.level)
                skill_level.last_assessed = timestamp
            else:
                skill_level = SkillLevel(
                    student_id=student_id,
                    skill_id=skill_id,
                    level=progress_data.get('new_level', 1.0),
                    last_assessed=timestamp
                )
                db.add(skill_level)
                
            db.commit()
            
            # Calculate analytics
            analytics = await self.calculate_progress_analytics(
                student_id,
                course_id,
                skill_id
            )
            
            # Create and broadcast event
            event = AnalyticsEvent(
                event_type='progress_update',
                user_id=student_id,
                timestamp=datetime.utcnow(),
                data={
                    'course_id': course_id,
                    'skill_id': skill_id,
                    'analytics': analytics
                }
            )
            await self.broadcast_event(event)
            
            logger.info(f"Tracked progress for student {student_id} in skill {skill_id}")
            
        except Exception as e:
            logger.error(f"Error tracking student progress: {str(e)}")
            raise
            
    async def calculate_progress_analytics(
        self,
        student_id: str,
        course_id: str,
        skill_id: str
    ) -> Dict[str, Any]:
        """Calculate real-time analytics for student progress"""
        try:
            db = next(get_db())
            
            # Get skill levels and pathway data
            skill_levels = db.query(SkillLevel).filter(
                SkillLevel.student_id == student_id
            ).all()
            
            pathway = db.query(LearningPathway).filter(
                LearningPathway.student_id == student_id,
                LearningPathway.course_id == course_id,
                LearningPathway.status == 'active'
            ).first()
            
            # Calculate metrics
            valid_levels = [s for s in skill_levels if s is not None]  # Filter out None values
            total_skills = len(valid_levels)
            completed_skills = len([s for s in valid_levels if float(s.level) >= 0.8])
            avg_level = np.mean([float(s.level) for s in valid_levels]) if valid_levels else 0
            
            # Calculate learning rate
            if len(skill_levels) >= 2:
                recent_levels = sorted(
                    skill_levels,
                    key=lambda x: x.last_assessed
                )[-2:]
                time_diff = (recent_levels[1].last_assessed - recent_levels[0].last_assessed).total_seconds()
                level_diff = float(recent_levels[1].level) - float(recent_levels[0].level)
                learning_rate = level_diff / time_diff if time_diff > 0 else 0
            else:
                learning_rate = 0
                
            # Analyze pathway effectiveness
            pathway_progress = 0
            if pathway and pathway.pathway_data:
                import json
                pathway_data = json.loads(pathway.pathway_data)
                groups = pathway_data.get('groups', [])
                total_groups = len(groups)
                completed_groups = 0
                for group in groups:
                    # Each element in groups is a list of skill indices
                    # Convert them to actual skill ids
                    skills_in_group = pathway_data.get('skills', [])[group[0]]['id'] # Since each group has one element
                    completed_groups += any(
                        s.skill_id == skills_in_group and float(s.level) >= 0.8
                        for s in skill_levels if s is not None
                    )
                pathway_progress = completed_groups / total_groups if total_groups > 0 else 0
            
            return {
                'total_skills': total_skills,
                'completed_skills': completed_skills,
                'completion_rate': completed_skills / total_skills if total_skills > 0 else 0,
                'average_level': avg_level,
                'learning_rate': learning_rate,
                'pathway_progress': pathway_progress,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error calculating progress analytics: {str(e)}")
            return {}
            
    async def analyze_pathway_effectiveness(
        self,
        course_id: str,
        time_window: int = 7  # days
    ) -> Dict[str, Any]:
        """Analyze pathway effectiveness across all students in a course"""
        try:
            db = next(get_db())
            
            # Get all pathways for the course
            # Get all pathways for the course
            pathways = db.query(LearningPathway).filter(
                LearningPathway.course_id == course_id,
                LearningPathway.status == 'active'
            ).all()
            
            # Get skill levels for all students
            student_ids = [p.student_id for p in pathways]
            if not student_ids:  # Return empty dict if no pathways
                return {}
                
            skill_levels = db.query(SkillLevel).filter(
                SkillLevel.student_id.in_(student_ids)
            ).all()
            
            # Convert to pandas for analysis
            df_levels = pd.DataFrame([
                {
                    'student_id': level.student_id,
                    'skill_id': level.skill_id,
                    'level': float(level.level),
                    'assessed_at': level.last_assessed
                }
                for level in skill_levels if level is not None  # Skip any None values
            ])
            
            if df_levels.empty:
                return {}
                
            # Calculate metrics
            avg_completion_time = df_levels.groupby('student_id')['assessed_at'].agg(
                lambda x: (x.max() - x.min()).total_seconds()
            ).mean()
            
            avg_skill_level = df_levels['level'].mean()
            skill_level_std = df_levels['level'].std()
            
            completion_rates = df_levels.groupby('student_id').agg({
                'level': lambda x: (x >= 0.8).mean()
            })
            
            return {
                'average_completion_time': avg_completion_time,
                'average_skill_level': avg_skill_level,
                'skill_level_std': skill_level_std,
                'completion_rate_mean': completion_rates['level'].mean(),
                'completion_rate_std': completion_rates['level'].std(),
                'total_students': len(student_ids),
                'total_pathways': len(pathways),
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error analyzing pathway effectiveness: {str(e)}")
            return {}
            
    async def detect_learning_patterns(
        self,
        student_id: str,
        course_id: str
    ) -> Dict[str, Any]:
        """Detect patterns in student learning behavior"""
        try:
            db = next(get_db())
            
            # Get skill progression history
            try:
                skill_levels = db.query(SkillLevel).filter(
                    SkillLevel.student_id == student_id
                ).all()
                
                if not skill_levels:
                    return {}
                    
                # Convert to pandas for time series analysis
                df = pd.DataFrame([
                    {
                        'skill_id': level.skill_id,
                        'level': float(level.level),
                        'assessed_at': level.last_assessed
                    }
                    for level in skill_levels if level is not None  # Skip any None values
                ])
                
                if df.empty:  # Return empty dict if no valid records
                    return {}
            except Exception as e:
                logger.error(f"Error getting skill levels in detect_learning_patterns: {str(e)}")
                return {}
            
            df = df.sort_values('assessed_at')
            
            # Calculate learning patterns
            time_diffs = df['assessed_at'].diff().dt.total_seconds()
            level_diffs = df['level'].diff()
            
            # Learning speed patterns
            avg_time_between_levels = time_diffs.mean()
            time_std = time_diffs.std()
            
            # Skill acquisition patterns
            level_jumps = level_diffs[level_diffs > 0.5].count()
            gradual_progress = level_diffs[level_diffs <= 0.5].count()
            
            # Time of day analysis
            df['hour'] = df['assessed_at'].dt.hour
            preferred_hours = df.groupby('hour').size().nlargest(3).index.tolist()
            
            return {
                'avg_time_between_levels': avg_time_between_levels,
                'time_consistency': 1.0 - (time_std / avg_time_between_levels if avg_time_between_levels > 0 else 0),
                'learning_style': 'jump' if level_jumps > gradual_progress else 'gradual',
                'preferred_hours': preferred_hours,
                'total_skills_attempted': len(df),
                'pattern_confidence': min(len(df) / 10.0, 1.0),  # Confidence based on data points
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error detecting learning patterns: {str(e)}")
            return {}
            
    async def generate_insights(
        self,
        student_id: str,
        course_id: str
    ) -> List[Dict[str, Any]]:
        """Generate actionable insights from analytics data"""
        try:
            progress = await self.calculate_progress_analytics(
                student_id,
                course_id,
                None
            )
            patterns = await self.detect_learning_patterns(
                student_id,
                course_id
            )
            
            insights = []
            
            # Analyze completion rate
            if progress.get('completion_rate', 0) < 0.3:
                insights.append({
                    'type': 'warning',
                    'message': 'Course completion rate is low. Consider reviewing earlier topics.',
                    'data': {'completion_rate': progress.get('completion_rate')}
                })
                
            # Analyze learning rate
            if progress.get('learning_rate', 0) < 0.1:
                insights.append({
                    'type': 'suggestion',
                    'message': 'Learning progress has slowed. Consider scheduling a tutor session.',
                    'data': {'learning_rate': progress.get('learning_rate')}
                })
                
            # Analyze learning patterns
            if patterns.get('learning_style') == 'jump':
                insights.append({
                    'type': 'observation',
                    'message': 'You seem to learn in bursts. Try maintaining consistent study sessions.',
                    'data': {'style': 'jump'}
                })
                
            # Time of day optimization
            preferred_hours = patterns.get('preferred_hours', [])
            if preferred_hours:
                insights.append({
                    'type': 'optimization',
                    'message': f'You perform best during hours: {", ".join(map(str, preferred_hours))}',
                    'data': {'preferred_hours': preferred_hours}
                })
                
            return insights
            
        except Exception as e:
            logger.error(f"Error generating insights: {str(e)}")
            return []
            
    async def start_analytics_broadcast(self, interval: int = 60):
        """Start periodic broadcasting of analytics updates"""
        while True:
            try:
                db = next(get_db())
                active_courses = db.query(Course).filter(
                    Course.status == 'active'
                ).all()
                
                for course in active_courses:
                    # Calculate course analytics
                    analytics = await self.analyze_pathway_effectiveness(
                        course.id
                    )
                    
                    if analytics:
                        # Create and broadcast analytics event
                        event = AnalyticsEvent(
                            event_type='course_analytics',
                            user_id='system',
                            timestamp=datetime.utcnow(),
                            data={
                                'course_id': course.id,
                                'analytics': analytics
                            }
                        )
                        await self.broadcast_event(event)
                        
            except Exception as e:
                logger.error(f"Error in analytics broadcast: {str(e)}")
                
            await asyncio.sleep(interval)