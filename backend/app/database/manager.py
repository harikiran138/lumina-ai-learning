import asyncio
from app.core.logging import structlog
from app.database.supabase_manager import supabase_db

log = structlog.get_logger(__name__)

class DatabaseManager:
    """
    Deprecated MongoDB Database Manager. 
    Now serves as a proxy for any remaining generic DB checks, 
    but all actual data is in Supabase.
    """
    db = None

    @classmethod
    async def connect(cls):
        """
        Ensure Supabase is ready.
        """
        try:
            supabase_db.get_client()
            log.info("supabase_connected")
        except Exception as e:
            log.error("supabase_connection_failed", error=str(e))
            raise e

    @classmethod
    async def close(cls):
        """
        Close connections (No-op for Supabase REST client).
        """
        log.info("database_connection_closed")

    @classmethod
    def get_db(cls):
        return None

db = DatabaseManager()
