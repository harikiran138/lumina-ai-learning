# 🚀 Lumina v2.0 - Quick Reference Card

## ⚡ Quick Start (3 steps)
```bash
npm install               # 1. Install dependencies
npm run db:push          # 2. Setup database
npm run dev              # 3. Start server → http://localhost:1234
```

## 📝 Essential Commands

### Development
```bash
npm run dev              # Start development server (:1234)
npm run build           # Build for production
npm run start           # Run production build
```

### Database
```bash
npm run db:push         # Push schema to database (no migration)
npm run db:seed         # Seed with sample data
npm run db:studio       # Open database GUI
npm run db:migrate      # Create migration
npm run db:generate     # Regenerate Prisma Client
npm run db:reset        # ⚠️ RESET (deletes all data)
```

### Quality
```bash
npm run lint            # Run ESLint
npm run type-check      # TypeScript validation
npm run clean           # Clean build artifacts
```

## 🔑 Default Login Credentials (After Seed)
```
Admin:   admin@lumina.ai / password123
Teacher: teacher@lumina.ai / password123
Student: student@lumina.ai / password123
```

## 🌐 API Endpoints

### Auth
```
POST   /api/auth/register     Register new user
POST   /api/auth/login        Login (returns JWT)
POST   /api/auth/logout       Logout
GET    /api/auth/me           Get current user
```

### Agents
```
GET    /api/agents            List all agents
POST   /api/agents            Create agent
GET    /api/agents/[id]       Get agent details
PATCH  /api/agents/[id]       Update agent
DELETE /api/agents/[id]       Delete agent
POST   /api/agents/[id]/assign  Assign task
```

### Chat
```
POST   /api/chat/send         Send message
GET    /api/chat/history      Get chat history
```

### Database
```
GET    /api/db/test           Test DB connection + stats
```

## 📊 Database Models
1. User - Authentication & profiles
2. Session - JWT sessions
3. Agent - AI agents (6 types)
4. Task - Agent tasks
5. ChatLog - Conversations
6. Project - Project management
7. ContextMemory - Shared agent memory
8. Notification - User notifications

## 🤖 AI Agents (6 Total)
- **RESEARCH** - Web search, analysis
- **UI_UX** - Design improvements
- **CODE** - Code generation, fixes
- **DATABASE** - DB queries, migrations
- **TEST** - Testing, validation
- **ORCHESTRATOR** - Multi-agent coordination

## 🔧 Environment Variables Required

**.env.local** (create from .env.example):
```bash
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-32-chars"
NEXTAUTH_SECRET="your-secret-32-chars"  
NEXTAUTH_URL="http://localhost:1234"
OPENAI_API_KEY="sk-..."
```

## 📁 Key Files
```
src/app/api/           - Backend API routes
src/lib/prisma.ts      - Database client
src/lib/auth.ts        - Authentication
src/lib/agents/        - Multi-agent system
prisma/schema.prisma   - Database schema
src/app/page.tsx       - Landing page
```

## 🧪 Test API (cURL Examples)

### Register
```bash
curl -X POST http://localhost:1234/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@ex.com","password":"pass123","name":"Test"}'
```

### Login
```bash
curl -X POST http://localhost:1234/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lumina.ai","password":"password123"}'
```

### Test DB
```bash
curl http://localhost:1234/api/db/test
```

### List Agents
```bash
curl http://localhost:1234/api/agents
```

## 🚀 Vercel Deployment

### 1. Push to GitHub
```bash
git add .
git commit -m "Production ready"
git push origin main
```

### 2. In Vercel Dashboard
- Import GitHub repo
- Add environment variables
- Deploy

### 3. Setup Production Database
```bash
# After deploy, seed production DB
DATABASE_URL="<prod-url>" npm run db:seed
```

## 🐛 Troubleshooting

### Can't connect to database
```bash
# Check DATABASE_URL in .env.local
# Verify PostgreSQL is running
# Regenerate Prisma Client
npm run db:generate
```

### Build fails
```bash
# Clean and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Module not found
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

## 📚 Documentation
- **README.md** - Main documentation
- **SETUP_GUIDE.md** - Detailed setup
- **ARCHITECTURE.md** - System design
- **DEPLOYMENT_CHECKLIST.md** - Production checklist
- **PROJECT_COMPLETE.md** - Completion summary

## 🎨 Tailwind Custom Classes
```css
.glass              - Glass morphism effect
.card               - Premium card
.btn-primary        - Primary button
.btn-secondary      - Secondary button
.status-idle        - Agent status: idle
.status-busy        - Agent status: busy
.text-gradient      - Gradient text
```

## ⚙️ Tech Stack
- **Framework**: Next.js 14
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma
- **Auth**: JWT + bcrypt
- **AI**: OpenAI
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## 📦 Installed Packages: 372
- Core: next, react, typescript
- Database: @prisma/client, prisma
- Auth: jsonwebtoken, bcryptjs
- AI: openai
- Styling: tailwindcss
- Utils: zod, clsx, etc.

## ✅ Quick Health Check
```bash
# 1. Dependencies installed?
npm list --depth=0

# 2. Database connected?
curl http://localhost:1234/api/db/test

# 3. Build works?
npm run build

# 4. Server running?
npm run dev
```

## 🎯 Success Indicators
✅ `npm run dev` starts without errors  
✅ http://localhost:1234 loads  
✅ `/api/db/test` returns stats  
✅ `/api/agents` lists 6 agents  
✅ Can register/login users  
✅ `npm run build` completes  

## 🔗 Useful Links
- Landing: http://localhost:1234
- DB Test: http://localhost:1234/api/db/test
- Prisma Studio: `npm run db:studio` → http://localhost:5555

---

**Version**: 2.0.0  
**Status**: Production Ready ✅  
**Last Updated**: 2025-11-27

---

For detailed information, see:
- `README.md` - Complete guide
- `SETUP_GUIDE.md` - Step-by-step setup
- `PROJECT_COMPLETE.md` - Completion summary
