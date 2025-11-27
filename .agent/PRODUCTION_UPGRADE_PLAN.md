# Lumina Production System Upgrade Plan

## Overview
Transform the existing Express.js + EJS application into a full-stack Next.js production system with PostgreSQL database, secure backend APIs, and multi-agent workflow intelligence.

## Architecture Transformation

### Current Stack
- **Frontend**: HTML/EJS templates, vanilla JavaScript
- **Backend**: Express.js with basic routing
- **Data**: Static/hardcoded data
- **Deployment**: Vercel (static)

### Target Stack
- **Frontend**: Next.js 14+ with App Router, React, TypeScript
- **Backend**: Next.js API Routes with JWT authentication
- **Database**: PostgreSQL (Vercel Postgres) + Prisma ORM
- **AI Agents**: OpenAI Assistants API with custom orchestration
- **Deployment**: Vercel with PostgreSQL cloud database

## Implementation Phases

### Phase 1: Project Foundation & Setup
1. Create Next.js 14 application structure
2. Install and configure dependencies
3. Setup TypeScript configuration
4. Create folder structure

### Phase 2: Database Layer
1. Install Prisma and PostgreSQL client
2. Design database schema:
   - Users (authentication)
   - Agents (multi-agent system)
   - Tasks (agent task tracking)
   - ChatLogs (conversation history)
   - Projects (project management)
   - ContextMemory (shared agent memory)
3. Create Prisma schema file
4. Setup migrations
5. Create seed data

### Phase 3: Backend API Implementation
1. Authentication API routes:
   - `/api/auth/register` - User registration
   - `/api/auth/login` - JWT login
   - `/api/auth/refresh` - Token refresh
   - `/api/auth/logout` - Logout
2. Agent API routes:
   - `/api/agents` - List all agents
   - `/api/agents/create` - Create new agent
   - `/api/agents/[id]` - Get/update agent
   - `/api/agents/[id]/assign` - Assign task to agent
3. Chat API routes:
   - `/api/chat/send` - Send message
   - `/api/chat/history` - Get chat history
   - `/api/chat/agents` - Multi-agent communication
4. Database test route:
   - `/api/db/test` - Verify database connectivity
5. Implement JWT middleware
6. Setup environment variables

### Phase 4: Multi-Agent System
1. Define agent types:
   - Research Agent
   - UI/UX Agent
   - Code Agent
   - DB Agent
   - Test Agent
2. Create agent orchestration layer
3. Implement task queue system
4. Setup shared memory through database
5. Create agent communication protocol
6. Implement tool execution framework
7. Add reasoning step logging

### Phase 5: Frontend Migration & Enhancement
1. Migrate existing pages to Next.js:
   - Landing page
   - Login/Register
   - Student dashboard
   - Teacher dashboard
   - Admin dashboard
2. Create new components:
   - Premium UI components with dark/glossy theme
   - Sidebar navigation
   - Breadcrumbs
   - Dashboard analytics
   - Real-time task progress indicators
   - Agent status cards
   - Chat interface
3. Implement responsive layouts
4. Add accessibility features
5. Setup Tailwind CSS with custom theme

### Phase 6: Real-time Features
1. Setup WebSocket or Server-Sent Events
2. Implement live agent status updates
3. Add real-time task progress tracking
4. Create notification system

### Phase 7: Testing & Quality Assurance
1. Unit tests for API routes
2. Integration tests for database operations
3. E2E tests for critical workflows
4. Simulated multi-agent task execution
5. Performance testing

### Phase 8: Documentation
1. Setup guide (README.md)
2. Architecture documentation
3. API documentation
4. Agent configuration guide
5. Deployment guide
6. Database schema documentation

### Phase 9: Deployment
1. Configure Vercel project
2. Setup Vercel PostgreSQL database
3. Configure environment variables
4. Setup automatic migrations on deploy
5. Deploy to production
6. Post-deployment verification

## Technology Stack Details

### Core Dependencies
```json
{
  "next": "^14.0.0",
  "react": "^18.0.0",
  "typescript": "^5.0.0",
  "@prisma/client": "^5.0.0",
  "prisma": "^5.0.0",
  "jsonwebtoken": "^9.0.0",
  "bcryptjs": "^2.4.3",
  "zod": "^3.0.0",
  "openai": "^4.0.0",
  "ws": "^8.0.0"
}
```

### Development Dependencies
```json
{
  "tailwindcss": "^3.0.0",
  "autoprefixer": "^10.0.0",
  "postcss": "^8.0.0",
  "@types/node": "^20.0.0",
  "@types/react": "^18.0.0",
  "vitest": "^1.0.0",
  "@testing-library/react": "^14.0.0"
}
```

## Database Schema Overview

### Users
- id, email, password_hash, name, role, created_at, updated_at

### Agents
- id, name, type, role, status, config, created_at, updated_at

### Tasks
- id, title, description, agent_id, status, priority, assigned_at, completed_at, result

### ChatLogs
- id, user_id, agent_id, message, role, timestamp, metadata

### Projects
- id, name, description, user_id, status, created_at, updated_at

### ContextMemory
- id, key, value, agent_id, project_id, created_at, expires_at

## File Structure
```
lumina-ai-learning/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/
│   │   │   ├── student/
│   │   │   ├── teacher/
│   │   │   └── admin/
│   │   ├── api/                # API Routes
│   │   │   ├── auth/
│   │   │   ├── agents/
│   │   │   ├── chat/
│   │   │   └── db/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/             # React Components
│   │   ├── ui/
│   │   ├── dashboard/
│   │   ├── agents/
│   │   └── chat/
│   ├── lib/                    # Utilities
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── agents/
│   │   └── utils.ts
│   ├── types/                  # TypeScript Types
│   └── middleware.ts           # Next.js Middleware
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/
├── tests/
├── .env.local
├── .env.example
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## Environment Variables Required
```
DATABASE_URL="postgresql://..."
OPENAI_API_KEY="sk-..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:1234"
JWT_SECRET="..."
```

## Success Criteria
- ✅ PostgreSQL database fully configured and connected
- ✅ All API routes functional with JWT authentication
- ✅ Multi-agent system operational with task execution
- ✅ Frontend migrated to Next.js with enhanced UI
- ✅ Real-time updates working
- ✅ Tests passing (unit + integration)
- ✅ Documentation complete
- ✅ Successfully deployed to Vercel
- ✅ Database auto-migration on deploy

## Timeline Estimate
- Setup & Configuration: 30 minutes
- Database & Backend: 1-2 hours
- Multi-Agent System: 2-3 hours
- Frontend Migration: 2-3 hours
- Testing: 1 hour
- Documentation: 30 minutes
- Deployment: 30 minutes

**Total: ~8-12 hours of development**

## Next Steps
1. Backup current codebase
2. Begin Phase 1: Project Foundation
3. Proceed sequentially through phases
4. Test continuously
5. Deploy and verify
