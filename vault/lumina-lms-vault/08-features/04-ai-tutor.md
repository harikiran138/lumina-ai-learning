# AI Tutor Feature

> **File:** `08-features/04-ai-tutor.md`
> **Related:** [[03-agents/02-tutor-agent]], [[04-data-flow/04-ai-agent-job-flow]], [[05-prompts/02-tutor-prompt]]
> **Last Updated:** 2026-04-15

The AI Tutor is Lumina's most distinctive student-facing feature. It is a Socratic, RAG-grounded tutor that operates entirely within the TILA pattern — all answers go through Teacher review.

---

## Student Experience

1. Student opens AI Tutor for a specific course
2. Types a question in natural language (e.g., "Why does voltage drop across a resistor?")
3. Sees immediately: "Your question has been sent to your teacher for review"
4. At some point (minutes to hours), the answer appears in the chat — marked with the Teacher's name as the reviewer

The student sees a continuous chat history: their questions, approved answers, and any rejection notices. The queue wait time is intentionally opaque to students — they don't see "pending" spinners, just a message that the teacher will respond.

## Teacher Experience

1. Teacher opens AI Queue dashboard
2. Sees a list of PENDING items sorted by priority score (high-mastery students with easy questions get lower priority; low-mastery students with foundational questions get higher priority)
3. Each item shows: student's question, AI-generated answer, confidence score, Guardian flag status, RAG chunks used
4. Teacher can: APPROVE, EDIT then APPROVE, REJECT (with reason), or ESCALATE

**What "EDIT then APPROVE" means:** Teacher can modify the AI's answer before it goes to the student. This is the mechanism that ensures teacher authority — the approved answer is always the teacher's version, not the raw AI output.

## RAG Pipeline Detail

Before calling Claude, the system retrieves context via three methods simultaneously:

```python
async def retrieve_rag_context(question: str, course_id: UUID, concept_id: UUID):
    # Dense retrieval
    query_embedding = embedder.encode(question)
    faiss_results = faiss_index.search(query_embedding, k=5)  # top 5 chunks
    
    # Sparse retrieval
    bm25_results = bm25_index.get_top_n(question.split(), corpus, n=5)
    
    # Graph retrieval
    neo4j_adjacent = neo4j.run("""
        MATCH (kc:KC {id: $concept_id})-[:PREREQUISITE_OF|RELATED_TO*1..2]-(adjacent:KC)
        RETURN adjacent.name, adjacent.id
    """, concept_id=str(concept_id))
    
    # Fusion and re-ranking (Reciprocal Rank Fusion)
    final_chunks = rrf_rerank(faiss_results, bm25_results, k=3)
    
    return {
        "faiss_chunks": [c.text for c in faiss_results[:3]],
        "bm25_chunks": [c for c in bm25_results[:3]],
        "neo4j_adjacent_kcs": [n["adjacent.name"] for n in neo4j_adjacent]
    }
```

## Degraded RAG Mode

If FAISS is unavailable: use BM25 + Neo4j only. `rag_mode = 'degraded'` is logged on the queue item so Teachers can apply extra scrutiny.

If all three are unavailable: the Tutor Agent call is still made, but with empty context. Claude will apply its pre-training knowledge only. Guardian will FLAG these items automatically due to lack of chunk grounding.

## Growing Knowledge Base

Every APPROVED answer is added back into the FAISS index:
- Q: student's question text
- A: teacher-approved answer text
- Combined embedding indexed as a new chunk with `chunk_type = 'approved_qa'`

Over a semester, this creates a verified, institution-specific knowledge base that progressively improves RAG retrieval quality for that course. Teachers who approve more queue items effectively train a better tutor for their students.

## What Cannot Be Asked

The Guardian blocks:
- Questions that appear to be asking the tutor to solve graded assessment problems
- Questions with prompt injection attempts ("Ignore previous instructions and...")
- Questions containing PII about other students or faculty
- Off-topic questions (personal advice, general internet questions)

Students who hit a block receive: "I can't help with that. If you have a course question, please rephrase it and try again."
