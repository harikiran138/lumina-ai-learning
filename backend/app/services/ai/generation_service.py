import pypdf
import os
from .ai_generator import LuminaCourseBlueprintGenerator

class PDFProcessor:
    """Helper to extract text from PDF files."""
    @staticmethod
    def extract_text(file_path: str) -> str:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"PDF file not found at {file_path}")
        
        text = ""
        try:
            with open(file_path, "rb") as f:
                reader = pypdf.PdfReader(f)
                num_pages = len(reader.pages)
                # Limit extraction to first 20 pages for blueprinting
                for i in range(min(num_pages, 20)):
                    text += reader.pages[i].extract_text() + "\n"
        except Exception as e:
            print(f"Error extracting PDF text: {str(e)}")
            text = f"[ERROR: Unable to extract text from {file_path}]"
        
        return text

class ContentGenerator:
    """High-level service for handling all AI content generation tasks."""
    
    def __init__(self):
        self.blueprint_generator = LuminaCourseBlueprintGenerator()
        self.pdf_processor = PDFProcessor()

    async def generate_blueprint_from_file(self, file_path: str) -> dict:
        ext = os.path.splitext(file_path.lower())[1]
        
        # Images are processed directly with Gemini Vision
        if ext in [".jpg", ".jpeg", ".png", ".webp"]:
            return await self.blueprint_generator.generate_from_image(file_path)
            
        # Default is PDF text extraction for now
        raw_text = self.pdf_processor.extract_text(file_path)
        return await self.blueprint_generator.generate(raw_text)

    async def generate_blueprint_from_pdf(self, file_path: str) -> dict:
        """Deprecated: use generate_blueprint_from_file instead."""
        return await self.generate_blueprint_from_file(file_path)

# Singleton instance
content_generator = ContentGenerator()
