from typing import List, Dict, Optional

class CurriculumNode:
    def __init__(self, concept_id: str, difficulty: float):
        self.concept_id = concept_id
        self.difficulty = difficulty
        self.prerequisites: List[str] = []
        
class CurriculumOptimizer:
    """
    Simulates a Curriculum Graph for Pathway Optimization.
    In a full production environment, this would search a Neo4j or 
    PostgreSQL graph to find the lowest-cost path of concepts.
    """
    def __init__(self):
        # A mocked simple graph for bootstrapping
        self.nodes: Dict[str, CurriculumNode] = {}
        
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
