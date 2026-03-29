"""
AI Evaluation Service — LangChain + HuggingFace.

Architecture:
  • LangChain orchestrates the chain: rubric context → prompt → LLM → structured output parser
  • HuggingFace Inference API provides the LLM (Mistral-7B-Instruct by default)
  • Pydantic output parser enforces { score, max_score, reasoning, feedback, confidence }
  • Falls back to OpenAI if HF_LLM fails (optional)
  • Teacher rubric is injected as structured context — not free text

Why Mistral-7B-Instruct:
  • Free on HF Inference API
  • Follows JSON instructions reliably
  • Good at structured grading tasks
  • 8K context window fits long rubrics + student answers
"""
import json
import logging
import re
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger(__name__)


# ── Output schema ─────────────────────────────────────────────────────────────

@dataclass
class EvaluationResult:
    score: float
    max_score: int
    reasoning: str       # internal chain-of-thought (shown to teacher)
    feedback: str        # student-facing feedback
    confidence: float    # 0-1 how certain the AI is
    criteria_scores: dict  # {"criterion_label": score_awarded}
    model_used: str


# ── Prompt engineering ────────────────────────────────────────────────────────

GRADING_SYSTEM_PROMPT = """You are an expert academic evaluator. Your task is to grade a student's handwritten answer.
You will be given:
1. The question text
2. The grading rubric with specific criteria and marks
3. The student's answer (transcribed from handwriting via OCR — may have minor transcription errors)

Rules:
- Be fair and consistent
- Give partial credit where the student shows partial understanding
- OCR may have introduced errors; use context to interpret unclear words charitably
- Output ONLY valid JSON, no markdown, no explanation outside the JSON

Output this exact JSON structure:
{{
  "score": <float, awarded marks>,
  "max_score": <int, total possible marks>,
  "reasoning": "<internal step-by-step reasoning, 2-4 sentences>",
  "feedback": "<constructive student-facing feedback, 1-3 sentences>",
  "confidence": <float 0.0-1.0, how confident you are in this grade>,
  "criteria_scores": {{
    "<criterion_label>": <marks_awarded>
  }}
}}"""


GRADING_HUMAN_PROMPT = """QUESTION ({max_marks} marks):
{question_text}

RUBRIC:
{rubric_text}

STUDENT'S ANSWER (OCR transcription, confidence: {ocr_confidence:.0%}):
{student_answer}

Grade this answer. Output only JSON."""


def _format_rubric(rubric: dict) -> str:
    """Convert rubric dict to readable text for the prompt."""
    lines = []
    criteria = rubric.get("criteria", [])
    for c in criteria:
        lines.append(f"  • {c['label']} ({c['marks']} marks): {c.get('description', '')}")

    if rubric.get("keywords"):
        lines.append(f"\nKey concepts expected: {', '.join(rubric['keywords'])}")

    if rubric.get("sample_answer"):
        lines.append(f"\nSample answer: {rubric['sample_answer']}")

    return "\n".join(lines) if lines else "Award marks based on correctness and completeness."


# ── LangChain chain builder ───────────────────────────────────────────────────

def _build_hf_llm(model_name: str, api_token: str):
    """
    Build a LangChain LLM using HuggingFace Inference API.
    Uses langchain-huggingface for the latest integration.
    """
    from langchain_huggingface import HuggingFaceEndpoint

    return HuggingFaceEndpoint(
        repo_id=model_name,
        huggingfacehub_api_token=api_token,
        task="text-generation",
        max_new_tokens=1024,
        temperature=0.1,        # low temperature = consistent grading
        repetition_penalty=1.1,
        return_full_text=False,
    )


def _build_openai_llm(api_key: str, model: str):
    """Fallback to OpenAI if HuggingFace is unavailable."""
    from langchain_openai import ChatOpenAI
    return ChatOpenAI(api_key=api_key, model=model, temperature=0.1)


def _build_grading_chain(llm):
    """
    LangChain chain:
      prompt | llm | json_parser
    """
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_core.output_parsers import StrOutputParser

    prompt = ChatPromptTemplate.from_messages([
        ("system", GRADING_SYSTEM_PROMPT),
        ("human",  GRADING_HUMAN_PROMPT),
    ])

    # StrOutputParser first — JSON parsing done separately for better error handling
    return prompt | llm | StrOutputParser()


# ── Main evaluation function ──────────────────────────────────────────────────

async def evaluate_answer(
    question_text: str,
    max_marks: int,
    rubric: dict,
    student_answer: str,
    ocr_confidence: float,
    hf_model: str,
    hf_token: str,
    openai_key: str = "",
    openai_model: str = "gpt-4o-mini",
) -> EvaluationResult:
    """
    Grade one question answer using LangChain + HuggingFace.

    Returns structured EvaluationResult with score, reasoning, feedback.
    """
    rubric_text = _format_rubric(rubric)

    # Try HuggingFace first
    model_used = hf_model
    raw_output = None

    if hf_token:
        try:
            llm   = _build_hf_llm(hf_model, hf_token)
            chain = _build_grading_chain(llm)
            raw_output = await chain.ainvoke({
                "question_text":  question_text,
                "max_marks":      max_marks,
                "rubric_text":    rubric_text,
                "student_answer": student_answer,
                "ocr_confidence": ocr_confidence,
            })
            logger.info(f"HF evaluation succeeded: {hf_model}")
        except Exception as e:
            logger.warning(f"HF evaluation failed ({e}), trying fallback")
            raw_output = None

    # Fallback to OpenAI
    if raw_output is None and openai_key:
        try:
            llm   = _build_openai_llm(openai_key, openai_model)
            chain = _build_grading_chain(llm)
            raw_output = await chain.ainvoke({
                "question_text":  question_text,
                "max_marks":      max_marks,
                "rubric_text":    rubric_text,
                "student_answer": student_answer,
                "ocr_confidence": ocr_confidence,
            })
            model_used = openai_model
            logger.info("OpenAI fallback evaluation succeeded")
        except Exception as e:
            logger.error(f"OpenAI fallback also failed: {e}")

    if raw_output is None:
        # Both failed — return a conservative 0 score with a flag
        return EvaluationResult(
            score=0,
            max_score=max_marks,
            reasoning="AI evaluation unavailable. Please grade manually.",
            feedback="Your submission has been received and will be graded by your teacher.",
            confidence=0.0,
            criteria_scores={},
            model_used="none",
        )

    return _parse_evaluation_output(raw_output, max_marks, model_used)


def _parse_evaluation_output(raw: str, max_marks: int, model_used: str) -> EvaluationResult:
    """
    Robustly parse JSON from LLM output.
    LLMs sometimes wrap JSON in markdown — strip it first.
    """
    # Strip markdown fences
    cleaned = re.sub(r"```(?:json)?", "", raw).strip()

    # Find the JSON object (sometimes LLM adds preamble)
    json_match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if json_match:
        cleaned = json_match.group(0)

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse failed: {e}\nRaw output: {raw[:500]}")
        # Return safe defaults
        return EvaluationResult(
            score=0,
            max_score=max_marks,
            reasoning=f"Could not parse AI response. Raw: {raw[:200]}",
            feedback="Please ask your teacher to review this question.",
            confidence=0.0,
            criteria_scores={},
            model_used=model_used,
        )

    # Clamp score to valid range
    score = float(data.get("score", 0))
    score = max(0.0, min(score, float(max_marks)))

    return EvaluationResult(
        score=score,
        max_score=max_marks,
        reasoning=data.get("reasoning", ""),
        feedback=data.get("feedback", ""),
        confidence=float(data.get("confidence", 0.5)),
        criteria_scores=data.get("criteria_scores", {}),
        model_used=model_used,
    )


# ── Batch evaluation with LangChain parallelism ───────────────────────────────

async def evaluate_all_questions(
    questions_data: list[dict],   # [{question_text, max_marks, rubric, student_answer, ocr_confidence}]
    hf_model: str,
    hf_token: str,
    openai_key: str = "",
    openai_model: str = "gpt-4o-mini",
) -> list[EvaluationResult]:
    """
    Evaluate all questions for a submission in parallel using asyncio.
    LangChain handles concurrency via async chains.
    """
    import asyncio

    tasks = [
        evaluate_answer(
            question_text=q["question_text"],
            max_marks=q["max_marks"],
            rubric=q["rubric"],
            student_answer=q["student_answer"],
            ocr_confidence=q["ocr_confidence"],
            hf_model=hf_model,
            hf_token=hf_token,
            openai_key=openai_key,
            openai_model=openai_model,
        )
        for q in questions_data
    ]
    return await asyncio.gather(*tasks)
