# 🚀 Lumina AI Learning Platform v2.0

## Intelligent AI Dashboard with Multi-Agent Workflow System

Lumina is a production-grade AI learning platform featuring secure backend APIs, PostgreSQL database integration, multi-agent intelligence, and a premium dark UI with glass morphism effects.

---

## ✨ Features

### 🔹 **Database Integration**
- PostgreSQL with Prisma ORM
- Automated migrations and seeding
- Comprehensive schema for users, agents, tasks, chat logs, and projects
- Context memory for shared agent intelligence

### 🔹 **Secure Backend APIs**
- JWT-based authentication
- Session management
- Protected API routes
- Rate limiting ready

### 🔹 **Multi-Agent System**
6 specialized AI agents working collaboratively:
- **Research Agent**: Web search & competitive analysis
- **UI/UX Agent**: Design improvements & component refinement
- **Code Agent**: Code generation & bug fixes
- **Database Agent**: Query execution & migrations
- **Test Agent**: Validation & debugging
- **Orchestrator Agent**: Task coordination

### 🔹 **Premium UI/UX**
- Dark mode with glass morphism
- Smooth animations and transitions
- Responsive design
- Real-time status indicators
- Accessibility-focused

### 🔹 **Real-time Features**
- Live agent status updates
- Task progress tracking
- Notification system

---

## 🛠️ Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **AI**: OpenAI API
- **Authentication**: JWT + bcrypt
- **Deployment**: Vercel
- **Analytics**: Vercel Analytics

---

## 📦 Quick Start

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- OpenAI API key

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/harikiran138/lumina-ai-learning.git
cd lumina-ai-learning

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# 4. Setup database
npm run db:push      # Push schema to database
npm run db:seed      # Seed with sample data

# 5. Start development server
npm run dev
```

Visit [http://localhost:1234](http://localhost:1234)

---

## 🔧 Environment Variables

Create a `.env.local` file with the following:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/lumina_db"

# Authentication
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:1234"
JWT_SECRET="your-jwt-secret-here"

# OpenAI
OPENAI_API_KEY="sk-your-api-key-here"
```

For **Vercel PostgreSQL** (Production):
```bash
POSTGRES_URL="..."
POSTGRES_PRISMA_URL="..."
POSTGRES_URL_NON_POOLING="..."
```

---

## 📚 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database commands
npm run db:generate  # Generate Prisma Client
npm run db:push      # Push schema to database
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Prisma Studio (GUI)
npm run db:migrate   # Create and run migrations
npm run db:reset     # Reset database (WARNING: deletes all data)

# Legacy (Express.js server - for migration reference)
npm run legacy:start # Run old Express server
npm run legacy:build # Build old Parcel bundle
```

---

## 🗂️ Project Structure

```
lumina-ai-learning/
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── seed.ts             # Seed data
│   └── migrations/         # Migration history
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── api/           # API routes
│   │   │   ├── auth/      # Authentication endpoints
│   │   │   ├── agents/    # Agent management
│   │   │   ├── chat/      # Chat/messaging
│   │   │   └── db/        # Database utilities
│   │   ├── layout.tsx     # Root layout
│   │   ├── page.tsx       # Landing page
│   │   └── globals.css    # Global styles
│   ├── components/         # React components (to be added)
│   ├── lib/               # Utilities & libraries
│   │   ├── prisma.ts      # Prisma client
│   │   ├── auth.ts        # Authentication utilities
│   │   ├── utils.ts       # Helper functions
│   │   └── agents/        # Multi-agent system
│   │       ├── orchestrator.ts
│   │       └── context.ts
│   └── types/             # TypeScript types (to be added)
├── public/                # Static assets
├── .env.example           # Environment template
├── next.config.mjs        # Next.js configuration
├── tailwind.config.ts     # Tailwind configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies
```

---

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Agents
- `GET /api/agents` - List all agents
- `POST /api/agents` - Create new agent
- `GET /api/agents/[id]` - Get agent details
- `PATCH /api/agents/[id]` - Update agent
- `DELETE /api/agents/[id]` - Delete agent
- `POST /api/agents/[id]/assign` - Assign task to agent

### Chat
- `POST /api/chat/send` - Send message
- `GET /api/chat/history` - Get chat history

### Database
- `GET /api/db/test` - Test database connectivity

---

## 🚀 Deployment

### Vercel Deployment

1. **Install Vercel CLI** (optional):
   ```bash
   npm i -g vercel
   ```

2. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Production-ready Lumina v2.0"
   git push origin main
   ```

3. **Deploy on Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables in Vercel dashboard
   - Deploy!

4. **Setup Database**:
   - In Vercel dashboard, go to Storage → Create Database → Postgres
   - Copy connection strings to environment variables
   - Vercel will auto-run `prisma generate` on deploy

5. **Seed Production Database**:
   ```bash
   # From local machine with production DB URL
   DATABASE_URL="<production-url>" npm run db:seed
   ```

### Environment Variables on Vercel

Add these in Vercel → Project Settings → Environment Variables:

```
DATABASE_URL=<from Vercel Postgres>
POSTGRES_PRISMA_URL=<from Vercel Postgres>
NEXTAUTH_SECRET=<generate strong secret>
NEXTAUTH_URL=<your-vercel-url>
JWT_SECRET=<generate strong secret>
OPENAI_API_KEY=<your-openai-key>
```

---

## 🧪 Testing the System

### 1. Test Database Connection
Visit: `https://your-domain.vercel.app/api/db/test`

### 2. Test Authentication
```bash
# Register a new user
curl -X POST https://your-domain/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Login
curl -X POST https://your-domain/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 3. Test Agents
Visit the dashboard or use API:
```bash
curl https://your-domain/api/agents
```

---

## 📖 Documentation

- [Architecture Overview](/.agent/PRODUCTION_UPGRADE_PLAN.md)
- [Database Schema](/prisma/schema.prisma)
- API Documentation (see API Endpoints section above)

---

## 🎯 Default Credentials (Development)

After running `npm run db:seed`, use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@lumina.ai | password123 |
| Teacher | teacher@lumina.ai | password123 |
| Student | student@lumina.ai | password123 |

**⚠️ Change these in production!**

---

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
psql -U postgres

# Regenerate Prisma Client
npm run db:generate

# Reset database (WARNING: deletes all data)
npm run db:reset
```

### Build Errors
```bash
# Clear cache
rm -rf .next node_modules package-lock.json
npm install
npm run dev
```

### Type Errors
```bash
# Run type check
npm run type-check

# Regenerate Prisma types
npm run db:generate
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

ISC

---

## 🌟 Upgrade Highlights

### From v1.0 to v2.0

✅ Migrated from Express.js to **Next.js 14**  
✅ Added **PostgreSQL** database with Prisma ORM  
✅ Implemented **JWT authentication** system  
✅ Built **Multi-Agent AI System** (6 agents)  
✅ Created **Secure Backend APIs**  
✅ Enhanced UI with **Glass Morphism** & dark mode  
✅ Added **Real-time features**  
✅ Optimized for **Vercel deployment**  
✅ Comprehensive **documentation**  

---

## 📞 Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/harikiran138/lumina-ai-learning/issues)
- Documentation: Check the `.agent/` folder for detailed guides

---

**Built with ❤️ by the Lumina Team**
