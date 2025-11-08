"""
Redis-based caching service for RAG operations
"""

from typing import Optional, Any, Dict, List
import json
import aioredis
import logging
from datetime import datetime, timedelta
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from fastapi_cache.decorator import cache

from config import settings

logger = logging.getLogger(__name__)

class CacheService:
    def __init__(self):
        self.redis_url = f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}"
        self.default_ttl = 3600  # 1 hour default TTL
        self._redis = None

    async def init(self):
        """Initialize Redis connection and FastAPI cache"""
        try:
            self._redis = await aioredis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True
            )
            
            # Initialize FastAPI cache with Redis backend
            redis_cache = RedisBackend(self._redis)
            FastAPICache.init(redis_cache, prefix="lumnia-cache:")
            
            logger.info("Cache service initialized successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize cache service: {str(e)}")
            return False

    async def get_cached_embeddings(self, text_hash: str) -> Optional[List[float]]:
        """Get cached embeddings for a text"""
        try:
            cached = await self._redis.get(f"embedding:{text_hash}")
            if cached:
                return json.loads(cached)
            return None
        except Exception as e:
            logger.error(f"Error getting cached embeddings: {str(e)}")
            return None

    async def cache_embeddings(self, text_hash: str, embeddings: List[float], ttl: int = None):
        """Cache embeddings for a text"""
        try:
            await self._redis.set(
                f"embedding:{text_hash}",
                json.dumps(embeddings),
                ex=ttl or self.default_ttl
            )
        except Exception as e:
            logger.error(f"Error caching embeddings: {str(e)}")

    async def get_course_chunks(self, course_id: str) -> Optional[List[Dict[str, Any]]]:
        """Get cached chunks for a course"""
        try:
            cached = await self._redis.get(f"course_chunks:{course_id}")
            if cached:
                return json.loads(cached)
            return None
        except Exception as e:
            logger.error(f"Error getting cached course chunks: {str(e)}")
            return None

    async def cache_course_chunks(self, course_id: str, chunks: List[Dict[str, Any]], ttl: int = None):
        """Cache chunks for a course"""
        try:
            await self._redis.set(
                f"course_chunks:{course_id}",
                json.dumps(chunks),
                ex=ttl or self.default_ttl
            )
        except Exception as e:
            logger.error(f"Error caching course chunks: {str(e)}")

    async def invalidate_course_cache(self, course_id: str):
        """Invalidate all cached data for a course"""
        try:
            keys = await self._redis.keys(f"*{course_id}*")
            if keys:
                await self._redis.delete(*keys)
            logger.info(f"Invalidated cache for course {course_id}")
        except Exception as e:
            logger.error(f"Error invalidating course cache: {str(e)}")

    async def get_search_results(self, query_hash: str) -> Optional[List[Dict[str, Any]]]:
        """Get cached search results"""
        try:
            cached = await self._redis.get(f"search:{query_hash}")
            if cached:
                return json.loads(cached)
            return None
        except Exception as e:
            logger.error(f"Error getting cached search results: {str(e)}")
            return None

    async def cache_search_results(
        self,
        query_hash: str,
        results: List[Dict[str, Any]],
        ttl: int = None
    ):
        """Cache search results"""
        try:
            await self._redis.set(
                f"search:{query_hash}",
                json.dumps(results),
                ex=ttl or 1800  # 30 minutes default for search results
            )
        except Exception as e:
            logger.error(f"Error caching search results: {str(e)}")

    @cache(expire=300)  # 5 minutes cache for stats
    async def get_course_stats(self, course_id: str) -> Dict[str, Any]:
        """Get cached course statistics"""
        return {
            "total_chunks": await self._redis.get(f"stats:chunks:{course_id}") or 0,
            "last_updated": await self._redis.get(f"stats:updated:{course_id}"),
            "cache_hits": await self._redis.get(f"stats:hits:{course_id}") or 0
        }

    async def update_course_stats(self, course_id: str, stats: Dict[str, Any]):
        """Update course statistics"""
        try:
            pipeline = self._redis.pipeline()
            pipeline.set(f"stats:chunks:{course_id}", stats.get("total_chunks", 0))
            pipeline.set(f"stats:updated:{course_id}", datetime.utcnow().isoformat())
            pipeline.incr(f"stats:hits:{course_id}")
            await pipeline.execute()
        except Exception as e:
            logger.error(f"Error updating course stats: {str(e)}")

    async def close(self):
        """Close Redis connection"""
        if self._redis:
            await self._redis.close()