# Pathway Agent — No System Prompt

> **File:** `05-prompts/04-curriculum-prompt.md`
> **Related:** [[03-agents/04-curriculum-agent]], [[05-prompts/00-prompts-index]]
> **Last Updated:** 2026-04-15

The Pathway Agent uses a PPO reinforcement learning model (PyTorch), not an LLM. There is no system prompt. This file documents the policy network input/output specification instead.

---

## Why No Prompt

The Pathway Agent is a trained neural network policy, not a language model. It takes a numerical state vector as input and outputs a probability distribution over available actions (next KC choices). Training, inference, and retraining are all handled in Python/PyTorch without any natural language prompting.

## Policy Input Specification

The state vector is a concatenation of:

| Feature group | Dimensions | Description |
|---|---|---|
| Mastery vector | N (one per KC in course) | BKT+DKT combined mastery per KC |
| Recent event features | 4 | (is_correct, response_time_norm, attempts_norm, kc_difficulty) for last quiz |
| Student history aggregates | 5 | 7-day avg score, 30-day avg score, login frequency, days since last login, streak |
| KC availability flags | N | 1 if prerequisites met, 0 if not |

Total state dimension: `2N + 9` where N = number of KCs in the course.

## Policy Output Specification

A probability vector of length N (one probability per KC). The highest-probability KC that has `prerequisites_met = 1` is selected as the recommendation.

## Training Configuration

```python
POLICY_CONFIG = {
    "hidden_sizes": [128, 128],
    "activation": "relu",
    "learning_rate": 3e-4,
    "gamma": 0.99,              # discount factor
    "clip_epsilon": 0.2,        # PPO clip ratio
    "epochs_per_update": 50,
    "batch_size": 64,
    "rollout_length": 2048,     # steps before policy update
}

REWARD_CONFIG = {
    "correct_first_attempt": 1.0,
    "correct_second_attempt": 0.5,
    "incorrect": 0.0,
    "skip_recommendation": -0.3,
    "course_completion_bonus": 5.0,
}
```
