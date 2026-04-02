import httpx
import os
import sys
import time
from typing import Optional, Any, Dict, List
from datetime import datetime
from copy import deepcopy
import uuid
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


class _LocalQueryResult:
    def __init__(self, data):
        self.data = data


class _LocalTableQuery:
    def __init__(self, backend: "_LocalSupabaseClient", table_name: str):
        self.backend = backend
        self.table_name = table_name
        self._operation = "select"
        self._payload = None
        self._filters = []
        self._or_filters = []
        self._limit = None
        self._order = None
        self._columns = "*"
        self._single = False

    def select(self, columns: str = "*", **_kwargs):
        self._operation = "select"
        self._columns = columns or "*"
        return self

    def insert(self, payload):
        self._operation = "insert"
        self._payload = payload
        return self

    def upsert(self, payload, on_conflict: str = "id"):
        self._operation = "upsert"
        self._payload = (payload, on_conflict)
        return self

    def update(self, payload):
        self._operation = "update"
        self._payload = payload
        return self

    def delete(self):
        self._operation = "delete"
        self._payload = None
        return self

    def eq(self, key: str, value: Any):
        self._filters.append(lambda row, k=key, v=value: row.get(k) == v)
        return self

    def neq(self, key: str, value: Any):
        self._filters.append(lambda row, k=key, v=value: row.get(k) != v)
        return self

    def in_(self, key: str, values: List[Any]):
        value_set = set(values or [])
        self._filters.append(lambda row, k=key, vals=value_set: row.get(k) in vals)
        return self

    def or_(self, expression: str):
        clauses = [part.strip() for part in (expression or "").split(",") if part.strip()]
        parsed = []
        for clause in clauses:
            parts = clause.split(".", 2)
            if len(parts) != 3:
                continue
            field, operator, raw_value = parts
            if operator == "eq":
                parsed.append(lambda row, f=field, v=raw_value: str(row.get(f)) == v)
        if parsed:
            self._or_filters.append(parsed)
        return self

    def order(self, key: str, desc: bool = False):
        self._order = (key, desc)
        return self

    def limit(self, value: int):
        self._limit = value
        return self

    def single(self):
        self._single = True
        return self

    def maybe_single(self):
        self._single = True
        return self

    def _project_row(self, row: Dict[str, Any]) -> Dict[str, Any]:
        if self._columns in (None, "*"):
            return deepcopy(row)
        if "(" in self._columns or ")" in self._columns:
            return deepcopy(row)
        fields = [field.strip() for field in self._columns.split(",") if field.strip()]
        return {field: deepcopy(row.get(field)) for field in fields}

    def _matches(self, row: Dict[str, Any]) -> bool:
        if any(not predicate(row) for predicate in self._filters):
            return False
        if self._or_filters:
            for group in self._or_filters:
                if not any(predicate(row) for predicate in group):
                    return False
        return True

    def _selected_rows(self) -> List[Dict[str, Any]]:
        rows = self.backend._tables.setdefault(self.table_name, [])
        matched = [row for row in rows if self._matches(row)]
        if self._order:
            key, desc = self._order
            matched.sort(key=lambda row: row.get(key) or "", reverse=desc)
        if self._limit is not None:
            matched = matched[: self._limit]
        return matched

    def execute(self):
        table_rows = self.backend._tables.setdefault(self.table_name, [])

        if self._operation == "insert":
            # For insert, self._payload is the data passed to .insert()
            payloads = self._payload if isinstance(self._payload, list) else [self._payload]
            inserted = []
            for p in payloads:
                row = deepcopy(p or {})
                if "id" not in row:
                    row["id"] = str(uuid.uuid4())
                now = datetime.utcnow().isoformat()
                row.setdefault("created_at", now)
                row.setdefault("updated_at", now)
                table_rows.append(row)
                inserted.append(deepcopy(row))
            return _LocalQueryResult(inserted)

        if self._operation == "upsert":
            payload, on_conflict = self._payload
            payloads = payload if isinstance(payload, list) else [payload]
            conflict_fields = [field.strip() for field in (on_conflict or "id").split(",") if field.strip()]
            upserted = []
            for payload_item in payloads:
                item = deepcopy(payload_item or {})
                existing = None
                if conflict_fields:
                    for row in table_rows:
                        if all(str(row.get(field)) == str(item.get(field)) for field in conflict_fields):
                            existing = row
                            break
                if existing is None and item.get("id"):
                    existing = next((row for row in table_rows if row.get("id") == item["id"]), None)
                if existing is None:
                    item.setdefault("id", str(uuid.uuid4()))
                    item.setdefault("created_at", datetime.utcnow().isoformat())
                    item.setdefault("updated_at", item["created_at"])
                    table_rows.append(item)
                    upserted.append(deepcopy(item))
                else:
                    existing.update(item)
                    existing["updated_at"] = datetime.utcnow().isoformat()
                    upserted.append(deepcopy(existing))
            return _LocalQueryResult(upserted)

        if self._operation == "update":
            updated = []
            for row in self._selected_rows():
                row.update(deepcopy(self._payload or {}))
                row["updated_at"] = datetime.utcnow().isoformat()
                updated.append(deepcopy(row))
            return _LocalQueryResult(updated)

        if self._operation == "delete":
            remaining = []
            deleted = []
            for row in table_rows:
                if self._matches(row):
                    deleted.append(deepcopy(row))
                else:
                    remaining.append(row)
            self.backend._tables[self.table_name] = remaining
            return _LocalQueryResult(deleted)

        projected = [self._project_row(row) for row in self._selected_rows()]
        if self._single:
            return _LocalQueryResult(projected[0] if projected else None)
        return _LocalQueryResult(projected)


class _LocalSupabaseClient:
    def __init__(self):
        self._tables: Dict[str, List[Dict[str, Any]]] = {}

    def table(self, table_name: str) -> _LocalTableQuery:
        return _LocalTableQuery(self, table_name)


class SupabaseManager:
    """
    Production-ready Supabase client manager.
    Handles initialization, retries, and provides query helpers.
    Supports instance-specific clients for RLS-aware scoping.
    """

    _client: Optional[Client] = None
    _local_client: Optional[_LocalSupabaseClient] = None
    _init_attempted = False
    _last_error = None

    def __init__(self, client: Optional[Client] = None):
        self._instance_client = client

    @classmethod
    def _use_local_backend(cls) -> bool:
        return os.getenv("LUMINA_FORCE_LOCAL_DB") == "1" or "pytest" in sys.modules

    @classmethod
    def get_client(cls, force_new: bool = False) -> Client:
        """
        Returns a singleton instance of the Supabase service-role client.
        """
        if cls._use_local_backend():
            if cls._local_client is None or force_new:
                cls._local_client = _LocalSupabaseClient()
                log.info("supabase_local_client_initialized")
            return cls._local_client  # type: ignore[return-value]

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
        """Returns the instance-specific client if available, otherwise the service-role client."""
        if self._instance_client:
            return self._instance_client
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

    async def insert(self, table: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Helper to insert records."""
        try:
            response = self.client.table(table).insert(data).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            log.error("insert_failed", table=table, error=str(e))
            return None

    async def update(self, table: str, data: Dict[str, Any], query_filter: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Helper to update records."""
        try:
            query = self.client.table(table).update(data)
            for key, value in query_filter.items():
                query = query.eq(key, value)
            response = query.execute()
            return response.data[0] if response.data else None
        except Exception as e:
            log.error("update_failed", table=table, error=str(e))
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


def get_scoped_db(user: Dict[str, Any]) -> SupabaseManager:
    """
    Returns a scoped SupabaseManager instance for the given user.
    If the user is a super_admin, it returns the global service role client.
    Otherwise, it returns a client scoped with the user's JWT.
    """
    global supabase_db
    if user.get("role") == "super_admin":
        return supabase_db
    
    jwt = user.get("access_token")
    if jwt:
        client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_ANON_KEY,
            options=ClientOptions(headers={"Authorization": f"Bearer {jwt}"})
        )
        return SupabaseManager(client=client)
    
    return supabase_db


supabase_db = SupabaseManager()
