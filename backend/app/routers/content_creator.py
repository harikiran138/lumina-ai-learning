from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from .auth import get_current_user
from app.store.content_creator_store import ContentCreatorStore
from app.dependencies import get_content_creator_store

router = APIRouter()

class BlueprintRequest(BaseModel):
    title: str
    structure: Dict[str, Any]

class LessonSequenceRequest(BaseModel):
    blueprint_id: str
    sequence_data: List[Dict[str, Any]]

@router.post("/blueprints")
async def create_course_blueprint(
    request: BlueprintRequest,
    current_user: dict = Depends(get_current_user),
    store: ContentCreatorStore = Depends(get_content_creator_store)
):
    if current_user.get("role") != "content_creator":
        raise HTTPException(status_code=403, detail="Forbidden")
    
    blueprint = await store.create_blueprint(current_user["id"], request.title, request.structure)
    if not blueprint:
        raise HTTPException(status_code=500, detail="Failed to create blueprint")
    return {"status": "success", "blueprint": blueprint}

@router.post("/lesson-sequence")
async def add_lesson_sequence(
    request: LessonSequenceRequest,
    current_user: dict = Depends(get_current_user),
    store: ContentCreatorStore = Depends(get_content_creator_store)
):
    if current_user.get("role") != "content_creator":
        raise HTTPException(status_code=403, detail="Forbidden")
    
    sequence = await store.add_lesson_sequence(request.blueprint_id, request.sequence_data)
    if not sequence:
        raise HTTPException(status_code=500, detail="Failed to add lesson sequence")
    return {"status": "success", "sequence": sequence}
