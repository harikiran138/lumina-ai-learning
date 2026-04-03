from slowapi import Limiter
from slowapi.util import get_remote_address
from app.core.config import settings
import os

# Initialize global limiter (L5 Sentinel)
# Fallback to in-memory if Redis is not configured or in dev
enabled = os.environ.get("TESTING", "false").lower() != "true"
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=settings.REDIS_URL if enabled else None,
    default_limits=["200/day", "50/hour"] if enabled else [],
    enabled=enabled
)
