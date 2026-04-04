import asyncio
import httpx
from app.core.config import settings
from app.core.logging import structlog
from app.ai_engine.prompts import A2UI_SYSTEM_PROMPT
from typing import List, Dict, Any, Optional

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

_RETRYABLE_STATUS_CODES = {429, 500, 502, 503, 504}
_MAX_RETRIES = 2
_RETRY_DELAY_SECONDS = 1.5


class AITutorStore:
    def __init__(self):
        self.api_key = settings.OPENROUTER_API_KEY
        self.model = settings.OPENROUTER_MODEL
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"
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
    ) -> str:
        if not self.api_key:
            return (
                "I'm sorry, my AI processing unit is currently offline. "
                "Please contact the administrator."
            )

        system_prompt = self._build_system_prompt(context or {}, mode)
        messages = self._build_messages(system_prompt, history or [], prompt)

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.65,
            "response_format": {"type": "json_object"},
        }

        log.info(
            "ai_tutor_request",
            model=self.model,
            mode=mode,
            student_id=student_id,
            prompt_len=len(prompt),
            history_len=len(history or []),
        )

        last_error: Exception | None = None
        for attempt in range(_MAX_RETRIES + 1):
            try:
                response_text = await self._call_openrouter(payload)
                log.info(
                    "ai_tutor_response_ok",
                    attempt=attempt + 1,
                    student_id=student_id,
                    response_len=len(response_text),
                )
                return response_text
            except _RetryableError as e:
                last_error = e
                if attempt < _MAX_RETRIES:
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
                return self._error_fallback(mode)

        log.error(
            "ai_tutor_all_retries_exhausted",
            error=str(last_error),
            student_id=student_id,
        )
        return self._error_fallback(mode)

    # ── Internal helpers ───────────────────────────────────────────────────────

    def _build_system_prompt(self, context: Dict, mode: str) -> str:
        """
        Compose the full system prompt from:
        1. A2UI master prompt (with injected student/course context)
        2. Mode-specific instructions
        """
        # Extract context fields — both flat and nested shapes supported
        semester = context.get("semester") or context.get("current_semester") or "Not specified"
        allowed_courses = context.get("allowed_courses") or context.get("course_name") or "All courses"
        allowed_concepts = context.get("allowed_concepts") or context.get("topic") or "All concepts"

        # Fill in A2UI template placeholders
        base_prompt = A2UI_SYSTEM_PROMPT.format(
            current_semester=semester,
            allowed_courses=allowed_courses,
            allowed_concepts=allowed_concepts,
        )

        # Append rich student context if available
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

        if student_context_lines:
            base_prompt += "\n" + "\n".join(student_context_lines)

        # Append mode-specific instructions
        mode_key = mode if mode in _MODE_INSTRUCTIONS else "explain"
        base_prompt += f"\n\n## RESPONSE MODE: {mode_key.upper()}\n{_MODE_INSTRUCTIONS[mode_key]}"

        return base_prompt

    def _build_messages(
        self,
        system_prompt: str,
        history: List[Dict],
        prompt: str,
    ) -> List[Dict]:
        """
        Build the full messages list for the OpenRouter request.
        History is expected to be ALREADY in {role, content} format —
        normalization is done by the router, not here.
        """
        messages: List[Dict] = [{"role": "system", "content": system_prompt}]
        messages.extend(history)
        messages.append({"role": "user", "content": prompt})
        return messages

    async def _call_openrouter(self, payload: Dict) -> str:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://lumina.learning",
            "X-Title": "Lumina Learning Platform",
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                self.base_url, headers=headers, json=payload
            )

            if response.status_code in _RETRYABLE_STATUS_CODES:
                raise _RetryableError(
                    f"OpenRouter returned {response.status_code}: {response.text[:200]}"
                )

            if response.status_code == 401:
                log.error("ai_tutor_invalid_api_key", status=401)
                raise ValueError("Invalid OpenRouter API key (401)")

            response.raise_for_status()
            data = response.json()

            # Validate expected response shape
            choices = data.get("choices")
            if not choices or not isinstance(choices, list):
                log.error("ai_tutor_unexpected_response", data=str(data)[:300])
                raise ValueError("Unexpected OpenRouter response structure")

            return choices[0]["message"]["content"]

    @staticmethod
    def _error_fallback(mode: str) -> str:
        if mode == "quiz":
            return '{"meta":{"topic":"Error","difficulty":"easy","estimated_time_min":1,"exportable":false},"flow":[{"type":"text","content":"I encountered an error generating your quiz. Please try again."}]}'
        return '{"meta":{"topic":"Error","difficulty":"easy","estimated_time_min":1,"exportable":false},"flow":[{"type":"text","content":"I encountered an error while thinking. Please try asking again in a moment."}]}'

    # ── Legacy compatibility (kept for any code that still calls this directly) ─

    def format_history_for_openrouter(self, messages: List[Dict]) -> List[Dict]:
        """
        Legacy normalizer — prefer using the router-level _normalize_history instead.
        Converts {sender/role, text/content} → {role, content}.
        """
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


class _RetryableError(Exception):
    """Raised when OpenRouter returns a retryable HTTP error code."""
