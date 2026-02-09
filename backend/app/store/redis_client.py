import os
import redis.asyncio as redis
from app.core.config import settings


class RedisClientProxy:
    def __init__(self):
        self.client = None

    async def _ensure_connection(self):
        if not self.client:
            redis_url = getattr(
                settings, "REDIS_URL", os.getenv("REDIS_URL", "redis://localhost:6379")
            )
            try:
                self.client = redis.from_url(redis_url, encoding="utf-8", decode_responses=True)
                await self.client.ping()
                # print(f"Connected to Redis at {redis_url}")
            except Exception:
                # print(f"Redis connection failed: {e}")
                self.client = None

    async def get(self, key, *args, **kwargs):
        await self._ensure_connection()
        if self.client:
            return await self.client.get(key, *args, **kwargs)
        return None

    async def setex(self, name, time, value):
        await self._ensure_connection()
        if self.client:
            return await self.client.setex(name, time, value)

    async def keys(self, pattern):
        await self._ensure_connection()
        if self.client:
            return await self.client.keys(pattern)
        return []

    async def delete(self, *names):
        await self._ensure_connection()
        if self.client:
            return await self.client.delete(*names)

    async def ping(self):
        await self._ensure_connection()
        if self.client:
            return await self.client.ping()
        raise Exception("Redis client not connected")

    async def close(self):
        if self.client:
            await self.client.close()


redis_client = RedisClientProxy()
