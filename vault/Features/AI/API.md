# AI & Intelligence: API Reference

The AI API orchestrates communication between the student and the ensemble of LLM models, enforcing institutional safety and pedagogical rules.

## 🤖 Core Orchestration: `POST /api/student/tutor/ask`

This is the primary entry point for all student-tutor interactions. It implements a **High-Performance Background Task Pattern**.

### Request Payload
```json
{
  "prompt": "Explain the concept of neural networks",
  "context": {
    "topic": "Machine Learning",
    "subject": "AI Fundamentals"
  },
  "mode": "explain",
  "history": []
}
```

### Response Flow
The endpoint returns an **Instant Poll Token** while processing the heavy LLM logic in a background `asyncio.Task`.

```json
{
  "success": true,
  "id": "answer_uuid_123",
  "status": "pending",
  "message": "Teacher is reviewing your answer",
  "poll_url": "/api/student/tutor/answer/answer_uuid_123",
  "tier": "SAFE_INSTANT"
}
```

---

## 🚦 3-Tier Routing Protocol
Every incoming prompt is pre-classified by the `ai_engine.classifier.classify` service into one of three tiers:

| Tier | Logic | Response Mode |
| :--- | :--- | :--- |
| **`RESTRICTED`** | Off-topic or unsafe | **Instant Redirect**. No LLM invoked. Returns `RESTRICTED_REDIRECT`. |
| **`SAFE_INSTANT`** | Low-risk academic query | **Direct LLM**. Returns response < 1.5s via background job. |
| **`ACADEMIC_VERIFIED`** | High-stakes or complex | **Queued**. Response state set to "Teacher is reviewing" until teacher approval. |

---

## 🏗 Flow Protocol (A2UI Specification)
AI responses are not raw text. They follow a strict JSON structure called the **Flow Protocol** to drive rich UI components.

### Example Response
```json
{
  "meta": { "topic": "Photosynthesis", "mastery_gain": 2.5 },
  "flow": [
    { "type": "text", "content": "Photosynthesis is the process by which..." },
    { "type": "diagram", "content": "mermaid\ngraph LR\nSun-->Plant" },
    { "type": "quiz", "content": "What is the primary product?" }
  ]
}
```

## 📂 Key Dependencies
- [ai_tutor.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/routers/ai_tutor.py): Main router.
- [ai_tutor_store.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/store/ai_tutor_store.py): Direct LLM integration.
- `ai_engine/classifier.py`: Real-time tier resolution.
