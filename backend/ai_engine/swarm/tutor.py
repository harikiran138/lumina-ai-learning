import json
from ai_engine.llm import get_llm_provider
from ai_engine.rag import get_rag_engine
from ai_engine.prompts import A2UI_SYSTEM_PROMPT

class TutorAgent:
    """
    Socratic Dialogue Agent for explaining concepts and scaffolding learning.
    """

    def __init__(self):
        self.llm = get_llm_provider()
        self.rag = get_rag_engine()

    async def generate_response(self, topic: str, user_query: str, history: list, learner_profile: dict = None) -> dict:
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
        
        User Query: {user_query}
        History: {history}
        
        Generate a pedagogical response following the A2UI JSON format.
        """

        response_str = await self.llm.agenerate(prompt, system_prompt=system_prompt)
        
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
