from typing import List, Dict, Optional
from app.database.supabase_manager import supabase_db
from app.store.local_store import LocalJsonStore
from app.core.logging import structlog

log = structlog.get_logger()

class CurriculumNode:
    def __init__(self, concept_id: str, difficulty: float):
        self.concept_id = concept_id
        self.difficulty = difficulty
        self.prerequisites: List[str] = []
        
class CurriculumOptimizer:
    """
    Optimizes the learning path using a Curriculum Graph backed by PostgreSQL.
    Matches concepts based on prerequisite satisfaction and difficulty.
    """
    def __init__(self, course_id: Optional[str] = None):
        self.nodes: Dict[str, CurriculumNode] = {}
        if course_id:
            self.load_from_db(course_id)
        
    def load_from_db(self, course_id: str):
        """
        Loads knowledge nodes and their relationships from the Supabase database.
        """
        try:
            client = supabase_db.get_client()
            if not client:
                self._load_from_local(course_id)
                return

            response = client.table("knowledge_nodes").select("*").eq("course_id", course_id).execute()
            
            # Difficulty mapping to numeric scale for sorting
            diff_map = {"beginner": 0.2, "intermediate": 0.5, "advanced": 0.8}
            
            for item in response.data:
                # We use the 'concept' name as the identifier for pathing
                concept = item["concept"]
                difficulty_raw = item.get("difficulty", "beginner")
                difficulty = diff_map.get(difficulty_raw, 0.5)
                
                node = CurriculumNode(concept, difficulty)
                node.prerequisites = item.get("prerequisites", [])
                self.nodes[concept] = node
                
            log.info("optimizer_loaded_nodes", count=len(self.nodes), course_id=course_id)
        except Exception as e:
            log.error("optimizer_load_error", error=str(e))

    def _load_from_local(self, course_id: str):
        store = LocalJsonStore()
        payload = store.read()
        nodes = payload.get("knowledge_nodes", [])
        diff_map = {"beginner": 0.2, "intermediate": 0.5, "advanced": 0.8}
        for item in nodes:
            if item.get("course_id") != course_id:
                continue
            concept = item.get("concept")
            if not concept:
                continue
            difficulty_raw = item.get("difficulty", "beginner")
            difficulty = diff_map.get(difficulty_raw, 0.5)
            node = CurriculumNode(concept, difficulty)
            node.prerequisites = item.get("prerequisites", [])
            self.nodes[concept] = node

    def add_node(self, concept_id: str, difficulty: float, prerequisites: List[str] = None):
        node = CurriculumNode(concept_id, difficulty)
        if prerequisites:
            node.prerequisites = prerequisites
        self.nodes[concept_id] = node
        
    def get_optimal_next_concept(self, mastered_concepts: List[str]) -> Optional[str]:
        """
        Finds the easiest concept whose prerequisites are fully met by the 
        mastered_concepts list.
        """
        candidates = []
        for c_id, node in self.nodes.items():
            if c_id in mastered_concepts:
                continue # Already mastered
                
            # Check if all prereqs are met
            can_take = True
            for prereq in node.prerequisites:
                if prereq not in mastered_concepts:
                    can_take = False
                    break
                    
            if can_take:
                candidates.append(node)
                
        if not candidates:
            return None
            
        # Return the easiest valid next step
        candidates.sort(key=lambda x: x.difficulty)
        return candidates[0].concept_id

    @staticmethod
    def get_fallback_optimizer() -> 'CurriculumOptimizer':
        """Returns a generic mock graph to ensure ADVANCE logic works"""
        opt = CurriculumOptimizer()
        opt.add_node("concept_1", 0.1)
        opt.add_node("concept_2", 0.3, ["concept_1"])
        opt.add_node("concept_3", 0.5, ["concept_2"])
        opt.add_node("concept_4", 0.8, ["concept_3"])
        return opt
