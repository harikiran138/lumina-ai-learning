"""
RAG-specific models for Lumina LMS
Includes both SQLAlchemy models and Pydantic schemas
"""

from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

Base = declarative_base()

# Documents table for RAG content storage
class Document(Base):
    __tablename__ = 'documents'

    id = Column(Integer, primary_key=True, autoincrement=True)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    content_type = Column(String(50), nullable=False)
    file_size = Column(Integer, nullable=False)
    uploaded_by = Column(String(50), ForeignKey('users.id'))
    course_id = Column(String(50))
    title = Column(String(255))
    description = Column(Text)
    content = Column(Text)
    metadata = Column(JSON, default={})
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")

# Document chunks table for RAG with vector embeddings
class DocumentChunk(Base):
    __tablename__ = 'document_chunks'

    id = Column(Integer, primary_key=True, autoincrement=True)
    document_id = Column(Integer, ForeignKey('documents.id'), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(Text)  # Vector embedding stored as text (JSON array)
    metadata = Column(JSON, default={})
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    # Relationships
    document = relationship("Document", back_populates="chunks")

# Pydantic models for API requests and responses
class ContentIngestionRequest(BaseModel):
    """Request model for content ingestion"""
    text: str = Field(..., description="Content text to be ingested")
    course_id: str = Field(..., description="ID of the course this content belongs to")
    lesson_id: Optional[str] = Field(None, description="ID of the lesson if applicable")
    content_type: str = Field(..., description="Type of content (e.g., 'lesson', 'assignment', 'resource')")
    source: str = Field(..., description="Source of the content (e.g., 'upload', 'manual', 'import')")
    title: str = Field(..., description="Title of the content")
    chunk_size: Optional[int] = Field(1000, description="Size of content chunks")
    chunk_overlap: Optional[int] = Field(200, description="Overlap between chunks")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

class SearchRequest(BaseModel):
    """Request model for semantic search"""
    text: str = Field(..., description="Query text to search for")
    course_id: Optional[str] = Field(None, description="Filter by course ID")
    lesson_id: Optional[str] = Field(None, description="Filter by lesson ID")
    limit: Optional[int] = Field(10, description="Maximum number of results to return")

class QueryRequest(BaseModel):
    """Request model for RAG-powered queries"""
    query: str = Field(..., description="User question or query")
    course_id: Optional[str] = Field(None, description="Filter by course ID")
    lesson_id: Optional[str] = Field(None, description="Filter by lesson ID")
    context_limit: Optional[int] = Field(5, description="Number of context chunks to use")
    max_tokens: Optional[int] = Field(500, description="Maximum tokens in response")

class FileUploadMetadata(BaseModel):
    """Metadata for file uploads"""
    course_id: Optional[str] = None
    lesson_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    content_type: str
    tags: Optional[List[str]] = Field(default_factory=list)

class ProcessingStatus(BaseModel):
    """Status response for async processing"""
    status: str = Field(..., description="Current status of processing")
    message: str = Field(..., description="Status message")
    document_id: Optional[str] = None
    total_chunks: Optional[int] = None
    processed_chunks: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SearchResult(BaseModel):
    """Model for search results"""
    id: str
    content: str
    score: float
    metadata: Dict[str, Any]
    course_id: Optional[str]
    lesson_id: Optional[str]
    chunk_num: Optional[int]

class QueryResponse(BaseModel):
    """Response model for RAG queries"""
    query: str
    answer: str
    sources: List[SearchResult]
    confidence: float
    processing_time: float
