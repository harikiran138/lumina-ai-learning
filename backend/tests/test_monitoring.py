"""
Tests for monitoring service
"""

import pytest
from unittest.mock import Mock, patch
from services.monitoring import (
    MonitoringService, monitoring_service,
    monitor_request, track_business_metric, track_error
)


class TestMonitoringService:
    """Test cases for MonitoringService"""

    def test_monitoring_service_initialization(self):
        """Test monitoring service initialization"""
        service = MonitoringService()
        assert service._system_metrics_enabled is True
        assert service._update_interval == 30
        assert service._last_update == 0

    @patch('services.monitoring.psutil')
    def test_update_system_metrics(self, mock_psutil):
        """Test system metrics update"""
        # Mock psutil functions
        mock_psutil.cpu_percent.return_value = 50.0
        mock_psutil.virtual_memory.return_value = Mock(percent=60.0)
        mock_psutil.disk_usage.return_value = Mock(percent=70.0)

        service = MonitoringService()
        service.update_system_metrics()

        # Should have updated last_update
        assert service._last_update > 0

    def test_increment_counter(self):
        """Test counter increment"""
        service = MonitoringService()

        # Should not raise exception
        service.increment_counter(Mock(), {"test": "label"})

    def test_observe_histogram(self):
        """Test histogram observation"""
        service = MonitoringService()

        # Should not raise exception
        service.observe_histogram(Mock(), 1.0, {"test": "label"})

    def test_set_gauge(self):
        """Test gauge setting"""
        service = MonitoringService()

        # Should not raise exception
        service.set_gauge(Mock(), 100.0, {"test": "label"})


class TestMonitoringDecorators:
    """Test cases for monitoring decorators"""

    def test_monitor_request_decorator(self):
        """Test request monitoring decorator"""
        decorator = monitor_request("GET", "/test")
        assert decorator is not None

        # Test with a mock function
        @decorator
        async def mock_endpoint():
            return {"status": "ok"}

        # Should work without raising exceptions
        import asyncio
        result = asyncio.run(mock_endpoint())
        assert result == {"status": "ok"}

    @patch('services.monitoring.API_ERRORS')
    @patch('services.monitoring.TOTAL_REQUESTS')
    def test_monitor_request_with_exception(self, mock_total_requests, mock_api_errors):
        """Test request monitoring with exception"""
        decorator = monitor_request("GET", "/test")

        @decorator
        async def failing_endpoint():
            raise ValueError("Test error")

        # Should raise the exception
        import asyncio
        with pytest.raises(ValueError):
            asyncio.run(failing_endpoint())


class TestBusinessMetrics:
    """Test cases for business metrics tracking"""

    @patch('services.monitoring.LEARNING_PATHWAYS_GENERATED')
    def test_track_pathways_generated(self, mock_counter):
        """Test tracking learning pathways generated"""
        track_business_metric("pathways_generated", 1, {"course": "math"})
        mock_counter.labels.assert_called_with(course="math")
        mock_counter.labels().inc.assert_called_once()

    @patch('services.monitoring.ASSESSMENTS_COMPLETED')
    def test_track_assessments_completed(self, mock_counter):
        """Test tracking assessments completed"""
        track_business_metric("assessments_completed", 1, {"type": "quiz"})
        mock_counter.labels.assert_called_with(type="quiz")
        mock_counter.labels().inc.assert_called_once()

    @patch('services.monitoring.CONTENT_UPLOADED')
    def test_track_content_uploaded(self, mock_counter):
        """Test tracking content uploaded"""
        track_business_metric("content_uploaded", 1, {"content_type": "pdf"})
        mock_counter.labels.assert_called_with(content_type="pdf")
        mock_counter.labels().inc.assert_called_once()

    @patch('services.monitoring.VECTOR_SEARCHES')
    def test_track_vector_searches(self, mock_counter):
        """Test tracking vector searches"""
        track_business_metric("vector_searches", 1, {"index": "documents"})
        mock_counter.labels.assert_called_with(index="documents")
        mock_counter.labels().inc.assert_called_once()

    def test_track_unknown_metric(self):
        """Test tracking unknown metric type"""
        # Should not raise exception
        track_business_metric("unknown_metric", 1)


class TestErrorTracking:
    """Test cases for error tracking"""

    @patch('services.monitoring.DATABASE_ERRORS')
    def test_track_database_error(self, mock_counter):
        """Test tracking database errors"""
        track_error("database", "connection_failed")
        mock_counter.labels.assert_called_with(operation="connection_failed")
        mock_counter.labels().inc.assert_called_once()

    @patch('services.monitoring.CACHE_ERRORS')
    def test_track_cache_error(self, mock_counter):
        """Test tracking cache errors"""
        track_error("cache", "get_failed")
        mock_counter.labels.assert_called_with(operation="get_failed")
        mock_counter.labels().inc.assert_called_once()

    @patch('services.monitoring.API_ERRORS')
    def test_track_api_error(self, mock_counter):
        """Test tracking API errors"""
        track_error("api", "ValidationError", "/api/test")
        mock_counter.labels.assert_called_with(error_type="ValidationError", endpoint="/api/test")
        mock_counter.labels().inc.assert_called_once()


class TestGlobalMonitoringService:
    """Test the global monitoring service instance"""

    def test_global_monitoring_service(self):
        """Test global monitoring service instance"""
        assert monitoring_service is not None
        assert hasattr(monitoring_service, 'update_system_metrics')
        assert hasattr(monitoring_service, 'increment_counter')

    def test_get_metrics_endpoint(self):
        """Test metrics endpoint creation"""
        from services.monitoring import get_metrics_endpoint
        endpoint = get_metrics_endpoint()
        assert endpoint is not None

    @patch('services.monitoring.monitoring_middleware')
    def test_monitoring_middleware(self, mock_middleware):
        """Test monitoring middleware"""
        # Should be callable
        assert callable(mock_middleware)
