from typing import List, Dict, Any, Optional
from app.database.supabase_manager import supabase_db
from app.core.logging import structlog
from datetime import datetime

log = structlog.get_logger()

class ResearcherStore:
    def __init__(self):
        self.db = supabase_db

    async def get_snapshots(self) -> List[Dict[str, Any]]:
        try:
            client = self.db.get_client()
            return client.table("anonymised_snapshots").select("*").execute().data
        except Exception as e:
            log.error("get_snapshots_failed", error=str(e))
            return []

    async def log_query(self, researcher_id: str, query_config_json: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        try:
            query_data = {
                "researcher_id": researcher_id,
                "query_config_json": query_config_json
            }
            return await self.db.insert("research_queries", query_data)
        except Exception as e:
            log.error("log_research_query_failed", researcher_id=researcher_id, error=str(e))
            return None
