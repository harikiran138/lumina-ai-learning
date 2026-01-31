from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from typing import Optional
import shutil
import os
import uuid
from datetime import datetime
from app.services.ocr_service import ocr_service

router = APIRouter()

UPLOAD_DIR = "data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...), 
    type: str = Form(...), # 'assignment' or 'note'
    user_id: str = Form("guest"),
    course_id: str = Form("default"),
    assignment_id: Optional[str] = Form(None)
):
    """
    Upload and Digitizes a handwritten assignment or note using TrOCR.
    """
    try:
        # 1. Save File locally
        file_id = str(uuid.uuid4())
        ext = file.filename.split(".")[-1] if file.filename else "jpg"
        filename = f"{file_id}.{ext}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        # Read file content once for both saving and processing
        content = await file.read()
        
        with open(file_path, "wb") as buffer:
            buffer.write(content)
            
        # 2. Perform Real OCR
        print(f"Starting OCR for file: {filename}")
        extracted_text = ""
        
        # Determine file type and process
        if ext.lower() in ['jpg', 'jpeg', 'png', 'bmp', 'webp']:
            # Run OCR in a separate thread to avoid blocking the event loop
            import asyncio
            extracted_text = await asyncio.to_thread(ocr_service.digitize_image, content)
        elif ext.lower() == 'pdf':
             # Placeholder for PDF logic: 
             # For now, we will treat it as a warning since basic implementation handles images.
             # Real PDF support would require pdf2image library + poppler
             extracted_text = "[PDF Processing requires additional setup. Please upload images (JPG/PNG) for best results.]"
        else:
             extracted_text = "[Unsupported file format for OCR]"
        
        print(f"OCR Complete. Extracted {len(extracted_text)} characters.")

        # 3. Prepare response
        # TODO: Here you would also save to MongoDB/Postgres database
        
        doc_data = {
            "id": file_id,
            "course_id": course_id,
            "type": type,
            "image_path": f"/uploads/{filename}", # Return accessible URL path
            "digital_text": extracted_text,
            "timestamp": datetime.now().isoformat(),
            "assignment_id": assignment_id,
            "mock_mode": False
        }
        
        if type == "note":
            # In a real app, you might chain another LLM call here to summarize the extracted text
            doc_data["ai_analysis"] = "Note digitized successfully. You can now edit the text or ask the AI Tutor to summarize it."
            
        return {"status": "success", "data": doc_data}
        
    except Exception as e:
        print(f"Upload/OCR error: {str(e)}")
        # Return a meaningful error to the frontend even if backend fails
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@router.get("/health")
def health():
    return {"status": "healthy", "mode": "active_ocr"}
