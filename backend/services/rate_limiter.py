"""
Rate limiting service for API endpoints
"""

from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from redis import Redis
from typing import Dict, Any, Optional
import os
from loguru import logger

class RateLimiter:
    def __init__(self, redis_url: str = None):
        self.redis_url = redis_url or os.getenv("REDIS_URL", "redis://redis:6379")
        self.limiter = None
        self._initialize_limiter()

    def _initialize_limiter(self):
        """Initialize Flask-Limiter with Redis storage"""
        try:
            # Create Redis connection for rate limiting
            redis_conn = Redis.from_url(self.redis_url)

            # Initialize limiter with Redis storage
            self.limiter = Limiter(
                key_func=get_remote_address,
                storage_uri=self.redis_url,
                storage_options={"socket_connect_timeout": 30},
                strategy="fixed-window"  # Fixed window strategy
            )

            logger.info("Rate limiter initialized with Redis storage")
        except Exception as e:
            logger.warning(f"Failed to initialize Redis rate limiter: {e}. Using in-memory storage.")
            # Fallback to in-memory storage
            self.limiter = Limiter(
                key_func=get_remote_address,
                storage_uri="memory://"
            )

    def get_limiter(self):
        """Get the Flask-Limiter instance"""
        return self.limiter

    def get_limit_status(self, key: str, endpoint: str) -> Dict[str, Any]:
        """Get current rate limit status for a key and endpoint"""
        try:
            # This is a simplified status check
            # In production, you might want to implement more detailed tracking
            return {
                "endpoint": endpoint,
                "key": key,
                "limited": False,  # Would need custom implementation for detailed status
                "remaining": None,
                "reset_time": None
            }
        except Exception as e:
            logger.error(f"Error getting rate limit status: {e}")
            return {"error": str(e)}

    def reset_limits(self, key: str = None):
        """Reset rate limits for a specific key or all keys"""
        try:
            if key:
                # Reset specific key (would need custom implementation)
                logger.info(f"Resetting rate limits for key: {key}")
            else:
                # Reset all limits (dangerous in production!)
                logger.warning("Resetting all rate limits")
                # Implementation would depend on storage backend
        except Exception as e:
            logger.error(f"Error resetting rate limits: {e}")

# Global rate limiter instance
rate_limiter = RateLimiter()

# Rate limit decorators for common use cases
def auth_rate_limit():
    """Rate limit for authentication endpoints"""
    limit = os.getenv("RATE_LIMIT_AUTH", "5/minute")
    return rate_limiter.limiter.limit(limit)

def api_rate_limit():
    """Rate limit for general API endpoints"""
    limit = os.getenv("RATE_LIMIT_API", "100/hour")
    return rate_limiter.limiter.limit(limit)

def assessment_rate_limit():
    """Rate limit for assessment generation"""
    limit = os.getenv("RATE_LIMIT_ASSESSMENT", "10/hour")
    return rate_limiter.limiter.limit(limit)

def content_upload_rate_limit():
    """Rate limit for content uploads"""
    limit = os.getenv("RATE_LIMIT_UPLOAD", "20/hour")
    return rate_limiter.limiter.limit(limit)
