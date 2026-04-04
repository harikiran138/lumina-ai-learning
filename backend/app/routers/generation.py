from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil
import os
import uuid
from ..services.ai.generation_service import content_generator

router = APIRouter()

# Temporary upload path
TEMP_UPLOAD_DIR = "/tmp/lumina_uploads"
os.makedirs(TEMP_UPLOAD_DIR, exist_ok=True)

@router.post("/blueprint-from-pdf")
async def generate_blueprint_from_pdf(file: UploadFile = File(...)):
    """Receives a PDF and returns an AI-generated course blueprint."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(TEMP_UPLOAD_DIR, unique_filename)
    
    try:
        # Step 1: Save the temporary file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Step 2: Use the ContentGenerator to process the PDF
        blueprint = await content_generator.generate_blueprint_from_pdf(file_path)
        
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
