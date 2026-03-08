from supabase import create_client, Client
from app.core.config import settings
from app.core.logging import structlog

log = structlog.get_logger()

class SupabaseManager:
    """
    Supabase client manager for data operations.
    """
    
    _client: Client = None

    @classmethod
    def get_client(cls) -> Client:
        if cls._client is None:
            if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
                log.error("supabase_config_missing")
                raise Exception("Supabase configuration is missing")
            
            cls._client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
            log.info("supabase_client_initialized")
        
        return cls._client

supabase_db = SupabaseManager()
