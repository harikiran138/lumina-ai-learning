import json
import re
import asyncio
from dataclasses import dataclass
from typing import Optional, List, Dict, Any
from app.core.config import settings
from app.core.logging import structlog

log = structlog.get_logger()

@dataclass
class EvaluationResult:
    score: float
    max_score: int
    reasoning: str
    feedback: str
    confidence: float
    criteria_scores: Dict[str, float]
    model_used: str

GRADING_SYSTEM_PROMPT = """You are an expert academic evaluator. Your task is to grade a student's handwritten answer.
You will be given:
1. The question text
2. The grading rubric with specific criteria and marks
3. The student's answer (transcribed from handwriting via OCR)

Rules:
- Be fair and consistent
- Give partial credit for partial understanding
- OCR may have minor errors; be charitable
- Output ONLY valid JSON

Output this exact JSON structure:
{{
  "score": <float>,
  "max_score": <int>,
  "reasoning": "<internal steps>",
  "feedback": "<student-facing>",
  "confidence": <float 0-1>,
  "criteria_scores": {{ "<label>": <marks> }}
}}"""

GRADING_HUMAN_PROMPT = """QUESTION ({max_marks} marks):
{question_text}

RUBRIC:
{rubric_text}

STUDENT'S ANSWER (OCR transcription, confidence: {ocr_confidence:.0%}):
{student_answer}

Grade this answer. Output only JSON."""

def _format_rubric(rubric: Dict[str, Any]) -> str:
    lines = []
    for c in rubric.get("criteria", []):
        lines.append(f"  • {c['label']} ({c['marks']} marks): {c.get('description', '')}")
    if rubric.get("keywords"):
        lines.append(f"\nKey concepts: {', '.join(rubric['keywords'])}")
    if rubric.get("sample_answer"):
        lines.append(f"\nSample answer: {rubric['sample_answer']}")
    return "\n".join(lines) if lines else "Award marks based on correctness."

async def evaluate_answer(
    question_text: str,
    max_marks: int,
    rubric: Dict[str, Any],
    student_answer: str,
    ocr_confidence: float,
    hf_model: str = "mistralai/Mistral-7B-Instruct-v0.2",
    hf_token: Optional[str] = None,
    openai_key: Optional[str] = None,
    openai_model: str = "gpt-4o-mini",
) -> EvaluationResult:
    rubric_text = _format_rubric(rubric)
    raw_output = None
    model_used = hf_model

    from langchain_core.prompts import ChatPromptTemplate
    from langchain_core.output_parsers import StrOutputParser

    prompt = ChatPromptTemplate.from_messages([
        ("system", GRADING_SYSTEM_PROMPT),
        ("human",  GRADING_HUMAN_PROMPT),
    ])

    # Try HuggingFace
    if hf_token:
        try:
            from langchain_huggingface import HuggingFaceEndpoint
            llm = HuggingFaceEndpoint(
                repo_id=hf_model,
                huggingfacehub_api_token=hf_token,
                task="text-generation",
                max_new_tokens=1024,
                temperature=0.1,
            )
            chain = prompt | llm | StrOutputParser()
            raw_output = await chain.ainvoke({
                "question_text": question_text,
                "max_marks": max_marks,
                "rubric_text": rubric_text,
                "student_answer": student_answer,
                "ocr_confidence": ocr_confidence,
            })
            log.info("hf_evaluation_success", model=hf_model)
        except Exception as e:
            log.warn("hf_evaluation_failed", error=str(e))

    # Fallback to OpenAI
    if raw_output is None and openai_key:
        try:
            from langchain_openai import ChatOpenAI
            llm = ChatOpenAI(api_key=openai_key, model=openai_model, temperature=0.1)
            chain = prompt | llm | StrOutputParser()
            raw_output = await chain.ainvoke({
                "question_text": question_text,
                "max_marks": max_marks,
                "rubric_text": rubric_text,
                "student_answer": student_answer,
                "ocr_confidence": ocr_confidence,
            })
            model_used = openai_model
            log.info("openai_fallback_success")
        except Exception as e:
            log.error("openai_fallback_failed", error=str(e))

    # Fallback to Gemini (always available via GEMINI_API_KEY)
    if raw_output is None:
        gemini_key = settings.ASSESSMENT_API_KEY  # set to GEMINI_API_KEY in config
        if gemini_key:
            try:
                from ai_engine.llm import GeminiRestProvider
                gemini = GeminiRestProvider(api_keys=[gemini_key])
                full_prompt = (
                    GRADING_SYSTEM_PROMPT.replace("{{", "{").replace("}}", "}") + "\n\n"
                    + GRADING_HUMAN_PROMPT.format(
                        question_text=question_text,
                        max_marks=max_marks,
                        rubric_text=rubric_text,
                        student_answer=student_answer,
                        ocr_confidence=ocr_confidence,
                    )
                )
                raw_output = await gemini.agenerate(full_prompt)
                model_used = "gemini-1.5-flash"
                log.info("gemini_fallback_success")
            except Exception as e:
                log.error("gemini_fallback_failed", error=str(e))

    if not raw_output:
        return EvaluationResult(
            score=0, max_score=max_marks, reasoning="AI evaluation unavailable.",
            feedback="Teacher will grade manually.", confidence=0.0,
            criteria_scores={}, model_used="none"
        )

    return _parse_evaluation_output(raw_output, max_marks, model_used)

def _parse_evaluation_output(raw: str, max_marks: int, model_used: str) -> EvaluationResult:
    cleaned = re.sub(r"```(?:json)?", "", raw).strip()
    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if match: cleaned = match.group(0)

    try:
        data = json.loads(cleaned)
        score = max(0.0, min(float(data.get("score", 0)), float(max_marks)))
        return EvaluationResult(
            score=score, max_score=max_marks, reasoning=data.get("reasoning", ""),
            feedback=data.get("feedback", ""), confidence=float(data.get("confidence", 0.5)),
            criteria_scores=data.get("criteria_scores", {}), model_used=model_used
        )
    except Exception as e:
        log.error("json_parse_failed", error=str(e), raw=raw[:200])
        return EvaluationResult(
            score=0, max_score=max_marks, reasoning="Parse failed.",
            feedback="Teacher review needed.", confidence=0.0,
            criteria_scores={}, model_used=model_used
        )

async def evaluate_all_questions(
    questions_data: List[Dict[str, Any]],
    **kwargs
) -> List[EvaluationResult]:
    tasks = [evaluate_answer(**q, **kwargs) for q in questions_data]
    return await asyncio.gather(*tasks)
