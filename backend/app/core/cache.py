"""
Caching utilities for FastAPI routes using Redis
"""
from functools import wraps
from typing import Optional, Callable, Any
import json
import hashlib
from app.store.redis_client import redis_client
import structlog

logger = structlog.get_logger()


def cache_key(*args, **kwargs) -> str:
    """Generate a cache key from function arguments"""
    key_data = json.dumps({"args": args, "kwargs": kwargs}, sort_keys=True, default=str)
    return hashlib.md5(key_data.encode(), usedforsecurity=False).hexdigest()  # nosec B324


def cached(
    ttl: int = 300,  # 5 minutes default
    prefix: str = "cache",
    key_builder: Optional[Callable] = None,
):
    """
    Decorator to cache API route responses in Redis

    Args:
        ttl: Time to live in seconds
        prefix: Cache key prefix
        key_builder: Optional custom function to build cache key

    Usage:
        @cached(ttl=600, prefix="courses")
        async def get_courses():
            return await fetch_courses()
    """

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            # Build cache key
            if key_builder:
                cache_suffix = key_builder(*args, **kwargs)
            else:
                cache_suffix = cache_key(*args, **kwargs)

            full_key = f"{prefix}:{cache_suffix}"

            # Try to get from cache
            try:
                cached_value = await redis_client.get(full_key)
                if cached_value:
                    logger.info("cache_hit", key=full_key)
                    return json.loads(cached_value)
            except Exception as e:
                logger.warning("cache_read_error", error=str(e), key=full_key)

            # Execute function
            result = await func(*args, **kwargs)

            # Store in cache
            try:
                await redis_client.setex(full_key, ttl, json.dumps(result, default=str))
                logger.info("cache_set", key=full_key, ttl=ttl)
            except Exception as e:
                logger.warning("cache_write_error", error=str(e), key=full_key)

            return result

        return wrapper

    return decorator


async def invalidate_cache(pattern: str):
    """
    Invalidate all cache keys matching a pattern

    Args:
        pattern: Redis key pattern (e.g., "courses:*")
    """
    try:
        keys = await redis_client.keys(pattern)
        if keys:
            await redis_client.delete(*keys)
            logger.info("cache_invalidated", pattern=pattern, count=len(keys))
    except Exception as e:
        logger.error("cache_invalidation_error", error=str(e), pattern=pattern)
