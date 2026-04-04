from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from ai_engine.llm import get_llm_provider

router = APIRouter()


class HybridGenerateRequest(BaseModel):
    topic: str
    intent: str = "general"  # 'flowchart', 'timeline', 'comprehensive'


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
        # Stage 1: Retrieval (RAG)
        from app.rag.retrieval import RetrievalService

        retriever = RetrievalService()
        context_docs = retriever.hybrid_search(request.topic, top_k=3)
        context_str = "\n".join(context_docs)

        # Stage 2: Local Llama (Raw Knowledge with Context)
        local_llm = get_llm_provider(feature="fast", provider="ollama")

        system_prompt_1 = "You are a knowledgeable professor. Provide a detailed, comprehensive explanation using the provided context."
        user_prompt_1 = f"Context:\n{context_str}\n\nQuestion: Explain '{request.topic}' in depth. Include key dates, process flows, and concepts."

        raw_content = await local_llm.agenerate(user_prompt_1, system_prompt_1)

        # Stage 2: Cloud Gemini (Structure & Formatting)
        cloud_llm = get_llm_provider(feature="tutor", provider="gemini")

        # Use the shared Orchestrator Prompt
        from ai_engine.prompts import A2UI_SYSTEM_PROMPT

        final_response = await cloud_llm.agenerate(
            f"Raw Content to Structure:\n{raw_content}\n\nTask: Create a COMPLETE LEARNING MODULE for '{request.topic}' based on the above content.",
            A2UI_SYSTEM_PROMPT,
        )

        return HybridGenerateResponse(response=final_response)

    except Exception as e:
        print(f"Hybrid Pipeline Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
