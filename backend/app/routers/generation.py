import json
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ai_engine.llm import get_llm_provider
from app.routers.auth import get_current_user
from app.services.personalization_service import get_personalization_service
from app.services.ppt_generator import PPTGenerator
from app.store.course_store import CourseStore
from app.store.generation_store import GenerationStore

router = APIRouter(prefix="/api/generation", tags=["generation"])


class GenerationBase(BaseModel):
    provider: str = "auto"
    standards: Optional[List[str]] = None


class CourseGenerationRequest(GenerationBase):
    topic: str
    level: str = "Beginning"
    modules: int = 4
    publish: bool = False


class QuestionBankRequest(GenerationBase):
    topic: str
    difficulty: str = "medium"
    count: int = 8


class RubricGenerationRequest(GenerationBase):
    assignment_id: Optional[str] = None
    title: str
    description: str
    criteria_count: int = 4


class FlashcardGenerationRequest(GenerationBase):
    topic: str
    source_text: Optional[str] = None
    count: int = 10


class RemediationGenerationRequest(GenerationBase):
    user_id: str
    topic: str
    weak_concepts: List[str] = Field(default_factory=list)
    evidence: List[str] = Field(default_factory=list)
    score: Optional[float] = None


class PPTGenerationRequest(GenerationBase):
    lesson_title: str
    lesson_content: str
    slides_count: int = 8


class AssetReviewRequest(BaseModel):
    status: str
    review_notes: Optional[str] = None


def _parse_llm_json(raw_response: str) -> Dict[str, Any]:
    clean_response = raw_response.replace("```json", "").replace("```", "").strip()
    return json.loads(clean_response)


@router.post("/course")
async def generate_course(request: CourseGenerationRequest, current_user: dict = Depends(get_current_user)):
    llm = get_llm_provider(request.provider or "auto")
    standards = request.standards or ["Common Core"]

    system_prompt = (
        "You are a senior curriculum designer. Return only valid JSON. "
        "Include standards_alignment at the course level."
    )
    user_prompt = f"""
Generate a course about "{request.topic}".
Level: {request.level}
Modules: {request.modules}
Standards alignment: {", ".join(standards)}

Return JSON:
{{
  "title": "...",
  "description": "...",
  "estimated_duration": "...",
  "standards_alignment": ["..."],
  "modules": [
    {{
      "id": "module-1",
      "title": "...",
      "description": "...",
      "topics": ["Topic 1", "Topic 2"]
    }}
  ]
}}
"""
    try:
        raw_response = await llm.agenerate(user_prompt, system_prompt)
        data = _parse_llm_json(raw_response)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    data.setdefault("standards_alignment", standards)
    asset = await GenerationStore().create_asset(
        asset_type="course",
        payload=data,
        created_by=current_user.get("id", "system"),
        metadata={"standards_alignment": standards, "confidence": 0.72},
    )

    course_obj = None
    if request.publish:
        course_obj = await CourseStore().create_course_from_blueprint(
            data, current_user.get("id", "system")
        )
        await GenerationStore().update_asset(asset["id"], {"status": "published", "review_status": "approved"})

    return {"asset": asset, "course": course_obj, "blueprint": data}


@router.post("/question-bank")
async def generate_question_bank(request: QuestionBankRequest, current_user: dict = Depends(get_current_user)):
    llm = get_llm_provider(request.provider or "auto")
    standards = request.standards or ["Common Core"]
    system_prompt = "You generate assessment questions. Return only valid JSON."
    user_prompt = f"""
Create {request.count} questions on "{request.topic}" at {request.difficulty} level.
Include a mix of MCQ, short answer, and long answer.
Standards alignment: {", ".join(standards)}.

Return JSON:
{{
  "topic": "{request.topic}",
  "standards_alignment": ["..."],
  "questions": [
    {{"type":"mcq","question":"...","options":["A","B","C","D"],"answer":0,"explanation":"..."}},
    {{"type":"short","question":"...","answer":"...","rubric":["..."]}}
  ]
}}
"""
    try:
        raw_response = await llm.agenerate(user_prompt, system_prompt)
        data = _parse_llm_json(raw_response)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    data.setdefault("standards_alignment", standards)
    asset = await GenerationStore().create_asset(
        asset_type="question_bank",
        payload=data,
        created_by=current_user.get("id", "system"),
        metadata={"standards_alignment": standards, "confidence": 0.68},
    )
    return {"asset": asset, "question_bank": data}


@router.post("/rubric")
async def generate_rubric(request: RubricGenerationRequest, current_user: dict = Depends(get_current_user)):
    llm = get_llm_provider(request.provider or "auto")
    standards = request.standards or ["Common Core"]
    system_prompt = "You generate grading rubrics. Return only valid JSON."
    user_prompt = f"""
Generate a {request.criteria_count}-criterion rubric for the assignment.
Title: {request.title}
Description: {request.description}
Standards alignment: {", ".join(standards)}.

Return JSON:
{{
  "title": "{request.title}",
  "assignment_id": "{request.assignment_id or ''}",
  "criteria": [
    {{"title":"Criterion","description":"...","max_points":10,"weight":1.0,"indicators":["..."]}}
  ],
  "standards_alignment": ["..."]
}}
"""
    try:
        raw_response = await llm.agenerate(user_prompt, system_prompt)
        data = _parse_llm_json(raw_response)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    data.setdefault("standards_alignment", standards)
    asset = await GenerationStore().create_asset(
        asset_type="rubric",
        payload=data,
        created_by=current_user.get("id", "system"),
        metadata={"standards_alignment": standards, "confidence": 0.7},
    )
    return {"asset": asset, "rubric": data}


@router.post("/flashcards")
async def generate_flashcards(request: FlashcardGenerationRequest, current_user: dict = Depends(get_current_user)):
    llm = get_llm_provider(request.provider or "auto")
    standards = request.standards or ["Common Core"]
    system_prompt = "You generate flashcards for spaced repetition. Return only JSON."
    user_prompt = f"""
Topic: {request.topic}
Standards alignment: {", ".join(standards)}
Generate {request.count} flashcards from this source text:
{request.source_text or request.topic}

Return JSON:
{{
  "topic": "{request.topic}",
  "standards_alignment": ["..."],
  "cards": [{{"front":"...","back":"..."}}]
}}
"""
    try:
        raw_response = await llm.agenerate(user_prompt, system_prompt)
        data = _parse_llm_json(raw_response)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    data.setdefault("standards_alignment", standards)
    asset = await GenerationStore().create_asset(
        asset_type="flashcards",
        payload=data,
        created_by=current_user.get("id", "system"),
        metadata={"standards_alignment": standards, "confidence": 0.66},
    )
    return {"asset": asset, "flashcards": data}


@router.post("/remediation")
async def generate_remediation(request: RemediationGenerationRequest, current_user: dict = Depends(get_current_user)):
    llm = get_llm_provider(request.provider or "auto")
    standards = request.standards or ["Common Core"]
    system_prompt = "You are a remediation coach. Return only JSON."
    user_prompt = f"""
Student topic: {request.topic}
Weak concepts: {", ".join(request.weak_concepts) if request.weak_concepts else "N/A"}
Evidence: {request.evidence}
Score: {request.score if request.score is not None else "N/A"}
Standards alignment: {", ".join(standards)}

Return JSON:
{{
  "topic": "{request.topic}",
  "confidence": 0.0,
  "standards_alignment": ["..."],
  "plan": [
    {{"step":"...","activity":"...","estimated_minutes":10}}
  ]
}}
"""
    try:
        raw_response = await llm.agenerate(user_prompt, system_prompt)
        data = _parse_llm_json(raw_response)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    data.setdefault("standards_alignment", standards)
    data.setdefault("confidence", 0.65)

    asset = await GenerationStore().create_asset(
        asset_type="remediation",
        payload=data,
        created_by=current_user.get("id", "system"),
        metadata={"standards_alignment": standards, "confidence": data.get("confidence")},
    )

    # Link remediation back to learner profile
    service = get_personalization_service()
    await service.save_remediation_plan(
        request.user_id,
        remediation_plan=data,
        topic=request.topic,
        source="generation",
    )

    return {"asset": asset, "remediation": data}


@router.post("/ppt")
async def generate_ppt(request: PPTGenerationRequest, current_user: dict = Depends(get_current_user)):
    generator = PPTGenerator()
    try:
        download_url = generator.generate_ppt(
            topic=request.lesson_title,
            lesson_content=request.lesson_content,
            slides_count=request.slides_count,
            user_id=current_user.get("id", "system"),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    asset = await GenerationStore().create_asset(
        asset_type="ppt",
        payload={
            "lesson_title": request.lesson_title,
            "slides_count": request.slides_count,
            "download_url": download_url,
        },
        created_by=current_user.get("id", "system"),
        metadata={"confidence": 0.6},
    )
    return {"asset": asset, "download_url": download_url}


@router.get("/assets")
async def list_generation_assets(
    asset_type: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    store = GenerationStore()
    assets = await store.list_assets(
        asset_type=asset_type,
        status=status,
        created_by=current_user.get("id"),
    )
    return {"assets": assets}


@router.post("/assets/{asset_id}/review")
async def review_asset(
    asset_id: str,
    request: AssetReviewRequest,
    current_user: dict = Depends(get_current_user),
):
    store = GenerationStore()
    updated = await store.update_asset(
        asset_id,
        {
            "review_status": request.status,
            "review_notes": request.review_notes,
            "reviewed_by": current_user.get("id", "system"),
            "status": "reviewed" if request.status == "approved" else "draft",
        },
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Asset not found")
    return {"asset": updated}
