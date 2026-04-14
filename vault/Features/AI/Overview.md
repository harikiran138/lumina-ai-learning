# AI & Intelligence: Overview

The **AI & Intelligence** domain is the analytical backbone of Lumina. It moves beyond simple chatbots to a coordinated **Swarm Architecture** for tutoring, grading, and behavioral intervention.

## 🎯 Purpose
- **Contextual Tutoring**: Delivering subject-specific help using the student's personal learning history.
- **Automated Assessment**: Subjective grading of text and handwriting with high-precision rubrics.
- **Behavioral Intervention**: Detecting learning ruts or disengagement before they impact grades.
- **Academic Pathway Optimization**: Dynamically adjusting curriculum based on individual mastery data.

## 🧩 Core Components
- **Orchestrator**: `backend/app/services/ai_tutor_service.py`
- **Multi-Agent Swarm**: `ml/agents/swarm/` (Tutor, Guardian, Assessment Agents).
- **Computer Vision**: `backend/app/background/ocr_runner.py` (TrOCR integration).
- **Memory Store**: `backend/app/store/tutor_memory_store.py` (Zippy/Redis-backed RAG).

## 🚀 Key Technologies
1. **Model Layer**: Google Gemini 1.5 Pro & Flash (Primary), Local Llama 3 (Fallback).
2. **Framework**: LangChain/LangGraph for multi-turn agentic workflows.
3. **Vector DB**: Supabase Vector (pgvector) for lesson context RAG.
4. **OCR**: Microsoft TrOCR for handwritten digitization.

### 🔗 Related Paths
- [[Features/Student/Backend|Student Learning Gap Signal]]
- [[Features/Faculty/Flow|OCR & Grading Verification]]
- [[DECISION_FLOW|AI Intervention Logic]]

---
[[START_HERE]] | [[AI/API]] | [[AI/Backend]] | [[AI/Frontend]] | [[AI/Flow]]
