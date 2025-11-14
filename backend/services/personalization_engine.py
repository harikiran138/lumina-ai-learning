"""
Personalization Engine for Lumina LMS
Provides adaptive learning recommendations and progress tracking
"""

import logging
import json
import asyncio
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics.pairwise import cosine_similarity
from .llm_service import LLMService
from .vector_store import VectorStore
from .embeddings import EmbeddingService

logger = logging.getLogger(__name__)

class PersonalizationEngine:
    """Handles personalized learning recommendations and progress tracking"""

    def __init__(self):
        self.llm_service = LLMService()
        self.vector_store = VectorStore()
        self.embedding_service = EmbeddingService()
        self.scaler = StandardScaler()
        self.pathway_scorer = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        self._pathway_cache = {}  # Simple in-memory cache
        self._cache_ttl = timedelta(minutes=30)

    async def get_student_progress(self, student_id: str) -> Dict[str, Any]:
        """Get comprehensive student progress overview"""
        # This would query the database for actual progress data
        # For now, return mock data structure
        return {
            "student_id": student_id,
            "courses_enrolled": [],
            "completed_lessons": [],
            "assessment_scores": [],
            "learning_streak": 0,
            "weak_topics": [],
            "strong_topics": [],
            "last_activity": datetime.now().isoformat()
        }

    def _get_cache_key(self, student_id: str, course_id: str, params: Dict[str, Any]) -> str:
        """Generate cache key for pathway"""
        return f"{student_id}:{course_id}:{hash(frozenset(params.items()))}"

    def _get_cached_pathway(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """Get pathway from cache if valid"""
        if cache_key in self._pathway_cache:
            pathway, timestamp = self._pathway_cache[cache_key]
            if datetime.now() - timestamp < self._cache_ttl:
                return pathway
            else:
                del self._pathway_cache[cache_key]
        return None

    def _cache_pathway(self, cache_key: str, pathway: Dict[str, Any]) -> None:
        """Cache a generated pathway"""
        self._pathway_cache[cache_key] = (pathway, datetime.now())

    def _group_skills(self, skills: List[Dict[str, Any]]) -> List[List[Dict[str, Any]]]:
        """Group related skills together based on prerequisites and topics"""
        # Create a graph of skill relationships
        skill_graph = {}
        for skill in skills:
            skill_id = skill['id']
            skill_graph[skill_id] = {
                'skill': skill,
                'related': set()
            }
            
            # Add relationships based on prerequisites
            for prereq in skill.get('prerequisites', []):
                skill_graph[skill_id]['related'].add(prereq)
                if prereq in skill_graph:
                    skill_graph[prereq]['related'].add(skill_id)
            
            # Add relationships based on similar topics
            for other_skill in skills:
                other_id = other_skill['id']
                if other_id != skill_id:
                    topics1 = set(skill.get('topics', []))
                    topics2 = set(other_skill.get('topics', []))
                    if len(topics1 & topics2) / len(topics1 | topics2) > 0.5:  # >50% topic overlap
                        skill_graph[skill_id]['related'].add(other_id)
        
        # Use a simple clustering approach to group related skills
        groups = []
        visited = set()
        
        def dfs(skill_id: str, current_group: List[Dict[str, Any]]) -> None:
            if skill_id in visited:
                return
            visited.add(skill_id)
            current_group.append(skill_graph[skill_id]['skill'])
            for related_id in skill_graph[skill_id]['related']:
                if related_id not in visited:
                    dfs(related_id, current_group)
        
        for skill_id in skill_graph:
            if skill_id not in visited:
                current_group = []
                dfs(skill_id, current_group)
                if current_group:
                    groups.append(current_group)
        
        return groups

    def _extract_pathway_features(self, pathway: Dict[str, Any], student_data: Dict[str, Any]) -> np.ndarray:
        """Extract numerical features from a pathway for ML scoring"""
        features = []
        
        # Complexity features
        features.extend([
            len(pathway.get('lessons', [])),
            len(pathway.get('exercises', [])),
            len(pathway.get('milestones', []))
        ])
        
        # Student-pathway alignment
        weak_topics = set(student_data.get('weak_topics', []))
        strong_topics = set(student_data.get('strong_topics', []))
        all_topics = set([topic for lesson in pathway.get('lessons', []) for topic in lesson.get('topics', [])])
        
        features.extend([
            len(weak_topics.intersection(all_topics)) / max(len(weak_topics), 1),
            len(strong_topics.intersection(all_topics)) / max(len(strong_topics), 1)
        ])
        
        # Learning style match
        style_match = 1.0 if pathway.get('style') == student_data.get('learning_style') else 0.0
        features.append(style_match)
        
        # Difficulty progression
        difficulties = [lesson.get('difficulty', 0) for lesson in pathway.get('lessons', [])]
        features.extend([
            np.mean(difficulties) if difficulties else 0,
            np.std(difficulties) if len(difficulties) > 1 else 0
        ])
        
        return np.array(features).reshape(1, -1)

    def score_pathway(self, pathway: Dict[str, Any], student_data: Dict[str, Any]) -> float:
        """Score a learning pathway using ML model"""
        features = self._extract_pathway_features(pathway, student_data)
        features_scaled = self.scaler.transform(features)
        return float(self.pathway_scorer.predict(features_scaled)[0])

    def rank_pathways(self, pathways: List[Dict[str, Any]], student_data: Dict[str, Any]) -> List[Tuple[Dict[str, Any], float]]:
        """Rank multiple pathways by their scores"""
        scored_pathways = [
            (pathway, self.score_pathway(pathway, student_data))
            for pathway in pathways
        ]
        return sorted(scored_pathways, key=lambda x: x[1], reverse=True)

    def _align_with_objectives(self, pathway: Dict[str, Any], course_objectives: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Align pathway with course learning objectives"""
        if not course_objectives:
            return pathway
            
        # Track coverage of objectives
        objective_coverage = {obj['id']: 0 for obj in course_objectives}
        
        # Map lessons to objectives they cover
        for lesson in pathway.get('lessons', []):
            for objective in course_objectives:
                # Check if lesson covers objective's topics
                lesson_topics = set(lesson.get('topics', []))
                objective_topics = set(objective.get('topics', []))
                if lesson_topics & objective_topics:
                    objective_coverage[objective['id']] += 1
        
        # Add remedial content for uncovered objectives
        uncovered = [obj for obj_id, count in objective_coverage.items() 
                    for obj in course_objectives if obj['id'] == obj_id and count == 0]
        
        if uncovered:
            remedial_lessons = []
            for objective in uncovered:
                remedial_lessons.append({
                    'title': f"Introduction to {objective['name']}",
                    'type': 'remedial',
                    'topics': objective['topics'],
                    'difficulty': 'beginner',
                    'objective_id': objective['id']
                })
            
            # Insert remedial lessons at appropriate points based on prerequisites
            lessons = pathway.get('lessons', [])
            for remedial in remedial_lessons:
                # Find best position based on topic relationships
                for i, lesson in enumerate(lessons):
                    if any(topic in lesson.get('topics', []) for topic in remedial['topics']):
                        lessons.insert(i, remedial)
                        break
                else:
                    lessons.append(remedial)
            
            pathway['lessons'] = lessons
            
        return pathway

    async def generate_learning_pathway(
        self,
        student_id: str,
        course_id: str,
        current_level: str = "beginner",
        objectives: Optional[List[Dict[str, Any]]] = None,
        force_refresh: bool = False
    ) -> Dict[str, Any]:
        """Generate personalized learning pathway with edge case handling and caching"""

        try:
            # Check cache first
            cache_key = self._get_cache_key(student_id, course_id, {
                'level': current_level,
                'objectives': str(objectives) if objectives else None
            })
            
            try:
                if not force_refresh:
                    cached = self._get_cached_pathway(cache_key)
                    if cached:
                        return cached

                # Get student data
                progress = await self.get_student_progress(student_id)
                if not progress:
                    raise ValueError(f"No progress data found for student {student_id}")
            except Exception as e:
                logger.error(f"Error preparing pathway data: {str(e)}")
                progress = {"completed_lessons": [], "weak_topics": [], "strong_topics": []}

            prompt = f"""
Create a personalized learning pathway for student {student_id} in course {course_id}.

Student Profile:
- Current Level: {current_level}
- Completed Lessons: {len(progress.get('completed_lessons', []))}
- Average Assessment Score: {self._calculate_average_score(progress)}
- Weak Topics: {progress.get('weak_topics', [])}
- Strong Topics: {progress.get('strong_topics', [])}

Generate a learning pathway with:
1. Recommended lesson sequence
2. Practice exercises for weak areas
3. Advanced topics for strong areas
4. Estimated completion time
5. Milestones and checkpoints

Format as JSON with keys: lessons, exercises, milestones, estimated_time
"""

            # Generate multiple pathway candidates
            responses = await asyncio.gather(*[
                self.llm_service.generate_response(prompt)
                for _ in range(3)  # Generate 3 candidates
            ])
            
            pathways = []
            for response in responses:
                try:
                    pathway = json.loads(response)
                    pathways.append(pathway)
                except:
                    continue
            
            if not pathways:
                return self._get_default_pathway(course_id)
            
            # Get student data for scoring
            student_data = {
                'weak_topics': progress.get('weak_topics', []),
                'strong_topics': progress.get('strong_topics', []),
                'learning_style': await self._get_learning_style(student_id),
                'current_level': current_level
            }
            
            # Rank pathways and select the best one
            ranked_pathways = self.rank_pathways(pathways, student_data)
            if ranked_pathways:
                best_pathway, score = ranked_pathways[0]
                best_pathway['ml_score'] = score
                return best_pathway
            
            return self._get_default_pathway(course_id)
            
        except Exception as e:
            logger.error(f"Pathway generation failed: {str(e)}")
            return self._get_default_pathway(course_id)

    async def get_adaptive_recommendations(
        self,
        student_id: str,
        recent_performance: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Get adaptive learning recommendations based on recent performance"""

        recommendations = []

        # Analyze performance patterns
        if recent_performance.get('score', 0) < 70:
            recommendations.append({
                "type": "remediation",
                "priority": "high",
                "content": "Review fundamental concepts with additional practice exercises",
                "resources": ["practice_quiz", "video_tutorial", "study_guide"]
            })

        # Check for knowledge gaps
        weak_topics = recent_performance.get('weak_topics', [])
        if weak_topics:
            for topic in weak_topics:
                recommendations.append({
                    "type": "targeted_practice",
                    "priority": "medium",
                    "content": f"Focus on {topic} with specialized exercises",
                    "resources": [f"{topic}_practice", f"{topic}_examples"]
                })

        # Suggest advanced content for strong performers
        if recent_performance.get('score', 0) > 90:
            recommendations.append({
                "type": "advancement",
                "priority": "low",
                "content": "Consider advanced topics or peer teaching opportunities",
                "resources": ["advanced_content", "mentoring_program"]
            })

        # Learning streak encouragement
        streak = recent_performance.get('current_streak', 0)
        if streak > 7:
            recommendations.append({
                "type": "motivation",
                "priority": "low",
                "content": f"Great {streak}-day learning streak! Keep it up!",
                "resources": ["achievement_badge", "streak_rewards"]
            })

        return recommendations

    async def update_progress_tracking(
        self,
        student_id: str,
        activity_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update student progress based on activity"""

        activity_type = activity_data.get('type', '')
        score = activity_data.get('score', 0)
        topic = activity_data.get('topic', '')

        # Calculate progress metrics
        progress_update = {
            "student_id": student_id,
            "activity_type": activity_type,
            "timestamp": datetime.now().isoformat(),
            "score": score,
            "topic": topic,
            "improvement": self._calculate_improvement(student_id, topic, score),
            "next_recommendations": await self.get_adaptive_recommendations(
                student_id, {"score": score, "weak_topics": [topic] if score < 70 else []}
            )
        }

        # Store progress in vector database for semantic search
        progress_text = f"Student {student_id} completed {activity_type} in {topic} with score {score}"
        embedding = await self.embedding_service.generate_embeddings([progress_text])
        if embedding:
            await self.vector_store.store_vectors(
                vectors=embedding,
                metadata={"student_id": student_id, "activity": activity_type, "topic": topic}
            )

        return progress_update

    async def get_similar_students(self, student_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Find students with similar learning patterns using vector similarity"""

        # Get student's progress embedding
        progress = await self.get_student_progress(student_id)
        progress_text = f"Level: {progress.get('level', 'beginner')}, Topics: {progress.get('strong_topics', []) + progress.get('weak_topics', [])}"
        
        embedding = await self.embedding_service.generate_embeddings([progress_text])
        if not embedding:
            return []

        # Search for similar student profiles
        similar = await self.vector_store.search_vectors(
            query_vector=embedding[0],
            limit=limit,
            metadata_filter={"type": "student_profile"}
        )

        return [{"student_id": result["metadata"]["student_id"], "similarity": result["score"]} 
                for result in similar if result["metadata"]["student_id"] != student_id]

    def _calculate_average_score(self, progress: Dict[str, Any]) -> float:
        """Calculate average assessment score"""
        scores = progress.get('assessment_scores', [])
        return sum(scores) / len(scores) if scores else 0.0

    def _calculate_improvement(self, student_id: str, topic: str, current_score: float) -> float:
        """Calculate improvement in a topic"""
        # This would query historical scores from database
        # For now, return mock improvement
        return 5.0  # 5% improvement

    async def _get_learning_style(self, student_id: str) -> str:
        """Get student's learning style preference"""
        # In real implementation, query from student_preferences table
        # For now return default
        return "visual"

    def _get_default_pathway(self, course_id: str) -> Dict[str, Any]:
        """Return default learning pathway"""
        return {
            "lessons": ["Introduction", "Basics", "Intermediate", "Advanced"],
            "exercises": ["Practice Quiz 1", "Practice Quiz 2"],
            "milestones": ["Complete Basics", "Pass Mid-term", "Final Project"],
            "estimated_time": "4 weeks"
        }

    async def get_class_analytics(self, course_id: str) -> Dict[str, Any]:
        """Get class-level analytics for teacher dashboard"""
        # Mock analytics data - in real implementation, query database
        return {
            "course_id": course_id,
            "total_students": 25,
            "average_score": 82,
            "completion_rate": 95,
            "grade_distribution": {"A": 8, "B": 5, "C": 2, "D": 0, "F": 0},
            "top_performers": ["student_1", "student_2", "student_3"],
            "struggling_students": ["student_4", "student_5"],
            "common_weak_topics": ["Quantum Entanglement", "Wave Functions"],
            "engagement_metrics": {
                "average_session_time": 45,
                "total_study_hours": 1200,
                "active_students_today": 20
            }
        }

    async def get_student_analytics(self, student_id: str) -> Dict[str, Any]:
        """Get detailed student analytics"""
        # Mock student analytics - in real implementation, query database
        return {
            "student_id": student_id,
            "overall_mastery": 85,
            "course_progress": 90,
            "current_streak": 12,
            "assessments": [
                {"title": "Ch 1 Quiz", "score": 95, "date": "2024-01-15"},
                {"title": "Midterm", "score": 88, "date": "2024-02-01"},
                {"title": "Final", "score": 92, "date": "2024-02-15"}
            ],
            "topic_mastery": {
                "labels": ["Duality", "Quantization", "Uncertainty", "Entanglement"],
                "data": [95, 88, 82, 90]
            },
            "learning_pattern": "visual",
            "recommended_actions": [
                "Review Uncertainty Principle concepts",
                "Practice more Entanglement problems"
            ]
        }

    async def detect_weaknesses(self, course_id: str) -> Dict[str, Any]:
        """Detect common weaknesses in the course"""
        # Mock weakness detection - in real implementation, analyze assessment data
        return {
            "course_id": course_id,
            "weak_topics": [
                {"topic": "Quantum Entanglement", "failure_rate": 35, "affected_students": 8},
                {"topic": "Wave Functions", "failure_rate": 28, "affected_students": 6},
                {"topic": "Uncertainty Principle", "failure_rate": 22, "affected_students": 4}
            ],
            "recommended_interventions": [
                "Additional video tutorials for Entanglement",
                "Interactive simulations for Wave Functions",
                "Group study sessions for Uncertainty Principle"
            ],
            "overall_class_performance": 78,
            "improvement_trends": "stable"
        }
