import PyPDF2
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
                reader = PyPDF2.PdfReader(f)
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

    async def generate_blueprint_from_pdf(self, file_path: str) -> dict:
        # Step 1: Extract text from PDF
        raw_text = self.pdf_processor.extract_text(file_path)
        
        # Step 2: Generate blueprint from text
        # Passes the raw text to the specialized generator
        blueprint_data = await self.blueprint_generator.generate(raw_text)
        
        return blueprint_data

# Singleton instance
content_generator = ContentGenerator()
