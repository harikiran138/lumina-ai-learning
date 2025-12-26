import requests
import json
import os
from typing import Dict, Any, Optional
from starlette.concurrency import run_in_threadpool

class LLMProvider:
    def generate(self, prompt: str, system_prompt: str = "") -> str:
        raise NotImplementedError

    async def agenerate(self, prompt: str, system_prompt: str = "") -> str:
        return await run_in_threadpool(self.generate, prompt, system_prompt)

class OllamaProvider(LLMProvider):
    def __init__(self, model: str = "llama3", host: str = "http://localhost:11434"):
        self.model = model
        self.host = host

    def generate(self, prompt: str, system_prompt: str = "") -> str:
        url = f"{self.host}/api/generate"
        
        full_prompt = prompt
        if system_prompt:
            full_prompt = f"System: {system_prompt}\n\nUser: {prompt}"

        payload = {
            "model": self.model,
            "prompt": full_prompt,
            "stream": False,
            "options": {
                "temperature": 0.7
            }
        }

        try:
            response = requests.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            return data.get("response", "")
        except requests.exceptions.RequestException as e:
            print(f"Ollama Error: {e}")
            return f"Error generating content: {str(e)}"

# Factory
class GeminiProvider(LLMProvider):
    def __init__(self, api_key: str, model: str = "gemini-pro"):
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(model)

    def generate(self, prompt: str, system_prompt: str = "") -> str:
        # Gemini Pro doesn't strictly separate system prompt in the simplest API, 
        # but we can prepend it.
        full_prompt = prompt
        if system_prompt:
            full_prompt = f"System Instruction: {system_prompt}\n\nTask: {prompt}"
            
        try:
            response = self.model.generate_content(full_prompt)
            return response.text
        except Exception as e:
            print(f"Gemini Error: {e}")
            return f"Error generating content: {str(e)}"

def get_llm_provider(provider: str = "auto") -> LLMProvider:
    # Explicit provider selection
    if provider == "ollama":
        return OllamaProvider()
    
    # Auto mode or explicit gemini checks
    if provider == "gemini" or provider == "auto":
        gemini_key = os.getenv("GEMINI_API_KEY")
        if gemini_key:
            return GeminiProvider(api_key=gemini_key)
        
    # Fallback to Ollama if auto and no key, or default
    return OllamaProvider()
