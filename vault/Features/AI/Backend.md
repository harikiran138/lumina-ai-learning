# AI Engine: Backend Architecture

The Lumina AI Engine is a multi-layered orchestration layer that balances responsiveness, academic integrity, and cost-efficiency through a 3-tier routing strategy and asynchronous processing.

## 🛤 Code Traceability
- **Primary Orchestrator**: [ai_tutor.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/routers/ai_tutor.py)
- **Classifier Engine**: [classifier.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/ai_engine/classifier.py)
- **TILA Service (Runner)**: [ai_agent_runner.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/background/ai_agent_runner.py)
- **Key Functions**:
    - `classify()`: Semantic routing logic ([classifier.py:L45](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/ai_engine/classifier.py#L45)).
    - `build_tutor_response_payload()`: Main payload construction and tier assignment.
    - `_run_student_tutor_answer()`: Asynchronous task execution ([student.py:L127](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/routers/student.py#L127)).

## 🚦 3-Tier Routing Protocol (Verifiable Logic)
The system categorizes every incoming prompt using zero-shot semantic classification into one of three tiers:

| Tier | Logic Condition | Outcome | Implementation |
| :--- | :--- | :--- | :--- |
| **RESTRICTED** | `clf['tier'] == 'restricted'` | Instant redirect to off-topic message. | `classifier.py -> RoutingTier.RESTRICTED` |
| **SAFE_INSTANT** | `clf['tier'] == 'safe_instant'` | Direct LLM response (< 1.5s). | `ai_tutor.py -> build_tutor_response_payload` |
| **ACADEMIC_VERIFIED** | `clf['tier'] == 'academic_verified'` | Enqueued for human/high-trust review. | `student.py -> ask_tutor` |

## 🧠 TILA: Terminal Interface Learning Agent
TILA is the background runner that handles long-running AI tasks, including remediation generation and weekly learner insights.

### TILA Flow Position
1. **Trigger**: System identifies a learning gap or student inactivity.
2. **Queue**: Task added to `ai_answer_queue` table with status `PENDING`.
3. **Execution**: `ai_agent_runner.py` polls and processes tasks using `TILA_MASTER_POLICY`.
4. **Completion**: Updates status to `ready_for_review` or `delivered`.

## 📦 AI Interaction Storage
All AI interactions are logged in the `ai_answer_queue` table for retrospective governance:
- **student_id**: FK to users.
- **student_question**: Original raw prompt.
- **ai_generated_answer**: Serialized A2UI JSON.
- **status**: `INSTANT_VOICE`, `PENDING`, `REVIEWED`.

## 🔄 AI Generation Logic Flow
1. **Input**: Student message + course context + history.
2. **Analysis**: Logic call to `classify()` for tier and mode detection.
3. **Branching**:
    - If `mode == 'quiz'`, calls `AITutorStore.generate_quiz`.
    - If `mode == 'explain'`, calls `AITutorStore.generate_explanation`.
4. **Verification**: Pydantic validation of generated JSON before database persistence.

## ⚠️ Failure Points & Risk Analysis

### Failure Points
- **LLM Rate Limits**: External API (OpenAI/Anthropic) hitting rate limits causes `safe_instant` failures. 
- **Queue Stagnation**: If [ai_agent_runner.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/background/ai_agent_runner.py) dies, all `academic_verified` queries remain in `pending` state.
- **Context Window Overflow**: Extremely long chat histories can lead to truncated prompts and hallucinations.
- **A2UI Schema Drift**: Changes in the [A2UI Protocol](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/vault/Features/AI/Overview.md) without corresponding UI updates cause rendering crashes.

### Risk Level: HIGH
- **Reasoning**: The AI Engine is the primary differentiator of the platform. A failure here directly impacts the "Personalized Learning" value proposition and can lead to high token costs if loops occur in the classifier.

