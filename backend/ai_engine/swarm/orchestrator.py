from .handwriting_agent import HandwritingAgent
from .tutor import TutorAgent, infer_subject_mode
from .assessment import AssessmentAgent
from .intervention import InterventionAgent
from .guardian import GuardianAgent
from .pathway import PathwayAgent
from ai_engine.llm import get_llm_provider, is_provider_error

class Orchestrator:
    """
    Master Agent that routes user intent to specialized agents.
    """

    VALID_INTENTS = {"TUTORING", "ASSESSMENT", "PATHWAY", "HANDWRITING", "GENERAL"}

    def __init__(self, provider: str = "auto"):
        self.handwriting_agent = HandwritingAgent()
        self.tutor_agent = TutorAgent(provider=provider)
        self.assessment_agent = AssessmentAgent(provider=provider)
        self.intervention_agent = InterventionAgent()
        self.guardian_agent = GuardianAgent()
        self.pathway_agent = PathwayAgent()
        self.llm = get_llm_provider(provider)

    def _heuristic_intent(self, user_input: str) -> str:
        lower = user_input.lower()

        if any(word in lower for word in ["handwriting", "handwritten", "upload note", "scan note"]):
            return "HANDWRITING"
        if any(word in lower for word in ["quiz", "question", "test me", "assessment", "mcq"]):
            return "ASSESSMENT"
        if any(word in lower for word in ["what next", "next topic", "progress", "study plan", "roadmap"]):
            return "PATHWAY"
        if any(word in lower for word in ["hi", "hello", "hey"]):
            return "GENERAL"
        return "TUTORING"

    async def classify_intent(self, user_input: str) -> str:
        """
        Use LLM to classify the intent of the user input.
        """
        prompt = f"""
        Classify the user's intent into one of these categories:
        - TUTORING: Asking for explanation or help with a concept.
        - ASSESSMENT: Asking to be tested, for a quiz, or submitting an answer.
        - PATHWAY: Asking about what to learn next or progress.
        - HANDWRITING: Specifically mentioning handwritten notes or uploads.
        - GENERAL: Greeting or off-topic.

        User Input: "{user_input}"
        
        Return ONLY the category name.
        """
        intent = await self.llm.agenerate(prompt)
        normalized = (intent or "").strip().upper()
        if not normalized or is_provider_error(normalized):
            return self._heuristic_intent(user_input)
        if normalized not in self.VALID_INTENTS:
            return self._heuristic_intent(user_input)
        return normalized

    async def route_request(self, user_input: str, context: dict, learner_profile: dict = None):
        """
        Analyze input and delegate to appropriate agent.
        """
        # 1. Safety Check (Guardian)
        is_safe = self.guardian_agent.check_safety(user_input)
        if not is_safe:
            return {"status": "blocked", "detail": "Inappropriate content detected."}

        # 2. Intent Classification
        intent = await self.classify_intent(user_input)

        # 3. Routing
        if intent == "HANDWRITING" or context.get("type") == "handwriting_analysis":
            file_path = context.get("file_path")
            answer_key = context.get("answer_key")
            return self.handwriting_agent.analyze(file_path, answer_key)
        
        elif intent == "ASSESSMENT":
            topic = context.get("topic", "General")
            difficulty = context.get("difficulty", 0.5)
            return await self.assessment_agent.generate_question(
                topic,
                difficulty,
                context=context.get("profile_context", ""),
            )
        
        elif intent == "PATHWAY":
            return await self.pathway_agent.process_input(user_input, context)

        # Default to Tutor Agent for most interactions
        filters = context.get("filters") or {}
        subject_mode = infer_subject_mode(user_input, context.get("topic", ""), filters)
        topic = context.get("topic", "General")
        history = context.get("history", [])
        return await self.tutor_agent.generate_response(
            topic,
            user_input,
            history,
            learner_profile,
            profile_context=context.get("profile_context", ""),
            subject_mode=subject_mode,
            lesson_context=context.get("lesson_context"),
            assignment_context=context.get("assignment_context"),
            user_id=context.get("user_id"),
            session_id=context.get("session_id"),
            comprehension_signal=context.get("comprehension_signal"),
        )
