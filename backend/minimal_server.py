from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import shutil
import os
import uuid
from datetime import datetime

# Simple FastAPI app with PDF text extraction
app = FastAPI(title="Lumina Backend API - With PDF Extraction")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory
UPLOAD_DIR = "data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
def read_root():
    return {"message": "Welcome to Lumina API", "mode": "pdf_extraction_enabled"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "mode": "pdf_extraction_enabled"}

# Handwriting routes
handwriting_router = APIRouter()

@handwriting_router.post("/upload")
async def upload_handwriting(
    file: UploadFile = File(...), 
    type: str = Form(...),
    user_id: str = Form("guest"),
    course_id: str = Form("default"),
    assignment_id: Optional[str] = Form(None)
):
    """Upload handwriting/PDF - Automatically extracts text from PDFs"""
    try:
        # Save file
        file_id = str(uuid.uuid4())
        ext = file.filename.split(".")[-1] if file.filename else "jpg"
        file_path = os.path.join(UPLOAD_DIR, f"{file_id}.{ext}")
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Try to extract REAL text from PDF
        extracted_text = ""
        is_real_extraction = False
        
        if ext.lower() == "pdf":
            try:
                import PyPDF2
                print(f"📄 Extracting text from PDF: {file.filename}")
                with open(file_path, 'rb') as pdf_file:
                    pdf_reader = PyPDF2.PdfReader(pdf_file)
                    num_pages = len(pdf_reader.pages)
                    print(f"   📖 PDF has {num_pages} pages")
                    
                    for page_num, page in enumerate(pdf_reader.pages, 1):
                        page_text = page.extract_text()
                        if page_text:
                            extracted_text += f"\n\n--- PAGE {page_num} ---\n\n{page_text}"
                    
                if extracted_text.strip():
                    is_real_extraction = True
                    print(f"   ✅ Successfully extracted {len(extracted_text)} characters from PDF")
                else:
                    extracted_text = f"⚠️ PDF Extraction Warning\n\nThe PDF '{file.filename}' appears to contain only images or scanned pages.\nNo extractable text was found.\n\nTo digitize scanned PDFs, you would need OCR (Optical Character Recognition)."
                    
            except ImportError:
                extracted_text = "❌ PyPDF2 is not installed.\n\nRun: pip install PyPDF2"
            except Exception as e:
                print(f"   ❌ PDF extraction error: {str(e)}"
)
                extracted_text = f"❌ Error extracting PDF text:\n{str(e)}\n\nThe PDF may be corrupted or password-protected."
        
        # Fallback to mock for images
        if not is_real_extraction:
            if ext.lower() in ['jpg', 'jpeg', 'png', 'gif', 'bmp']:
                extracted_text = f"""📸 Handwritten Image Upload

Original File: {file.filename}
Uploaded: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

⚠️ MOCK MODE: Real handwriting OCR not installed

--- Sample Digitized Content ---

Introduction to the Topic
• Key Point 1: Understanding fundamental concepts
• Key Point 2: Applying theories to practice  
• Key Point 3: Critical analysis and evaluation

Main Discussion:
This section contains the core ideas and arguments.

Conclusion:
Summary of main takeaways and future applications.

---
💡 To enable real handwriting recognition from images:
Install: pip install transformers torch pillow
This will enable TrOCR for actual handwriting-to-text conversion.
"""
        
        # Response data
        doc_data = {
            "id": file_id,
            "course_id": course_id,
            "type": type,
            "image_path": file_path,
            "digital_text": extracted_text,
            "timestamp": datetime.now().isoformat(),
            "assignment_id": assignment_id,
            "mock_mode": not is_real_extraction,
            "extraction_method": "PyPDF2" if is_real_extraction else "mock",
            "file_type": ext.lower()
        }
        
        if type == "note":
            if is_real_extraction:
                # Real PDF - provide helpful AI analysis
                doc_data["ai_analysis"] = f"""✨ AI Analysis [Based on Extracted Content]

📚 **Document Summary:**
Successfully extracted text from {len(pdf_reader.pages)} page(s).

📝 **Content Type:** PDF Document
💾 **Size:** {len(extracted_text)} characters extracted

💡 **Study Tips:**
- Review the extracted text above
- Highlight key concepts and definitions
- Create summary notes for each section
- Practice explaining concepts in your own words

🎯 **Next Steps:**
- Organize content by topic
- Create flashcards for important points
- Connect concepts to course materials
"""
            else:
                # Mock or image
                doc_data["ai_analysis"] = """📊 AI Summary & Improvements [MOCK MODE]

📚 **Summary:**
Your uploaded content has been saved to your notes.

✨ **Recommendations:**
- Organize notes by topic/subject
- Add your own annotations and insights
- Review regularly for better retention
- Create practice questions

🎯 **Action Items:**
- Review and highlight key terms
- Create summary cards
- Link to related course materials

💡 Install AI dependencies for personalized content analysis!"""
            
        print(f"✅ Upload successful: {file.filename} -> {file_id} (Real extraction: {is_real_extraction})")
        return {"status": "success", "data": doc_data}
        
    except Exception as e:
        print(f"❌ Upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@handwriting_router.get("/health")
def handwriting_health():
    return {"status": "healthy", "pdf_extraction": "enabled"}

# Mount routers
app.include_router(handwriting_router, prefix="/api/handwriting", tags=["Handwriting"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
