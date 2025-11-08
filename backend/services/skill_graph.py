"""
Skill Graph Service for managing educational skill relationships and dependencies
"""

import networkx as nx
from typing import List, Dict, Any, Optional, Set, Tuple
import numpy as np
from loguru import logger
from datetime import datetime
import json
from sqlalchemy.orm import Session
from db import get_db


class SkillNode:
    def __init__(
        self,
        skill_id: str,
        name: str,
        description: str,
        level: str,
        category: str,
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.skill_id = skill_id
        self.name = name
        self.description = description
        self.level = level
        self.category = category
        self.metadata = metadata or {}
        self.prerequisites: Set[str] = set()
        self.postrequisites: Set[str] = set()
        self.mastery_criteria: Dict[str, float] = {
            "beginner": 0.6,
            "intermediate": 0.75,
            "advanced": 0.85,
            "expert": 0.95
        }


class SkillGraphService:
    def __init__(self):
        self.graph = nx.DiGraph()
        self.difficulty_levels = ["beginner", "intermediate", "advanced", "expert"]
        self.skill_categories = [
            "mathematics",
            "programming",
            "language",
            "science",
            "humanities",
            "arts"
        ]

    def add_skill(
        self,
        skill_id: str,
        name: str,
        description: str,
        level: str,
        category: str,
        prerequisites: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Add a new skill to the graph"""
        try:
            if level not in self.difficulty_levels:
                raise ValueError(f"Invalid difficulty level: {level}")
            if category not in self.skill_categories:
                raise ValueError(f"Invalid skill category: {category}")

            # Create skill node
            node = SkillNode(
                skill_id=skill_id,
                name=name,
                description=description,
                level=level,
                category=category,
                metadata=metadata
            )

            # Add to graph
            self.graph.add_node(
                skill_id,
                data=node.__dict__
            )

            # Add prerequisites if provided
            if prerequisites:
                for prereq in prerequisites:
                    if prereq in self.graph:
                        self.add_prerequisite(skill_id, prereq)
                        node.prerequisites.add(prereq)
                        self.graph.nodes[prereq]["data"]["postrequisites"].add(skill_id)

            # Save to database
            self._save_skill_to_db(node)

            logger.info(f"Added skill: {name} ({skill_id})")
            return True

        except Exception as e:
            logger.error(f"Error adding skill: {str(e)}")
            return False

    def add_prerequisite(self, skill_id: str, prerequisite_id: str) -> bool:
        """Add a prerequisite relationship between skills"""
        try:
            if skill_id not in self.graph or prerequisite_id not in self.graph:
                raise ValueError("Both skills must exist in the graph")

            # Check for cycles
            if prerequisite_id == skill_id or nx.has_path(self.graph, skill_id, prerequisite_id):
                raise ValueError("Adding this prerequisite would create a cycle")

            # Add edge
            self.graph.add_edge(prerequisite_id, skill_id)

            # Update node data
            self.graph.nodes[skill_id]["data"]["prerequisites"].add(prerequisite_id)
            self.graph.nodes[prerequisite_id]["data"]["postrequisites"].add(skill_id)

            # Save relationship to database
            self._save_prerequisite_to_db(skill_id, prerequisite_id)

            logger.info(f"Added prerequisite: {prerequisite_id} -> {skill_id}")
            return True

        except Exception as e:
            logger.error(f"Error adding prerequisite: {str(e)}")
            return False

    def get_prerequisites(self, skill_id: str, recursive: bool = False) -> Set[str]:
        """Get prerequisites for a skill"""
        try:
            if skill_id not in self.graph:
                raise ValueError(f"Skill {skill_id} not found")

            if recursive:
                # Get all ancestors (recursive prerequisites)
                return set(nx.ancestors(self.graph, skill_id))
            else:
                # Get immediate prerequisites
                return set(self.graph.predecessors(skill_id))

        except Exception as e:
            logger.error(f"Error getting prerequisites: {str(e)}")
            return set()

    def get_skill_path(
        self,
        current_skill: str,
        target_skill: str
    ) -> List[Dict[str, Any]]:
        """Find optimal learning path between skills"""
        try:
            if not (current_skill in self.graph and target_skill in self.graph):
                raise ValueError("Both skills must exist in the graph")

            # Find shortest path
            path = nx.shortest_path(
                self.graph,
                source=current_skill,
                target=target_skill,
                weight="weight"
            )

            # Get detailed path information
            path_details = []
            for skill_id in path:
                node_data = self.graph.nodes[skill_id]["data"]
                path_details.append({
                    "skill_id": skill_id,
                    "name": node_data["name"],
                    "level": node_data["level"],
                    "description": node_data["description"],
                    "prerequisites": list(node_data["prerequisites"]),
                    "mastery_criteria": node_data["mastery_criteria"]
                })

            return path_details

        except Exception as e:
            logger.error(f"Error finding skill path: {str(e)}")
            return []

    def get_skill_recommendations(
        self,
        student_id: str,
        current_skills: List[str],
        difficulty_preference: str = "progressive"
    ) -> List[Dict[str, Any]]:
        """Get personalized skill recommendations"""
        try:
            # Get student's skill levels
            student_levels = self._get_student_skill_levels(student_id)
            
            recommendations = []
            seen_skills = set(current_skills)
            
            for current_skill in current_skills:
                if current_skill not in self.graph:
                    continue
                
                # Get next possible skills
                next_skills = set(self.graph.successors(current_skill))
                
                for skill_id in next_skills:
                    if skill_id in seen_skills:
                        continue
                        
                    node_data = self.graph.nodes[skill_id]["data"]
                    
                    # Check if prerequisites are met
                    prereqs = node_data["prerequisites"]
                    if not prereqs.issubset(set(current_skills)):
                        continue
                    
                    # Calculate recommendation score
                    score = self._calculate_recommendation_score(
                        skill_id,
                        student_levels,
                        difficulty_preference
                    )
                    
                    recommendations.append({
                        "skill_id": skill_id,
                        "name": node_data["name"],
                        "level": node_data["level"],
                        "description": node_data["description"],
                        "score": score,
                        "prerequisites": list(prereqs)
                    })
                    
                    seen_skills.add(skill_id)
            
            # Sort by score
            recommendations.sort(key=lambda x: x["score"], reverse=True)
            
            return recommendations[:10]  # Return top 10 recommendations

        except Exception as e:
            logger.error(f"Error getting recommendations: {str(e)}")
            return []

    def analyze_skill_dependencies(self, skill_id: str) -> Dict[str, Any]:
        """Analyze dependency relationships for a skill"""
        try:
            if skill_id not in self.graph:
                raise ValueError(f"Skill {skill_id} not found")

            node_data = self.graph.nodes[skill_id]["data"]
            
            # Get all dependencies
            prerequisites = self.get_prerequisites(skill_id, recursive=True)
            descendants = set(nx.descendants(self.graph, skill_id))
            
            # Calculate metrics
            dependency_depth = len(nx.shortest_path(self.graph, skill_id))
            centrality = nx.degree_centrality(self.graph)[skill_id]
            
            return {
                "skill_id": skill_id,
                "name": node_data["name"],
                "total_prerequisites": len(prerequisites),
                "total_postrequisites": len(descendants),
                "dependency_depth": dependency_depth,
                "centrality": centrality,
                "prerequisites": list(prerequisites),
                "postrequisites": list(descendants),
                "is_foundational": len(prerequisites) == 0,
                "is_advanced": len(descendants) == 0
            }

        except Exception as e:
            logger.error(f"Error analyzing dependencies: {str(e)}")
            return {}

    def _calculate_recommendation_score(
        self,
        skill_id: str,
        student_levels: Dict[str, float],
        difficulty_preference: str
    ) -> float:
        """Calculate recommendation score for a skill"""
        try:
            node_data = self.graph.nodes[skill_id]["data"]
            
            # Base score from skill level
            level_scores = {
                "beginner": 0.4,
                "intermediate": 0.6,
                "advanced": 0.8,
                "expert": 1.0
            }
            base_score = level_scores[node_data["level"]]
            
            # Adjust for student's current level
            current_level = student_levels.get(skill_id, 0)
            level_diff = abs(base_score - current_level)
            
            if difficulty_preference == "progressive":
                # Prefer slightly more challenging skills
                difficulty_score = 1.0 - (level_diff * 0.5)
            elif difficulty_preference == "challenge":
                # Prefer more challenging skills
                difficulty_score = base_score
            else:  # "comfort"
                # Prefer skills at current level
                difficulty_score = 1.0 - level_diff
            
            # Consider prerequisite mastery
            prereq_scores = []
            for prereq in node_data["prerequisites"]:
                prereq_mastery = student_levels.get(prereq, 0)
                prereq_scores.append(prereq_mastery)
            
            prereq_score = np.mean(prereq_scores) if prereq_scores else 1.0
            
            # Combine scores
            final_score = (difficulty_score * 0.4 + prereq_score * 0.6)
            
            return final_score

        except Exception as e:
            logger.error(f"Error calculating recommendation score: {str(e)}")
            return 0.0

    def _get_student_skill_levels(self, student_id: str) -> Dict[str, float]:
        """Get student's current skill levels"""
        try:
            db = next(get_db())
            
            # Query skill assessments
            results = db.query(
                "SELECT skill_id, MAX(score) as max_score "
                "FROM skill_assessments "
                "WHERE student_id = :student_id "
                "GROUP BY skill_id",
                {"student_id": student_id}
            ).fetchall()
            
            return {
                r.skill_id: float(r.max_score)
                for r in results
            }

        except Exception as e:
            logger.error(f"Error getting student skill levels: {str(e)}")
            return {}

    def _save_skill_to_db(self, skill: SkillNode):
        """Save skill to database"""
        try:
            db = next(get_db())
            
            db.execute(
                """
                INSERT INTO skills (
                    skill_id, name, description, level,
                    category, metadata, created_at
                ) VALUES (
                    :skill_id, :name, :description, :level,
                    :category, :metadata, :created_at
                )
                ON CONFLICT (skill_id) DO UPDATE SET
                    name = :name,
                    description = :description,
                    level = :level,
                    category = :category,
                    metadata = :metadata,
                    updated_at = :created_at
                """,
                {
                    "skill_id": skill.skill_id,
                    "name": skill.name,
                    "description": skill.description,
                    "level": skill.level,
                    "category": skill.category,
                    "metadata": json.dumps(skill.metadata),
                    "created_at": datetime.utcnow()
                }
            )
            
            db.commit()

        except Exception as e:
            logger.error(f"Error saving skill to database: {str(e)}")
            raise

    def _save_prerequisite_to_db(self, skill_id: str, prerequisite_id: str):
        """Save prerequisite relationship to database"""
        try:
            db = next(get_db())
            
            db.execute(
                """
                INSERT INTO skill_prerequisites (
                    skill_id, prerequisite_id, created_at
                ) VALUES (
                    :skill_id, :prerequisite_id, :created_at
                )
                ON CONFLICT (skill_id, prerequisite_id) DO NOTHING
                """,
                {
                    "skill_id": skill_id,
                    "prerequisite_id": prerequisite_id,
                    "created_at": datetime.utcnow()
                }
            )
            
            db.commit()

        except Exception as e:
            logger.error(f"Error saving prerequisite to database: {str(e)}")
            raise


# Global instance
skill_graph = SkillGraphService()