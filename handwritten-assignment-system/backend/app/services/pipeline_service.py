"""
Submission Processing Pipeline.

Orchestrates: upload → quality check → segmentation → OCR → AI evaluation → DB write.
Each step is logged so the teacher can see exactly what happened and why.
"""
import logging
from pathlib import Path
from datetime import datetime
from typing import Optional

from PIL import Image
import pdf2image

from app.core.config import get_settings
from app.core.database import AsyncSessionLocal
from app.models.models import Submission, SubmissionQuestion, Question, SubmissionStatus, QuestionStatus
from app.services.ocr_service import (
    check_image_quality, segment_by_question_markers, run_trocr, run_trocr_api
)
from app.services.evaluation_service import evaluate_all_questions

logger = logging.getLogger(__name__)
settings = get_settings()


async def process_submission(submission_id: str) -> None:
    """
    Full async pipeline for one submission.
    Called as a background task after upload.
    """
    async with AsyncSessionLocal() as db:
        submission = await db.get(Submission, submission_id)
        if not submission:
            logger.error(f"Submission {submission_id} not found")
            return

        log = []

        def _log(msg: str):
            ts = datetime.utcnow().isoformat()
            log.append(f"[{ts}] {msg}")
            logger.info(f"[{submission_id}] {msg}")

        try:
            submission.status = SubmissionStatus.PROCESSING
            await db.commit()

            # ── 1. Load image(s) ──────────────────────────────────────────
            _log("Loading submission file")
            images = _load_images(submission.original_file_path)
            submission.page_count = len(images)
            _log(f"Loaded {len(images)} page(s)")

            # ── 2. Quality check (first page) ─────────────────────────────
            quality = check_image_quality(images[0], min_dpi=settings.image_min_dpi)
            _log(f"Quality check: {'OK' if quality.ok else 'FAILED'} — {quality.reason or 'passed'}")

            if not quality.ok:
                submission.status = SubmissionStatus.NEEDS_RESCAN
                submission.teacher_note = quality.reason
                submission.processing_log = log
                await db.commit()
                return

            # ── 3. Fetch questions for this assignment ────────────────────
            from sqlalchemy import select
            q_result = await db.execute(
                select(Question)
                .where(Question.assignment_id == submission.assignment_id)
                .order_by(Question.number)
            )
            questions = q_result.scalars().all()
            _log(f"Assignment has {len(questions)} questions")

            # ── 4. Segment image per question ─────────────────────────────
            # Use first page; multi-page support: concatenate all pages
            combined = _combine_pages(images)
            segments = segment_by_question_markers(combined)
            _log(f"Segmented into {len(segments)} sections")

            # ── 5. OCR each segment ───────────────────────────────────────
            sq_items = []
            questions_data = []

            for i, question in enumerate(questions):
                # Match segment to question (by index; fallback to whole image)
                seg = segments[i] if i < len(segments) else segments[0]

                # Save segment image
                seg_path = _save_segment(seg.image, submission_id, question.number)

                # Run OCR
                _log(f"Running OCR on Q{question.number}")
                if settings.huggingface_api_token and not _trocr_available_locally():
                    ocr = await run_trocr_api(
                        seg.image,
                        api_token=settings.huggingface_api_token,
                        confidence_threshold=settings.ocr_confidence_threshold,
                    )
                else:
                    ocr = run_trocr(
                        seg.image,
                        model_name=settings.trocr_model,
                        confidence_threshold=settings.ocr_confidence_threshold,
                    )

                _log(f"Q{question.number} OCR: conf={ocr.confidence:.2f}, flagged={ocr.is_flagged}")

                # Create SubmissionQuestion record
                sq = SubmissionQuestion(
                    submission_id=submission_id,
                    question_id=question.id,
                    status=QuestionStatus.FLAGGED if ocr.is_flagged else QuestionStatus.OCR_DONE,
                    segment_image_path=str(seg_path),
                    segment_bbox=seg.bbox,
                    ocr_raw_text=ocr.text,
                    ocr_confidence=ocr.confidence,
                    ocr_is_flagged=ocr.is_flagged,
                )
                db.add(sq)
                sq_items.append(sq)

                questions_data.append({
                    "question_text":  question.text,
                    "max_marks":      question.max_marks,
                    "rubric":         question.rubric,
                    "student_answer": ocr.text,
                    "ocr_confidence": ocr.confidence,
                })

            await db.flush()   # assign IDs before evaluation

            # ── 6. AI evaluation (all questions in parallel) ──────────────
            _log("Starting AI evaluation")
            results = await evaluate_all_questions(
                questions_data=questions_data,
                hf_model=settings.hf_llm_model,
                hf_token=settings.huggingface_api_token,
                openai_key=settings.openai_api_key,
                openai_model=settings.openai_model,
            )

            # ── 7. Write AI results back ──────────────────────────────────
            ai_total = 0.0
            for sq, result, question in zip(sq_items, results, questions):
                sq.ai_score      = result.score
                sq.ai_reasoning  = result.reasoning
                sq.ai_feedback   = result.feedback
                sq.ai_confidence = result.confidence
                if sq.status != QuestionStatus.FLAGGED:
                    sq.status = QuestionStatus.AI_GRADED
                ai_total += result.score
                _log(f"Q{question.number}: {result.score}/{result.max_score} ({result.model_used})")

            submission.ai_total_score = ai_total
            submission.status = SubmissionStatus.AI_EVALUATED
            submission.processing_log = log
            await db.commit()
            _log("Pipeline complete — ready for teacher review")

        except Exception as e:
            _log(f"ERROR: {e}")
            logger.exception(f"Pipeline failed for {submission_id}")
            submission.status = SubmissionStatus.PENDING
            submission.processing_log = log
            await db.commit()


# ── Helpers ───────────────────────────────────────────────────────────────────

def _load_images(file_path: str) -> list[Image.Image]:
    path = Path(file_path)
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        return pdf2image.convert_from_path(str(path), dpi=300)
    else:
        return [Image.open(path).convert("RGB")]


def _combine_pages(images: list[Image.Image]) -> Image.Image:
    if len(images) == 1:
        return images[0]
    total_h = sum(img.height for img in images)
    max_w   = max(img.width  for img in images)
    combined = Image.new("RGB", (max_w, total_h), (255, 255, 255))
    y = 0
    for img in images:
        combined.paste(img, (0, y))
        y += img.height
    return combined


def _save_segment(image: Image.Image, submission_id: str, q_num: int) -> Path:
    seg_dir = settings.upload_dir / "segments" / submission_id
    seg_dir.mkdir(parents=True, exist_ok=True)
    path = seg_dir / f"q{q_num}.png"
    image.save(str(path))
    return path


def _trocr_available_locally() -> bool:
    """Check if TrOCR can run locally (GPU or large RAM available)."""
    try:
        import torch
        return torch.cuda.is_available() or torch.backends.mps.is_available()
    except Exception:
        return False
