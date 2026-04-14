import structlog
from typing import Optional, Any
from pydantic import BaseModel

log = structlog.get_logger(__name__)

class AIServiceFallback:
    """
    Fallback mock implementation of the AI Engine in case the core ai_engine module 
    is missing or fails to load. This ensures the system remains functional even without AI.
    """
    def __init__(self):
        log.warning("ai_engine_fallback_active", reason="Core AI engine module could not be loaded")
        
    async def generate_completion(self, prompt: str, **kwargs) -> str:
        log.info("ai_fallback_generate_completion", prompt_length=len(prompt))
        return "AI response is currently unavailable due to system fallback mode."
        
    async def process_document(self, file_content: bytes, **kwargs) -> dict:
        log.info("ai_fallback_process_document", bytes=len(file_content))
        return {"status": "fallback", "extracted_text": "Document processing unavailable"}
        
    async def evaluate_answer(self, question: str, answer: str, rubric: str) -> dict:
        log.info("ai_fallback_evaluate_answer")
        return {
            "score": 0.0,
            "feedback": "AI evaluation unavailable.",
            "is_correct": False
        }

# Try to import the actual AI generator, if it fails, use fallback
try:
    from ai_engine.ai_generator import AIGenerator
    get_ai_client = AIGenerator
    AI_AVAILABLE = True
except ImportError as e:
    log.error("ai_engine_import_error", error=str(e), action="using_fallback")
    get_ai_client = AIServiceFallback
    AI_AVAILABLE = False
