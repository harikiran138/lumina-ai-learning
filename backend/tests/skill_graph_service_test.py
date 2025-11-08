"""Test version of skill graph service module"""

from typing import List, Dict, Any, Optional
from loguru import logger

from tests.models import TestSkill as Skill
from tests.db_test import get_db

class SkillGraphService:
    def __init__(self, db=None):
        self.db = db
        self._skills_cache = {}
        self._edges_cache = {}
        self._prerequisites = {}  # skill_id -> list of prerequisite skill_ids
        
    def _load_skills(self, course_id: Optional[str] = None) -> Dict[str, Any]:
        """Load all skills and their prerequisites."""
        try:
            db = next(get_db())
            query = db.query(Skill)
            if course_id:
                query = query.filter(Skill.course_id == course_id)
            skills = query.all()
            
            # Build graph edges
            edges = {}
            for skill in skills:
                edges[skill.skill_id] = {
                    "prereqs": [p.skill_id for p in skill.prerequisites],
                    "next": [r.skill_id for r in skill.required_by]
                }
                
            return {
                "nodes": {s.skill_id: s for s in skills},
                "edges": edges
            }
        except Exception as e:
            logger.error(f"Error loading skills: {str(e)}")
            return {"nodes": {}, "edges": {}}

    def get_skill(self, skill_id: str) -> Optional[Skill]:
        """Get a skill by ID."""
        if not self._skills_cache:
            graph = self._load_skills()
            self._skills_cache = graph["nodes"]
            self._edges_cache = graph["edges"]
            
        return self._skills_cache.get(skill_id)

    def get_prerequisites(self, skill_id: str) -> List[Skill]:
        """Get prerequisites for a skill."""
        if not self._edges_cache:
            graph = self._load_skills()
            self._skills_cache = graph["nodes"]
            self._edges_cache = graph["edges"]
            
        prereq_ids = self._edges_cache.get(skill_id, {}).get("prereqs", [])
        return [self._skills_cache[pid] for pid in prereq_ids if pid in self._skills_cache]

    def get_next_skills(self, skill_id: str) -> List[Skill]:
        """Get skills that require this skill as a prerequisite."""
        if not self._edges_cache:
            graph = self._load_skills()
            self._skills_cache = graph["nodes"]
            self._edges_cache = graph["edges"]
            
        next_ids = self._edges_cache.get(skill_id, {}).get("next", [])
        return [self._skills_cache[nid] for nid in next_ids if nid in self._skills_cache]

    def get_course_skills(self, course_id: str) -> List[Skill]:
        """Get all skills for a course."""
        try:
            db = next(get_db())
            return db.query(Skill).filter(Skill.course_id == course_id).all()
        except Exception as e:
            logger.error(f"Error getting course skills: {str(e)}")
            return []

    def add_skill(self, skill: Skill):
        """Add a skill to the graph."""
        self._skills_cache[skill.skill_id] = skill
        if skill.skill_id not in self._prerequisites:
            self._prerequisites[skill.skill_id] = []

    def add_prerequisite(self, skill_id: str, prerequisite_id: str):
        """Add a prerequisite relationship."""
        if skill_id not in self._prerequisites:
            self._prerequisites[skill_id] = []
        if prerequisite_id not in self._prerequisites[skill_id]:
            self._prerequisites[skill_id].append(prerequisite_id)
