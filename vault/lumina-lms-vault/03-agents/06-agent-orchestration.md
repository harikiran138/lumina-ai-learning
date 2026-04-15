# Agent Orchestration

> **File:** `03-agents/06-agent-orchestration.md`
> **Related:** [[03-agents/00-agents-index]], [[04-data-flow/04-ai-agent-job-flow]]
> **Last Updated:** 2026-04-15

How LangGraph connects the four agents into a stateful directed graph, and how the graph is invoked from FastAPI.

---

## Graph Definition

```python
from langgraph.graph import StateGraph, END

class AgentState(TypedDict):
    task_type: str          # "tutor" | "assessment" | "pathway" | "grading"
    input_payload: dict
    tutor_output: dict | None
    assessment_output: dict | None
    pathway_output: dict | None
    guardian_result: dict   # always populated last
    final_output: dict | None

graph = StateGraph(AgentState)

graph.add_node("tutor", tutor_node)
graph.add_node("assessment", assessment_node)
graph.add_node("pathway", pathway_node)
graph.add_node("guardian", guardian_node)
graph.add_node("persist", persist_node)

# Routing from entry point based on task_type
graph.set_conditional_entry_point(
    route_by_task_type,
    {
        "tutor": "tutor",
        "assessment": "assessment",
        "pathway": "pathway",
    }
)

# All paths converge at Guardian
graph.add_edge("tutor", "guardian")
graph.add_edge("assessment", "guardian")
graph.add_edge("pathway", "guardian")

# Guardian routes to persist or END (on block)
graph.add_conditional_edges(
    "guardian",
    route_after_guardian,
    {
        "pass": "persist",
        "flag": "persist",    # persists with guardian_flagged=True
        "block": END,         # stops execution; logs block
    }
)

graph.add_edge("persist", END)
```

## Guardian Node Detail

Guardian (Claude Haiku 4.5) receives the output from whichever preceding agent ran, and checks for:

| Check | Description |
|---|---|
| Hallucination | Does the answer contradict the RAG source chunks? |
| PII leakage | Does the output contain names, emails, phone numbers, Aadhaar, PAN? |
| Age-appropriateness | Is the content appropriate for an 18–22 year old engineering student? |
| Off-topic | Is the response about the course subject? |
| Prompt injection | Did the student's question attempt to override the system prompt? |
| Formula errors | For STEM content, are equations balanced and dimensionally consistent? |
| Harmful content | Does the output contain anything that could cause harm? |

Guardian output schema:
```json
{
  "decision": "PASS|FLAG|BLOCK",
  "confidence": "float (0.0–1.0)",
  "trigger_type": "string|null (e.g. 'hallucination', 'pii', 'off_topic')",
  "details": "string|null"
}
```

## Invocation from FastAPI

All invocations use `BackgroundTasks.add_task()`:

```python
@router.post("/queue/submit")
async def submit_question(
    payload: StudentQuestionPayload,
    background_tasks: BackgroundTasks,
    institution_id: UUID = Depends(get_institution_id),
    db: AsyncSession = Depends(get_db)
):
    # Validate, build job record
    job_id = uuid4()
    await db.execute(
        insert(AgentJob).values(id=job_id, status="queued", ...)
    )
    await db.commit()

    # Dispatch — never await LLM calls in handler
    background_tasks.add_task(
        run_agent_graph,
        task_type="tutor",
        input_payload=build_tutor_payload(payload, institution_id),
        job_id=job_id
    )

    return {"job_id": job_id, "status": "queued"}
```

## State Persistence Between Agents

The `AgentState` dict is passed through each node by LangGraph's built-in state management. No external state store is needed for single-invocation flows. For long-running or multi-step flows (e.g., iterative course generation), state is checkpointed to Redis with a TTL of 1 hour.

## Error Recovery

If any agent node raises an unhandled exception:
1. LangGraph catches it and calls the `on_error` handler
2. The job status is updated to `'FAILED'` in the database
3. The error and stack trace are logged to `agent_error_log`
4. If the failed job was a Tutor invocation, the student's queue item is set to `status = 'FAILED'` and they receive a retry prompt
5. The system does not retry automatically — human review is required for repeated failures
