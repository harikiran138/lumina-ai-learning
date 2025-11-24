"""
Streaming content processor for handling large files and content streams
"""

from typing import List, Dict, Any, AsyncGenerator, Optional
from fastapi import UploadFile
from loguru import logger
import aiofiles
from datetime import datetime
import uuid
from pathlib import Path
import tempfile
import os

from .optimized_embedding import OptimizedEmbeddingService
from .vector_store import VectorStoreService
from .cache_service import CacheService

class StreamingContentProcessor:
    def __init__(
        self,
        embedding_service: OptimizedEmbeddingService,
        vector_store: VectorStoreService,
        cache: Optional[CacheService] = None
    ):
        self.embedding_service = embedding_service
        self.vector_store = vector_store
        self.cache = cache
        self.chunk_size = 1000
        self.overlap = 200
        self.batch_size = 32
        self.temp_dir = Path(tempfile.gettempdir()) / "lumnia_uploads"
        self.temp_dir.mkdir(exist_ok=True)

    async def process_stream(
        self,
        content_stream: AsyncGenerator[str, None],
        metadata: Dict[str, Any],
        progress_callback: Optional[callable] = None
    ) -> Dict[str, Any]:
        """Process streaming content with real-time updates"""
        try:
            chunks = []
            current_chunk = []
            total_tokens = 0
            processed_chunks = 0

            async for text in content_stream:
                # Split into sentences/chunks
                current_chunk.append(text)
                chunk_text = " ".join(current_chunk)

                if len(chunk_text) >= self.chunk_size:
                    # Process complete chunk
                    if self.overlap > 0 and chunks:
                        # Add overlap from previous chunk
                        overlap_text = chunks[-1][-self.overlap:]
                        chunk_text = overlap_text + chunk_text

                    chunks.append(chunk_text)
                    current_chunk = []
                    processed_chunks += 1

                    if progress_callback:
                        await progress_callback({
                            "status": "processing",
                            "chunks_processed": processed_chunks,
                            "total_tokens": total_tokens
                        })

                    # Process in batches
                    if len(chunks) >= self.batch_size:
                        await self._process_chunk_batch(chunks, metadata)
                        chunks = []

            # Process remaining content
            if current_chunk:
                final_chunk = " ".join(current_chunk)
                if chunks:
                    chunks.append(final_chunk)
                else:
                    chunks = [final_chunk]

            if chunks:
                await self._process_chunk_batch(chunks, metadata)

            return {
                "status": "completed",
                "chunks_processed": processed_chunks,
                "total_tokens": total_tokens
            }

        except Exception as e:
            logger.error(f"Error processing stream: {str(e)}")
            raise

    async def process_file(
        self,
        file: UploadFile,
        metadata: Dict[str, Any],
        progress_callback: Optional[callable] = None
    ) -> Dict[str, Any]:
        """Process uploaded file in streaming mode"""
        try:
            # Generate unique file path
            temp_path = self.temp_dir / f"{uuid.uuid4()}_{file.filename}"
            
            # Save file in chunks
            async with aiofiles.open(temp_path, 'wb') as f:
                while chunk := await file.read(8192):
                    await f.write(chunk)

            # Create content stream based on file type
            if file.content_type == 'text/plain':
                content_stream = self._stream_text_file(temp_path)
            elif file.content_type == 'application/pdf':
                content_stream = self._stream_pdf_file(temp_path)
            elif file.content_type.endswith('document'):
                content_stream = self._stream_document_file(temp_path)
            else:
                raise ValueError(f"Unsupported file type: {file.content_type}")

            # Process the stream
            result = await self.process_stream(
                content_stream,
                metadata,
                progress_callback
            )

            # Cleanup
            try:
                os.unlink(temp_path)
            except Exception as e:
                logger.warning(f"Failed to remove temp file: {str(e)}")

            return result

        except Exception as e:
            logger.error(f"Error processing file: {str(e)}")
            raise

    async def _process_chunk_batch(
        self,
        chunks: List[str],
        metadata: Dict[str, Any]
    ):
        """Process a batch of chunks"""
        try:
            # Generate embeddings in batch
            embeddings = await self.embedding_service.generate_embeddings_batch(
                chunks,
                show_progress=False
            )

            # Prepare batch data
            chunk_ids = [str(uuid.uuid4()) for _ in chunks]
            chunk_metadata = []

            for i in range(len(chunks)):
                chunk_meta = {
                    **metadata,
                    "chunk_num": i,
                    "chunk_id": chunk_ids[i],
                    "timestamp": datetime.utcnow().isoformat()
                }
                chunk_metadata.append(chunk_meta)

            # Insert into vector store
            await self.vector_store.insert_batch(
                ids=chunk_ids,
                contents=chunks,
                embeddings=embeddings,
                metadatas=chunk_metadata
            )

        except Exception as e:
            logger.error(f"Error processing chunk batch: {str(e)}")
            raise

    async def _stream_text_file(self, file_path: Path) -> AsyncGenerator[str, None]:
        """Stream content from text file"""
        try:
            async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
                buffer = []
                async for line in f:
                    buffer.append(line.strip())
                    if len(" ".join(buffer)) >= self.chunk_size:
                        yield " ".join(buffer)
                        buffer = []
                if buffer:
                    yield " ".join(buffer)
        except Exception as e:
            logger.error(f"Error streaming text file: {str(e)}")
            raise

    async def _stream_pdf_file(self, file_path: Path) -> AsyncGenerator[str, None]:
        """Stream content from PDF file"""
        try:
            from pdfminer.high_level import extract_text_to_fp
            from pdfminer.layout import LAParams
            from io import StringIO

            # Process PDF in chunks
            with open(file_path, 'rb') as pdf_file:
                output = StringIO()
                extract_text_to_fp(
                    pdf_file,
                    output,
                    laparams=LAParams(),
                    output_type='text',
                    codec='utf-8'
                )
                
                text = output.getvalue()
                chunks = text.split('\n\n')
                
                buffer = []
                for chunk in chunks:
                    buffer.append(chunk.strip())
                    if len(" ".join(buffer)) >= self.chunk_size:
                        yield " ".join(buffer)
                        buffer = []
                if buffer:
                    yield " ".join(buffer)

        except Exception as e:
            logger.error(f"Error streaming PDF file: {str(e)}")
            raise

    async def _stream_document_file(self, file_path: Path) -> AsyncGenerator[str, None]:
        """Stream content from document file (DOCX, etc.)"""
        try:
            from docx import Document

            doc = Document(file_path)
            buffer = []
            
            for paragraph in doc.paragraphs:
                text = paragraph.text.strip()
                if text:
                    buffer.append(text)
                    if len(" ".join(buffer)) >= self.chunk_size:
                        yield " ".join(buffer)
                        buffer = []
            
            if buffer:
                yield " ".join(buffer)

        except Exception as e:
            logger.error(f"Error streaming document file: {str(e)}")
            raise