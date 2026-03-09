from __future__ import annotations

import json
import re
from ai_engine.llm import get_llm_provider, is_provider_error
from ai_engine.rag import get_rag_engine
from ai_engine.prompts import A2UI_SYSTEM_PROMPT


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


def build_tutor_degraded_response(
    topic: str,
    user_query: str,
    learner_profile: dict | None = None,
    context_text: str = "",
    profile_context: str = "",
) -> dict:
    normalized_topic = _format_topic_label(topic)
    request_mode = _detect_request_mode(user_query)
    context_points = _extract_context_points(context_text)
    cognitive_load = (learner_profile or {}).get("cognitive_load", 50)
    difficulty = "easy" if cognitive_load >= 70 else "medium" if cognitive_load >= 45 else "easy"

    topic_lower = normalized_topic.lower()
    if request_mode == "timeline" and topic_lower in {"ai", "artificial intelligence"}:
        return {
            "meta": {
                "topic": normalized_topic,
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
            "prompt": f"What do you want next for {normalized_topic}: an example, a quiz, or a shorter explanation?",
            "placeholder": "Example: give me one easy example first.",
        }
    )

    return {
        "meta": {
            "topic": normalized_topic,
            "difficulty": difficulty,
            "estimated_time_min": 5,
            "exportable": False,
        },
        "flow": flow,
    }


class TutorAgent:
    """
    Socratic Dialogue Agent for explaining concepts and scaffolding learning.
    """

    def __init__(self, provider: str = "auto"):
        self.llm = get_llm_provider(provider)
        self.rag = get_rag_engine()

    def _fallback_response(
        self,
        topic: str,
        user_query: str,
        learner_profile: dict = None,
        context_text: str = "",
        profile_context: str = "",
    ) -> dict:
        return build_tutor_degraded_response(
            topic,
            user_query,
            learner_profile=learner_profile,
            context_text=context_text,
            profile_context=profile_context,
        )

    async def generate_response(
        self,
        topic: str,
        user_query: str,
        history: list,
        learner_profile: dict = None,
        profile_context: str = "",
    ) -> dict:
        """
        Generates a Socratic response using RAG and learner profile context.
        """
        # 1. RAG Retrieval
        context_docs = self.rag.query(user_query, n_results=3)
        context_text = "\n".join(context_docs)

        # 2. Build Socratic Prompt
        socratic_instruction = """
        You are a Socratic tutor. Your goal is NOT to give direct answers immediately, 
        but to guide the student towards the answer by asking insightful questions.
        
        Use the provided context from course materials.
        If the student is confused, break down the concept into smaller pieces.
        Adjust your complexity based on the learner's mastery levels and cognitive load.
        """
        
        if learner_profile:
            cognitive_load = learner_profile.get('cognitive_load', 50)
            if cognitive_load > 70:
                socratic_instruction += "\nWARNING: Student is experiencing high cognitive load. Be extremely simple, clear, and encouraging."
            
        system_prompt = A2UI_SYSTEM_PROMPT + "\n\n" + socratic_instruction
        
        prompt = f"""
        Topic: {topic}
        Context from materials: {context_text}
        Learner profile context: {profile_context}
        
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
            )
        
        # Strip potential markdown code blocks if the LLM added them
        if "```json" in response_str:
            response_str = response_str.split("```json")[1].split("```")[0].strip()
        elif "```" in response_str:
            response_str = response_str.split("```")[1].split("```")[0].strip()

        try:
            return json.loads(response_str)
        except Exception as e:
            print(f"Failed to parse AI response as JSON: {e}")
            # Fallback if LLM fails to return JSON
            return {
                "meta": {"topic": topic, "status": "fallback"}, 
                "flow": [{"type": "text", "content": response_str}]
            }
