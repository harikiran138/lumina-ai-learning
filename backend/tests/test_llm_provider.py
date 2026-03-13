from unittest.mock import MagicMock, patch

from ai_engine.llm import OllamaProvider


def _mock_ollama_response(text="LOCAL LLM OK"):
    response = MagicMock()
    response.raise_for_status.return_value = None
    response.json.return_value = {"response": text}
    return response


def test_ollama_provider_uses_local_safe_defaults(monkeypatch):
    for key in [
        "OLLAMA_MODEL",
        "OLLAMA_KEEP_ALIVE",
        "OLLAMA_NUM_CTX",
        "OLLAMA_THINK",
        "OLLAMA_CONNECT_TIMEOUT",
        "OLLAMA_READ_TIMEOUT",
    ]:
        monkeypatch.delenv(key, raising=False)

    with patch("ai_engine.llm.requests.get", return_value=MagicMock(ok=True)):
        with patch(
            "ai_engine.llm.requests.post",
            return_value=_mock_ollama_response(),
        ) as mock_post:
            provider = OllamaProvider()
            result = provider.generate(
                "Reply with exactly: LOCAL LLM OK",
                "Keep the reply short.",
            )

    assert result == "LOCAL LLM OK"
    payload = mock_post.call_args.kwargs["json"]
    assert payload["model"] == "qwen2.5:1.5b"
    assert payload["system"] == "Keep the reply short."
    assert payload["think"] is False
    assert payload["keep_alive"] == "15m"
    assert payload["options"]["num_ctx"] == 8192
    assert mock_post.call_args.kwargs["timeout"] == (5.0, 60.0)


def test_ollama_provider_respects_env_overrides(monkeypatch):
    monkeypatch.setenv("OLLAMA_MODEL", "qwen2.5:1.5b")
    monkeypatch.setenv("OLLAMA_KEEP_ALIVE", "30m")
    monkeypatch.setenv("OLLAMA_NUM_CTX", "4096")
    monkeypatch.setenv("OLLAMA_THINK", "high")

    with patch("ai_engine.llm.requests.get", return_value=MagicMock(ok=True)):
        with patch(
            "ai_engine.llm.requests.post",
            return_value=_mock_ollama_response("override ok"),
        ) as mock_post:
            provider = OllamaProvider()
            result = provider.generate("Reply with exactly: override ok")

    assert result == "override ok"
    payload = mock_post.call_args.kwargs["json"]
    assert payload["model"] == "qwen2.5:1.5b"
    assert payload["think"] == "high"
    assert payload["keep_alive"] == "30m"
    assert payload["options"]["num_ctx"] == 4096
