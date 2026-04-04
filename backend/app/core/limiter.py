from typing import Optional
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.core.config import settings
import os
import logging

logger = logging.getLogger("uvicorn.error")

# Initialize global limiter (L5 Sentinel)
# Fallback to in-memory if Redis is not configured or in dev
enabled = os.environ.get("TESTING", "false").lower() != "true" and os.environ.get("ENV", "dev").lower() != "test"

# Use generous limits in local dev (default ENV=dev) to prevent auth-polling exhaustion.
# Tighten these for production deployments via ENV=production.
is_production = os.environ.get("ENV", "dev").lower() == "production"
default_limits = ["2000/day", "2000/hour"] if (enabled and not is_production) else (["500/day", "200/hour"] if enabled else [])

# Determine storage URI — fall back to in-memory if Redis is unavailable.
_storage_uri: Optional[str] = None
if enabled and settings.REDIS_URL:
    try:
        import redis as _redis_module
        _r = _redis_module.from_url(settings.REDIS_URL, socket_connect_timeout=2)
        _r.ping()
        _storage_uri = settings.REDIS_URL
        logger.info(f"rate_limiter_using_redis: {settings.REDIS_URL}")
    except Exception as _redis_err:
        logger.warning(f"rate_limiter_redis_unavailable_falling_back_to_memory: {_redis_err}")
        _storage_uri = None

limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=_storage_uri,
    default_limits=default_limits,
    enabled=enabled
)

