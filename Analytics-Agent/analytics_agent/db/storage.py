import logging
from typing import List, Dict, Any, Optional
import time

logger = logging.getLogger(__name__)

class TimescaleClient:
    """
    Abstraction for TimescaleDB interactions.
    Currently mocks storage for the self-hosted requirement validation.
    """
    
    def __init__(self, connection_string: str = "mock://localhost:5432/lumina"):
        self.connection_string = connection_string
        self._mock_storage: List[Dict[str, Any]] = []
        logger.info(f"TimescaleClient initialized with {connection_string}")
        
    def connect(self):
        """Simulates database connection."""
        logger.info("Connected to TimescaleDB (Mock)")
        return True

    def insert_events(self, events: List[Dict[str, Any]]) -> bool:
        """
        Inserts a batch of behavioral events.
        """
        if not events:
            return True
            
        logger.debug(f"Inserting {len(events)} events into hypertable 'events'")
        # Simulate insertion
        for event in events:
            # Enforce minimal schema check if needed, but we assume IngestionService sends valid dicts
            event['_stored_at'] = time.time()
            self._mock_storage.append(event)
            
        return True

    def get_recent_events(self, learner_id: str, minutes: int = 5) -> List[Dict[str, Any]]:
        """
        Retrieves events for a learner from the last N minutes.
        """
        cutoff = time.time() - (minutes * 60)
        
        # Filter mock storage
        results = [
            e for e in self._mock_storage 
            if e.get("learner_id") == learner_id and e.get("timestamp", 0) >= cutoff
        ]
        
        logger.info(f"Retrieved {len(results)} events for learner {learner_id} in last {minutes}m")
        return results

    def get_learner_history(self, learner_id: str) -> Dict[str, Any]:
        """
        Retrieves aggregated history (mock).
        """
        # Return a mock baseline
        return {
            "avg_engagement": 0.7,
            "struggle_frequency": 0.1,
            "mastery_snapshot": {}
        }
