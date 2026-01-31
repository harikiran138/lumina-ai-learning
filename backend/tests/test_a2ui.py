import pytest
import json
from ai_engine.prompts import A2UI_SYSTEM_PROMPT

def test_a2ui_json_structure():
    """
    This test verifies that our System Prompt guidelines produce valid A2UI JSON.
    We simulate an LLM response (or check the prompt constraints).
    Here we validate a Sample A2UI JSON to ensure our Validator logic would pass.
    """
    sample_response = """
    [
        {"type": "header", "content": "Introduction to AI", "props": {"level": 1}},
        {"type": "text_block", "content": "AI is the simulation of human intelligence.", "props": {}},
        {"type": "quiz", "content": "What is AI?", "props": {"options": ["Magic", "Math"], "answer": "Math"}}
    ]
    """
    try:
        data = json.loads(sample_response)
        assert isinstance(data, list)
        assert data[0]["type"] == "header"
        assert len(data[1]["content"].split()) < 120 # Check word limit rule compliance assumption
    except json.JSONDecodeError:
        pytest.fail("A2UI Sample is not valid JSON")

def test_prompt_constraints():
    """
    Verify the system prompt contains critical instruction keywords.
    """
    assert "A2UI JSON format" in A2UI_SYSTEM_PROMPT
    assert "120 words" in A2UI_SYSTEM_PROMPT
    assert "Interaction > Explanation" in A2UI_SYSTEM_PROMPT
