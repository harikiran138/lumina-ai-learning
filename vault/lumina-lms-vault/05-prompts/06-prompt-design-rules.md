# Prompt Design Rules

> **File:** `05-prompts/06-prompt-design-rules.md`
> **Related:** [[05-prompts/00-prompts-index]]
> **Last Updated:** 2026-04-15

Rules for writing, testing, and updating any prompt in Lumina safely.

---

## Before Changing Any Prompt

1. **Read the current prompt in full.** Understand every rule before changing any part of it.
2. **Identify the failure mode you are fixing.** If you are not fixing a specific failure, do not change the prompt.
3. **Check Guardian pass rate.** Any prompt change that reduces Guardian pass rate below 95% on the test set must be reverted immediately.

## Rules for All Prompts

**Rule 1 — Never remove safety rules.** Any rule in a prompt that begins with "Never", "Do not", or "Always" may only be removed with Faculty Guide approval. These rules exist because specific failures occurred.

**Rule 2 — Version every change.** Before modifying a prompt, save the current version to `prompt_versions` table with a timestamp and a note describing why it is being changed. The previous version must be restorable in under 5 minutes.

**Rule 3 — Test with 10 representative inputs.** Run the new prompt against at least 10 representative question/input pairs before deploying. Record pass/fail for each.

**Rule 4 — Test Guardian compatibility.** After changing a Tutor or Assessment prompt, run the Guardian against 20 sample outputs from the new prompt. Guardian pass rate must be ≥ 95%.

**Rule 5 — No prompt injection openings.** Never add instructions like "If the user says X, do Y" where X could be forged by a student. Instructions should be unconditional or based on system-provided data (mastery score, chunk IDs), never on raw student input patterns.

**Rule 6 — Output format changes require code changes.** If you change the JSON output schema of any agent, the AI Engine code that parses that schema must be updated in the same commit. Mismatched schemas cause silent failures.

**Rule 7 — Document every template variable.** Every `{{variable}}` or `{variable}` in a prompt must be documented in the corresponding prompt file with: source, type, example value, and what happens if it is null or empty.

## Rollback Procedure

If a prompt causes production issues:
1. `GET /api/admin/prompt-versions/{agent_type}` — list versions
2. `POST /api/admin/prompts/{agent_type}/rollback { version_id }` — restore previous version
3. Monitor Guardian pass rate for 1 hour after rollback
4. File an incident report in `prompt_incident_log`
