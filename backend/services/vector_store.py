"""
Vector database service using Milvus for efficient similarity search
"""

from pymilvus import connections, Collection, CollectionSchema, FieldSchema, DataType, utility
from typing import List, Dict, Any, Optional
import numpy as np
from loguru import logger
from config import settings
import json
import hashlib
from datetime import datetime


class VectorStoreService:
    def __init__(self):
        self.collection_name = "lumina_content"
        self.dimension = settings.EMBEDDING_DIMENSION
        self.cache = None
        self._connect()
        self._create_collection()
        
    async def init_cache(self):
        """Initialize cache service"""
        from .cache_service import CacheService
        self.cache = CacheService()
        await self.cache.init()

    def _connect(self):
        """Connect to Milvus"""
        try:
            connections.connect(
                alias="default",
                host=settings.MILVUS_HOST,
                port=settings.MILVUS_PORT
            )
            logger.info("Connected to Milvus successfully")
        except Exception as e:
            logger.error(f"Failed to connect to Milvus: {str(e)}")
            raise

    def _create_collection(self):
        """Create collection if it doesn't exist"""
        try:
            if not utility.has_collection(self.collection_name):
                fields = [
                    FieldSchema(name="id", dtype=DataType.VARCHAR, max_length=100, is_primary=True),
                    FieldSchema(name="content", dtype=DataType.VARCHAR, max_length=65535),
                    FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=self.dimension),
                    FieldSchema(name="course_id", dtype=DataType.VARCHAR, max_length=50),
                    FieldSchema(name="lesson_id", dtype=DataType.VARCHAR, max_length=50),
                    FieldSchema(name="chunk_num", dtype=DataType.INT64),
                    FieldSchema(name="metadata", dtype=DataType.JSON),
                    FieldSchema(name="created_at", dtype=DataType.VARCHAR, max_length=30)
                ]
                schema = CollectionSchema(fields, "Lumina content vectors")
                self.collection = Collection(self.collection_name, schema)

                # Create composite index for filtering
                self.collection.create_index(
                    field_name="course_id",
                    index_params={"index_type": "STL_HASH"}
                )
                self.collection.create_index(
                    field_name="lesson_id",
                    index_params={"index_type": "STL_HASH"}
                )

                # Create HNSW index for vector similarity search
                index_params = {
                    "metric_type": "COSINE",
                    "index_type": "HNSW",
                    "params": {
                        "M": 16,
                        "efConstruction": 200
                    }
                }
                self.collection.create_index("embedding", index_params)
                logger.info("Created Milvus collection and indexes")
            else:
                self.collection = Collection(self.collection_name)
                self.collection.load()
                logger.info("Loaded existing Milvus collection")
        except Exception as e:
            logger.error(f"Failed to create/load collection: {str(e)}")
            raise

    async def insert_batch(
        self,
        ids: List[str],
        embeddings: List[List[float]],
        contents: List[str],
        metadatas: List[Dict[str, Any]]
    ) -> bool:
        """
        Insert multiple documents with their embeddings and update cache
        """
        try:
            entities = [
                ids,
                contents,
                embeddings,
                [m.get('course_id', '') for m in metadatas],
                [m.get('lesson_id', '') for m in metadatas],
                [m.get('chunk_num', 0) for m in metadatas],
                [json.dumps(m) for m in metadatas],
                [datetime.utcnow().isoformat() for _ in ids]
            ]

            self.collection.insert(entities)
            self.collection.flush()

            # Update cache for affected courses
            if self.cache:
                unique_courses = set(m.get('course_id') for m in metadatas if m.get('course_id'))
                for course_id in unique_courses:
                    # Invalidate course-specific caches
                    await self.cache.invalidate_course_cache(course_id)
                    
                    # Update course stats
                    stats = {
                        "total_chunks": len([m for m in metadatas if m.get('course_id') == course_id]),
                        "last_updated": datetime.utcnow().isoformat()
                    }
                    await self.cache.update_course_stats(course_id, stats)

            logger.info(f"Inserted {len(ids)} documents into vector store")
            return True
        except Exception as e:
            logger.error(f"Failed to insert batch: {str(e)}")
            return False

    async def search(
        self,
        query_embedding: List[float],
        filter_dict: Optional[Dict[str, Any]] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search for similar documents with optional filters and caching
        """
        try:
            # Generate cache key
            cache_key = hashlib.md5(
                f"{json.dumps(query_embedding)}:{json.dumps(filter_dict)}:{limit}".encode()
            ).hexdigest()

            # Try cache first
            if self.cache:
                cached_results = await self.cache.get_search_results(cache_key)
                if cached_results:
                    logger.info("Returning cached search results")
                    return cached_results

            self.collection.load()
            
            # Build expression from filters
            expr = None
            if filter_dict:
                conditions = []
                for key, value in filter_dict.items():
                    if value is not None:
                        conditions.append(f'{key} == "{value}"')
                if conditions:
                    expr = " && ".join(conditions)

            # Set search parameters
            search_params = {
                "metric_type": "COSINE",
                "params": {"ef": 64}  # HNSW parameter for search
            }

            results = self.collection.search(
                data=[query_embedding],
                anns_field="embedding",
                param=search_params,
                limit=limit,
                expr=expr,
                output_fields=["content", "metadata", "course_id", "lesson_id", "chunk_num"]
            )

            hits = []
            for result in results[0]:
                hit = {
                    "id": result.id,
                    "content": result.entity.get("content"),
                    "course_id": result.entity.get("course_id"),
                    "lesson_id": result.entity.get("lesson_id"),
                    "chunk_num": result.entity.get("chunk_num"),
                    "metadata": json.loads(result.entity.get("metadata")),
                    "score": float(result.score)
                }
                hits.append(hit)

            # Cache results if available
            if self.cache and hits:
                await self.cache.cache_search_results(cache_key, hits)

            logger.info(f"Found {len(hits)} similar documents")
            return hits
        except Exception as e:
            logger.error(f"Search failed: {str(e)}")
            return []

    async def delete_by_course(self, course_id: str) -> bool:
        """Delete all documents for a course and clear cache"""
        try:
            # Delete from vector store
            expr = f'course_id == "{course_id}"'
            self.collection.delete(expr)
            self.collection.flush()

            # Clear cache for the course
            if self.cache:
                await self.cache.invalidate_course_cache(course_id)
                # Reset course stats
                stats = {
                    "total_chunks": 0,
                    "last_updated": datetime.utcnow().isoformat()
                }
                await self.cache.update_course_stats(course_id, stats)

            logger.info(f"Deleted all documents for course {course_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete course documents: {str(e)}")
            return False

    def get_stats(self) -> Dict[str, Any]:
        """Get collection statistics"""
        try:
            stats = self.collection.get_stats()
            return {
                "total_documents": stats["row_count"],
                "segment_count": stats.get("segment_count", 0),
                "created_at": stats.get("created_timestamp", ""),
                "index_type": "HNSW",
                "dimension": self.dimension
            }
        except Exception as e:
            logger.error(f"Failed to get stats: {str(e)}")
            return {}


# Global instance
vector_store = VectorStoreService()
