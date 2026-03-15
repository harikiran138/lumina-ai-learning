import httpx
import os
import sys
import time
from typing import Optional, Any, Dict, List
from supabase import create_client, Client, ClientOptions
from app.core.config import settings
from app.core.logging import structlog

log = structlog.get_logger()

# ---------------------------------------------------------------------------
# Compatibility shim: gotrue 2.9.x passes `proxy=` to httpx.Client.__init__,
# but httpx 0.25.x only accepts `proxies=`. Patch it out transparently so
# the Supabase client can initialise without errors.
# ---------------------------------------------------------------------------
_OriginalHttpxSyncClient = httpx.Client.__init__

def _patched_httpx_init(self, *args, **kwargs):
    kwargs.pop("proxy", None)   # strip the unsupported kwarg
    _OriginalHttpxSyncClient(self, *args, **kwargs)

httpx.Client.__init__ = _patched_httpx_init          # type: ignore[method-assign]


class SupabaseManager:
    """
    Production-ready Supabase client manager.
    Handles initialization, retries, and provides query helpers.
    """

    _client: Optional[Client] = None
    _init_attempted = False
    _last_error = None

    @classmethod
    def get_client(cls, force_new: bool = False) -> Client:
        """
        Returns a singleton instance of the Supabase client.
        """
        if cls._client is not None and not force_new:
            return cls._client

        supabase_url = settings.SUPABASE_URL
        supabase_key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY

        if not supabase_url or not supabase_key:
            error_msg = "Supabase configuration (URL or Key) is missing"
            cls._last_error = error_msg
            log.error("supabase_config_missing", error=error_msg)
            raise ValueError(error_msg)

        # Retry logic for initialization
        max_retries = 3
        last_exception = None
        
        for attempt in range(max_retries):
            try:
                # Use longer timeout for production robustness
                options = ClientOptions(
                    postgrest_client_timeout=30.0,
                    storage_client_timeout=30.0
                )
                cls._client = create_client(supabase_url, supabase_key, options=options)
                cls._last_error = None
                log.info("supabase_client_initialized", attempt=attempt + 1)
                return cls._client
            except Exception as exc:
                last_exception = exc
                log.warning("supabase_init_attempt_failed", attempt=attempt + 1, error=str(exc))
                time.sleep(1) # Wait before retry

        cls._last_error = str(last_exception)
        log.error("supabase_initialization_failed", error=str(last_exception))
        raise last_exception

    @property
    def client(self) -> Client:
        return self.get_client()

    async def connect(self):
        """Compatibility method for lifespan startup."""
        try:
            self.get_client()
            log.info("supabase_connected_successfully")
        except Exception as e:
            log.error("supabase_connection_failed", error=str(e))
            raise

    async def close(self):
        """Compatibility method for lifespan shutdown."""
        # Supabase client doesn't need explicit close usually, 
        # but we add it for lifespan consistency.
        log.info("supabase_connection_closed")

    @property
    def last_error(self) -> Optional[str]:
        return self._last_error

    # --- Query Helpers ---

    def table(self, table_name: str):
        """Returns the table object for queries."""
        return self.client.table(table_name)

    async def fetch_one(self, table: str, query_filter: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Helper to fetch a single record."""
        try:
            query = self.client.table(table).select("*")
            for key, value in query_filter.items():
                query = query.eq(key, value)
            
            response = query.limit(1).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            log.error("fetch_one_failed", table=table, error=str(e))
            return None

    async def fetch_all(self, table: str, query_filter: Optional[Dict[str, Any]] = None, limit: int = 1000) -> List[Dict[str, Any]]:
        """Helper to fetch multiple records."""
        try:
            query = self.client.table(table).select("*")
            if query_filter:
                for key, value in query_filter.items():
                    query = query.eq(key, value)
            
            response = query.limit(limit).execute()
            return response.data or []
        except Exception as e:
            log.error("fetch_all_failed", table=table, error=str(e))
            return []

    async def upsert(self, table: str, data: Dict[str, Any], on_conflict: str = 'id') -> Optional[Dict[str, Any]]:
        """Helper to upsert records."""
        try:
            response = self.client.table(table).upsert(data, on_conflict=on_conflict).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            log.error("upsert_failed", table=table, error=str(e))
            return None

    async def delete(self, table: str, query_filter: Dict[str, Any]) -> bool:
        """Helper to delete records."""
        try:
            query = self.client.table(table).delete()
            for key, value in query_filter.items():
                query = query.eq(key, value)
            
            response = query.execute()
            return len(response.data) > 0
        except Exception as e:
            log.error("delete_failed", table=table, error=str(e))
            return False

supabase_db = SupabaseManager()
