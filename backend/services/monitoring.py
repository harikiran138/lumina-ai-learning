"""
Monitoring and metrics service for production deployment
"""

from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from fastapi import Request
from fastapi.responses import PlainTextResponse
import time
import psutil
from typing import Callable
from functools import wraps
from loguru import logger

# System metrics
SYSTEM_CPU_USAGE = Gauge('lumina_system_cpu_usage', 'System CPU usage percentage')
SYSTEM_MEMORY_USAGE = Gauge('lumina_system_memory_usage', 'System memory usage percentage')
SYSTEM_DISK_USAGE = Gauge('lumina_system_disk_usage', 'System disk usage percentage')

# Application metrics
ACTIVE_USERS = Gauge('lumina_active_users', 'Number of active users')
TOTAL_REQUESTS = Counter('lumina_requests_total', 'Total number of requests', ['method', 'endpoint', 'status'])
REQUEST_LATENCY = Histogram('lumina_request_duration_seconds', 'Request duration in seconds', ['method', 'endpoint'])
ACTIVE_CONNECTIONS = Gauge('lumina_active_connections', 'Number of active connections')

# Business metrics
LEARNING_PATHWAYS_GENERATED = Counter('lumina_pathways_generated_total', 'Total learning pathways generated')
ASSESSMENTS_COMPLETED = Counter('lumina_assessments_completed_total', 'Total assessments completed')
CONTENT_UPLOADED = Counter('lumina_content_uploaded_total', 'Total content uploaded', ['content_type'])
VECTOR_SEARCHES = Counter('lumina_vector_searches_total', 'Total vector searches performed')

# Error metrics
API_ERRORS = Counter('lumina_api_errors_total', 'Total API errors', ['error_type', 'endpoint'])
DATABASE_ERRORS = Counter('lumina_database_errors_total', 'Total database errors', ['operation'])
CACHE_ERRORS = Counter('lumina_cache_errors_total', 'Total cache errors', ['operation'])

class MonitoringService:
    """Service for collecting and exposing system and application metrics"""

    def __init__(self):
        self._system_metrics_enabled = True
        self._update_interval = 30  # seconds
        self._last_update = 0

    def update_system_metrics(self):
        """Update system-level metrics"""
        if not self._system_metrics_enabled:
            return

        current_time = time.time()
        if current_time - self._last_update < self._update_interval:
            return

        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            SYSTEM_CPU_USAGE.set(cpu_percent)

            # Memory usage
            memory = psutil.virtual_memory()
            SYSTEM_MEMORY_USAGE.set(memory.percent)

            # Disk usage
            disk = psutil.disk_usage('/')
            SYSTEM_DISK_USAGE.set(disk.percent)

            self._last_update = current_time
            logger.debug(f"Updated system metrics: CPU={cpu_percent}%, Memory={memory.percent}%, Disk={disk.percent}%")

        except Exception as e:
            logger.error(f"Failed to update system metrics: {e}")

    def increment_counter(self, counter: Counter, labels: dict = None):
        """Increment a counter metric"""
        try:
            if labels:
                counter.labels(**labels).inc()
            else:
                counter.inc()
        except Exception as e:
            logger.error(f"Failed to increment counter: {e}")

    def observe_histogram(self, histogram: Histogram, value: float, labels: dict = None):
        """Observe a histogram metric"""
        try:
            if labels:
                histogram.labels(**labels).observe(value)
            else:
                histogram.observe(value)
        except Exception as e:
            logger.error(f"Failed to observe histogram: {e}")

    def set_gauge(self, gauge: Gauge, value: float, labels: dict = None):
        """Set a gauge metric"""
        try:
            if labels:
                gauge.labels(**labels).set(value)
            else:
                gauge.set(value)
        except Exception as e:
            logger.error(f"Failed to set gauge: {e}")

# Global monitoring service instance
monitoring_service = MonitoringService()

def monitor_request(method: str, endpoint: str):
    """Decorator to monitor API requests"""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()

            try:
                # Get status from response if it's a FastAPI endpoint
                response = await func(*args, **kwargs)

                # Extract status code
                status_code = getattr(response, 'status_code', 200) if hasattr(response, 'status_code') else 200

                # Record metrics
                TOTAL_REQUESTS.labels(
                    method=method,
                    endpoint=endpoint,
                    status=status_code
                ).inc()

                REQUEST_LATENCY.labels(
                    method=method,
                    endpoint=endpoint
                ).observe(time.time() - start_time)

                return response

            except Exception as e:
                # Record error metrics
                API_ERRORS.labels(
                    error_type=type(e).__name__,
                    endpoint=endpoint
                ).inc()

                TOTAL_REQUESTS.labels(
                    method=method,
                    endpoint=endpoint,
                    status=500
                ).inc()

                raise

        return wrapper
    return decorator

def get_metrics_endpoint():
    """Get the Prometheus metrics endpoint"""
    async def metrics():
        """Prometheus metrics endpoint"""
        monitoring_service.update_system_metrics()
        return PlainTextResponse(generate_latest(), media_type=CONTENT_TYPE_LATEST)

    return metrics

def track_business_metric(metric_name: str, value: float = 1, labels: dict = None):
    """Track business-specific metrics"""
    try:
        if metric_name == "pathways_generated":
            monitoring_service.increment_counter(LEARNING_PATHWAYS_GENERATED, labels)
        elif metric_name == "assessments_completed":
            monitoring_service.increment_counter(ASSESSMENTS_COMPLETED, labels)
        elif metric_name == "content_uploaded":
            monitoring_service.increment_counter(CONTENT_UPLOADED, labels)
        elif metric_name == "vector_searches":
            monitoring_service.increment_counter(VECTOR_SEARCHES, labels)
        else:
            logger.warning(f"Unknown business metric: {metric_name}")
    except Exception as e:
        logger.error(f"Failed to track business metric {metric_name}: {e}")

def track_error(error_type: str, operation: str = None, endpoint: str = None):
    """Track application errors"""
    try:
        if error_type == "database":
            monitoring_service.increment_counter(DATABASE_ERRORS, {"operation": operation or "unknown"})
        elif error_type == "cache":
            monitoring_service.increment_counter(CACHE_ERRORS, {"operation": operation or "unknown"})
        elif error_type == "api":
            monitoring_service.increment_counter(API_ERRORS, {"error_type": operation or "unknown", "endpoint": endpoint or "unknown"})
    except Exception as e:
        logger.error(f"Failed to track error: {e}")

# Middleware for automatic request monitoring
async def monitoring_middleware(request: Request, call_next):
    """FastAPI middleware for automatic request monitoring"""
    start_time = time.time()

    try:
        response = await call_next(request)

        # Record request metrics
        process_time = time.time() - start_time
        TOTAL_REQUESTS.labels(
            method=request.method,
            endpoint=request.url.path,
            status=response.status_code
        ).inc()

        REQUEST_LATENCY.labels(
            method=request.method,
            endpoint=request.url.path
        ).observe(process_time)

        return response

    except Exception as e:
        # Record error metrics
        API_ERRORS.labels(
            error_type=type(e).__name__,
            endpoint=request.url.path
        ).inc()

        TOTAL_REQUESTS.labels(
            method=request.method,
            endpoint=request.url.path,
            status=500
        ).inc()

        raise
