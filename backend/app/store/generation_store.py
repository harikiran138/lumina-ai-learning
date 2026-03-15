from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid

from app.core.logging import structlog
from app.database.supabase_manager import supabase_db
from app.store.local_store import LocalJsonStore

log = structlog.get_logger()


class GenerationStore:
    """
    Persistence for AI-generated content with basic review/version metadata.
    """

    def __init__(self):
        self.client = supabase_db.get_client()
        self.local = LocalJsonStore()

    @property
    def assets_collection(self):
        if self.client is None:
            return None
        return self.client.table("generation_assets")

    def _fallback_read(self) -> List[Dict[str, Any]]:
        payload = self.local.read()
        return payload.get("generation_assets", [])

    def _fallback_write(self, assets: List[Dict[str, Any]]):
        payload = self.local.read()
        payload["generation_assets"] = assets
        self.local.write(payload)

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

        if self.client is None:
            assets = self._fallback_read()
            assets.append(asset)
            self._fallback_write(assets)
            return asset

        try:
            response = self.assets_collection.insert(asset).execute()
            if response.data:
                return response.data[0]
        except Exception as exc:
            log.warning("generation_asset_insert_failed", error=str(exc))

        assets = self._fallback_read()
        assets.append(asset)
        self._fallback_write(assets)
        return asset

    async def list_assets(
        self,
        asset_type: Optional[str] = None,
        status: Optional[str] = None,
        created_by: Optional[str] = None,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        if self.client is not None:
            try:
                query = self.assets_collection.select("*").order("created_at", desc=True).limit(limit)
                if asset_type:
                    query = query.eq("asset_type", asset_type)
                if status:
                    query = query.eq("status", status)
                if created_by:
                    query = query.eq("created_by", created_by)
                response = query.execute()
                return response.data or []
            except Exception as exc:
                log.warning("generation_asset_list_failed", error=str(exc))

        assets = self._fallback_read()
        if asset_type:
            assets = [a for a in assets if a.get("asset_type") == asset_type]
        if status:
            assets = [a for a in assets if a.get("status") == status]
        if created_by:
            assets = [a for a in assets if a.get("created_by") == created_by]
        return assets[-limit:][::-1]

    async def update_asset(self, asset_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        updates = {**updates, "updated_at": datetime.utcnow().isoformat()}

        if self.client is not None:
            try:
                response = self.assets_collection.update(updates).eq("id", asset_id).execute()
                if response.data:
                    return response.data[0]
            except Exception as exc:
                log.warning("generation_asset_update_failed", error=str(exc))

        assets = self._fallback_read()
        for asset in assets:
            if asset.get("id") == asset_id:
                asset.update(updates)
                self._fallback_write(assets)
                return asset
        return None
