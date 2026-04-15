# Guardian Agent

> **File:** `03-agents/guardian-agent-note.md`
> **Related:** [[03-agents/06-agent-orchestration]], [[05-prompts/05-reporting-prompt]]
> **Last Updated:** 2026-04-15

The Guardian Agent's full specification is split across two files:

- **Prompt (full system prompt text):** [[05-prompts/05-reporting-prompt]]
- **Orchestration (how Guardian fits in the LangGraph graph):** [[03-agents/06-agent-orchestration]]

The Guardian Agent runs **on every output from every other agent** before anything enters the database or queue. It uses **Claude Haiku 4.5** (`claude-haiku-4-5-20251001`). Its three decisions are PASS, FLAG, and BLOCK.

See those two files for complete detail.
