# Lumnia LMS - Phase 2 Documentation

## Overview

Phase 2 builds upon the knowledge base foundation by implementing advanced content processing, enhanced search capabilities, and content recommendation systems. This phase transforms the raw knowledge base into an intelligent content discovery and recommendation engine.

## Key Features

### 1. Advanced Content Processing
- **Multi-modal Content**: Support for images, diagrams, and multimedia content
- **Content Enrichment**: Automatic tagging, categorization, and summarization
- **Quality Enhancement**: Content filtering and improvement algorithms
- **Language Detection**: Multi-language content processing

### 2. Enhanced Search Capabilities
- **Semantic Search**: Deep understanding of user intent and context
- **Hybrid Search**: Combine keyword and semantic search for optimal results
- **Personalized Results**: User history and preferences influence search ranking
- **Real-time Search**: Instant results with progressive loading

### 3. Content Recommendation Engine
- **Collaborative Filtering**: User behavior-based recommendations
- **Content-based Recommendations**: Similarity-based content suggestions
- **Learning Path Recommendations**: Suggest next learning materials
- **Adaptive Recommendations**: Learn from user feedback and engagement

### 4. Content Analytics
- **Usage Analytics**: Track content popularity and engagement
- **Performance Metrics**: Content effectiveness and learning outcomes
- **Quality Assessment**: Automated content quality scoring
- **Trend Analysis**: Identify trending topics and popular content

## Technical Architecture

### Core Services

#### ContentEnricher
```python
class ContentEnricher:
    - enrich_content(): Add metadata and tags
    - generate_summaries(): Automatic content summarization
    - extract_key_concepts(): Concept extraction and tagging
    - detect_language(): Language identification
```

#### AdvancedSearchEngine
```python
class AdvancedSearchEngine:
    - semantic_search(): Vector-based semantic search
    - hybrid_search(): Combine multiple search strategies
    - personalized_ranking(): User-specific result ranking
    - real_time_search(): Progressive search results
```

#### RecommendationEngine
```python
class RecommendationEngine:
    - collaborative_filtering(): User behavior-based recommendations
    - content_based_filtering(): Content similarity recommendations
    - learning_path_suggestions(): Sequential content recommendations
    - adaptive_learning(): Feedback-based recommendation adaptation
```

#### ContentAnalytics
```python
class ContentAnalytics:
    - track_usage(): Content usage and engagement tracking
    - calculate_metrics(): Performance and quality metrics
    - analyze_trends(): Trend identification and reporting
    - generate_insights(): Automated insights generation
```

### Database Schema Extensions

#### Content Metadata Table
```sql
CREATE TABLE content_metadata (
    id VARCHAR(36) PRIMARY KEY,
    chunk_id VARCHAR(36) NOT NULL,
    tags TEXT[],
    categories TEXT[],
    summary TEXT,
    key_concepts TEXT[],
    language VARCHAR(10),
    quality_score FLOAT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (chunk_id) REFERENCES chunks(id)
);
```

#### Search Analytics Table
```sql
CREATE TABLE search_analytics (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(50),
    query TEXT NOT NULL,
    search_type VARCHAR(50),
    results_count INTEGER,
    clicked_results INTEGER,
    search_time TIMESTAMP,
    session_id VARCHAR(36)
);
```

#### Recommendations Table
```sql
CREATE TABLE recommendations (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    content_id VARCHAR(36) NOT NULL,
    recommendation_type VARCHAR(50),
    score FLOAT,
    context TEXT,
    created_at TIMESTAMP,
    interacted BOOLEAN DEFAULT FALSE
);
```

#### Content Usage Table
```sql
CREATE TABLE content_usage (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(50),
    content_id VARCHAR(36),
    action_type VARCHAR(50),  -- view, like, share, complete
    duration INTEGER,  -- time spent in seconds
    rating INTEGER,  -- user rating 1-5
    timestamp TIMESTAMP
);
```

## API Endpoints

### Advanced Search
```
POST /api/v1/search/advanced
POST /api/v1/search/semantic
POST /api/v1/search/hybrid
GET /api/v1/search/suggestions/{query}
POST /api/v1/search/personalized
```

### Content Recommendations
```
GET /api/v1/recommendations/{user_id}
POST /api/v1/recommendations/feedback
GET /api/v1/recommendations/similar/{content_id}
POST /api/v1/recommendations/learning-path
```

### Content Analytics
```
GET /api/v1/analytics/content/popular
GET /api/v1/analytics/content/trending
GET /api/v1/analytics/user/{user_id}/engagement
POST /api/v1/analytics/content/usage
```

### Content Enrichment
```
POST /api/v1/content/enrich
GET /api/v1/content/metadata/{content_id}
PUT /api/v1/content/tags/{content_id}
POST /api/v1/content/summarize
```

## Search Algorithms

### Semantic Search
- **Query Understanding**: Intent classification and entity extraction
- **Vector Similarity**: Cosine similarity with optimized indexing
- **Context Awareness**: Consider user history and preferences
- **Multi-stage Ranking**: Initial retrieval + re-ranking

### Hybrid Search
- **Keyword Matching**: Traditional text search with BM25 scoring
- **Semantic Matching**: Vector-based semantic similarity
- **Fusion Algorithms**: Combine scores using learning-to-rank
- **Query Expansion**: Expand queries with synonyms and related terms

### Personalized Search
- **User Profiling**: Build user interest profiles
- **Behavioral Signals**: Click-through rates, dwell time, bookmarks
- **Collaborative Signals**: Similar users' preferences
- **Temporal Decay**: Recent interactions weighted higher

## Recommendation Algorithms

### Collaborative Filtering
- **User-Item Matrix**: Build interaction matrix
- **Similarity Computation**: User and item similarity calculation
- **Neighborhood Selection**: Find similar users/items
- **Prediction Generation**: Generate recommendations

### Content-Based Filtering
- **Feature Extraction**: Extract content features and tags
- **Similarity Calculation**: Compute content similarity
- **Profile Building**: Create user preference profiles
- **Recommendation Generation**: Find similar content

### Learning Path Recommendations
- **Prerequisite Analysis**: Understand content dependencies
- **Skill Gap Identification**: Find missing knowledge
- **Progressive Difficulty**: Suggest appropriately challenging content
- **Adaptive Sequencing**: Adjust based on user performance

## Content Enrichment Pipeline

### 1. Content Analysis
1. Language detection and encoding normalization
2. Key concept extraction using NLP
3. Automatic tagging and categorization
4. Quality assessment and scoring

### 2. Summarization
1. Extractive summarization for factual content
2. Abstractive summarization for conceptual content
3. Multi-length summaries (short, medium, long)
4. Highlight key points and takeaways

### 3. Enhancement
1. Add related content links
2. Generate discussion questions
3. Create learning objectives
4. Suggest assessment questions

## Analytics and Insights

### Usage Metrics
- **Engagement Metrics**: Time spent, completion rates, return visits
- **Quality Metrics**: User ratings, helpfulness scores, difficulty ratings
- **Popularity Metrics**: View counts, shares, bookmarks
- **Performance Metrics**: Learning outcomes, assessment scores

### Trend Analysis
- **Content Trends**: Identify rising popular topics
- **User Behavior Trends**: Changing learning patterns
- **Seasonal Trends**: Time-based usage patterns
- **Performance Trends**: Learning effectiveness over time

### Predictive Analytics
- **Content Popularity Prediction**: Forecast content engagement
- **User Churn Prediction**: Identify at-risk users
- **Learning Path Optimization**: Suggest optimal content sequences
- **Resource Allocation**: Predict content demand

## Configuration

### Environment Variables
```
# Search Configuration
SEARCH_INDEX_REFRESH_INTERVAL=3600
SEMANTIC_SEARCH_THRESHOLD=0.7
HYBRID_SEARCH_WEIGHT_KEYWORD=0.4
HYBRID_SEARCH_WEIGHT_SEMANTIC=0.6

# Recommendation Configuration
COLLABORATIVE_FILTERING_NEIGHBORS=20
CONTENT_SIMILARITY_THRESHOLD=0.8
LEARNING_PATH_MAX_LENGTH=10
RECOMMENDATION_CACHE_TTL=1800

# Analytics Configuration
ANALYTICS_RETENTION_DAYS=365
TREND_ANALYSIS_WINDOW=30
PREDICTION_MODEL_UPDATE_INTERVAL=86400

# Content Processing
ENRICHMENT_BATCH_SIZE=50
SUMMARIZATION_MAX_LENGTH=500
TAG_CONFIDENCE_THRESHOLD=0.6
```

### Performance Tuning
```yaml
services:
  search-engine:
    environment:
      - SEARCH_INDEX_REFRESH_INTERVAL=${SEARCH_INDEX_REFRESH_INTERVAL}
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: '2.0'
```

## Performance Considerations

### Search Optimization
- **Index Optimization**: Efficient vector and text indexing
- **Caching Strategy**: Multi-level caching for search results
- **Query Optimization**: Parallel query execution
- **Result Pagination**: Efficient large result set handling

### Recommendation Optimization
- **Pre-computation**: Batch recommendation calculation
- **Real-time Updates**: Incremental updates for new interactions
- **Scalable Storage**: Efficient storage of user-item matrices
- **Load Balancing**: Distribute recommendation workload

### Analytics Optimization
- **Batch Processing**: Periodic analytics computation
- **Incremental Updates**: Real-time metric updates
- **Data Aggregation**: Pre-aggregated metrics for fast queries
- **Compression**: Efficient storage of historical data

## Testing

Run the Phase 2 test suite:
```bash
cd backend
pytest tests/test_search.py tests/test_recommendations.py tests/test_analytics.py -v
```

Test coverage includes:
- Search functionality and accuracy
- Recommendation algorithms
- Content enrichment pipeline
- Analytics and reporting

## Security Considerations

### Data Privacy
- User behavior data anonymization
- Secure storage of search queries
- Access controls for analytics data
- GDPR compliance for user data

### Content Security
- Safe content processing
- XSS prevention in search results
- Content filtering and moderation
- Audit logging of all operations

## Troubleshooting

Common issues and solutions:

1. **Search Performance Issues**
   - Optimize vector indexes
   - Adjust search thresholds
   - Implement result caching

2. **Recommendation Quality Problems**
   - Tune algorithm parameters
   - Improve data quality
   - Add more user interactions

3. **Analytics Data Inconsistencies**
   - Verify data collection
   - Check aggregation logic
   - Validate metric calculations

4. **Content Enrichment Failures**
   - Check NLP model availability
   - Review content quality
   - Adjust processing parameters

## Next Steps

Phase 3 will focus on:
1. Assessment generation and auto-grading
2. Learning pathway creation
3. Student progress tracking
4. Teacher dashboard and analytics
