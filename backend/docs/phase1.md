# Lumnia LMS - Phase 1 Documentation

## Overview

Phase 1 establishes the foundational infrastructure for Lumina, focusing on content ingestion and knowledge base creation. This phase implements the core RAG (Retrieval-Augmented Generation) system that converts educational content into a searchable knowledge base.

## Key Features

### 1. Content Ingestion Pipeline
- **Document Upload**: Support for multiple file formats (PDF, DOCX, TXT)
- **OCR Processing**: Text extraction from scanned documents and images
- **Content Validation**: File type checking, size limits, and malware scanning
- **Batch Processing**: Asynchronous processing of large document collections

### 2. Text Processing & Chunking
- **Intelligent Chunking**: Content-aware text segmentation
- **Metadata Preservation**: Maintain document structure and formatting
- **Quality Assurance**: Chunk validation and deduplication
- **Scalable Processing**: Handle large documents efficiently

### 3. Vector Embeddings
- **SentenceTransformers Integration**: High-quality embedding generation
- **Local Model Support**: Self-hosted embedding models for privacy
- **Batch Embedding**: Efficient processing of large text collections
- **Embedding Optimization**: Dimensionality reduction and compression

### 4. Vector Database Storage
- **Milvus Integration**: High-performance vector similarity search
- **Metadata Indexing**: Rich metadata for advanced filtering
- **Scalable Storage**: Support for millions of vectors
- **Backup & Recovery**: Data persistence and disaster recovery

## Technical Architecture

### Core Services

#### DocumentValidator
```python
class DocumentValidator:
    - validate_file(): File type and size validation
    - scan_for_malware(): Security scanning
    - extract_metadata(): Document metadata extraction
    - check_content_quality(): Content quality assessment
```

#### ContentParser
```python
class ContentParser:
    - parse_document(): Multi-format document parsing
    - extract_text(): OCR and text extraction
    - preserve_structure(): Maintain document hierarchy
    - handle_encodings(): Multi-language support
```

#### ChunkingService
```python
class ChunkingService:
    - intelligent_chunk(): Content-aware text segmentation
    - preserve_context(): Maintain semantic relationships
    - optimize_size(): Balance chunk size and coherence
    - handle_overlap(): Sliding window chunking
```

#### OptimizedEmbedding
```python
class OptimizedEmbedding:
    - generate_embeddings(): Batch embedding generation
    - compress_embeddings(): Dimensionality reduction
    - cache_embeddings(): Embedding caching for performance
    - validate_quality(): Embedding quality assessment
```

#### VectorStore
```python
class VectorStore:
    - store_vectors(): Vector storage with metadata
    - search_similar(): Similarity search with filtering
    - update_vectors(): Vector updates and maintenance
    - backup_data(): Data backup and recovery
```

### Database Schema

#### Documents Table
```sql
CREATE TABLE documents (
    id VARCHAR(36) PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(10) NOT NULL,
    file_size BIGINT,
    upload_date TIMESTAMP,
    processing_status VARCHAR(50),
    metadata JSONB,
    user_id VARCHAR(50)
);
```

#### Chunks Table
```sql
CREATE TABLE chunks (
    id VARCHAR(36) PRIMARY KEY,
    document_id VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    chunk_index INTEGER,
    metadata JSONB,
    embedding_id VARCHAR(36),
    FOREIGN KEY (document_id) REFERENCES documents(id)
);
```

#### Embeddings Table
```sql
CREATE TABLE embeddings (
    id VARCHAR(36) PRIMARY KEY,
    chunk_id VARCHAR(36) NOT NULL,
    vector_data BYTEA,  -- Compressed embedding data
    model_version VARCHAR(50),
    created_at TIMESTAMP,
    FOREIGN KEY (chunk_id) REFERENCES chunks(id)
);
```

## API Endpoints

### Content Ingestion
```
POST /api/v1/ingest/upload
GET /api/v1/ingest/status/{document_id}
DELETE /api/v1/ingest/document/{document_id}
```

### Content Search
```
POST /api/v1/search/semantic
GET /api/v1/search/documents
POST /api/v1/search/filter
```

### Content Management
```
GET /api/v1/content/documents
GET /api/v1/content/chunks/{document_id}
PUT /api/v1/content/metadata/{document_id}
```

## Processing Pipeline

### 1. Document Upload
1. File validation and security scanning
2. Metadata extraction and storage
3. Asynchronous processing queue

### 2. Content Processing
1. Text extraction (OCR if needed)
2. Content cleaning and normalization
3. Intelligent chunking with overlap

### 3. Embedding Generation
1. Batch processing of chunks
2. Embedding generation using local models
3. Quality validation and compression

### 4. Vector Storage
1. Storage in Milvus with metadata
2. Index creation for efficient search
3. Backup and replication

## Configuration

### Environment Variables
```
# Content Processing
MAX_FILE_SIZE=100MB
ALLOWED_FILE_TYPES=pdf,docx,txt
OCR_ENABLED=true

# Embedding Configuration
EMBEDDING_MODEL=all-mpnet-base-v2
EMBEDDING_BATCH_SIZE=32
EMBEDDING_DIMENSION=768

# Vector Database
MILVUS_HOST=localhost
MILVUS_PORT=19530
COLLECTION_NAME=lumina_kb

# Processing
MAX_WORKERS=4
CHUNK_SIZE=512
CHUNK_OVERLAP=50
```

### Docker Configuration
```yaml
services:
  ingestion-worker:
    environment:
      - MAX_FILE_SIZE=${MAX_FILE_SIZE}
      - EMBEDDING_MODEL=${EMBEDDING_MODEL}
    volumes:
      - ./uploads:/app/uploads
    depends_on:
      - milvus
      - redis
```

## Performance Considerations

### Optimization Techniques
- **Batch Processing**: Process multiple documents concurrently
- **Caching**: Cache embeddings and search results
- **Compression**: Compress embeddings for storage efficiency
- **Indexing**: Optimized vector indexes for fast search

### Scalability
- **Horizontal Scaling**: Multiple ingestion workers
- **Load Balancing**: Distribute processing across instances
- **Queue Management**: Redis-based job queuing
- **Resource Limits**: Memory and CPU limits per worker

### Monitoring
- **Processing Metrics**: Document processing time and success rate
- **Storage Metrics**: Vector database size and search performance
- **Error Tracking**: Failed processing and error rates
- **Resource Usage**: CPU, memory, and disk usage

## Testing

Run the ingestion test suite:
```bash
cd backend
pytest tests/test_ingestion.py -v
```

Test coverage includes:
- Document upload and validation
- Content parsing and chunking
- Embedding generation and storage
- Vector search functionality

## Security Considerations

### Data Protection
- File type validation and malware scanning
- Secure file storage with access controls
- Encryption of sensitive metadata
- Audit logging of all operations

### Access Control
- User-based document ownership
- Role-based access to content
- API rate limiting
- Authentication for all endpoints

## Troubleshooting

Common issues and solutions:

1. **OCR Processing Failures**
   - Check Tesseract installation
   - Verify image quality
   - Review language settings

2. **Embedding Generation Errors**
   - Verify model availability
   - Check GPU memory if using GPU
   - Review batch size settings

3. **Vector Storage Issues**
   - Check Milvus connectivity
   - Verify collection creation
   - Review disk space

4. **Performance Problems**
   - Monitor worker queue length
   - Adjust batch sizes
   - Scale worker instances

## Next Steps

Phase 2 will focus on:
1. Advanced content processing (multi-modal support)
2. Enhanced search capabilities
3. Content recommendation system
4. Integration with learning pathways
