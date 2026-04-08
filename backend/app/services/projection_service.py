from typing import List, Optional, Dict, Any
from app.database.models import LearnerPathwayProjection, PathwayNode, Course, LearnerProfile
from app.core.logging import structlog
import uuid

log = structlog.get_logger()

class ProjectionService:
    """
    Project a course into a student-specific learner pathway.
    """

    @staticmethod
    def project_course_for_learner(
        course: Dict[str, Any], 
        learner_profile: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Personalizes a course blueprint into a student's pathway projection.
        """
        user_id = learner_profile.get("user_id")
        course_id = course.get("id")
        
        log.info("projecting_course", user_id=user_id, course_id=course_id)
        
        # 1. Fetch initial interests/preferences from Learner Profile
        interests = learner_profile.get("goals", [])
        # Example: if user goal is "Build a fintech app", example_domain = "Finance"
        example_domain = interests[0] if interests else "General"
        
        # 2. Extract concepts from the Course concept_graph
        graph = course.get("concept_graph", {})
        nodes = graph.get("nodes", [])
        
        # 3. Filter/Reorder nodes based on mastery levels
        mastery = learner_profile.get("mastery_levels", {})
        
        pathway = []
        for node in nodes:
            node_id = node.get("id")
            node_mastery = mastery.get(node_id, {"score": 0.0}).get("score", 0.0)
            
            status = "locked"
            if node_mastery >= 0.8:
                status = "completed"
            
            path_node = {
                "concept_id": node_id,
                "status": status,
                "mastery_score": node_mastery,
                "recommended_resources": [],
                "skipped": node_mastery >= 0.95 # highly mastered
            }
            pathway.append(path_node)
            
        # Set first incomplete node to "available" or "current"
        for p_node in pathway:
            if p_node["status"] == "locked":
                p_node["status"] = "current"
                break

        projection = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "course_id": course_id,
            "pathway": pathway,
            "example_domain": example_domain,
            "pacing_preference": "standard", # default
            "updated_at": "" # will be set by store/db
        }
        
        return projection

# Instantiate
projection_service = ProjectionService()
