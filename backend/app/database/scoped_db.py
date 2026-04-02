from typing import Any, Dict, Optional, List
from supabase import create_client, ClientOptions
from app.core.config import settings
from .supabase_manager import supabase_db, SupabaseManager
from fastapi import HTTPException

class ScopedQueryBuilder:
    def __init__(self, table_name: str, institution_id: str, is_super_admin: bool = False, client=None):
        self.table_name = table_name
        self.institution_id = institution_id
        self.is_super_admin = is_super_admin
        # Use provided scoped client or fall back to global
        self.client = client or supabase_db.get_client()
        self.query = self.client.table(table_name)
        
        # Apply institution filter if not super admin
        if not is_super_admin and institution_id:
            self.query = self.query.eq("institution_id", institution_id)

    def select(self, columns: str = "*"):
        self.query = self.query.select(columns)
        return self

    def insert(self, data: Dict[str, Any]):
        if not self.is_super_admin and self.institution_id:
            # Force institution_id on insert
            if isinstance(data, list):
                for item in data:
                    item["institution_id"] = self.institution_id
            else:
                data["institution_id"] = self.institution_id
        self.query = self.query.insert(data)
        return self

    def upsert(self, data: Dict[str, Any], on_conflict: str = 'id'):
        if not self.is_super_admin and self.institution_id:
            if isinstance(data, list):
                for item in data:
                    item["institution_id"] = self.institution_id
            else:
                data["institution_id"] = self.institution_id
        self.query = self.query.upsert(data, on_conflict=on_conflict)
        return self

    def update(self, data: Dict[str, Any]):
        self.query = self.query.update(data)
        return self

    def delete(self):
        self.query = self.query.delete()
        return self

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
        return self.query.execute()


class ScopedSupabase:
    """
    User-scoped Supabase interface.
    Uses either JWT-based Postgrest client (best) or institution_id filtering (legacy/fallback).
    """
    def __init__(self, user: dict):
        self.user = user
        self.role = user.get("role")
        self.is_super_admin = (self.role == "super_admin")
        self.institution_id = user.get("institution_id") or user.get("college_id")
        self.jwt = user.get("access_token")
        
        self._scoped_client = None
        if self.jwt and not self.is_super_admin:
            try:
                # Use a lightweight client with the user's JWT for RLS
                from supabase import create_client, ClientOptions
                self._scoped_client = create_client(
                    settings.SUPABASE_URL,
                    settings.SUPABASE_ANON_KEY,
                    options=ClientOptions(headers={"Authorization": f"Bearer {self.jwt}"})
                )
            except Exception:
                self._scoped_client = None

    def get_client(self) -> Any:
        """Returns the Postgrest client for direct usage."""
        return self._scoped_client or supabase_db.get_client()

    def table(self, table_name: str) -> ScopedQueryBuilder:
        return ScopedQueryBuilder(
            table_name, 
            self.institution_id, 
            self.is_super_admin, 
            client=self._scoped_client
        )
    async def fetch_one(self, table: str, query_filter: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        qb = self.table(table).select("*")
        for k, v in query_filter.items():
            qb = qb.eq(k, v)
        res = qb.limit(1).execute()
        return res.data[0] if res.data else None

    async def fetch_all(self, table: str, query_filter: Optional[Dict[str, Any]] = None, limit: int = 1000) -> List[Dict[str, Any]]:
        qb = self.table(table).select("*")
        if query_filter:
            for k, v in query_filter.items():
                qb = qb.eq(k, v)
        res = qb.limit(limit).execute()
        return res.data or []

    async def insert(self, table: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        res = self.table(table).insert(data).execute()
        return res.data[0] if res.data else None

    async def update(self, table: str, data: Dict[str, Any], query_filter: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        qb = self.table(table).update(data)
        for k, v in query_filter.items():
            qb = qb.eq(k, v)
        res = qb.execute()
        return res.data[0] if res.data else None

    async def upsert(self, table: str, data: Dict[str, Any], on_conflict: str = 'id') -> Optional[Dict[str, Any]]:
        res = self.table(table).upsert(data, on_conflict=on_conflict).execute()
        return res.data[0] if res.data else None

    async def delete(self, table: str, query_filter: Dict[str, Any]) -> bool:
        qb = self.table(table).delete()
        for k, v in query_filter.items():
            qb = qb.eq(k, v)
        res = qb.execute()
        return len(res.data) > 0

def get_scoped_db(user: dict) -> ScopedSupabase:
    return ScopedSupabase(user)
