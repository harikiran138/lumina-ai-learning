import asyncio
import json
import re
from typing import Any, Dict, List, Optional

import httpx

from app.core.config import settings


_RETRYABLE_STATUS_CODES = {408, 409, 425, 429, 500, 502, 503, 504}


def infer_openrouter_complexity(prompt: str, system_prompt: Optional[str] = None) -> str:
    text = f"{prompt or ''} {system_prompt or ''}".lower()
    if len(text) > 2200:
        return "high"
    complex_markers = (
        "compare",
        "derive",
        "prove",
        "debug",
        "algorithm",
        "architecture",
        "analyze",
        "evaluate",
        "graph",
        "diagram",
    )
    if any(marker in text for marker in complex_markers):
        return "high"
    if len(text) > 700:
        return "medium"
    return "low"


def resolve_openrouter_models(
    feature: Optional[str] = None,
    prompt: str = "",
    system_prompt: Optional[str] = None,
) -> List[str]:
    complexity = infer_openrouter_complexity(prompt, system_prompt)
    simple_model = getattr(settings, "OPENROUTER_SIMPLE_MODEL", None) or settings.OPENROUTER_MODEL
    complex_model = getattr(settings, "OPENROUTER_COMPLEX_MODEL", None) or settings.OPENROUTER_MODEL
    fallback_model = getattr(settings, "OPENROUTER_FALLBACK_MODEL", None)

    tutor_like = {"tutor", "assessment", "search", "dashboard", "presentation", "onboarding", "content_gen", "ocr"}
    preferred = complex_model if complexity == "high" else simple_model
    if feature not in tutor_like and feature:
        preferred = settings.OPENROUTER_MODEL

    models: List[str] = []
    for candidate in (preferred, settings.OPENROUTER_MODEL, complex_model, simple_model, fallback_model):
        if candidate and candidate not in models:
            models.append(candidate)
    return models


def is_provider_error(exc: Exception) -> bool:
    if isinstance(exc, httpx.HTTPError):
        return True
    message = str(exc).lower()
    return any(token in message for token in ("openrouter", "gemini", "llm", "model", "api key"))


class _BaseLLMProvider:
    def __init__(self, model: str, timeout: Optional[httpx.Timeout] = None):
        connect_timeout = getattr(settings, "OPENROUTER_CONNECT_TIMEOUT", 5.0)
        read_timeout = getattr(settings, "OPENROUTER_READ_TIMEOUT", 45.0)
        self.model = model
        self.timeout = timeout or httpx.Timeout(
            connect=connect_timeout,
            read=read_timeout,
            write=read_timeout,
            pool=connect_timeout,
        )

    def _messages(self, prompt: str, system_prompt: Optional[str] = None) -> List[Dict[str, str]]:
        messages: List[Dict[str, str]] = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        return messages

    def generate(self, prompt: str, system_prompt: Optional[str] = None, **kwargs: Any) -> str:
        raise NotImplementedError

    async def agenerate(self, prompt: str, system_prompt: Optional[str] = None, **kwargs: Any) -> str:
        raise NotImplementedError


class OpenRouterProvider(_BaseLLMProvider):
    def __init__(self, model: Optional[str] = None, api_key: Optional[str] = None):
        resolved_model = model or settings.OPENROUTER_MODEL
        super().__init__(resolved_model)
        self.api_key = api_key or settings.OPENROUTER_API_KEY
        self.base_url = settings.OPENROUTER_API_URL

    def _headers(self) -> Dict[str, str]:
        if not self.api_key:
            raise RuntimeError("OPENROUTER_API_KEY is not configured")
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": getattr(settings, "OPENROUTER_SITE_URL", "https://lumina.local"),
            "X-Title": getattr(settings, "OPENROUTER_APP_NAME", "Lumina AI Learning"),
        }

    def _payload(self, prompt: str, system_prompt: Optional[str], **kwargs: Any) -> Dict[str, Any]:
        payload: Dict[str, Any] = {
            "model": kwargs.get("model") or self.model,
            "messages": self._messages(prompt, system_prompt),
            "temperature": kwargs.get("temperature", 0.35),
        }
        if kwargs.get("response_format"):
            payload["response_format"] = kwargs["response_format"]
        if kwargs.get("models"):
            payload["models"] = kwargs["models"]
        return payload

    @staticmethod
    def _extract_text(response_json: Dict[str, Any]) -> str:
        choices = response_json.get("choices") or []
        if not choices:
            raise RuntimeError(f"OpenRouter returned no choices: {response_json}")
        message = (choices[0] or {}).get("message") or {}
        content = message.get("content", "")
        if isinstance(content, list):
            parts = []
            for item in content:
                if isinstance(item, dict) and item.get("type") == "text":
                    parts.append(str(item.get("text", "")))
            content = "\n".join(parts)
        normalized = str(content or "").strip()
        if not normalized:
            raise RuntimeError("OpenRouter returned an empty response")
        return normalized

    def generate(self, prompt: str, system_prompt: Optional[str] = None, **kwargs: Any) -> str:
        payload = self._payload(prompt, system_prompt, **kwargs)
        with httpx.Client(timeout=self.timeout) as client:
            response = client.post(self.base_url, headers=self._headers(), json=payload)
            response.raise_for_status()
            return self._extract_text(response.json())

    async def agenerate(self, prompt: str, system_prompt: Optional[str] = None, **kwargs: Any) -> str:
        payload = self._payload(prompt, system_prompt, **kwargs)
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(self.base_url, headers=self._headers(), json=payload)
            response.raise_for_status()
            return self._extract_text(response.json())


class GeminiRestProvider(_BaseLLMProvider):
    def __init__(
        self,
        api_keys: Optional[List[str]] = None,
        model: str = "gemini-1.5-flash",
    ):
        super().__init__(model)
        provided_keys = [key for key in (api_keys or []) if key]
        self.api_keys = provided_keys or ([settings.ASSESSMENT_API_KEY] if settings.ASSESSMENT_API_KEY else [])

    def _direct_gemini_key(self) -> Optional[str]:
        for key in self.api_keys:
            if key and not key.startswith("sk-or-"):
                return key
        return None

    def _openrouter_key(self) -> Optional[str]:
        for key in self.api_keys:
            if key and key.startswith("sk-or-"):
                return key
        return settings.OPENROUTER_API_KEY

    def _gemini_contents(self, prompt: str, system_prompt: Optional[str] = None) -> Dict[str, Any]:
        merged_prompt = f"{system_prompt}\n\n{prompt}".strip() if system_prompt else prompt
        return {
            "contents": [
                {
                    "parts": [{"text": merged_prompt}],
                }
            ]
        }

    def generate(self, prompt: str, system_prompt: Optional[str] = None, **kwargs: Any) -> str:
        key = self._direct_gemini_key()
        if key:
            url = (
                "https://generativelanguage.googleapis.com/v1beta/models/"
                f"{self.model}:generateContent?key={key}"
            )
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(url, json=self._gemini_contents(prompt, system_prompt))
                response.raise_for_status()
                return _extract_gemini_text(response.json())

        openrouter_key = self._openrouter_key()
        provider = OpenRouterProvider(
            model=f"google/{self.model}" if "/" not in self.model else self.model,
            api_key=openrouter_key,
        )
        return provider.generate(prompt, system_prompt, **kwargs)

    async def agenerate(self, prompt: str, system_prompt: Optional[str] = None, **kwargs: Any) -> str:
        key = self._direct_gemini_key()
        if key:
            url = (
                "https://generativelanguage.googleapis.com/v1beta/models/"
                f"{self.model}:generateContent?key={key}"
            )
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, json=self._gemini_contents(prompt, system_prompt))
                response.raise_for_status()
                return _extract_gemini_text(response.json())

        openrouter_key = self._openrouter_key()
        provider = OpenRouterProvider(
            model=f"google/{self.model}" if "/" not in self.model else self.model,
            api_key=openrouter_key,
        )
        return await provider.agenerate(prompt, system_prompt, **kwargs)


def _extract_gemini_text(response_json: Dict[str, Any]) -> str:
    candidates = response_json.get("candidates") or []
    if not candidates:
        raise RuntimeError(f"Gemini returned no candidates: {response_json}")
    parts = ((candidates[0] or {}).get("content") or {}).get("parts") or []
    text = "\n".join(str(part.get("text", "")) for part in parts if isinstance(part, dict))
    normalized = text.strip()
    if not normalized:
        raise RuntimeError("Gemini returned an empty response")
    return normalized


def get_llm_provider(feature: Optional[str] = None, provider: Optional[str] = None, **kwargs: Any):
    requested = (provider or "auto").lower()
    models = resolve_openrouter_models(feature=feature, prompt=str(kwargs.get("prompt") or ""))

    if requested == "gemini":
        return GeminiRestProvider(model="gemini-1.5-flash")

    if requested == "ollama":
        # The repo no longer has a maintained Ollama adapter. Route through the
        # standard provider so callers still receive a working LLM instance.
        return OpenRouterProvider(model=models[0])

    if requested == "openrouter":
        return OpenRouterProvider(model=models[0])

    if feature == "assessment":
        return GeminiRestProvider(model="gemini-1.5-flash")

    return OpenRouterProvider(model=models[0])
