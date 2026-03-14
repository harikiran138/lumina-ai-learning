from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import json
import google.generativeai as genai
import structlog
from datetime import datetime
import time
import re

from ai_engine.llm import get_llm_provider
from ai_engine.rag import get_rag_engine
from ai_engine.prompts import A2UI_SYSTEM_PROMPT
from ai_engine.skills import get_skill_manager
from ai_engine.swarm.tutor import build_tutor_degraded_response
from app.services.ppt_generator import PPTGenerator
from app.services.personalization_service import get_personalization_service
from app.personalization.schemas import LearningEventType, TutorInteractionPayload
from app.core.metrics import AI_REQUESTS, AI_LATENCY
from app.core.audit import audit_logger

# Initialize router and logger
router = APIRouter()
logger = structlog.get_logger()


class CourseGenerationRequest(BaseModel):
    topic: str
    level: str = "Beginning"
    modules: int = 4


class IngestRequest(BaseModel):
    text: str
    metadata: Optional[Dict[str, Any]] = None


class AssignmentCourseRequest(BaseModel):
    """Generate a course personalized to an assignment and optional submission.

    Uses the assignment description and the learner's score (if provided)
    to set difficulty and focus areas.
    """

    assignment_id: str
    submission_id: Optional[str] = None
    modules: int = 4


class ModuleBlueprint(BaseModel):
    id: str
    title: str
    description: str
    topics: List[str]

class CourseGenerationResponse(BaseModel):
    title: str
    description: str
    modules: List[ModuleBlueprint]
    estimated_duration: str = "Self-paced"


class TutorChatRequest(BaseModel):
    message: str
    user_id: str = "guest"
    session_id: Optional[str] = "default-session"
    context_filters: Optional[dict] = None
    provider: str = "auto"
    history: Optional[List[Dict[str, Any]]] = None


class TutorChatResponse(BaseModel):
    response: str
    content: Optional[str] = None
    context_used: List[str]
    personalization: Dict[str, Any]


def _is_a2ui_payload(payload: Any) -> bool:
    return (
        isinstance(payload, dict)
        and isinstance(payload.get("meta"), dict)
        and isinstance(payload.get("flow"), list)
    )


def _difficulty_label(value: Any) -> str:
    if isinstance(value, str):
        lowered = value.lower()
        if lowered in {"easy", "medium", "hard"}:
            return lowered
    if isinstance(value, (int, float)):
        if value >= 0.7:
            return "hard"
        if value >= 0.4:
            return "medium"
    return "easy"


def _extract_topic_from_message(message: str) -> Optional[str]:
    lower_message = (message or "").lower()
    pattern_candidates = [
        r"(?:give me|show me|can you show me|can you give me)\s+(?:a\s+)?(?:timeline|time\s*line|history|summary|overview)\s+(?:of|for|about)\s+([a-z0-9][a-z0-9\s\-/]{1,60})",
        r"(?:timeline|time\s*line|history|evolution|summary|overview)\s+(?:of|for|about)\s+([a-z0-9][a-z0-9\s\-/]{1,60})",
        r"(?:explain|teach|quiz me on|help me with|what is|why is|how does|tell me about|summarize|show me)\s+([a-z0-9][a-z0-9\s\-/]{1,60})",
        r"(?:about|on)\s+([a-z0-9][a-z0-9\s\-/]{1,60})",
    ]
    for pattern in pattern_candidates:
        match = re.search(pattern, lower_message)
        if not match:
            continue
        candidate = match.group(1).strip(" ?.!,:;")
        candidate = re.sub(
            r"\b(please|simply|briefly|step by step|in detail|for me|now)\b",
            "",
            candidate,
        ).strip()
        candidate = re.sub(r"\s+", " ", candidate)
        if candidate:
            return candidate[:60]
    return None


def _infer_tutor_topic(message: str, profile: Dict[str, Any], context_filters: Optional[Dict[str, Any]]) -> str:
    filters = context_filters or {}
    inferred_from_message = _extract_topic_from_message(message)
    if inferred_from_message:
        return inferred_from_message

    if filters.get("topic"):
        return filters["topic"]

    weak_topics = profile.get("weak_topics") or []
    lower_message = message.lower()
    for topic in weak_topics:
        if str(topic).lower() in lower_message:
            return str(topic)

    return weak_topics[0] if weak_topics else "General"


def _build_tutor_blocked_payload(topic: str, detail: str) -> Dict[str, Any]:
    safe_topic = topic or "this request"
    return {
        "meta": {
            "topic": safe_topic,
            "difficulty": "easy",
            "estimated_time_min": 1,
            "exportable": False,
        },
        "flow": [
            {
                "type": "concept",
                "title": "Request blocked",
                "summary": "I cannot help with that request because it violates tutor safety rules.",
                "key_points": [
                    "I can still help with safe educational questions.",
                    "Try asking for an explanation, a quiz, or a study summary instead.",
                ],
            },
            {
                "type": "reflection",
                "prompt": "Do you want to rephrase this as a safe learning question?",
                "placeholder": "Example: explain the safe academic concept instead.",
            },
            {
                "type": "text",
                "content": detail,
            },
        ],
    }


def _build_tutor_error_payload(
    message: str,
    profile: Dict[str, Any],
    topic: str,
    context_filters: Optional[Dict[str, Any]],
) -> Dict[str, Any]:
    profile_context = (context_filters or {}).get("context", "")
    return build_tutor_degraded_response(
        topic,
        message,
        learner_profile=profile,
        profile_context=profile_context,
    )


def _build_tutor_fallback(message: str, profile: Dict[str, Any], topic: str, detail: str) -> Dict[str, Any]:
    weak_topics = profile.get("weak_topics") or []
    focus_topic = weak_topics[0] if weak_topics else topic
    return _build_tutor_blocked_payload(focus_topic, detail)


def _wrap_assessment_payload(result: Dict[str, Any], topic: str) -> Dict[str, Any]:
    return {
        "meta": {
            "topic": topic,
            "difficulty": _difficulty_label(result.get("difficulty")),
            "estimated_time_min": 4,
            "exportable": False,
        },
        "flow": [
            {
                "type": "quiz",
                "difficulty": _difficulty_label(result.get("difficulty")),
                "questions": [
                    {
                        "question": result.get("question", f"What is a key idea in {topic}?"),
                        "options": result.get("options", []),
                        "answer": int(result.get("correct_index", 0) or 0),
                        "explanation": result.get(
                            "explanation",
                            "Review the explanation after answering.",
                        ),
                    }
                ],
            },
            {
                "type": "reflection",
                "prompt": "After answering, tell me whether you want another question or a simpler explanation.",
                "placeholder": "Example: give me one easier practice question.",
            },
        ],
    }


def _wrap_pathway_payload(result: Any, topic: str) -> Dict[str, Any]:
    if isinstance(result, dict):
        message = result.get("message") or result.get("response") or "Here is your next study direction."
        next_topic = result.get("next_topic") or topic
        action = result.get("action") or "CONTINUE"
    else:
        message = str(result)
        next_topic = topic
        action = "CONTINUE"

    return {
        "meta": {
            "topic": topic,
            "difficulty": "easy",
            "estimated_time_min": 3,
            "exportable": False,
        },
        "flow": [
            {
                "type": "concept",
                "title": "Recommended next step",
                "summary": message,
                "key_points": [
                    f"Action: {action}",
                    f"Focus topic: {next_topic}",
                    "Ask for a quiz or worked example if you want to act on this immediately.",
                ],
            },
            {
                "type": "steps",
                "title": "How to use this recommendation",
                "steps": [
                    f"Review {next_topic} briefly.",
                    "Ask the tutor for a simple explanation if the idea still feels unclear.",
                    "Take one short quiz question to confirm understanding.",
                ],
            },
        ],
    }


def _wrap_text_payload(result: Any, topic: str) -> Dict[str, Any]:
    content = str(result).strip() or "Let us continue step by step."
    return {
        "meta": {
            "topic": topic,
            "difficulty": "easy",
            "estimated_time_min": 4,
            "exportable": False,
        },
        "flow": [
            {
                "type": "concept",
                "title": f"Support for {topic}",
                "summary": content,
                "key_points": [
                    "Ask for a simpler explanation if this still feels dense.",
                    "Ask for a quiz when you want to check understanding.",
                ],
            },
            {
                "type": "reflection",
                "prompt": "Do you want an example, a quiz, or a step-by-step explanation next?",
                "placeholder": "Example: give me one worked example.",
            },
        ],
    }


def _normalize_tutor_payload(result: Any, topic: str) -> Dict[str, Any]:
    if _is_a2ui_payload(result):
        return result

    if isinstance(result, dict):
        if "question" in result and isinstance(result.get("options"), list):
            return _wrap_assessment_payload(result, topic)
        if any(key in result for key in {"action", "next_topic", "message"}):
            return _wrap_pathway_payload(result, topic)
        if "response" in result:
            return _wrap_text_payload(result.get("response"), topic)

    if isinstance(result, str):
        lowered = result.lower()
        if any(marker in lowered for marker in ["pathway agent", "study next", "next, review", "next step"]):
            return _wrap_pathway_payload(result, topic)

    return _wrap_text_payload(result, topic)


# ... (IngestRequest remains same)

# Note: We need to instantiate LLM per request to support dynamic provider switching,
# or use the factory inside the route.
# The global 'llm' variable at line 10 is static. We should stop using it for dynamic requests.


@router.post("/generate-course", response_model=CourseGenerationResponse)
async def generate_course(request: CourseGenerationRequest):
    """
    Generate a course outline using local Ollama instance (default) or specified provider.
    """
    # For course generation, we default to auto (likely gemini if key exists)
    llm_instance = get_llm_provider("auto")

    system_prompt = """You are an expert curriculum designer. 
    You MUST follow the naming standard for all courses: 'Primary Concept + Subtopics + Engineering Context'.
    Example: 'Intro to React: Hooks & Context in Enterprise Web Apps'."""
    
    user_prompt = f"""
    Create a {request.level} level course about "{request.topic}".
    The course should have exactly {request.modules} modules.

    Return the response in strictly valid JSON format with the following structure:
    {{
        "title": "Primary Concept + Subtopics + Engineering Context",
        "description": "Brief summary of the course",
        "estimated_duration": "E.g. 4 weeks",
        "modules": [
            {{
                "id": "module-1",
                "title": "Module Title",
                "description": "Module summary",
                "topics": ["Topic 1", "Topic 2"]
            }}
        ]
    }}
    Do not include any explanation, only the JSON.
    """

    start_time = time.time()
    try:
        raw_response = await llm_instance.agenerate(user_prompt, system_prompt)
        AI_LATENCY.labels(provider="auto", model="course_gen").observe(time.time() - start_time)
        AI_REQUESTS.labels(provider="auto", model="course_gen", status="success").inc()

        # Simple cleanup
        clean_response = raw_response.replace("```json", "").replace("```", "").strip()
        import json

        data = json.loads(clean_response)

        audit_logger.log(
            action="course_generated",
            user_id="ai_system",  # Or request.user_id if available
            resource_id=data.get("title"),
            metadata={"topic": request.topic, "level": request.level},
        )

        return CourseGenerationResponse(
            title=data.get("title", f"Course on {request.topic}"),
            description=data.get("description", "Generated by AI"),
            modules=data.get("modules", []),
            estimated_duration=data.get("estimated_duration", "Self-paced")
        )
    except Exception as e:
        AI_REQUESTS.labels(provider="auto", model="course_gen", status="error").inc()
        logger.error("course_generation_failed", topic=request.topic, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-course-from-assignment", response_model=CourseGenerationResponse)
async def generate_course_from_assignment(request: AssignmentCourseRequest):
    """Generate a course outline based on an assignment and optional submission.

    - If submission_id is provided and graded, uses the score to set level.
    - Uses the assignment title/description as the topic/context.
    """
    from app.store.assignment_store import AssignmentStore

    # Instantiate LLM (Default auto)
    llm_instance = get_llm_provider("auto")

    store = AssignmentStore()
    assignment = await store.get_assignment(request.assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    title = assignment.get("title", "AI-generated course")
    description = assignment.get("description", "")

    # Default level
    level_label = "Beginning"

    score = None
    if request.submission_id:
        submissions = await store.get_submissions(request.assignment_id)
        submission = next((s for s in submissions if s["id"] == request.submission_id), None)
        if submission and submission.get("grade") is not None:
            score = float(submission["grade"])

    if score is not None:
        # Simple mapping: 0–100 numeric grade
        if score < 40:
            level_label = "Remedial / Beginner"
        elif score < 70:
            level_label = "Intermediate"
        else:
            level_label = "Advanced / Enrichment"

    system_prompt = """You are an expert curriculum designer. 
    You MUST follow the naming standard for all courses: 'Primary Concept + Subtopics + Engineering Context'.
    Example: 'Intro to React: Hooks & Context in Enterprise Web Apps'."""

    user_prompt = f"""
    Assignment Title: {title}
    Assignment Description: {description}

    Learner Performance:
    - Score: {score if score is not None else 'N/A'}
    - Level: {level_label}

    Design a {request.modules}-module course that helps the learner master the skills needed for this assignment.
    The course name must reflect these specific subtopics and the engineering context of the assignment.

    Return the response in strictly valid JSON format with the following structure:
    {{
        "title": "Primary Concept + Subtopics + Engineering Context",
        "description": "Brief summary of the course",
        "estimated_duration": "E.g. 4 modules / 2 weeks",
        "modules": [
            {{
                "id": "module-1",
                "title": "Module Title",
                "description": "Module summary",
                "topics": ["Topic 1", "Topic 2"]
            }}
        ]
    }}
    Do not include any explanation, only the JSON.
    """

    try:
        raw_response = await llm_instance.agenerate(user_prompt, system_prompt)
        clean_response = raw_response.replace("```json", "").replace("```", "").strip()
        import json

        data = json.loads(clean_response)

        return CourseGenerationResponse(
            title=data.get("title", f"Course for {title}"),
            description=data.get("description", "Generated by AI"),
            modules=data.get("modules", []),
            estimated_duration=data.get("estimated_duration", "Self-paced")
        )
    except Exception as e:
        logger.error(
            "assignment_course_generation_failed", assignment_id=request.assignment_id, error=str(e)
        )
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tutor/chat", response_model=TutorChatResponse)
async def tutor_chat(request: TutorChatRequest):
    """
    Chat with the AI Tutor using the Orchestrator for multi-agent routing.
    Includes [NEW] Swarm Integration.
    """
    from ai_engine.swarm.orchestrator import Orchestrator
    
    try:
        # 1. Initialize Swarm and Learner Engine
        orchestrator = Orchestrator(provider=request.provider or "auto")
        personalization = get_personalization_service()
        
        # 2. Get Learner Profile for context
        profile = await personalization.get_legacy_state(request.user_id)
        topic = _infer_tutor_topic(request.message, profile, request.context_filters)

        # 3. Route via Orchestrator
        # Context for the agents
        context = {
            "user_id": request.user_id,
            "session_id": request.session_id,
            "history": request.history or [],
            "filters": request.context_filters,
            "profile_context": (request.context_filters or {}).get("context", ""),
            "topic": topic,
        }
        
        # [NEW] The Swarm handles safety, intent classification, and RAG
        result = await orchestrator.route_request(request.message, context, learner_profile=profile)

        if isinstance(result, dict) and result.get("status") == "blocked":
            blocked = _build_tutor_blocked_payload(
                topic,
                result.get("detail", "This request was blocked by safety controls."),
            )
            response_text = json.dumps(blocked)
            return {
                "response": response_text,
                "content": response_text,
                "context_used": [],
                "personalization": {
                    "behavior": profile.get("behavior_label", "neutral"),
                    "cognitive_load": profile.get("cognitive_load", 50),
                    "mastery": profile.get("mastery_scores", {}),
                    "risk": profile.get("risk_summary", {}),
                },
            }
        
        # If the result is a dict (likely A2UI), return as response
        if isinstance(result, dict):
            normalized_payload = _normalize_tutor_payload(result, topic)
            response_text = json.dumps(normalized_payload)
            personalization_payload = TutorInteractionPayload(
                message=request.message,
                response=response_text,
                session_id=request.session_id,
                behavior=profile.get("behavior_label", "neutral"),
                recommendation=profile.get("risk_summary", {}).get("risk_level") if isinstance(profile.get("risk_summary"), dict) else getattr(profile.get("risk_summary", {}), "risk_level", None),
                topic=topic,
                explanation_plan=result.get("explanation_plan"),
            ).model_dump(exclude_none=True)
            await personalization.record_event(
                request.user_id,
                LearningEventType.TUTOR_INTERACTION,
                payload=personalization_payload,
                source="ai_router",
                topic_id=topic,
                session_id=request.session_id,
            )
            return {
                "response": response_text,
                "content": response_text,
                "context_used": result.get("context_used", []),
                "personalization": {
                    "behavior": profile.get("behavior_label", "neutral"),
                    "cognitive_load": profile.get("cognitive_load", 50),
                    "mastery": profile.get("mastery_scores", {}),
                    "risk": profile.get("risk_summary", {}),
                },
            }
        
        # Fallback for string responses
        normalized_payload = _normalize_tutor_payload(result, topic)
        response_text = json.dumps(normalized_payload)
        await personalization.record_event(
            request.user_id,
            LearningEventType.TUTOR_INTERACTION,
            payload=TutorInteractionPayload(
                message=request.message,
                response=response_text,
                session_id=request.session_id,
                behavior=profile.get("behavior_label", "neutral"),
                topic=topic,
            ).model_dump(exclude_none=True),
            source="ai_router",
            topic_id=topic,
            session_id=request.session_id,
        )
        return {
            "response": response_text,
            "content": response_text,
            "context_used": [],
            "personalization": {
                "behavior": profile.get("behavior_label", "neutral"),
                "risk": profile.get("risk_summary", {}),
            },
        }

    except Exception as e:
        AI_REQUESTS.labels(provider=request.provider, model="tutor_chat", status="error").inc()
        logger.error("tutor_chat_failed", user_id=request.user_id, error=str(e))
        personalization = get_personalization_service()
        profile = await personalization.get_legacy_state(request.user_id)
        topic = _infer_tutor_topic(request.message, profile, request.context_filters)
        fallback_payload = _build_tutor_error_payload(
            request.message,
            profile,
            topic,
            request.context_filters,
        )
        response_text = json.dumps(fallback_payload)
        return {
            "response": response_text,
            "content": response_text,
            "context_used": [],
            "personalization": {
                "behavior": profile.get("behavior_label", "neutral"),
                "cognitive_load": profile.get("cognitive_load", 50),
                "mastery": profile.get("mastery_scores", {}),
                "risk": profile.get("risk_summary", {}),
            },
        }


@router.post("/tutor/ingest")
async def ingest_content(request: IngestRequest):
    """
    Ingest text content into the RAG vector store.
    """
    try:
        rag_engine = get_rag_engine()
        rag_engine.ingest_text(request.text, request.metadata)
        return {"status": "success", "message": "Content ingested successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Pathway Agent Integration ---

_pathway_agent = None
_behavior_model = None


def get_pathway_agent():
    global _pathway_agent
    if _pathway_agent is None:
        from ai_engine.swarm.pathway import PathwayAgent

        _pathway_agent = PathwayAgent()
    return _pathway_agent


def get_behavior_model():
    global _behavior_model
    if _behavior_model is None:
        from learner_profile.models.behavior import BehaviorModel

        _behavior_model = BehaviorModel()
    return _behavior_model


class PathwayRequest(BaseModel):
    learner_state: dict
    curriculum_graph: dict


class BehaviorRequest(BaseModel):
    session_data: dict


@router.post("/pathway/recommend")
async def recommend_pathway(request: PathwayRequest):
    """
    Get next node recommendation from Pathway Agent.
    """
    recommendation = get_pathway_agent().recommend_next_node(
        request.learner_state, request.curriculum_graph
    )
    return {"recommendation": recommendation}


@router.post("/profile/behavior")
async def classify_behavior(request: BehaviorRequest):
    """
    Classify learner behavior.
    """
    model = get_behavior_model()
    label = model.classify_behavior(request.session_data)
    score = model.calculate_engagement_score(request.session_data)
    return {"behavior": label, "engagement_score": score}


# --- PowerPoint Generation ---


class PPTGenerationRequest(BaseModel):
    """Request model for PPT generation."""

    topic: str
    slides_count: int = 8
    user_id: str = "guest"


class PPTGenerationResponse(BaseModel):
    """Response model for PPT generation."""

    success: bool
    message: str
    download_url: Optional[str] = None
    filename: Optional[str] = None
    file_size: Optional[str] = None
    slide_count: Optional[int] = None
    slide_titles: Optional[List[str]] = None
    content_structure: Optional[Dict[str, Any]] = None


# Initialize Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


@router.post("/tutor/generate-ppt", response_model=PPTGenerationResponse)
async def generate_ppt(request: PPTGenerationRequest):
    """
    Generate a PowerPoint presentation on a given topic using Gemini API.

    Args:
        request: PPT generation request with topic and slide count

    Returns:
        PPTGenerationResponse with download URL and metadata
    """
    try:
        # [OPTIMIZATION] Step 0: Check Cache
        safe_topic_key = request.topic.lower().strip().replace(" ", "_")
        # Find if any file starts with this topic key and is recent (optional)
        # For now, simple strict caching: look for a cache map or just check existing files
        # We'll implement a simple JSON-based cache map for better tracking

        cache_file = "data/ppt_cache.json"
        os.makedirs("data", exist_ok=True)
        try:
            if os.path.exists(cache_file):
                with open(cache_file, "r") as f:
                    cache = json.load(f)
            else:
                cache = {}

            cache_key = f"{safe_topic_key}_{request.slides_count}"
            if cache_key in cache:
                cached_data = cache[cache_key]
                if os.path.exists(cached_data["filepath"]):
                    print(f"Serving cached PPT for {request.topic}")
                    return PPTGenerationResponse(**cached_data["response"])
        except Exception as e:
            logger.warning("ppt_cache_read_failed", topic=request.topic, error=str(e))
            cache = {}

        # Step 1: Generate content structure using Gemini API
        # Use GeminiRestProvider via get_llm_provider for Python 3.8 compatibility
        llm = get_llm_provider("gemini")

        # [OPTIMIZATION] Reduced verbosity in prompt to save output tokens and time
        prompt = f"""Topic: {request.topic}
Slides: {request.slides_count}

Generate a JSON structure for a PowerPoint presentation.
Format:
{{
  "title": "Main Title",
  "subtitle": "Subtitle",
  "slides": [
    {{ "title": "Slide 1", "bullets": ["A", "B", "C"] }}
  ]
}}
Strict JSON only."""

        # Generate content
        content_text = await llm.agenerate(prompt)
        content_text = content_text.strip()

        # Clean up response (remove markdown code blocks if present)
        if content_text.startswith("```json"):
            content_text = content_text.replace("```json", "").replace("```", "").strip()
        elif content_text.startswith("```"):
            content_text = content_text.replace("```", "").strip()

        # Parse JSON response
        try:
            content_structure = json.loads(content_text)
        except json.JSONDecodeError as e:
            logger.error("ppt_json_parse_failed", error=str(e), response_sample=content_text[:500])
            raise HTTPException(
                status_code=500, detail="Failed to parse AI response. Please try again."
            )

        # Step 2: Generate PowerPoint using PPTGenerator
        ppt_gen = PPTGenerator()
        filepath = ppt_gen.create_presentation(request.topic, content_structure)

        # Step 3: Get file metadata
        filename = os.path.basename(filepath)
        file_size = ppt_gen.get_file_size(filepath)
        slide_titles = [slide.get("title", "") for slide in content_structure.get("slides", [])]

        # Step 4: Create download URL
        download_url = f"/api/tutor/download-ppt/{filename}"

        response_data = {
            "success": True,
            "message": f"Presentation '{request.topic}' generated successfully!",
            "download_url": download_url,
            "filename": filename,
            "file_size": file_size,
            "slide_count": len(content_structure.get("slides", [])) + 1,  # +1 for title slide
            "slide_titles": slide_titles,
            "content_structure": content_structure,
        }

        # [OPTIMIZATION] Save to Cache
        try:
            cache_key = f"{safe_topic_key}_{request.slides_count}"
            cache[cache_key] = {
                "filepath": filepath,
                "response": response_data,
                "timestamp": datetime.now().isoformat(),
            }
            with open(cache_file, "w") as f:
                json.dump(cache, f)
        except Exception as e:
            print(f"Cache Write Error: {e}")

        return PPTGenerationResponse(**response_data)

    except Exception as e:
        logger.error("ppt_generation_failed", topic=request.topic, error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to generate presentation: {str(e)}")


@router.get("/tutor/download-ppt/{filename}")
async def download_ppt(filename: str):
    """
    Download a generated PowerPoint file.

    Args:
        filename: Name of the PPTX file to download

    Returns:
        FileResponse with the PPTX file
    """
    filepath = os.path.join("static/presentations", filename)

    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        path=filepath,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        filename=filename,
    )
