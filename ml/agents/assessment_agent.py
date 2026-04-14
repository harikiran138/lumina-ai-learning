"""
question_engine.py — Adaptive Question Generation Engine
---------------------------------------------------------
Implements the generateNextQuestion() pipeline per spec §5.

Pipeline:
  lag detection → style selection → question type selection → question prompt generation

The engine is synchronous and stateless — callers supply all required context.
No database access occurs here; persistence is handled upstream.
"""

from __future__ import annotations

import random
import logging
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger(__name__)

# ─── Question type constants ───────────────────────────────────────────────────

QT_MCQ          = "MCQ"
QT_FILL_BLANK   = "FILL_BLANK"
QT_SHORT_ANSWER = "SHORT_ANSWER"
QT_LONG_ESSAY   = "LONG_ESSAY"
QT_TEACH_BACK   = "TEACH_BACK"
QT_TRY_ANSWER   = "TRY_ANSWER"

# Ordered from easiest to hardest for regression logic
_TYPE_LADDER: list[str] = [
    QT_MCQ,
    QT_FILL_BLANK,
    QT_SHORT_ANSWER,
    QT_LONG_ESSAY,
    QT_TEACH_BACK,
]

# ─── Style system hint templates ──────────────────────────────────────────────

_STYLE_SYSTEM_HINTS: dict[str, str] = {
    "story": (
        "Frame this question as part of a short narrative or real-world story. "
        "Introduce relatable characters or scenarios to make the concept tangible. "
        "The question should feel like a plot point the student must resolve."
    ),
    "joke": (
        "Present the question with light humour — a pun, wordplay, or a comedic scenario "
        "that relates to the concept. Keep the humour clean and educational; the punchline "
        "should reinforce the learning objective."
    ),
    "analogy": (
        "Use a concrete, everyday analogy to explain the concept before posing the question. "
        "Draw a clear parallel between the familiar domain and the target concept so the "
        "student can reason by mapping structure rather than memorising facts."
    ),
    "socratic": (
        "Do NOT give any hints or definitions. Ask a probing question that forces the student "
        "to articulate their reasoning step by step. Follow-up with 'Why?' or 'What would "
        "happen if…?' style prompts embedded in the question text."
    ),
    "formula": (
        "Present the concept in a formal, mathematical, or rule-based structure. "
        "Include notation, conditions, or pseudo-code where appropriate. "
        "Encourage the student to derive or verify a result rather than recall it."
    ),
    "visual": (
        "Describe a diagram, table, or chart in text form and ask the student to interpret it. "
        "Use ASCII representations or structured markdown tables when helpful. "
        "The question should test conceptual understanding through a visual medium."
    ),
    "challenge": (
        "This is an advanced challenge question. Push the student beyond recall into synthesis "
        "and evaluation. Introduce edge cases, contradictions, or multi-step reasoning tasks. "
        "Expect concise but rigorous answers."
    ),
    "scaffolded": (
        "Break the question into small, sequential sub-prompts that build toward the main answer. "
        "Guide the student through the reasoning without revealing the answer. "
        "Each sub-prompt should unlock the next step naturally."
    ),
    "example_first": (
        "Show a worked example of a similar (but different) problem before asking the question. "
        "The example should illuminate the method; the question should test whether the student "
        "can apply the same reasoning to a new case."
    ),
    "default": (
        "Ask a clear, precise question at the appropriate difficulty level. "
        "Be direct and unambiguous. Do not over-scaffold or over-explain. "
        "Expect the student to demonstrate understanding in their own words."
    ),
}

# ─── Difficulty calibration per mastery band ──────────────────────────────────

def _mastery_to_difficulty(mastery: float) -> float:
    """
    Maps current mastery to target question difficulty using ZPD heuristic.
    Always slightly above mastery, capped at [0.05, 0.95].
    """
    base = mastery + 0.12
    # Gentle ceiling so very advanced students still get challenging questions
    return round(max(0.05, min(0.95, base)), 3)


# ─── Dataclasses ──────────────────────────────────────────────────────────────

@dataclass
class QuestionRequest:
    student_id: str
    concept_id: str            # target concept (highest lag zone)
    mastery: float             # current mastery 0.0–1.0
    style: str                 # learning style to apply (from style_rl)
    prev_answer_text: str      # student's previous answer text
    prev_answer_correct: bool
    session_id: str


@dataclass
class GeneratedQuestion:
    concept_id: str
    question_type: str         # MCQ | FILL_BLANK | SHORT_ANSWER | LONG_ESSAY | TRY_ANSWER | TEACH_BACK
    difficulty: float          # 0.0–1.0
    style: str
    prompt: str                # full question prompt for LLM or direct display
    llm_system_hint: str       # hint for AI generation containing style + context
    mastery_at_generation: float


# ─── Core logic ───────────────────────────────────────────────────────────────

def select_question_type(
    mastery: float,
    prev_was_correct: bool,
    prev_type: Optional[str] = None,
) -> str:
    """
    Select the next question type based on mastery level and previous outcome.

    Spec §5.2 mapping:
      mastery < 0.40              → MCQ
      mastery 0.30–0.60           → FILL_BLANK  (after MCQ correct)
      mastery 0.40–0.65           → SHORT_ANSWER
      mastery > 0.65              → LONG_ESSAY
      mastery > 0.80              → TEACH_BACK
      ~10% random chance          → TRY_ANSWER  (any mastery level)

    If the previous answer was wrong: hold to the same type or regress one step.
    """
    # ~10 % TRY_ANSWER wildcard (skipped if previous was wrong to avoid confusion)
    if prev_was_correct and random.random() < 0.10:
        return QT_TRY_ANSWER

    # Determine the "ideal" type for this mastery level
    if mastery > 0.80:
        ideal = QT_TEACH_BACK
    elif mastery > 0.65:
        ideal = QT_LONG_ESSAY
    elif mastery >= 0.40:
        ideal = QT_SHORT_ANSWER
    elif mastery >= 0.30 and prev_type == QT_MCQ and prev_was_correct:
        # Graduated step up: MCQ → FILL_BLANK after a correct MCQ in this band
        ideal = QT_FILL_BLANK
    else:
        ideal = QT_MCQ

    if prev_was_correct:
        return ideal

    # Previous answer was wrong: hold or regress one step
    if prev_type is None or prev_type not in _TYPE_LADDER:
        # No valid history — stay at the ideal but don't advance
        return ideal

    current_idx = _TYPE_LADDER.index(prev_type)
    ideal_idx   = _TYPE_LADDER.index(ideal) if ideal in _TYPE_LADDER else current_idx

    # Never jump to a harder type after a wrong answer
    if ideal_idx > current_idx:
        return _TYPE_LADDER[current_idx]

    # Optionally regress one step (but never below MCQ)
    regressed_idx = max(0, current_idx - 1)
    return _TYPE_LADDER[regressed_idx]


def build_question_prompt(
    concept_id: str,
    question_type: str,
    style: str,
    mastery: float,
    prev_answer_text: str,
) -> tuple[str, str]:
    """
    Build a rich question prompt and LLM system hint.

    Returns
    -------
    (user_prompt, llm_system_hint)
        user_prompt     — the full prompt text sent to the LLM or displayed directly.
        llm_system_hint — the system-level instruction string that tells the LLM how
                          to frame, tone, and structure its response.
    """
    difficulty      = _mastery_to_difficulty(mastery)
    style_key       = style.lower() if style.lower() in _STYLE_SYSTEM_HINTS else "default"
    base_hint       = _STYLE_SYSTEM_HINTS[style_key]

    # ── Type-specific prompt prefix ────────────────────────────────────────

    if question_type == QT_MCQ:
        type_instruction = (
            "Generate a multiple-choice question with exactly four options (A, B, C, D). "
            "Exactly one option must be correct. Include clear distractors that represent "
            "common misconceptions. Label options clearly."
        )
        format_note = "Respond only with the question stem and the four labelled options."

    elif question_type == QT_FILL_BLANK:
        type_instruction = (
            "Generate a fill-in-the-blank question. The blank should correspond to a single "
            "key term, value, or short phrase. The surrounding sentence must provide enough "
            "context that a student who understands the concept can answer without guessing."
        )
        format_note = "Format: 'Complete the following: [sentence with _____ for the blank]'."

    elif question_type == QT_SHORT_ANSWER:
        type_instruction = (
            "Generate an open-ended short-answer question. The expected answer is 1–3 sentences "
            "(approximately 20–60 words). The question should test conceptual understanding, "
            "not pure recall."
        )
        format_note = "Do not include answer options. Ask a direct question that begins with 'Explain', 'Describe', 'What', or 'How'."

    elif question_type == QT_LONG_ESSAY:
        type_instruction = (
            "Generate a long-form essay question that requires a structured, multi-paragraph "
            "response (150–300 words expected). The question should require the student to "
            "compare, analyse, evaluate, or synthesise ideas related to the concept."
        )
        format_note = "Phrase the question to invite argumentation: 'Discuss…', 'Analyse…', 'To what extent…'."

    elif question_type == QT_TEACH_BACK:
        type_instruction = (
            "Ask the student to explain this concept as if they are teaching it to a peer who "
            "has never encountered it before. They must cover: definition, intuition, a worked "
            "example, and at least one common mistake to avoid."
        )
        format_note = "Start with: 'You are now the teacher. Explain [concept] to a classmate who is learning it for the first time.'"

    elif question_type == QT_TRY_ANSWER:
        type_instruction = (
            "Present the concept in an unfamiliar context or application the student has not "
            "explicitly studied. Ask them to attempt an answer and reason out loud. "
            "Reward effort and reasoning quality, not just correctness."
        )
        format_note = "Open with 'Give it a try:' and encourage partial credit reasoning."

    else:
        type_instruction = "Generate an appropriate question for this concept."
        format_note = ""

    # ── Previous answer context ────────────────────────────────────────────

    prev_context = ""
    if prev_answer_text and prev_answer_text.strip():
        trimmed = prev_answer_text.strip()[:300]
        prev_context = (
            f"\n\nStudent's previous answer (for context — build forward from this, "
            f"do not repeat the same question):\n\"{trimmed}\""
        )

    # ── Assemble user prompt ───────────────────────────────────────────────

    user_prompt = (
        f"Concept: {concept_id}\n"
        f"Question type: {question_type}\n"
        f"Difficulty level: {difficulty:.2f} / 1.00  "
        f"(0 = trivial, 1 = expert)\n"
        f"Learning style: {style}\n\n"
        f"{type_instruction}\n"
        f"{format_note}"
        f"{prev_context}"
    )

    # ── Assemble LLM system hint ───────────────────────────────────────────

    llm_system_hint = (
        f"You are an expert adaptive learning tutor for the Lumina AI platform. "
        f"Your goal is to help the student build mastery of '{concept_id}'. "
        f"Current mastery estimate: {mastery:.2f}. "
        f"Target difficulty: {difficulty:.2f}.\n\n"
        f"Style directive: {base_hint}\n\n"
        f"Question format directive: {type_instruction} {format_note}\n\n"
        f"Rules:\n"
        f"- Always match the requested difficulty and style precisely.\n"
        f"- Never reveal the answer in the question text.\n"
        f"- Ensure the question has one unambiguous correct answer (or clear rubric).\n"
        f"- Avoid trivial recall if mastery > 0.4; prefer application and analysis.\n"
        f"- Keep language age-appropriate and free of jargon unless the concept requires it."
    )

    return user_prompt, llm_system_hint


# ─── Main entry point ──────────────────────────────────────────────────────────

def generate_next_question(req: QuestionRequest) -> GeneratedQuestion:
    """
    Main entry point for the question generation pipeline.

    Connects: mastery state → question type selection → prompt construction.
    Stateless and synchronous; no I/O is performed.

    Parameters
    ----------
    req : QuestionRequest
        All context needed to generate the next question for this student.

    Returns
    -------
    GeneratedQuestion
        Fully populated question descriptor ready for LLM invocation or display.
    """
    mastery  = max(0.0, min(1.0, req.mastery))

    # Determine question type based on mastery and previous performance
    # We need the previous type — derive it from session context if available.
    # Since we don't track prev_type in QuestionRequest, pass None and rely on
    # mastery-band logic (upstream can pass a richer request if needed).
    question_type = select_question_type(
        mastery          = mastery,
        prev_was_correct = req.prev_answer_correct,
        prev_type        = None,
    )

    difficulty = _mastery_to_difficulty(mastery)

    user_prompt, llm_system_hint = build_question_prompt(
        concept_id       = req.concept_id,
        question_type    = question_type,
        style            = req.style,
        mastery          = mastery,
        prev_answer_text = req.prev_answer_text,
    )

    logger.debug(
        "question_engine.generated",
        student_id    = req.student_id,
        concept_id    = req.concept_id,
        question_type = question_type,
        difficulty    = difficulty,
        style         = req.style,
        mastery       = mastery,
    )

    return GeneratedQuestion(
        concept_id            = req.concept_id,
        question_type         = question_type,
        difficulty            = difficulty,
        style                 = req.style,
        prompt                = user_prompt,
        llm_system_hint       = llm_system_hint,
        mastery_at_generation = mastery,
    )
