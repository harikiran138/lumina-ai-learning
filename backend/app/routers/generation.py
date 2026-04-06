from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil
import os
import uuid
from ..services.ai.generation_service import content_generator

router = APIRouter()

import tempfile
# Temporary upload path
TEMP_UPLOAD_DIR = os.path.join(tempfile.gettempdir(), "lumina_uploads")
os.makedirs(TEMP_UPLOAD_DIR, exist_ok=True)

@router.post("/blueprint-from-pdf")
async def generate_blueprint_from_file(file: UploadFile = File(...)):
    """Receives a PDF or Image and returns an AI-generated course blueprint."""
    allowed_extensions = {".pdf", ".jpg", ".jpeg", ".png", ".webp"}
    file_ext = os.path.splitext(file.filename.lower())[1]
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}"
        )
    
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(TEMP_UPLOAD_DIR, unique_filename)
    
    try:
        # Step 1: Save the temporary file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Step 2: Use the ContentGenerator to process the file
        # It now detects extension internally or we can pass it
        blueprint = await content_generator.generate_blueprint_from_file(file_path)
        
        return {
            "success": True,
            "blueprint": blueprint
        }
    except Exception as e:
        print(f"Blueprint Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")
    finally:
        # Cleanup temporary file
        if os.path.exists(file_path):
            os.remove(file_path)
