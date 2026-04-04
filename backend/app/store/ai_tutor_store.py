import httpx
from app.core.config import settings
from app.core.logging import structlog
from typing import List, Dict, Any, Optional

log = structlog.get_logger()

class AITutorStore:
    def __init__(self):
        self.api_key = settings.OPENROUTER_API_KEY
        self.model = settings.OPENROUTER_MODEL
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"
        if not self.api_key:
            log.warning("ai_tutor_no_api_key", message="OPENROUTER_API_KEY NOT SET")

    async def get_response(self, prompt: str, history: List[Dict] = None, context: Dict = None) -> str:
        if not self.api_key:
            return "I'm sorry, my AI processing unit is currently offline. Please contact the administrator."

        # Build system instruction based on context
        system_instruction = "You are Lumina, a friendly and helpful AI Tutor for the Lumina Learning Platform. "
        if context:
            course = context.get('course_name', 'your course')
            lesson = context.get('lesson_title', 'the current lesson')
            system_instruction += f"The student is currently studying '{lesson}' in the course '{course}'. "
        
        system_instruction += "Keep your answers educational, concise, and encouraging. Use simple analogies when explaining complex concepts."

        # Prepare messages in OpenAI format
        messages = [{"role": "system", "content": system_instruction}]
        if history:
            messages.extend(self.format_history_for_openrouter(history))
        messages.append({"role": "user", "content": prompt})

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://lumina.learning", # Optional but recommended by OpenRouter
                    "X-Title": "Lumina Learning Platform"
                }
                payload = {
                    "model": self.model,
                    "messages": messages,
                    "temperature": 0.7,
                }
                response = await client.post(self.base_url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"]
        except Exception as e:
            log.error("ai_tutor_response_failed", error=str(e))
            return "I encountered an error while thinking. Let me try that again in a moment."

    def format_history_for_openrouter(self, messages: List[Dict]) -> List[Dict]:
        """
        Converts Lumina message format to OpenRouter (OpenAI) history format.
        Lumina: [{'role': 'user'|'assistant'|'model', 'content': '...'}]
        OpenRouter: [{'role': 'user'|'assistant', 'content': '...'}]
        """
        formatted_history = []
        for msg in messages:
            # Map roles: 'model' or 'assistant' -> 'assistant'
            role = 'user' if msg['role'] == 'user' else 'assistant'
            formatted_history.append({
                'role': role,
                'content': msg['content']
            })
        return formatted_history
