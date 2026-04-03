from typing import List, Dict, Any, Optional
from app.database.supabase_manager import supabase_db
from app.core.logging import structlog
from datetime import datetime

log = structlog.get_logger()

class PeerTutorStore:
    def __init__(self):
        self.db = supabase_db

    async def get_sessions(self, tutor_id: str) -> List[Dict[str, Any]]:
        try:
            client = self.db.get_client()
            response = await client.table("peer_tutor_sessions").select("*").eq("tutor_id", tutor_id).async_execute()
            return response.data
        except Exception as e:
            log.error("get_tutor_sessions_failed", tutor_id=tutor_id, error=str(e))
            return []

    async def get_training_progress(self, tutor_id: str) -> Optional[Dict[str, Any]]:
        try:
            client = self.db.get_client()
            res = await client.table("tutor_training_progress").select("*").eq("tutor_id", tutor_id).async_execute()
            return res.data[0] if res.data else None
        except Exception as e:
            log.error("get_training_progress_failed", tutor_id=tutor_id, error=str(e))
            return None

    async def get_eligible_tutors(self) -> List[Dict[str, Any]]:
        try:
            client = self.db.get_client()
            response = await client.table("tutor_eligibility").select("*").async_execute()
            return response.data
        except Exception as e:
            log.error("get_eligible_tutors_failed", error=str(e))
            return []
