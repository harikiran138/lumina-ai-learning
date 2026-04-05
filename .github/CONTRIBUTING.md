# Contributing to Lumina AI Learning Platform

Thank you for your interest in contributing to Lumina! This document outlines the process and guidelines for contributing to this privacy-first, multi-agent AI LMS.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Branching Strategy](#branching-strategy)
- [Coding Standards](#coding-standards)
- [Submitting Changes](#submitting-changes)
- [Issue Reporting](#issue-reporting)
- [Privacy & Security](#privacy--security)

---

## Getting Started

1. **Fork** the repository and clone your fork locally.
2. Read through this guide fully before making changes.
3. Check the [open issues](../../issues) to see if your idea or bug is already being tracked.
4. For large changes, open an issue first to discuss the approach before writing code.

---

## Development Setup

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20.x |
| Python | 3.11+ |
| Docker & Docker Compose | Latest |
| pnpm / npm | Latest |

### Frontend (Next.js 15)

```bash
cd frontend/web
npm install --legacy-peer-deps
npm run dev
# Runs on http://localhost:3000
```

### Backend (FastAPI)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 9000
# Runs on http://localhost:9000
```

### Full Stack (Docker)

```bash
docker-compose up --build
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in the required values. **Never commit real credentials or API keys.**

---

## Project Structure

```
lumina-ai-learning/
├── frontend/web/          # Next.js 15 App Router frontend
│   └── src/app/           # Portal pages: student/, teacher/, admin/, parent/, ...
├── backend/               # FastAPI ML service (port 9000)
│   ├── app/routers/       # API route handlers
│   ├── app/services/      # Business logic & AI engines
│   └── app/store/         # Data access layer
├── supabase/              # Supabase migrations & config
│   └── migrations/        # SQL migration files
├── .github/               # GitHub community health files & CI/CD
└── docs/                  # Additional documentation
```

**Portals:** student, teacher, admin, parent, mentor, peer-tutor, counselor, content-creator, researcher, alumni

---

## Branching Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code |
| `feature/<name>` | New features |
| `fix/<name>` | Bug fixes |
| `chore/<name>` | Dependency updates, tooling |
| `docs/<name>` | Documentation only |

Branch off `main` and open a PR back to `main`.

---

## Coding Standards

### Frontend (TypeScript / Next.js)

- **TypeScript** — strict mode, no `any` without justification
- **Design system** — use existing Tailwind tokens:
  - Dark theme: `bg-black`, `surface-950`, `surface-900`
  - Gold primary: `text-lumina-primary` (#FFD700), `bg-lumina-primary`
  - Utility classes: `glass-v2`, `gradient-text`, `shadow-gold-glow`
  - Fonts: `font-sans` (Inter, body), `font-display` (Outfit, headings)
- **Components** — prefer editing existing components over creating new ones
- **Sidebar pattern** — use the standard `w-20 → w-64` hover-expand pattern with icon tooltips
- Run `npm run lint` before committing

### Backend (Python / FastAPI)

- Follow **PEP 8** — use `black` for formatting
- Add type hints to all function signatures
- Use Pydantic models for request/response validation
- Never log or print PII or student data
- Run `pytest tests/` before committing

### Database (Supabase / PostgreSQL)

- All schema changes must go through a migration file in `supabase/migrations/`
- Never alter production schema directly — always use migrations
- Use Row-Level Security (RLS) policies for all user-facing tables
- Avoid storing sensitive data in plain text

### General

- Keep PRs small and focused — one feature or fix per PR
- Do not add unused dependencies
- Do not leave `console.log` or `print()` debug statements in committed code
- Write self-documenting code; add comments only where logic is non-obvious

---

## Submitting Changes

1. Ensure all tests pass:
   ```bash
   # Frontend
   cd frontend/web && npm test

   # Backend
   cd backend && python -m pytest tests/
   ```

2. Create a pull request using the PR template provided.

3. Fill out all sections of the PR template — incomplete PRs may be closed.

4. Ensure your branch is up to date with `main` before requesting review.

5. At least one maintainer approval is required before merging.

### Commit Message Format

Use conventional commits:

```
type(scope): short description

Types: feat, fix, docs, style, refactor, test, chore
Examples:
  feat(student): add portfolio page
  fix(auth): resolve parent verification token expiry
  chore(deps): update supabase-js to 2.99
```

---

## Issue Reporting

- Use the provided **Bug Report** or **Feature Request** issue templates.
- Search existing issues before opening a new one.
- Include as much detail as possible — steps to reproduce, expected vs actual behavior, screenshots.
- For security vulnerabilities, do **not** open a public issue — see [SECURITY.md](SECURITY.md).

---

## Privacy & Security

Lumina is a privacy-first platform handling student data and educational records. Contributors must:

- Never commit real student data, PII, or credentials
- Always use seeded/anonymized data for testing
- Follow FERPA/COPPA principles when designing features involving minors
- Report security vulnerabilities privately per [SECURITY.md](SECURITY.md)
- Obtain maintainer review before adding any third-party analytics, tracking, or data-sharing integrations

---

## Questions?

Open a [Discussion](../../discussions) or reach out via the issue tracker. We're happy to help!
