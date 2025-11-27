# Lumina AI Learning Platform - Architecture Documentation

## System Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                          │
│  Next.js Frontend + React Components + Tailwind CSS             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS APP ROUTER                            │
│  - Server Components                                             │
│  - Client Components                                             │
│  - Middleware (Auth)                                             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
┌───────────────────────┐   ┌───────────────────────┐
│   API ROUTES          │   │   PAGE ROUTES         │
│   /api/*              │   │   /, /dashboard, etc  │
│   - auth              │   └───────────────────────┘
│   - agents            │
│   - chat              │
│   - db                │
└─────────┬─────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Auth      │  │   Agents    │  │   Context   │             │
│  │   Service   │  │Orchestrator │  │   Manager   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATA ACCESS LAYER                             │
│                    Prisma ORM Client                             │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    POSTGRESQL DATABASE                           │
│  - Users          - Tasks          - Projects                    │
│  - Agents         - ChatLogs       - ContextMemory              │
│  - Sessions       - Notifications                                │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                             │
│  - OpenAI API (Agent Intelligence)                               │
│  - Vercel Analytics                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### 1. Frontend Layer

**Technology**: Next.js 14 App Router, React, TypeScript, Tailwind CSS

**Components**:
- **Pages**: Landing, Login, Register, Dashboard (Student/Teacher/Admin)
- **UI Components**: Buttons, Cards, Modals, Forms, Notifications
- **Agent Components**: Agent Cards, Task Lists, Chat Interface
- **Layout Components**: Sidebar, Header, Footer

**Features**:
- Server-side rendering (SSR)
- Static site generation (SSG) where applicable
- Client-side hydration
- Premium UI with glass morphism
- Real-time updates via polling/WebSocket (future)

---

### 2. API Layer

**Location**: `/src/app/api/`

#### Authentication Routes (`/api/auth/`)
- `POST /register` - User registration with password hashing
- `POST /login` - JWT token generation and session creation
- `POST /logout` - Session invalidation
- `GET /me` - Current user information

#### Agent Routes (`/api/agents/`)
- `GET /agents` - List all agents with stats
- `POST /agents` - Create new agent
- `GET /agents/[id]` - Get agent details and task history
- `PATCH /agents/[id]` - Update agent configuration
- `DELETE /agents/[id]` - Remove agent
- `POST /agents/[id]/assign` - Assign task to specific agent

#### Chat Routes (`/api/chat/`)
- `POST /send` - Send message to agent
- `GET /history` - Retrieve conversation history

#### Database Routes (`/api/db/`)
- `GET /test` - Health check and database stats

---

### 3. Business Logic Layer

#### auth.ts
**Responsibilities**:
- Password hashing (bcrypt)
- JWT token generation/verification
- Session management
- User authentication

**Key Functions**:
```typescript
hashPassword(password: string): Promise<string>
verifyPassword(password: string, hash: string): Promise<boolean>
generateToken(payload: JWTPayload): string
verifyToken(token: string): JWTPayload | null
createSession(userId: string, token: string)
validateSession(token: string)
```

#### orchestrator.ts
**Responsibilities**:
- Task queue management
- Agent coordination
- Task assignment and execution
- Status tracking
- Notification generation

**Key Classes**:
```typescript
class AgentOrchestrator {
  createTask(taskInput: TaskInput): Promise<string>
  processTask(taskId: string): Promise<TaskResult>
  executeAgentTask(agent, task): Promise<TaskResult>
  getAgentStatus(agentId: string)
  getActiveTasks()
  cancelTask(taskId: string)
}
```

#### context.ts
**Responsibilities**:
- Shared memory management
- Context storage and retrieval
- Memory cleanup
- Session-based context

**Key Classes**:
```typescript
class ContextManager {
  set(key, value, options?)
  get(key, options?)
  cleanup()
  clear(options)
}
```

---

### 4. Data Access Layer

**Technology**: Prisma ORM

**Models**:
1. **User** - Authentication and user management
2. **Session** - JWT session tracking
3. **Agent** - AI agent configuration
4. **Task** - Agent task tracking
5. **ChatLog** - Conversation history
6. **Project** - Project management
7. **ContextMemory** - Shared agent memory
8. **Notification** - User notifications

---

### 5. Database Schema

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   User      │────────╱│   Project   │╲────────│  ChatLog    │
│  - id       │   1:N  ╱ │  - id       │╲  1:N   │  - id       │
│  - email    │       ╱  │  - name     │ ╲       │  - message  │
│  - role     │      ╱   │  - userId   │  ╲      │  - role     │
└─────────────┘     ╱    └─────────────┘   ╲     └─────────────┘
                   ╱                         ╲
                  ╱                           ╲
┌─────────────┐ ╱                             ╲  ┌─────────────┐
│  Session    │╱                               ╲ │   Agent     │
│  - id       │                                  ╲│  - id       │
│  - token    │                                   │  - type     │
│  - userId   │                                   │  - status   │
└─────────────┘                                   └──────┬──────┘
                                                         │
                                                         │ 1:N
                                                         │
                                                  ┌──────▼──────┐
                                                  │    Task     │
                                                  │  - id       │
                                                  │  - title    │
                                                  │  - status   │
                                                  │  - agentId  │
                                                  └─────────────┘
```

---

## Multi-Agent System Architecture

### Agent Types

1. **Research Agent**
   - Type: `RESEARCH`
   - Tools: web_search, content_analysis, data_extraction
   - Use Cases: Competitive analysis, information gathering

2. **UI/UX Agent**
   - Type: `UI_UX`
   - Tools: design_analysis, component_generation, accessibility_check
   - Use Cases: Design improvements, component refinement

3. **Code Agent**
   - Type: `CODE`
   - Tools: code_generation, bug_fixing, code_review, refactoring
   - Use Cases: Feature implementation, bug fixes

4. **Database Agent**
   - Type: `DATABASE`
   - Tools: query_execution, migration_generation, db_optimization
   - Use Cases: Database management, query optimization

5. **Test Agent**
   - Type: `TEST`
   - Tools: test_execution, validation, debugging
   - Use Cases: Quality assurance, testing

6. **Orchestrator Agent**
   - Type: `ORCHESTRATOR`
   - Tools: task_delegation, agent_coordination, workflow_management
   - Use Cases: Multi-agent coordination

### Task Flow

```
User Request
     │
     ▼
┌─────────────────┐
│  Orchestrator   │
│     Agent       │
└────────┬────────┘
         │
         │ Analyzes & Delegates
         │
    ┌────┴─────┬─────────┬──────────┬─────────┐
    ▼          ▼         ▼          ▼         ▼
┌─────────┐┌─────────┐┌─────────┐┌─────────┐┌─────────┐
│Research ││UI/UX    ││Code     ││Database ││Test     │
│Agent    ││Agent    ││Agent    ││Agent    ││Agent    │
└─────────┘└─────────┘└─────────┘└─────────┘└─────────┘
    │          │         │          │         │
    └──────────┴─────────┴──────────┴─────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ Context Memory  │
              │   (Shared)      │
              └─────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │   Result        │
              │ Aggregation     │
              └─────────────────┘
                       │
                       ▼
                   User Response
```

---

## Security Architecture

### Authentication Flow

```
1. User Registration
   ├─> Password hashing (bcrypt, 10 rounds)
   ├─> User creation in database
   ├─> JWT token generation
   └─> Session creation

2. User Login
   ├─> Password verification
   ├─> JWT token generation
   ├─> Session creation
   └─> Token returned to client

3. Protected Route Access
   ├─> Token extraction from header/cookie
   ├─> Token verification (JWT)
   ├─> Session validation (database)
   └─> Access granted or denied
```

### Security Features

1. **Password Security**
   - bcrypt hashing with salt rounds
   - Minimum password length enforcement

2. **JWT Tokens**
   - Signed with secret key
   - 7-day expiration
   - Contains user ID, email, role

3. **Session Management**
   - Database-backed sessions
   - Expiration tracking
   - Automatic cleanup of expired sessions

4. **API Protection**
   - Authentication middleware
   - Rate limiting (ready)
   - Input validation (Zod)

5. **Environment Variables**
   - Secret keys externalized
   - No hardcoded credentials
   - .env.local for local development

---

## Deployment Architecture

### Vercel Deployment

```
┌─────────────────────────────────────────────────────────┐
│                      GitHub                              │
│         (Source Code Repository)                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Push/Merge
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   Vercel Platform                        │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Build Process:                                    │ │
│  │  1. npm install                                    │ │
│  │  2. prisma generate (postinstall)                 │ │
│  │  3. next build                                     │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Next.js Application (Serverless Functions)        │ │
│  │  - API Routes as Lambda Functions                  │ │
│  │  - Static pages cached at edge                     │ │
│  └────────────────────────────────────────────────────┘ │
└────────────────────┬────────────────────────────────────┘
                     │
           ┌─────────┴─────────┐
           │                   │
           ▼                   ▼
┌──────────────────┐  ┌──────────────────┐
│ Vercel Postgres  │  │ Vercel Edge      │
│   (Database)     │  │   Network        │
│                  │  │   (CDN)          │
└──────────────────┘  └──────────────────┘
           │
           ▼
   Automatic Backups
```

### Environment Configuration

**Development**:
- Local PostgreSQL or Vercel Postgres Dev
- Local environment variables (.env.local)
- Hot reload enabled

**Production**:
- Vercel Postgres (Cloud)
- Environment variables in Vercel dashboard
- Optimized builds
- Edge caching

---

## Performance Optimizations

1. **Database**
   - Connection pooling (Prisma)
   - Indexed queries
   - Optimistic concurrency control

2. **Frontend**
   - Server-side rendering
   - Static generation where applicable
   - Image optimization
   - Code splitting

3. **API**
   - Efficient database queries
   - Caching strategies (future)
   - Rate limiting

4. **Deployment**
   - Edge network (Vercel)
   - Serverless functions
   - Automatic scaling

---

## Scalability Considerations

1. **Horizontal Scaling**
   - Serverless architecture (auto-scales)
   - Database connection pooling

2. **Vertical Scaling**
   - Optimized queries
   - Efficient algorithms
   - Resource management

3. **Future Enhancements**
   - Redis for caching
   - Queue system for agent tasks (Bull/BullMQ)
   - WebSocket for real-time updates
   - CDN for static assets

---

## Monitoring & Observability

1. **Application Monitoring**
   - Vercel Analytics (installed)
   - Error tracking (future: Sentry)
   - Performance metrics

2. **Database Monitoring**
   - Prisma query logging
   - Connection pool monitoring
   - Slow query detection

3. **Agent Monitoring**
   - Task status tracking
   - Execution time metrics
   - Error rates

---

## Technology Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes |
| Database | PostgreSQL + Prisma ORM |
| Authentication | JWT + bcrypt |
| AI | OpenAI API |
| Deployment | Vercel |
| Version Control | Git + GitHub |
| Package Manager | npm |
| Validation | Zod |
| Analytics | Vercel Analytics |

---

## File Structure Map

```
/src/app/                    # Next.js App Router
  ├── api/                   # API Routes (Backend)
  │   ├── auth/             # Authentication endpoints
  │   ├── agents/           # Agent management
  │   ├── chat/             # Chat/messaging
  │   └── db/               # Database utilities
  ├── layout.tsx            # Root layout template
  ├── page.tsx              # Landing page
  └── globals.css           # Global styles

/src/lib/                   # Shared libraries
  ├── prisma.ts            # Prisma client singleton
  ├── auth.ts              # Authentication utilities
  ├── utils.ts             # Helper functions
  └── agents/              # Multi-agent system
      ├── orchestrator.ts  # Task orchestration
      └── context.ts       # Shared memory

/prisma/                    # Database configuration
  ├── schema.prisma        # Database schema
  ├── seed.ts              # Seed data
  └── migrations/          # Migration history

/src/middleware.ts          # Next.js middleware (auth)
```

---

This architecture supports:
- ✅ Scalable multi-agent system
- ✅ Secure authentication and authorization
- ✅ Real-time task processing
- ✅ Cloud-native deployment
- ✅ Production-grade performance
- ✅ Easy maintenance and extensibility
