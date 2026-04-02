from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from typing import Optional, List
import shutil
import os
import uuid
from datetime import datetime
from ai_engine.swarm.handwriting_agent import HandwritingAgent
from ai_engine.llm import get_llm_provider
from learner_profile.store.state import StateStore

router = APIRouter()
agent = HandwritingAgent()
llm = get_llm_provider()
state_store = StateStore()

UPLOAD_DIR = "data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    type: str = Form(...),  # 'assignment' or 'note'
    user_id: str = Form("guest"),
    course_id: str = Form("default"),
    assignment_id: Optional[str] = Form(None),  # Link to definition
):
    """
    Upload an assignment or note.
    - Digitizes handwriting.
    - If Note: Summarizes and improves.
    - If Assignment: preparation for grading.
    """
    try:
        # 1. Save File
        file_id = str(uuid.uuid4())
        ext = file.filename.split(".")[-1]
        file_path = os.path.join(UPLOAD_DIR, f"{file_id}.{ext}")

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 2. Analyze (Digitize)
        analysis_result = agent.analyze(file_path)
        extracted_text = analysis_result.get("extracted_text", "")

        # 3. Confidence gate — if OCR confidence is below 70 % the submission
        #    must be flagged for manual teacher review instead of auto-processing.
        ocr_confidence: float = float(analysis_result.get("confidence", 1.0))
        OCR_CONFIDENCE_THRESHOLD = 0.70

        requires_teacher_review = ocr_confidence < OCR_CONFIDENCE_THRESHOLD

        # 4. Build base document record
        doc_data = {
            "id": file_id,
            "course_id": course_id,
            "type": type,
            "image_path": file_path,
            "digital_text": extracted_text,
            "ocr_confidence": round(ocr_confidence, 4),
            "requires_teacher_review": requires_teacher_review,
            "timestamp": datetime.now().isoformat(),
            "assignment_id": assignment_id,
        }

        if type == "note":
            if requires_teacher_review:
                # Low-confidence notes: skip AI enhancement; surface original scan.
                doc_data["ai_analysis"] = None
                doc_data["review_reason"] = (
                    f"OCR confidence {ocr_confidence:.0%} is below the required "
                    f"{OCR_CONFIDENCE_THRESHOLD:.0%} threshold. "
                    "Please verify the digitized text manually."
                )
            else:
                # AI Improvements for Notes
                system_prompt = (
                    "You are an expert academic assistant. Improve and summarize the following notes."
                )
                user_prompt = (
                    f"Notes:\n{extracted_text}\n\nTask:\n"
                    "1. Create a concise summary.\n"
                    "2. Provide an improved, well-structured version of these notes."
                )

                try:
                    ai_response = await llm.agenerate(user_prompt, system_prompt)
                    doc_data["ai_analysis"] = ai_response
                except Exception as e:
                    doc_data["ai_analysis"] = f"AI Analysis failed: {e}"

            # Store in State
            state = await state_store.get_state(user_id)
            state["notes"].append(doc_data)
            await state_store.update_state(user_id, state)

        elif type == "assignment":
            if requires_teacher_review:
                # Low-confidence submissions wait for manual teacher grading.
                doc_data["status"] = "pending_review"
                doc_data["score"] = None
                doc_data["remarks"] = (
                    f"Automatic processing skipped: OCR confidence {ocr_confidence:.0%} "
                    f"is below {OCR_CONFIDENCE_THRESHOLD:.0%}. Teacher review required."
                )
            else:
                # High-confidence: proceed with normal submission flow.
                doc_data["status"] = "submitted"
                doc_data["score"] = None
                doc_data["remarks"] = ""

            # Store in State
            state = await state_store.get_state(user_id)
            state["assignments"].append(doc_data)
            await state_store.update_state(user_id, state)

        return {
            "status": "success",
            "data": doc_data,
            "ocr_confidence": ocr_confidence,
            "requires_teacher_review": requires_teacher_review,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/grade")
async def grade_assignment(
    assignment_id: str = Form(...),
    score: float = Form(...),  # 0-100 OR 0.0-1.0
    remarks: str = Form(...),
    user_id: str = Form("guest"),
):
    """
    Teacher updates score and remarks.
    """
    state = await state_store.get_state(user_id)
    assignments = state.get("assignments", [])

    found = False
    for asm in assignments:
        if asm["id"] == assignment_id:
            asm["score"] = score
            asm["remarks"] = remarks
            asm["status"] = "graded"
            found = True

            # Update Skill Sequence for Pathway (Simple Heuristic)
            # If high score, assume mastery of current "topic" (mocked)
            normalized_score = score if score <= 1.0 else score / 100.0
            is_correct = 1 if normalized_score > 0.7 else 0

            # Append to generic history for now (Pathway uses `correct_sequence`)
            # In a real app we'd map assignment_id to a skill_id
            if "correct_sequence" not in state:
                state["correct_sequence"] = []
            state["correct_sequence"].append(is_correct)

            # Dummy skill ID mapping
            if "skill_sequence" not in state:
                state["skill_sequence"] = []
            state["skill_sequence"].append(hash(assignment_id) % 100)  # Mock skill ID

            break

    if not found:
        raise HTTPException(status_code=404, detail="Assignment not found")

    await state_store.update_state(user_id, state)
    return {"status": "graded", "assignment_id": assignment_id}


@router.get("/list")
async def list_content(user_id: str = "guest", type: str = "all"):
    state = await state_store.get_state(user_id)
    if type == "assignment":
        return state.get("assignments", [])
    elif type == "note":
        return state.get("notes", [])
    return {"assignments": state.get("assignments", []), "notes": state.get("notes", [])}
