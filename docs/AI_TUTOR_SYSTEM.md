# AI Tutor System Documentation

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Tutor Agent Specialization](#tutor-agent-specialization)
4. [RAG Pipeline](#rag-pipeline)
5. [LLM Provider System](#llm-provider-system)
6. [Context Filters](#context-filters)
7. [Session Management](#session-management)
8. [Personalization Engine](#personalization-engine)
9. [Subject Specialization](#subject-specialization)
10. [Prompt Engineering](#prompt-engineering)
11. [AI Audit Logging](#ai-audit-logging)
12. [Performance Metrics](#performance-metrics)
13. [Configuration](#configuration)
14. [Future Enhancements](#future-enhancements)
15. [Troubleshooting](#troubleshooting)

---

## Overview

The Lumina AI Tutor System is the core innovation of the platform, solving a critical educational challenge: **A teacher cannot personally mentor all 100 students in a class simultaneously.** Lumina's AI addresses this gap by providing every student with a personalized AI tutor that:

- Understands individual learning styles and knowledge gaps
- Adapts explanations to each student's comprehension level
- Uses Socratic questioning to guide discovery learning
- Maintains conversation context across sessions
- Learns from each interaction to improve recommendations
- Operates 24/7 without fatigue

### Key Objectives

| Objective | Implementation |
|-----------|-----------------|
| **24/7 Availability** | Always-on AI accessible from any device |
| **Individual Attention** | Unique conversation thread per student |
| **Pedagogically Sound** | Socratic method, scaffolding, metacognition |
| **Scalable** | Handles hundreds of concurrent sessions |
| **Adaptive** | Adjusts content complexity in real-time |
| **Integrated** | Works seamlessly with human teachers |

---

## System Architecture

### 3-Tier Response Generation System

The AI Tutor System employs a three-tier architecture to optimize response quality and latency:

```
┌─────────────────────────────────────────────────────────────┐
│                  Student Query Input                         │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
         ┌───────────────────────────────────────┐
         │   TIER 1: Response Cache (Redis)      │
         │  Check for similar past responses     │
         └───────────────┬───────────────────────┘
                         │
              ┌──────────┴──────────┐
              │ Cache Hit?          │
              ├─────────┬───────────┤
         YES  │         │     NO    │
              ▼         │           ▼
         Return      (5% of queries)
         Cached                 ┌──────────────────────────────────┐
         Response               │   TIER 2: RAG Retrieval          │
              │                │  - Query vector embedding        │
              │                │  - ChromaDB semantic search      │
              │                │  - Top-K relevant chunks (k=5)  │
              │                └──────────────┬───────────────────┘
              │                               │
              │        ┌──────────────────────┘
              │        │
              │        ▼
              │    ┌──────────────────────────────────┐
              │    │   TIER 3: LLM Generation        │
              │    │  - Load context from RAG        │
              │    │  - Generate response with      │
              │    │    learner profile context     │
              │    │  - LLM: Ollama (local default) │
              │    │    or Gemini API               │
              │    └──────────────┬───────────────────┘
              │                   │
              │                   ▼
              │         ┌────────────────────┐
              │         │  Format Response   │
              │         │  Cache in Redis    │
              │         └────────────────────┘
              │                   │
              └───────┬───────────┘
                      │
                      ▼
         ┌──────────────────────────────────────┐
         │   Return Response to Student         │
         │   Log interaction & update profile   │
         └──────────────────────────────────────┘
```

### Component Overview

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **API Gateway** | FastAPI | HTTP endpoints for tutor chat, ingestion, course generation |
| **TutorAgent** | Python class | Orchestrates response generation, manages conversation flow |
| **RAG Pipeline** | ChromaDB + Ollama | Semantic search and context retrieval |
| **Vector Store** | ChromaDB | Persistent storage of course content embeddings |
| **Cache Layer** | Redis | In-memory storage of recent responses, user sessions |
| **LLM Provider** | Ollama or Gemini | Text generation with provider abstraction |
| **Learner Profile** | LearnerProfileEngine | Dynamic student behavior and mastery models |
| **Session Manager** | Redis + PostgreSQL | Conversation history, user state |

### Request Flow Sequence Diagram

```
Student          API            TutorAgent        RAG         LLM
   │              │                 │             │           │
   │──Chat────────>│                 │             │           │
   │              │─Validate────────>│             │           │
   │              │                 │             │           │
   │              │<─Get Profile────────────────────────────────│
   │              │ (from Redis/DB)  │             │           │
   │              │                 │             │           │
   │              │─Create Context──>│             │           │
   │              │ + Learner Data   │             │           │
   │              │                 │─Embed────>  │           │
   │              │                 │  Query      │           │
   │              │                 │             │           │
   │              │                 │<─Search──────           │
   │              │                 │ (K=5 chunks)            │
   │              │                 │             │           │
   │              │                 │─Build Prompt────────────>│
   │              │                 │             │           │
   │              │                 │             │  Generate │
   │              │                 │             │           │
   │              │                 │<─Response──────────────┤
   │              │<─Format────────<│             │           │
   │              │ + Cache          │             │           │
   │              │                 │             │           │
   │──Response────>│                 │             │           │
   │              │                 │             │           │
   │              │──Log & Update Profile────────────────────│
   │              │                 │             │           │
```

---

## Tutor Agent Specialization

### TutorAgent Class Architecture

The `TutorAgent` class is the core orchestrator for AI tutoring interactions. Located in `backend/ai_engine/swarm/tutor.py`, it manages conversation flow, context awareness, and adaptive responses.

```python
class TutorAgent:
    """
    Personalized AI tutor for individual student interactions.

    Attributes:
        agent_id: Unique identifier for this tutor instance
        subject: Subject domain (math, physics, biology, etc.)
        model_provider: LLM provider (ollama, gemini)
        learner_profile: Current student's behavior/mastery profile
        conversation_history: List of (role, content) tuples
        context_filters: Applied filters (topic, difficulty, course)
    """

    async def generate_response(
        self,
        topic: str,
        user_query: str,
        history: List[Dict],
        learner_profile: LearnerProfile,
        context_filters: ContextFilters
    ) -> TutorResponse:
        """
        Generate adaptive response using Socratic method.

        Args:
            topic: Current subject topic (e.g., "quadratic_equations")
            user_query: Student's question or statement
            history: Previous conversation turns
            learner_profile: Student's mastery/behavior data
            context_filters: Applied constraints (course, difficulty)

        Returns:
            TutorResponse object with explanation, follow-up, confidence
        """
        pass

    async def detect_misconception(
        self,
        user_response: str,
        expected_concept: str
    ) -> Optional[Misconception]:
        """Identify common misconceptions in student responses."""
        pass

    async def scaffold_explanation(
        self,
        topic: str,
        current_level: int,
        learning_style: str
    ) -> ScaffoldedExplanation:
        """Build step-by-step explanation matching cognitive level."""
        pass

    async def generate_clarifying_question(
        self,
        student_response: str,
        target_concept: str
    ) -> str:
        """Generate Socratic follow-up question to guide discovery."""
        pass
```

### Socratic Dialogue Method

Rather than directly providing answers, the TutorAgent employs Socratic questioning to guide students toward discoveries:

**Example Interaction: Quadratic Equations**

```
Student: "How do I solve x² + 5x + 6 = 0?"

AI Tutor (Socratic): "Great question! Before we jump to the formula,
let me ask: What do you notice about the numbers 5 and 6?
How might they relate to the 6 in the right side and the 5 as the coefficient?"

Student: "Hmm, 2 × 3 = 6 and 2 + 3 = 5?"

AI Tutor: "Exactly! You've found the pattern. So if we factor this as
(x + 2)(x + 3) = 0, what does that tell us about the solutions?"

Student: "Oh! x must be -2 or -3?"

AI Tutor: "Perfect! You've just discovered the factoring method.
This works because when a product equals zero, at least one factor must be zero.
Can you think of why this is true mathematically?"
```

### Pedagogical Strategies

The TutorAgent implements evidence-based teaching techniques:

| Strategy | Implementation | When to Use |
|----------|----------------|------------|
| **Scaffolding** | Break complex problems into steps | Student mastery < 60% |
| **Analogies** | Relate new concepts to familiar ones | Abstract concept difficulty |
| **Worked Examples** | Show solved problem step-by-step | After initial explanation |
| **Spaced Repetition** | Return to topics at intervals | Based on forgetting curve |
| **Metacognition** | Ask students to explain their thinking | Detect misconceptions |
| **Socratic Method** | Guide with questions, not answers | Promote deep learning |
| **Error Analysis** | Help student find and fix mistakes | After incorrect attempt |

---

## RAG Pipeline

### Retrieval-Augmented Generation Overview

The RAG pipeline ensures the AI Tutor references course-specific, accurate content rather than hallucinating information. It operates in two phases: **ingestion** and **retrieval**.

### Ingestion Pipeline

```
┌─────────────────────────────┐
│   Course Material Input     │
│  (PDF, text, web content)   │
└──────────────┬──────────────┘
               │
               ▼
       ┌────────────────┐
       │  Text Extraction│
       │  & Preprocessing│
       └────────┬───────┘
               │
               ▼
    ┌──────────────────────────┐
    │  Chunk Text              │
    │  - Size: 512 tokens      │
    │  - Overlap: 50 tokens    │
    │  - Respect boundaries    │
    └──────────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │  Generate Embeddings │
        │  - Model: all-MiniLM │
        │  - Dimension: 384    │
        │  - Batch size: 32    │
        └──────────────┬───────┘
                       │
                       ▼
            ┌──────────────────────┐
            │  Store in ChromaDB   │
            │  - Vector index      │
            │  - Metadata          │
            │  - Document ID       │
            └──────────────┬───────┘
                           │
                           ▼
            ┌──────────────────────────┐
            │  Index Ready for Query   │
            │  ~5ms retrieval time     │
            └──────────────────────────┘
```

### API: POST /api/tutor/ingest

Ingests new course content into the RAG system.

```python
class IngestRequest(BaseModel):
    """Request to ingest content into RAG pipeline."""

    course_id: str
    topic: str
    content: str  # Raw text content
    source_type: str  # 'textbook', 'lecture', 'article', 'assignment'
    source_name: str  # 'Chapter 3: Photosynthesis'
    metadata: Optional[Dict] = None

class IngestResponse(BaseModel):
    """Response after ingestion."""

    chunks_created: int
    embeddings_generated: int
    storage_location: str  # ChromaDB collection
    retrieval_time_ms: float
    status: str  # 'success', 'partial', 'failed'
```

### Retrieval Strategy

When a student asks a question, the system retrieves relevant content:

```python
async def retrieve_context(
    query: str,
    course_id: str,
    topic: Optional[str] = None,
    max_results: int = 5,
    similarity_threshold: float = 0.65
) -> List[RetrievedChunk]:
    """
    Retrieve relevant course chunks via semantic search.

    Process:
    1. Embed student query using same model as ingestion
    2. Search ChromaDB with cosine similarity
    3. Filter by course_id and optional topic
    4. Rerank results using query-relevance scoring
    5. Return top-K chunks above similarity threshold
    """

    # Step 1: Embed query
    query_embedding = embedding_model.encode(query)

    # Step 2: Vector search
    results = chroma_client.query(
        collection_name=f"course_{course_id}",
        query_embeddings=[query_embedding],
        n_results=max_results * 2,  # Retrieve more for reranking
        where={"topic": topic} if topic else None
    )

    # Step 3: Rerank and filter
    retrieved = [
        RetrievedChunk(
            content=r['content'],
            source=r['metadata']['source'],
            relevance_score=score,
            document_id=r['id']
        )
        for r, score in zip(results['documents'], results['distances'])
        if score >= similarity_threshold
    ]

    return retrieved[:max_results]
```

### ChromaDB Configuration

```yaml
# Vector Database Settings
chroma:
  host: "localhost"
  port: 8000
  persistence_directory: "/data/chroma"

  # Embedding Model
  embedding_model: "sentence-transformers/all-MiniLM-L6-v2"
  embedding_dimension: 384

  # Retrieval Parameters
  max_chunk_size: 512
  chunk_overlap: 50
  similarity_metric: "cosine"

  # Collections per Course
  collection_naming: "course_{course_id}"
  retention_policy: "30_days"  # Auto-delete old chunks
```

### RAG Quality Metrics

```python
class RAGMetrics:
    """Metrics for RAG pipeline quality assurance."""

    retrieval_latency_p95: float  # Should be < 100ms
    chunk_relevance_score: float  # 0-1, should be > 0.75
    hallucination_rate: float     # % of responses contradicting sources
    source_attribution_rate: float # % responses citing sources
    coverage_gaps: int             # Number of student queries with no relevant chunks
```

---

## LLM Provider System

### Provider Abstraction

The AI Tutor supports multiple LLM providers through a provider abstraction layer. This allows:

- **Ollama (default, local)**: Fast, no API costs, full control over model selection
- **Google Gemini API**: Advanced models, lower latency in some cases

### LLM Provider Interface

```python
class LLMProvider(ABC):
    """Abstract base for LLM providers."""

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system_prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 1024,
        context_window: int = 8192
    ) -> GeneratedResponse:
        """Generate text response from prompt."""
        pass

    @abstractmethod
    async def is_available(self) -> bool:
        """Check if provider is operational."""
        pass

    @abstractmethod
    def estimate_cost(self, tokens: int) -> float:
        """Estimate API cost for token usage."""
        pass

class OllamaProvider(LLMProvider):
    """Local LLM provider using Ollama."""

    async def generate(self, prompt, system_prompt, **kwargs):
        """
        Call local Ollama instance.

        Default models:
        - mistral (7B) - Fast, accurate
        - neural-chat (7B) - Optimized for dialogue
        - llama2 (7B/13B) - General purpose
        """
        client = OllamaAsyncClient(
            host=self.config.ollama_host,  # Default: "http://localhost:11434"
            model=self.config.model_name   # Set per subject
        )

        response = await client.generate(
            model=self.config.model_name,
            prompt=prompt,
            system=system_prompt,
            stream=False,
            **kwargs
        )

        return GeneratedResponse(
            text=response.response,
            completion_tokens=response.prompt_eval_count,
            prompt_tokens=response.eval_count,
            model=self.config.model_name
        )

class GeminiProvider(LLMProvider):
    """Cloud LLM provider using Google Gemini API."""

    async def generate(self, prompt, system_prompt, **kwargs):
        """
        Call Google Gemini API.

        Models available:
        - gemini-pro (latest)
        - gemini-pro-vision (multimodal)
        """
        client = genai.AsyncGenerativeModel(
            model_name="gemini-pro",
            system_instruction=system_prompt,
            safety_settings=[
                SafetySetting(
                    category="HARM_CATEGORY_HARASSMENT",
                    threshold="BLOCK_NONE"  # Education focused
                )
            ]
        )

        response = await client.generate_content_async(
            contents=prompt,
            generation_config=genai.GenerationConfig(
                temperature=kwargs.get('temperature', 0.7),
                max_output_tokens=kwargs.get('max_tokens', 1024)
            ),
            stream=False
        )

        return GeneratedResponse(
            text=response.text,
            completion_tokens=len(response.text.split()),
            prompt_tokens=len(prompt.split()),
            model="gemini-pro"
        )
```

### Provider Selection Strategy

```python
class ProviderRouter:
    """Route requests to optimal LLM provider."""

    async def select_provider(
        self,
        request_context: TutorChatRequest,
        performance_metrics: Dict
    ) -> LLMProvider:
        """
        Select provider based on:
        1. Latency requirements
        2. Cost budget
        3. Model capability needs
        4. Provider availability
        """

        # Priority 1: Availability
        if not await self.gemini_provider.is_available():
            return self.ollama_provider

        # Priority 2: Latency requirement
        if request_context.requires_fast_response:  # < 2 seconds
            if performance_metrics['ollama_p95_latency_ms'] < 800:
                return self.ollama_provider
            else:
                return self.gemini_provider

        # Priority 3: Cost (use cheaper when available)
        monthly_api_spend = await self.get_monthly_spend()
        if monthly_api_spend > self.monthly_budget_threshold:
            return self.ollama_provider

        # Priority 4: Model capability
        if request_context.requires_advanced_reasoning:
            return self.gemini_provider  # Better reasoning models

        # Default: Ollama (no cost, always available)
        return self.ollama_provider
```

### API: POST /api/tutor/chat

Main tutoring endpoint with provider selection.

```python
class TutorChatRequest(BaseModel):
    """Request for AI tutor response."""

    message: str                              # Student's query
    user_id: str                              # Student identifier
    session_id: str                           # Conversation session
    course_id: str
    topic: Optional[str] = None
    context_filters: Optional[ContextFilters] = None
    provider: Literal["ollama", "gemini"] = "ollama"  # Explicit provider choice
    include_reasoning: bool = False           # Return reasoning steps
    confidence_threshold: float = 0.7         # Reject low-confidence responses

@router.post("/api/tutor/chat", response_model=TutorChatResponse)
async def tutor_chat(
    request: TutorChatRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Process student query through AI tutor pipeline.

    Steps:
    1. Validate student enrollment in course
    2. Retrieve learner profile
    3. Apply context filters
    4. Retrieve relevant course content (RAG)
    5. Select LLM provider
    6. Generate response with system prompt
    7. Log interaction for analytics
    8. Update learner profile based on interaction
    9. Cache response in Redis
    10. Return formatted response
    """

    # Load student profile
    learner_profile = await LearnerProfileEngine.get_profile(
        user_id=request.user_id,
        course_id=request.course_id
    )

    # Retrieve relevant course content
    rag_context = await retrieve_context(
        query=request.message,
        course_id=request.course_id,
        topic=request.topic,
        max_results=5
    )

    # Select provider
    provider = await provider_router.select_provider(
        request_context=request,
        performance_metrics=await get_performance_metrics()
    )

    # Generate response
    tutor_agent = TutorAgent(
        subject=determine_subject(request.course_id),
        model_provider=provider,
        learner_profile=learner_profile
    )

    response = await tutor_agent.generate_response(
        topic=request.topic,
        user_query=request.message,
        history=await get_conversation_history(request.session_id),
        learner_profile=learner_profile,
        context_filters=request.context_filters,
        rag_context=rag_context
    )

    # Log interaction
    await log_tutor_interaction(
        user_id=request.user_id,
        session_id=request.session_id,
        query=request.message,
        response=response.text,
        provider=provider.__class__.__name__,
        latency_ms=response.generation_time_ms
    )

    # Update learner profile
    await learner_profile.update_from_interaction(
        query=request.message,
        response=response,
        topic=request.topic
    )

    return TutorChatResponse(
        response_text=response.text,
        follow_up_question=response.follow_up_question,
        confidence_score=response.confidence_score,
        sources=rag_context,
        provider=provider.__class__.__name__,
        generation_time_ms=response.generation_time_ms
    )
```

---

## Context Filters

### Purpose and Application

Context filters ensure that AI responses are tailored to the current learning context, preventing irrelevant or advanced information from overwhelming students.

```python
class ContextFilters(BaseModel):
    """Filters applied to constrain AI responses."""

    course_id: str                              # Required
    topic: Optional[str] = None               # e.g., "quadratic_equations"
    difficulty_level: Optional[int] = None    # 1-5 (1=intro, 5=advanced)
    learning_phase: Optional[str] = None      # "exploration", "practice", "mastery"
    excluded_topics: List[str] = []           # Topics to avoid mentioning
    required_concepts: List[str] = []         # Prerequisites to reinforce
    language_level: Optional[str] = None      # "simple", "standard", "academic"
    response_format: Optional[str] = None     # "explanation", "question", "exercise"

class ContextFilterEngine:
    """Apply filters to RAG results and prompt generation."""

    async def filter_rag_results(
        self,
        retrieved_chunks: List[RetrievedChunk],
        filters: ContextFilters
    ) -> List[RetrievedChunk]:
        """
        Filter and reorder retrieved content based on context.

        Filtering rules:
        1. Exclude chunks covering excluded_topics
        2. Prioritize chunks from current topic
        3. Match difficulty level (within ±1 level)
        4. Remove prerequisites already mastered
        5. Include reinforcement of required_concepts
        """

        filtered = []

        for chunk in retrieved_chunks:
            # Rule 1: Check excluded topics
            if any(excluded in chunk.content.lower()
                   for excluded in filters.excluded_topics):
                continue

            # Rule 2: Boost current topic
            topic_bonus = 1.2 if filters.topic in chunk.metadata.get('topics', []) else 1.0

            # Rule 3: Difficulty matching
            chunk_difficulty = chunk.metadata.get('difficulty_level', 2)
            target_difficulty = filters.difficulty_level or 2
            difficulty_mismatch = abs(chunk_difficulty - target_difficulty)
            if difficulty_mismatch > 1:
                chunk.relevance_score *= 0.5

            # Rule 4: Exclude mastered prerequisites
            chunk_prerequisites = chunk.metadata.get('prerequisites', [])
            mastery_status = await self.get_mastery_status(chunk_prerequisites)
            if all(mastery > 0.8 for mastery in mastery_status.values()):
                continue  # Skip if all prerequisites mastered

            # Rule 5: Include required concepts
            if any(req in chunk.content for req in filters.required_concepts):
                chunk.relevance_score *= 1.3

            filtered.append(chunk)

        return sorted(filtered, key=lambda x: x.relevance_score, reverse=True)[:5]

    async def build_context_prompt(
        self,
        base_system_prompt: str,
        filters: ContextFilters,
        learner_profile: LearnerProfile
    ) -> str:
        """
        Build system prompt incorporating all context filters.

        Template:
        {base_prompt}

        CONTEXT CONSTRAINTS:
        - Current course: {course_name}
        - Current topic: {topic}
        - Student difficulty level: {difficulty_level}/5
        - Learning phase: {learning_phase}
        - Prerequisite concepts to reinforce: {required_concepts}
        - Topics to avoid: {excluded_topics}

        STUDENT PROFILE:
        - Mastery level: {mastery_percentage}%
        - Learning style: {learning_style}
        - Response speed: {responds_in_X_seconds}
        - Patience level: {patience_score}/10

        RESPONSE GUIDELINES:
        - Response format: {response_format}
        - Language complexity: {language_level}
        - Include worked examples: {include_examples}
        - Time estimate: < {max_response_time} minutes
        """

        course_name = await self.get_course_name(filters.course_id)
        mastery_pct = learner_profile.get_topic_mastery(filters.topic) * 100

        return base_system_prompt + f"""

CONTEXT CONSTRAINTS:
- Current course: {course_name}
- Current topic: {filters.topic or 'General'}
- Student difficulty level: {filters.difficulty_level or 2}/5
- Learning phase: {filters.learning_phase or 'practice'}
- Prerequisite concepts to reinforce: {', '.join(filters.required_concepts) or 'None'}
- Topics to avoid: {', '.join(filters.excluded_topics) or 'None'}

STUDENT PROFILE:
- Current mastery: {mastery_pct:.0f}%
- Learning style: {learner_profile.learning_style}
- Typical response time: {learner_profile.avg_response_seconds}s
- Patience level: {learner_profile.patience_score}/10

RESPONSE GUIDELINES:
- Format: {filters.response_format or 'detailed_explanation'}
- Language level: {filters.language_level or 'standard'}
- Include worked examples: {'Yes' if mastery_pct < 70 else 'Brief'}
- Maximum response time: 2 minutes
"""
```

---

## Session Management

### Session Architecture

Each student-AI tutor conversation is a separate session with its own history, context, and state management.

```python
class TutorSession(BaseModel):
    """Represents a single tutoring conversation."""

    session_id: str                    # UUID
    user_id: str                       # Student
    course_id: str
    topic: Optional[str]
    created_at: datetime
    last_activity: datetime
    conversation_history: List[Message]  # Full chat history
    session_state: SessionState        # Current state
    context_filters: ContextFilters
    metadata: Dict                     # Session-specific data

    # Performance metrics
    total_exchanges: int               # Number of turns
    avg_response_time_ms: float
    student_satisfaction: Optional[float]  # 1-5 rating

class Message(BaseModel):
    """Single message in conversation."""

    timestamp: datetime
    role: Literal["user", "assistant"]
    content: str
    metadata: Optional[Dict] = None

    # Optional: Used for analytics
    emotion_detected: Optional[str]    # "confused", "frustrated", "engaged"
    message_type: Optional[str]        # "question", "reflection", "error"

class SessionState(BaseModel):
    """Current session state for context."""

    phase: Literal["introduction", "learning", "practice", "assessment", "reflection"]
    current_topic: str
    topic_mastery: float               # 0-1
    learning_objectives_covered: List[str]
    misconceptions_identified: List[str]
    next_recommended_topic: Optional[str]
    session_duration_minutes: int
    engagement_score: float            # 0-100
```

### Redis Session Storage

```python
class SessionManager:
    """Manages session persistence and retrieval."""

    REDIS_KEY_TEMPLATE = "session:{session_id}"
    HISTORY_KEY_TEMPLATE = "history:{session_id}"
    SESSION_TTL = 7 * 24 * 60 * 60  # 7 days

    async def create_session(
        self,
        user_id: str,
        course_id: str,
        topic: Optional[str] = None,
        context_filters: Optional[ContextFilters] = None
    ) -> str:
        """Create new tutoring session."""

        session_id = str(uuid4())
        session = TutorSession(
            session_id=session_id,
            user_id=user_id,
            course_id=course_id,
            topic=topic,
            created_at=datetime.now(),
            last_activity=datetime.now(),
            conversation_history=[],
            session_state=SessionState(phase="introduction", ...),
            context_filters=context_filters or ContextFilters(course_id=course_id),
            metadata={}
        )

        # Store in Redis with TTL
        await self.redis.setex(
            self.REDIS_KEY_TEMPLATE.format(session_id=session_id),
            self.SESSION_TTL,
            session.json()
        )

        # Initialize empty history
        await self.redis.delete(
            self.HISTORY_KEY_TEMPLATE.format(session_id=session_id)
        )

        # Also backup to PostgreSQL for long-term storage
        await self.db.sessions.insert({
            "session_id": session_id,
            "user_id": user_id,
            "course_id": course_id,
            "created_at": session.created_at
        })

        return session_id

    async def get_session(self, session_id: str) -> TutorSession:
        """Retrieve session from Redis or DB."""

        # Try Redis (fast path)
        cached = await self.redis.get(
            self.REDIS_KEY_TEMPLATE.format(session_id=session_id)
        )
        if cached:
            return TutorSession.parse_raw(cached)

        # Fall back to PostgreSQL
        db_session = await self.db.sessions.find_one(
            {"session_id": session_id}
        )
        if db_session:
            # Reconstruct from DB + history
            return await self._reconstruct_session(db_session)

        raise SessionNotFoundError(f"Session {session_id} not found")

    async def add_message(
        self,
        session_id: str,
        role: str,
        content: str,
        metadata: Optional[Dict] = None
    ) -> None:
        """Add message to conversation history."""

        message = Message(
            timestamp=datetime.now(),
            role=role,
            content=content,
            metadata=metadata
        )

        # Append to Redis list
        await self.redis.rpush(
            self.HISTORY_KEY_TEMPLATE.format(session_id=session_id),
            message.json()
        )

        # Update session last activity
        session = await self.get_session(session_id)
        session.last_activity = datetime.now()
        session.total_exchanges += 1
        await self._update_session(session_id, session)

        # Asynchronously backup to PostgreSQL
        await self.db.messages.insert({
            "session_id": session_id,
            "timestamp": message.timestamp,
            "role": message.role,
            "content": message.content
        })

    async def get_history(
        self,
        session_id: str,
        limit: int = 20
    ) -> List[Message]:
        """Get conversation history (most recent messages)."""

        # Get from Redis
        history_data = await self.redis.lrange(
            self.HISTORY_KEY_TEMPLATE.format(session_id=session_id),
            -limit,
            -1
        )

        return [
            Message.parse_raw(item)
            for item in history_data
        ]

    async def end_session(self, session_id: str) -> SessionSummary:
        """Close session and generate summary."""

        session = await self.get_session(session_id)
        history = await self.get_history(session_id, limit=None)

        summary = SessionSummary(
            session_id=session_id,
            duration_minutes=session.session_duration_minutes,
            total_messages=len(history),
            topics_covered=session.session_state.learning_objectives_covered,
            learning_gains=await self._calculate_learning_gains(session),
            misconceptions_addressed=session.session_state.misconceptions_identified,
            recommended_next_step=session.session_state.next_recommended_topic
        )

        # Save summary to DB
        await self.db.session_summaries.insert(summary.dict())

        # Delete from Redis (TTL will eventually clean up)
        await self.redis.delete(
            self.REDIS_KEY_TEMPLATE.format(session_id=session_id),
            self.HISTORY_KEY_TEMPLATE.format(session_id=session_id)
        )

        return summary
```

---

## Personalization Engine

### Dynamic Adaptation

The AI Tutor adapts responses in real-time based on the student's profile:

```python
class PersonalizationEngine:
    """Adapts tutor behavior to individual student."""

    async def customize_response(
        self,
        base_response: str,
        learner_profile: LearnerProfile,
        context_filters: ContextFilters
    ) -> PersonalizedResponse:
        """
        Transform generic response into personalized version.

        Personalization dimensions:
        1. Complexity level
        2. Example types
        3. Pacing and detail
        4. Motivation/encouragement
        5. Format preferences
        """

        # Dimension 1: Adjust complexity
        if learner_profile.mastery < 0.4:
            response = self._simplify_explanation(base_response)
        elif learner_profile.mastery > 0.8:
            response = self._deepen_explanation(base_response)
        else:
            response = base_response

        # Dimension 2: Add preferred example types
        examples = await self._generate_examples(
            topic=context_filters.topic,
            preferred_style=learner_profile.learning_style,
            count=learner_profile.prefers_examples and 2 or 0
        )
        if examples:
            response = self._inject_examples(response, examples)

        # Dimension 3: Adjust pacing
        if learner_profile.patience_score < 5:
            response = self._condense(response, max_sentences=3)
        elif learner_profile.patience_score > 8:
            response = self._expand(response, add_rationale=True)

        # Dimension 4: Add motivation
        if learner_profile.engagement_score < 50:
            encouragement = self._generate_encouragement(
                recent_progress=learner_profile.recent_progress
            )
            response = f"{response}\n\n{encouragement}"

        # Dimension 5: Format preferences
        if learner_profile.prefers_bullet_points:
            response = self._convert_to_bullets(response)
        elif learner_profile.prefers_detailed_explanations:
            response = self._expand_with_reasoning(response)

        return PersonalizedResponse(
            text=response,
            complexity_level=learner_profile.mastery,
            estimated_read_time_seconds=len(response.split()) // 3
        )
```

### Learning Style Detection

```python
class LearningStyleDetector:
    """Identifies student's preferred learning modality."""

    STYLES = {
        "visual": "Learn better with diagrams, charts, visualizations",
        "auditory": "Learn better with explanations and dialogue",
        "kinesthetic": "Learn better with hands-on practice and movement",
        "reading_writing": "Learn better with text and note-taking"
    }

    async def detect_style(
        self,
        user_id: str,
        session_history: List[Message],
        interaction_patterns: Dict
    ) -> LearningStyleProfile:
        """
        Infer learning style from interaction patterns.

        Indicators:
        - Visual: Requests for diagrams, uses drawing tools, mentions "see"
        - Auditory: Asks for explanations, questions about why, dialogue-heavy
        - Kinesthetic: Prefers practice problems, asks "how to do", explores examples
        - Reading/Writing: Takes notes, asks for detailed text, copies important parts
        """

        scores = {"visual": 0, "auditory": 0, "kinesthetic": 0, "reading_writing": 0}

        # Analyze dialogue patterns
        for message in session_history:
            if message.role == "user":
                content = message.content.lower()

                # Visual indicators
                if any(word in content for word in ["diagram", "draw", "show", "visualize", "picture", "graph"]):
                    scores["visual"] += 2

                # Auditory indicators
                if any(word in content for word in ["explain", "why", "how does", "understand", "talk through"]):
                    scores["auditory"] += 2

                # Kinesthetic indicators
                if any(word in content for word in ["try", "practice", "do", "solve", "example", "work through"]):
                    scores["kinesthetic"] += 2

                # Reading/Writing indicators
                if any(word in content for word in ["note", "write", "define", "list", "summarize"]):
                    scores["reading_writing"] += 2

        # Analyze tool usage
        if "used_drawing_tool" in interaction_patterns:
            scores["visual"] += 3
        if "requested_pdf_export" in interaction_patterns:
            scores["reading_writing"] += 3
        if "solved_practice_problems" in interaction_patterns:
            scores["kinesthetic"] += 3

        # Normalize and determine dominant style
        total = sum(scores.values())
        if total == 0:
            return LearningStyleProfile(dominant_style="balanced", scores=scores)

        normalized = {k: v / total for k, v in scores.items()}
        dominant = max(normalized, key=normalized.get)

        return LearningStyleProfile(
            dominant_style=dominant,
            scores=normalized,
            confidence=normalized[dominant],
            detected_at=datetime.now()
        )
```

---

## Subject Specialization

### Subject-Specific Tutors

Different subjects require different pedagogical approaches. The system maintains specialized system prompts and strategies per subject.

```python
class SubjectSpecialization(Enum):
    """Available subject specializations."""

    MATHEMATICS = "mathematics"
    PHYSICS = "physics"
    CHEMISTRY = "chemistry"
    BIOLOGY = "biology"
    COMPUTER_SCIENCE = "computer_science"
    HISTORY = "history"
    LITERATURE = "literature"
    LANGUAGES = "languages"

class MathematicsTutor(TutorAgent):
    """Specialized tutor for mathematics."""

    SYSTEM_PROMPT_TEMPLATE = """You are an expert mathematics tutor helping a student learn.
Your teaching style:
1. Use the Socratic method - guide discovery through questions
2. Build from concrete to abstract:
   - Start with examples and intuition
   - Then develop mathematical reasoning
   - Finally present formal definitions
3. Show worked examples step-by-step
4. Identify misconceptions early:
   - Common errors in algebra (sign errors, order of operations)
   - Conceptual misunderstandings (confusing area with perimeter)
   - Procedure confusion (which formula to use when)
5. Use visual representations:
   - Number lines for inequalities
   - Graphs for functions
   - Geometric diagrams for proofs
6. Connect to real-world applications when possible
7. Adjust symbolic notation based on mastery level:
   - Beginners: More words, fewer symbols
   - Advanced: Standard mathematical notation
8. Praise effort and growth, not just correct answers

Student Level: {student_level}/5 (1=beginning, 5=advanced)
Topic: {topic}
Recent Misconceptions: {misconceptions}
Mastery: {mastery_percentage}%

Generate a response that:
- Is encouraging and patient
- Matches the student's difficulty level
- Uses appropriate examples
- Guides rather than tells
- Is concise but complete
"""

    async def generate_response(self, **kwargs):
        """Math-specific response generation with symbolic notation."""

        # Detect mathematical notation preferences
        student_level = kwargs['learner_profile'].difficulty_level

        # Customize LaTeX usage
        if student_level >= 3:
            allow_latex = True
        else:
            allow_latex = False  # Use plain language for beginners

        # Build specialized prompt
        system_prompt = self.SYSTEM_PROMPT_TEMPLATE.format(
            student_level=student_level,
            topic=kwargs.get('topic'),
            misconceptions=', '.join(kwargs['learner_profile'].known_misconceptions),
            mastery_percentage=kwargs['learner_profile'].mastery * 100
        )

        response = await super().generate_response(
            system_prompt=system_prompt,
            **kwargs
        )

        # Post-process: LaTeX formatting
        if allow_latex:
            response.text = self._format_latex(response.text)
        else:
            response.text = self._convert_latex_to_plain_language(response.text)

        return response

    @staticmethod
    def _format_latex(text: str) -> str:
        """Ensure proper LaTeX formatting for mathematical expressions."""
        # Add $ delimiters where missing, format common expressions
        return text

class PhysicsTutor(TutorAgent):
    """Specialized tutor for physics."""

    SYSTEM_PROMPT_TEMPLATE = """You are an expert physics tutor.
Your teaching style:
1. Start with intuition and observation
2. Connect to real-world phenomena the student knows
3. Progressively introduce mathematical models
4. Emphasize conceptual understanding before equations
5. Help distinguish between:
   - Vector vs scalar quantities
   - Actual motion vs representation
   - Ideal vs real-world scenarios
6. Use analogies to relate new concepts to familiar ones
7. Check for common misconceptions:
   - "Heavier objects fall faster" (no, gravity is constant)
   - "Objects need a force to keep moving" (no, velocity is constant in absence of force)
   - Confusing weight and mass
   - Thinking that faster objects exert more force
8. Always include units and dimensional analysis
9. Relate to everyday experience

Topic: {topic}
Level: {student_level}/5
Misconceptions: {misconceptions}

Response should:
- Explain the "why" before the "how"
- Include a worked example if solving a problem
- Connect to real phenomena
- Address identified misconceptions explicitly
"""

    async def identify_misconception(
        self,
        user_response: str,
        expected_concept: str
    ) -> Optional[Misconception]:
        """Physics-specific misconception detection."""

        physics_misconceptions = {
            "force_causes_motion": "Objects need force to keep moving",
            "heavier_falls_faster": "Heavier objects fall faster",
            "weight_equals_mass": "Weight and mass are the same",
            "higher_velocity_more_force": "Faster objects exert more force",
            "newtons_third_law": "Misconception about Newton's third law",
        }

        for misconception_key, description in physics_misconceptions.items():
            if self._matches_misconception_pattern(user_response, misconception_key):
                return Misconception(
                    type=misconception_key,
                    description=description,
                    intervention=f"Let me clarify: {description} is actually a common misconception..."
                )

        return None

class ComputerScienceTutor(TutorAgent):
    """Specialized tutor for computer science."""

    SYSTEM_PROMPT_TEMPLATE = """You are an expert computer science tutor.
Your teaching style:
1. Start with high-level concepts before syntax
2. Use analogies from daily life
3. Encourage "hands-on" thinking (mentally run the code)
4. Build from simple to complex programs
5. Emphasize computational thinking:
   - Breaking problems into steps (decomposition)
   - Recognizing patterns (abstraction)
   - Building reusable pieces (modularity)
6. Help debug by guiding the thinking process
7. Common misconceptions:
   - Variables are like algebraic unknowns (they're named storage)
   - Code runs top-to-bottom only (there's loops and conditionals)
   - = means equals (it means assignment)
   - Functions are just organization (they're reusable units with inputs/outputs)
8. Share relevant code examples
9. Emphasize that programming is problem-solving

Topic: {topic}
Language: {programming_language}
Level: {student_level}/5

Response should:
- Explain concept first, then code
- Show working examples
- Ask leading questions to guide solution
- Connect to programming patterns student knows
"""

    async def generate_code_explanation(
        self,
        code_snippet: str,
        student_question: str,
        mastery_level: int
    ) -> CodeExplanation:
        """Generate explanation of code at appropriate level."""

        explanation = CodeExplanation()

        # Beginner: Explain every line
        if mastery_level <= 2:
            explanation.line_by_line = await self._explain_every_line(code_snippet)
            explanation.execution_trace = await self._trace_execution(code_snippet)

        # Intermediate: Explain key concepts
        elif mastery_level == 3:
            explanation.key_concepts = await self._extract_key_concepts(code_snippet)
            explanation.execution_trace = await self._trace_execution(code_snippet)

        # Advanced: Discuss design and optimization
        else:
            explanation.design_patterns = await self._identify_patterns(code_snippet)
            explanation.time_complexity = await self._analyze_complexity(code_snippet)
            explanation.optimization_notes = await self._suggest_optimizations(code_snippet)

        return explanation
```

---

## Prompt Engineering

### System Prompt Architecture

Effective tutoring depends on well-structured system prompts. Lumina uses a modular prompt template system.

```python
class SystemPromptBuilder:
    """Builds dynamic system prompts from components."""

    BASE_TUTOR_PROMPT = """You are an expert, patient AI tutor. Your role is to help students learn by:
1. Asking guiding questions rather than providing direct answers
2. Scaffolding explanations from simple to complex
3. Identifying and addressing misconceptions
4. Adapting to the student's level and learning style
5. Providing encouragement and building confidence
6. Using analogies and real-world examples
7. Checking understanding frequently

Never:
- Give away answers without guiding the student
- Use jargon without explaining
- Skip steps in explanations
- Assume prior knowledge the student doesn't have
- Be condescending or impatient
- Provide information beyond the current topic unless asked

Always:
- Be encouraging and positive
- Respect the student's learning pace
- Ask "Do you understand?" or similar checks
- Relate to things the student knows
- Show worked examples when helpful
- Acknowledge confusion as normal and part of learning
"""

    SUBJECT_PROMPTS = {
        SubjectSpecialization.MATHEMATICS: """
Additional instructions for mathematics:
- Build intuition before formality
- Use visual examples (number lines, graphs, shapes)
- Show common mistakes and how to avoid them
- Explain why mathematical procedures work
- Connect abstract symbols to concrete meaning
""",
        SubjectSpecialization.PHYSICS: """
Additional instructions for physics:
- Connect to observable phenomena
- Develop conceptual understanding first
- Then introduce mathematical models
- Always include units
- Address common misconceptions explicitly
""",
        SubjectSpecialization.COMPUTER_SCIENCE: """
Additional instructions for computer science:
- Emphasize computational thinking
- Build from concepts to code
- Show execution traces for complex code
- Discuss design and tradeoffs
- Encourage hands-on problem solving
"""
    }

    LEVEL_ADAPTATIONS = {
        1: "Very beginner: Use simple words, concrete examples, step-by-step. Celebrate small wins.",
        2: "Beginning: Use accessible language, some technical terms. Explain technical terms.",
        3: "Intermediate: Use standard terminology. Expect moderate complexity. Balance explanation and independence.",
        4: "Advanced: Use technical language. Assume good background knowledge. Discuss nuances.",
        5: "Expert: Assume expert knowledge. Discuss cutting-edge or advanced concepts. Challenge assumptions."
    }

    LEARNING_STYLE_PROMPTS = {
        "visual": "Include visual descriptions and encourage drawing. Mention diagrams, charts, and spatial relationships.",
        "auditory": "Encourage explanation aloud. Use dialogue and questioning. Discuss concepts.",
        "kinesthetic": "Encourage hands-on practice. Use 'try this' and problem-solving. Guide through doing.",
        "reading_writing": "Provide text-based explanations. Encourage note-taking. Define terms clearly."
    }

    @classmethod
    def build_system_prompt(
        cls,
        subject: SubjectSpecialization,
        student_level: int,
        learning_style: str,
        context_filters: ContextFilters,
        learner_profile: LearnerProfile,
        rag_context: List[RetrievedChunk]
    ) -> str:
        """
        Build complete system prompt from components.

        Structure:
        BASE_PROMPT
        + SUBJECT_SPECIFIC
        + LEVEL_ADAPTATION
        + LEARNING_STYLE
        + KNOWLEDGE_STATE
        + CONTEXT_CONSTRAINTS
        + RAG_CONTEXT_SUMMARY
        """

        prompt_parts = [
            cls.BASE_TUTOR_PROMPT,
            cls.SUBJECT_PROMPTS.get(subject, ""),
            f"\n\nSTUDENT LEVEL: {cls.LEVEL_ADAPTATIONS[student_level]}",
            f"\n\nLEARNING STYLE: {cls.LEARNING_STYLE_PROMPTS.get(learning_style, '')}",
        ]

        # Add knowledge state
        prompt_parts.append(f"""
STUDENT'S CURRENT STATE:
- Topic mastery: {learner_profile.mastery * 100:.0f}%
- Recent misconceptions: {', '.join(learner_profile.known_misconceptions) or 'None identified yet'}
- Confidence level: {learner_profile.confidence_score}/10
- Recent mistakes: {learner_profile.recent_errors_summary or 'None yet'}
""")

        # Add context constraints
        if context_filters.topic:
            prompt_parts.append(f"\nCURRENT TOPIC: {context_filters.topic}")
        if context_filters.excluded_topics:
            prompt_parts.append(f"\nAVOID MENTIONING: {', '.join(context_filters.excluded_topics)}")
        if context_filters.required_concepts:
            prompt_parts.append(f"\nREINFORCE THESE CONCEPTS: {', '.join(context_filters.required_concepts)}")

        # Add RAG context summary
        if rag_context:
            sources = ", ".join([f'"{chunk.source}"' for chunk in rag_context[:3]])
            prompt_parts.append(f"""

KNOWLEDGE BASE CONTEXT:
You have access to the following course materials:
{sources}

Use this context to provide accurate, course-aligned explanations.
If the student's question isn't covered in these materials, acknowledge that limitation.
""")

        return "\n".join(prompt_parts)
```

### Prompt Templates by Response Type

```python
class ResponsePrompts(Enum):
    """Predefined prompt templates for common response types."""

    EXPLANATION = """
Student question: {question}

Provide a clear, step-by-step explanation that:
1. Starts with an analogy or familiar concept
2. Builds to the specific concept
3. Includes a worked example
4. Ends by asking the student if they understand

Adjust complexity to level {level}/5.
Use {learning_style} learning style.
"""

    SOCRATIC_QUESTION = """
The student is trying to understand: {concept}
Their current understanding: {current_understanding}

Generate a Socratic question that:
1. Doesn't directly answer their question
2. Guides them toward the answer
3. Builds on what they already know
4. Addresses the gap between current and target understanding

The question should be: {question_type} (open-ended / yes-no / multiple choice)
"""

    MISCONCEPTION_CORRECTION = """
The student believes: {misconception}
The correct understanding: {correct_concept}

Generate a response that:
1. Validates their current thinking ("I see why you might think that...")
2. Introduces a counterexample or clarifying case
3. Explains why the misconception is common
4. Guides them to the correct understanding
5. Leaves them with a clear, memorable correction

Tone: Supportive, not condescending. Level: {level}/5
"""

    WORKED_EXAMPLE = """
Problem: {problem}
Solution steps: {solution_steps}

Create a worked example explanation that:
1. Shows each step clearly
2. Explains the "why" of each step
3. Highlights common mistakes at each stage
4. Connects to the underlying concepts
5. Checks understanding at the end

Level: {level}/5
Include {num_worked_examples} examples of increasing difficulty.
"""
```

---

## AI Audit Logging

### Comprehensive Interaction Logging

All AI tutor interactions are logged for quality assurance, analytics, and continuous improvement.

```python
class TutorInteractionLog(BaseModel):
    """Complete record of a tutor interaction."""

    interaction_id: str                    # UUID
    timestamp: datetime
    user_id: str
    session_id: str
    course_id: str
    topic: Optional[str]

    # Input
    student_query: str
    student_query_embedding: List[float]  # For clustering similar questions

    # Processing
    provider_selected: str                 # "ollama" or "gemini"
    provider_latency_ms: float
    rag_chunks_retrieved: int
    rag_top_relevance: float               # Highest relevance score from RAG

    # Output
    ai_response: str
    response_length_tokens: int
    response_generation_time_ms: float

    # Quality Metrics
    confidence_score: float                # 0-1 (AI's confidence in response)
    hallucination_detected: bool           # Post-hoc check
    sources_cited: List[str]               # Which RAG sources were used

    # Student Feedback
    student_satisfaction: Optional[float]  # 1-5 rating
    helpful_response: Optional[bool]       # Thumbs up/down

    # Profile Updates
    learner_mastery_delta: float          # Change in mastery score
    new_misconceptions: List[str]
    behavioral_signals: Dict               # Engagement, confidence, etc.

class AuditLogger:
    """Logs all interactions for analytics and quality assurance."""

    async def log_interaction(
        self,
        interaction: TutorInteractionLog
    ) -> None:
        """
        Log a tutor interaction to multiple backends:
        1. PostgreSQL (primary storage for analysis)
        2. TimescaleDB (time-series analysis)
        3. Elasticsearch (full-text search of interactions)
        4. S3 (long-term cold storage)
        """

        # Primary: PostgreSQL
        await self.db.tutor_interactions.insert(interaction.dict())

        # Time-series: TimescaleDB for temporal analysis
        await self.timescaledb.insert_metric(
            metric_name="tutor_interaction",
            timestamp=interaction.timestamp,
            tags={
                "user_id": interaction.user_id,
                "course_id": interaction.course_id,
                "topic": interaction.topic,
                "provider": interaction.provider_selected
            },
            fields={
                "response_latency_ms": interaction.provider_latency_ms,
                "response_length": interaction.response_length_tokens,
                "confidence": interaction.confidence_score,
                "student_satisfaction": interaction.student_satisfaction
            }
        )

        # Search: Elasticsearch
        await self.elasticsearch.index(
            index="tutor_interactions",
            id=interaction.interaction_id,
            document={
                "timestamp": interaction.timestamp,
                "user_id": interaction.user_id,
                "query": interaction.student_query,
                "response": interaction.ai_response,
                "topic": interaction.topic,
                "satisfaction": interaction.student_satisfaction
            }
        )

    async def retrieve_interaction_history(
        self,
        user_id: str,
        course_id: Optional[str] = None,
        topic: Optional[str] = None,
        date_range: Optional[Tuple[datetime, datetime]] = None,
        limit: int = 100
    ) -> List[TutorInteractionLog]:
        """Retrieve logged interactions for analysis."""

        query = {"user_id": user_id}
        if course_id:
            query["course_id"] = course_id
        if topic:
            query["topic"] = topic
        if date_range:
            query["timestamp"] = {
                "$gte": date_range[0],
                "$lte": date_range[1]
            }

        return await self.db.tutor_interactions.find(query).limit(limit).to_list()

class QualityAssurance:
    """Automated quality checks on AI responses."""

    async def check_response_quality(
        self,
        interaction: TutorInteractionLog
    ) -> QualityAssessment:
        """
        Perform post-generation quality checks.

        Checks:
        1. Factual accuracy (using RAG sources)
        2. Alignment with student level
        3. Pedagogical soundness
        4. Grammar and clarity
        5. Appropriate length
        6. Tone (encouraging, not condescending)
        """

        assessment = QualityAssessment()

        # Check 1: Factual accuracy
        if interaction.hallucination_detected:
            assessment.factual_accuracy = 0.3
            assessment.issues.append(
                "Response may contain hallucinated information not in course materials"
            )
        elif len(interaction.sources_cited) > 0:
            assessment.factual_accuracy = 0.95
        else:
            assessment.factual_accuracy = 0.7  # Lower confidence without sources

        # Check 2: Level alignment
        expected_length_range = {
            1: (100, 300),      # Very beginner: short and simple
            2: (200, 500),      # Beginner: moderate
            3: (400, 800),      # Intermediate: detailed
            4: (600, 1200),     # Advanced: comprehensive
            5: (800, 1500)      # Expert: thorough
        }

        student_level = interaction.learner_profile.difficulty_level
        min_len, max_len = expected_length_range[student_level]

        if not (min_len <= interaction.response_length_tokens <= max_len):
            assessment.issues.append(
                f"Response length ({interaction.response_length_tokens}) outside expected range ({min_len}-{max_len}) for level {student_level}"
            )
        else:
            assessment.level_alignment = 0.9

        # Check 3: Pedagogical soundness
        pedagogical_score = await self._assess_pedagogy(
            response=interaction.ai_response,
            topic=interaction.topic,
            student_level=student_level
        )
        assessment.pedagogical_soundness = pedagogical_score

        # Check 4: Grammar and clarity
        clarity_score = await self._assess_clarity(interaction.ai_response)
        assessment.clarity = clarity_score

        # Check 5: Tone
        tone_assessment = await self._assess_tone(interaction.ai_response)
        assessment.tone_appropriate = tone_assessment.is_encouraging

        return assessment

@router.post("/api/admin/audit/interactions")
async def get_audit_logs(
    filters: AuditFilterRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve audit logs for quality assurance.

    Filters:
    - user_id: Filter by student
    - course_id: Filter by course
    - date_range: Time period
    - confidence_below: Find low-confidence responses
    - satisfaction_below: Find dissatisfied students
    - hallucination: Only responses with suspected hallucinations
    """

    audit_logger = AuditLogger(db)
    interactions = await audit_logger.retrieve_interaction_history(
        **filters.dict(exclude_none=True)
    )

    # Perform QA on each
    qa = QualityAssurance()
    assessments = []
    for interaction in interactions:
        assessment = await qa.check_response_quality(interaction)
        assessments.append({
            "interaction": interaction,
            "quality_assessment": assessment
        })

    return AuditLogResponse(
        total_interactions=len(interactions),
        quality_assessments=assessments,
        avg_confidence=np.mean([i.confidence_score for i in interactions]),
        avg_satisfaction=np.mean([i.student_satisfaction for i in interactions if i.student_satisfaction]),
        hallucination_rate=sum([1 for i in interactions if i.hallucination_detected]) / len(interactions)
    )
```

---

## Performance Metrics

### Prometheus Metrics

The AI Tutor System exports detailed performance metrics:

```python
from prometheus_client import Counter, Histogram, Gauge

# Request counters
ai_requests = Counter(
    'ai_tutor_requests_total',
    'Total AI tutor requests',
    ['course_id', 'provider', 'response_type']
)

# Response latency (ms)
ai_latency = Histogram(
    'ai_tutor_response_latency_ms',
    'AI response generation latency',
    ['provider', 'student_level'],
    buckets=(100, 500, 1000, 2000, 5000)
)

# Provider usage
provider_usage = Counter(
    'ai_provider_usage',
    'Provider selection frequency',
    ['provider', 'reason']  # reason: cost, latency, capability, fallback
)

# RAG performance
rag_retrieval_latency = Histogram(
    'rag_retrieval_latency_ms',
    'Time to retrieve RAG context',
    buckets=(5, 20, 50, 100)
)

rag_relevance = Histogram(
    'rag_top_relevance_score',
    'Relevance of top RAG result',
    buckets=(0.5, 0.6, 0.7, 0.8, 0.9)
)

# Quality metrics
hallucination_rate = Gauge(
    'ai_hallucination_rate',
    'Percentage of responses with hallucinations'
)

student_satisfaction = Histogram(
    'student_satisfaction_rating',
    'Student satisfaction with AI response',
    buckets=(1, 2, 3, 4, 5)
)

# Cache efficiency
cache_hit_rate = Gauge(
    'tutor_cache_hit_rate',
    'Percentage of responses served from cache'
)

# Monitoring
class PerformanceMonitor:
    """Tracks and reports system performance."""

    async def record_request(self, interaction: TutorInteractionLog):
        """Record metrics for a request."""

        ai_requests.labels(
            course_id=interaction.course_id,
            provider=interaction.provider_selected,
            response_type="explanation"  # or question, worked_example, etc.
        ).inc()

        ai_latency.labels(
            provider=interaction.provider_selected,
            student_level=interaction.learner_profile.difficulty_level
        ).observe(interaction.provider_latency_ms)

        rag_retrieval_latency.observe(interaction.rag_retrieval_time_ms)
        rag_relevance.observe(interaction.rag_top_relevance)

        if interaction.student_satisfaction:
            student_satisfaction.observe(interaction.student_satisfaction)

    async def update_quality_metrics(self):
        """Update quality metrics (run periodically)."""

        # Calculate hallucination rate from last 1000 interactions
        interactions = await self.db.tutor_interactions.find(
            {"timestamp": {"$gte": datetime.now() - timedelta(hours=24)}}
        ).limit(1000).to_list()

        hallucination_count = sum(
            [1 for i in interactions if i.hallucination_detected]
        )
        hallucination_rate.set(hallucination_count / len(interactions))

        # Calculate cache hit rate
        cache_hits = sum([1 for i in interactions if i.served_from_cache])
        cache_hit_rate.set(cache_hits / len(interactions))
```

---

## Configuration

### Environment Configuration

```yaml
# config/tutor.yaml

ai_tutor:
  # LLM Providers
  providers:
    ollama:
      enabled: true
      host: "localhost"
      port: 11434
      models:
        default: "mistral"
        mathematics: "mistral"  # Optimized for logical reasoning
        creative: "neural-chat"
      temperature: 0.7
      max_tokens: 1024
      timeout_seconds: 30

    gemini:
      enabled: true
      api_key: "${GEMINI_API_KEY}"
      model: "gemini-pro"
      temperature: 0.7
      cost_per_1k_tokens: 0.005
      monthly_budget: 500  # USD

  # RAG Configuration
  rag:
    embedding_model: "sentence-transformers/all-MiniLM-L6-v2"
    vector_store: "chroma"
    chroma_host: "localhost"
    chroma_port: 8000
    similarity_threshold: 0.65
    max_results: 5
    chunk_size: 512
    chunk_overlap: 50

  # Session Management
  sessions:
    ttl_seconds: 604800  # 7 days
    max_history_items: 100
    redis_host: "localhost"
    redis_port: 6379
    redis_db: 0

  # Caching
  cache:
    enabled: true
    ttl_seconds: 86400  # 24 hours
    max_size: "1GB"
    eviction_policy: "lru"

  # Prompt Engineering
  prompts:
    system_prompt_version: "v2"
    include_learner_context: true
    include_topic_context: true
    include_rag_context: true

  # Logging and Monitoring
  logging:
    level: "INFO"
    audit_all_interactions: true
    log_responses_to_elasticsearch: true
    hallucination_detection_enabled: true

  metrics:
    prometheus_enabled: true
    prometheus_port: 9090
    report_interval_seconds: 60

  # Rate Limiting
  rate_limiting:
    requests_per_minute: 60
    requests_per_hour: 1000
    burst_size: 10
```

---

## Future Enhancements

### Planned Features

| Feature | Timeline | Description |
|---------|----------|-------------|
| **Voice Tutoring** | Q2 2024 | Speech-to-text input, text-to-speech responses |
| **Video Explanations** | Q2 2024 | AI generates instructional videos |
| **AR/VR Integration** | Q3 2024 | Immersive learning environments |
| **Multimodal Input** | Q2 2024 | Accept sketches, diagrams, handwriting |
| **Collaborative Sessions** | Q3 2024 | Multiple students with shared tutor |
| **Teacher Integration** | Q1 2024 | Teachers view student-AI conversations |
| **Automated Curriculum** | Q4 2024 | AI designs personalized learning paths |
| **Peer Learning** | Q4 2024 | Students learn from each other's questions |

### Voice Tutoring Implementation

```python
class VoiceTutorAgent(TutorAgent):
    """Extends TutorAgent for voice-based interaction."""

    async def process_voice_input(
        self,
        audio_bytes: bytes,
        language: str = "en"
    ) -> VoiceResponse:
        """
        Process spoken student question.

        Pipeline:
        1. Speech-to-text (Whisper)
        2. Process as normal text tutor
        3. Generate response
        4. Text-to-speech with appropriate tone/pacing
        """

        # Step 1: Speech recognition
        transcript = await self.speech_to_text_service.transcribe(
            audio_bytes,
            language=language
        )

        # Step 2: Normal processing
        text_response = await self.generate_response(
            topic=self.current_topic,
            user_query=transcript,
            # ... other args
        )

        # Step 3: Text-to-speech
        audio_response = await self.text_to_speech_service.synthesize(
            text=text_response.text,
            voice="en-US-Neural2-C",  # Professional, warm tone
            speaking_rate=0.95,        # Slightly slower for clarity
            pitch_hz=0.0               # Natural pitch
        )

        return VoiceResponse(
            audio=audio_response,
            transcript=transcript,
            text_response=text_response
        )
```

---

## Troubleshooting

### Common Issues and Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| **High Response Latency** | LLM provider slow | Switch to ollama or lower max_tokens |
| **Hallucinated Information** | LLM generating false facts | Increase RAG relevance threshold, enable fact-checking |
| **Student Confused by Response** | Complexity mismatch | Reduce difficulty level in context_filters |
| **RAG Returns No Results** | Content not ingested | Ingest course material via POST /api/tutor/ingest |
| **Cache Not Hit** | Redis unavailable | Check Redis connectivity, enable fallback |
| **Session Lost** | TTL expired | Increase SESSION_TTL, save to persistent storage |
| **API Cost High** | Using Gemini excessively | Switch default provider to ollama, set monthly budget |

### Debug Endpoints

```python
@router.get("/api/debug/tutor-performance")
async def get_tutor_performance():
    """Get real-time tutor system performance."""

    return {
        "providers": {
            "ollama": {
                "available": await ollama.is_available(),
                "avg_latency_ms": await ollama.get_avg_latency(),
                "requests_today": await ollama.get_request_count()
            },
            "gemini": {
                "available": await gemini.is_available(),
                "monthly_spend": await gemini.get_monthly_spend(),
                "budget_remaining": 500 - await gemini.get_monthly_spend()
            }
        },
        "cache": {
            "hit_rate": await cache.get_hit_rate(),
            "size_mb": await cache.get_size_mb(),
            "entries": await cache.get_entry_count()
        },
        "rag": {
            "collections": await chroma.list_collections(),
            "avg_retrieval_latency_ms": await chroma.get_avg_latency(),
            "total_chunks": await chroma.get_chunk_count()
        },
        "sessions": {
            "active_sessions": await session_manager.get_active_count(),
            "avg_session_duration_minutes": await session_manager.get_avg_duration()
        }
    }

@router.get("/api/debug/interaction/{interaction_id}")
async def debug_interaction(interaction_id: str):
    """Deep dive into a specific interaction."""

    interaction = await audit_logger.get_interaction(interaction_id)

    return {
        "interaction": interaction,
        "quality_assessment": await QualityAssurance().check_response_quality(interaction),
        "rag_context": interaction.sources_cited,
        "system_prompt_used": await get_system_prompt_for_interaction(interaction),
        "alternative_providers_performance": {
            "ollama": {
                "estimated_latency_ms": interaction.provider_latency_ms * 1.1,
                "would_fit_budget": True
            },
            "gemini": {
                "estimated_latency_ms": interaction.provider_latency_ms * 0.8,
                "would_fit_budget": interaction.response_length_tokens * 0.000005 < 0.01
            }
        }
    }
```

---

## Conclusion

The Lumina AI Tutor System represents a sophisticated approach to personalized education at scale. By combining retrieval-augmented generation, pedagogically-sound prompting, comprehensive behavior tracking, and continuous monitoring, it enables every student to receive individualized tutoring support.

**Key Achievements:**
- 24/7 availability without teacher fatigue
- Adaptive complexity matching student level
- Evidence-based teaching strategies
- Scalable to 100+ concurrent students
- Integrated with existing LMS
- Continuously improving through audit logging

**The Core Value Proposition:**
Where a teacher cannot teach 100 students individually, Lumina's AI fills the gap with a personal tutor for each student who understands their learning style, tracks their progress, and adapts in real-time.
