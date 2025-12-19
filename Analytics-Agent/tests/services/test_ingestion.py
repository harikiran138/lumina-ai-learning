import pytest
import time
from analytics_agent.services.ingestion import IngestionService
from analytics_agent.db.storage import TimescaleClient

@pytest.fixture
def mock_db():
    client = TimescaleClient()
    client.connect()
    return client

@pytest.fixture
def ingestion_service(mock_db):
    return IngestionService(mock_db)

def test_ingest_valid_batch(ingestion_service, mock_db):
    payload = [
        {
            "learner_id": "user_123",
            "timestamp": time.time(),
            "event_type": "scroll",
            "payload": {"depth": 50, "velocity": 2.5}
        },
        {
            "learner_id": "user_123",
            "timestamp": time.time(),
            "event_type": "pause",
            "payload": {"duration": 1500}
        }
    ]
    
    result = ingestion_service.ingest_batch(payload)
    
    assert result["status"] == "success"
    assert result["processed"] == 2
    assert result["dropped"] == 0
    
    # Verify DB storage
    stored = mock_db.get_recent_events("user_123")
    assert len(stored) == 2

def test_ingest_invalid_schema(ingestion_service):
    payload = [
        {
            "learner_id": "user_123",
            # Missing timestamp and event_type
            "payload": {}
        }
    ]
    
    result = ingestion_service.ingest_batch(payload)
    
    assert result["status"] == "success" # It allows partial success
    assert result["processed"] == 0
    assert result["dropped"] == 1
    assert len(result["errors"]) == 1
