from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from ai_engine.llm import get_llm_provider

router = APIRouter()

class HybridGenerateRequest(BaseModel):
    topic: str
    intent: str = "general" # 'flowchart', 'timeline', 'comprehensive'

class HybridGenerateResponse(BaseModel):
    response: str
    source: str = "hybrid-llama-gemini"

@router.post("/generate", response_model=HybridGenerateResponse)
async def hybrid_generate(request: HybridGenerateRequest):
    """
    Hybrid Pipeline:
    1. Local Llama generates raw, comprehensive content.
    2. Cloud Gemini formats it into structured A2UI (JSON).
    """
    try:
        # Stage 1: Local Llama (Raw Knowledge)
        local_llm = get_llm_provider("ollama")
        
        system_prompt_1 = "You are a knowledgeable professor. Provide a detailed, comprehensive explanation."
        user_prompt_1 = f"Explain '{request.topic}' in depth. Include key dates, process flows, and concepts."
        
        raw_content = await local_llm.agenerate(user_prompt_1, system_prompt_1)
        
        # Stage 2: Cloud Gemini (Structure & Formatting)
        cloud_llm = get_llm_provider("gemini")
        
        system_prompt_2 = """
        You are an expert educational content formatter using the A2UI protocol.
        Your goal is to take raw text and convert it into a rich, interactive lesson using JSON components.
        
        Supported Components:
        - Mermaid: For processes, flows, or sequences.
        - Timeline: For dates and history.
        - Flashcard: For key terms.
        - ComparisonTable: For comparing concepts.
        - Quiz: For checking understanding.
        
        Format the output purely as A2UI JSON blocks (```a2ui ... ```) and Markdown text.
        """
        
        user_prompt_2 = f"""
        Raw Content:
        {raw_content}
        
        Task:
        Convert the above content into a structured lesson about '{request.topic}'.
        If the content describes a process, use a Mermaid flowchart.
        If it has dates, use a Timeline.
        """
        
        final_response = await cloud_llm.agenerate(user_prompt_2, system_prompt_2)
        
        return HybridGenerateResponse(response=final_response)

    except Exception as e:
        print(f"Hybrid Pipeline Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
