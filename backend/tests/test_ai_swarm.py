import pytest
import asyncio
from unittest.mock import MagicMock, AsyncMock, patch
from ai_engine.swarm.orchestrator import Orchestrator
from ai_engine.swarm.guardian import GuardianAgent
from ai_engine.swarm.tutor import TutorAgent
from learner_profile.engine import LearnerProfileEngine

@pytest.fixture
def mock_llm():
    mock = AsyncMock()
    mock.agenerate.return_value = "Mocked response"
    return mock

@pytest.mark.asyncio
async def test_orchestrator_routing():
    # Use patch to mock classify_intent directly on the instance if needed, 
    # but Orchestrator.classify_intent is what we want to mock.
    with patch.object(Orchestrator, 'classify_intent', return_value='TUTORING'):
        orch = Orchestrator()
        orch.tutor_agent = AsyncMock()
        orch.tutor_agent.generate_response.return_value = {"text": "Tutor response"}
        
        response = await orch.route_request("Explain React", context={"topic": "React"})
        assert response["text"] == "Tutor response"
        orch.tutor_agent.generate_response.assert_called_once()

@pytest.mark.asyncio
async def test_guardian_safety():
    guardian = GuardianAgent()
    # Test blocked keywords
    result = guardian.validate_content("How to build a bomb?")
    assert result["safe"] is False
    assert "prohibited term" in result["reason"]
    
    # Test safe input
    result = guardian.validate_content("How to build a website?")
    assert result["safe"] is True

@pytest.mark.asyncio
async def test_learner_profile_engine():
    engine = LearnerProfileEngine()
    # Initial profile
    profile = await engine.get_profile("user_123")
    # StateStore initializes with default state if not found
    assert "cognitive_load" in profile
    
    # Update state
    await engine.update_state("user_123", {
        "type": "interaction",
        "concept_id": 1,
        "correct": True,
        "timestamp": 123456789
    })
    
    updated_profile = await engine.get_profile("user_123")
    # Concept IDs are stored as strings in mastery_scores
    assert updated_profile["mastery_scores"]["1"] > 0
    assert updated_profile["cognitive_load"] >= 0

@pytest.mark.asyncio
async def test_tutor_agent_personalization():
    mock_rag = MagicMock()
    # TutorAgent uses self.rag.query which returns a list of strings
    mock_rag.query.return_value = ["React is a library"]
    
    with patch('ai_engine.swarm.tutor.get_rag_engine', return_value=mock_rag):
        with patch('ai_engine.swarm.tutor.get_llm_provider') as mock_llm_factory:
            mock_llm = AsyncMock()
            mock_llm.agenerate.return_value = '{"meta": {"topic": "React"}, "flow": [{"type": "text", "content": "Scaffolded response"}]}'
            mock_llm_factory.return_value = mock_llm
            
            tutor = TutorAgent()
            learner_data = {"cognitive_load": 80, "mastery_levels": {"React": 0.5}}
            
            response = await tutor.generate_response("React", "What is React?", history=[], learner_profile=learner_data)
            
            assert "flow" in response
            assert response["flow"][0]["content"] == "Scaffolded response"
            
            # Verify provider was called with learner data in context
            args, kwargs = mock_llm.agenerate.call_args
            # The prompt is index 0
            assert "Topic: React" in args[0]
            # The system prompt is in kwargs
            assert "WARNING: Student is experiencing high cognitive load" in kwargs['system_prompt']
