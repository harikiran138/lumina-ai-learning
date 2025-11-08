"""
Streaming endpoints for optimized content processing
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, UploadFile, File
from fastapi.responses import StreamingResponse
from typing import List, Dict, Any, Optional
from datetime import datetime
import asyncio
import json
from loguru import logger

from .auth import get_current_user
from .models_rag import ContentIngestionRequest, ProcessingStatus
from .services.optimized_embedding import OptimizedEmbeddingService
from .services.streaming_processor import StreamingContentProcessor
from .services.vector_store import VectorStoreService
from .services.cache_service import CacheService

router = APIRouter(prefix="/streaming", tags=["Streaming Content"])

# Initialize services
embedding_service = OptimizedEmbeddingService()
vector_store = VectorStoreService()
cache_service = CacheService()
content_processor = None

async def init_services():
    """Initialize all services"""
    global content_processor
    await embedding_service.init_cache()
    await vector_store.init_cache()
    content_processor = StreamingContentProcessor(
        embedding_service=embedding_service,
        vector_store=vector_store,
        cache=cache_service
    )

@router.post("/upload/{course_id}")
async def upload_stream(
    course_id: str,
    file: UploadFile = File(...),
    metadata: Dict[str, Any] = None,
    current_user: dict = Depends(get_current_user)
):
    """Upload and process file with streaming updates"""
    try:
        # Initialize metadata
        meta = metadata or {}
        meta.update({
            "course_id": course_id,
            "uploaded_by": current_user.get("id"),
            "upload_time": datetime.utcnow().isoformat(),
            "filename": file.filename,
            "content_type": file.content_type
        })

        # Create status queue
        status_queue = asyncio.Queue()

        async def progress_callback(status: Dict[str, Any]):
            await status_queue.put(status)

        # Start processing in background
        processing_task = asyncio.create_task(
            content_processor.process_file(
                file=file,
                metadata=meta,
                progress_callback=progress_callback
            )
        )

        # Stream progress updates
        async def status_generator():
            try:
                while True:
                    try:
                        status = await status_queue.get()
                        yield json.dumps(status) + "\n"
                        if status.get("status") == "completed":
                            break
                    except asyncio.CancelledError:
                        break
            finally:
                # Ensure task is completed
                if not processing_task.done():
                    processing_task.cancel()
                    try:
                        await processing_task
                    except asyncio.CancelledError:
                        pass

        return StreamingResponse(
            status_generator(),
            media_type="application/x-ndjson"
        )

    except Exception as e:
        logger.error(f"Streaming upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ingest/{course_id}")
async def stream_ingest(
    course_id: str,
    content: ContentIngestionRequest,
    current_user: dict = Depends(get_current_user)
):
    """Stream process content ingestion"""
    try:
        # Prepare metadata
        metadata = {
            "course_id": course_id,
            "lesson_id": content.lesson_id,
            "content_type": content.content_type,
            "title": content.title,
            "source": content.source,
            "ingested_by": current_user.get("id"),
            "timestamp": datetime.utcnow().isoformat()
        }

        # Create content stream
        async def content_stream():
            # Split content into manageable chunks
            chunks = [
                content.text[i:i + 1000]
                for i in range(0, len(content.text), 1000)
            ]
            for chunk in chunks:
                yield chunk
                await asyncio.sleep(0.1)  # Prevent overwhelming the system

        # Create status queue
        status_queue = asyncio.Queue()

        async def progress_callback(status: Dict[str, Any]):
            await status_queue.put(status)

        # Start processing in background
        processing_task = asyncio.create_task(
            content_processor.process_stream(
                content_stream=content_stream(),
                metadata=metadata,
                progress_callback=progress_callback
            )
        )

        # Stream progress updates
        async def status_generator():
            try:
                while True:
                    try:
                        status = await status_queue.get()
                        yield json.dumps(status) + "\n"
                        if status.get("status") == "completed":
                            break
                    except asyncio.CancelledError:
                        break
            finally:
                if not processing_task.done():
                    processing_task.cancel()
                    try:
                        await processing_task
                    except asyncio.CancelledError:
                        pass

        return StreamingResponse(
            status_generator(),
            media_type="application/x-ndjson"
        )

    except Exception as e:
        logger.error(f"Streaming ingestion error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/model/info")
async def get_model_info(
    current_user: dict = Depends(get_current_user)
):
    """Get information about the embedding model"""
    try:
        return embedding_service.get_model_info()
    except Exception as e:
        logger.error(f"Error getting model info: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))