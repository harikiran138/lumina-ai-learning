import sys
import os
import pytest

# Add backend to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Mocking Torch and Transformers to avoid loading massive models during unit test
import sys
from unittest.mock import MagicMock
sys.modules["torch"] = MagicMock()
sys.modules["transformers"] = MagicMock()
sys.modules["PIL"] = MagicMock()
sys.modules["sentence_transformers"] = MagicMock()

from ai_engine.swarm.orchestrator import Orchestrator
from ai_engine.swarm.handwriting_agent import HandwritingAgent

def test_agent_initialization():
    agent = HandwritingAgent()
    assert agent.model is None # Should be lazy loaded
    assert agent.scorer is not None

def test_orchestrator_routing():
    orchestrator = Orchestrator()
    
    # Mock the agent's analyze method to avoid evaluating lazy load logic in test
    orchestrator.handwriting_agent.analyze = MagicMock(return_value={"extracted_text": "mock", "score": 1.0})
    
    context = {
        "type": "handwriting_analysis",
        "file_path": "dummy.jpg",
        "answer_key": "dummy key"
    }
    
    result = orchestrator.route_request("analyze this", context)
    assert result["extracted_text"] == "mock"
    assert result["score"] == 1.0
    orchestrator.handwriting_agent.analyze.assert_called_once()
