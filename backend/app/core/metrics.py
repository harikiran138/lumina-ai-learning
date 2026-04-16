"""
metrics.py — Lumina observability layer.

In production (ENVIRONMENT=production) metrics are published to AWS CloudWatch.
In development they are logged only (no external dependency).

Drop-in replacement for prometheus_client usage:
  - record_ai_request(provider, model, status, latency_sec)
  - record_db_operation(store, operation, status, latency_sec)
  - record_course_creation(subject)
  - record_student_submission(status)
"""

import os
import time
import threading
from typing import Optional

import structlog

log = structlog.get_logger(__name__)

_ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
_AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")
_NAMESPACE = "Lumina/Backend"

# CloudWatch client (lazy, singleton)
_cw_client = None
_cw_lock = threading.Lock()


def _cloudwatch():
    global _cw_client
    if _cw_client is None:
        with _cw_lock:
            if _cw_client is None:
                try:
                    import boto3
                    _cw_client = boto3.client("cloudwatch", region_name=_AWS_REGION)
                except Exception as exc:
                    log.warning("cloudwatch_init_failed", error=str(exc))
                    _cw_client = False  # sentinel: don't retry
    return _cw_client if _cw_client is not False else None


def publish_metric(
    name: str,
    value: float,
    unit: str = "Count",
    dimensions: Optional[list] = None,
):
    """
    Publish a single metric to CloudWatch (production) or log it (dev).

    Args:
        name:       MetricName  (e.g. "AIRequestCount")
        value:      Metric value
        unit:       CloudWatch unit string  (Count, Seconds, Milliseconds, Bytes …)
        dimensions: List of {"Name": str, "Value": str} dicts for filtering
    """
    dims = dimensions or []

    if _ENVIRONMENT == "production":
        cw = _cloudwatch()
        if cw:
            try:
                cw.put_metric_data(
                    Namespace=_NAMESPACE,
                    MetricData=[{
                        "MetricName": name,
                        "Value": value,
                        "Unit": unit,
                        "Dimensions": dims,
                    }],
                )
            except Exception as exc:
                log.warning("cloudwatch_publish_failed", metric=name, error=str(exc))
    else:
        log.debug("metric", name=name, value=value, unit=unit, dimensions=dims)


# ── High-level helpers (same API surface as old prometheus counters) ───────────

def record_ai_request(
    provider: str, model: str, status: str, latency_sec: float = 0.0
):
    dims = [
        {"Name": "Provider", "Value": provider},
        {"Name": "Model",    "Value": model},
        {"Name": "Status",   "Value": status},
    ]
    publish_metric("AIRequestCount",   1.0,         "Count",   dims)
    publish_metric("AILatencySeconds", latency_sec, "Seconds", dims)


def record_db_operation(
    store: str, operation: str, status: str, latency_sec: float = 0.0
):
    dims = [
        {"Name": "Store",     "Value": store},
        {"Name": "Operation", "Value": operation},
        {"Name": "Status",    "Value": status},
    ]
    publish_metric("DBOperationCount",   1.0,         "Count",   dims)
    publish_metric("DBLatencySeconds",   latency_sec, "Seconds", dims)


def record_course_creation(subject: str):
    publish_metric(
        "CourseCreationCount", 1.0, "Count",
        [{"Name": "Subject", "Value": subject}],
    )


def record_student_submission(status: str):
    publish_metric(
        "StudentSubmissionCount", 1.0, "Count",
        [{"Name": "Status", "Value": status}],
    )


# ── Context manager for timing blocks ────────────────────────────────────────

class timed:
    """
    Usage:
        with timed() as t:
            do_work()
        record_ai_request("openrouter", model, "success", t.elapsed)
    """
    def __enter__(self):
        self._start = time.perf_counter()
        return self

    def __exit__(self, *args):
        self.elapsed = time.perf_counter() - self._start
