"""
Base Store Mixin - Provides safe database operations for all stores.

This mixin ensures:
1. Schema resilience (dynamic column discovery)
2. Graceful error handling (no crashes)
3. Structured response format
4. Comprehensive logging
5. Multi-tenant scoping
"""

from typing import Dict, Any, List, Optional, Tuple
from app.core.logging import structlog

log = structlog.get_logger()


class BaseStoreMixin:
    """
    Provides safe database operation wrappers for all stores.
    Expected: self.db is a SupabaseManager instance.
    """

    async def insert_safely(
        self,
        table: str,
        data: Dict[str, Any],
        **log_context: Any
    ) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Safe insert with schema discovery and graceful failure.

        Returns:
            (success: bool, data: dict | None, error: str | None)
        """
        try:
            result = await self.db.insert_safe(table, data)
            if result.get("success"):
                log.debug(f"insert_success", table=table, **log_context)
                return True, result.get("data"), None
            else:
                error_msg = result.get("error", "Unknown error")
                log.warning(f"insert_failed", table=table, error=error_msg, **log_context)
                return False, None, error_msg
        except Exception as e:
            log.error(f"insert_exception", table=table, error=str(e), **log_context)
            return False, None, str(e)

    async def update_safely(
        self,
        table: str,
        data: Dict[str, Any],
        query_filter: Dict[str, Any],
        **log_context: Any
    ) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Safe update with schema discovery and graceful failure.

        Returns:
            (success: bool, data: dict | None, error: str | None)
        """
        try:
            result = await self.db.update_safe(table, data, query_filter)
            if result.get("success"):
                log.debug(f"update_success", table=table, **log_context)
                return True, result.get("data"), None
            else:
                error_msg = result.get("error", "Unknown error")
                log.warning(f"update_failed", table=table, error=error_msg, **log_context)
                return False, None, error_msg
        except Exception as e:
            log.error(f"update_exception", table=table, error=str(e), **log_context)
            return False, None, str(e)

    async def delete_safely(
        self,
        table: str,
        query_filter: Dict[str, Any],
        **log_context: Any
    ) -> Tuple[bool, Optional[str]]:
        """
        Safe delete with graceful failure.

        Returns:
            (success: bool, error: str | None)
        """
        try:
            result = await self.db.delete_safe(table, query_filter)
            if result.get("success"):
                log.debug(f"delete_success", table=table, **log_context)
                return True, None
            else:
                error_msg = result.get("error", "Unknown error")
                log.warning(f"delete_failed", table=table, error=error_msg, **log_context)
                return False, error_msg
        except Exception as e:
            log.error(f"delete_exception", table=table, error=str(e), **log_context)
            return False, str(e)

    async def fetch_one_safely(
        self,
        table: str,
        query_filter: Dict[str, Any],
        **log_context: Any
    ) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Safe fetch single record.

        Returns:
            (success: bool, data: dict | None, error: str | None)
        """
        try:
            data = await self.db.fetch_one(table, query_filter)
            if data:
                log.debug(f"fetch_one_success", table=table, **log_context)
                return True, data, None
            else:
                return True, None, None  # Not an error - just not found
        except Exception as e:
            log.error(f"fetch_one_exception", table=table, error=str(e), **log_context)
            return False, None, str(e)

    async def fetch_all_safely(
        self,
        table: str,
        query_filter: Optional[Dict[str, Any]] = None,
        limit: Optional[int] = None,
        **log_context: Any
    ) -> Tuple[bool, List[Dict[str, Any]], Optional[str]]:
        """
        Safe fetch multiple records.

        Returns:
            (success: bool, data: list[dict], error: str | None)
        """
        try:
            data = await self.db.fetch_all(table, query_filter, limit)
            log.debug(f"fetch_all_success", table=table, count=len(data), **log_context)
            return True, data, None
        except Exception as e:
            log.error(f"fetch_all_exception", table=table, error=str(e), **log_context)
            return False, [], str(e)

    def normalize_response(
        self,
        operation: str,
        success: bool,
        data: Any = None,
        error: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Standardize response format across all stores.

        Returns:
            { "success": bool, "data": any, "error": str | None, "operation": str }
        """
        return {
            "success": success,
            "data": data,
            "error": error,
            "operation": operation
        }
