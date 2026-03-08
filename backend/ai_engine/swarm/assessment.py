import json
from ai_engine.llm import get_llm_provider
from ai_engine.rag import get_rag_engine

class AssessmentAgent:
    """
    Dynamic Quiz and Test Generator Agent.
    Adapts difficulty based on learner performance.
    """

    def __init__(self):
        self.llm = get_llm_provider()
        self.rag = get_rag_engine()

    async def generate_question(self, topic: str, difficulty: float, context: str = "") -> dict:
        """
        Generate a quiz question with adaptive difficulty.
        Difficulty scale: 0.0 (very easy) to 1.0 (very hard)
        """
        # 1. RAG Retrieval if no context provided
        if not context:
            docs = self.rag.query(topic, n_results=2)
            context = "\n".join(docs)

        # 2. Difficulty label
        diff_label = "Easy"
        if difficulty > 0.7: diff_label = "Hard"
        elif difficulty > 0.4: diff_label = "Intermediate"

        # 3. Prompt for question generation
        prompt = f"""
        Generate a {diff_label} quiz question about {topic}.
        Use the following context from course materials:
        {context}

        The question should be in JSON format:
        {{
            "question": "The question text",
            "options": ["Choice A", "Choice B", "Choice C", "Choice D"],
            "correct_index": 0,
            "explanation": "Why the answer is correct",
            "difficulty": {difficulty}
        }}
        """

        response_str = await self.llm.agenerate(prompt)
        
        # Parse JSON
        if "```json" in response_str:
            response_str = response_str.split("```json")[1].split("```")[0].strip()
        elif "```" in response_str:
            response_str = response_str.split("```")[1].split("```")[0].strip()

        try:
            return json.loads(response_str)
        except Exception as e:
            print(f"Failed to generate assessment question: {e}")
            return {
                "question": f"Self-assessment question about {topic}",
                "options": ["I understand it well", "I need more practice", "I'm confused", "I'm lost"],
                "correct_index": 0,
                "explanation": "Self-reflection is key to learning."
            }
