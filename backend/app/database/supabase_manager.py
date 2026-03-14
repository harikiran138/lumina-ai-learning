import httpx
import os
import sys
from supabase import create_client, Client
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
    Supabase client manager for data operations.
    """

    _client: Client = None
    _init_attempted = False
    _last_error = None

    @classmethod
    def get_client(cls) -> Client:
        if cls._should_disable_client():
            cls._last_error = "Supabase disabled for local/test run"
            cls._init_attempted = True
            return None
        if cls._client is not None:
            return cls._client
        if cls._init_attempted:
            return None

        cls._init_attempted = True
        supabase_key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
        if not settings.SUPABASE_URL or not supabase_key:
            cls._last_error = "Supabase configuration is missing"
            log.warning("supabase_config_missing")
            return None

        try:
            cls._client = create_client(settings.SUPABASE_URL, supabase_key)
            cls._last_error = None
            log.info("supabase_client_initialized")
        except Exception as exc:
            cls._last_error = str(exc)
            cls._client = None
            # Allow retry on next call
            cls._init_attempted = False
            log.warning("supabase_client_initialization_failed", error=str(exc))
        return cls._client

    @classmethod
    def _should_disable_client(cls) -> bool:
        force_local = os.getenv("LUMINA_FORCE_LOCAL_STORE", "").strip().lower() in {
            "1",
            "true",
            "yes",
        }
        if force_local:
            return True

        running_pytest = bool(os.getenv("PYTEST_CURRENT_TEST")) or "pytest" in sys.modules
        if running_pytest and not settings.SUPABASE_SERVICE_ROLE_KEY:
            return True

        return False

    @property
    def client(self) -> Client:
        return self.get_client()

    @property
    def last_error(self):
        return self.__class__._last_error

supabase_db = SupabaseManager()
