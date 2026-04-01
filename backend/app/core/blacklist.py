import redis
from app.core.config import settings
import logging

logger = logging.getLogger("uvicorn.error")

try:
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    # Ping to verify connection
    redis_client.ping()
    REDIS_ENABLED = True
    logger.info("Sentinel Blacklist: Redis connection established.")
except Exception as e:
    logger.warning(f"Sentinel Blacklist: Redis connection failed ({str(e)}). Falling back to MemoryStore (Non-Persistent).")
    REDIS_ENABLED = False
    _memory_blacklist = set()

def blacklist_token(jti: str, expires_in_seconds: int):
    """Revokes a token by its JTI."""
    if REDIS_ENABLED:
        try:
            redis_client.setex(f"revoked:{jti}", expires_in_seconds, "1")
            return True
        except Exception as e:
            logger.error(f"Sentinel Blacklist: Redis set failed: {str(e)}")
            return False
    else:
        _memory_blacklist.add(jti)
        return True

def is_token_revoked(jti: str) -> bool:
    """Checks if a JTI is present in the blacklist."""
    if not jti:
        return False
    if REDIS_ENABLED:
        try:
            return redis_client.exists(f"revoked:{jti}") > 0
        except Exception as e:
            logger.error(f"Sentinel Blacklist: Redis get failed: {str(e)}")
            return False
    else:
        return jti in _memory_blacklist
