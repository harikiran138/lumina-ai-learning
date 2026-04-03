from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from typing import Optional
import os
import uuid
from datetime import datetime
from io import BytesIO
from PIL import Image
from app.services.ocr_service import ocr_service
from app.store.assignment_store import AssignmentStore

router = APIRouter()

UPLOAD_DIR = "data/uploads"
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    type: str = Form(...),  # 'assignment' or 'note'
    user_id: str = Form("guest"),
    course_id: str = Form("default"),
    assignment_id: Optional[str] = Form(None),
):
    try:
        # 1. Validate file size
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum size is {MAX_FILE_SIZE / (1024*1024)}MB",
            )
        await file.seek(0)

        # 2. Save File using Unified Storage Service (S3 or Local)
        from app.services.storage import storage_service

        file_id = str(uuid.uuid4())
        ext = file.filename.split(".")[-1] if file.filename else "jpg"
        file_name = f"{file_id}.{ext}"

        # Returns either local path or s3:// key
        file_location = storage_service.upload_file(file, file_name)

        # 3. Perform OCR with TrOCR/Gemini pipeline
        print(f"Starting OCR for file: {file_name}")
        image = Image.open(BytesIO(content))
        ocr_result = await ocr_service.extract_text(image, method="auto")
        extracted_text = ocr_result.text.strip() or "[Unsupported or empty document content]"

        print(f"OCR Complete. Extracted {len(extracted_text)} characters.")

        # 4. Prepare response and Save to DB
        doc_data = {
            "id": file_id,
            "course_id": course_id,
            "type": type,
            "image_path": f"/uploads/{file_name}",  # Fixed: use file_name instead of undefined filename
            "digital_text": extracted_text,
            "ocr_confidence": ocr_result.confidence,
            "requires_teacher_review": ocr_result.is_flagged,
            "ocr_model": ocr_result.model_used,
            "timestamp": datetime.now().isoformat(),
            "assignment_id": assignment_id,
        }

        if type == "note":
            from app.store.user_data_store import UserDataStore

            user_ds = UserDataStore()
            user_ds.add_note(user_id, extracted_text)
            doc_data["ai_analysis"] = "Note digitized and saved to your personal knowledge base."
        elif type == "assignment" and assignment_id:
            assignment_store = AssignmentStore()
            submission = await assignment_store.submit_assignment(
                assignment_id,
                user_id,
                file_location,
                content=extracted_text,
                submission_type="handwriting_upload",
            )
            if ocr_result.is_flagged:
                await assignment_store.db.update(
                    "assignment_submissions",
                    {
                        "status": "pending_review",
                        "text_content": extracted_text,
                        "review_reason": "OCR confidence below teacher-review threshold",
                    },
                    {"id": submission["id"]},
                )
                doc_data["ai_analysis"] = "OCR completed. Submission routed to teacher review before grading."
            else:
                from app.worker import task_grade_submission

                task = task_grade_submission.delay(
                    assignment_id,
                    submission["id"],
                    "",
                    file_location,
                    None,
                )
                doc_data["ai_analysis"] = "OCR completed. AI assessment queued for teacher verification."
                doc_data["grading_task_id"] = task.id
            doc_data["submission_id"] = submission["id"]

        return {"status": "success", "data": doc_data}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Upload/OCR error: {str(e)}")
        # Return a meaningful error to the frontend even if backend fails
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


@router.get("/health")
def health():
    return {"status": "healthy", "mode": "active_ocr"}
