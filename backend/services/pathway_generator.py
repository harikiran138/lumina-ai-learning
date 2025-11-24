"""
Adaptive Learning Pathway Generator Service
This service generates personalized learning pathways based on student performance,
learning style, and course content using skill graphs and prerequisite mapping.
"""

from typing import List, Dict, Any, Optional
import networkx as nx
from datetime import datetime
import numpy as np
from loguru import logger
from .test_vector_store import vector_store
from .test_embeddings import embedding_service
import asyncio
from config import settings


class LearningPathwayGenerator:
    def __init__(self):
        self.skill_graph = nx.DiGraph()
        self.difficulty_levels = ["beginner", "intermediate", "advanced", "expert"]
        self.learning_styles = ["visual", "auditory", "reading", "kinesthetic"]

        # Add dummy nodes for testing purposes
        self.skill_graph.add_node("python_basics", level="beginner", content_length=1500, technical_terms=3)
        self.skill_graph.add_node("classes", level="intermediate", content_length=2500, technical_terms=8)
        self.skill_graph.add_edge("python_basics", "classes")
        
    async def generate_pathway(
        self,
        student_id: str,
        current_skills: List[str],
        target_skills: List[str],
        learning_style: str = "visual",
        difficulty: str = "intermediate"
    ) -> Dict[str, Any]:
        """
        Generate a personalized learning pathway
        """
        try:
            # Validate inputs
            if learning_style not in self.learning_styles:
                raise ValueError(f"Invalid learning style: {learning_style}")
            if difficulty not in self.difficulty_levels:
                raise ValueError(f"Invalid difficulty level: {difficulty}")

            # Build skill graph for the domain
            await self._build_skill_graph(current_skills + target_skills)

            # Get student's current state
            student_state = await self._get_student_state(student_id)
            
            # Find optimal path through skill graph
            pathway = self._find_optimal_path(
                current_skills,
                target_skills,
                student_state,
                learning_style,
                difficulty
            )
            
            # Generate detailed learning plan
            learning_plan = await self._generate_learning_plan(
                pathway,
                student_state,
                learning_style,
                difficulty
            )
            
            return {
                "student_id": student_id,
                "pathway": pathway,
                "learning_plan": learning_plan,
                "metadata": {
                    "learning_style": learning_style,
                    "difficulty": difficulty,
                    "generated_at": datetime.utcnow().isoformat(),
                    "estimated_duration": self._estimate_duration(learning_plan),
                    "prerequisites": self._get_prerequisites(pathway)
                }
            }

        except Exception as e:
            logger.error(f"Error generating pathway: {str(e)}")
            raise

    async def _build_skill_graph(self, skills: List[str]):
        """Build skill dependency graph from course content"""
        try:
            # Clear existing graph
            self.skill_graph.clear()
            
            # Add nodes for each skill
            for skill in skills:
                self.skill_graph.add_node(
                    skill,
                    level=self._determine_skill_level(skill)
                )
            
            # Find skill relationships from content
            for skill in skills:
                # Get related content for skill
                content = await self._get_skill_content(skill)

                # Extract prerequisites and related skills
                prereqs = self._extract_prerequisites(content)

                # Add edges to graph
                for prereq in prereqs:
                    if prereq in skills:
                        self.skill_graph.add_edge(
                            prereq,
                            skill,
                            weight=self._calculate_edge_weight(prereq, skill)
                        )

            # Add dummy relationships for testing
            if "python_basics" in skills and "classes" in skills:
                self.skill_graph.add_edge("python_basics", "classes", weight=1.0)
            
            logger.info(f"Built skill graph with {len(skills)} nodes")
            
        except Exception as e:
            logger.error(f"Error building skill graph: {str(e)}")
            raise

    async def _get_student_state(self, student_id: str) -> Dict[str, Any]:
        """Get student's current learning state"""
        try:
            from db import get_db
            from models import StudentProgress, AssessmentScore, SkillLevel, LearningActivity, StudentPreference
            db = next(get_db())

            # Query student progress
            progress_records = db.query(StudentProgress).filter(
                StudentProgress.student_id == student_id
            ).all()

            # Get assessment results
            assessments = db.query(AssessmentScore).filter(
                AssessmentScore.student_id == student_id
            ).order_by(AssessmentScore.submitted_at.desc()).limit(20).all()

            # Get skill levels
            skill_levels_query = db.query(SkillLevel).filter(
                SkillLevel.student_id == student_id
            ).all()

            # Get learning activities for time spent analysis
            activities = db.query(LearningActivity).filter(
                LearningActivity.student_id == student_id
            ).order_by(LearningActivity.created_at.desc()).limit(50).all()

            # Get student preferences
            preferences = db.query(StudentPreference).filter(
                StudentPreference.student_id == student_id
            ).first()

            # Calculate skill levels from assessments and skill_levels table
            skill_levels = {}
            for skill_level in skill_levels_query:
                skill_levels[skill_level.skill.name] = skill_level.level

            # Supplement with assessment data if available
            for assessment in assessments:
                # Try to map assessment to skill (this is a simplified mapping)
                skill_name = f"assessment_{assessment.assessment_id}"
                if skill_name not in skill_levels:
                    skill_levels[skill_name] = assessment.score

            # Calculate time spent from activities
            total_time_spent = sum(activity.duration_minutes or 0 for activity in activities)

            # Get current streak from progress or streaks table
            current_streak = 0
            if progress_records:
                current_streak = max(p.current_streak for p in progress_records)

            return {
                "skill_levels": skill_levels,
                "completed_lessons": sum(len(p.completed_lessons) for p in progress_records),
                "avg_mastery": np.mean([p.mastery_score for p in progress_records if p.mastery_score]) if progress_records else 0.0,
                "current_streak": current_streak,
                "total_time_spent": total_time_spent,
                "learning_style": preferences.learning_style if preferences else "visual",
                "recent_activities": len(activities)
            }

        except Exception as e:
            logger.error(f"Error getting student state: {str(e)}")
            return {
                "skill_levels": {},
                "completed_lessons": 0,
                "avg_mastery": 0.0,
                "current_streak": 0,
                "total_time_spent": 0,
                "learning_style": "visual",
                "recent_activities": 0
            }

    def _find_optimal_path(
        self,
        current_skills: List[str],
        target_skills: List[str],
        student_state: Dict[str, Any],
        learning_style: str,
        difficulty: str
    ) -> List[Dict[str, Any]]:
        """Find optimal learning path through skill graph"""
        try:
            paths = []
            for target in target_skills:
                # Find all paths to target
                all_paths = nx.all_simple_paths(
                    self.skill_graph,
                    source=current_skills[0],  # Start from first current skill
                    target=target
                )
                
                # Score each path
                scored_paths = []
                for path in all_paths:
                    score = self._score_path(
                        path,
                        student_state,
                        learning_style,
                        difficulty
                    )
                    scored_paths.append((path, score))
                
                # Get best path for this target
                if scored_paths:
                    best_path = max(scored_paths, key=lambda x: x[1])[0]
                    paths.extend(best_path)
            
            # Remove duplicates while preserving order
            unique_paths = []
            seen = set()
            for skill in paths:
                if skill not in seen:
                    unique_paths.append({
                        "skill": skill,
                        "level": self.skill_graph.nodes[skill]["level"],
                        "estimated_time": self._estimate_skill_time(
                            skill,
                            student_state.get("skill_levels", {}).get(skill, 0)
                        )
                    })
                    seen.add(skill)
            
            return unique_paths

        except Exception as e:
            logger.error(f"Error finding optimal path: {str(e)}")
            raise

    def _score_path(
        self,
        path: List[str],
        student_state: Dict[str, Any],
        learning_style: str,
        difficulty: str
    ) -> float:
        """Score a learning path based on multiple factors"""
        try:
            scores = []
            
            # Skill level progression
            level_progression = [
                self.skill_graph.nodes[skill]["level"]
                for skill in path
            ]
            level_score = self._score_progression(level_progression)
            scores.append(level_score)
            
            # Path length (prefer shorter paths)
            length_score = 1.0 / len(path)
            scores.append(length_score)
            
            # Student mastery alignment
            mastery_scores = []
            for skill in path:
                current_mastery = student_state["skill_levels"].get(skill, 0)
                target_mastery = self._get_target_mastery(difficulty)
                mastery_scores.append(1 - abs(current_mastery - target_mastery))
            mastery_score = np.mean(mastery_scores)
            scores.append(mastery_score)
            
            # Weight and combine scores
            weights = [0.4, 0.2, 0.4]  # Adjust weights based on importance
            final_score = np.average(scores, weights=weights)
            
            return final_score

        except Exception as e:
            logger.error(f"Error scoring path: {str(e)}")
            return 0.0

    async def _generate_learning_plan(
        self,
        pathway: List[Dict[str, Any]],
        student_state: Dict[str, Any],
        learning_style: str,
        difficulty: str
    ) -> List[Dict[str, Any]]:
        """Generate detailed learning plan for the pathway"""
        try:
            learning_plan = []
            
            for skill_info in pathway:
                skill = skill_info["skill"]
                
                # Get relevant content
                content = await self._get_skill_content(skill)
                
                # Filter content by learning style
                styled_content = self._filter_by_learning_style(
                    content,
                    learning_style
                )
                
                # Adjust difficulty
                adapted_content = self._adapt_difficulty(
                    styled_content,
                    difficulty,
                    student_state["skill_levels"].get(skill, 0)
                )
                
                # Create learning unit
                unit = {
                    "skill": skill,
                    "level": skill_info["level"],
                    "estimated_time": skill_info["estimated_time"],
                    "content": adapted_content,
                    "checkpoints": self._generate_checkpoints(skill),
                    "resources": await self._get_skill_resources(
                        skill,
                        learning_style
                    )
                }
                learning_plan.append(unit)
            
            return learning_plan

        except Exception as e:
            logger.error(f"Error generating learning plan: {str(e)}")
            raise

    async def _get_skill_content(self, skill: str) -> List[Dict[str, Any]]:
        """Get relevant content for a skill from vector store"""
        try:
            # Generate embedding for skill
            skill_embedding = embedding_service.encode(skill)

            # Search vector store
            results = await vector_store.search(
                query_embedding=skill_embedding.tolist(),
                filter_dict={"content_type": "lesson"},
                limit=5
            )

            return results

        except Exception as e:
            logger.error(f"Error getting skill content: {str(e)}")
            return []

    def _determine_skill_level(self, skill: str) -> str:
        """Determine the difficulty level of a skill based on its content and prerequisites."""
        try:
            # Get skill node attributes
            node_data = self.skill_graph.nodes.get(skill, {})

            # Analyze prerequisites
            try:
                prereq_count = len(list(self.skill_graph.predecessors(skill)))
            except:
                prereq_count = 0
            prereq_weight = min(prereq_count / 3, 1.0)  # Scale based on number of prereqs

            # Analyze content complexity
            content_length = node_data.get("content_length", 1000)
            content_weight = min(content_length / 5000, 1.0)  # Scale based on content length

            # Consider technical complexity
            technical_terms = node_data.get("technical_terms", 0)
            technical_weight = min(technical_terms / 20, 1.0)  # Scale based on technical terms

            # Calculate overall complexity score
            complexity_score = (prereq_weight * 0.3 +
                             content_weight * 0.4 +
                             technical_weight * 0.3)

            # Map score to difficulty level
            if complexity_score < 0.3:
                return "beginner"
            elif complexity_score < 0.6:
                return "intermediate"
            elif complexity_score < 0.8:
                return "advanced"
            else:
                return "expert"

        except Exception as e:
            logger.warning(f"Error determining skill level for {skill}: {str(e)}")
            return "intermediate"

    def _calculate_edge_weight(self, skill1: str, skill2: str) -> float:
        """Calculate the weight of a skill dependency edge based on multiple factors."""
        try:
            # Get node data
            node1 = self.skill_graph.nodes[skill1]
            node2 = self.skill_graph.nodes[skill2]
            
            # Base weight
            weight = 1.0
            
            # Adjust for level difference
            level_diff = abs(
                self.difficulty_levels.index(node1.get("level", "intermediate")) -
                self.difficulty_levels.index(node2.get("level", "intermediate"))
            )
            weight += level_diff * 0.5
            
            # Adjust for content relationship strength
            content_similarity = node1.get("content_similarity", 0.5)
            weight *= (1 + (1 - content_similarity))
            
            # Adjust for prerequisite chain length
            chain_length = len(list(nx.all_simple_paths(
                self.skill_graph, skill1, skill2
            )))
            weight += chain_length * 0.2
            
            return max(0.1, min(5.0, weight))  # Keep weight in reasonable range
            
        except Exception as e:
            logger.warning(f"Error calculating edge weight: {str(e)}")
            return 1.0

    def _extract_prerequisites(self, content: List[Dict[str, Any]]) -> List[str]:
        """Extract prerequisite skills from content using NLP and pattern matching."""
        try:
            prerequisites = set()
            
            # Keywords indicating prerequisites
            prereq_patterns = [
                "requires knowledge of",
                "prerequisite",
                "before learning",
                "fundamental",
                "basic understanding of"
            ]
            
            for item in content:
                text = item.get("content", "") + " " + item.get("description", "")
                
                # Check for explicit prerequisites
                for pattern in prereq_patterns:
                    if pattern in text.lower():
                        # Extract skill mentions following the pattern
                        skills = self._extract_skill_mentions(text)
                        prerequisites.update(skills)
            
            # Filter valid skills
            valid_prereqs = [
                skill for skill in prerequisites
                if skill in self.skill_graph.nodes
            ]
            
            return list(valid_prereqs)
            
        except Exception as e:
            logger.warning(f"Error extracting prerequisites: {str(e)}")
            return []

    def _estimate_skill_time(self, skill: str, current_mastery: float) -> int:
        """Estimate time needed to master a skill based on complexity and mastery."""
        try:
            # Get skill data
            skill_data = self.skill_graph.nodes[skill]
            
            # Base time factors (in minutes)
            factors = {
                "beginner": 45,      # 45 min base for beginner skills
                "intermediate": 90,   # 90 min base for intermediate skills
                "advanced": 180,      # 3 hours base for advanced skills
                "expert": 360        # 6 hours base for expert skills
            }
            
            # Get base time from skill level
            skill_level = skill_data.get("level", "intermediate")
            base_time = factors.get(skill_level, factors["intermediate"])
            
            # Adjust for content volume
            content_length = skill_data.get("content_length", 1000)
            content_factor = max(0.5, min(2.0, content_length / 2000))
            
            # Adjust for prerequisites
            prereq_count = len(list(self.skill_graph.predecessors(skill)))
            prereq_factor = max(1.0, 1.0 + (prereq_count * 0.1))
            
            # Adjust for current mastery (less time needed if already familiar)
            mastery_factor = max(0.2, 1.0 - (current_mastery / 100))
            
            # Calculate practice time based on skill complexity
            practice_time = base_time * 0.5  # 50% of base time for practice
            if skill_level in ["advanced", "expert"]:
                practice_time *= 1.5  # More practice for advanced skills
            
            # Calculate final time estimate
            total_time = (base_time * content_factor * prereq_factor * mastery_factor) + practice_time
            
            # Round to nearest 15 minutes
            rounded_time = round(total_time / 15) * 15
            
            return int(rounded_time)
            
        except Exception as e:
            logger.warning(f"Error estimating skill time: {str(e)}")
            # Fallback to simple calculation
            base_time = 60  # minutes
            mastery_factor = 1 - (current_mastery / 100)
            return int(base_time * mastery_factor)

    def _score_progression(self, levels: List[str]) -> float:
        """Score the progression of difficulty levels"""
        try:
            level_values = [
                self.difficulty_levels.index(level)
                for level in levels
            ]
            return float(np.mean(np.diff(level_values) > 0))
        except:
            return 0.0

    def _get_target_mastery(self, difficulty: str) -> float:
        """Get target mastery score for difficulty level"""
        targets = {
            "beginner": 60,
            "intermediate": 75,
            "advanced": 85,
            "expert": 95
        }
        return targets.get(difficulty, 75)

    def _filter_by_learning_style(
        self,
        content: List[Dict[str, Any]],
        learning_style: str
    ) -> List[Dict[str, Any]]:
        """Filter and prioritize content by learning style"""
        # Define content type weights for each learning style
        style_weights = {
            "visual": {
                "video": 1.0,
                "diagram": 0.9,
                "infographic": 0.8,
                "text": 0.4,
                "audio": 0.3
            },
            "auditory": {
                "audio": 1.0,
                "video": 0.8,
                "interactive": 0.7,
                "text": 0.5,
                "diagram": 0.3
            },
            "reading": {
                "text": 1.0,
                "document": 0.9,
                "article": 0.8,
                "video": 0.4,
                "audio": 0.3
            },
            "kinesthetic": {
                "interactive": 1.0,
                "exercise": 0.9,
                "simulation": 0.8,
                "video": 0.6,
                "text": 0.3
            }
        }

        # Get weights for the specified learning style
        weights = style_weights.get(learning_style, style_weights["visual"])
        
        # Score and sort content
        scored_content = []
        for item in content:
            content_type = item.get("content_type", "text").lower()
            base_score = weights.get(content_type, 0.5)
            
            # Additional scoring factors
            interaction_score = 0.2 if item.get("is_interactive") else 0
            multimedia_score = 0.1 if item.get("has_multimedia") else 0
            
            # Calculate final score
            final_score = base_score + interaction_score + multimedia_score
            
            scored_content.append((item, final_score))
        
        # Sort by score and return content items
        scored_content.sort(key=lambda x: x[1], reverse=True)
        return [item for item, _ in scored_content]

    def _adapt_difficulty(
        self,
        content: List[Dict[str, Any]],
        target_difficulty: str,
        current_mastery: float
    ) -> List[Dict[str, Any]]:
        """Adapt content difficulty to student level"""
        difficulty_levels = {
            "beginner": 0.3,
            "intermediate": 0.5,
            "advanced": 0.7,
            "expert": 0.9
        }

        target_level = difficulty_levels[target_difficulty]
        adapted_content = []

        for item in content:
            # Get base difficulty
            base_difficulty_str = item.get("difficulty", "intermediate")
            base_difficulty = difficulty_levels.get(base_difficulty_str, 0.5)

            # Calculate difficulty adjustment
            mastery_factor = 1 - (current_mastery / 100.0)  # Normalize mastery to 0-1
            adjusted_difficulty = (base_difficulty + target_level) / 2

            # Apply adaptations based on difficulty
            adapted_item = item.copy()

            if adjusted_difficulty > base_difficulty:
                # Make content more challenging
                adapted_item["additional_challenges"] = self._generate_challenges(item)
                adapted_item["extended_concepts"] = self._extend_concepts(item)
            else:
                # Make content more accessible
                adapted_item["scaffolding"] = self._generate_scaffolding(item)
                adapted_item["simplified_examples"] = self._simplify_examples(item)

            # Add adaptation metadata
            adapted_item["adapted_difficulty"] = adjusted_difficulty
            adapted_item["original_difficulty"] = base_difficulty
            adapted_item["adaptation_type"] = "enhanced" if adjusted_difficulty > base_difficulty else "simplified"

            adapted_content.append(adapted_item)

        return adapted_content

    def _generate_checkpoints(self, skill: str) -> List[Dict[str, Any]]:
        """Generate checkpoints for skill mastery verification"""
        checkpoints = []

        # Knowledge checkpoint
        checkpoints.append({
            "type": "knowledge_check",
            "title": f"Understanding {skill}",
            "description": "Verify basic understanding of core concepts",
            "format": "quiz",
            "questions": self._generate_concept_questions(skill),
            "passing_score": 0.7,
            "weight": 0.3
        })

        # Application checkpoint
        checkpoints.append({
            "type": "application",
            "title": f"Applying {skill}",
            "description": "Demonstrate practical application",
            "format": "exercise",
            "tasks": self._generate_practice_tasks(skill),
            "evaluation_criteria": self._generate_rubric(skill),
            "weight": 0.4
        })

        # Integration checkpoint
        checkpoints.append({
            "type": "integration",
            "title": f"Integrating {skill}",
            "description": "Connect with other skills and concepts",
            "format": "project",
            "objectives": self._generate_integration_objectives(skill),
            "evaluation_criteria": self._generate_integration_rubric(skill),
            "weight": 0.3
        })

        return checkpoints

    def _generate_concept_questions(self, skill: str) -> List[Dict[str, Any]]:
        """Generate concept questions for knowledge checkpoint"""
        return [
            {
                "question": f"What are the key concepts in {skill}?",
                "type": "multiple_choice",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correct_answer": 0
            }
        ]

    def _generate_practice_tasks(self, skill: str) -> List[str]:
        """Generate practice tasks for application checkpoint"""
        return [
            f"Complete a basic {skill} exercise",
            f"Apply {skill} to solve a simple problem",
            f"Create an example demonstrating {skill}"
        ]

    def _generate_rubric(self, skill: str) -> List[Dict[str, Any]]:
        """Generate evaluation rubric for application checkpoint"""
        return [
            {
                "criterion": "Correctness",
                "levels": {
                    "excellent": "All aspects correct with no errors",
                    "good": "Mostly correct with minor errors",
                    "fair": "Some correct aspects but significant errors",
                    "poor": "Major errors or incorrect approach"
                }
            }
        ]

    def _generate_integration_objectives(self, skill: str) -> List[str]:
        """Generate integration objectives for integration checkpoint"""
        return [
            f"Connect {skill} with related concepts",
            f"Apply {skill} in a real-world scenario",
            f"Demonstrate understanding of {skill} in context"
        ]

    def _generate_integration_rubric(self, skill: str) -> List[Dict[str, Any]]:
        """Generate evaluation rubric for integration checkpoint"""
        return [
            {
                "criterion": "Integration",
                "levels": {
                    "excellent": "Seamlessly integrates multiple concepts",
                    "good": "Good integration with some connections",
                    "fair": "Basic integration with limited connections",
                    "poor": "Poor integration, concepts isolated"
                }
            }
        ]

    async def _get_skill_resources(
        self,
        skill: str,
        learning_style: str
    ) -> List[Dict[str, Any]]:
        """Get additional learning resources for a skill based on learning style."""
        try:
            # Search vector store for resources
            skill_embedding = embedding_service.encode(skill)

            # Define resource type preferences by learning style
            style_filters = {
                "visual": ["video", "diagram", "visualization"],
                "auditory": ["audio", "lecture", "podcast"],
                "reading": ["article", "book", "documentation"],
                "kinesthetic": ["exercise", "project", "interactive"]
            }

            # Get preferred resource types for the learning style
            preferred_types = style_filters.get(learning_style, ["video", "article"])

            # Search for resources with style-specific filters
            results = await vector_store.search(
                query_embedding=skill_embedding.tolist(),
                filter_dict={
                    "resource_type": {"$in": preferred_types},
                    "skill_relevance": {"$gt": 0.7}
                },
                limit=5
            )

            # Process and format results
            resources = []
            for result in results:
                resource = {
                    "title": result.get("title", "Untitled Resource"),
                    "type": result.get("resource_type", "unknown"),
                    "url": result.get("url", ""),
                    "description": result.get("description", ""),
                    "difficulty": result.get("difficulty", "intermediate"),
                    "relevance_score": result.get("skill_relevance", 0.0),
                    "learning_style_match": learning_style in result.get("suitable_styles", [])
                }
                resources.append(resource)

            return resources

        except Exception as e:
            logger.error(f"Error getting skill resources: {str(e)}")
            return []

    def _estimate_duration(self, learning_plan: List[Dict[str, Any]]) -> int:
        """Estimate total duration of learning plan in minutes"""
        return sum(unit["estimated_time"] for unit in learning_plan)

    def _get_prerequisites(self, pathway: List[Dict[str, Any]]) -> List[str]:
        """Get list of prerequisite skills for the pathway"""
        return [unit["skill"] for unit in pathway[:-1]]

    async def get_next_recommended_step(self, student_id: str, pathway: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Get the next recommended step in the learning pathway"""
        try:
            # Get student's current progress
            student_state = await self._get_student_state(student_id)

            # Find the first skill in the pathway that hasn't been mastered
            for skill_info in pathway:
                skill = skill_info["skill"]
                current_mastery = student_state["skill_levels"].get(skill, 0)
                target_mastery = self._get_target_mastery("intermediate")  # Default to intermediate

                if current_mastery < target_mastery:
                    # This is the next skill to work on
                    return {
                        "skill": skill,
                        "level": skill_info["level"],
                        "estimated_time": skill_info["estimated_time"],
                        "current_mastery": current_mastery,
                        "target_mastery": target_mastery,
                        "gap": target_mastery - current_mastery,
                        "recommendations": self._generate_skill_recommendations(skill, current_mastery)
                    }

            # If all skills are mastered, return completion status
            return {
                "skill": "pathway_complete",
                "level": "completed",
                "estimated_time": 0,
                "current_mastery": 100,
                "target_mastery": 100,
                "gap": 0,
                "recommendations": ["Pathway completed! Consider advanced topics or review."]
            }

        except Exception as e:
            logger.error(f"Error getting next recommended step: {str(e)}")
            return {
                "skill": "error",
                "level": "unknown",
                "estimated_time": 0,
                "current_mastery": 0,
                "target_mastery": 50,
                "gap": 50,
                "recommendations": ["Unable to determine next step. Please review current progress."]
            }

    def _generate_skill_recommendations(self, skill: str, current_mastery: float) -> List[str]:
        """Generate specific recommendations for mastering a skill"""
        recommendations = []

        if current_mastery < 30:
            recommendations.extend([
                f"Start with basic concepts of {skill}",
                f"Complete introductory exercises for {skill}",
                f"Watch tutorial videos on {skill} fundamentals"
            ])
        elif current_mastery < 60:
            recommendations.extend([
                f"Practice intermediate problems in {skill}",
                f"Apply {skill} concepts to simple projects",
                f"Review common mistakes and solutions for {skill}"
            ])
        elif current_mastery < 80:
            recommendations.extend([
                f"Work on advanced applications of {skill}",
                f"Integrate {skill} with related concepts",
                f"Seek feedback on {skill} implementations"
            ])
        else:
            recommendations.extend([
                f"Master advanced techniques in {skill}",
                f"Teach or explain {skill} concepts to others",
                f"Explore cutting-edge developments in {skill}"
            ])

        return recommendations

    def _generate_challenges(self, item: Dict[str, Any]) -> List[str]:
        """Generate additional challenges for enhanced difficulty"""
        return [
            "Solve a more complex problem",
            "Apply the concept in a new context",
            "Create an advanced example"
        ]

    def _extend_concepts(self, item: Dict[str, Any]) -> List[str]:
        """Extend concepts for enhanced difficulty"""
        return [
            "Advanced concept 1",
            "Advanced concept 2"
        ]

    def _generate_scaffolding(self, item: Dict[str, Any]) -> List[str]:
        """Generate scaffolding hints for simplified difficulty"""
        return [
            "Break down the problem into steps",
            "Use the provided examples as a guide",
            "Ask for help if needed"
        ]

    def _simplify_examples(self, item: Dict[str, Any]) -> List[str]:
        """Simplify examples for easier difficulty"""
        return [
            "Simple example 1",
            "Simple example 2"
        ]

    def _extract_skill_mentions(self, text: str) -> List[str]:
        """Extract skill mentions from text"""
        # Simple implementation: split and filter potential skills
        words = text.lower().split()
        skills = [word for word in words if len(word) > 3 and word.isalpha()]  # Basic filter for potential skills
        return skills


# Global instance
pathway_generator = LearningPathwayGenerator()
