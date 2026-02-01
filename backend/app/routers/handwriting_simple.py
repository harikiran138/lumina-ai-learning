from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from typing import Optional
import shutil
import os
import uuid
from datetime import datetime
from app.services.ocr_service import ocr_service

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

        # 3. Perform Real OCR
        print(f"Starting OCR for file: {file_name}")
        extracted_text = ""

        # Determine file type and process
        if ext.lower() in ["jpg", "jpeg", "png", "bmp", "webp"]:
            # Run OCR in a separate thread to avoid blocking the event loop
            import asyncio

            extracted_text = await asyncio.to_thread(ocr_service.digitize_image, content)
        elif ext.lower() == "pdf":
            # Placeholder for PDF logic:
            # For now, we will treat it as a warning since basic implementation handles images.
            # Real PDF support would require pdf2image library + poppler
            extracted_text = "[PDF Processing requires additional setup. Please upload images (JPG/PNG) for best results.]"
        else:
            extracted_text = "[Unsupported file format for OCR]"

        print(f"OCR Complete. Extracted {len(extracted_text)} characters.")

        # 4. Prepare response and Save to DB
        doc_data = {
            "id": file_id,
            "course_id": course_id,
            "type": type,
            "image_path": f"/uploads/{file_name}",  # Fixed: use file_name instead of undefined filename
            "digital_text": extracted_text,
            "timestamp": datetime.now().isoformat(),
            "assignment_id": assignment_id,
        }

        if type == "note":
            from app.store.user_data_store import UserDataStore

            user_ds = UserDataStore()
            user_ds.add_note(user_id, extracted_text)
            doc_data["ai_analysis"] = "Note digitized and saved to your personal knowledge base."
        elif type == "assignment" and assignment_id:
            # In a real implementation, we would register this as a submission
            # and trigger the background grading worker.
            doc_data[
                "ai_analysis"
            ] = "Assignment uploaded. Head to assignments to track grading status."

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
