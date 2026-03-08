from supabase import create_client, Client
from app.core.config import settings
from app.core.logging import structlog

log = structlog.get_logger()

class SupabaseManager:
    """
    Supabase client manager for data operations.
    """

    _client: Client = None
    _init_attempted = False
    _last_error = None

    @classmethod
    def get_client(cls) -> Client:
        if cls._client is not None:
            return cls._client
        if cls._init_attempted:
            return None

        cls._init_attempted = True
        if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
            cls._last_error = "Supabase configuration is missing"
            log.warning("supabase_config_missing")
            return None

        try:
            cls._client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
            cls._last_error = None
            log.info("supabase_client_initialized")
        except Exception as exc:
            cls._last_error = str(exc)
            cls._client = None
            log.warning("supabase_client_initialization_failed", error=str(exc))
        return cls._client

    @property
    def client(self) -> Client:
        return self.get_client()

    @property
    def last_error(self):
        return self.__class__._last_error

supabase_db = SupabaseManager()
