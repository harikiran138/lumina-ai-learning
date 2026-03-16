from typing import List, Dict, Any, Optional
from app.database.supabase_manager import supabase_db
from app.core.logging import structlog
from datetime import datetime

log = structlog.get_logger()

class ContentCreatorStore:
    def __init__(self):
        self.db = supabase_db

    async def create_blueprint(self, creator_id: str, title: str, objectives_json: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        try:
            blueprint_data = {
                "creator_id": creator_id,
                "title": title,
                "objectives_json": objectives_json,
                "status": "draft"
            }
            return await self.db.insert("course_blueprints", blueprint_data)
        except Exception as e:
            log.error("create_blueprint_failed", creator_id=creator_id, error=str(e))
            return None

    async def add_lesson_sequence(self, blueprint_id: str, sequence_json: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        try:
            data = {
                "blueprint_id": blueprint_id,
                "sequence_json": sequence_json
            }
            return await self.db.insert("lesson_sequences", data)
        except Exception as e:
            log.error("add_lesson_sequence_failed", blueprint_id=blueprint_id, error=str(e))
            return None

    async def get_blueprints(self, creator_id: str) -> List[Dict[str, Any]]:
        try:
            client = self.db.get_client()
            response = client.table("course_blueprints").select("*").eq("creator_id", creator_id).execute()
            return response.data
        except Exception as e:
            log.error("get_blueprints_failed", creator_id=creator_id, error=str(e))
            return []
