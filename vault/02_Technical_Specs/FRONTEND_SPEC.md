# Lumina Frontend

Next.js 15 application for the Lumina AI Learning Platform. Built with the App Router, React 19, TypeScript, and Tailwind CSS 4. Deploys to Vercel.

---

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | 18+ |
| npm | 9+ (bundled with Node.js 18) |

---

## Setup

```bash
# Navigate to the frontend directory
cd frontend/web

# Install dependencies
npm install

# Copy and configure environment variables
cp .env.local.example .env.local
# Edit .env.local — see Environment Variables section below

# Start the development server
npm run dev
```

The dev server starts at **http://localhost:3000** with Fast Refresh enabled.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production (outputs to `.next/`) |
| `npm run start` | Serve the production build locally |
| `npm run lint` | Run ESLint across the codebase |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API base URL (e.g., `http://localhost:8000` for local dev, `https://api.yourdomain.com` for production) |
| `NEXT_PUBLIC_TUTOR_PROVIDER` | No | LLM provider for the AI Tutor: `auto` \| `ollama` \| `gemini` \| `openrouter`. Default is `auto`, which selects the best available provider at runtime |

---

## API Proxy

All requests to `/api/*` are rewritten to `NEXT_PUBLIC_API_URL/*` via the Next.js rewrites configuration in `next.config.mjs`. This means frontend components can call `/api/courses` and Next.js transparently forwards the request to the FastAPI backend, including cookies, without CORS issues in development.

```js
// next.config.mjs (simplified)
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
    },
  ]
}
```

---

## Portals

Each portal is a self-contained section of the app with its own layout, pages, and components. All routes live under `src/app/`.

| Portal | Route | Description |
|---|---|---|
| Student | `/student` | AI Tutor, courses, assignments, assessments, flashcards, knowledge graph, gamification, notes, attendance, community |
| Faculty | `/faculty` | Teacher-Verified AI Queue (verification dashboard), course management, attendance, analytics, grading, AI assistant |
| Head of Department | `/hod` | Department analytics, faculty oversight, curriculum approval |
| Admin | `/admin` | Platform administration, user management, AI model hub, system health |
| Counselor | `/counselor` | At-risk student dashboard, intervention tracking, referral management |
| Parent | `/parent` | Child progress monitoring, attendance and grade visibility |
| Mentor | `/mentor` | Mentoring session scheduling and history |
| Peer Tutor | `/peer_tutor` | Tutoring request management and session delivery |
| Alumni | `/alumni` | Career resources, mentoring sign-up, institutional networking |
| Researcher | `/researcher` | Platform-wide analytics and data export |
| Content Creator | `/content_creator` | Course content authoring tools |
| Designer | `/designer` | Content design and media creation tools |

Additional top-level routes:
- `/login`, `/register` — Authentication pages
- `/onboarding` — Multi-step onboarding flow for new users
- `/dashboard` — Role-aware dashboard that redirects to the appropriate portal
- `/platform`, `/pricing`, `/technology` — Public marketing pages

---

## Component Architecture

```
src/
├── app/                        # Next.js App Router — one folder per portal
│   ├── layout.tsx              # Root layout (fonts, global providers)
│   ├── globals.css             # Global styles and design token definitions
│   ├── student/
│   │   ├── layout.tsx          # Student portal shell layout
│   │   ├── page.tsx            # Student dashboard
│   │   ├── ai-tutor/           # AI Tutor pages
│   │   ├── courses/            # Course browsing and lesson viewer
│   │   ├── assignments/        # Assignment list and submission
│   │   ├── assessments/        # Quiz and exam sessions
│   │   ├── flashcards/         # Spaced repetition flashcard system
│   │   ├── knowledge-graph/    # Interactive concept graph
│   │   ├── gamification/       # Points, badges, leaderboard
│   │   ├── notes/              # Personal notes
│   │   ├── attendance/         # Attendance view
│   │   └── community/          # Course forum
│   ├── faculty/
│   │   ├── verification-queue/ # Teacher-Verified AI Queue UI
│   │   ├── courses/
│   │   ├── analytics/
│   │   └── ...
│   ├── hod/
│   ├── admin/
│   ├── counselor/
│   ├── parent/
│   ├── mentor/
│   ├── peer_tutor/
│   ├── alumni/
│   ├── researcher/
│   ├── content_creator/
│   └── designer/
│
├── components/
│   ├── ai/                     # AI Tutor components
│   │   ├── TutorLayout.tsx     # Full-screen tutor shell with sidebar and chat
│   │   ├── TutorSidebar.tsx    # Conversation history, topic selector
│   │   └── TutorConversation.tsx  # Message thread, input bar, streaming display
│   ├── ui/                     # Shared UI primitives (shadcn/ui based)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   └── ...
│   └── [portal]/               # Portal-specific components colocated per portal
│
├── lib/
│   ├── api.ts                  # Centralized API client — all backend calls go here
│   │                           # Wraps fetch with auth headers, error handling,
│   │                           # and typed response schemas
│   └── ai-tutor/
│       └── router.ts           # LLM provider routing logic
│                               # Selects auto / ollama / gemini / openrouter
│                               # based on NEXT_PUBLIC_TUTOR_PROVIDER
│
├── hooks/                      # Custom React hooks
│   ├── useAuth.ts              # Auth state, session management
│   ├── useApi.ts               # SWR/fetch wrapper for API calls
│   └── ...
│
├── store/                      # Client-side state (Zustand or Context)
│   └── ...
│
├── types/                      # TypeScript type definitions
│   ├── api.ts                  # API response types
│   ├── user.ts                 # User and role types
│   └── ...
│
└── middleware.ts               # Next.js middleware — auth checks, role-based
                                # redirects, session cookie refresh
```

---

## Design System

Lumina uses a custom dark glass design system built on top of Tailwind CSS 4.

### Color Tokens

Defined in `globals.css` as CSS custom properties:

| Token | Usage |
|---|---|
| `--lumina-primary` | Primary brand color — used for interactive elements, highlights, active states |
| `--lumina-highlight` | Accent/highlight color — used for emphasis, badges, featured content |
| `--lumina-bg` | Dark background base |
| `--lumina-surface` | Card and panel surface color |
| `--lumina-border` | Subtle border color for glass panels |

### Glass Utility Classes

The `glass-v2` utility class (and related variants) provides the signature frosted-glass card appearance used throughout all portals:

```css
/* Used for cards, panels, modals */
.glass-v2 {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}
```

### Animations

All page transitions, component mount animations, and interactive micro-animations use **Framer Motion**. Standard patterns:

- `AnimatePresence` for route transitions
- `motion.div` with `initial`, `animate`, `exit` variants for panel reveals
- Spring-based transitions for interactive elements (buttons, cards)

### Typography and Icons

- Fonts loaded via `next/font` in `app/layout.tsx`
- Icons: **Lucide React** throughout — consistent stroke-weight icon set
- Component library: **shadcn/ui** (Radix UI primitives with Tailwind styling, customized to the Lumina dark theme)

---

## Centralized API Client (`src/lib/api.ts`)

All HTTP calls to the FastAPI backend are made through `src/lib/api.ts`. This module:

- Sets the base URL from `NEXT_PUBLIC_API_URL` (via the Next.js proxy rewrite)
- Attaches auth cookies automatically (via `credentials: 'include'`)
- Provides typed wrapper functions for each backend domain
- Handles common error states (401 redirect to login, 403 forbidden, 5xx errors)

Example usage in a component:

```typescript
import { api } from '@/lib/api'

// Typed response, auth handled automatically
const courses = await api.courses.list()
const tutor = await api.aiTutor.sendMessage(courseId, message)
```

---

## LLM Provider Routing (`src/lib/ai-tutor/router.ts`)

The AI Tutor can use multiple LLM providers. The `router.ts` module selects the active provider based on `NEXT_PUBLIC_TUTOR_PROVIDER`:

| Value | Provider | Notes |
|---|---|---|
| `auto` | Automatic | Tries OpenRouter first, falls back to Gemini, then Ollama |
| `ollama` | Ollama | Local model — requires Ollama running at `http://localhost:11434` |
| `gemini` | Google Gemini API | Requires `GEMINI_API_KEY` |
| `openrouter` | OpenRouter | Routes to Claude Haiku or Sonnet based on query complexity |

In `auto` mode, the router pings each provider's health endpoint and selects the first available one, making local development seamless without requiring cloud API keys.

---

## Build and Deployment

### Production Build

```bash
cd frontend/web
npm run build
npm run start     # serves the built app locally for verification
```

### Deploy to Vercel

The project is configured for Vercel deployment via `vercel.json` at the repository root.

**Steps:**

1. Connect the repository to a Vercel project.
2. Set the root directory to `frontend/web` in Vercel project settings.
3. Add all required environment variables in the Vercel dashboard:
   - `NEXT_PUBLIC_API_URL` — your production backend URL
   - `NEXT_PUBLIC_TUTOR_PROVIDER` — `auto` or `openrouter` for production
4. Deploy:

```bash
vercel --prod
```

Vercel automatically runs `npm run build` and deploys the output. Preview deployments are created for every pull request branch.
