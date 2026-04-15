from typing import Any, Dict, Optional

from ai_engine.llm import get_llm_provider


class AIGenerator:
    """
    Thin compatibility wrapper around the current LLM provider layer.
    """

    def __init__(self, feature: str = "tutor", provider: str = "auto"):
        self.feature = feature
        self.provider = provider
        self.llm = get_llm_provider(feature=feature, provider=provider)

    async def generate_completion(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        **kwargs: Any,
    ) -> str:
        return await self.llm.agenerate(prompt, system_prompt, **kwargs)

    async def process_document(self, file_content: bytes, **kwargs: Any) -> Dict[str, Any]:
        try:
            text = file_content.decode("utf-8", errors="ignore")
        except Exception:
            text = ""
        return {
            "status": "processed",
            "text_preview": text[:500],
            "bytes": len(file_content),
        }

    async def evaluate_answer(
        self,
        question: str,
        answer: str,
        rubric: str,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        prompt = (
            "Evaluate the student answer against the rubric and return JSON with "
            "score, feedback, and reasoning.\n\n"
            f"Question: {question}\n\nRubric: {rubric}\n\nStudent Answer: {answer}"
        )
        raw = await self.llm.agenerate(prompt, **kwargs)
        return {
            "score": 0.0,
            "feedback": raw,
            "reasoning": raw,
        }
