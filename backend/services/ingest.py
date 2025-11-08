"""
Knowledge ingestion pipeline for processing educational content
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
import numpy as np
from loguru import logger
from config import settings
from services.content_parser import content_parser
from services.embeddings import embedding_service
from services.vector_store import vector_store
from models import Course, Lesson
from sqlalchemy.orm import Session
import uuid
import os
import json


class KnowledgeIngestionPipeline:
    def __init__(self):
        self.chunk_size = 500  # Characters per chunk
        self.chunk_overlap = 50  # Overlap between chunks
        self.metadata_keys = ['title', 'source', 'course_id', 'lesson_id', 'page_num', 'chunk_num']

    async def ingest_content(
        self,
        file_path: str,
        content_type: str,
        course_id: Optional[str] = None,
        lesson_id: Optional[int] = None,
        db: Optional[Session] = None
    ) -> Dict[str, Any]:
        """
        Process and ingest content into the vector store
        """
        try:
            # Parse content
            content = content_parser.parse_file(file_path, content_type)
            metadata = content_parser.extract_metadata(file_path, content_type)

            # Get course/lesson info if provided
            if db and course_id:
                course = db.query(Course).filter(Course.id == course_id).first()
                if course:
                    metadata['course_name'] = course.name
                    metadata['course_id'] = course_id

                if lesson_id:
                    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
                    if lesson:
                        metadata['lesson_title'] = lesson.title
                        metadata['lesson_id'] = lesson_id

            # Split content into chunks
            chunks = self._split_content(content)
            logger.info(f"Split content into {len(chunks)} chunks")

            # Generate embeddings for chunks
            chunk_embeddings = []
            chunk_metadata = []
            
            for i, chunk in enumerate(chunks):
                # Generate embedding
                embedding = embedding_service.encode(chunk)
                chunk_embeddings.append(embedding)

                # Create metadata for chunk
                chunk_meta = {
                    **metadata,
                    'chunk_num': i,
                    'text': chunk,
                    'chunk_size': len(chunk),
                    'position': i * (self.chunk_size - self.chunk_overlap)
                }
                chunk_metadata.append(chunk_meta)

            # Store in vector database
            content_id = str(uuid.uuid4())
            success = await vector_store.insert_batch(
                ids=[f"{content_id}_{i}" for i in range(len(chunks))],
                embeddings=chunk_embeddings,
                metadatas=chunk_metadata
            )

            # Cache results
            self._cache_results(content_id, chunks, chunk_metadata)

            return {
                'content_id': content_id,
                'num_chunks': len(chunks),
                'metadata': metadata,
                'success': success
            }

        except Exception as e:
            logger.error(f"Error in content ingestion: {str(e)}")
            raise

    def _split_content(self, content: str) -> List[str]:
        """
        Split content into overlapping chunks
        """
        chunks = []
        content_len = len(content)
        start = 0

        while start < content_len:
            # Find the end of the chunk
            end = start + self.chunk_size

            # If we're not at the end, try to break at a sentence
            if end < content_len:
                # Look for sentence boundaries
                for separator in ['. ', '? ', '! ', '\n\n']:
                    last_separator = content.rfind(separator, start, end)
                    if last_separator != -1:
                        end = last_separator + 1
                        break

            # Extract chunk
            chunk = content[start:end].strip()
            if chunk:  # Only add non-empty chunks
                chunks.append(chunk)

            # Move start position, accounting for overlap
            start = end - self.chunk_overlap

        return chunks

    def _cache_results(
        self,
        content_id: str,
        chunks: List[str],
        metadata: List[Dict[str, Any]]
    ):
        """
        Cache ingestion results for faster retrieval
        """
        cache_dir = os.path.join(settings.CACHE_DIR, 'ingestion')
        os.makedirs(cache_dir, exist_ok=True)

        cache_data = {
            'content_id': content_id,
            'chunks': chunks,
            'metadata': metadata,
            'timestamp': str(datetime.utcnow())
        }

        cache_path = os.path.join(cache_dir, f"{content_id}.json")
        with open(cache_path, 'w') as f:
            json.dump(cache_data, f)

    async def search_similar(
        self,
        query: str,
        course_id: Optional[str] = None,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Search for similar content chunks
        """
        # Generate query embedding
        query_embedding = embedding_service.encode(query)

        # Search vector store
        filter_dict = {'course_id': course_id} if course_id else None
        results = await vector_store.search(
            query_embedding,
            filter_dict=filter_dict,
            limit=limit
        )

        return results


# Global instance
ingestion_pipeline = KnowledgeIngestionPipeline()