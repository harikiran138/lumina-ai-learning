from typing import Optional, Dict, Any, List
from datetime import datetime
from app.database.supabase_manager import supabase_db
from app.core.logging import structlog

log = structlog.get_logger()

class ConfigStore:
    """
    Store for managing platform-level configuration and feature flags.
    Uses 'platform_config' and 'role_configs' tables in Supabase.
    """

    def __init__(self, db: Optional[Any] = None):
        self.db = db or supabase_db
        self.config_table = "platform_config"
        self.role_table = "role_configs"
        self._cache = {}

    async def get_all_config(self, force_refresh: bool = False) -> Dict[str, Any]:
        """Fetches all configuration key-value pairs."""
        if self._cache and not force_refresh:
            return self._cache

        try:
            client = self.db.get_client()
            # Try to fetch from table. Each row is a key-value pair.
            response = await client.table(self.config_table).select("*").async_execute()
            
            config_dict = {}
            if response.data:
                for row in response.data:
                    config_dict[row["key"]] = row["value"]
            
            # Merit check: if we have zero data, use defaults
            if not config_dict:
                config_dict = self._get_default_config()

            self._cache = config_dict
            return config_dict
        except Exception as e:
            log.warning("get_all_config_failed_fallback_to_defaults", error=str(e))
            return self._get_default_config()

    async def get_config(self, key: str, default: Any = None) -> Any:
        """Gets a specific config value by key."""
        config = await self.get_all_config()
        return config.get(key, default)

    async def update_bulk_config(self, settings: Dict[str, Any]) -> bool:
        """Updates multiple config values at once."""
        try:
            client = self.db.get_client()
            rows = []
            now = datetime.utcnow().isoformat()
            for k, v in settings.items():
                rows.append({"key": k, "value": v, "updated_at": now})
                self._cache[k] = v
            
            # Bulk upsert
            await client.table(self.config_table).upsert(rows, on_conflict="key").async_execute()
            return True
        except Exception as e:
            log.error("update_bulk_config_failed", error=str(e))
            return False

    async def set_config(self, key: str, value: Any) -> bool:
        """Sets or updates a single config value."""
        return await self.update_bulk_config({key: value})

    async def get_role_matrix(self) -> Dict[str, Any]:
        """Fetch the functional role-per-permission matrix."""
        try:
            res = await self.db.fetch_one(self.role_table, {"id": "matrix"})
            if res and "data" in res:
                return res["data"]
        except Exception as e:
            log.warning("role_matrix_fetch_failed_using_defaults", error=str(e))

        return self._get_default_role_matrix()

    async def update_role_matrix(self, matrix: Dict[str, Any]) -> bool:
        """Update the role-permission matrix."""
        try:
            payload = {
                "id": "matrix",
                "data": matrix,
                "updated_at": datetime.utcnow().isoformat()
            }
            await self.db.upsert(self.role_table, payload)
            return True
        except Exception as e:
            log.error("update_role_matrix_failed", error=str(e))
            return False

    def _get_default_config(self) -> Dict[str, Any]:
        return {
            "maintenance_mode": False,
            "public_registration": True,
            "ai_tutor_enabled": True,
            "guardian_mode": "active",
            "api_rate_limit": 10000,
            "ai_cost_limit_daily": 50.0
        }

    def _get_default_role_matrix(self) -> Dict[str, Any]:
        return {
            "roles": ["student", "faculty", "hod", "college_admin", "super_admin", "parent", "guest"],
            "permissions": {
                "course_create": ["super_admin", "college_admin", "faculty", "hod"],
                "course_delete": ["super_admin", "college_admin"],
                "user_manage": ["super_admin", "college_admin"],
                "analytics_view": ["super_admin", "college_admin", "faculty", "hod"],
                "billing_manage": ["super_admin", "college_admin"]
            }
        }

# Global instance
config_store = ConfigStore()
