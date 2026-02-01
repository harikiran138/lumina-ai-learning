import sys
import os
import json
import asyncio

# Ensure backend modules are importable
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ai_engine.llm import get_llm_provider
from ai_engine.prompts import A2UI_SYSTEM_PROMPT


def call_api(prompt, options, context):
    """
    Adapter for Promptfoo to call our Python LLM logic.
    """
    try:
        provider = get_llm_provider("ollama")  # Use Ollama for cost-free testing

        # Run async generation in sync wrapper
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        response = loop.run_until_complete(
            provider.agenerate(prompt, system_prompt=A2UI_SYSTEM_PROMPT)
        )

        # Ensure strict JSON if needed, or just return text
        return {"output": response}
    except Exception as e:
        return {"error": str(e)}


if __name__ == "__main__":
    test_prompt = "Tell me about space."
    print(f"Testing Provider with prompt: {test_prompt}")
    res = call_api(test_prompt, {}, {})
    print(json.dumps(res, indent=2))
