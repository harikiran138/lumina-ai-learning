# Debug Playbook: AI Intelligence

Use this guide to diagnose "stuck" queries, hallucination issues, and background worker failures.

## 🚨 Common Failure Scenarios

### 1. AI Answer Stuck in "Pending"
- **Symptoms**: User submits a question but never receives an answer.
- **Check**:
    - **Database**: Check table `ai_answer_queue` for items with `status = 'pending'`.
    - **Worker**: Verify if the [ai_agent_runner.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/background/ai_agent_runner.py) is running.
- **Resolution**: Restart the background runner service.
- **Logs**: `Starting AI Agent Background Worker loop`.

### 2. Broken A2UI Payloads
- **症状 (Symptoms)**: Frontend displays raw JSON or "Rendering Error" instead of interactive AI components.
- **Check**: The `ai_generated_answer` must adhere to the A2UI JSON standard.
- **Backend File**: [ai_tutor.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/routers/ai_tutor.py)

### 3. LLM Latency / Timeout
- **Symptoms**: Request times out before the answer is generated.
- **Check**: LLM Provider status (OpenAI/Anthropic). Check [classifier.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/ai_engine/classifier.py) for routing logic slowdown.
- **Metric**: Check Prometheus metrics for `ai_request_duration_seconds`.

## 🛠 Step-by-Step Debug Path
1. **Queue Check**: `SELECT status, error_log FROM ai_answer_queue ORDER BY created_at DESC LIMIT 5;`
2. **Worker Logs**: Inspect standard output for `Failed to process AI query`.
3. **Logic Flow**:
    - [ai_tutor.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/routers/ai_tutor.py) (Ingestion)
    - [classifier.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/ai_engine/classifier.py) (Routing)
    - [ai_agent_runner.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/background/ai_agent_runner.py) (Processing)

## 📊 Error Logs to Watch
- `langgraph_orchestration_failed`: Issues with the AI agent graph logic.
- `supabase_update_failed`: Worker cannot write answer back to DB.

---
[[DEPENDENCY_MAP]] | [[Features/AI/Backend]] | [[Features/AI/Flow]]
