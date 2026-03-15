from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid

from app.core.logging import structlog
from app.database.supabase_manager import supabase_db

log = structlog.get_logger()


class GenerationStore:
    """
    Persistence for AI-generated content with basic review/version metadata.
    """

    def __init__(self):
        self.db = supabase_db

    async def create_asset(
        self,
        asset_type: str,
        payload: Dict[str, Any],
        created_by: str,
        status: str = "draft",
        metadata: Optional[Dict[str, Any]] = None,
        parent_id: Optional[str] = None,
        version: int = 1,
    ) -> Dict[str, Any]:
        asset = {
            "id": str(uuid.uuid4()),
            "asset_type": asset_type,
            "payload": payload,
            "status": status,
            "version": version,
            "parent_id": parent_id,
            "metadata": metadata or {},
            "created_by": created_by,
            "review_status": "pending" if status == "draft" else "approved",
            "reviewed_by": None,
            "review_notes": None,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }

        try:
            result = await self.db.upsert("generation_assets", asset)
            if result:
                return result[0]
            return asset
        except Exception as exc:
            log.warning("generation_asset_insert_failed", error=str(exc), created_by=created_by)
            return asset

    async def list_assets(
        self,
        asset_type: Optional[str] = None,
        status: Optional[str] = None,
        created_by: Optional[str] = None,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        try:
            filters = {}
            if asset_type: filters["asset_type"] = asset_type
            if status: filters["status"] = status
            if created_by: filters["created_by"] = created_by
            
            client = self.db.get_client()
            query = client.table("generation_assets").select("*").order("created_at", desc=True).limit(limit)
            for k, v in filters.items():
                query = query.eq(k, v)
            
            response = query.execute()
            return response.data or []
        except Exception as exc:
            log.warning("generation_asset_list_failed", error=str(exc))
            return []

    async def update_asset(self, asset_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        updates = {**updates, "updated_at": datetime.utcnow().isoformat()}
        try:
            client = self.db.get_client()
            response = client.table("generation_assets").update(updates).eq("id", asset_id).execute()
            if response.data:
                return response.data[0]
        except Exception as exc:
            log.warning("generation_asset_update_failed", error=str(exc), asset_id=asset_id)
        return None
