# Pathway Agent (PPO Curriculum Sequencing)

> **File:** `03-agents/04-curriculum-agent.md`
> **Related:** [[03-agents/00-agents-index]], [[03-agents/06-agent-orchestration]], [[08-features/03-learner-dashboard]]
> **Last Updated:** 2026-04-15

The Pathway Agent uses Proximal Policy Optimization (PPO) reinforcement learning to decide which Knowledge Component to present to each student next, and in which explanation style.

---

## Purpose

Personalise the learning sequence for each student by selecting the next Knowledge Component based on their current mastery state, avoiding both under-challenge (content they already know) and over-challenge (content whose prerequisites they haven't mastered).

## Model

**PPO (Proximal Policy Optimization)** — PyTorch implementation trained on historical `(student_state, action, reward)` tuples from the Lumina database. This is not an LLM — it is a lightweight neural network policy (2 hidden layers, 128 units each) that runs inference in under 50ms.

## Trigger

The Pathway Agent is invoked after every quiz submission by a student. FastAPI dispatches it as a background task after the quiz grading pipeline completes.

## Input Schema

```json
{
  "student_id_hash": "string",
  "institution_id": "uuid",
  "course_id": "uuid",
  "current_mastery_vector": {
    "kc_id_1": "float (0.0–1.0)",
    "kc_id_2": "float (0.0–1.0)"
  },
  "recent_performance": {
    "kc_id": "uuid",
    "correct": "boolean",
    "response_time_seconds": "float",
    "attempts": "integer"
  },
  "available_kcs": [
    {
      "kc_id": "uuid",
      "prerequisites_met": "boolean",
      "difficulty": "float (0.0–1.0)"
    }
  ]
}
```

## Policy Network

The policy takes the flattened state vector (mastery scores for all KCs + recent performance features) and outputs a probability distribution over available actions (next KC choices). The action with the highest probability is selected.

**Reward function:**
- `+1.0` if student answers the next KC's quiz correctly on first attempt
- `+0.5` if correct on second attempt
- `0.0` if incorrect
- `-0.3` if student skips the recommended KC

The PPO policy is retrained nightly on the previous 30 days of interactions using the accumulated reward signal.

## Output Schema

```json
{
  "recommended_kc_id": "uuid",
  "explanation_style": "conceptual|worked_example|analogy|definition|visual",
  "rationale": "string (human-readable, shown to Teacher on analytics dashboard)",
  "estimated_mastery_after": "float (predicted mastery if student engages)",
  "alternative_kcs": [
    { "kc_id": "uuid", "probability": "float" }
  ]
}
```

## How Output Is Used

1. `recommended_kc_id` is written to `student_pathway_log` with the current timestamp
2. The student's dashboard "Next Lesson" widget updates to point to the recommended KC
3. The explanation style hint is passed to the Tutor Agent when the student next asks a question on this KC (so Tutor adapts how it explains)
4. Teachers see the pathway decisions in the per-student knowledge trace view

## Error Handling

| Error | Action |
|---|---|
| PPO model unavailable | Fall back to BKT-greedy: recommend KC with lowest mastery that has all prerequisites met |
| All KCs mastered (course complete) | Return `recommended_kc_id = null`; dashboard shows "Course Complete" |
| No prerequisites met for any KC | Return the root KC (lowest prerequisite depth in Neo4j graph) |

## Latency Profile

PPO inference is synchronous within the AI Engine (not an LLM call):
- Model load: one-time at server startup
- Inference per student: 20–50ms
- Total background task time: <100ms

## Training

The model is trained offline (nightly cron job on the AI Engine):
- Dataset: all quiz events from the past 30 days, per institution
- Training: PPO with Adam optimiser, lr=3e-4, 50 epochs, batch size 64
- Model checkpoint saved to MinIO after each training run
- Previous checkpoint is preserved for 7 days for rollback
