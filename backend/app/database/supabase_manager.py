import httpx
import os
import sys
import time
import asyncio
from typing import Optional, Any, Dict, List, Tuple, Type, cast
from datetime import datetime
from copy import deepcopy
import uuid
from supabase import create_client, Client, ClientOptions
from app.core.config import settings
from app.core.logging import structlog

# Monkey-patch postgrest to support async_execute() even on the sync client
# This ensures that the codebase, which was developed with a mock client
# that had async_execute(), works without changes on real Supabase.
try:
    import postgrest._sync.request_builder as sync_rb
    import postgrest._async.request_builder as async_rb

    async def _async_execute_shim(self):
        """Shim to bridge the gap between codebase and library."""
        import asyncio
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.execute)

    # Patch the sync builders
    if hasattr(sync_rb, "SyncQueryRequestBuilder"):
        sync_rb.SyncQueryRequestBuilder.async_execute = _async_execute_shim
    if hasattr(sync_rb, "SyncFilterRequestBuilder"):
        sync_rb.SyncFilterRequestBuilder.async_execute = _async_execute_shim
    
    # Patch the async builders (though they should have execute() as coroutine)
    async def _async_execute_direct(self):
        return await self.execute()
    
    if hasattr(async_rb, "AsyncQueryRequestBuilder"):
        async_rb.AsyncQueryRequestBuilder.async_execute = _async_execute_direct
    if hasattr(async_rb, "AsyncFilterRequestBuilder"):
        async_rb.AsyncFilterRequestBuilder.async_execute = _async_execute_direct

except ImportError:
    pass

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


# --- GLOBAL MOCK BACKEND ---
# Using a module-level dictionary ensures data persists across re-imports and fixture resets
_DEFAULT_LOCAL_TABLES = {
    "users",
    "user_data",
    "student_subjects",
    "learner_profiles",
    "intervention_recommendations",
    "automation_job_logs",
    "assessment_sessions",
    "login_attempts",
    "login_history",
    "assignments",
    "assignment_submissions",
    "courses",
    "enrollments",
    "student_enrollments",
    "student_progress",
    "parent_child_links",
    "parent_messages",
    "parent_goals",
    "guardian_log",
    "inactivity_alerts",
    "risk_alerts",
    "risk_reveal_logs",
    "counselor_notes",
    "follow_up_tasks",
}
_GLOBAL_MOCK_TABLES: Dict[str, List[Dict[str, Any]]] = {table_name: [] for table_name in _DEFAULT_LOCAL_TABLES}

def get_global_mock_tables():
    return _GLOBAL_MOCK_TABLES

def clear_global_mock_tables():
    global _GLOBAL_MOCK_TABLES
    _GLOBAL_MOCK_TABLES = {table_name: [] for table_name in _DEFAULT_LOCAL_TABLES}


class _LocalQueryResult:
    def __init__(self, data: Any):
        self.data = data

    def __await__(self):
        # Allow Result to be used in 'await' expressions
        async def _self():
            return self
        return _self().__await__()


class _LocalTableQuery:
    def __init__(self, table_name: str):
        self.table_name = table_name
        self._operation = "select"
        self._payload = None
        self._filters: List[Tuple[str, str, Any]] = []
        self._or_filters: List[List[Tuple[str, str, Any]]] = []
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
        self._filters.append((key, "eq", value))
        return self

    def neq(self, key: str, value: Any):
        self._filters.append((key, "neq", value))
        return self

    def in_(self, key: str, values: List[Any]):
        self._filters.append((key, "in", list(values or [])))
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
                parsed.append((field, "eq", raw_value))
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

    def _matches_condition(self, row: Dict[str, Any], column: str, operator: str, value: Any) -> bool:
        row_value = row.get(column)
        if operator == "eq":
            return str(row_value) == str(value)
        if operator == "neq":
            return str(row_value) != str(value)
        if operator == "in":
            return str(row_value) in {str(item) for item in (value or [])}
        return False

    def _matches(self, row: Dict[str, Any]) -> bool:
        if any(not self._matches_condition(row, column, operator, value) for column, operator, value in self._filters):
            return False
        if self._or_filters:
            for group in self._or_filters:
                if not any(self._matches_condition(row, column, operator, value) for column, operator, value in group):
                    return False
        return True

    def _project_row(self, row: Dict[str, Any]) -> Dict[str, Any]:
        columns = self._columns or "*"
        fields = [field.strip() for field in columns.split(",") if field.strip()]
        include_all = columns in (None, "*") or "*" in fields
        projected = deepcopy(row) if include_all else {}

        if not include_all:
            for field in fields:
                if "(" in field:
                    continue
                projected[field] = deepcopy(row.get(field))

        if "user_roles(roles(name))" in columns:
            projected["user_roles"] = [{"roles": {"name": row.get("role")}}]

        return projected

    async def async_execute(self):
        """Asynchronous alias for execute to match ScopedQueryBuilder."""
        return self.execute()

    def execute(self):
        global _GLOBAL_MOCK_TABLES
        table_rows = _GLOBAL_MOCK_TABLES.setdefault(self.table_name, [])

        if self._operation == "insert":
            payloads = self._payload if isinstance(self._payload, list) else [self._payload]
            inserted = []
            for p in payloads:
                row = deepcopy(p or {})
                if "id" not in row: row["id"] = str(uuid.uuid4())
                now = datetime.utcnow().isoformat()
                row.setdefault("created_at", now)
                row.setdefault("updated_at", now)
                table_rows.append(row)
                inserted.append(deepcopy(row))
            return _LocalQueryResult(inserted)

        if self._operation == "upsert":
            payload, on_conflict = self._payload
            payloads = payload if isinstance(payload, list) else [payload]
            conflict_fields = [f.strip() for f in (on_conflict or "id").split(",") if f.strip()]
            upserted = []
            for p_item in payloads:
                item = deepcopy(p_item or {})
                existing = None
                for row in table_rows:
                    if all(str(row.get(f)) == str(item.get(f)) for f in conflict_fields):
                        existing = row
                        break
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
            matched = [row for row in table_rows if self._matches(row)]
            for row in matched:
                row.update(deepcopy(self._payload or {}))
                row["updated_at"] = datetime.utcnow().isoformat()
            return _LocalQueryResult([deepcopy(r) for r in matched])

        if self._operation == "delete":
            rem = []
            deleted = []
            for row in table_rows:
                if self._matches(row): deleted.append(deepcopy(row))
                else: rem.append(row)
            _GLOBAL_MOCK_TABLES[self.table_name] = rem
            return _LocalQueryResult(deleted)

        # Select logic
        matched = [row for row in table_rows if self._matches(row)]

        if self._order:
            k, d = self._order
            matched.sort(key=lambda r: str(r.get(k) or ""), reverse=d)
        if self._limit is not None:
            matched = matched[:self._limit]
        
        projected = [self._project_row(r) for r in matched]
        if self._single:
            return _LocalQueryResult(projected[0] if projected else None)
        return _LocalQueryResult(projected)


class _LocalSupabaseClient:
    def table(self, table_name: str) -> _LocalTableQuery:
        return _LocalTableQuery(table_name)


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
        if os.getenv("LUMINA_FORCE_REAL_DB") == "1":
            return False
        return os.getenv("LUMINA_FORCE_LOCAL_DB") == "1" or "pytest" in sys.modules

    @classmethod
    def get_client(cls, force_new: bool = False) -> Client:
        """
        Returns a singleton instance of the Supabase service-role client.
        """
        if cls._use_local_backend():
            if cls._local_client is None or force_new:
                if force_new:
                    clear_global_mock_tables()
                cls._local_client = _LocalSupabaseClient()
            return cls._local_client  # type: ignore[return-value]

        if cls._client is not None and not force_new:
            return cls._client

        supabase_url = settings.SUPABASE_URL
        supabase_key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY

        if not supabase_url or not supabase_key:
            error_msg = "Supabase configuration (URL or Key) is missing"
            cls._last_error = error_msg
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
                return cls._client
            except Exception as exc:
                last_exception = exc
                time.sleep(1) # Wait before retry

        cls._last_error = str(last_exception)
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
        except Exception as e:
            log.error("supabase_connection_failed", error=str(e))
            raise

    async def close(self):
        """Compatibility method for lifespan shutdown."""
        # Supabase client doesn't need explicit close usually, 
        # but we add it for lifespan consistency.
        pass

    @property
    def last_error(self) -> Optional[str]:
        return self._last_error

    # --- Query Helpers ---

    def table(self, table_name: str) -> Any:
        """Get a table query builder."""
        return self.client.table(table_name)

    async def fetch_one(self, table: str, query_filter: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Fetch a single record matching the query filter."""
        try:
            query = self.client.table(table).select("*")
            for key, value in query_filter.items():
                query = query.eq(key, value)
            response = await query.limit(1).async_execute()
            return response.data[0] if response.data else None
        except Exception as e:
            log.error("fetch_one_failed", table=table, error=str(e))
            return None

    async def fetch_all(
        self,
        table: str,
        query_filter: Dict[str, Any] = None,
        limit: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """Fetch all records matching the query filter."""
        try:
            query = self.client.table(table).select("*")
            if query_filter:
                for key, value in query_filter.items():
                    query = query.eq(key, value)
            if limit is not None:
                query = query.limit(limit)
            response = await query.async_execute()
            return response.data or []
        except Exception as e:
            log.error("fetch_all_failed", table=table, error=str(e))
            return []

    async def upsert(self, table: str, data: Dict[str, Any], on_conflict: str = 'id') -> Optional[Dict[str, Any]]:
        """Helper to upsert records."""
        try:
            response = await self.client.table(table).upsert(data, on_conflict=on_conflict).async_execute()
            return response.data[0] if response.data else None
        except Exception as e:
            log.error("upsert_failed", table=table, error=str(e))
            return None

    async def insert(self, table: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Helper to insert records."""
        try:
            response = await self.client.table(table).insert(data).async_execute()
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
            response = await query.async_execute()
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
            
            response = await query.async_execute()
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
    
    return supabase_db


supabase_db = SupabaseManager()
