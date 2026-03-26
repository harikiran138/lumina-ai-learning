from __future__ import annotations

import asyncio
import json
import re
from ai_engine.llm import OllamaProvider, get_llm_provider, is_provider_error
from ai_engine.tutor_state import get_tutor_state
from app.rag.retrieval import RetrievalService
from ai_engine.prompts import A2UI_SYSTEM_PROMPT
from app.personalization.explanation_planner import ExplanationPlanner
from app.personalization.schemas import LearnerProfileRecord
from app.store.tutor_memory_store import TutorMemoryStore
from app.database.supabase_manager import supabase_db


def _normalize_spaces(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def _format_topic_label(topic: str) -> str:
    normalized = _normalize_spaces(topic)
    if not normalized:
        return "this topic"

    aliases = {
        "ai": "AI",
        "artificial intelligence": "Artificial Intelligence",
        "ml": "Machine Learning",
        "machine learning": "Machine Learning",
        "nlp": "Natural Language Processing",
    }
    return aliases.get(normalized.lower(), normalized.title())


def _meta_topic_label(topic: str) -> str:
    normalized = _normalize_spaces(topic)
    if not normalized:
        return "General"

    aliases = {
        "ai": "AI",
        "artificial intelligence": "Artificial Intelligence",
        "ml": "Machine Learning",
        "machine learning": "Machine Learning",
        "nlp": "Natural Language Processing",
    }
    return aliases.get(normalized.lower(), normalized)


SUBJECT_MODE_KEYWORDS = {
    "math": [
        "equation",
        "algebra",
        "calculus",
        "integral",
        "derivative",
        "geometry",
        "trigonometry",
        "matrix",
        "probability",
        "statistics",
    ],
    "science": [
        "physics",
        "chemistry",
        "biology",
        "experiment",
        "hypothesis",
        "reaction",
        "cell",
        "energy",
        "force",
        "genetics",
    ],
    "coding": [
        "code",
        "bug",
        "debug",
        "python",
        "javascript",
        "typescript",
        "java",
        "c++",
        "algorithm",
        "data structure",
        "function",
        "class",
        "stack trace",
    ],
    "language": [
        "grammar",
        "essay",
        "paragraph",
        "vocabulary",
        "writing",
        "thesis",
        "pronunciation",
        "literature",
        "comprehension",
        "reading",
    ],
}

SUBJECT_MODE_INSTRUCTIONS = {
    "math": (
        "You are a Math tutor. Show step-by-step reasoning, keep notation clear, "
        "and ask for intermediate steps before giving final answers. Emphasize units, "
        "assumptions, and checks for common mistakes."
    ),
    "science": (
        "You are a Science tutor. Encourage hypothesis formation, cause-effect reasoning, "
        "and experiment or observation framing. Use clear conceptual language before formulas."
    ),
    "coding": (
        "You are a Coding tutor. Give hints and debugging steps first, avoid giving full "
        "solutions immediately, and ask the learner to reason about inputs/outputs, edge cases, "
        "and tests. Provide pseudocode or minimal diffs when helpful."
    ),
    "language": (
        "You are a Language tutor. Focus on structure, grammar, vocabulary, and clarity. "
        "Offer corrections with short explanations and ask the learner to revise."
    ),
    "general": "You are a cross-subject tutor. Keep explanations structured and adaptive.",
}


def infer_subject_mode(
    user_query: str,
    topic: str = "",
    context_filters: dict | None = None,
) -> str:
    filters = context_filters or {}
    explicit_subject = filters.get("subject") or filters.get("course_subject") or filters.get("lesson_subject")
    if isinstance(explicit_subject, str) and explicit_subject.strip():
        lowered = explicit_subject.lower()
        for mode in SUBJECT_MODE_KEYWORDS:
            if mode in lowered:
                return mode

    haystack = " ".join(
        [
            str(user_query or ""),
            str(topic or ""),
            str(filters.get("lesson", "")),
            str(filters.get("assignment", "")),
            str(filters.get("context", "")),
        ]
    ).lower()

    for mode, keywords in SUBJECT_MODE_KEYWORDS.items():
        if any(keyword in haystack for keyword in keywords):
            return mode

    return "general"


def _detect_request_mode(user_query: str) -> str:
    lower = (user_query or "").lower()
    if any(token in lower for token in ["timeline", "time line", "history", "evolution"]):
        return "timeline"
    if any(token in lower for token in ["compare", "difference", "vs", "versus"]):
        return "comparison"
    if any(token in lower for token in ["quiz", "test me", "mcq", "question"]):
        return "quiz"
    if any(token in lower for token in ["summarize", "summary", "brief", "overview"]):
        return "summary"
    return "explain"


def _extract_weak_topics(learner_profile: dict | None, limit: int = 3) -> list[str]:
    if not learner_profile:
        return []

    mastery = learner_profile.get("mastery_scores") or learner_profile.get("mastery_map") or {}
    if isinstance(mastery, list):
        mastery = {item.get("topic"): item.get("score") for item in mastery if isinstance(item, dict)}

    if not isinstance(mastery, dict):
        return []

    scored = [
        (topic, score)
        for topic, score in mastery.items()
        if isinstance(topic, str) and isinstance(score, (int, float))
    ]
    scored.sort(key=lambda item: item[1])
    return [topic for topic, _ in scored[:limit]]


def _format_memory_snippet(messages: list[dict], limit: int = 6) -> str:
    if not messages:
        return ""

    trimmed: list[str] = []
    for msg in messages[-limit:]:
        role = msg.get("role", "user")
        content = _normalize_spaces(str(msg.get("content", "")))
        if not content:
            continue
        shortened = content[:180] + ("…" if len(content) > 180 else "")
        trimmed.append(f"{role}: {shortened}")
    return "\n".join(trimmed)


def _format_context_block(label: str, payload: dict | str | None) -> str:
    if not payload:
        return ""
    if isinstance(payload, str):
        return f"{label}: {payload}"
    if not isinstance(payload, dict):
        return ""

    title = payload.get("title") or payload.get("name") or payload.get("id")
    description = payload.get("description") or payload.get("summary") or payload.get("content")
    lines = []
    if title:
        lines.append(f"{label} Title: {title}")
    if description:
        snippet = _normalize_spaces(str(description))
        lines.append(f"{label} Details: {snippet[:260]}")
    return "\n".join(lines)


def _ensure_calibration_prompt(payload: dict) -> dict:
    if not isinstance(payload, dict):
        return payload
    flow = payload.get("flow")
    if not isinstance(flow, list):
        return payload

    calibration_prompt = (
        "On a scale of 1-5, how confident do you feel about this topic now? "
        "Which step is still the most unclear?"
    )

    for block in flow:
        if isinstance(block, dict) and block.get("type") == "reflection":
            prompt = block.get("prompt") or ""
            if "confident" not in str(prompt).lower():
                block["prompt"] = f"{prompt.rstrip()} {calibration_prompt}".strip()
            if not block.get("placeholder"):
                block["placeholder"] = "Example: 3/5. I still mix up step 2."
            return payload

    flow.append(
        {
            "type": "reflection",
            "prompt": calibration_prompt,
            "placeholder": "Example: 4/5. I want more practice on the example.",
        }
    )
    return payload


def _extract_context_points(context_text: str, limit: int = 4) -> list[str]:
    if not context_text:
        return []

    ignored_markers = {
        "current user:",
        "overall mastery:",
        "current streak:",
        "pending assignments:",
        "risk level:",
        "enrolled courses:",
        "official course catalog:",
        "recent notes:",
    }

    points: list[str] = []
    for raw_part in re.split(r"(?<=[.!?])\s+|\n+", context_text):
        candidate = _normalize_spaces(raw_part).strip("- ").rstrip(".")
        if len(candidate) < 24:
            continue
        if any(candidate.lower().startswith(marker) for marker in ignored_markers):
            continue
        points.append(candidate)
        if len(points) >= limit:
            break
    return points


def _build_ai_timeline_flow() -> list[dict]:
    return [
        {
            "type": "concept",
            "title": "AI timeline at a glance",
            "summary": "Artificial intelligence moved from early symbolic reasoning ideas to machine learning, deep learning, and modern generative AI systems.",
            "key_points": [
                "Early AI focused on logic, search, and symbolic rules.",
                "Machine learning shifted the field toward learning from data.",
                "Deep learning and generative models made AI useful at internet scale.",
            ],
        },
        {
            "type": "steps",
            "title": "Timeline of AI",
            "steps": [
                "1943 - McCulloch and Pitts proposed a mathematical model of an artificial neuron.",
                "1956 - The Dartmouth workshop helped establish AI as a formal research field.",
                "1960s to 1970s - Symbolic AI, search, and early problem-solving programs drove optimism.",
                "1980s - Expert systems brought AI into industry, followed by renewed limits and another AI winter.",
                "1997 - IBM Deep Blue defeated Garry Kasparov, showing the power of narrow AI systems.",
                "2012 - Deep learning surged after AlexNet showed major gains in image recognition.",
                "2022 onward - Generative AI and large language models brought AI into everyday products.",
            ],
        },
        {
            "type": "table",
            "title": "Main eras of AI",
            "headers": ["Era", "Main idea", "Example"],
            "rows": [
                ["Symbolic AI", "Rules and logic", "Expert systems"],
                ["Machine Learning", "Patterns learned from data", "Spam filtering"],
                ["Deep Learning", "Large neural networks", "Image recognition"],
                ["Generative AI", "Create text, code, and media", "Chat assistants"],
            ],
        },
        {
            "type": "quiz",
            "difficulty": "easy",
            "questions": [
                {
                    "question": "Which event is commonly used to mark the formal birth of AI as a field?",
                    "options": [
                        "The 1956 Dartmouth workshop",
                        "The 1997 Deep Blue match",
                        "The 2012 AlexNet result",
                        "The release of ChatGPT",
                    ],
                    "answer": 0,
                    "explanation": "The Dartmouth workshop in 1956 is widely cited as the starting point of AI as a named research field.",
                }
            ],
        },
        {
            "type": "reflection",
            "prompt": "Do you want the AI timeline next as a shorter exam answer, a diagram, or flashcards?",
            "placeholder": "Example: turn this into a 5-mark exam answer.",
        },
    ]


def get_rag_engine(provider: str = "auto") -> RetrievalService:
    return RetrievalService(provider=provider)


def build_tutor_degraded_response(
    topic: str,
    user_query: str,
    learner_profile: dict | None = None,
    context_text: str = "",
    profile_context: str = "",
    subject_mode: str = "general",
) -> dict:
    raw_topic = _normalize_spaces(topic) or "General"
    meta_topic = _meta_topic_label(raw_topic)
    normalized_topic = _format_topic_label(raw_topic)
    request_mode = _detect_request_mode(user_query)
    context_points = _extract_context_points(context_text)
    cognitive_load = (learner_profile or {}).get("cognitive_load", 50)
    difficulty = "easy" if cognitive_load >= 70 else "medium" if cognitive_load >= 45 else "easy"

    topic_lower = raw_topic.lower()
    if request_mode == "timeline" and topic_lower in {"ai", "artificial intelligence"}:
        return {
            "meta": {
                "topic": meta_topic,
                "difficulty": difficulty,
                "estimated_time_min": 6,
                "exportable": False,
            },
            "flow": _build_ai_timeline_flow(),
        }

    summary = (
        context_points[0]
        if context_points
        else f"{normalized_topic} becomes easier when you first understand the core idea, then walk through one example, and finally test yourself with one short check."
    )
    key_points = context_points[:3] or [
        f"Start with the main definition of {normalized_topic}.",
        f"Identify the key parts or stages inside {normalized_topic}.",
        f"Use one worked example to connect the idea to practice.",
    ]
    steps = [
        f"Define {normalized_topic} in one simple sentence.",
        context_points[1] if len(context_points) > 1 else f"Break {normalized_topic} into its main parts or steps.",
        context_points[2] if len(context_points) > 2 else f"Work through one small example of {normalized_topic}.",
        f"Explain {normalized_topic} back in your own words without looking at notes.",
    ]

    flow: list[dict] = [
        {
            "type": "concept",
            "title": f"{normalized_topic} made simpler",
            "summary": summary,
            "key_points": key_points,
        }
    ]

    if request_mode == "quiz":
        flow.append(
            {
                "type": "quiz",
                "difficulty": difficulty,
                "questions": [
                    {
                        "question": f"What is the best first step when learning {normalized_topic}?",
                        "options": [
                            f"Understand the core idea of {normalized_topic}",
                            "Jump straight to the hardest problem",
                            "Memorize without understanding",
                            "Skip examples completely",
                        ],
                        "answer": 0,
                        "explanation": "A strong first step is always to understand the main idea before moving to harder practice.",
                    }
                ],
            }
        )
    elif request_mode == "comparison":
        flow.append(
            {
                "type": "table",
                "title": f"How to compare {normalized_topic}",
                "headers": ["Compare", "Look for"],
                "rows": [
                    ["Definition", "What the concept means"],
                    ["Structure", "Main parts or stages"],
                    ["Use case", "Where it is applied"],
                    ["Common confusion", "What learners often mix it up with"],
                ],
            }
        )
        flow.append({"type": "steps", "title": "Comparison checklist", "steps": steps})
    else:
        flow.append({"type": "steps", "title": f"Study {normalized_topic} in order", "steps": steps})

    if request_mode == "summary":
        flow.append(
            {
                "type": "flashcards",
                "cards": [
                    {"front": normalized_topic, "back": summary},
                    {"front": "Next step", "back": f"Practice one example and then explain {normalized_topic} in your own words."},
                ],
            }
        )

    flow.append(
        {
            "type": "reflection",
            "prompt": (
                f"What do you want next for {normalized_topic}: an example, a quiz, or a shorter explanation? "
                "Also rate your confidence 1-5."
            ),
            "placeholder": "Example: 3/5. Give me one easy example first.",
        }
    )

    payload = {
        "meta": {
            "topic": meta_topic,
            "difficulty": difficulty,
            "estimated_time_min": 5,
            "exportable": False,
            "subject_mode": subject_mode,
        },
        "flow": flow,
    }
    return _ensure_calibration_prompt(payload)


def _coerce_local_a2ui_payload(payload: dict, topic: str) -> dict | None:
    if not isinstance(payload, dict):
        return None

    meta = payload.get("meta") if isinstance(payload.get("meta"), dict) else {}
    flow = payload.get("flow")
    if not isinstance(flow, list) or not flow:
        return None

    if all(isinstance(block, dict) and block.get("type") for block in flow):
        return payload

    candidate = flow[0] if isinstance(flow[0], dict) else {}
    concept = candidate.get("concept")
    steps = candidate.get("steps")
    reflection = candidate.get("reflection")

    normalized_flow: list[dict] = []
    if concept:
        normalized_flow.append(
            {
                "type": "concept",
                "title": _format_topic_label(topic),
                "summary": str(concept),
                "key_points": [],
            }
        )
    if isinstance(steps, list) and steps:
        normalized_flow.append(
            {
                "type": "steps",
                "title": f"Study {_format_topic_label(topic)}",
                "steps": [str(step) for step in steps[:4]],
            }
        )
    if reflection:
        prompt = reflection[0] if isinstance(reflection, list) and reflection else str(reflection)
        normalized_flow.append(
            {
                "type": "reflection",
                "prompt": str(prompt),
                "placeholder": "Tell me which part still feels unclear.",
            }
        )

    if not normalized_flow:
        return None

    return {
        "meta": {
            "topic": meta.get("topic", _meta_topic_label(topic)),
            "difficulty": meta.get("difficulty", "easy"),
            "estimated_time_min": meta.get("estimated_time_min", 3),
            "exportable": bool(meta.get("exportable", False)),
        },
        "flow": normalized_flow,
    }


class TutorAgent:
    """
    Socratic Dialogue Agent for explaining concepts and scaffolding learning.
    """

    def __init__(self, provider: str = "auto"):
        self.llm = get_llm_provider(provider)
        self.retrieval = get_rag_engine(provider=provider)
        self.memory_store = TutorMemoryStore()

    def _is_local_ollama(self) -> bool:
        return isinstance(self.llm, OllamaProvider)

    def _build_local_prompt(
        self,
        topic: str,
        user_query: str,
        learner_profile: dict | None,
        context_text: str,
        profile_context: str,
        subject_mode: str,
        lesson_context: dict | str | None,
        assignment_context: dict | str | None,
        weak_topics: list[str],
        memory_snippet: str,
        avoid_context: str,
    ) -> tuple[str, str]:
        cognitive_load = (learner_profile or {}).get("cognitive_load", 50)
        detail_instruction = (
            "Keep every sentence extremely short and concrete."
            if cognitive_load > 70
            else "Keep the response concise and practical."
        )
        subject_instruction = SUBJECT_MODE_INSTRUCTIONS.get(subject_mode, SUBJECT_MODE_INSTRUCTIONS["general"])
        lesson_block = _format_context_block("Lesson", lesson_context)
        assignment_block = _format_context_block("Assignment", assignment_context)
        weak_topic_block = ", ".join(weak_topics) if weak_topics else "None"
        system_prompt = """
You are Lumina's local AI tutor.
Return only valid JSON with this exact top-level shape:
{"meta":{"topic":"Topic","difficulty":"easy|medium|hard","estimated_time_min":3,"exportable":false},"flow":[...]}
Allowed block types: concept, steps, quiz, table, flashcards, reflection, text.
Use exactly 3 blocks in this order:
1. concept
2. steps
3. reflection
Do not use markdown fences.
""".strip()
        prompt = f"""
Topic: {topic}
User question: {user_query}
Course context: {(context_text or 'None')[:1200]}
Learner context: {(profile_context or 'None')[:400]}
Subject mode: {subject_mode}
Subject instruction: {subject_instruction}
Weak topics: {weak_topic_block}
{lesson_block}
{assignment_block}
Persistent memory: {(memory_snippet or 'None')[:600]}
Avoid repeating: {(avoid_context or 'None')[:400]}
Instruction: {detail_instruction}

Return a simple teaching response with:
- one concept block,
- one steps block,
- one reflection block that asks for confidence rating (1-5).
Keep arrays short and educational.
""".strip()
        return system_prompt, prompt

    def _fallback_response(
        self,
        topic: str,
        user_query: str,
        learner_profile: dict = None,
        context_text: str = "",
        profile_context: str = "",
        subject_mode: str = "general",
    ) -> dict:
        return build_tutor_degraded_response(
            topic,
            user_query,
            learner_profile=learner_profile,
            context_text=context_text,
            profile_context=profile_context,
            subject_mode=subject_mode,
        )

    async def _get_curriculum_context(self, user_id: str | None) -> dict:
        """Fetch student's academic context from Supabase."""
        default_context = {
            "current_semester": "1 (Default)",
            "allowed_courses": "General Computer Science, Programming Fundamentals",
            "allowed_concepts": "Variables, Loops, Basic Logic"
        }
        if not user_id:
            return default_context

        try:
            # 1. Get student enrollment
            enrollment = await supabase_db.fetch_one("student_enrollments", {"student_id": user_id})
            if not enrollment:
                return default_context

            sem_id = enrollment["current_semester_id"]
            
            # 2. Get current semester info
            semester = await supabase_db.fetch_one("semesters", {"id": sem_id})
            sem_num = semester["semester_number"] if semester else 1

            # 3. Get all courses in current and past semesters for this program
            program_id = enrollment["program_id"]
            # Fetch semesters up to the current one
            semesters = await supabase_db.fetch_all("semesters", {"program_id": program_id})
            allowed_sem_ids = [s["id"] for s in semesters if s["semester_number"] <= sem_num]

            # Fetch courses
            query = supabase_db.client.table("courses").select("id, course_name").in_("semester_id", allowed_sem_ids)
            courses_res = query.execute()
            courses = courses_res.data or []
            course_names = [c["course_name"] for c in courses]
            course_ids = [c["id"] for c in courses]

            # 4. Fetch concepts for these courses
            concepts_query = supabase_db.client.table("course_concepts").select("concept_name").in_("course_id", course_ids)
            concepts_res = concepts_query.execute()
            concept_names = [c["concept_name"] for c in (concepts_res.data or [])]

            return {
                "current_semester": str(sem_num),
                "allowed_courses": ", ".join(course_names) if course_names else "None",
                "allowed_concepts": ", ".join(concept_names) if concept_names else "None"
            }
        except Exception as e:
            print(f"Curriculum lookup failed: {e}")
            return default_context

    async def generate_response(
        self,
        topic: str,
        user_query: str,
        history: list,
        learner_profile: dict | LearnerProfileRecord = None,
        profile_context: str = "",
        subject_mode: str = "general",
        lesson_context: dict | str | None = None,
        assignment_context: dict | str | None = None,
        user_id: str | None = None,
        session_id: str | None = None,
        comprehension_signal: str | None = None,
    ) -> dict:
        """
        Generates a Socratic response using Semantic RAG and learner profile context.
        """
        # 1. Semantic RAG Retrieval
        context_docs: list[str] = []
        if hasattr(self.retrieval, "query"):
            candidate = self.retrieval.query(user_query)
            context_docs = (
                await candidate if asyncio.iscoroutine(candidate) else candidate or []
            )
        elif hasattr(self.retrieval, "hybrid_search"):
            context_docs = await self.retrieval.hybrid_search(user_query, top_k=3)

        context_text = "\n".join(context_docs or [])

        weak_topics = _extract_weak_topics(
            learner_profile if isinstance(learner_profile, dict) else None
        )
        memory_messages = (
            await self.memory_store.get_recent_messages(user_id, limit=6)
            if user_id
            else []
        )
        memory_snippet = _format_memory_snippet(memory_messages)
        avoid_context = ""
        if session_id:
            avoid_context = await get_tutor_state().get_avoid_context(session_id)

        # 2. Build Socratic Prompt
        socratic_instruction = """
        You are a Socratic tutor. Your goal is NOT to give direct answers immediately, 
        but to guide the student towards the answer by asking insightful questions.
        
        Use the provided context from course materials.
        IMPORTANT: Always cite your sources when making fact-based claims using [Source Content Segment] style.
        
        If the student is confused, break down the concept into smaller pieces.
        Adjust your complexity based on the learner's mastery levels and cognitive load.
        """
        subject_instruction = SUBJECT_MODE_INSTRUCTIONS.get(
            subject_mode, SUBJECT_MODE_INSTRUCTIONS["general"]
        )
        socratic_instruction += f"\n\nSUBJECT MODE: {subject_mode}\n{subject_instruction}"

        if weak_topics:
            socratic_instruction += f"\n\nWEAK TOPICS TO PRIORITIZE: {', '.join(weak_topics)}"

        lesson_block = _format_context_block("Lesson", lesson_context)
        assignment_block = _format_context_block("Assignment", assignment_context)
        if lesson_block:
            socratic_instruction += f"\n\n{lesson_block}"
        if assignment_block:
            socratic_instruction += f"\n\n{assignment_block}"

        if memory_snippet:
            socratic_instruction += (
                "\n\nPERSISTENT MEMORY (recent tutor sessions):\n" + memory_snippet
            )

        if avoid_context:
            socratic_instruction += "\n\nAVOID repeating these recent questions:\n" + avoid_context

        socratic_instruction += (
            "\n\nAlways end with a reflection question that asks for confidence (1-5) "
            "and one point of confusion."
        )
        
        explanation_plan = None
        if learner_profile:
            # Convert dict to model if necessary
            if isinstance(learner_profile, dict):
                # We expect the dict to be compatible with LearnerProfileRecord
                # However, the current projection might be partial.
                # For safety, we try to get a full profile from service if possible,
                # but here we'll assume we have enough for the planner.
                # To be robust, the ExplanationPlanner uses defaults.
                pass 
            
            # Generate Explanation Plan
            # Note: We might need a real LearnerProfileRecord here if planner needs more fields
            # For now, planner mostly uses cognitive_load and mastery_state
            from app.services.personalization_service import get_personalization_service
            service = get_personalization_service()
            
            # If we don't have a full record, try to get it
            profile_user_id = learner_profile.get("user_id") if isinstance(learner_profile, dict) else getattr(learner_profile, "user_id", None)
            full_profile = await service.get_profile(profile_user_id) if profile_user_id else None
            
            if full_profile:
                explanation_plan = ExplanationPlanner.generate_plan(full_profile)
                socratic_instruction += f"\n\nEXPLANATION PLAN:\n{json.dumps(explanation_plan.model_dump(), indent=2)}"
                socratic_instruction += f"\n\nADAPTATION MODE: {explanation_plan.mode}"
                socratic_instruction += f"\nSTRATEGY: {explanation_plan.strategy}"
                socratic_instruction += f"\nDEPTH: {explanation_plan.depth}"
                socratic_instruction += f"\nCHUNK SIZE: {explanation_plan.chunk_size}"
            
            cognitive_load = learner_profile.get('cognitive_load', 50) if isinstance(learner_profile, dict) else getattr(learner_profile, "cognitive_load", 50)
            if cognitive_load > 70:
                socratic_instruction += "\nWARNING: Student is experiencing high cognitive load. Be extremely simple, clear, and encouraging."
            
        if self._is_local_ollama():
            system_prompt, prompt = self._build_local_prompt(
                topic,
                user_query,
                learner_profile,
                context_text,
                profile_context,
                subject_mode,
                lesson_context,
                assignment_context,
                weak_topics,
                memory_snippet,
                avoid_context,
            )
        else:
            # Fetch curriculum context
            curr_context = await self._get_curriculum_context(user_id)
            
            # Use the format-friendly master prompt from A2UI_SYSTEM_PROMPT
            base_prompt = A2UI_SYSTEM_PROMPT.replace(
                "{current_semester}", curr_context["current_semester"]
            ).replace(
                "{allowed_courses}", curr_context["allowed_courses"]
            ).replace(
                "{allowed_concepts}", curr_context["allowed_concepts"]
            )
            
            system_prompt = base_prompt + "\n\n" + socratic_instruction
            prompt = f"""
            Topic: {topic}
            Context from materials: {context_text}
            Learner profile context: {profile_context}
            Subject mode: {subject_mode}
            Weak topics: {", ".join(weak_topics) if weak_topics else "None"}
            Lesson context: {lesson_block or "None"}
            Assignment context: {assignment_block or "None"}
            Persistent memory: {(memory_snippet or "None")[:800]}
            
            User Query: {user_query}
            History: {history}
            
            Generate a pedagogical response following the A2UI JSON format.
            """

        response_str = await self.llm.agenerate(prompt, system_prompt=system_prompt)
        if is_provider_error(response_str):
            return self._fallback_response(
                topic,
                user_query,
                learner_profile=learner_profile,
                context_text=context_text,
                profile_context=profile_context,
                subject_mode=subject_mode,
            )
        
        # Strip potential markdown code blocks if the LLM added them
        if "```json" in response_str:
            response_str = response_str.split("```json")[1].split("```")[0].strip()
        elif "```" in response_str:
            response_str = response_str.split("```")[1].split("```")[0].strip()

        try:
            parsed = json.loads(response_str)
            if self._is_local_ollama():
                normalized = _coerce_local_a2ui_payload(parsed, topic)
                if normalized:
                    parsed = normalized
            parsed = _ensure_calibration_prompt(parsed)
            if isinstance(parsed, dict):
                parsed.setdefault("meta", {})
                parsed["meta"]["subject_mode"] = subject_mode
        except Exception as e:
            print(f"Failed to parse AI response as JSON: {e}")
            # Fallback if LLM fails to return JSON
            parsed = {
                "meta": {"topic": topic, "status": "fallback"}, 
                "flow": [{"type": "text", "content": response_str}]
            }
        
        # Add explanation plan to the output if generated
        if explanation_plan:
            if isinstance(parsed, dict):
                parsed["explanation_plan"] = explanation_plan.model_dump()
                parsed.setdefault("meta", {})
                parsed["meta"]["subject_mode"] = subject_mode

        if isinstance(parsed, dict):
            parsed = _ensure_calibration_prompt(parsed)
            parsed.setdefault("meta", {})
            parsed["meta"]["subject_mode"] = subject_mode

        if user_id:
            await self.memory_store.append_message(
                user_id,
                "user",
                user_query,
                metadata={
                    "session_id": session_id,
                    "subject_mode": subject_mode,
                    "signal": comprehension_signal,
                },
            )
            assistant_summary = ""
            if isinstance(parsed, dict):
                flow = parsed.get("flow", [])
                if flow and isinstance(flow, list):
                    concept = next(
                        (b.get("summary") for b in flow if isinstance(b, dict) and b.get("type") == "concept"),
                        None,
                    )
                    assistant_summary = _normalize_spaces(str(concept or ""))
            await self.memory_store.append_message(
                user_id,
                "assistant",
                assistant_summary or json.dumps(parsed)[:600],
                metadata={"session_id": session_id, "subject_mode": subject_mode},
            )

        if comprehension_signal:
            await self.memory_store.record_signal(
                user_id, comprehension_signal, note="user_message"
            )

        return parsed
