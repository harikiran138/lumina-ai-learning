"""
Pathway Generation Enhancements Module
Adds advanced features like edge-case handling, multi-skill grouping, 
learning objective alignment, and caching for pathway generation.
"""

import networkx as nx
from typing import List, Dict, Any, Optional, Set
from datetime import datetime, timedelta
import json
from functools import lru_cache
from loguru import logger

from models import Skill, LearningPathway, SkillLevel, StudentPreference
from db import get_db
from .skill_graph_service import SkillGraphService

class PathwayGenerationEnhancements:
    def __init__(self, skill_graph_service: SkillGraphService):
        self.skill_graph = skill_graph_service
        self.cache_ttl = 300  # 5 minutes cache TTL
        
    @lru_cache(maxsize=128)
    def _get_cached_pathway(self, student_id: str, course_id: str) -> Optional[Dict[str, Any]]:
        """Get cached learning pathway if available and not expired."""
        try:
            db = next(get_db())
            pathway = db.query(LearningPathway).filter(
                LearningPathway.student_id == student_id,
                LearningPathway.course_id == course_id,
                LearningPathway.status == 'active'
            ).first()
            
            if pathway:
                cache_age = datetime.utcnow() - pathway.updated_at
                if cache_age.total_seconds() < self.cache_ttl:
                    return pathway.pathway_data
            return None
        except Exception as e:
            logger.error(f"Error retrieving cached pathway: {str(e)}")
            return None

    def _cache_pathway(self, student_id: str, course_id: str, pathway_data: Dict[str, Any]):
        """Cache generated pathway data."""
        try:
            db = next(get_db())
            pathway = db.query(LearningPathway).filter(
                LearningPathway.student_id == student_id,
                LearningPathway.course_id == course_id,
                LearningPathway.status == 'active'
            ).first()
            
            if pathway:
                pathway.pathway_data = pathway_data
                pathway.updated_at = datetime.utcnow()
            else:
                new_pathway = LearningPathway(
                    student_id=student_id,
                    course_id=course_id,
                    pathway_data=pathway_data,
                    status='active'
                )
                db.add(new_pathway)
                
            db.commit()
        except Exception as e:
            logger.error(f"Error caching pathway: {str(e)}")
            db.rollback()

    def _group_related_skills(self, skills: List[Skill]) -> List[List[Skill]]:
        """Group closely related skills that can be learned together."""
        skill_groups = []
        visited = set()
        
        for skill in skills:
            if skill.skill_id in visited:
                continue
                
            # Find related skills based on prerequisites and learning objectives
            related = self._find_related_skills(skill)
            if len(related) <= 3:  # Only group if manageable size
                skill_groups.append(list(related))
                visited.update(s.skill_id for s in related)
            else:
                skill_groups.append([skill])
                visited.add(skill.skill_id)
                
        return skill_groups

    def _find_related_skills(self, skill: Skill) -> Set[Skill]:
        """Find skills closely related to the given skill."""
        related = {skill}
        
        # Check prerequisites
        prereqs = {p.prerequisite for p in skill.prerequisites}
        next_skills = {r.skill for r in skill.required_by}
        
        # Add closely related prereqs and next skills
        for s in prereqs | next_skills:
            if (
                s.category == skill.category and
                abs(float(s.level) - float(skill.level)) <= 1
            ):
                related.add(s)
                
        return related

    def _align_with_learning_objectives(
        self,
        pathway: List[List[Skill]],
        student_id: str
    ) -> List[List[Skill]]:
        """Align pathway with student's learning objectives and preferences."""
        try:
            db = next(get_db())
            preferences = db.query(StudentPreference).filter(
                StudentPreference.student_id == student_id
            ).first()
            
            if not preferences:
                return pathway
            
            learning_style = preferences.learning_style
            difficulty_pref = preferences.difficulty_preference
            
            # Adjust pathway based on learning style
            if learning_style == "sequential":
                # Keep skills more sequential
                return [[skill] for group in pathway for skill in group]
            elif learning_style == "global":
                # Encourage larger skill groups
                return self._merge_compatible_groups(pathway)
            
            # Adjust for difficulty preference
            if difficulty_pref == "challenging":
                return self._prioritize_challenging_skills(pathway)
            elif difficulty_pref == "gradual":
                return self._ensure_gradual_progression(pathway)
            
            return pathway
            
        except Exception as e:
            logger.error(f"Error aligning with learning objectives: {str(e)}")
            return pathway

    def _merge_compatible_groups(self, pathway: List[List[Skill]]) -> List[List[Skill]]:
        """Merge compatible skill groups for global learners."""
        merged = []
        current_group = []
        
        for group in pathway:
            if not current_group:
                current_group = group
            elif len(current_group) + len(group) <= 4:
                current_group.extend(group)
            else:
                merged.append(current_group)
                current_group = group
                
        if current_group:
            merged.append(current_group)
            
        return merged

    def _prioritize_challenging_skills(self, pathway: List[List[Skill]]) -> List[List[Skill]]:
        """Adjust pathway to include more challenging skill combinations."""
        challenging = []
        
        for group in pathway:
            if len(group) == 1:
                # Look for a compatible challenging skill to pair with
                skill = group[0]
                challenge_pair = self._find_challenge_pair(skill)
                if challenge_pair:
                    challenging.append([skill, challenge_pair])
                else:
                    challenging.append(group)
            else:
                challenging.append(group)
                
        return challenging

    def _find_challenge_pair(self, skill: Skill) -> Optional[Skill]:
        """Find a compatible skill that would create a challenging pair."""
        try:
            db = next(get_db())
            potential_pairs = db.query(Skill).filter(
                Skill.category == skill.category,
                Skill.level > skill.level,
                Skill.level <= float(skill.level) + 1.5
            ).all()
            
            # Return the most challenging compatible skill
            return max(potential_pairs, key=lambda s: float(s.level), default=None)
            
        except Exception as e:
            logger.error(f"Error finding challenge pair: {str(e)}")
            return None

    def _ensure_gradual_progression(self, pathway: List[List[Skill]]) -> List[List[Skill]]:
        """Adjust pathway to ensure gradual skill progression."""
        gradual = []
        current_level = 0
        
        for group in pathway:
            group_level = max(float(skill.level) for skill in group)
            
            if group_level - current_level > 1.5:
                # Insert intermediate skills
                intermediate = self._find_intermediate_skills(current_level, group_level)
                if intermediate:
                    gradual.extend([[skill] for skill in intermediate])
                    
            gradual.append(group)
            current_level = group_level
            
        return gradual

    def _find_intermediate_skills(
        self,
        current_level: float,
        target_level: float
    ) -> List[Skill]:
        """Find appropriate intermediate skills between levels."""
        try:
            db = next(get_db())
            return db.query(Skill).filter(
                Skill.level > current_level,
                Skill.level < target_level
            ).order_by(Skill.level).all()
        except Exception as e:
            logger.error(f"Error finding intermediate skills: {str(e)}")
            return []

    def handle_edge_cases(self, pathway: List[List[Skill]], student_id: str) -> List[List[Skill]]:
        """Handle various edge cases in pathway generation."""
        try:
            if not pathway:
                return self._generate_fallback_pathway(student_id)
                
            # Handle skill gaps
            pathway = self._fill_skill_gaps(pathway, student_id)
            
            # Handle overloaded groups
            pathway = self._balance_skill_groups(pathway)
            
            # Handle prerequisite conflicts
            pathway = self._resolve_prerequisite_conflicts(pathway)
            
            return pathway
            
        except Exception as e:
            logger.error(f"Error handling edge cases: {str(e)}")
            return pathway

    def _generate_fallback_pathway(self, student_id: str) -> List[List[Skill]]:
        """Generate a basic fallback pathway when normal generation fails."""
        try:
            db = next(get_db())
            
            # Get student's current skill levels
            skill_levels = db.query(SkillLevel).filter(
                SkillLevel.student_id == student_id
            ).all()
            
            if not skill_levels:
                # Complete beginner - start with fundamentals
                fundamental_skills = db.query(Skill).filter(
                    Skill.level <= 1.0
                ).order_by(Skill.level).limit(3).all()
                
                return [[skill] for skill in fundamental_skills]
            
            # Build on existing skills
            next_level_skills = []
            for level in skill_levels:
                next_skills = db.query(Skill).filter(
                    Skill.level > level.level,
                    Skill.level <= level.level + 1.0,
                    Skill.category == level.skill.category
                ).limit(2).all()
                next_level_skills.extend(next_skills)
                
            return [[skill] for skill in next_level_skills[:5]]
            
        except Exception as e:
            logger.error(f"Error generating fallback pathway: {str(e)}")
            return []

    def _fill_skill_gaps(
        self,
        pathway: List[List[Skill]],
        student_id: str
    ) -> List[List[Skill]]:
        """Identify and fill gaps in the skill progression."""
        try:
            gaps = self._identify_skill_gaps(pathway, student_id)
            if not gaps:
                return pathway
                
            filled_pathway = []
            current_skills = self._get_current_skills(student_id)
            
            for group in pathway:
                group_level = max(float(skill.level) for skill in group)
                needed_prereqs = gaps.get(group_level, [])
                
                if needed_prereqs:
                    # Add missing prerequisite skills before this group
                    for prereq in needed_prereqs:
                        if prereq.skill_id not in current_skills:
                            filled_pathway.append([prereq])
                            current_skills.add(prereq.skill_id)
                            
                filled_pathway.append(group)
                current_skills.update(skill.skill_id for skill in group)
                
            return filled_pathway
            
        except Exception as e:
            logger.error(f"Error filling skill gaps: {str(e)}")
            return pathway

    def _identify_skill_gaps(
        self,
        pathway: List[List[Skill]],
        student_id: str
    ) -> Dict[float, List[Skill]]:
        """Identify gaps in prerequisites and skill progression."""
        try:
            gaps = {}
            current_skills = self._get_current_skills(student_id)
            
            for group in pathway:
                group_level = max(float(skill.level) for skill in group)
                missing_prereqs = []
                
                for skill in group:
                    for prereq in skill.prerequisites:
                        if (
                            prereq.prerequisite_id not in current_skills and
                            not any(prereq.prerequisite_id == s.skill_id for s in missing_prereqs)
                        ):
                            missing_prereqs.append(prereq.prerequisite)
                            
                if missing_prereqs:
                    gaps[group_level] = missing_prereqs
                    
            return gaps
            
        except Exception as e:
            logger.error(f"Error identifying skill gaps: {str(e)}")
            return {}

    def _get_current_skills(self, student_id: str) -> Set[str]:
        """Get set of student's current skill IDs."""
        try:
            db = next(get_db())
            skill_levels = db.query(SkillLevel).filter(
                SkillLevel.student_id == student_id
            ).all()
            return {level.skill_id for level in skill_levels}
        except Exception as e:
            logger.error(f"Error getting current skills: {str(e)}")
            return set()

    def _balance_skill_groups(self, pathway: List[List[Skill]]) -> List[List[Skill]]:
        """Balance overloaded skill groups."""
        balanced = []

        for group in pathway:
            if len(group) > 3:
                # Split large groups
                sorted_skills = sorted(group, key=lambda s: float(s.level))
                balanced.extend([
                    sorted_skills[i:i + 3]
                    for i in range(0, len(sorted_skills), 3)
                ])
            else:
                balanced.append(group)

        return balanced

    def _resolve_prerequisite_conflicts(self, pathway: List[List[Skill]]) -> List[List[Skill]]:
        """Ensure prerequisites are properly ordered in the pathway."""
        # Build dependency graph
        graph = nx.DiGraph()
        for group in pathway:
            for skill in group:
                graph.add_node(skill.skill_id)
                for prereq in skill.prerequisites:
                    graph.add_edge(prereq.skill_id, skill.skill_id)
                    
        try:
            # Get topological sort
            ordered_skills = list(nx.topological_sort(graph))
            
            # Rebuild pathway preserving groups where possible
            resolved = []
            current_group = []
            skill_to_group = {
                skill.skill_id: group
                for group in pathway
                for skill in group
            }
            
            for skill_id in ordered_skills:
                original_group = skill_to_group.get(skill_id)
                if not original_group:
                    continue
                    
                skill = next(s for s in original_group if s.skill_id == skill_id)
                
                if not current_group:
                    current_group = [skill]
                elif all(s in original_group for s in current_group):
                    current_group.append(skill)
                else:
                    resolved.append(current_group)
                    current_group = [skill]
                    
            if current_group:
                resolved.append(current_group)
                
            return resolved
            
        except nx.NetworkXUnfeasible:
            logger.error("Cycle detected in prerequisite graph")
            # Fall back to sequential ordering
            return [[skill] for group in pathway for skill in group]
        except Exception as e:
            logger.error(f"Error resolving prerequisite conflicts: {str(e)}")
            return pathway