import google.generativeai as genai
from app.core.config import settings
from app.core.logging import structlog
from typing import List, Dict, Any, Optional

log = structlog.get_logger()

class AITutorStore:
    def __init__(self):
        if settings.ASSESSMENT_API_KEY:
            genai.configure(api_key=settings.ASSESSMENT_API_KEY)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            self.model = None
            log.warning("ai_tutor_no_api_key", message="GEMINI_API_KEY NOT SET")

    async def get_response(self, prompt: str, history: List[Dict] = None, context: Dict = None) -> str:
        if not self.model:
            return "I'm sorry, my AI processing unit is currently offline. Please contact the administrator."

        # Build system instruction based on context
        system_instruction = "You are Lumina, a friendly and helpful AI Tutor for the Lumina Learning Platform. "
        if context:
            course = context.get('course_name', 'your course')
            lesson = context.get('lesson_title', 'the current lesson')
            system_instruction += f"The student is currently studying '{lesson}' in the course '{course}'. "
        
        system_instruction += "Keep your answers educational, concise, and encouraging. Use simple analogies when explaining complex concepts."

        try:
            # Prepare chat
            chat = self.model.start_chat(history=history or [])
            
            # Combine system instruction with prompt if it's the first message
            full_prompt = prompt
            if not history:
                full_prompt = f"{system_instruction}\n\nStudent: {prompt}"

            response = await chat.send_message_async(full_prompt)
            return response.text
        except Exception as e:
            log.error("ai_tutor_response_failed", error=str(e))
            return "I encountered an error while thinking. Let me try that again in a moment."

    def format_history_for_gemini(self, messages: List[Dict]) -> List[Dict]:
        """
        Converts Lumina message format to Gemini history format.
        Lumina: [{'role': 'user'|'assistant', 'content': '...'}]
        Gemini: [{'role': 'user'|'model', 'parts': [{'text': '...'}]}]
        """
        gemini_history = []
        for msg in messages:
            role = 'user' if msg['role'] == 'user' else 'model'
            gemini_history.append({
                'role': role,
                'parts': [{'text': msg['content']}]
            })
        return gemini_history
