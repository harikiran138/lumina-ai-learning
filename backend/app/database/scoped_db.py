import os
from typing import Any, Dict, Optional, List, Set
from supabase import ClientOptions
from app.core.config import settings
from .supabase_manager import supabase_db, SupabaseManager


def _load_soft_delete_tables() -> Set[str]:
    raw_tables = os.getenv("LUMINA_SOFT_DELETE_TABLES", "")
    return {
        table_name.strip()
        for table_name in raw_tables.split(",")
        if table_name.strip()
    }


SOFT_DELETE_TABLES = _load_soft_delete_tables()

# Tables that are not scoped by institution (global or user-only)
GLOBAL_TABLES = {
    "user_data",
    "roles",
    "permissions",
    "users",
    "institution_login_policies",
    "batches",
    "learner_profiles",
    "assessment_sessions",
    # These tables use their own foreign keys (course_id, batch_id, teacher_id)
    # and do not have an institution_id column
    "teacher_assignments",
    "assignments",
    "assignment_submissions",
    "enrollment_codes",
    "courses",
    "ai_answer_queue",
    "verified_answers_bank",
    "attendance_sessions",
    "attendance_records",
    # Junction tables scoped by student_id/user_id — no institution_id column
    "student_subjects",
    "skill_mastery",
    "student_enrollments",
    # Hierarchy tables scoped via program_id/department_id — no institution_id column
    "semesters",
    "classes",
    "teacher_requests",
    "content_uploads",
    "physical_submissions",
    "course_concepts",
    "counselor_notes",
    "risk_reveal_logs",
    "follow_up_tasks",
    "risk_alerts",
}


def _supports_soft_delete(table_name: str) -> bool:
    return table_name in SOFT_DELETE_TABLES


def _response_rows(response: Any) -> List[Dict[str, Any]]:
    data = getattr(response, "data", None)
    if data is None:
        return []
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        return [data]
    return []

class ScopedQueryBuilder:
    def __init__(self, table_name: str, institution_id: str, is_super_admin: bool = False, client=None, show_deleted: bool = False):
        self.table_name = table_name
        self.institution_id = institution_id
        self.is_super_admin = is_super_admin
        self.show_deleted = show_deleted
        self.soft_delete_enabled = _supports_soft_delete(table_name)
        # Use provided scoped client or fall back to global
        self.client = client or supabase_db.get_client()
        self.query = self.client.table(table_name)
        
        # Store scoping parameters for later application in action methods
        self.is_global = table_name in GLOBAL_TABLES
        
    def _apply_auth_filters(self):
        """Internal helper to apply institution scoping and soft-delete filters."""
        if not self.is_super_admin and self.institution_id and not self.is_global:
            # Force institution scoping. 
            # Note: The "institutions" table itself uses "id" for scoping, 
            # while other tables use "institution_id"
            target_column = "id" if self.table_name == "institutions" else "institution_id"
            self.query = self.query.eq(target_column, self.institution_id)
        
        # Apply the soft-delete filter if enabled and required
        if self.soft_delete_enabled and not self.show_deleted:
            self.query = self.query.eq("is_deleted", False)
        return self

    def select(self, columns: str = "*"):
        self.query = self.query.select(columns)
        self._apply_auth_filters()
        return self

    def insert(self, data: Dict[str, Any]):
        if not self.is_super_admin and self.institution_id and not self.is_global:
            # Force institution scoping on insert, except for the institutions table itself
            if self.table_name != "institutions":
                if isinstance(data, list):
                    for item in data:
                        item["institution_id"] = self.institution_id
                else:
                    data["institution_id"] = self.institution_id
        self.query = self.query.insert(data)
        return self

    def upsert(self, data: Dict[str, Any], on_conflict: str = 'id'):
        if not self.is_super_admin and self.institution_id and not self.is_global:
            # Force institution scoping on upsert, except for the institutions table itself
            if self.table_name != "institutions":
                if isinstance(data, list):
                    for item in data:
                        item["institution_id"] = self.institution_id
                else:
                    data["institution_id"] = self.institution_id
        self.query = self.query.upsert(data, on_conflict=on_conflict)
        return self

    def update(self, data: Dict[str, Any]):
        self.query = self.query.update(data)
        self._apply_auth_filters()
        return self

    def delete(self):
        self.query = self.query.delete()
        self._apply_auth_filters()
        return self

    def soft_delete(self):
        from datetime import datetime
        if not self.soft_delete_enabled:
            return self.delete()
        return self.update({
            "is_deleted": True,
            "deleted_at": datetime.utcnow().isoformat()
        })

    def eq(self, column: str, value: Any):
        self.query = self.query.eq(column, value)
        return self

    def neq(self, column: str, value: Any):
        self.query = self.query.neq(column, value)
        return self

    def in_(self, column: str, values: List[Any]):
        self.query = self.query.in_(column, values)
        return self

    def order(self, column: str, desc: bool = False):
        self.query = self.query.order(column, desc=desc)
        return self

    def limit(self, count: int):
        self.query = self.query.limit(count)
        return self

    def single(self):
        self.query = self.query.single()
        return self

    def maybe_single(self):
        self.query = self.query.maybe_single()
        return self

    def execute(self):
        """Synchronous execution for backward compatibility with established store patterns."""
        return self.query.execute()

    async def async_execute(self):
        """Asynchronous execution for modern FastAPI routes."""
        import asyncio
        # supabase-py's SyncRequestBuilder is synchronous. 
        # We wrap it in a thread to prevent blocking the event loop.
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.query.execute)


class ScopedSupabase:
    """
    User-scoped Supabase interface.
    Uses either JWT-based Postgrest client (best) or institution_id filtering (legacy/fallback).
    """
    def __init__(self, user: dict):
        self.user = user
        self.role = user.get("role")
        self.is_super_admin = (self.role == "super_admin")
        self.institution_id = user.get("college_id") or user.get("institution_id")
        self.jwt = user.get("access_token")
        
        self._scoped_client = None
        # We disable JWT-based scoping for Supabase because the backend's access_token
        # is signed with the backend's secret, not Supabase's. Using it triggers PGRST301.
        # The ScopedQueryBuilder already applies manual filtering based on institution_id.

    def get_client(self) -> Any:
        """Returns the Postgrest client for direct usage."""
        return self._scoped_client or supabase_db.get_client()

    def table(self, table_name: str, show_deleted: bool = False) -> ScopedQueryBuilder:
        return ScopedQueryBuilder(
            table_name, 
            self.institution_id, 
            self.is_super_admin, 
            client=self._scoped_client,
            show_deleted=show_deleted
        )
    async def fetch_one(self, table: str, query_filter: Dict[str, Any], show_deleted: bool = False) -> Optional[Dict[str, Any]]:
        qb = self.table(table, show_deleted=show_deleted).select("*")
        for k, v in query_filter.items():
            qb = qb.eq(k, v)
        res = await qb.limit(1).async_execute()
        rows = _response_rows(res)
        return rows[0] if rows else None

    async def fetch_all(self, table: str, query_filter: Optional[Dict[str, Any]] = None, limit: int = 1000, show_deleted: bool = False) -> List[Dict[str, Any]]:
        qb = self.table(table, show_deleted=show_deleted).select("*")
        if query_filter:
            for k, v in query_filter.items():
                qb = qb.eq(k, v)
        res = await qb.limit(limit).async_execute()
        return _response_rows(res)

    async def insert(self, table: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        res = await self.table(table).insert(data).async_execute()
        rows = _response_rows(res)
        return rows[0] if rows else None

    async def update(self, table: str, data: Dict[str, Any], query_filter: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        qb = self.table(table).update(data)
        for k, v in query_filter.items():
            qb = qb.eq(k, v)
        res = await qb.async_execute()
        rows = _response_rows(res)
        return rows[0] if rows else None

    async def upsert(self, table: str, data: Dict[str, Any], on_conflict: str = 'id') -> Optional[Dict[str, Any]]:
        res = await self.table(table).upsert(data, on_conflict=on_conflict).async_execute()
        rows = _response_rows(res)
        return rows[0] if rows else None

    async def delete(self, table: str, query_filter: Dict[str, Any], permanent: bool = False) -> bool:
        if permanent:
            qb = self.table(table, show_deleted=True).delete()
        else:
            qb = self.table(table).soft_delete()
            
        for k, v in query_filter.items():
            qb = qb.eq(k, v)
        res = await qb.async_execute()
        return len(_response_rows(res)) > 0

    # ── Safe Write Wrappers ─────────────────────────────────────

    async def insert_safe(self, table: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Schema-safe insert. Strips unknown columns before inserting."""
        cols = await supabase_db.get_table_columns(table)
        safe_data = supabase_db._strip_unknown_columns(data, cols)
        try:
            result = await self.insert(table, safe_data)
            if result:
                return {"success": True, "data": result, "error": None}
            return {"success": True, "data": safe_data, "error": None}
        except Exception as e:
            return {"success": False, "data": None, "error": str(e)}

    async def update_safe(self, table: str, data: Dict[str, Any], query_filter: Dict[str, Any]) -> Dict[str, Any]:
        """Schema-safe update. Strips unknown columns before updating."""
        cols = await supabase_db.get_table_columns(table)
        safe_data = supabase_db._strip_unknown_columns(data, cols)
        for k in query_filter:
            safe_data.pop(k, None)
        try:
            result = await self.update(table, safe_data, query_filter)
            return {"success": True, "data": result, "error": None}
        except Exception as e:
            return {"success": False, "data": None, "error": str(e)}

    async def delete_safe(self, table: str, query_filter: Dict[str, Any], permanent: bool = False) -> Dict[str, Any]:
        """Schema-safe delete."""
        try:
            ok = await self.delete(table, query_filter, permanent=permanent)
            return {"success": ok, "data": None, "error": None}
        except Exception as e:
            return {"success": False, "data": None, "error": str(e)}

from app.api.deps import get_current_user
from fastapi import Depends

def get_scoped_db(user: dict = Depends(get_current_user)) -> ScopedSupabase:
    """
    Dependency to get a database client scoped to the current user's college.
    """
    return ScopedSupabase(user)
