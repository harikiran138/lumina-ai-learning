"""
Course content management endpoints for RAG system
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging
import hashlib

from .auth import get_current_user
from .models_rag import (
    ContentIngestionRequest, ProcessingStatus,
    SearchResult
)
from .services.vector_store import VectorStoreService
from .services.embeddings import EmbeddingService
from .services.cache_service import CacheService
from .services.content_parser import ContentParser

router = APIRouter(prefix="/course-content", tags=["Course Content"])
logger = logging.getLogger(__name__)

# Initialize services
vector_store = VectorStoreService()
embedding_service = EmbeddingService()
cache_service = CacheService()
content_parser = ContentParser()

@router.post("/{course_id}/bulk-ingest", response_model=ProcessingStatus)
async def bulk_ingest_course_content(
    course_id: str,
    contents: List[ContentIngestionRequest],
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Bulk ingest multiple content items for a course"""
    try:
        total_chunks = 0
        chunks_data = []

        # Process each content item
        for content in contents:
            # Validate course ID
            if content.course_id != course_id:
                raise HTTPException(
                    status_code=400,
                    detail="Course ID mismatch in content items"
                )

            # Parse and chunk content
            chunks = content_parser.parse_and_chunk(
                content.text,
                chunk_size=content.chunk_size or 1000,
                chunk_overlap=content.chunk_overlap or 200
            )

            # Process chunks
            for i, chunk in enumerate(chunks):
                chunk_data = {
                    "content": chunk,
                    "metadata": {
                        "course_id": course_id,
                        "lesson_id": content.lesson_id,
                        "chunk_num": i,
                        "source": content.source,
                        "type": content.content_type,
                        "title": content.title,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                }
                chunks_data.append(chunk_data)
                total_chunks += 1

        # Schedule background processing
        background_tasks.add_task(
            process_course_chunks,
            chunks_data=chunks_data,
            course_id=course_id
        )

        return ProcessingStatus(
            status="processing",
            message=f"Processing {len(contents)} content items",
            total_chunks=total_chunks
        )

    except Exception as e:
        logger.error(f"Bulk ingestion error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{course_id}/search", response_model=List[SearchResult])
async def search_course_content(
    course_id: str,
    query: str,
    lesson_id: Optional[str] = None,
    limit: int = 10,
    current_user: dict = Depends(get_current_user)
):
    """Search within course content"""
    try:
        # Generate query hash for caching
        query_hash = hashlib.md5(
            f"{query}:{course_id}:{lesson_id}:{limit}".encode()
        ).hexdigest()

        # Check cache
        cached_results = await cache_service.get_search_results(query_hash)
        if cached_results:
            return [SearchResult(**result) for result in cached_results]

        # Generate query embedding
        query_embedding = embedding_service.generate_embedding(query)

        # Prepare filters
        filters = {"course_id": course_id}
        if lesson_id:
            filters["lesson_id"] = lesson_id

        # Search vector store
        results = await vector_store.search(
            query_embedding=query_embedding,
            filter_dict=filters,
            limit=limit
        )

        # Cache results
        await cache_service.cache_search_results(query_hash, results)

        return [SearchResult(**result) for result in results]

    except Exception as e:
        logger.error(f"Course search error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{course_id}")
async def delete_course_content(
    course_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete all content for a course"""
    try:
        # Delete from vector store
        success = await vector_store.delete_by_course(course_id)
        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to delete course content"
            )

        # Invalidate cache
        await cache_service.invalidate_course_cache(course_id)

        return {
            "status": "success",
            "message": f"Deleted all content for course {course_id}"
        }

    except Exception as e:
        logger.error(f"Course deletion error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{course_id}/stats")
async def get_course_content_stats(
    course_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get content statistics for a course"""
    try:
        # Get cached stats
        stats = await cache_service.get_course_stats(course_id)

        # Get vector store stats for the course
        vector_stats = await vector_store.get_stats()
        
        # Combine stats
        combined_stats = {
            **stats,
            "vector_store": vector_stats,
            "course_id": course_id
        }

        # Update cache hits
        await cache_service.update_course_stats(course_id, combined_stats)

        return combined_stats

    except Exception as e:
        logger.error(f"Stats error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def process_course_chunks(chunks_data: List[Dict[str, Any]], course_id: str):
    """Background task to process course chunks"""
    try:
        # Generate embeddings in batches
        batch_size = 32
        for i in range(0, len(chunks_data), batch_size):
            batch = chunks_data[i:i + batch_size]
            
            # Generate embeddings
            contents = [chunk["content"] for chunk in batch]
            embeddings = [
                embedding_service.generate_embedding(content)
                for content in contents
            ]
            
            # Prepare data for vector store
            ids = [f"{course_id}_{i}_{j}" for j in range(len(batch))]
            metadatas = [chunk["metadata"] for chunk in batch]

            # Insert batch
            success = await vector_store.insert_batch(
                ids=ids,
                contents=contents,
                embeddings=embeddings,
                metadatas=metadatas
            )

            if not success:
                logger.error(f"Failed to insert batch for course {course_id}")
                return

        # Update course stats
        stats = {
            "total_chunks": len(chunks_data),
            "last_updated": datetime.utcnow().isoformat()
        }
        await cache_service.update_course_stats(course_id, stats)

        logger.info(f"Successfully processed {len(chunks_data)} chunks for course {course_id}")

    except Exception as e:
        logger.error(f"Chunk processing error for course {course_id}: {str(e)}")
        raise