"""
Monitoring endpoints for system metrics and performance tracking
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import json
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from fastapi.responses import Response, StreamingResponse
import asyncio
from loguru import logger

from .auth import get_current_user
from .services.monitoring import monitoring_service
from .services.vector_store import vector_store
from .services.optimized_embedding import embedding_service
from .services.cache_service import cache_service

router = APIRouter(prefix="/monitoring", tags=["Monitoring"])

@router.get("/metrics")
async def get_prometheus_metrics():
    """Get Prometheus metrics"""
    return Response(
        generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )

@router.get("/health")
async def health_check():
    """System health check"""
    try:
        # Check core services
        services_status = {
            "vector_store": await check_vector_store(),
            "embedding": await check_embedding_service(),
            "cache": await check_cache_service()
        }

        # Calculate overall status
        is_healthy = all(
            status.get("status") == "healthy"
            for status in services_status.values()
        )

        return {
            "status": "healthy" if is_healthy else "degraded",
            "timestamp": datetime.utcnow().isoformat(),
            "services": services_status
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=500, detail="System health check failed")

@router.get("/status")
async def system_status(
    current_user: dict = Depends(get_current_user)
):
    """Get detailed system status and metrics"""
    try:
        # Get metrics snapshot
        metrics = monitoring_service.get_metrics_snapshot()

        # Get service statistics
        vector_stats = await vector_store.get_stats()
        model_info = embedding_service.get_model_info()

        return {
            "status": "operational",
            "timestamp": datetime.utcnow().isoformat(),
            "metrics": metrics,
            "vector_store": vector_stats,
            "embedding_model": model_info
        }
    except Exception as e:
        logger.error(f"Status check failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get system status")

@router.get("/performance/{course_id}")
async def course_performance(
    course_id: str,
    time_range: Optional[str] = "24h",
    current_user: dict = Depends(get_current_user)
):
    """Get performance metrics for a specific course"""
    try:
        # Calculate time range
        end_time = datetime.utcnow()
        if time_range == "24h":
            start_time = end_time - timedelta(hours=24)
        elif time_range == "7d":
            start_time = end_time - timedelta(days=7)
        elif time_range == "30d":
            start_time = end_time - timedelta(days=30)
        else:
            raise HTTPException(status_code=400, detail="Invalid time range")

        # Get course-specific metrics
        metrics = {
            "processed_chunks": monitoring_service.chunk_count.labels(
                course_id=course_id
            )._value,
            "vector_operations": monitoring_service.vector_store_operations._value.sum(),
            "embedding_operations": monitoring_service.embedding_operations._value.sum(),
            "cache_hit_ratio": monitoring_service.cache_hit_ratio._value
        }

        return {
            "course_id": course_id,
            "time_range": time_range,
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "metrics": metrics
        }
    except Exception as e:
        logger.error(f"Course performance check failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get course performance")

@router.get("/live")
async def live_metrics(
    current_user: dict = Depends(get_current_user)
):
    """Stream live system metrics"""
    async def metrics_generator():
        while True:
            try:
                # Get current metrics
                metrics = {
                    "timestamp": datetime.utcnow().isoformat(),
                    "system": {
                        "gpu_memory": monitoring_service.gpu_memory_used._value,
                        "system_memory": monitoring_service.system_memory_used._value
                    },
                    "operations": {
                        "vector_store": monitoring_service.vector_store_operations._value.sum(),
                        "embedding": monitoring_service.embedding_operations._value.sum(),
                        "cache": monitoring_service.cache_operations._value.sum()
                    },
                    "performance": {
                        "request_latency": monitoring_service.request_latency._sum.sum(),
                        "cache_hit_ratio": monitoring_service.cache_hit_ratio._value
                    }
                }

                yield f"data: {json.dumps(metrics)}\n\n"
                await asyncio.sleep(1)  # Update every second

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Metrics streaming error: {str(e)}")
                break

    return StreamingResponse(
        metrics_generator(),
        media_type="text/event-stream"
    )

async def check_vector_store() -> Dict[str, Any]:
    """Check vector store health"""
    try:
        stats = await vector_store.get_stats()
        return {
            "status": "healthy",
            "details": stats
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

async def check_embedding_service() -> Dict[str, Any]:
    """Check embedding service health"""
    try:
        info = embedding_service.get_model_info()
        return {
            "status": "healthy",
            "details": info
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

async def check_cache_service() -> Dict[str, Any]:
    """Check cache service health"""
    try:
        # Try basic cache operation
        test_key = "health_check"
        await cache_service.cache_embeddings(
            test_key,
            [0.0],
            ttl=60
        )
        await cache_service.get_cached_embeddings(test_key)
        
        return {
            "status": "healthy",
            "details": {
                "hit_ratio": monitoring_service.cache_hit_ratio._value
            }
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }