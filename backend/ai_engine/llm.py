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
    def __init__(self, model: str = "mannix/llama3.1-8b-abliterated:latest", host: str = None):
        self.model = model
        self.host = host or os.getenv("OLLAMA_HOST", "http://host.docker.internal:11434")

    def generate(self, prompt: str, system_prompt: str = "") -> str:
        url = f"{self.host}/api/generate"
        
        full_prompt = prompt
        if system_prompt:
            full_prompt = f"System: {system_prompt}\n\nUser: {prompt}"
            
        # [FIX] Hard Truncation to prevent overflow (Safety Net)
        # Limit to ~6000 tokens (approx 24000 chars) to stay under 8192 limit
        if len(full_prompt) > 24000:
            full_prompt = full_prompt[:24000] + "...\n[TRUNCATED]"

        payload = {
            "model": self.model,
            "prompt": full_prompt,
            "stream": False,
            "options": {
                "temperature": 0.7,
                "num_ctx": 8192 # [FIX] Increase context window to handle large RAG prompts
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
class GeminiRestProvider(LLMProvider):
    def __init__(self, api_keys: list, model: str = "gemini-flash-latest"):
        self.api_keys = api_keys
        self.model = model
        self.current_key_index = 0
        # [OPTIMIZATION] Reuse TCP connections
        self.session = requests.Session()

    def _get_url(self, key):
        return f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={key}"

    def generate(self, prompt: str, system_prompt: str = "") -> str:
        full_prompt = prompt
        if system_prompt:
             full_prompt = f"System Instruction: {system_prompt}\n\nTask: {prompt}"

        payload = {
            "contents": [{
                "parts": [{"text": full_prompt}]
            }]
        }

        # Try keys with rotation and failover
        attempts = 0
        max_attempts = len(self.api_keys) * 2 # Allow retries across keys
        
        last_error = None

        while attempts < max_attempts:
            current_key = self.api_keys[self.current_key_index]
            url = self._get_url(current_key)
            
            try:
                # Rotate for next call immediately (Round Robin)
                self.current_key_index = (self.current_key_index + 1) % len(self.api_keys)
                
                response = self.session.post(url, json=payload, headers={"Content-Type": "application/json"})
                
                # Check for Rate Limit (429) specifically
                if response.status_code == 429:
                    print(f"Gemini Rate Limit on Key ending in ...{current_key[-4:]}. Switching...")
                    attempts += 1
                    continue # Try next key in loop

                response.raise_for_status()
                data = response.json()
                
                if "candidates" in data and data["candidates"]:
                    return data["candidates"][0]["content"]["parts"][0]["text"]
                return ""

            except Exception as e:
                print(f"Gemini REST Error (Key ...{current_key[-4:]}): {e}")
                last_error = e
                attempts += 1
        
        return f"Error generating content after retries: {str(last_error)}"

def get_llm_provider(provider: str = "auto") -> LLMProvider:
    # Explicit provider selection
    if provider == "ollama":
        return OllamaProvider()
    
    # Auto mode or explicit gemini checks
    if provider == "gemini" or provider == "auto":
        keys = []
        
        # Primary Key
        key1 = os.getenv("GEMINI_API_KEY")
        if key1: keys.append(key1)
        
        # Secondary Key
        key2 = os.getenv("GEMINI_API_KEY_SECONDARY")
        if key2: keys.append(key2)
        
        if keys:
            return GeminiRestProvider(api_keys=keys)
        
    # Fallback to Ollama if auto and no key, or default
    print("Warning: No Gemini API Key found. Falling back to Ollama.")
    return OllamaProvider()
