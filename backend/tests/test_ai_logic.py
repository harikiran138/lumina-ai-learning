from ai_engine.swarm.pathway import PathwayAgent
from unittest.mock import patch, MagicMock
import pytest


@pytest.fixture(autouse=True)
def mock_inference_engine():
    """Mock the heavy inference engine for all tests in this module."""
    with patch("ai_engine.swarm.pathway.PathwayInferenceEngine"):
        yield


def test_pathway_agent_log_interaction_structured():
    """Verifies that PathwayAgent correctly parses structured A2UI blocks."""
    agent = PathwayAgent()
    agent.state_manager = MagicMock()

    ai_response = """
    Here is a quiz for you:
    ```a2ui
    {
        "component": "Quiz",
        "props": {
            "question": "What is the capital of France?",
            "options": ["Paris", "London", "Berlin", "Madrid"],
            "correctIndex": 0
        }
    }
    ```
    And a flashcard:
    ```a2ui
    {
        "component": "Flashcard",
        "props": {
            "front": "Photosynthesis",
            "back": "Process of plants making food",
            "subject": "Biology"
        }
    }
    ```
    """

    agent.log_interaction("test_session", ai_response)

    # Verify both questions were added to state manager
    calls = agent.state_manager.add_question.call_args_list
    added_questions = [call[0][1] for call in calls]

    assert "What is the capital of France?" in added_questions
    assert "Photosynthesis" in added_questions


def test_pathway_difficulty_recommendation():
    """Verifies difficulty recommendation based on scores."""
    agent = PathwayAgent()

    with patch("app.store.user_data_store.UserDataStore.get_recent_quiz_stats") as mock_stats:
        # Test Advanced
        mock_stats.return_value = {"recent_average": 90}
        assert agent.get_difficulty_recommendation("user1") == "Advanced"

        # Test Introductory
        mock_stats.return_value = {"recent_average": 30}
        assert agent.get_difficulty_recommendation("user1") == "Introductory"

        # Test Intermediate
        mock_stats.return_value = {"recent_average": 70}
        assert agent.get_difficulty_recommendation("user1") == "Intermediate"
