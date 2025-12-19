import logging
from typing import List, Dict, Any
from datetime import datetime
from pydantic import ValidationError

from ..agents.analytics.mcp_contract import InteractionEvent
from ..db.storage import TimescaleClient

logger = logging.getLogger(__name__)

class IngestionService:
    """
    Handles the ingestion of raw behavioral streams.
    Validates data and persists it to storage.
    """
    
    def __init__(self, db_client: TimescaleClient):
        self.db_client = db_client

    def ingest_batch(self, payload: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Process a batch of raw events.
        """
        valid_events = []
        errors = []
        
        for item in payload:
            try:
                # 1. Validate against schema
                # We use the schema from mcp_contract but maybe we need a looser one for raw input?
                # For now, strict validation against InteractionEvent
                event_model = InteractionEvent(**item)
                valid_events.append(event_model.model_dump())
            except ValidationError as e:
                logger.warning(f"Invalid event dropped: {e}")
                errors.append({"item": item, "error": str(e)})

        # 2. Persist to DB
        if valid_events:
            success = self.db_client.insert_events(valid_events)
            if not success:
                return {"status": "error", "message": "Database insertion failed", "processed": 0}

        return {
            "status": "success",
            "processed": len(valid_events),
            "dropped": len(errors),
            "errors": errors
        }
