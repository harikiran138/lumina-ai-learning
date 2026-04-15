# Prompts Index

> **File:** `05-prompts/00-prompts-index.md`
> **Related:** [[03-agents/00-agents-index]], [[05-prompts/06-prompt-design-rules]]
> **Last Updated:** 2026-04-15

All system prompts used by Lumina's AI agents. Every prompt is production-ready — not a description, but the actual text passed to the model.

---

## Prompts List

| File | Agent | Model | Primary behaviour |
|---|---|---|---|
| [[05-prompts/01-course-generation-prompt]] | Assessment Agent | Gemini 1.5 Flash | Generate quiz questions and rubrics |
| [[05-prompts/02-tutor-prompt]] | Tutor Agent | Claude Sonnet 4.6 | Socratic tutoring with RAG context |
| [[05-prompts/03-grading-prompt]] | Assessment Agent (grading) | Gemini 1.5 Flash | Rubric-based grading of transcribed answers |
| [[05-prompts/04-curriculum-prompt]] | Pathway Agent | PPO (no prompt) | Reinforcement learning — no system prompt |
| [[05-prompts/05-reporting-prompt]] | Guardian Agent | Claude Haiku 4.5 | Safety filtering of all agent outputs |
| [[05-prompts/06-prompt-design-rules]] | — | — | Rules for modifying any prompt |

## Update Policy

All prompt changes require:
1. Testing with at least 10 representative input examples
2. Guardian output must remain PASS rate ≥ 95% on test set
3. Version bump in `prompt_versions` table
4. Rollback plan (previous prompt version stored in database)

See [[05-prompts/06-prompt-design-rules]] for full rules.
