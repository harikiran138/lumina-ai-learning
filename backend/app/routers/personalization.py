from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.personalization.schemas import ExplanationStrategyState, LearningEventType, NoteAddedPayload, LessonCompletedPayload, ActivityLoggedPayload
from app.store.user_data_store import UserDataStore
from app.store.student_store import StudentStore
from app.database.scoped_db import get_scoped_db
from app.dependencies import get_user_data_store, get_student_store

router = APIRouter()

class NoteRequest(BaseModel):
    title: Optional[str] = "Untitled Note"
    subject: Optional[str] = "General"
    content: str

class ActivityLogRequest(BaseModel):
    course_id: str
    duration_minutes: int

class LessonCompletionRequest(BaseModel):
    course_id: str
    lesson_id: str


@router.get("/profile")
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    service = get_personalization_service()
    profile = await service.get_profile(current_user["id"], role=current_user.get("role", "student"))
    return profile.model_dump(mode="json")


@router.get("/profile/{user_id}")
async def get_profile_by_user_id(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in {"teacher", "admin", "hod"} and current_user["id"] != user_id:
        raise HTTPException(status_code=403, detail="Not allowed to view another student's profile")

    service = get_personalization_service()
    profile = await service.get_profile(user_id)
    return profile.model_dump(mode="json")


@router.get("/interventions")
async def get_interventions(
    user_id: Optional[str] = Query(default=None),
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") == "student":
        user_id = current_user["id"]
    elif user_id is None and current_user.get("role") in {"teacher", "admin", "hod"}:
        user_id = None
    elif current_user.get("role") not in {"teacher", "admin", "hod"}:
        raise HTTPException(status_code=403, detail="Not allowed to view intervention queue")

    service = get_personalization_service()
    interventions = await service.get_interventions(user_id=user_id)
    return [item.model_dump(mode="json") for item in interventions]


def _check_profile_access(current_user: dict, user_id: str):
    if current_user.get("role") not in {"teacher", "admin", "hod"} and current_user["id"] != user_id:
        raise HTTPException(status_code=403, detail="Not allowed to view another student's profile")


@router.get("/projection/tutor")
async def get_tutor_projection(current_user: dict = Depends(get_current_user)):
    service = get_personalization_service()
    projection = await service.get_tutor_projection(current_user["id"])
    return projection


@router.get("/projection/tutor/{user_id}")
async def get_tutor_projection_for_user(user_id: str, current_user: dict = Depends(get_current_user)):
    _check_profile_access(current_user, user_id)
    service = get_personalization_service()
    projection = await service.get_tutor_projection(user_id)
    return projection


@router.get("/projection/teacher/{user_id}")
async def get_teacher_projection_for_user(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in {"teacher", "admin", "hod"}:
        raise HTTPException(status_code=403, detail="Teacher access required")
    service = get_personalization_service()
    projection = await service.get_teacher_projection(user_id)
    return projection


@router.get("/projection/pathway")
async def get_pathway_projection(current_user: dict = Depends(get_current_user)):
    service = get_personalization_service()
    projection = await service.get_profile_projection_for_engine(current_user["id"])
    return projection


@router.get("/projection/pathway/{user_id}")
async def get_pathway_projection_for_user(user_id: str, current_user: dict = Depends(get_current_user)):
    _check_profile_access(current_user, user_id)
    service = get_personalization_service()
    projection = await service.get_profile_projection_for_engine(user_id)
    return projection


@router.get("/course/{course_id}/pathway")
async def get_course_pathway_projection(
    course_id: str,
    current_user: dict = Depends(get_current_user),
    user_id: Optional[str] = Query(None)
):
    target_user_id = user_id or current_user["id"]
    _check_profile_access(current_user, target_user_id)
    
    service = get_personalization_service()
    projection = await service.get_pathway_projection(target_user_id, course_id)
    if not projection:
        raise HTTPException(status_code=404, detail="Pathway projection not found for this course")
    return projection


@router.get("/analytics/misconceptions")
async def get_misconception_clusters(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in {"teacher", "admin", "hod"}:
        raise HTTPException(status_code=403, detail="Teacher access required")
    service = get_personalization_service()
    return await service.get_cohort_misconceptions()


@router.get("/analytics/growth-trajectories")
async def get_growth_trajectories(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in {"teacher", "admin", "hod"}:
        raise HTTPException(status_code=403, detail="Teacher access required")
    service = get_personalization_service()
    return await service.get_growth_trajectories()


@router.get("/analytics/ab-test")
async def get_ab_test_performance(
    variant_a: str = Query(..., description="Cohort ID for variant A"),
    variant_b: str = Query(..., description="Cohort ID for variant B"),
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") not in {"teacher", "admin", "hod"}:
        raise HTTPException(status_code=403, detail="Teacher access required")
    service = get_personalization_service()
    return await service.get_ab_test_performance(variant_a, variant_b)


# ---------------------------------------------------------------------------
# Style override (teacher / admin only)
# ---------------------------------------------------------------------------

_VALID_STYLES = frozenset({
    "story", "joke", "analogy", "experiment", "formula",
    "poem", "socratic", "liveExample", "visual", "verbal",
})


class StyleOverrideRequest(BaseModel):
    preferred_style: str   # one of: story|joke|analogy|experiment|formula|poem|socratic|liveExample|visual|verbal
    lock: bool = False     # if True, AI won't override this for 7 days


@router.patch("/student/{user_id}/style")
async def override_student_style(
    user_id: str,
    req: StyleOverrideRequest,
    current_user: dict = Depends(get_current_user),
):
    """Teacher overrides a student's learning style weights."""
    if current_user.get("role") not in {"teacher", "admin", "hod"}:
        raise HTTPException(status_code=403, detail="Teacher or admin access required")

    if req.preferred_style not in _VALID_STYLES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid style '{req.preferred_style}'. Must be one of: {sorted(_VALID_STYLES)}",
        )

    service = get_personalization_service()
    profile = await service.get_profile(user_id)

    # Build current strategy effectiveness map
    strategies = profile.explanation_profile.strategies
    # Ensure the boosted style entry exists
    if req.preferred_style not in strategies:
        strategies[req.preferred_style] = ExplanationStrategyState(
            mode_name=req.preferred_style,
            effectiveness_score=0.50,
        )

    # Boost requested style to 0.50; redistribute the remaining 0.50 across others
    # proportionally to their current effectiveness_score.
    other_keys = [k for k in strategies if k != req.preferred_style]
    other_total = sum(strategies[k].effectiveness_score for k in other_keys) or 1.0

    strategies[req.preferred_style].effectiveness_score = 0.50

    for k in other_keys:
        strategies[k].effectiveness_score = round(
            (strategies[k].effectiveness_score / other_total) * 0.50, 6
        )

    profile.explanation_profile.strategies = strategies
    profile.explanation_profile.primary_mode = req.preferred_style
    profile.explanation_profile.updated_at = datetime.utcnow()

    # Optionally lock for 7 days so the AI won't auto-override
    if req.lock:
        profile.metadata["style_lock_until"] = (
            datetime.utcnow() + timedelta(days=7)
        ).isoformat()
        profile.metadata["style_locked_by"] = str(current_user["id"])

    profile.updated_at = datetime.utcnow()
    await service.store.upsert_profile(profile)

    return {
        "user_id": user_id,
        "primary_mode": req.preferred_style,
        "locked": req.lock,
        "style_weights": {
            k: v.effectiveness_score for k, v in strategies.items()
        }
    }

from app.store.redis_client import redis_client
from app.personalization.schemas import ActivityLoggedPayload
import json

# ---------------------------------------------------------------------------
# Notes (Personal Learning Artifacts)
# ---------------------------------------------------------------------------

@router.get("/notes")
async def get_notes(
    current_user: dict = Depends(get_current_user),
    store: UserDataStore = Depends(get_user_data_store),
):
    """Get all notes for the current user."""
    return await store.get_notes(current_user["id"])


@router.post("/notes")
async def save_note(
    request: NoteRequest,
    current_user: dict = Depends(get_current_user),
    store: UserDataStore = Depends(get_user_data_store),
):
    """Save a student note for the current user."""
    note = await store.add_note(
        current_user["id"], 
        request.content, 
        title=request.title, 
        subject=request.subject
    )
    
    if not note:
        raise HTTPException(status_code=500, detail="Failed to save note")

    db = get_scoped_db(current_user)
    await get_personalization_service(db=db).record_event(
        current_user["id"],
        LearningEventType.NOTE_ADDED,
        payload=NoteAddedPayload(
            title=request.title,
            subject=request.subject,
            content=request.content,
        ).model_dump(exclude_none=True),
        source="personalization_router",
        role=current_user.get("role", "student"),
    )
    return {"status": "success", "success": True, "id": note["id"], "message": "Note saved"}


@router.put("/notes/{note_id}")
async def update_note(
    note_id: str,
    request: NoteRequest,
    current_user: dict = Depends(get_current_user),
    store: UserDataStore = Depends(get_user_data_store),
):
    """Update an existing note for the current user."""
    success = await store.update_note(
        current_user["id"], 
        note_id, 
        request.content, 
        title=request.title, 
        subject=request.subject
    )
    if not success:
        raise HTTPException(status_code=404, detail="Note not found")
    
    return {"status": "success", "message": "Note updated"}


@router.delete("/notes/{note_id}")
async def delete_note(
    note_id: str,
    current_user: dict = Depends(get_current_user),
    store: UserDataStore = Depends(get_user_data_store),
):
    """Delete a note for the current user."""
    success = await store.delete_note(current_user["id"], note_id)
    if not success:
        raise HTTPException(status_code=404, detail="Note not found")
    
    return {"status": "success", "message": "Note deleted"}


# ---------------------------------------------------------------------------
# Student Engagement
# ---------------------------------------------------------------------------

@router.post("/activity")
async def log_student_activity(
    request: ActivityLogRequest,
    current_user: dict = Depends(get_current_user),
):
    """Log a study session activity event and trigger analytics recomputation."""
    student_id = current_user["id"]
    db = get_scoped_db(current_user)
    personalization = get_personalization_service(db=db)

    await personalization.record_event(
        student_id,
        LearningEventType.ACTIVITY_LOGGED,
        payload=ActivityLoggedPayload(
            course_id=request.course_id,
            duration_minutes=request.duration_minutes,
        ).model_dump(exclude_none=True),
        source="personalization_router",
        course_id=request.course_id,
        role=current_user.get("role", "student"),
    )

    # Invalidate analytics + dashboard cache
    try:
        await asyncio.gather(
            redis_client.delete(f"analytics:student:{student_id}"),
            redis_client.delete(f"dashboard:student:{student_id}"),
        )
    except Exception:
        pass

    return {"status": "success", "message": "Activity logged"}


@router.post("/lesson-complete")
async def complete_lesson(
    request: LessonCompletionRequest,
    current_user: dict = Depends(get_current_user),
):
    """Mark a lesson as complete and update student progress."""
    db = get_scoped_db(current_user)
    student_store = StudentStore(db=db)
    result = await student_store.complete_lesson(current_user["id"], request.course_id, request.lesson_id)
    if not result.get("success"):
        raise HTTPException(status_code=500, detail="Failed to mark lesson as complete")

    await get_personalization_service(db=db).record_event(
        current_user["id"],
        LearningEventType.LESSON_COMPLETED,
        payload=LessonCompletedPayload(
            lesson_id=request.lesson_id,
            course_id=request.course_id,
            progress=result.get("progress", 0),
        ).model_dump(exclude_none=True),
        source="personalization_router",
        course_id=request.course_id,
        role=current_user.get("role", "student"),
    )

    return {"status": "success", "message": "Lesson completed"}
