from .handwriting_agent import HandwritingAgent
from .tutor import TutorAgent
from .assessment import AssessmentAgent
from .intervention import InterventionAgent
from .guardian import GuardianAgent
from .pathway import PathwayAgent
from ai_engine.llm import get_llm_provider

class Orchestrator:
    """
    Master Agent that routes user intent to specialized agents.
    """

    def __init__(self):
        self.handwriting_agent = HandwritingAgent()
        self.tutor_agent = TutorAgent()
        self.assessment_agent = AssessmentAgent()
        self.intervention_agent = InterventionAgent()
        self.guardian_agent = GuardianAgent()
        self.pathway_agent = PathwayAgent()
        self.llm = get_llm_provider()

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
        return intent.strip().upper()

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
            return self.assessment_agent.generate_question(topic, difficulty)
        
        elif intent == "PATHWAY":
            return self.pathway_agent.process_input(user_input, context)

        # Default to Tutor Agent for most interactions
        topic = context.get("topic", "General")
        history = context.get("history", [])
        return await self.tutor_agent.generate_response(topic, user_input, history, learner_profile)
