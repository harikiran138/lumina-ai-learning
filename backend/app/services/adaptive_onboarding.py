import json
import re
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from app.core.rbac import normalize_role
from ai_engine.llm import get_llm_provider, is_provider_error
from ai_engine.prompts import ONBOARDING_QUESTION_PROMPT, ONBOARDING_EVALUATION_PROMPT


REASONING_MARKERS = {
    "because",
    "therefore",
    "so",
    "thus",
    "hence",
    "if",
    "then",
    "example",
    "for example",
    "for instance",
    "means",
    "when",
    "why",
}

LEARNING_STYLE_MARKERS = {
    "story": {"story", "narrative"},
    "examples": {"example", "examples", "application", "use-case", "usecase"},
    "formula": {"formula", "equation", "derive", "derivation"},
    "visual": {"visual", "diagram", "chart", "graph", "map"},
    "step_by_step": {"step", "steps", "sequence", "process", "guided"},
}

ROLE_ALIASES = {
    "faculty": "teacher",
    "college_admin": "admin",
    "super_admin": "admin",
}

ROLE_FLOW_TOTALS = {
    "student": 4,
    "teacher": 4,
    "admin": 4,
    "parent": 4,
    "counselor": 4,
    "peer_tutor": 4,
}


def _now_iso() -> str:
    return datetime.utcnow().isoformat()


def _canonical_role(role: Optional[str]) -> str:
    normalized = normalize_role(role)
    return ROLE_ALIASES.get(normalized, normalized)


def _clip_text(value: str, limit: int = 140) -> str:
    text = (value or "").strip()
    if len(text) <= limit:
        return text
    return f"{text[: limit - 1].rstrip()}…"


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "_", (value or "").strip().lower()).strip("_")
    return slug or "foundational_readiness"


def _tokenize(value: str) -> List[str]:
    return re.findall(r"[a-zA-Z0-9]+", (value or "").lower())


def _extract_focus_terms(value: str, limit: int = 4) -> List[str]:
    seen: List[str] = []
    for token in _tokenize(value):
        if len(token) <= 3:
            continue
        if token not in seen:
            seen.append(token)
        if len(seen) >= limit:
            break
    return seen


def _text_quality(value: str) -> float:
    words = _tokenize(value)
    unique_ratio = min(1.0, len(set(words)) / max(1, len(words)))
    length_score = min(1.0, len(words) / 40.0)
    return round((0.65 * length_score) + (0.35 * unique_ratio), 4)


def _reasoning_score(value: str) -> float:
    text = (value or "").lower()
    marker_hits = sum(1 for marker in REASONING_MARKERS if marker in text)
    structure_score = min(1.0, marker_hits / 4.0)
    punctuation_bonus = 0.15 if any(symbol in text for symbol in [":", ";"]) else 0.0
    return round(min(1.0, structure_score + punctuation_bonus), 4)


def _keyword_overlap(first: str, second: str) -> float:
    left = set(_extract_focus_terms(first, limit=8))
    right = set(_extract_focus_terms(second, limit=8))
    if not left or not right:
        return 0.35
    overlap = len(left & right) / max(1, len(left | right))
    return round(min(1.0, 0.35 + overlap), 4)


def _score_from_choice(value: Any, options: List[Dict[str, Any]], default: float = 0.5) -> float:
    for option in options:
        if str(option.get("value")) == str(value):
            return float(option.get("score", default))
    return default


def _normalize_answer_payload(answer: Any) -> Tuple[Any, str]:
    if isinstance(answer, list):
        normalized_list = [str(item).strip() for item in answer if str(item).strip()]
        return normalized_list, " ".join(normalized_list)
    if answer is None:
        return "", ""
    normalized = str(answer).strip()
    return normalized, normalized


def _merge_json(base: Any, extra: Any) -> Any:
    merged = dict(base or {})
    merged.update(extra or {})
    return merged


class AdaptiveOnboardingEngine:
    def __init__(self, db: Any):
        self.db = db
        self.llm = get_llm_provider(feature="onboarding")

    async def start_session(
        self,
        current_user: Dict[str, Any],
        requested_role: Optional[str] = None,
        force_restart: bool = False,
    ) -> Dict[str, Any]:
        user_id = str(current_user.get("id") or "")
        if not user_id:
            raise ValueError("Unable to identify current user")

        role = _canonical_role(requested_role or current_user.get("role"))
        self._ensure_supported_role(role)

        existing_profile = await self.db.fetch_one("onboarding_profiles", {"user_id": user_id})
        if existing_profile and existing_profile.get("status") == "completed" and not force_restart:
            return {
                "sessionId": existing_profile.get("latest_session_id"),
                "role": role,
                "status": "completed",
                "complete": True,
                "estimatedTotalQuestions": ROLE_FLOW_TOTALS[role],
                "result": existing_profile.get("assessment_summary") or {},
            }

        existing_session = await self.db.fetch_one(
            "onboarding_sessions",
            {"user_id": user_id, "status": "in_progress"},
        )
        if existing_session and not force_restart:
            return self._session_payload(existing_session)

        context = await self._build_context(current_user, role)
        first_question = await self._build_question(role, 0, context, [])
        session = await self.db.insert(
            "onboarding_sessions",
            {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "institution_id": current_user.get("institution_id") or current_user.get("college_id"),
                "role": role,
                "flow_key": f"{role}_adaptive_v1",
                "status": "in_progress",
                "question_count": ROLE_FLOW_TOTALS[role],
                "current_index": 0,
                "context": context,
                "questions": [first_question],
                "answers": [],
                "result": {},
                "started_at": _now_iso(),
            },
        )
        if not session:
            raise ValueError("Failed to initialize onboarding session")
        return self._session_payload(session)

    async def submit_answer(
        self,
        current_user: Dict[str, Any],
        session_id: str,
        question_id: str,
        answer: Any,
        confidence: Optional[float] = None,
        time_taken_seconds: Optional[int] = None,
    ) -> Dict[str, Any]:
        user_id = str(current_user.get("id") or "")
        session = await self.db.fetch_one("onboarding_sessions", {"id": session_id, "user_id": user_id})
        if not session:
            raise ValueError("Adaptive onboarding session not found")
        if session.get("status") != "in_progress":
            return {
                "sessionId": session_id,
                "status": session.get("status"),
                "complete": True,
                "result": session.get("result") or {},
            }

        questions = list(session.get("questions") or [])
        answers = list(session.get("answers") or [])
        current_index = int(session.get("current_index") or 0)
        if current_index >= len(questions):
            raise ValueError("Adaptive onboarding session is out of sync")

        current_question = questions[current_index]
        if str(current_question.get("id")) != str(question_id):
            raise ValueError("Question does not match the current adaptive onboarding prompt")

        normalized_answer, answer_text = _normalize_answer_payload(answer)
        if isinstance(normalized_answer, list) and not normalized_answer:
            raise ValueError("Answer is required")
        if isinstance(normalized_answer, str) and not normalized_answer:
            raise ValueError("Answer is required")

        role = str(session.get("role"))
        context = session.get("context") or {}
        subject_rows = context.get("subject_rows") or [{}]
        subject_name = (subject_rows[0] or {}).get("name", "General")
        answer_record = {
            "question_id": current_question.get("id"),
            "dimension": current_question.get("dimension"),
            "response_type": current_question.get("responseType"),
            "answer": normalized_answer,
            "answer_text": answer_text,
            "confidence": self._derive_confidence(current_question, normalized_answer, confidence),
            "ai_evaluation": await self._ai_evaluate_response(role, subject_name, answer_text) if current_question.get("responseType") == "text" else None,
            "time_taken_seconds": time_taken_seconds,
            "answered_at": _now_iso(),
        }
        answers.append(answer_record)

        total_questions = int(session.get("question_count") or ROLE_FLOW_TOTALS[role])
        completed = len(answers) >= total_questions

        update_payload: Dict[str, Any] = {
            "answers": answers,
            "current_index": len(answers),
            "updated_at": _now_iso(),
        }

        if completed:
            result = await self._finalize_session(current_user, session, answers)
            update_payload.update(
                {
                    "status": "completed",
                    "completed_at": _now_iso(),
                    "result": result,
                }
            )
            await self.db.update("onboarding_sessions", update_payload, {"id": session_id})
            return {
                "sessionId": session_id,
                "status": "completed",
                "complete": True,
                "result": result,
            }

        next_question = await self._build_question(role, len(answers), context, answers)
        questions.append(next_question)
        update_payload["questions"] = questions
        await self.db.update("onboarding_sessions", update_payload, {"id": session_id})
        refreshed = await self.db.fetch_one("onboarding_sessions", {"id": session_id, "user_id": user_id})
        if not refreshed:
            raise ValueError("Failed to persist adaptive onboarding progress")
        return self._session_payload(refreshed)

    async def get_result(self, current_user: Dict[str, Any], session_id: Optional[str] = None) -> Dict[str, Any]:
        user_id = str(current_user.get("id") or "")
        if session_id:
            session = await self.db.fetch_one("onboarding_sessions", {"id": session_id, "user_id": user_id})
            if not session:
                raise ValueError("Adaptive onboarding session not found")
            if session.get("status") == "completed":
                return {
                    "sessionId": session.get("id"),
                    "role": session.get("role"),
                    "status": "completed",
                    "complete": True,
                    "result": session.get("result") or {},
                }
            return self._session_payload(session)

        profile = await self.db.fetch_one("onboarding_profiles", {"user_id": user_id})
        if not profile:
            raise ValueError("Adaptive onboarding result not found")
        return {
            "sessionId": profile.get("latest_session_id"),
            "role": profile.get("role"),
            "status": profile.get("status"),
            "complete": profile.get("status") == "completed",
            "result": profile.get("assessment_summary") or {},
        }

    def _ensure_supported_role(self, role: str) -> None:
        if role not in ROLE_FLOW_TOTALS:
            raise ValueError(f"Adaptive onboarding is not configured for role '{role}'")

    async def _build_context(self, current_user: Dict[str, Any], role: str) -> Dict[str, Any]:
        user_id = str(current_user.get("id") or "")
        progress_record = await self.db.fetch_one("user_data", {"user_id": user_id})
        progress = (progress_record or {}).get("progress") or {}

        subject_ids = [
            str(subject_id)
            for subject_id in ((progress.get("step_3") or {}).get("subjectIds") or [])
            if str(subject_id).strip()
        ]
        if not subject_ids:
            subject_rows = await self.db.fetch_all("student_subjects", {"student_id": user_id})
            subject_ids = [str(row.get("subject_id")) for row in subject_rows if row.get("subject_id")]

        subject_rows = []
        for subject_id in subject_ids[:3]:
            row = await self.db.fetch_one("courses", {"id": subject_id})
            if row:
                subject_rows.append(row)

        preferences = progress.get("step_5") or {}
        personal = progress.get("step_1") or {}
        return {
            "user_id": user_id,
            "role": role,
            "email": current_user.get("email"),
            "full_name": current_user.get("name") or current_user.get("full_name"),
            "first_name": personal.get("firstName") or current_user.get("first_name"),
            "institution_id": current_user.get("institution_id") or current_user.get("college_id"),
            "department_id": current_user.get("dept_id") or current_user.get("department_id"),
            "batch_id": current_user.get("batch_id"),
            "subject_ids": subject_ids,
            "subject_rows": [
                {
                    "id": row.get("id"),
                    "name": row.get("course_name") or row.get("name"),
                    "code": row.get("course_code") or row.get("code"),
                }
                for row in subject_rows
            ],
            "self_assessment": preferences.get("selfAssessment") or "beginner",
            "declared_learning_styles": preferences.get("learningStyles") or [],
            "privacy_mode": "teacher_verified_internal",
        }

    async def _build_question(
        self,
        role: str,
        index: int,
        context: Dict[str, Any],
        answers: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        builders = {
            "student": self._student_question,
            "teacher": self._faculty_question,
            "admin": self._admin_question,
            "parent": self._parent_question,
            "counselor": self._counselor_question,
            "peer_tutor": self._peer_tutor_question,
        }
        question = await builders[role](index, context, answers)
        question.setdefault("sequence", index + 1)
        return question

    async def _ai_evaluate_response(self, role: str, subject: str, response: str) -> Optional[Dict[str, Any]]:
        if not response or len(response.split()) < 3:
            return None
        
        prompt = ONBOARDING_EVALUATION_PROMPT.format(role=role, subject=subject, response=response)
        try:
            ai_text = await self.llm.agenerate(prompt)
            if is_provider_error(ai_text):
                return None
            
            # Clean JSON response
            match = re.search(r"\{.*\}", ai_text, re.DOTALL)
            if match:
                return json.loads(match.group(0))
        except Exception as e:
            print(f"RAOIE Evaluation Error: {e}")
        return None

    async def _student_question(self, index: int, context: Dict[str, Any], answers: List[Dict[str, Any]]) -> Dict[str, Any]:
        subjects = context.get("subject_rows") or []
        primary_subject = (subjects[0] or {}).get("name") if subjects else "your upcoming subjects"
        
        if index == 0:
            prompt = ONBOARDING_QUESTION_PROMPT.format(role="Student", subject=primary_subject, step="Introduction")
            ai_q = await self.llm.agenerate(prompt)
            return {
                "id": f"student_q{index + 1}",
                "dimension": "knowledge",
                "responseType": "text",
                "prompt": ai_q if not is_provider_error(ai_q) else f"What concept in {primary_subject} already feels at least a little familiar to you, and what do you think it means?",
                "helper": "Use 2-4 sentences. We use this to estimate your starting concept map, not to grade you.",
            }
        if index == 1:
            prior = _clip_text((answers[0] or {}).get("answer_text") or "that concept", 80)
            prompt = ONBOARDING_QUESTION_PROMPT.format(role="Student", subject=primary_subject, step=f"Deep Dive (Prior: {prior})")
            ai_q = await self.llm.agenerate(prompt)
            return {
                "id": f"student_q{index + 1}",
                "dimension": "reasoning",
                "responseType": "text",
                "prompt": ai_q if not is_provider_error(ai_q) else f"You mentioned '{prior}'. Teach it back in your own words and add one real-world example or situation where it matters.",
                "helper": "This follow-up checks depth, reasoning, and consistency with your first answer.",
            }
        if index == 2:
            return {
                "id": f"student_q{index + 1}",
                "dimension": "learning_style",
                "responseType": "multi_select",
                "prompt": "How should Lumina explain difficult concepts when you get stuck?",
                "helper": "Choose every explanation mode that helps you learn faster.",
                "options": [
                    {"value": "story", "label": "Story mode", "helper": "Build context through narratives and memory hooks."},
                    {"value": "examples", "label": "Examples first", "helper": "Show practical examples before theory."},
                    {"value": "formula", "label": "Formula focused", "helper": "Prioritize equations, rules, and symbolic structure."},
                    {"value": "visual", "label": "Visual", "helper": "Use diagrams, charts, and visual breakdowns."},
                    {"value": "step_by_step", "label": "Step by step", "helper": "Explain in guided, ordered steps."},
                ],
            }
        return {
            "id": f"student_q{index + 1}",
            "dimension": "confidence",
            "responseType": "single_select",
            "prompt": "How confident do you feel about starting with your current semester workload?",
            "helper": "Confidence helps us set pacing and escalation thresholds.",
            "options": [
                {"value": "low", "label": "Need strong guidance", "helper": "Start slowly with more checks.", "score": 0.28},
                {"value": "steady", "label": "Can build with support", "helper": "Standard pacing with tutor guardrails.", "score": 0.55},
                {"value": "high", "label": "Ready for challenge", "helper": "Faster pacing and harder prompts.", "score": 0.82},
                {"value": "very_high", "label": "Very confident", "helper": "Stretch work and deeper diagnostic follow-ups.", "score": 0.94},
            ],
        }

    async def _faculty_question(self, index: int, context: Dict[str, Any], answers: List[Dict[str, Any]]) -> Dict[str, Any]:
        subjects = context.get("subject_rows") or []
        primary_subject = (subjects[0] or {}).get("name") if subjects else "Higher Education"
        
        if index == 0:
            prompt = ONBOARDING_QUESTION_PROMPT.format(role="Faculty", subject=primary_subject, step="Expertise Assessment")
            ai_q = await self.llm.agenerate(prompt)
            return {
                "id": f"faculty_q{index + 1}",
                "dimension": "expertise",
                "responseType": "text",
                "prompt": ai_q if not is_provider_error(ai_q) else "Which subject area do you most often teach, and what signal tells you a student truly understands it?",
                "helper": "Describe the signal you trust most in real classroom practice.",
            }
        if index == 1:
            prior = _clip_text((answers[0] or {}).get("answer_text") or "that teaching signal", 80)
            prompt = ONBOARDING_QUESTION_PROMPT.format(role="Faculty", subject=primary_subject, step=f"Pedagogical Alignment (Prior: {prior})")
            ai_q = await self.llm.agenerate(prompt)
            return {
                "id": f"faculty_q{index + 1}",
                "dimension": "reasoning",
                "responseType": "text",
                "prompt": ai_q if not is_provider_error(ai_q) else f"You highlighted '{prior}'. How should Lumina mirror that judgment while keeping teacher verification in the loop?",
                "helper": "This shapes the teacher-verified intelligence layer.",
            }
        if index == 2:
            return {
                "id": f"faculty_q{index + 1}",
                "dimension": "teaching_style",
                "responseType": "multi_select",
                "prompt": "Which teaching styles should Lumina favor for your students?",
                "helper": "Select the instructional modes that align with your course delivery.",
                "options": [
                    {"value": "worked_examples", "label": "Worked examples", "helper": "Lead with solved walkthroughs."},
                    {"value": "concept_first", "label": "Concept first", "helper": "Explain the principle before application."},
                    {"value": "practice_first", "label": "Practice first", "helper": "Start with drills and quick checks."},
                    {"value": "rubric_alignment", "label": "Rubric aligned", "helper": "Map explanations to your grading standards."},
                ],
            }
        return {
            "id": f"faculty_q{index + 1}",
            "dimension": "confidence",
            "responseType": "single_select",
            "prompt": "How ready is your current course setup for adaptive AI support?",
            "helper": "We use this to set rollout pace and verification strictness.",
            "options": [
                {"value": "pilot", "label": "Pilot only", "helper": "Tight review gates.", "score": 0.35},
                {"value": "guided", "label": "Guided rollout", "helper": "Teacher reviews key AI outputs.", "score": 0.62},
                {"value": "ready", "label": "Ready to scale", "helper": "Operational with verification checkpoints.", "score": 0.86},
            ],
        }

    async def _admin_question(self, index: int, _context: Dict[str, Any], answers: List[Dict[str, Any]]) -> Dict[str, Any]:
        if index == 0:
            return {
                "id": f"admin_q{index + 1}",
                "dimension": "operations",
                "responseType": "text",
                "prompt": "What is the biggest operational outcome you want Lumina onboarding to improve first at your institution?",
                "helper": "Examples: activation, completion, risk visibility, faculty adoption, compliance.",
            }
        if index == 1:
            prior = _clip_text((answers[0] or {}).get("answer_text") or "that outcome", 80)
            return {
                "id": f"admin_q{index + 1}",
                "dimension": "reasoning",
                "responseType": "text",
                "prompt": f"You prioritized '{prior}'. What is the biggest blocker today, and how should Lumina surface it early?",
                "helper": "This feeds the role-specific admin dashboard posture.",
            }
        if index == 2:
            return {
                "id": f"admin_q{index + 1}",
                "dimension": "intelligence_mode",
                "responseType": "multi_select",
                "prompt": "Which admin intelligence signals matter most on day one?",
                "helper": "Pick the signals that should be visible immediately after onboarding.",
                "options": [
                    {"value": "activation", "label": "Activation health", "helper": "See user activation and completion fast."},
                    {"value": "at_risk", "label": "At-risk flags", "helper": "Surface support cases early."},
                    {"value": "compliance", "label": "Privacy and consent", "helper": "Track consent and policy coverage."},
                    {"value": "adoption", "label": "Faculty adoption", "helper": "Measure whether teaching teams are using the system."},
                ],
            }
        return {
            "id": f"admin_q{index + 1}",
            "dimension": "confidence",
            "responseType": "single_select",
            "prompt": "How confident are you in your institution’s readiness for role-based AI onboarding?",
            "helper": "This influences rollout intensity and checklist depth.",
            "options": [
                {"value": "low", "label": "Need guided rollout", "helper": "Start with tighter safeguards.", "score": 0.34},
                {"value": "medium", "label": "Ready with support", "helper": "Moderate rollout.", "score": 0.6},
                {"value": "high", "label": "Operationally ready", "helper": "Faster rollout with admin intelligence.", "score": 0.88},
            ],
        }

    async def _parent_question(self, index: int, _context: Dict[str, Any], answers: List[Dict[str, Any]]) -> Dict[str, Any]:
        if index == 0:
            return {
                "id": f"parent_q{index + 1}",
                "dimension": "support_context",
                "responseType": "text",
                "prompt": "What kind of academic support does your child need most right now?",
                "helper": "Share the support area you most want Lumina to help you monitor.",
            }
        if index == 1:
            prior = _clip_text((answers[0] or {}).get("answer_text") or "that support area", 80)
            return {
                "id": f"parent_q{index + 1}",
                "dimension": "reasoning",
                "responseType": "text",
                "prompt": f"You mentioned '{prior}'. What would help you tell the difference between a temporary struggle and a real risk signal?",
                "helper": "This tunes guardian-facing alerts and explanations.",
            }
        if index == 2:
            return {
                "id": f"parent_q{index + 1}",
                "dimension": "communication_style",
                "responseType": "multi_select",
                "prompt": "How should Lumina communicate progress or concern to you?",
                "helper": "Select the communication styles you trust most.",
                "options": [
                    {"value": "simple_summary", "label": "Simple summary", "helper": "Plain-language updates."},
                    {"value": "examples", "label": "Examples", "helper": "Show concrete examples of the issue."},
                    {"value": "action_steps", "label": "Action steps", "helper": "Give clear next actions to take at home."},
                    {"value": "visual", "label": "Visual trends", "helper": "Use trend cards and visual progress summaries."},
                ],
            }
        return {
            "id": f"parent_q{index + 1}",
            "dimension": "confidence",
            "responseType": "single_select",
            "prompt": "How confident do you feel about acting on AI-supported academic insights?",
            "helper": "We use this to determine alert detail and escalation pacing.",
            "options": [
                {"value": "low", "label": "Need guided explanations", "helper": "More support and context.", "score": 0.32},
                {"value": "medium", "label": "Can act with context", "helper": "Balanced guidance.", "score": 0.58},
                {"value": "high", "label": "Comfortable acting fast", "helper": "Faster intervention cues.", "score": 0.84},
            ],
        }

    async def _counselor_question(self, index: int, _context: Dict[str, Any], answers: List[Dict[str, Any]]) -> Dict[str, Any]:
        if index == 0:
            return {
                "id": f"counselor_q{index + 1}",
                "dimension": "risk_focus",
                "responseType": "text",
                "prompt": "Which student risk signal do you most want Lumina to detect earlier?",
                "helper": "Examples: disengagement, burnout, attendance drop, confidence collapse, academic spiral.",
            }
        if index == 1:
            prior = _clip_text((answers[0] or {}).get("answer_text") or "that risk signal", 80)
            return {
                "id": f"counselor_q{index + 1}",
                "dimension": "reasoning",
                "responseType": "text",
                "prompt": f"You focused on '{prior}'. What evidence would make that alert trustworthy enough to escalate?",
                "helper": "This sharpens counselor-facing monitoring thresholds.",
            }
        if index == 2:
            return {
                "id": f"counselor_q{index + 1}",
                "dimension": "monitoring_style",
                "responseType": "multi_select",
                "prompt": "Which monitoring outputs are most useful for your workflow?",
                "helper": "Select the signals you want surfaced by default.",
                "options": [
                    {"value": "trend_lines", "label": "Trend lines", "helper": "Watch change over time."},
                    {"value": "evidence_cards", "label": "Evidence cards", "helper": "See supporting indicators for each alert."},
                    {"value": "triage_queue", "label": "Triage queue", "helper": "Prioritized intervention workflow."},
                    {"value": "teacher_context", "label": "Teacher context", "helper": "Include teacher-observed signals."},
                ],
            }
        return {
            "id": f"counselor_q{index + 1}",
            "dimension": "confidence",
            "responseType": "single_select",
            "prompt": "How ready is your intervention workflow for AI-assisted risk monitoring?",
            "helper": "This controls escalation conservatism and alert density.",
            "options": [
                {"value": "cautious", "label": "Very cautious", "helper": "High evidence threshold.", "score": 0.33},
                {"value": "balanced", "label": "Balanced", "helper": "Standard evidence threshold.", "score": 0.61},
                {"value": "ready", "label": "Ready to operationalize", "helper": "Faster triage with evidence.", "score": 0.87},
            ],
        }

    async def _peer_tutor_question(self, index: int, _context: Dict[str, Any], answers: List[Dict[str, Any]]) -> Dict[str, Any]:
        if index == 0:
            return {
                "id": f"peer_tutor_q{index + 1}",
                "dimension": "expertise",
                "responseType": "text",
                "prompt": "Which topic do other students most often come to you for help with, and why do you think you explain it well?",
                "helper": "We use this to route the right students to you early.",
            }
        if index == 1:
            prior = _clip_text((answers[0] or {}).get("answer_text") or "that topic", 80)
            return {
                "id": f"peer_tutor_q{index + 1}",
                "dimension": "reasoning",
                "responseType": "text",
                "prompt": f"You highlighted '{prior}'. If a student still feels stuck after one explanation, what would you try next?",
                "helper": "This helps us model escalation and tutoring style.",
            }
        if index == 2:
            return {
                "id": f"peer_tutor_q{index + 1}",
                "dimension": "tutoring_style",
                "responseType": "multi_select",
                "prompt": "Which tutoring approaches fit you best?",
                "helper": "Select the support styles Lumina should pair with your profile.",
                "options": [
                    {"value": "examples", "label": "Examples", "helper": "Teach through relatable examples."},
                    {"value": "step_by_step", "label": "Step by step", "helper": "Break problems into small guided steps."},
                    {"value": "motivation", "label": "Motivation", "helper": "Build confidence and momentum."},
                    {"value": "practice", "label": "Practice loops", "helper": "Use repeated attempts with feedback."},
                ],
            }
        return {
            "id": f"peer_tutor_q{index + 1}",
            "dimension": "confidence",
            "responseType": "single_select",
            "prompt": "How confident are you in taking student support sessions independently?",
            "helper": "We use this to set routing and escalation rules.",
            "options": [
                {"value": "assisted", "label": "Prefer assisted starts", "helper": "Route simpler cases first.", "score": 0.36},
                {"value": "steady", "label": "Comfortable with standard cases", "helper": "Standard routing.", "score": 0.64},
                {"value": "independent", "label": "Ready for independent support", "helper": "Handle more complex cases.", "score": 0.86},
            ],
        }

    def _derive_confidence(
        self,
        question: Dict[str, Any],
        answer: Any,
        explicit_confidence: Optional[float],
    ) -> float:
        if explicit_confidence is not None:
            return round(max(0.0, min(1.0, explicit_confidence)), 4)
        if question.get("responseType") == "single_select":
            return _score_from_choice(answer, question.get("options") or [], default=0.5)
        if question.get("responseType") == "multi_select":
            selected = answer if isinstance(answer, list) else [answer]
            return round(min(1.0, 0.45 + (0.08 * len(selected))), 4)
        return round(min(1.0, 0.42 + (_text_quality(str(answer)) * 0.4)), 4)

    async def _finalize_session(
        self,
        current_user: Dict[str, Any],
        session: Dict[str, Any],
        answers: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        role = str(session.get("role"))
        context = session.get("context") or {}
        result = self._calculate_result(role, context, answers)
        await self._persist_profile(current_user, session, answers, result)
        return result

    def _calculate_result(
        self,
        role: str,
        context: Dict[str, Any],
        answers: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        first_answer = (answers[0] or {}).get("answer_text", "") if answers else ""
        second_answer = (answers[1] or {}).get("answer_text", "") if len(answers) > 1 else ""
        
        # RAOIE: Incorporate AI Evaluation
        ai_knowledge = [a.get("ai_evaluation", {}).get("knowledge_score") for a in answers if a.get("ai_evaluation")]
        ai_reasoning = [a.get("ai_evaluation", {}).get("reasoning_score") for a in answers if a.get("ai_evaluation")]
        
        base_knowledge = round((0.55 * _text_quality(first_answer)) + (0.45 * _text_quality(second_answer or first_answer)), 4)
        knowledge = round(sum(ai_knowledge) / len(ai_knowledge), 4) if ai_knowledge else base_knowledge
        
        base_reasoning = round((_reasoning_score(first_answer) + _reasoning_score(second_answer or first_answer)) / 2.0, 4)
        reasoning = round(sum(ai_reasoning) / len(ai_reasoning), 4) if ai_reasoning else base_reasoning
        
        consistency = _keyword_overlap(first_answer, second_answer or first_answer)
        confidence_values = [float(item.get("confidence") or 0.5) for item in answers if item.get("confidence") is not None]
        confidence_score = round(sum(confidence_values) / max(1, len(confidence_values)), 4)
        engagement_score = round(
            min(
                1.0,
                0.35
                + (0.15 * len(answers))
                + (0.25 * knowledge)
                + (0.25 * reasoning),
            ),
            4,
        )
        final_score = round(
            (0.4 * knowledge) + (0.2 * reasoning) + (0.2 * consistency) + (0.2 * confidence_score),
            4,
        )
        level = self._assign_level(final_score)
        learning_style = self._detect_learning_style(context, answers)
        strengths, weaknesses = self._derive_strengths_and_weaknesses(
            role,
            knowledge,
            reasoning,
            consistency,
            confidence_score,
            learning_style,
        )
        knowledge_graph = self._build_knowledge_graph(
            role,
            context,
            answers,
            learning_style,
            knowledge,
            reasoning,
            confidence_score,
        )
        recommendations = self._build_recommendations(role, level, learning_style, weaknesses)

        return {
            "role": role,
            "flowKey": f"{role}_adaptive_v1",
            "status": "completed",
            "teacherVerifiedAi": True,
            "privacyMode": context.get("privacy_mode", "teacher_verified_internal"),
            "scores": {
                "knowledge_score": knowledge,
                "reasoning_score": reasoning,
                "consistency_score": consistency,
                "confidence_score": confidence_score,
                "engagement_score": engagement_score,
                "final_score": final_score,
            },
            "level": level,
            "learningStyle": learning_style,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "knowledgeGraph": knowledge_graph,
            "recommendations": recommendations,
            "subjects": context.get("subject_rows") or [],
            "completedAt": _now_iso(),
        }

    def _assign_level(self, score: float) -> str:
        if score < 0.3:
            return "Beginner"
        if score < 0.6:
            return "Basic"
        if score < 0.8:
            return "Intermediate"
        return "Advanced"

    def _detect_learning_style(
        self,
        context: Dict[str, Any],
        answers: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        style_scores = {key: 0.0 for key in LEARNING_STYLE_MARKERS}

        for declared in context.get("declared_learning_styles") or []:
            mapped = {
                "visual_learner": "visual",
                "step_by_step": "step_by_step",
                "real_world_examples": "examples",
                "practice_heavy": "examples",
            }.get(str(declared), "examples")
            style_scores[mapped] += 0.15

        for answer in answers:
            payload = answer.get("answer")
            if isinstance(payload, list):
                for item in payload:
                    if item in style_scores:
                        style_scores[item] += 0.45
            text = str(answer.get("answer_text") or "").lower()
            for style, markers in LEARNING_STYLE_MARKERS.items():
                if any(marker in text for marker in markers):
                    style_scores[style] += 0.12

        max_score = max(style_scores.values()) if style_scores else 1.0
        normalized = {
            key: round((value / max_score), 4) if max_score else 0.0
            for key, value in style_scores.items()
        }
        ranked = sorted(normalized.items(), key=lambda item: item[1], reverse=True)
        primary = ranked[0][0] if ranked else "examples"
        return {
            "primary": primary,
            "weights": normalized,
            "top_modes": [style for style, weight in ranked[:2] if weight > 0],
        }

    def _derive_strengths_and_weaknesses(
        self,
        role: str,
        knowledge: float,
        reasoning: float,
        consistency: float,
        confidence_score: float,
        learning_style: Dict[str, Any],
    ) -> Tuple[List[str], List[str]]:
        strengths: List[str] = []
        weaknesses: List[str] = []

        if knowledge >= 0.62:
            strengths.append("Strong baseline recall for first-pass adaptive calibration")
        else:
            weaknesses.append("Needs more foundational concept scaffolding at the start")

        if reasoning >= 0.58:
            strengths.append("Explains ideas with useful reasoning or examples")
        else:
            weaknesses.append("Benefits from guided follow-up prompts to deepen reasoning")

        if consistency >= 0.6:
            strengths.append("Follow-up answer stays aligned with the original explanation")
        else:
            weaknesses.append("Concept explanations are not yet fully stable across follow-ups")

        if confidence_score < 0.45:
            weaknesses.append("Low starting confidence suggests gentler pacing and more reassurance")
        elif confidence_score > 0.78:
            strengths.append("Shows confidence that supports a faster starting pace")

        if role == "student":
            primary_style = learning_style.get("primary")
            if primary_style:
                strengths.append(f"Personalization can lean into {primary_style.replace('_', ' ')} delivery immediately")

        return strengths[:4], weaknesses[:4]

    def _build_knowledge_graph(
        self,
        role: str,
        context: Dict[str, Any],
        answers: List[Dict[str, Any]],
        learning_style: Dict[str, Any],
        knowledge: float,
        reasoning: float,
        confidence_score: float,
    ) -> Dict[str, Any]:
        if role != "student":
            return {
                "masteryMap": {},
                "nodes": [],
            }

        subjects = context.get("subject_rows") or []
        # RAOIE: Use AI-extracted topics if available
        ai_topics = []
        for a in answers:
            ai_evaluation = a.get("ai_evaluation") or {}
            if ai_evaluation.get("extracted_topics"):
                ai_topics.extend(ai_evaluation["extracted_topics"])
        
        focus_terms = (ai_topics[:6] if ai_topics else 
                      _extract_focus_terms(" ".join(str(item.get("answer_text") or "") for item in answers), limit=4))
        
        nodes = []
        mastery_map: Dict[str, Any] = {}
        concept_key = "_".join(focus_terms[:2]).lower().replace(" ", "_") if focus_terms else "foundational_readiness"
        for subject in subjects:
            subject_id = str(subject.get("id"))
            course_name = subject.get("name") or "Untitled course"
            concept_map = {
                concept_key: round(knowledge, 4),
                "applied_reasoning": round(reasoning, 4),
                "confidence_baseline": round(confidence_score, 4),
            }
            mastery_map[subject_id] = {
                "course_name": course_name,
                "concepts": concept_map,
                "learning_style": learning_style.get("primary"),
            }
            nodes.append(
                {
                    "subject_id": subject_id,
                    "course_name": course_name,
                    "concepts": concept_map,
                }
            )
        return {
            "masteryMap": mastery_map,
            "nodes": nodes,
        }

    def _build_recommendations(
        self,
        role: str,
        level: str,
        learning_style: Dict[str, Any],
        weaknesses: List[str],
    ) -> List[str]:
        if role == "student":
            top_modes = learning_style.get("top_modes") or [learning_style.get("primary")]
            mode_text = ", ".join(mode.replace("_", " ") for mode in top_modes if mode)
            return [
                f"Start at {level.lower()} difficulty for diagnostic-first lessons.",
                f"Prefer {mode_text or 'examples'} when explaining new concepts.",
                "Keep teacher verification enabled on high-impact tutor recommendations.",
            ]
        if role == "teacher":
            return [
                f"Begin with a {level.lower()} rollout profile for teacher-verified AI support.",
                "Mirror your selected teaching styles in adaptive explanation defaults.",
                "Require review checkpoints on newly generated remediation plans.",
            ]
        if role == "admin":
            return [
                f"Use a {level.lower()} operational rollout for onboarding intelligence.",
                "Surface the selected admin signals directly on the activation dashboard.",
                "Keep privacy-first defaults enabled for all role-specific onboarding flows.",
            ]
        return [
            f"Start with a {level.lower()} support configuration.",
            weaknesses[0] if weaknesses else "Review the first cohort manually before scaling.",
            "Keep teacher-verified and privacy-first defaults enabled.",
        ]

    async def _persist_profile(
        self,
        current_user: Dict[str, Any],
        session: Dict[str, Any],
        answers: List[Dict[str, Any]],
        result: Dict[str, Any],
    ) -> None:
        user_id = str(current_user.get("id") or "")
        role = str(session.get("role"))
        context = session.get("context") or {}
        now = _now_iso()

        profile_payload = {
            "user_id": user_id,
            "institution_id": current_user.get("institution_id") or current_user.get("college_id"),
            "role": role,
            "status": "completed",
            "latest_session_id": session.get("id"),
            "scores": result.get("scores") or {},
            "level": result.get("level"),
            "learning_style_profile": result.get("learningStyle") or {},
            "strengths": result.get("strengths") or [],
            "weaknesses": result.get("weaknesses") or [],
            "knowledge_graph_seed": result.get("knowledgeGraph") or {},
            "assessment_summary": result,
            "response_trace": {
                "questions": session.get("questions") or [],
                "answers": answers,
            },
            "completed_at": now,
            "updated_at": now,
        }
        await self.db.upsert("onboarding_profiles", profile_payload, on_conflict="user_id")

        await self._persist_user_data_progress(user_id, session.get("id"), result)
        await self._sync_learner_profile(user_id, role, result, context)
        if role == "student":
            await self._seed_student_mastery(user_id, context, result)

        await self.db.insert(
            "learning_events",
            {
                "user_id": user_id,
                "event_type": "adaptive_onboarding_completed",
                "source": "onboarding",
                "session_id": session.get("id"),
                "payload": {
                    "role": role,
                    "level": result.get("level"),
                    "scores": result.get("scores"),
                },
                "created_at": now,
            },
        )

    async def _persist_user_data_progress(self, user_id: str, session_id: Any, result: Dict[str, Any]) -> None:
        existing = await self.db.fetch_one("user_data", {"user_id": user_id})
        progress = ((existing or {}).get("progress") or {}).copy()
        progress["adaptive_onboarding"] = {
            "status": "completed",
            "session_id": session_id,
            "level": result.get("level"),
            "scores": result.get("scores") or {},
            "completed_at": result.get("completedAt"),
        }

        payload = {
            "user_id": user_id,
            "progress": progress,
            "updated_at": _now_iso(),
        }
        if existing:
            await self.db.update("user_data", payload, {"user_id": user_id})
        else:
            await self.db.insert("user_data", payload)

    async def _sync_learner_profile(
        self,
        user_id: str,
        role: str,
        result: Dict[str, Any],
        context: Dict[str, Any],
    ) -> None:
        existing = await self.db.fetch_one("learner_profiles", {"user_id": user_id}) or {}
        preferences = _merge_json(existing.get("preferences"), {"adaptive_onboarding": result.get("learningStyle") or {}})
        metadata = _merge_json(
            existing.get("metadata"),
            {
                "adaptive_onboarding": {
                    "level": result.get("level"),
                    "flow_key": result.get("flowKey"),
                    "completed_at": result.get("completedAt"),
                    "teacher_verified": True,
                }
            },
        )
        assessment_summary = _merge_json(existing.get("assessment_summary"), {"adaptive_onboarding": result.get("scores") or {}})
        mastery_state = _merge_json(existing.get("mastery_state"), (result.get("knowledgeGraph") or {}).get("masteryMap") or {})

        await self.db.upsert(
            "learner_profiles",
            {
                "user_id": user_id,
                "role": role,
                "status": "completed",
                "goals": existing.get("goals") or ["complete_onboarding"],
                "preferences": preferences,
                "learning_style": (result.get("learningStyle") or {}).get("primary"),
                "strengths": result.get("strengths") or [],
                "weaknesses": result.get("weaknesses") or [],
                "assessment_summary": assessment_summary,
                "mastery_state": mastery_state,
                "metadata": metadata,
                "updated_at": _now_iso(),
            },
            on_conflict="user_id",
        )

        # 2. Update master user flag
        await self.db.update(
            "users",
            {"onboarding_step": 5},
            {"id": user_id}
        )

    async def _seed_student_mastery(
        self,
        user_id: str,
        context: Dict[str, Any],
        result: Dict[str, Any],
    ) -> None:
        subject_ids = context.get("subject_ids") or []
        scores = result.get("scores") or {}
        mastery_score = float(scores.get("final_score") or 0.45)
        confidence_score = float(scores.get("confidence_score") or 0.5)
        now = _now_iso()
        for subject_id in subject_ids:
            await self.db.delete(
                "skill_mastery",
                {
                    "user_id": user_id,
                    "course_id": subject_id,
                    "skill_name": "adaptive_onboarding_baseline",
                },
            )
            await self.db.insert(
                "skill_mastery",
                {
                    "user_id": user_id,
                    "course_id": subject_id,
                    "skill_name": "adaptive_onboarding_baseline",
                    "mastery_score": mastery_score,
                    "confidence": confidence_score,
                    "bkt_p_l0": mastery_score,
                    "assessment_count": 1,
                    "last_assessed": now,
                    "updated_at": now,
                },
            )

    def _session_payload(self, session: Dict[str, Any]) -> Dict[str, Any]:
        questions = list(session.get("questions") or [])
        answers = list(session.get("answers") or [])
        current_index = int(session.get("current_index") or 0)
        current_question = questions[current_index] if current_index < len(questions) else None
        return {
            "sessionId": session.get("id"),
            "role": session.get("role"),
            "status": session.get("status"),
            "complete": False,
            "estimatedTotalQuestions": int(session.get("question_count") or len(questions) or 0),
            "questionsAnswered": len(answers),
            "question": current_question,
        }
