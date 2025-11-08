"""
Skill Graph Service
Manages the skill graph structure and relationships for learning pathways.
Uses networkx for graph operations and analysis.
"""

import networkx as nx
from typing import List, Dict, Any, Optional, Set
from datetime import datetime
from loguru import logger

from models import Skill, SkillPrerequisite
from db import get_db

class SkillGraphService:
    # Mapping from string levels to numeric values
    LEVEL_MAPPING = {
        "beginner": 1.0,
        "intermediate": 2.0,
        "advanced": 3.0,
        "expert": 4.0
    }

    def __init__(self):
        self.graph = nx.DiGraph()
        self._load_skills()
        
    def _load_skills(self):
        """Load all skills and their relationships into the graph."""
        try:
            db = next(get_db())
            
            # Load all skills
            skills = db.query(Skill).all()
            for skill in skills:
                self.graph.add_node(
                    skill.skill_id,
                    name=skill.name,
                    level=float(skill.level),
                    category=skill.category
                )
            
            # Load prerequisites
            prerequisites = db.query(SkillPrerequisite).all()
            for prereq in prerequisites:
                self.graph.add_edge(
                    prereq.prerequisite_id,
                    prereq.skill_id
                )
                
        except Exception as e:
            logger.error(f"Error loading skills: {str(e)}")

    def add_skill(self, skill):
        """Add a skill to the graph."""
        try:
            # Convert string level to numeric if needed
            level = skill.level
            if isinstance(level, str):
                level = self.LEVEL_MAPPING.get(level.lower(), 1.0)

            self.graph.add_node(
                skill.skill_id,
                name=skill.name,
                level=float(level),
                category=skill.category
            )
        except Exception as e:
            logger.error(f"Error adding skill: {str(e)}")

    def add_prerequisite(self, prerequisite_id: str, skill_id: str):
        """Add a prerequisite relationship between skills."""
        try:
            # Check for cycles
            if nx.has_path(self.graph, skill_id, prerequisite_id):
                raise ValueError("Adding this prerequisite would create a cycle")

            # Validate skill levels: prerequisite should be lower or equal level
            prereq_level = self.graph.nodes[prerequisite_id]["level"]
            skill_level = self.graph.nodes[skill_id]["level"]
            if prereq_level > skill_level:
                raise ValueError("Prerequisite skill level cannot be higher than dependent skill level")

            self.graph.add_edge(prerequisite_id, skill_id)
        except Exception as e:
            logger.error(f"Error adding prerequisite: {str(e)}")
            raise

    def get_prerequisites(self, skill_id: str) -> Set[str]:
        """Get all prerequisites for a skill."""
        try:
            return set(nx.ancestors(self.graph, skill_id))
        except Exception as e:
            logger.error(f"Error getting prerequisites: {str(e)}")
            return set()
    
    def get_dependent_skills(self, skill_id: str) -> Set[str]:
        """Get all skills that depend on this skill."""
        try:
            return set(nx.descendants(self.graph, skill_id))
        except Exception as e:
            logger.error(f"Error getting dependent skills: {str(e)}")
            return set()
    
    def get_skill_level(self, skill_id: str) -> float:
        """Get the level of a skill."""
        try:
            return self.graph.nodes[skill_id]["level"]
        except Exception as e:
            logger.error(f"Error getting skill level: {str(e)}")
            return 0.0
    
    def get_skills_by_level(self, level: float, tolerance: float = 0.5) -> List[str]:
        """Get skills within a level range."""
        try:
            return [
                node for node in self.graph.nodes
                if abs(self.graph.nodes[node]["level"] - level) <= tolerance
            ]
        except Exception as e:
            logger.error(f"Error getting skills by level: {str(e)}")
            return []
    
    def get_skills_by_category(self, category: str) -> List[str]:
        """Get all skills in a category."""
        try:
            return [
                node for node in self.graph.nodes
                if self.graph.nodes[node]["category"] == category
            ]
        except Exception as e:
            logger.error(f"Error getting skills by category: {str(e)}")
            return []
    
    def validate_skill_order(self, skill_sequence: List[str]) -> bool:
        """Validate if a sequence of skills respects prerequisites."""
        try:
            seen_skills = set()
            for skill in skill_sequence:
                prereqs = self.get_prerequisites(skill)
                if not prereqs.issubset(seen_skills):
                    return False
                seen_skills.add(skill)
            return True
        except Exception as e:
            logger.error(f"Error validating skill order: {str(e)}")
            return False
    
    def find_skill_gaps(self, current_skills: Set[str], target_skill: str) -> List[str]:
        """Find missing prerequisite skills."""
        try:
            required = self.get_prerequisites(target_skill)
            return list(required - current_skills)
        except Exception as e:
            logger.error(f"Error finding skill gaps: {str(e)}")
            return []
    
    def get_next_skills(self, completed_skills: Set[str]) -> List[str]:
        """Get next available skills based on completed prerequisites."""
        try:
            available = set()
            for node in self.graph.nodes:
                if node not in completed_skills:
                    prereqs = self.get_prerequisites(node)
                    if prereqs.issubset(completed_skills):
                        available.add(node)
            return sorted(
                list(available),
                key=lambda x: self.graph.nodes[x]["level"]
            )
        except Exception as e:
            logger.error(f"Error getting next skills: {str(e)}")
            return []
    
    def get_skill_path(self, start_skill: str, end_skill: str) -> Optional[List[str]]:
        """Find shortest path between two skills."""
        try:
            return nx.shortest_path(self.graph, start_skill, end_skill)
        except nx.NetworkXNoPath:
            return None
        except Exception as e:
            logger.error(f"Error getting skill path: {str(e)}")
            return None
    
    def get_skill_complexity(self, skill_id: str) -> float:
        """Calculate skill complexity based on prerequisites."""
        try:
            prereqs = self.get_prerequisites(skill_id)
            if not prereqs:
                return 1.0
            
            levels = [
                self.graph.nodes[p]["level"]
                for p in prereqs
            ]
            return sum(levels) / len(levels)
        except Exception as e:
            logger.error(f"Error calculating skill complexity: {str(e)}")
            return 1.0
    
    def get_skill_impact(self, skill_id: str) -> float:
        """Calculate skill impact based on dependent skills."""
        try:
            dependents = self.get_dependent_skills(skill_id)
            if not dependents:
                return 1.0
            
            return len(dependents) / len(self.graph.nodes)
        except Exception as e:
            logger.error(f"Error calculating skill impact: {str(e)}")
            return 1.0
    
    def get_skill_groups(self, skills: List[str], max_group_size: int = 3) -> List[List[str]]:
        """Group related skills together."""
        try:
            groups = []
            remaining = set(skills)
            
            while remaining:
                skill = remaining.pop()
                group = {skill}
                
                # Find related skills
                related = (
                    self.get_prerequisites(skill) |
                    self.get_dependent_skills(skill)
                ) & remaining
                
                # Sort by level similarity
                skill_level = self.graph.nodes[skill]["level"]
                related = sorted(
                    related,
                    key=lambda x: abs(self.graph.nodes[x]["level"] - skill_level)
                )
                
                # Add most related skills up to max_group_size
                for related_skill in related:
                    if len(group) >= max_group_size:
                        break
                    if related_skill in remaining:
                        group.add(related_skill)
                        remaining.remove(related_skill)
                
                groups.append(sorted(list(group)))
                
            return groups
        except Exception as e:
            logger.error(f"Error grouping skills: {str(e)}")
            return [[skill] for skill in skills]
    
    def analyze_skill_dependencies(self, skill_id: str) -> Dict[str, Any]:
        """Analyze skill dependency structure."""
        try:
            prereqs = self.get_prerequisites(skill_id)
            dependents = self.get_dependent_skills(skill_id)
            
            return {
                "skill_id": skill_id,
                "prerequisite_count": len(prereqs),
                "dependent_count": len(dependents),
                "complexity": self.get_skill_complexity(skill_id),
                "impact": self.get_skill_impact(skill_id),
                "is_foundational": len(prereqs) == 0,
                "is_advanced": len(dependents) == 0,
                "related_categories": self._get_related_categories(skill_id)
            }
        except Exception as e:
            logger.error(f"Error analyzing dependencies: {str(e)}")
            return {
                "skill_id": skill_id,
                "error": str(e)
            }
    
    def _get_related_categories(self, skill_id: str) -> Set[str]:
        """Get categories of related skills."""
        try:
            related = (
                self.get_prerequisites(skill_id) |
                self.get_dependent_skills(skill_id)
            )
            return {
                self.graph.nodes[skill]["category"]
                for skill in related
            }
        except Exception as e:
            logger.error(f"Error getting related categories: {str(e)}")
            return set()
    
    def export_skill_graph(self) -> Dict[str, Any]:
        """Export skill graph data for visualization."""
        try:
            return {
                "nodes": [
                    {
                        "id": node,
                        "name": self.graph.nodes[node]["name"],
                        "level": self.graph.nodes[node]["level"],
                        "category": self.graph.nodes[node]["category"],
                        "complexity": self.get_skill_complexity(node),
                        "impact": self.get_skill_impact(node)
                    }
                    for node in self.graph.nodes
                ],
                "edges": [
                    {
                        "source": source,
                        "target": target
                    }
                    for source, target in self.graph.edges
                ]
            }
        except Exception as e:
            logger.error(f"Error exporting skill graph: {str(e)}")
            return {
                "nodes": [],
                "edges": [],
                "error": str(e)
            }