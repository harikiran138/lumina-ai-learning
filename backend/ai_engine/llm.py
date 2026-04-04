import requests
import os
import structlog
from starlette.concurrency import run_in_threadpool
from typing import List, Optional

logger = structlog.get_logger()


def _parse_ollama_think(value):
    if value is None:
        return False

    normalized = str(value).strip().lower()
    if normalized in {"low", "medium", "high"}:
        return normalized
    return normalized in {"1", "true", "yes", "on"}


def is_provider_error(text: str) -> bool:
    if not text:
        return True
    lowered = text.lower()
    return any(
        marker in lowered
        for marker in [
            "error generating content",
            "connection refused",
            "failed to establish a new connection",
            "max retries exceeded",
            "read timed out",
            "not found",
            "api key not valid",
            "permission denied",
        ]
    )


class LLMProvider:
    def generate(self, prompt: str, system_prompt: str = "") -> str:
        raise NotImplementedError

    async def agenerate(self, prompt: str, system_prompt: str = "") -> str:
        return await run_in_threadpool(self.generate, prompt, system_prompt)


class OllamaProvider(LLMProvider):
    def __init__(self, model: str = None, host: str = None):
        self.model = model or os.getenv("OLLAMA_MODEL", "qwen2.5:1.5b")
        # Default to localhost for local dev, Docker internal for containers
        self.host = host or os.getenv("OLLAMA_HOST", "http://localhost:11434")
        self.connect_timeout = float(os.getenv("OLLAMA_CONNECT_TIMEOUT", "5"))
        self.read_timeout = float(os.getenv("OLLAMA_READ_TIMEOUT", "60"))
        self.health_timeout = float(os.getenv("OLLAMA_HEALTH_TIMEOUT", "2"))
        self.keep_alive = os.getenv("OLLAMA_KEEP_ALIVE", "15m")
        self.num_ctx = int(os.getenv("OLLAMA_NUM_CTX", "8192"))
        self.think = _parse_ollama_think(os.getenv("OLLAMA_THINK"))

    def is_healthy(self) -> bool:
        try:
            response = requests.get(
                f"{self.host}/api/tags",
                timeout=(self.health_timeout, self.health_timeout),
            )
            return response.ok
        except requests.exceptions.RequestException:
            return False

    def generate(self, prompt: str, system_prompt: str = "") -> str:
        if not self.is_healthy():
            logger.warning("ollama_unavailable", host=self.host)
            return "Error generating content: Ollama is unavailable."

        url = f"{self.host}/api/generate"

        # [FIX] Hard Truncation to prevent overflow (Safety Net)
        # Limit to ~6000 tokens (approx 24000 chars) to stay under 8192 limit
        user_prompt = prompt
        if len(user_prompt) > 24000:
            user_prompt = user_prompt[:24000] + "...\n[TRUNCATED]"

        payload = {
            "model": self.model,
            "prompt": user_prompt,
            "stream": False,
            "think": self.think,
            "keep_alive": self.keep_alive,
            "options": {
                "temperature": 0.7,
                "num_ctx": self.num_ctx,
            },
        }
        if system_prompt:
            payload["system"] = system_prompt

        try:
            response = requests.post(
                url,
                json=payload,
                timeout=(self.connect_timeout, self.read_timeout),
            )
            response.raise_for_status()
            data = response.json()
            return data.get("response", "")
        except requests.exceptions.RequestException as e:
            logger.error("ollama_error", error=str(e))
            return f"Error generating content: {str(e)}"


class GeminiRestProvider(LLMProvider):
    def __init__(self, api_keys: list, model: str = "gemini-1.5-flash"):
        self.api_keys = api_keys
        self.model = model
        self.current_key_index = 0
        # [OPTIMIZATION] Reuse TCP connections
        self.session = requests.Session()
        self.connect_timeout = float(os.getenv("GEMINI_CONNECT_TIMEOUT", "5"))
        self.read_timeout = float(os.getenv("GEMINI_READ_TIMEOUT", "20"))

    def _get_url(self, key):
        return f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={key}"

    def generate(self, prompt: str, system_prompt: str = "") -> str:
        full_prompt = prompt
        if system_prompt:
            full_prompt = f"System Instruction: {system_prompt}\n\nTask: {prompt}"

        payload = {"contents": [{"parts": [{"text": full_prompt}]}]}

        # Try keys with rotation and failover
        attempts = 0
        max_attempts = len(self.api_keys) * 2  # Allow retries across keys

        last_error = None

        while attempts < max_attempts:
            current_key = self.api_keys[self.current_key_index]
            url = self._get_url(current_key)

            try:
                # Rotate for next call immediately (Round Robin)
                self.current_key_index = (self.current_key_index + 1) % len(self.api_keys)

                response = self.session.post(
                    url,
                    json=payload,
                    headers={"Content-Type": "application/json"},
                    timeout=(self.connect_timeout, self.read_timeout),
                )

                # Check for Rate Limit (429) specifically
                if response.status_code == 429:
                    logger.warning("gemini_rate_limit", key_suffix=current_key[-4:])
                    attempts += 1
                    continue  # Try next key in loop

                response.raise_for_status()
                data = response.json()

                if "candidates" in data and data["candidates"]:
                    return data["candidates"][0]["content"]["parts"][0]["text"]
                return ""

            except Exception as e:
                logger.error("gemini_rest_error", key_suffix=current_key[-4:], error=str(e))
                last_error = e
                attempts += 1

        return f"Error generating content after retries: {str(last_error)}"


class OpenRouterProvider(LLMProvider):
    def __init__(self, api_key: str, model: str = "openrouter/auto"):
        self.api_key = api_key
        self.model = model
        self.session = requests.Session()
        self.connect_timeout = float(os.getenv("OPENROUTER_CONNECT_TIMEOUT", "5"))
        self.read_timeout = float(os.getenv("OPENROUTER_READ_TIMEOUT", "45"))

    def generate(self, prompt: str, system_prompt: str = "") -> str:
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://lumina-ai.learning",
            "X-Title": "Lumina AI Learning"
        }

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.7
        }

        try:
            response = self.session.post(
                url,
                json=payload,
                headers=headers,
                timeout=(self.connect_timeout, self.read_timeout)
            )
            if response.status_code == 429:
                return "Error (429): Rate Limit Exceeded"
            response.raise_for_status()
            data = response.json()
            if "choices" in data and data["choices"]:
                content = data["choices"][0]["message"]["content"]
                if content:
                    return content
            return "Error: Empty response from provider"
        except Exception as e:
            return f"Error: {str(e)}"


# Robust Multi-Model Feature Map
FEATURE_MODEL_MAP = {
    "onboarding": ["arcee-ai/trinity-large-preview:free", "openrouter/auto"],
    "dashboard":  ["arcee-ai/trinity-large-preview:free", "openrouter/auto"],
    "code":       ["qwen/qwen3-coder-480b:free", "deepseek/deepseek-r1:free", "openrouter/auto"],
    "validation": ["deepseek/deepseek-r1:free", "mistralai/mistral-small-3:free", "openrouter/auto"],
    "fast":       ["nvidia/nemotron-3-nano-30b-a3b:free", "openrouter/auto"],
    "rag":        ["mistralai/mistral-small-3:free", "openrouter/auto"],
    "vision":     ["qwen/qwen-vl:free", "openrouter/auto"],
}


class ResilientOpenRouterProvider(LLMProvider):
    def __init__(self, api_key: str, feature: str, models: List[str]):
        self.api_key = api_key
        self.feature = feature
        self.models = models

    def generate(self, prompt: str, system_prompt: str = "") -> str:
        last_error = "All models failed."
        
        for model in self.models:
            provider = OpenRouterProvider(self.api_key, model=model)
            logger.info("llm_attempt", feature=self.feature, model=model)
            
            # Internal retry for transient errors (max 2 attempts per model)
            for attempt in range(2):
                try:
                    response = provider.generate(prompt, system_prompt)
                    if response and not is_provider_error(response):
                        logger.info("llm_success", feature=self.feature, model=model, attempt=attempt+1)
                        return response
                    
                    last_error = response
                    logger.warning("llm_retry", feature=self.feature, model=model, attempt=attempt+1, error=response)
                except Exception as e:
                    last_error = str(e)
                    logger.error("llm_exception", feature=self.feature, model=model, attempt=attempt+1, error=str(e))
        
        return f"Error generating content: {last_error}"


class CompositeLLMProvider(LLMProvider):
    def __init__(self, providers: List[LLMProvider]):
        self.providers = [p for p in providers if p is not None]

    def generate(self, prompt: str, system_prompt: str = "") -> str:
        last_error = "No provider available."

        for provider in self.providers:
            try:
                response = provider.generate(prompt, system_prompt)
                if response and not is_provider_error(response):
                    return response
                if response:
                    last_error = response
            except Exception as exc:
                last_error = str(exc)

        return f"Error generating content: {last_error}"


def get_llm_provider(feature: str = None, provider: str = "auto") -> LLMProvider:
    # Check Environment Variable Override (for testing/debugging)
    env_provider = os.getenv("LLM_PROVIDER")
    if env_provider:
        provider = env_provider.lower()

    # Gather Keys
    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    
    gemini_keys = []
    if os.getenv("GEMINI_API_KEY"):
        gemini_keys.append(os.getenv("GEMINI_API_KEY"))
    if os.getenv("GEMINI_API_KEY_SECONDARY"):
        gemini_keys.append(os.getenv("GEMINI_API_KEY_SECONDARY"))

    providers = []

    # 1. OpenRouter (Primary Strategy: Resilient Feature-based)
    if openrouter_key and provider in {"auto", "openrouter"}:
        if feature and feature in FEATURE_MODEL_MAP:
            models = FEATURE_MODEL_MAP[feature]
            providers.append(ResilientOpenRouterProvider(openrouter_key, feature, models))
        else:
            # Fallback for generic calls
            providers.append(OpenRouterProvider(openrouter_key, model="openrouter/auto"))

    # 2. Gemini (Secondary Fallback Chain)
    if gemini_keys and provider in {"auto", "gemini"}:
        providers.append(GeminiRestProvider(api_keys=gemini_keys))

    # 3. Ollama (Final Local Safety Net)
    if provider in {"auto", "ollama", "local"}:
        providers.append(OllamaProvider())

    if not providers:
        logger.warning("no_providers_found_falling_back_to_ollama")
        return OllamaProvider()

    if len(providers) == 1:
        return providers[0]

    return CompositeLLMProvider(providers)
