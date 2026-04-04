import asyncio
import json
import re
from typing import Any, Dict, List, Optional

import httpx

from ai_engine.llm import infer_openrouter_complexity, resolve_openrouter_models
from ai_engine.prompts import A2UI_SYSTEM_PROMPT, AI_TUTOR_QUEUE_SYSTEM_PROMPT
from app.core.config import settings
from app.core.logging import structlog
from app.database.supabase_manager import supabase_db
from app.rag.retrieval import RetrievalService
from app.services.personalization_service import get_personalization_service
from app.store.content_store import ContentStore

log = structlog.get_logger()

# ── Mode-specific system instruction addendums ─────────────────────────────────

_MODE_INSTRUCTIONS: Dict[str, str] = {
    "explain": (
        "The student wants a concept explained. Use ConceptBlock, StepBlock, DiagramBlock, "
        "and FlashcardBlock. Start with a simple analogy, then build depth. Mandatory: end "
        "with at least one QuizBlock to verify understanding."
    ),
    "quiz": (
        "The student wants to be quizzed. Output ONLY a QuizBlock with 3–5 questions. "
        "Match difficulty to the student's mastery level. Each question must have 4 options, "
        "the correct answer index, and a concise explanation. No concept blocks needed."
    ),
    "code": (
        "The student has a coding question. Structure your response as: "
        "(1) A StepBlock explaining the algorithm/approach step-by-step, "
        "(2) A TextBlock with a complete, well-commented code example, "
        "(3) A StepBlock for execution trace / walkthrough, "
        "(4) An optional QuizBlock asking the student to predict the output of a variant. "
        "Always use the exact language the student mentioned or infer from context."
    ),
    "interactive": (
        "Use Socratic method. DO NOT give the answer directly. "
        "Instead output a ReflectionBlock with a guiding question that leads the student toward "
        "the answer. If they are stuck (implied by follow-up), give one more hint via a StepBlock. "
        "Only reveal the full answer after 2 interaction turns."
    ),
}

# ── Retry configuration ─────────────────────────────────────────────────────────

_RETRYABLE_STATUS_CODES = {408, 429, 500, 502, 503, 504}
_MAX_RETRIES = 2
_RETRY_DELAY_SECONDS = 1.5


def _normalize_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def _truncate(value: str, limit: int) -> str:
    text = _normalize_whitespace(value)
    if len(text) <= limit:
        return text
    return text[: limit - 3].rstrip() + "..."


def _log_preview(value: Any, limit: int = 240) -> str:
    return _truncate(json.dumps(value, default=str) if isinstance(value, (dict, list)) else str(value or ""), limit)


def _average_mastery(profile: Dict[str, Any]) -> float:
    mastery = profile.get("mastery_scores") or profile.get("mastery") or {}
    if not isinstance(mastery, dict) or not mastery:
        return 0.35
    scores = [float(value) for value in mastery.values() if isinstance(value, (int, float))]
    if not scores:
        return 0.35
    return max(0.0, min(1.0, sum(scores) / len(scores)))


def _infer_mode(prompt: str, requested_mode: Optional[str] = None) -> str:
    if requested_mode in _MODE_INSTRUCTIONS:
        return requested_mode

    lower = (prompt or "").lower()
    if any(token in lower for token in ["quiz", "mcq", "test me", "multiple choice"]):
        return "quiz"
    if any(token in lower for token in ["code", "debug", "python", "javascript", "java", "program"]):
        return "code"
    if any(token in lower for token in ["interactive", "guide me", "hint", "don't tell me", "socratic"]):
        return "interactive"
    return "explain"


def _infer_response_type(mode: str, prompt: str, context: Dict[str, Any]) -> str:
    lower = f"{prompt} {json.dumps(context, default=str)}".lower()
    if any(token in lower for token in ["graph", "knowledge graph", "node", "edge", "flowchart", "diagram json"]):
        return "graph"
    mapping = {
        "quiz": "quiz",
        "code": "code",
        "interactive": "explanation",
        "explain": "explanation",
    }
    return mapping.get(mode, "explanation")


def _infer_student_level(profile: Dict[str, Any], context: Dict[str, Any]) -> str:
    explicit = (context.get("student_level") or context.get("grade_level") or "").strip().lower()
    if explicit in {"beginner", "intermediate", "advanced"}:
        return explicit

    mastery = _average_mastery(profile)
    cognitive_load = float(profile.get("cognitive_load") or 50)
    if mastery < 0.4 or cognitive_load >= 75:
        return "beginner"
    if mastery < 0.75:
        return "intermediate"
    return "advanced"


def _infer_difficulty(profile: Dict[str, Any], context: Dict[str, Any]) -> str:
    explicit = (context.get("difficulty") or "").strip().lower()
    if explicit in {"easy", "medium", "hard"}:
        return explicit

    mastery = _average_mastery(profile)
    cognitive_load = float(profile.get("cognitive_load") or 50)
    if mastery < 0.4 or cognitive_load >= 75:
        return "easy"
    if mastery < 0.75:
        return "medium"
    return "hard"


def _infer_concept(prompt: str, context: Dict[str, Any]) -> str:
    for key in ("concept", "topic", "subject"):
        value = context.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()

    lowered = _normalize_whitespace(prompt)

    # Extended pattern set for concept extraction
    patterns = [
        r"(?:explain|describe|define|what is|what are|tell me about|teach me|show me|help me understand)\s+([A-Za-z0-9][A-Za-z0-9\s\-+#/]{1,80}?)(?:\s*[?.]|$)",
        r"(?:quiz me on|test me on|practice|questions? on|mcq on)\s+([A-Za-z0-9][A-Za-z0-9\s\-+#/]{1,80}?)(?:\s*[?.]|$)",
        r"(?:code|write|implement|debug|program)\s+(?:a |an |the )?([A-Za-z0-9][A-Za-z0-9\s\-+#/]{1,80}?)(?:\s*(?:in|using|with)\s+\w+)?(?:\s*[?.]|$)",
        r"(?:how (?:does|do|to))\s+([A-Za-z0-9][A-Za-z0-9\s\-+#/]{1,80}?)\s+(?:work|function|operate|run)",
        r"(?:difference between|compare)\s+([A-Za-z0-9][A-Za-z0-9\s\-+#/]{1,80}?)(?:\s+and\s+|\s*[?.]|$)",
    ]
    for pattern in patterns:
        match = re.search(pattern, lowered, re.IGNORECASE)
        if match:
            concept = match.group(1).strip(" ?.!,:;")
            if len(concept) >= 2:
                return concept

    # Fallback: take the first meaningful noun phrase (3–60 chars)
    words = lowered.split()
    if len(words) >= 2:
        candidate = " ".join(words[:4]).strip(" ?.!,:;")
        if 3 <= len(candidate) <= 60:
            return candidate
    return "General concept"


def _render_acknowledgement_payload(classification: Dict[str, Any], queue_id: Optional[str]) -> str:
    concept = classification["concept"]
    payload = {
        "meta": {
            "topic": concept,
            "difficulty": classification["difficulty"],
            "estimated_time_min": 1,
            "exportable": False,
            "queue_status": "pending_teacher_review",
        },
        "flow": [
            {
                "type": "concept",
                "title": "Answer queued for teacher review",
                "summary": (
                    f"I generated a {classification['response_type']} draft for {concept} "
                    "and sent it to your teacher for verification before release."
                ),
                "key_points": [
                    f"Mode: {classification['mode']}",
                    f"Student level target: {classification['student_level']}",
                    "No unverified AI answer is shown directly to students.",
                ],
            },
            {
                "type": "steps",
                "title": "What happens next",
                "steps": [
                    "Your draft answer is stored in the faculty verification queue.",
                    "A teacher can approve, edit, reject, or escalate it.",
                    "Approved answers become visible through the verified Q&A flow.",
                ],
            },
            {
                "type": "reflection",
                "prompt": "While you wait, do you want a prerequisite quiz or a simpler lead-in topic?",
                "placeholder": "Example: give me a short prerequisite quiz first.",
            },
        ],
    }
    if queue_id:
        payload["meta"]["queue_id"] = queue_id
    return json.dumps(payload)


class AITutorStore:
    def __init__(self):
        self.api_key = settings.OPENROUTER_API_KEY
        self.model = settings.OPENROUTER_MODEL
        self.base_url = settings.OPENROUTER_API_URL
        self.connect_timeout = settings.OPENROUTER_CONNECT_TIMEOUT
        self.read_timeout = settings.OPENROUTER_READ_TIMEOUT
        self.max_retries = settings.OPENROUTER_MAX_RETRIES
        self.retrieval = RetrievalService(provider="auto")
        self.content_store = ContentStore()
        if not self.api_key:
            log.warning("ai_tutor_no_api_key", message="OPENROUTER_API_KEY not set")

    # ── Public API ─────────────────────────────────────────────────────────────

    async def get_response(
        self,
        prompt: str,
        history: List[Dict] = None,
        context: Dict = None,
        mode: str = "explain",
        student_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        if not self.api_key:
            return self._error_fallback(mode, "OPENROUTER_API_KEY is not configured.", provider="offline")

        safe_context = context or {}
        normalized_mode = _infer_mode(prompt, mode)

        # Fetch personalization profile for adaptive prompting
        legacy_profile: Dict[str, Any] = {}
        if student_id:
            try:
                profile_service = get_personalization_service()
                legacy_profile = await profile_service.get_legacy_state(student_id) or {}
            except Exception as exc:
                log.warning("ai_tutor_profile_fetch_failed", student_id=student_id, error=str(exc))

        # Fetch RAG context to ground the response in course material
        course_context_light = {
            "course_id": safe_context.get("course_id"),
            "teacher_id": safe_context.get("teacher_id"),
        }
        rag_context: List[str] = []
        try:
            rag_context = await self._fetch_rag_context(prompt, course_context_light)
        except Exception as exc:
            log.warning("ai_tutor_rag_fetch_failed", error=str(exc))

        system_prompt = self._build_system_prompt(safe_context, normalized_mode, legacy_profile, rag_context)
        messages = self._build_messages(system_prompt, history or [], prompt)
        route_models = resolve_openrouter_models(
            "code" if normalized_mode == "code" else "assessment" if normalized_mode == "quiz" else "tutor",
            prompt,
            system_prompt=system_prompt,
        )

        # Lower temperature for educational accuracy (0.65 → 0.45)
        payload = {
            "model": route_models[0],
            "messages": messages,
            "temperature": 0.45,
            "response_format": {"type": "json_object"},
        }
        if len(route_models) > 1:
            payload["models"] = route_models

        log.info(
            "ai_tutor_request",
            url=self.base_url,
            model=route_models[0],
            models=route_models,
            mode=normalized_mode,
            student_id=student_id,
            prompt_len=len(prompt),
            history_len=len(history or []),
            complexity=infer_openrouter_complexity(prompt, system_prompt),
            payload_preview=_log_preview(
                {
                    "model": payload["model"],
                    "models": payload.get("models"),
                    "message_count": len(messages),
                    "response_format": payload["response_format"],
                }
            ),
        )

        last_error: Exception | None = None
        for attempt in range(self.max_retries + 1):
            try:
                provider_response = await self._call_openrouter(payload, route_models)
                structured_response = self._normalize_structured_response(
                    provider_response["content"],
                    mode=normalized_mode,
                    prompt=prompt,
                    context=safe_context,
                    route_models=route_models,
                    resolved_model=provider_response.get("model"),
                )
                log.info(
                    "ai_tutor_response_ok",
                    attempt=attempt + 1,
                    student_id=student_id,
                    resolved_model=provider_response.get("model"),
                    response_type=structured_response.get("type"),
                    response_preview=_log_preview(structured_response.get("content")),
                )
                return structured_response
            except _RetryableError as e:
                last_error = e
                if attempt < self.max_retries:
                    wait = _RETRY_DELAY_SECONDS * (attempt + 1)
                    log.warning(
                        "ai_tutor_retrying",
                        attempt=attempt + 1,
                        wait_seconds=wait,
                        error=str(e),
                    )
                    await asyncio.sleep(wait)
            except Exception as e:
                log.error(
                    "ai_tutor_response_failed",
                    attempt=attempt + 1,
                    error=str(e),
                    student_id=student_id,
                )
                return self._error_fallback(normalized_mode, str(e))

        log.error(
            "ai_tutor_all_retries_exhausted",
            error=str(last_error),
            student_id=student_id,
        )
        return self._error_fallback(
            normalized_mode,
            str(last_error or "OpenRouter failed after retries"),
        )

    async def queue_student_request(
        self,
        prompt: str,
        history: List[Dict],
        context: Dict,
        student_id: str,
        requested_mode: Optional[str] = None,
    ) -> Dict[str, Any]:
        profile_service = get_personalization_service()
        legacy_profile = await profile_service.get_legacy_state(student_id)
        classification = self._classify_request(prompt, context, legacy_profile, requested_mode)
        course_context = await self._resolve_course_context(student_id, context)
        rag_context = await self._fetch_rag_context(prompt, course_context)
        prior_answers = await self._fetch_recent_verified_answers(student_id, course_context.get("course_id"))

        try:
            draft_payload = await self._generate_teacher_review_draft(
                prompt=prompt,
                history=history,
                context=context,
                classification=classification,
                legacy_profile=legacy_profile,
                course_context=course_context,
                rag_context=rag_context,
                prior_answers=prior_answers,
            )
        except Exception as exc:
            log.warning(
                "ai_tutor_draft_generation_failed_using_placeholder",
                error=str(exc),
                student_id=student_id,
            )
            draft_payload = {
                "draft_answer": (
                    f"[Auto-draft unavailable — model error: {type(exc).__name__}] "
                    f"Student asked: {prompt[:200]}"
                ),
                "response_payload": None,
            }

        try:
            queue_item = await self.content_store.create_verification_item(
                student_id=student_id,
                teacher_id=course_context["teacher_id"],
                student_question=prompt,
                ai_generated_answer=draft_payload["draft_answer"],
                course_id=course_context.get("course_id"),
            )
            queue_id = queue_item.get("id") if queue_item else None
        except Exception as exc:
            log.warning(
                "ai_tutor_queue_persist_failed",
                error=str(exc),
                student_id=student_id,
            )
            queue_id = None

        log.info(
            "ai_tutor_queued_for_teacher_review",
            student_id=student_id,
            queue_id=queue_id,
            course_id=course_context.get("course_id"),
            teacher_id=course_context.get("teacher_id"),
            mode=classification["mode"],
            response_type=classification["response_type"],
        )

        return {
            "queued": True,
            "queue_id": queue_id,
            "delivery_status": "pending_teacher_review",
            "classification": {**classification, "course_id": course_context.get("course_id")},
            "response": _render_acknowledgement_payload(classification, queue_id),
        }

    # ── Queue intelligence helpers ─────────────────────────────────────────────

    def _classify_request(
        self,
        prompt: str,
        context: Dict[str, Any],
        legacy_profile: Dict[str, Any],
        requested_mode: Optional[str] = None,
    ) -> Dict[str, str]:
        mode = _infer_mode(prompt, requested_mode)
        return {
            "mode": mode,
            "response_type": _infer_response_type(mode, prompt, context),
            "student_level": _infer_student_level(legacy_profile, context),
            "difficulty": _infer_difficulty(legacy_profile, context),
            "concept": _infer_concept(prompt, context),
        }

    async def _resolve_course_context(self, student_id: str, context: Dict[str, Any]) -> Dict[str, Any]:
        client = supabase_db.get_client()
        requested_course_id = context.get("course_id") or context.get("subject_id")
        teacher_id = str(context.get("teacher_id") or student_id)
        course_name = "General course"
        course_id = requested_course_id
        class_id = context.get("class_id")

        if not course_id:
            enrollment = await supabase_db.fetch_one("student_enrollments", {"student_id": student_id})
            if enrollment:
                course_id = enrollment.get("course_id")
                class_id = class_id or enrollment.get("class_id")

        if course_id:
            course = await supabase_db.fetch_one("courses", {"id": course_id})
            if course:
                teacher_id = str(course.get("teacher_id") or teacher_id)
                course_name = (
                    course.get("course_name")
                    or course.get("name")
                    or course.get("title")
                    or course_name
                )

        if class_id and course_id:
            try:
                assignments = (
                    client.table("teacher_assignments")
                    .select("teacher_id")
                    .eq("class_id", class_id)
                    .eq("course_id", course_id)
                    .limit(1)
                    .execute()
                )
                if assignments.data:
                    teacher_id = str(assignments.data[0].get("teacher_id") or teacher_id)
            except Exception as exc:
                log.warning("ai_tutor_teacher_assignment_lookup_failed", error=str(exc))

        return {
            "course_id": course_id,
            "course_name": course_name,
            "teacher_id": teacher_id,
            "class_id": class_id,
        }

    async def _fetch_rag_context(self, prompt: str, course_context: Dict[str, Any]) -> List[str]:
        filter_options = {}
        if course_context.get("course_id"):
            filter_options["course_id"] = course_context["course_id"]
        if course_context.get("teacher_id"):
            filter_options["teacher_id"] = course_context["teacher_id"]

        try:
            return await self.retrieval.hybrid_search(prompt, top_k=4, filter_options=filter_options or None)
        except Exception as exc:
            log.warning("ai_tutor_rag_lookup_failed", error=str(exc))
            return []

    async def _fetch_recent_verified_answers(self, student_id: str, course_id: Optional[str]) -> List[Dict[str, str]]:
        try:
            rows = await supabase_db.fetch_all("ai_answer_queue", {"student_id": student_id}, limit=12)
        except Exception as exc:
            log.warning("ai_tutor_previous_answers_lookup_failed", error=str(exc))
            return []

        approved_rows = []
        for row in rows:
            status = row.get("status")
            if status not in {"approved", "edited_approved"}:
                continue
            if course_id and row.get("course_id") and str(row.get("course_id")) != str(course_id):
                continue
            approved_rows.append(
                {
                    "question": _truncate(str(row.get("student_question") or ""), 160),
                    "answer": _truncate(
                        str(row.get("teacher_edited_answer") or row.get("ai_generated_answer") or ""),
                        240,
                    ),
                }
            )
        return approved_rows[:3]

    async def _generate_teacher_review_draft(
        self,
        prompt: str,
        history: List[Dict[str, Any]],
        context: Dict[str, Any],
        classification: Dict[str, str],
        legacy_profile: Dict[str, Any],
        course_context: Dict[str, Any],
        rag_context: List[str],
        prior_answers: List[Dict[str, str]],
    ) -> Dict[str, Any]:
        if not self.api_key:
            return {
                "draft_answer": (
                    "AI draft generation is unavailable because the model API key is not configured."
                ),
                "response_payload": None,
            }

        mastery_map = legacy_profile.get("mastery_scores") or {}
        weak_topics = legacy_profile.get("weak_topics") or []
        history_snippet = history[-6:] if history else []

        mode = classification.get("mode", "explain")
        response_type = classification.get("response_type", "explanation")
        mode_instruction = _MODE_INSTRUCTIONS.get(mode, _MODE_INSTRUCTIONS["explain"])

        user_prompt = {
            "student_question": prompt,
            "classification": classification,
            # Explicit reminder so the model knows which format to use
            "mode_instruction": (
                f"The requested mode is '{mode}' (response_type='{response_type}'). "
                f"Follow this instruction exactly: {mode_instruction}"
            ),
            "course_context": course_context,
            "student_profile": {
                "mastery_scores": mastery_map,
                "weak_topics": weak_topics,
                "cognitive_load": legacy_profile.get("cognitive_load", 50),
                "risk_summary": legacy_profile.get("risk_summary", {}),
                "mastery_summary": legacy_profile.get("mastery_summary", ""),
            },
            "recent_history": history_snippet,
            "retrieved_course_content": rag_context,
            "previous_verified_answers": prior_answers,
            "frontend_context": context,
            # Explicit reminders for the draft generator
            "draft_instructions": {
                "target_student_level": classification.get("student_level", "intermediate"),
                "target_difficulty": classification.get("difficulty", "medium"),
                "grounding_required": len(rag_context) > 0,
                "confidence_note": (
                    "Set confidence >= 0.7 only if retrieved_course_content directly answers the question."
                ),
            },
        }

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": AI_TUTOR_QUEUE_SYSTEM_PROMPT},
                {"role": "user", "content": json.dumps(user_prompt)},
            ],
            "temperature": 0.35,
            "response_format": {"type": "json_object"},
        }

        route_models = resolve_openrouter_models(
            "tutor",
            prompt,
            system_prompt=AI_TUTOR_QUEUE_SYSTEM_PROMPT,
            explicit_model=self.model,
        )
        payload["model"] = route_models[0]
        if len(route_models) > 1:
            payload["models"] = route_models

        response_data = await self._call_openrouter(payload, route_models)
        parsed = self._parse_queue_generation(response_data["content"], classification)
        return {
            "draft_answer": self._format_teacher_review_draft(parsed, classification),
            "response_payload": parsed,
        }

    def _parse_queue_generation(self, response_text: str, classification: Dict[str, str]) -> Dict[str, Any]:
        try:
            parsed = json.loads(response_text)
            if isinstance(parsed, dict):
                return parsed
        except Exception as exc:
            log.warning("ai_tutor_queue_json_parse_failed", error=str(exc))

        return {
            "response_type": classification["response_type"],
            "mode": classification["mode"],
            "concept": classification["concept"],
            "student_level": classification["student_level"],
            "difficulty": classification["difficulty"],
            "teacher_review_draft": response_text,
            "graph_payload": None,
            "citations": [],
            "confidence": 0.2,
        }

    def _format_teacher_review_draft(self, parsed: Dict[str, Any], classification: Dict[str, str]) -> str:
        response_type = parsed.get("response_type") or classification["response_type"]
        body = str(parsed.get("teacher_review_draft") or "").strip()

        if response_type == "graph":
            graph_payload = parsed.get("graph_payload")
            graph_json = json.dumps(graph_payload or {"nodes": [], "edges": []}, indent=2)
            summary = body or "Concept graph prepared for teacher review."
            return f"{summary}\n\nA2UI Graph JSON:\n```json\n{graph_json}\n```"

        if body:
            return body

        concept = classification["concept"]
        if response_type == "quiz":
            return f"Quiz draft for {concept} is ready for teacher review."
        if response_type == "code":
            return f"Code explanation draft for {concept} is ready for teacher review."
        return f"Explanation draft for {concept} is ready for teacher review."

    # ── Internal helpers for direct responses ──────────────────────────────────

    def _build_system_prompt(
        self,
        context: Dict,
        mode: str,
        profile: Optional[Dict[str, Any]] = None,
        rag_context: Optional[List[str]] = None,
    ) -> str:
        profile = profile or {}
        semester = context.get("semester") or context.get("current_semester") or "Not specified"
        allowed_courses = context.get("allowed_courses") or context.get("course_name") or "All courses"
        allowed_concepts = context.get("allowed_concepts") or context.get("topic") or "All concepts"

        # Resolve student_level and difficulty from context first, then fall back to profile inference
        student_level = (
            context.get("student_level")
            or context.get("grade_level")
            or _infer_student_level(profile, context)
        )
        difficulty = context.get("difficulty") or _infer_difficulty(profile, context)

        base_prompt = (
            A2UI_SYSTEM_PROMPT
            .replace("{current_semester}", str(semester))
            .replace("{allowed_courses}", str(allowed_courses))
            .replace("{allowed_concepts}", str(allowed_concepts))
            .replace("{student_level}", str(student_level))
            .replace("{difficulty}", str(difficulty))
        )

        student_context_lines = []
        if context.get("context"):
            student_context_lines.append(f"\n## STUDENT CONTEXT\n{context['context']}")
        if context.get("lesson"):
            lesson = context["lesson"]
            if isinstance(lesson, dict):
                lesson = lesson.get("title") or str(lesson)
            student_context_lines.append(f"Current Lesson: {lesson}")
        if context.get("subject"):
            student_context_lines.append(f"Subject: {context['subject']}")
        if context.get("assignment"):
            assign = context["assignment"]
            if isinstance(assign, dict):
                assign = assign.get("title") or str(assign)
            student_context_lines.append(f"Assignment Context: {assign}")

        # Inject mastery and weak topics from profile
        weak_topics = profile.get("weak_topics") or []
        if weak_topics:
            student_context_lines.append(
                f"Weak Topics (address these if related): {', '.join(str(t) for t in weak_topics[:5])}"
            )
        mastery_summary = profile.get("mastery_summary") or ""
        if mastery_summary:
            student_context_lines.append(f"Mastery Summary: {_truncate(mastery_summary, 300)}")

        # Inject retrieved course content as grounding material
        if rag_context:
            rag_lines = "\n".join(f"  - {_truncate(chunk, 200)}" for chunk in rag_context[:4])
            student_context_lines.append(f"\n## RELEVANT COURSE MATERIAL (ground your answer here)\n{rag_lines}")

        if student_context_lines:
            base_prompt += "\n" + "\n".join(student_context_lines)

        mode_key = mode if mode in _MODE_INSTRUCTIONS else "explain"
        base_prompt += f"\n\n## RESPONSE MODE: {mode_key.upper()}\n{_MODE_INSTRUCTIONS[mode_key]}"
        return base_prompt

    def _build_messages(
        self,
        system_prompt: str,
        history: List[Dict],
        prompt: str,
    ) -> List[Dict]:
        messages: List[Dict] = [{"role": "system", "content": system_prompt}]
        messages.extend(history)
        messages.append({"role": "user", "content": prompt})
        return messages

    async def _call_openrouter(self, payload: Dict, route_models: List[str]) -> Dict[str, Any]:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": settings.OPENROUTER_SITE_URL,
            "X-Title": settings.OPENROUTER_APP_NAME,
        }
        timeout = httpx.Timeout(
            connect=self.connect_timeout,
            read=self.read_timeout,
            write=self.read_timeout,
            pool=self.connect_timeout,
        )
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.post(self.base_url, headers=headers, json=payload)
        except httpx.TimeoutException as exc:
            raise _RetryableError(f"OpenRouter request timed out: {exc}") from exc
        except httpx.HTTPError as exc:
            raise _RetryableError(f"OpenRouter transport error: {exc}") from exc

        log.info(
            "ai_tutor_openrouter_response",
            status=response.status_code,
            requested_models=route_models,
            body_preview=_log_preview(response.text),
        )

        if response.status_code in _RETRYABLE_STATUS_CODES:
            raise _RetryableError(
                f"OpenRouter returned {response.status_code}: {response.text[:200]}"
            )

        if response.status_code == 400 and len(route_models) > 1:
            raise _RetryableError(
                f"OpenRouter rejected preferred model {route_models[0]}: {response.text[:200]}"
            )

        if response.status_code == 401:
            log.error("ai_tutor_invalid_api_key", status=401)
            raise ValueError("Invalid OpenRouter API key (401)")

        response.raise_for_status()
        data = response.json()
        choices = data.get("choices")
        if not choices or not isinstance(choices, list):
            log.error("ai_tutor_unexpected_response", data=str(data)[:300])
            raise ValueError("Unexpected OpenRouter response structure")

        message = choices[0].get("message") or {}
        content = message.get("content")
        if isinstance(content, list):
            content = "".join(
                str(item.get("text", "")) if isinstance(item, dict) else str(item)
                for item in content
            ).strip()
        if not content:
            raise ValueError("Unexpected OpenRouter response structure")

        return {
            "content": content,
            "model": data.get("model") or payload.get("model"),
            "raw": data,
        }

    def _normalize_structured_response(
        self,
        response_content: Any,
        *,
        mode: str,
        prompt: str,
        context: Dict[str, Any],
        route_models: List[str],
        resolved_model: Optional[str],
    ) -> Dict[str, Any]:
        parsed: Any = response_content
        if isinstance(response_content, str):
            cleaned = response_content.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned.split("```json", 1)[1].split("```", 1)[0].strip()
            elif cleaned.startswith("```"):
                cleaned = cleaned.split("```", 1)[1].split("```", 1)[0].strip()
            try:
                parsed = json.loads(cleaned)
            except json.JSONDecodeError:
                parsed = response_content

        if isinstance(parsed, dict) and {"type", "content"}.issubset(parsed.keys()):
            structured = parsed
        elif isinstance(parsed, dict) and parsed.get("meta") and parsed.get("flow"):
            first_block = parsed["flow"][0] if parsed["flow"] else {}
            block_type = str(first_block.get("type", "text"))
            mapped_type = "quiz" if block_type == "quiz" else "graph" if block_type in {"graph", "diagram"} else "text"
            structured = {
                "type": mapped_type,
                "content": parsed,
                "meta": parsed.get("meta", {}),
            }
        else:
            response_type = _infer_response_type(mode, prompt, context)
            structured = {
                "type": "text" if response_type == "explanation" else response_type,
                "content": parsed,
                "meta": {},
            }

        meta = structured.setdefault("meta", {})
        meta.setdefault("topic", _infer_concept(prompt, context))
        meta["mode"] = mode
        meta["provider"] = "openrouter"
        meta["models_tried"] = route_models
        meta["resolved_model"] = resolved_model or route_models[0]
        return structured

    @staticmethod
    def _error_fallback(mode: str, error: str, provider: str = "fallback") -> Dict[str, Any]:
        if mode == "quiz":
            response_type = "quiz"
            content = "I encountered an error generating your quiz. Please try again."
        else:
            response_type = "text"
            content = "I encountered an error while thinking. Please try asking again in a moment."

        return {
            "type": response_type,
            "content": content,
            "meta": {
                "provider": provider,
                "mode": mode,
                "error": error,
            },
        }

    # ── Legacy compatibility ───────────────────────────────────────────────────

    def format_history_for_openrouter(self, messages: List[Dict]) -> List[Dict]:
        formatted = []
        for msg in messages:
            if "role" in msg:
                role = "user" if msg["role"] == "user" else "assistant"
            elif "sender" in msg:
                role = "user" if msg["sender"] == "me" else "assistant"
            else:
                continue
            content = msg.get("content") or msg.get("text") or ""
            if content:
                formatted.append({"role": role, "content": str(content)})
        return formatted

    def format_history_for_gemini(self, messages: List[Dict]) -> List[Dict]:
        return self.format_history_for_openrouter(messages)


class _RetryableError(Exception):
    """Raised when OpenRouter returns a retryable HTTP error code."""
