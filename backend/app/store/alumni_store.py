from typing import List, Dict, Any, Optional
from app.database.supabase_manager import supabase_db
from app.core.logging import structlog
from datetime import datetime

log = structlog.get_logger()

class AlumniStore:
    def __init__(self):
        self.db = supabase_db

    async def get_portfolio(self, alumni_id: str) -> Optional[Dict[str, Any]]:
        try:
            client = self.db.get_client()
            res = client.table("alumni_portfolio").select("*").eq("alumni_id", alumni_id).execute()
            return res.data[0] if res.data else None
        except Exception as e:
            log.error("get_alumni_portfolio_failed", alumni_id=alumni_id, error=str(e))
            return None

    async def update_mentorship_status(self, alumni_id: str, is_available: bool) -> bool:
        try:
            client = self.db.get_client()
            client.table("alumni_mentorship").upsert({"alumni_id": alumni_id, "is_available": is_available}).execute()
            return True
        except Exception as e:
            log.error("update_alumni_mentorship_failed", alumni_id=alumni_id, error=str(e))
            return False
