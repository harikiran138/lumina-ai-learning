"""
Phase 6 API Endpoints
REST API endpoints for Phase 6 features.
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import Dict, List, Any, Optional
from pydantic import BaseModel
from datetime import datetime
import json

from auth import get_current_user
from services.realtime_pathway_adapter import realtime_pathway_adapter
from services.ml_skill_grouper import ml_skill_grouper
from services.advanced_analytics import advanced_analytics
from services.collaborative_learning import collaborative_learning
from services.skill_graph_service import skill_graph_service
from services.realtime_analytics import realtime_analytics
from services.optimized_embedding import optimized_embedding_service

# Initialize services
realtime_pathway_adapter.skill_graph = skill_graph_service
realtime_pathway_adapter.analytics = realtime_analytics
ml_skill_grouper.embedding_service = optimized_embedding_service
advanced_analytics.realtime_analytics = realtime_analytics
collaborative_learning.ml_grouper = ml_skill_grouper
collaborative_learning.analytics = advanced_analytics

router = APIRouter(prefix="/api/v1", tags=["phase6"])

# Pydantic models for request/response
class PathwayAdaptationRequest(BaseModel):
    pathway_id: str
    progress_data: Dict[str, Any]

class SkillGroupingRequest(BaseModel):
    course_id: str
    skill_focus: Optional[str] = None
    grouping_criteria: Optional[Dict[str, Any]] = None

class StudyGroupRequest(BaseModel):
    course_id: str
    skill_focus: Optional[str] = None
    group_criteria: Optional[Dict[str, Any]] = None

class GroupActionRequest(BaseModel):
    group_id: str

class AnalyticsRequest(BaseModel):
    course_id: str
    prediction_horizon: Optional[int] = 30

class PeerRecommendationRequest(BaseModel):
    criteria: Optional[Dict[str, Any]] = None

# Pathway Adaptation Endpoints
@router.post("/pathways/adapt")
async def adapt_pathway(
    request: PathwayAdaptationRequest,
    current_user: Dict = Depends(get_current_user),
    background_tasks: BackgroundTasks = None
):
    """Adapt a learning pathway in real-time based on progress data."""
    try:
        student_id = current_user['id']

        adapted_pathway = await realtime_pathway_adapter.adapt_pathway(
            student_id=student_id,
            current_pathway={"id": request.pathway_id},  # Simplified
            progress_data=request.progress_data
        )

        # Background task to update analytics
        if background_tasks:
            background_tasks.add_task(
                realtime_analytics.track_student_progress,
                student_id,
                request.progress_data.get('course_id', 'unknown'),
                request.progress_data.get('skill_id', 'unknown'),
                request.progress_data
            )

        return {
            "success": True,
            "adapted_pathway": adapted_pathway,
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pathway adaptation failed: {str(e)}")

@router.get("/pathways/{student_id}/adaptations")
async def get_pathway_adaptations(
    student_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Get adaptation history for a student."""
    try:
        # Check permissions (teacher or self)
        if current_user['role'] != 'teacher' and current_user['id'] != student_id:
            raise HTTPException(status_code=403, detail="Access denied")

        adaptations = await realtime_pathway_adapter.get_adaptation_history(student_id)

        return {
            "student_id": student_id,
            "adaptations": adaptations,
            "total_adaptations": len(adaptations)
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get adaptations: {str(e)}")

# ML Skill Grouping Endpoints
@router.post("/groups/ml-group")
async def create_ml_skill_groups(
    request: SkillGroupingRequest,
    current_user: Dict = Depends(get_current_user)
):
    """Create optimal skill groups using machine learning."""
    try:
        # Only teachers can create groups
        if current_user['role'] != 'teacher':
            raise HTTPException(status_code=403, detail="Only teachers can create skill groups")

        # Get skills for the course
        # This would typically query the database for course skills
        skills = [
            {"id": "skill_1", "name": "Basic Algebra", "difficulty": 0.3, "category": "math"},
            {"id": "skill_2", "name": "Geometry", "difficulty": 0.5, "category": "math"},
            {"id": "skill_3", "name": "Calculus", "difficulty": 0.8, "category": "math"}
        ]

        # Get student profiles (simplified)
        student_profiles = [
            {"student_id": "student_1", "avg_skill_level": 0.6, "learning_style": "visual"},
            {"student_id": "student_2", "avg_skill_level": 0.4, "learning_style": "auditory"},
            {"student_id": "student_3", "avg_skill_level": 0.7, "learning_style": "kinesthetic"}
        ]

        result = await ml_skill_grouper.create_optimal_groups(
            skills=skills,
            student_profiles=student_profiles,
            grouping_criteria=request.grouping_criteria
        )

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ML grouping failed: {str(e)}")

# Advanced Analytics Endpoints
@router.get("/analytics/predict/{student_id}")
async def get_student_predictions(
    student_id: str,
    request: AnalyticsRequest = None,
    current_user: Dict = Depends(get_current_user)
):
    """Get predictive analytics for a student."""
    try:
        # Check permissions
        if current_user['role'] != 'teacher' and current_user['id'] != student_id:
            raise HTTPException(status_code=403, detail="Access denied")

        course_id = request.course_id if request else "default_course"
        prediction_horizon = request.prediction_horizon if request else 30

        # Get success prediction
        success_pred = await advanced_analytics.predict_student_success(
            student_id=student_id,
            course_id=course_id,
            prediction_horizon=prediction_horizon
        )

        # Get completion time prediction
        time_pred = await advanced_analytics.predict_completion_time(
            student_id=student_id,
            course_id=course_id
        )

        # Get insights
        insights = await advanced_analytics.generate_predictive_insights(student_id)

        return {
            "student_id": student_id,
            "course_id": course_id,
            "success_prediction": success_pred,
            "time_prediction": time_pred,
            "insights": insights,
            "generated_at": datetime.utcnow().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analytics prediction failed: {str(e)}")

@router.get("/analytics/anomalies/{student_id}")
async def detect_student_anomalies(
    student_id: str,
    course_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Detect learning anomalies for a student."""
    try:
        # Check permissions
        if current_user['role'] != 'teacher' and current_user['id'] != student_id:
            raise HTTPException(status_code=403, detail="Access denied")

        anomalies = await advanced_analytics.detect_anomalies(
            student_id=student_id,
            course_id=course_id
        )

        return {
            "student_id": student_id,
            "course_id": course_id,
            "anomalies": anomalies,
            "total_anomalies": len(anomalies),
            "detected_at": datetime.utcnow().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Anomaly detection failed: {str(e)}")

# Collaborative Learning Endpoints
@router.post("/collaborative/groups")
async def create_study_group(
    request: StudyGroupRequest,
    current_user: Dict = Depends(get_current_user)
):
    """Create a new study group."""
    try:
        result = await collaborative_learning.create_study_group(
            course_id=request.course_id,
            skill_focus=request.skill_focus,
            group_criteria=request.group_criteria
        )

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Study group creation failed: {str(e)}")

@router.get("/collaborative/groups")
async def get_study_groups(
    course_id: Optional[str] = None,
    status: str = "active",
    current_user: Dict = Depends(get_current_user)
):
    """Get study groups."""
    try:
        groups = await collaborative_learning.get_study_groups(
            student_id=current_user['id'] if current_user['role'] == 'student' else None,
            course_id=course_id,
            status=status
        )

        return {
            "groups": groups,
            "total_groups": len(groups),
            "filtered_by": {
                "course_id": course_id,
                "status": status
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get study groups: {str(e)}")

@router.post("/collaborative/groups/join")
async def join_study_group(
    request: GroupActionRequest,
    current_user: Dict = Depends(get_current_user)
):
    """Join a study group."""
    try:
        result = await collaborative_learning.join_study_group(
            student_id=current_user['id'],
            group_id=request.group_id
        )

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to join study group: {str(e)}")

@router.post("/collaborative/groups/leave")
async def leave_study_group(
    request: GroupActionRequest,
    current_user: Dict = Depends(get_current_user)
):
    """Leave a study group."""
    try:
        result = await collaborative_learning.leave_study_group(
            student_id=current_user['id'],
            group_id=request.group_id
        )

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to leave study group: {str(e)}")

@router.get("/collaborative/groups/{group_id}/activities")
async def get_group_activities(
    group_id: str,
    limit: int = 10,
    current_user: Dict = Depends(get_current_user)
):
    """Get activities for a study group."""
    try:
        activities = await collaborative_learning.get_group_activities(
            group_id=group_id,
            limit=limit
        )

        return {
            "group_id": group_id,
            "activities": activities,
            "limit": limit
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get group activities: {str(e)}")

@router.get("/collaborative/peers/{student_id}")
async def get_peer_recommendations(
    student_id: str,
    request: PeerRecommendationRequest = None,
    current_user: Dict = Depends(get_current_user)
):
    """Get peer learning recommendations."""
    try:
        # Check permissions
        if current_user['role'] != 'teacher' and current_user['id'] != student_id:
            raise HTTPException(status_code=403, detail="Access denied")

        recommendations = await collaborative_learning.get_peer_recommendations(
            student_id=student_id,
            criteria=request.criteria if request else None
        )

        return {
            "student_id": student_id,
            "recommendations": recommendations,
            "total_recommendations": len(recommendations)
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Peer recommendations failed: {str(e)}")

# Health check endpoint
@router.get("/phase6/health")
async def phase6_health_check():
    """Health check for Phase 6 services."""
    try:
        # Check if services are initialized
        services_status = {
            "realtime_pathway_adapter": realtime_pathway_adapter is not None,
            "ml_skill_grouper": ml_skill_grouper is not None,
            "advanced_analytics": advanced_analytics is not None,
            "collaborative_learning": collaborative_learning is not None
        }

        all_healthy = all(services_status.values())

        return {
            "status": "healthy" if all_healthy else "degraded",
            "services": services_status,
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
