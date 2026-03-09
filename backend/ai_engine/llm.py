import requests
import os
from starlette.concurrency import run_in_threadpool


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
    def __init__(self, model: str = "qwen3.5:2b", host: str = None):
        self.model = model
        # Default to localhost for local dev, Docker internal for containers
        self.host = host or os.getenv("OLLAMA_HOST", "http://localhost:11434")
        self.connect_timeout = float(os.getenv("OLLAMA_CONNECT_TIMEOUT", "2"))
        self.read_timeout = float(os.getenv("OLLAMA_READ_TIMEOUT", "12"))
        self.health_timeout = float(os.getenv("OLLAMA_HEALTH_TIMEOUT", "2"))

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
            return "Error generating content: Ollama is unavailable."

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
                "num_ctx": 262144,  # [FIX] Increase context window for Qwen 3.5 (256K)
            },
        }

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
            print(f"Ollama Error: {e}")
            return f"Error generating content: {str(e)}"


# Factory
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
                    print(f"Gemini Rate Limit on Key ending in ...{current_key[-4:]}. Switching...")
                    attempts += 1
                    continue  # Try next key in loop

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


class CompositeLLMProvider(LLMProvider):
    def __init__(self, providers):
        self.providers = [provider for provider in providers if provider is not None]

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


def get_llm_provider(provider: str = "auto") -> LLMProvider:
    # Check Environment Variable Override
    env_provider = os.getenv("LLM_PROVIDER")
    if env_provider:
        provider = env_provider.lower()

    keys = []
    key1 = os.getenv("GEMINI_API_KEY")
    if key1:
        keys.append(key1)
    key2 = os.getenv("GEMINI_API_KEY_SECONDARY")
    if key2:
        keys.append(key2)

    gemini_provider = GeminiRestProvider(api_keys=keys) if keys else None
    ollama_provider = OllamaProvider()

    if provider in {"lumina", "local"}:
        provider = "ollama"

    if provider == "gemini":
        return CompositeLLMProvider([gemini_provider, ollama_provider])

    if provider == "ollama":
        return ollama_provider

    if provider == "auto":
        # Prefer Gemini when a key is configured, but fall back to Ollama
        # transparently if the key is invalid or the API call fails.
        return CompositeLLMProvider([gemini_provider, ollama_provider])

    print("Warning: Falling back to auto provider chain.")
    return CompositeLLMProvider([gemini_provider, ollama_provider])
