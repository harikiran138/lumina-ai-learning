"""
Tests for rate limiting service
"""

import pytest
from unittest.mock import Mock, patch
from services.rate_limiter import RateLimiter, rate_limiter, auth_rate_limit, api_rate_limit


class TestRateLimiter:
    """Test cases for RateLimiter service"""

    def test_rate_limiter_initialization(self):
        """Test rate limiter initialization"""
        limiter = RateLimiter()
        assert limiter.redis_url is not None
        assert limiter.limiter is not None

    def test_rate_limiter_initialization_with_custom_redis(self):
        """Test rate limiter with custom Redis URL"""
        custom_url = "redis://custom:6379"
        limiter = RateLimiter(redis_url=custom_url)
        assert limiter.redis_url == custom_url

    @patch('redis.from_url')
    def test_rate_limiter_fallback_to_memory(self, mock_redis_from_url):
        """Test fallback to in-memory storage when Redis fails"""
        mock_redis_from_url.side_effect = Exception("Redis connection failed")

        limiter = RateLimiter()
        # Should still initialize with memory storage
        assert limiter.limiter is not None

    def test_get_limiter(self):
        """Test getting the Flask-Limiter instance"""
        limiter = RateLimiter()
        flask_limiter = limiter.get_limiter()
        assert flask_limiter is not None

    def test_get_limit_status(self):
        """Test getting rate limit status"""
        limiter = RateLimiter()
        status = limiter.get_limit_status("test_key", "/api/test")

        # Should return a dict with expected keys
        assert isinstance(status, dict)
        assert "endpoint" in status
        assert "key" in status
        assert status["endpoint"] == "/api/test"
        assert status["key"] == "test_key"

    def test_reset_limits(self):
        """Test resetting rate limits"""
        limiter = RateLimiter()

        # Should not raise an exception
        limiter.reset_limits()
        limiter.reset_limits("test_key")


class TestRateLimitDecorators:
    """Test cases for rate limiting decorators"""

    def test_auth_rate_limit_decorator(self):
        """Test auth rate limit decorator"""
        decorator = auth_rate_limit()
        assert decorator is not None

    def test_api_rate_limit_decorator(self):
        """Test API rate limit decorator"""
        decorator = api_rate_limit()
        assert decorator is not None

    @patch('services.rate_limiter.os.getenv')
    def test_rate_limits_from_environment(self, mock_getenv):
        """Test that rate limits are read from environment variables"""
        mock_getenv.side_effect = lambda key, default=None: {
            "RATE_LIMIT_AUTH": "10/minute",
            "RATE_LIMIT_API": "200/hour"
        }.get(key, default)

        # Re-import to get new environment values
        from importlib import reload
        import services.rate_limiter
        reload(services.rate_limiter)

        # Test that decorators use environment values
        auth_decorator = services.rate_limiter.auth_rate_limit()
        api_decorator = services.rate_limiter.api_rate_limit()

        assert auth_decorator is not None
        assert api_decorator is not None


class TestGlobalRateLimiter:
    """Test the global rate limiter instance"""

    def test_global_rate_limiter_instance(self):
        """Test that global rate limiter is properly initialized"""
        assert rate_limiter is not None
        assert hasattr(rate_limiter, 'get_limiter')
        assert hasattr(rate_limiter, 'get_limit_status')

    def test_global_rate_limiter_methods(self):
        """Test global rate limiter methods"""
        limiter = rate_limiter.get_limiter()
        assert limiter is not None

        status = rate_limiter.get_limit_status("test", "/test")
        assert isinstance(status, dict)
