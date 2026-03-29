import asyncio
from pathlib import Path
from typing import Optional, List, Dict, Any
from PIL import Image
from app.core.config import settings
from app.core.logging import structlog
from app.database.supabase_manager import supabase_db
from app.database.models import SubmissionStatus, QuestionStatus, HandwrittenSubmission, HandwrittenSubmissionQuestion
from app.services.ocr_service import check_image_quality, segment_by_question_markers, run_trocr, run_trocr_api, run_gemini_ocr
from app.services.evaluation_service import evaluate_answer

log = structlog.get_logger()

async def process_handwritten_submission(submission_id: str):
    """
    Main background pipeline:
    1. Update status to PROCESSING
    2. Load image and check quality
    3. Segment by questions
    4. Run OCR on each segment
    5. Evaluate each answer with AI
    6. Update database with results
    """
    log.info("starting_handwritten_pipeline", submission_id=submission_id)
    
    try:
        # 1. Update Status
        await supabase_db.update("handwritten_submissions", {"status": "processing"}, {"id": submission_id})
        
        # 2. Get Submission Details
        submission = await supabase_db.fetch_one("handwritten_submissions", {"id": submission_id})
        if not submission:
            log.error("submission_not_found", submission_id=submission_id)
            return

        assignment_id = submission["assignment_id"]
        file_path = submission["original_file_path"]
        
        # Load local file (assuming it was saved to UPLOAD_DIR during upload)
        if not Path(file_path).exists():
             await supabase_db.update("handwritten_submissions", {"status": "error", "processing_log": ["File not found on disk."]}, {"id": submission_id})
             return

        image = Image.open(file_path)
        
        # 3. Quality Check
        quality = check_image_quality(image)
        if not quality.ok:
            await supabase_db.update("handwritten_submissions", {"status": "error", "processing_log": [quality.reason]}, {"id": submission_id})
            return

        # 4. Segmentation
        segments = segment_by_question_markers(image)
        log.info("segmentation_complete", count=len(segments))

        # 5. Get Assignment Questions/Rubrics
        questions = await supabase_db.fetch_all("handwritten_questions", {"assignment_id": assignment_id})
        questions_map = {q["number"]: q for q in questions}

        total_ai_score = 0.0
        
        # 6. Process Segments
        for i, segment in enumerate(segments):
            q_num = segment.question_number
            q_meta = questions_map.get(q_num)
            
            if not q_meta:
                log.warn("no_rubric_for_question", question_number=q_num)
                continue

            # Run OCR — prefer Gemini Vision (fast, no local model), then HF API, then local TrOCR
            ocr_result = None
            if settings.ASSESSMENT_API_KEY:
                ocr_result = await run_gemini_ocr(segment.image)
            elif settings.HF_TOKEN:
                ocr_result = await run_trocr_api(segment.image, settings.HF_TOKEN)
            else:
                loop = asyncio.get_event_loop()
                ocr_result = await loop.run_in_executor(None, run_trocr, segment.image)

            if not ocr_result or not ocr_result.text:
                from app.services.ocr_service import OCRResult
                ocr_result = OCRResult(text="[No text detected]", confidence=0.0, is_flagged=True, model_used="none")

            # Store Segment Image (Mocking storage for now - would upload to Supabase Storage)
            # segment_image_url = await upload_segment(segment.image, submission_id, q_num)

            # AI Evaluation
            evaluation = await evaluate_answer(
                question_text=q_meta["text"],
                max_marks=q_meta["max_marks"],
                rubric=q_meta.get("rubric", {}),
                student_answer=ocr_result.text,
                ocr_confidence=ocr_result.confidence,
                hf_token=settings.HF_TOKEN,
                openai_key=settings.OPENAI_API_KEY
            )

            # Save Question Result
            q_submission = {
                "submission_id": submission_id,
                "question_id": q_meta["id"],
                "status": "ai_graded",
                "ocr_raw_text": ocr_result.text,
                "ocr_confidence": ocr_result.confidence,
                "ocr_is_flagged": ocr_result.is_flagged,
                "ai_score": evaluation.score,
                "ai_reasoning": evaluation.reasoning,
                "ai_feedback": evaluation.feedback,
                "ai_confidence": evaluation.confidence,
                "final_score": evaluation.score
            }
            await supabase_db.insert("handwritten_submission_questions", q_submission)
            total_ai_score += evaluation.score

        # 7. Finalize Submission
        await supabase_db.update("handwritten_submissions", {
            "status": "ai_graded",
            "ai_total_score": total_ai_score,
            "final_score": total_ai_score
        }, {"id": submission_id})
        
        log.info("handwritten_pipeline_complete", submission_id=submission_id, score=total_ai_score)

    except Exception as e:
        log.exception("handwritten_pipeline_failed", submission_id=submission_id)
        await supabase_db.update("handwritten_submissions", {
            "status": "error",
            "processing_log": [f"Internal error: {str(e)}"]
        }, {"id": submission_id})
