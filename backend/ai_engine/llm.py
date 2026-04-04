import os
import time
from typing import List, Optional

import requests
import structlog
from starlette.concurrency import run_in_threadpool

from app.core.config import settings

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
            "timed out",
            "not found",
            "api key not valid",
            "invalid openrouter api key",
            "rate limit exceeded",
            "permission denied",
        ]
    )


def _truncate_for_log(value: str, limit: int = 300) -> str:
    if value is None:
        return ""
    text = str(value).strip()
    if len(text) <= limit:
        return text
    return text[:limit] + "...[truncated]"


def _extract_openrouter_content(payload: dict) -> str:
    choices = payload.get("choices")
    if not isinstance(choices, list) or not choices:
        return ""

    message = choices[0].get("message") or {}
    content = message.get("content")

    if isinstance(content, str):
        return content

    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, dict) and item.get("type") == "text":
                parts.append(str(item.get("text", "")))
            elif isinstance(item, str):
                parts.append(item)
        return "".join(parts).strip()

    return ""


def infer_openrouter_complexity(prompt: str, system_prompt: str = "") -> str:
    combined = f"{system_prompt}\n{prompt}".lower()
    complex_markers = [
        "step-by-step",
        "step by step",
        "multi-step",
        "multi step",
        "compare",
        "why",
        "how does",
        "analyze",
        "derive",
        "prove",
        "debug",
        "algorithm",
        "code",
        "implement",
        "socratic",
        "history:",
        "persistent memory",
        "lesson context",
        "assignment context",
        "a2ui",
        "json format",
    ]
    if len(prompt) > 500 or len(system_prompt) > 1200:
        return "complex"
    if any(marker in combined for marker in complex_markers):
        return "complex"
    return "simple"


def resolve_openrouter_models(
    feature: str | None,
    prompt: str,
    system_prompt: str = "",
    explicit_model: str | None = None,
    fallback_models: Optional[List[str]] = None,
) -> List[str]:
    models: list[str] = []

    if explicit_model:
        models.append(explicit_model)
    elif feature == "tutor":
        if infer_openrouter_complexity(prompt, system_prompt) == "complex":
            models.append(settings.OPENROUTER_COMPLEX_MODEL)
            models.append(settings.OPENROUTER_SIMPLE_MODEL)
        else:
            models.append(settings.OPENROUTER_SIMPLE_MODEL)
            models.append(settings.OPENROUTER_COMPLEX_MODEL)
    elif feature in {"assessment", "code", "validation", "presentation"}:
        models.append(settings.OPENROUTER_COMPLEX_MODEL)
    else:
        models.append(settings.OPENROUTER_MODEL)

    models.extend(fallback_models or [])
    models.append(settings.OPENROUTER_FALLBACK_MODEL)

    seen: set[str] = set()
    deduped: list[str] = []
    for model in models:
        if not model or model in seen:
            continue
        seen.add(model)
        deduped.append(model)
    return deduped or ["openrouter/auto"]


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
    RETRYABLE_STATUS_CODES = {408, 409, 429, 500, 502, 503, 504}

class OpenRouterProvider(LLMProvider):
    RETRYABLE_STATUS_CODES = {408, 409, 429, 500, 502, 503, 504}

    def __init__(
        self,
        api_key: str,
        model: str | None = None,
        feature: str | None = None,
        fallback_models: Optional[List[str]] = None,
    ):
        self.api_key = api_key
        self.model = model
        self.feature = feature
        self.fallback_models = fallback_models or []
        self.session = requests.Session()
        self.connect_timeout = settings.OPENROUTER_CONNECT_TIMEOUT
        self.read_timeout = settings.OPENROUTER_READ_TIMEOUT
        self.max_retries = settings.OPENROUTER_MAX_RETRIES
        self.site_url = os.getenv("OPENROUTER_SITE_URL", "https://lumina-ai-learning.vercel.app")
        self.site_name = os.getenv("OPENROUTER_SITE_NAME", "Lumina AI Learning Platform")

    def _build_headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": self.site_url,
            "X-Title": self.site_name,
        }

    def generate(self, prompt: str, system_prompt: str = "") -> str:
        route_models = resolve_openrouter_models(
            self.feature,
            prompt,
            system_prompt=system_prompt,
            explicit_model=self.model,
            fallback_models=self.fallback_models,
        )

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": route_models[0],
            "messages": messages,
            "temperature": 0.4 if self.feature == "tutor" else 0.7,
        }
        if len(route_models) > 1:
            payload["models"] = route_models

        headers = self._build_headers()
        last_error = "Unknown OpenRouter error"
        started_at = time.perf_counter()

        logger.info(
            "openrouter_request",
            feature=self.feature or "generic",
            model=payload["model"],
            models=route_models,
            url=settings.OPENROUTER_API_URL,
            prompt_preview=_truncate_for_log(prompt, 180),
            system_prompt_preview=_truncate_for_log(system_prompt, 180),
        )

        for attempt in range(self.max_retries + 1):
            try:
                response = self.session.post(
                    settings.OPENROUTER_API_URL,
                    json=payload,
                    headers=headers,
                    timeout=(self.connect_timeout, self.read_timeout),
                )

                if response.status_code == 401:
                    logger.error("openrouter_auth_error", feature=self.feature or "generic", status=401)
                    return "Error generating content: Invalid OpenRouter API key (401)."

                if response.status_code in self.RETRYABLE_STATUS_CODES:
                    last_error = f"OpenRouter returned {response.status_code}: {_truncate_for_log(response.text, 180)}"
                    logger.warning("openrouter_retryable_error", attempt=attempt + 1, feature=self.feature or "generic", status=response.status_code, error=last_error)
                    if attempt < self.max_retries:
                        time.sleep(0.5 * (attempt + 1))
                        continue
                    break

                response.raise_for_status()
                data = response.json()
                content = _extract_openrouter_content(data)
                if not content:
                    last_error = "OpenRouter returned an empty completion."
                    break

                logger.info(
                    "openrouter_response",
                    feature=self.feature or "generic",
                    resolved_model=data.get("model") or payload["model"],
                    latency_ms=round((time.perf_counter() - started_at) * 1000, 2),
                    response_preview=_truncate_for_log(content, 220),
                )
                return content

            except requests.exceptions.Timeout:
                last_error = "OpenRouter request timed out."
                if attempt < self.max_retries:
                    continue
                break
            except Exception as exc:
                last_error = str(exc)
                if attempt < self.max_retries:
                    continue
                break

        return f"Error generating content: {last_error}"

    async def agenerate(self, prompt: str, system_prompt: str = "") -> str:
        return await run_in_threadpool(self.generate, prompt, system_prompt)


# Robust Multi-Model Feature Map
FEATURE_MODEL_MAP = {
    "onboarding": [settings.OPENROUTER_SIMPLE_MODEL, settings.OPENROUTER_FALLBACK_MODEL],
    "dashboard": [settings.OPENROUTER_SIMPLE_MODEL, settings.OPENROUTER_FALLBACK_MODEL],
    "code": [settings.OPENROUTER_COMPLEX_MODEL, settings.OPENROUTER_FALLBACK_MODEL],
    "validation": [settings.OPENROUTER_COMPLEX_MODEL, settings.OPENROUTER_FALLBACK_MODEL],
    "fast": [settings.OPENROUTER_SIMPLE_MODEL, settings.OPENROUTER_FALLBACK_MODEL],
    "rag": [settings.OPENROUTER_COMPLEX_MODEL, settings.OPENROUTER_FALLBACK_MODEL],
    "vision": [settings.OPENROUTER_COMPLEX_MODEL, settings.OPENROUTER_FALLBACK_MODEL],
    "assessment": [settings.OPENROUTER_COMPLEX_MODEL, settings.OPENROUTER_FALLBACK_MODEL],
    "presentation": [settings.OPENROUTER_COMPLEX_MODEL, settings.OPENROUTER_FALLBACK_MODEL],
}


class ResilientOpenRouterProvider(LLMProvider):
    def __init__(self, api_key: str, feature: str, models: List[str]):
        self.api_key = api_key
        self.feature = feature
        self.models = models

    def generate(self, prompt: str, system_prompt: str = "") -> str:
        provider = OpenRouterProvider(
            self.api_key,
            model=self.models[0] if self.models else settings.OPENROUTER_MODEL,
            feature=self.feature,
            fallback_models=self.models[1:],
        )
        response = provider.generate(prompt, system_prompt)
        if response and not is_provider_error(response):
            logger.info("llm_success", feature=self.feature, models=self.models)
            return response
        logger.warning("llm_failed", feature=self.feature, models=self.models, error=response)
        return response


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
        if feature == "tutor":
            providers.append(OpenRouterProvider(openrouter_key, feature=feature))
        elif feature and feature in FEATURE_MODEL_MAP:
            models = FEATURE_MODEL_MAP[feature]
            providers.append(ResilientOpenRouterProvider(openrouter_key, feature, models))
        else:
            # Fallback for generic calls
            providers.append(OpenRouterProvider(openrouter_key, feature=feature))

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
