"""
Performance optimization utilities for backend.
Includes caching, connection pooling, and request optimization.
"""

import functools
import hashlib
import json
from typing import Any, Callable, Optional
import asyncio
from datetime import timedelta

# Redis client for caching
try:
    from app.store.redis_client import redis_client

    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    redis_client = None


def cache_key(*args, **kwargs) -> str:
    """Generate a cache key from function arguments."""
    key_data = json.dumps({"args": args, "kwargs": kwargs}, sort_keys=True)
    return hashlib.md5(key_data.encode(), usedforsecurity=False).hexdigest()  # nosec B324


def redis_cache(ttl: int = 300):
    """
    Decorator to cache function results in Redis.

    Args:
        ttl: Time to live in seconds (default: 5 minutes)
    """

    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            if not REDIS_AVAILABLE:
                return await func(*args, **kwargs)

            # Generate cache key
            key = f"cache:{func.__name__}:{cache_key(*args, **kwargs)}"

            # Try to get from cache
            try:
                cached = await redis_client.get(key)
                if cached:
                    return json.loads(cached)
            except Exception:
                pass  # Cache miss or error, continue to function

            # Execute function
            result = await func(*args, **kwargs)

            # Store in cache
            try:
                await redis_client.setex(key, ttl, json.dumps(result))
            except Exception:
                pass  # Cache write failed, but we have the result

            return result

        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            if not REDIS_AVAILABLE:
                return func(*args, **kwargs)

            # For sync functions, use simple in-memory cache
            # (Redis async operations require event loop)
            return func(*args, **kwargs)

        return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper

    return decorator


def memoize(maxsize: int = 128):
    """
    Simple in-memory memoization decorator.
    Use for expensive computations that don't need persistent caching.
    """

    def decorator(func: Callable) -> Callable:
        cache = {}
        cache_order = []

        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            key = cache_key(*args, **kwargs)

            if key in cache:
                return cache[key]

            result = func(*args, **kwargs)

            # Add to cache
            cache[key] = result
            cache_order.append(key)

            # Evict oldest if cache is full
            if len(cache_order) > maxsize:
                oldest = cache_order.pop(0)
                del cache[oldest]

            return result

        return wrapper

    return decorator


class RequestBatcher:
    """
    Batch multiple requests together to reduce overhead.
    Useful for AI API calls that support batching.
    """

    def __init__(self, batch_size: int = 10, wait_time: float = 0.1):
        self.batch_size = batch_size
        self.wait_time = wait_time
        self.queue = []
        self.processing = False

    async def add(self, item: Any) -> Any:
        """Add item to batch queue and wait for result."""
        future = asyncio.Future()
        self.queue.append((item, future))

        if len(self.queue) >= self.batch_size and not self.processing:
            await self._process_batch()
        elif not self.processing:
            # Start timer to process batch
            asyncio.create_task(self._wait_and_process())

        return await future

    async def _wait_and_process(self):
        """Wait for more items or timeout, then process."""
        await asyncio.sleep(self.wait_time)
        if self.queue and not self.processing:
            await self._process_batch()

    async def _process_batch(self):
        """Process the current batch."""
        if not self.queue or self.processing:
            return

        self.processing = True
        batch = self.queue[: self.batch_size]
        self.queue = self.queue[self.batch_size :]

        try:
            # Process batch (override in subclass)
            results = await self.process_batch([item for item, _ in batch])

            # Set results
            for (_, future), result in zip(batch, results):
                future.set_result(result)
        except Exception as e:
            # Set exception for all futures
            for _, future in batch:
                future.set_exception(e)
        finally:
            self.processing = False

    async def process_batch(self, items: list) -> list:
        """Override this method to implement batch processing."""
        raise NotImplementedError


def debounce(wait: float):
    """
    Debounce decorator - only execute function after wait seconds of inactivity.
    Useful for search inputs, auto-save, etc.
    """

    def decorator(func: Callable) -> Callable:
        timer = None

        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            nonlocal timer

            if timer:
                timer.cancel()

            async def delayed():
                await asyncio.sleep(wait)
                await func(*args, **kwargs)

            timer = asyncio.create_task(delayed())
            return timer

        return async_wrapper

    return decorator


def rate_limit(calls: int, period: float):
    """
    Rate limiting decorator.

    Args:
        calls: Number of calls allowed
        period: Time period in seconds
    """

    def decorator(func: Callable) -> Callable:
        timestamps = []

        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            import time

            now = time.time()

            # Remove old timestamps
            timestamps[:] = [ts for ts in timestamps if now - ts < period]

            if len(timestamps) >= calls:
                # Rate limit exceeded
                raise Exception(f"Rate limit exceeded: {calls} calls per {period}s")

            timestamps.append(now)
            return await func(*args, **kwargs)

        return async_wrapper

    return decorator


# Connection pool for database connections
class ConnectionPool:
    """Simple connection pool implementation."""

    def __init__(self, create_connection: Callable, max_size: int = 10):
        self.create_connection = create_connection
        self.max_size = max_size
        self.pool = []
        self.in_use = set()

    async def acquire(self):
        """Get a connection from the pool."""
        if self.pool:
            conn = self.pool.pop()
        elif len(self.in_use) < self.max_size:
            conn = await self.create_connection()
        else:
            # Wait for a connection to be released
            while not self.pool:
                await asyncio.sleep(0.1)
            conn = self.pool.pop()

        self.in_use.add(conn)
        return conn

    async def release(self, conn):
        """Return a connection to the pool."""
        if conn in self.in_use:
            self.in_use.remove(conn)
            self.pool.append(conn)

    async def close_all(self):
        """Close all connections."""
        for conn in self.pool + list(self.in_use):
            try:
                await conn.close()
            except Exception:
                pass
        self.pool.clear()
        self.in_use.clear()
