# Glossary

> **File:** `00-overview/02-glossary.md`
> **Related:** [[00-overview/01-project-overview]], [[01-architecture/01-system-architecture]]
> **Last Updated:** 2026-04-15

Every key term used across the vault, defined precisely and unambiguously.

---

## Core Concepts

**TILA Pattern** — Teacher-Initiated LLM Approval. The governing architectural constraint of Lumina. When a student asks a question, the Tutor agent generates an answer, the Guardian agent filters it, and the result sits in a queue. A Teacher must explicitly APPROVE the answer before it is delivered to the student and indexed into the RAG pipeline. No exceptions. The acronym stands for Teacher-Initiated LLM Approval.

**AI Answer Queue** — The database table and UI component that implements the TILA pattern. Each row has a `status` of `PENDING`, `APPROVED`, `REJECTED`, or `ESCALATED`. Only `APPROVED` rows are released to the student. See [[04-data-flow/04-ai-agent-job-flow]].

**institution_id** — The UUID primary key of an Institution row. Every table in the 52-table schema that contains user or course data carries an `institution_id` foreign key. Every FastAPI route that queries these tables must include `WHERE institution_id = :institution_id` in the SQL. Enforced at the SQL layer, not the frontend.

**BKT** — Bayesian Knowledge Tracing. A probabilistic model with four parameters (p_init, p_learn, p_slip, p_guess) that estimates the probability that a student has mastered a knowledge component based on their response history. Lumina uses BKT at the knowledge-component level, not the lesson level.

**DKT** — Deep Knowledge Tracing. An LSTM-based neural network that reads a sequence of (knowledge_component, correct/incorrect) pairs and outputs a mastery probability for every knowledge component in the curriculum. Lumina runs BKT and DKT in parallel and takes a weighted average as the final mastery estimate.

**PPO** — Proximal Policy Optimization. The reinforcement learning algorithm used by Lumina's Pathway Agent to decide which knowledge component to present next to each student. The policy is trained on historical (student_state, action, reward) tuples where reward correlates with subsequent quiz performance.

**FSRS v5** — Free Spaced Repetition Scheduler version 5. An open-source spaced repetition algorithm that computes an optimal review interval for each flashcard based on retrievability `R(t) = e^(ln(0.9) × t / S)` where `S` is stability and `t` is elapsed days. Lumina uses FSRS v5 to schedule the flashcard review queue for each student.

**Hybrid RAG** — Retrieval-Augmented Generation using three retrieval strategies combined: (1) FAISS for dense vector similarity search, (2) BM25 for sparse lexical retrieval, and (3) Neo4j for graph-traversal over the course knowledge graph. Results from all three are fused and re-ranked before being passed to the Tutor agent as context.

**TrOCR** — A pure transformer model (BEiT encoder + RoBERTa decoder) for handwritten text recognition. Lumina uses `TrOCR-large-handwritten` (558M parameters, CER 2.89% on IAM dataset) as Stage 2 of the six-stage handwritten assignment grading pipeline.

**XGBoost+SHAP** — The dropout prediction system. XGBoost is an ensemble gradient boosting classifier trained on student behavioral features (attendance rate, submission frequency, login frequency, quiz score trend, forum activity). SHAP (SHapley Additive exPlanations) produces per-student, per-feature contribution scores that explain why a student is flagged as at-risk.

**LangGraph** — A stateful graph execution framework for orchestrating multiple LLM agents with shared state and conditional routing. Lumina's four agents (Tutor, Pathway, Assessment, Guardian) are nodes in a LangGraph graph.

**Guardian** — The safety and filtering agent (Claude Haiku 4.5) that runs on ALL outputs from every other agent. Checks for hallucination, PII leakage, age-inappropriate content, off-topic responses, prompt injection attempts, and formula errors. No agent output bypasses Guardian.

**MinIO** — A self-hosted, S3-compatible object store. Lumina uses MinIO for all file storage (lecture PDFs, assignment uploads, handwritten scans) to avoid sending institutional data to AWS S3.

**MLFD** — Multi-Level Feature Detection. The video analysis pipeline that processes lecture recordings to detect: facial engagement (via frame sampling), content density, pacing, and slide transitions. Used to generate teacher engagement reports.

**Knowledge Component (KC)** — The atomic unit of learning in Lumina's adaptive engine. Each lesson maps to one or more KCs. BKT and DKT track mastery at the KC level. The Pathway Agent selects the next KC, not the next lesson.

**FAISS** — Facebook AI Similarity Search. A library for efficient dense vector similarity search. Lumina uses FAISS to index course content embeddings and retrieve semantically relevant chunks as RAG context.

**Neo4j** — A graph database. Lumina uses Neo4j to store the course knowledge graph: nodes are knowledge components, edges are prerequisite relationships. The RAG pipeline traverses this graph to find conceptually adjacent content.

**Spaced Repetition** — A learning technique where material is reviewed at increasing intervals determined by recall performance. Implemented in Lumina via FSRS v5 as the flashcard system.

**Dropout Prediction** — The XGBoost classifier that produces a risk score (0.0–1.0) for each student per course per week. A score above 0.7 triggers an automatic alert to the Teacher and Faculty roles.

**AES-256-GCM** — The encryption algorithm used for counselling notes. Encryption happens on the client; the server stores only ciphertext. The server never holds the decryption key.

**k-Anonymisation** — Privacy technique applied to Researcher data exports. Any cohort smaller than k=5 students is suppressed entirely to prevent re-identification.

**Retrievability** — The FSRS v5 formula: `R(t) = e^(ln(0.9) × t / S)`. The probability that a student can recall a flashcard after `t` days, given stability `S`. A new card starts at a default stability value.

**busy-bardeen** — The name of the project's Git repository.

**NSRIT** — Nadimpalli Satyanarayana Raju Institute of Technology, Visakhapatnam, Andhra Pradesh, India.

## Role Abbreviations

| Abbreviation | Full Role Name |
|---|---|
| SA | Super Admin |
| IA | Institution Admin (College Admin) |
| HOD | Head of Department |
| FAC | Faculty |
| TCH | Teacher |
| STU | Student / Learner |
| MNT | Mentor |
| PT | Peer Tutor |
| CNS | Counselor |
| PAR | Parent / Guardian |
| RES | Researcher |
