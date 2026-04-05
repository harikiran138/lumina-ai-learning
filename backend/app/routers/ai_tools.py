from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from app.api.deps import get_current_user
from app.database.supabase_manager import supabase_db
from app.services.ai_tools import generate_flashcards, generate_mindmap
from app.services.fsrs_engine import create_card

router = APIRouter(tags=["ai-tools"])


class FlashcardGenerateRequest(BaseModel):
    student_id: str
    content_text: str
    concept_ids: List[str] = []
    language_code: str = "en"


class MindmapGenerateRequest(BaseModel):
    student_id: str
    content_text: str
    root_concept: str


@router.post("/flashcards/generate")
async def generate_flashcard_set(
    body: FlashcardGenerateRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Generate AI flashcards from content text, then create FSRS cards for each.
    Returns flashcard_set_id and the list of generated cards.
    """
    try:
        client = supabase_db.get_client()
        result = await generate_flashcards(
            client,
            student_id=body.student_id,
            content_text=body.content_text,
            concept_ids=body.concept_ids,
            language_code=body.language_code,
        )

        # Create FSRS scheduling records for each generated card
        cards = result.get("cards", [])
        for card in cards:
            try:
                await create_card(
                    client,
                    student_id=body.student_id,
                    front=card.get("front", ""),
                    back=card.get("back", ""),
                    concept_id=card.get("concept_id"),
                    source="ai_generated",
                )
            except Exception:
                # Non-fatal: card generation is best-effort
                pass

        return {
            "flashcard_set_id": result.get("flashcard_set_id"),
            "cards": cards,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate flashcards: {str(e)}")


@router.post("/mindmap/generate")
async def generate_mindmap_endpoint(
    body: MindmapGenerateRequest,
    current_user: dict = Depends(get_current_user),
):
    """Generate an AI mind map from content text. Returns nodes and edges."""
    try:
        client = supabase_db.get_client()
        result = await generate_mindmap(
            client,
            student_id=body.student_id,
            content_text=body.content_text,
            root_concept=body.root_concept,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate mind map: {str(e)}")
