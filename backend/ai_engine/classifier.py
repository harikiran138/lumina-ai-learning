"""
Question Routing Classifier
============================
Classifies every student question into a routing tier so the backend
can decide whether to answer instantly, queue for teacher review, or
redirect the user.

Tiers
-----
SAFE_INSTANT      General knowledge, coding help, quizzes, concept
                  explanations.  Answered directly by AI — no teacher
                  queue, sub-5-second latency.

ACADEMIC_VERIFIED Syllabus-specific, exam answers, assignment work.
                  Pushed to the teacher verification queue; student
                  gets an acknowledgement and waits.

RESTRICTED        Off-topic, inappropriate, or clearly unrelated to
                  academics.  Returns a polite redirect instantly —
                  no LLM call, no queue entry.

Implementation
--------------
Pure regex rules only — target latency < 1 ms.
No LLM call is made here; the caller is responsible for LLM routing.
"""
from __future__ import annotations

import re
from typing import TypedDict

import structlog

log = structlog.get_logger(__name__)


# ── Public constants ──────────────────────────────────────────────────────────

class RoutingTier:
    SAFE_INSTANT = "SAFE_INSTANT"
    ACADEMIC_VERIFIED = "ACADEMIC_VERIFIED"
    RESTRICTED = "RESTRICTED"


class Classification(TypedDict):
    tier: str
    confidence: float
    reason: str


SAFE_INSTANT_WAITING = "Thinking…"
ACADEMIC_VERIFIED_WAITING = "Teacher is reviewing your answer"
RESTRICTED_REDIRECT = (
    "I'm here to help with your academic learning. "
    "Let's stay focused on your course topics — I can explain concepts, "
    "help with code, run quizzes, or break down any subject from your "
    "curriculum. What would you like to study?"
)


# ── Signal patterns ───────────────────────────────────────────────────────────

# Signals that push a question toward ACADEMIC_VERIFIED
_ACADEMIC_SIGNALS: list[str] = [
    r"\bassignment\b",
    r"\bexam\b",
    r"\btest\s*(?:paper|question|mark|score|series)\b",
    r"\bsyllabus\b",
    r"\bcurriculum\b",
    r"\bmarks?\b",
    r"\bgrade[sd]?\b",
    r"\battendance\b",
    r"\bpaper\s*\d+\b",
    r"\bunit\s*\d+\b",
    r"\bmodule\s*\d+\b",
    r"\bprev(?:ious)?\s*year\b",
    r"\bquestion\s*(?:bank|paper)\b",
    r"\bimportant\s*questions?\b",
    r"\b(?:our|this)\s*(?:syllabus|course|professor|teacher|class)\b",
    r"\bmy\s*(?:assignment|project|submission|homework)\b",
    r"\bsolve\s+(?:this|my|the)\s*(?:question|problem|assignment)\b",
    r"\b(?:expected|probable)\s*(?:question|topic)\b",
    r"\binternal\s*(?:exam|test|marks?)\b",
    r"\bexternal\s*(?:exam|test)\b",
    r"\bsemester\s*(?:exam|paper|end)\b",
    r"\bfinal\s*(?:exam|paper|viva)\b",
    r"\bpractical\s*(?:exam|viva|file)\b",
    r"\blab\s*(?:record|file|manual|exam)\b",
    r"\bproject\s*(?:report|submission|deadline)\b",
]

# Signals that hard-block and redirect the user
_RESTRICTED_SIGNALS: list[str] = [
    r"\bweather\b",
    r"\bcurrent\s+(?:news|events?|affairs?)\b",
    r"\bbreaking\s+news\b",
    r"\bsocial\s+media\b",
    r"\b(?:instagram|twitter|facebook|tiktok|snapchat|reddit)\b",
    r"\b(?:netflix|spotify|youtube)\s+(?:show|movie|song|playlist)\b",
    r"\b(?:movie|film|series)\s+(?:review|recommend)\b",
    r"\bjoke[sd]?\b",
    r"\bhow\s+to\s+hack\b",
    r"\bcrack\s+(?:password|wifi|account)\b",
    r"\b(?:crypto|bitcoin|nft)\s*(?:price|invest|buy|sell|market)\b",
    r"\bstock\s+(?:market|price|invest)\b",
    r"\bpolitics?\b",
    r"\bmedical\s+(?:advice|treatment|diagnosis|symptoms?)\b",
    r"\bgambling\b",
    r"\bbet(?:ting)?\b",
    r"\bdating\b",
    r"\brelationship\s+advice\b",
    r"\bhow\s+to\s+cheat\b",
    r"\bwrite\s+(?:my|the)\s+(?:essay|assignment|homework)\s+for\s+me\b",
    r"\bdo\s+my\s+(?:homework|assignment|project)\b",
]

# Signals that confirm SAFE_INSTANT
_SAFE_SIGNALS: list[str] = [
    # question openers
    r"\bwhat\s+is\b",
    r"\bwhat\s+are\b",
    r"\bexplain\b",
    r"\bdefine\b",
    r"\bhow\s+does\b",
    r"\bhow\s+do\b",
    r"\bhow\s+to\b",
    r"\bdifference\s+between\b",
    r"\bcompare\b",
    r"\bexample\s+of\b",
    r"\btell\s+me\s+about\b",
    r"\bteach\s+me\b",
    # code / debugging
    r"\bwrite\s+(?:a\s+)?(?:code|function|program|script|class|method)\b",
    r"\bdebug\b",
    r"\bfix\s+(?:this\s+)?(?:code|bug|error)\b",
    r"\bimplement\b",
    # quiz modes
    r"\bquiz\s+me\b",
    r"\btest\s+me\b",
    r"\bmcq\b",
    r"\bflashcard\b",
    r"\bgive\s+(?:me\s+)?(?:a\s+)?quiz\b",
    # CS topics
    r"\balgorithm\b",
    r"\bdata\s+structure\b",
    r"\bsorting\b",
    r"\bsearching\b",
    r"\btime\s+complexity\b",
    r"\bbig\s*[oO]\b",
    r"\blinked\s+list\b",
    r"\bbinary\s+(?:tree|search)\b",
    r"\bgraph\s+(?:algorithm|traversal|search|theory)\b",
    r"\bdynamic\s+programming\b",
    r"\brecursion\b",
    r"\boops?\b",
    r"\bobject[\s-]+oriented\b",
    r"\bpython\b",
    r"\bjava(?:script)?\b",
    r"\bc\+\+\b",
    r"\bsql\b",
    r"\boperating\s+system\b",
    r"\bprocess\s+(?:scheduling|management)\b",
    r"\bdeadlock\b",
    r"\bmemory\s+(?:management|allocation|leak)\b",
    r"\bnetwork(?:ing)?\b",
    r"\btcp\s*/\s*ip\b",
    r"\bhttp\b",
    r"\bdatabase\b",
    r"\bnormalization\b",
    r"\bcompiler\b",
    r"\binterpreter\b",
    r"\bmachine\s+learning\b",
    r"\bdeep\s+learning\b",
    r"\bneural\s+network\b",
    r"\bartificial\s+intelligence\b",
    # STEM topics
    r"\bphysics\b",
    r"\bchemistry\b",
    r"\bmaths?\b",
    r"\bmathematics\b",
    r"\bformula\b",
    r"\btheorem\b",
    r"\bproof\b",
    r"\bderivation\b",
    r"\blaw\s+of\b",
    r"\bprinciple\s+of\b",
    r"\bequation\b",
    r"\bintegral\b",
    r"\bderivative\b",
    r"\bvector\b",
    r"\bmatrix\b",
    r"\bprobability\b",
    r"\bstatistics\b",
    # visualisation
    r"\bplot\b",
    r"\bgraph\s+of\b",
    r"\bvisualize\b",
    r"\bcalculate\b",
]


# ── Internal helpers ──────────────────────────────────────────────────────────

def _match_any(text: str, patterns: list[str]) -> bool:
    for p in patterns:
        if re.search(p, text, re.IGNORECASE):
            return True
    return False


def _count_matches(text: str, patterns: list[str]) -> int:
    return sum(1 for p in patterns if re.search(p, text, re.IGNORECASE))


# ── Public API ────────────────────────────────────────────────────────────────

def classify(prompt: str, context: dict | None = None) -> Classification:
    """
    Classify a student question into a routing tier.

    Parameters
    ----------
    prompt : str
        The raw student question text.
    context : dict, optional
        Frontend context dict.  Keys examined:
        - assignment_id  → pushes toward ACADEMIC_VERIFIED
        - is_assignment  → same
        - exam_mode      → same

    Returns
    -------
    Classification with keys: tier, confidence, reason
    """
    text = (prompt or "").strip()
    ctx = context or {}
    words = text.split()

    # ── 1. RESTRICTED (highest priority) ─────────────────────────────────────
    if _match_any(text, _RESTRICTED_SIGNALS):
        log.debug("classifier_restricted", prompt_preview=text[:80])
        return Classification(
            tier=RoutingTier.RESTRICTED,
            confidence=0.92,
            reason="Matched off-topic / restricted keyword pattern.",
        )

    # ── 2. ACADEMIC_VERIFIED ──────────────────────────────────────────────────
    academic_hits = _count_matches(text, _ACADEMIC_SIGNALS)
    ctx_academic = bool(
        ctx.get("assignment_id")
        or ctx.get("is_assignment")
        or ctx.get("exam_mode")
    )

    if academic_hits >= 2 or (academic_hits >= 1 and ctx_academic):
        conf = min(0.95, 0.70 + academic_hits * 0.08 + (0.10 if ctx_academic else 0.0))
        log.debug("classifier_academic", hits=academic_hits, ctx_academic=ctx_academic)
        return Classification(
            tier=RoutingTier.ACADEMIC_VERIFIED,
            confidence=round(conf, 3),
            reason=f"{academic_hits} academic signal(s); ctx_academic={ctx_academic}.",
        )

    # ── 3. SAFE_INSTANT ───────────────────────────────────────────────────────
    safe_hits = _count_matches(text, _SAFE_SIGNALS)

    # Short questions (≤ 10 words) with zero academic signals are almost always general
    is_short = len(words) <= 10 and academic_hits == 0

    if safe_hits >= 1 or is_short:
        conf = min(0.95, 0.65 + safe_hits * 0.04 + (0.08 if is_short else 0.0))
        log.debug("classifier_safe", safe_hits=safe_hits, is_short=is_short)
        return Classification(
            tier=RoutingTier.SAFE_INSTANT,
            confidence=round(conf, 3),
            reason=f"{safe_hits} safe-topic signal(s); short={is_short}.",
        )

    # ── 4. Ambiguous single academic signal without context → SAFE ────────────
    if academic_hits == 1 and not ctx_academic:
        return Classification(
            tier=RoutingTier.SAFE_INSTANT,
            confidence=0.60,
            reason="Single ambiguous academic signal without assignment context; defaulting to safe.",
        )

    # ── 5. Default: SAFE_INSTANT ──────────────────────────────────────────────
    return Classification(
        tier=RoutingTier.SAFE_INSTANT,
        confidence=0.55,
        reason="No strong signals; defaulting to safe instant response.",
    )
