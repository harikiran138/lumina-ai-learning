# Lumina LMS — Project Vault

> **File:** `README.md`
> **Last Updated:** 2026-04-15

This is the single source of truth for the Lumina LMS project. Every architectural decision, role definition, agent specification, data flow, API contract, and prompt lives here.

---

## Quick Navigation

| Folder | What you'll find |
|---|---|
| [[00-overview/01-project-overview]] | Vision, goals, constraints, team |
| [[00-overview/02-glossary]] | Every term defined precisely |
| [[00-overview/03-tech-stack]] | Full technology stack with rationale |
| [[01-architecture/01-system-architecture]] | System design, all components |
| [[01-architecture/02-component-map]] | Module map and connections |
| [[01-architecture/03-infrastructure]] | Hosting, storage, services |
| [[02-roles/00-roles-index]] | All 11 roles compared |
| [[03-agents/00-agents-index]] | All 4 AI agents compared |
| [[04-data-flow/00-data-flow-master]] | Master data flow overview |
| [[05-prompts/00-prompts-index]] | All agent prompts listed |
| [[06-auth/01-auth-overview]] | Auth system end-to-end |
| [[07-operations/01-deployment]] | Deploy, CI/CD, environments |
| [[08-features/00-features-index]] | All features with status |
| [[09-api/00-api-overview]] | API conventions and auth |
| [[10-diagrams/01-system-overview]] | Full system Mermaid diagram |

---

## The Three Rules That Override Everything

1. **TILA Pattern** — No AI-generated answer reaches a student without explicit Teacher APPROVE action. The queue is the system's defining constraint. See [[03-agents/06-agent-orchestration]] and [[04-data-flow/04-ai-agent-job-flow]].

2. **institution_id Scoping** — Every database query must filter by `institution_id` at the FastAPI SQL layer. Not the frontend. Not middleware. The SQL query itself. Cross-institution data leakage is a critical security failure.

3. **Non-blocking LLM Calls** — All calls to Claude or Gemini must be dispatched as FastAPI background tasks. No synchronous LLM API calls in request handlers, ever.

---

## Project Identity

| Field | Value |
|---|---|
| Project name | Lumina LMS |
| Repository | busy-bardeen |
| Institution | NSRIT — Nadimpalli Satyanarayana Raju Institute of Technology, Visakhapatnam |
| Developer 1 | Hari Kiran |
| Developer 2 | P. Laxmi Ram Charan (22NU1A0591) |
| Faculty Guide | Dr. Rayudu Srinivas, Professor and Head of CSE, NSRIT |
| Type | B.Tech CSE Capstone Project |
