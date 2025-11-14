# Lumina AI Learning - Local Development Setup

## ✅ Quick Start Summary

All services are now running locally on your machine:

| Service | Port | Status | Health Check |
|---------|------|--------|--------------|
| **Backend (FastAPI)** | 8000 | ✅ Running | http://127.0.0.1:8000/health |
| **API Server (Express)** | 3001 | ✅ Running | http://127.0.0.1:3001/api/health |
| **Streak Service** | 8001 | ⚠️ Running (Redis offline) | http://127.0.0.1:8001/health |
| **Frontend (Next.js)** | 3000 | ✅ Running | http://localhost:3000 |

---

## 🚀 Running the Services

### Backend (Port 8000)
```bash
cd backend
/Users/chepuriharikiran/Desktop/github/lumina-ai-learning/.venv/bin/python main.py
```

**Health Check:**
```bash
curl http://127.0.0.1:8000/health
```

### API Server (Port 3001)
```bash
cd api
node server.js
# or use nodemon for auto-reload:
# npm run dev
```

**Health Check:**
```bash
curl http://127.0.0.1:3001/api/health
```

### Streak Service (Port 8001)
```bash
cd streak-service
/Users/chepuriharikiran/Desktop/github/lumina-ai-learning/.venv/bin/python main.py
```

**Note:** Requires Redis running on `localhost:6379`. Install with:
```bash
brew install redis
brew services start redis
```

### Frontend (Port 3000)
```bash
cd frontend
npm run dev
```

Visit http://localhost:3000 in your browser.

---

## 🔧 Configuration Files Created

### 1. Environment Files
- **backend/.env** — Backend configuration (using SQLite for quick dev)
- **backend/.env.example** — Template for env vars
- **api/.env.example** — API server env template
- **frontend/.env.local.example** — Frontend env template

### 2. Package Files
- **api/package.json** — Added npm scripts and dependencies
- **frontend/next.config.js** — Next.js config with dev API proxy
- **frontend/.vercelignore** — Vercel deployment ignore rules

### 3. Helper Scripts
- **dev-run.sh** — Bash script to start all services (experimental)

---

## 🛠️ What Was Fixed

### Syntax Errors
1. **backend/main.py** — Fixed invalid `with` statement syntax (line 497)
2. **backend/services/personalization_engine.py** — Fixed indentation error (line 264)

### Dependency Issues
- Added missing Python packages: `loguru`, `email-validator`, `requests`, `opentelemetry-*`, `prometheus-client`
- Installed API server dependencies: `express`, `pg`, `cors`, `helmet`, etc.

### Database Handling
- Switched from PostgreSQL to SQLite for quick local dev (avoid schema migration issues)
- Commented out DB table creation and WebSocket service initialization to allow server startup without heavy ML dependencies

### Environment Setup
- Created virtual environment at project root: `.venv/`
- Backend uses dummy ML services (fallbacks) when heavy libraries like `sentence-transformers`, `torch`, `milvus` are not installed

---

## 📦 Vercel Deployment Guide

### Option 1: Deploy Frontend Only (Recommended)
The simplest approach is to deploy the Next.js frontend to Vercel and keep the backend/API on a separate platform (Render, Railway, Fly.io, or your own server).

**Steps:**
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repo
3. Set **Root Directory** to `frontend`
4. Add environment variables in Vercel dashboard:
   ```
   NEXT_PUBLIC_API_URL=https://your-api-server.com
   NEXT_PUBLIC_BACKEND_URL=https://your-backend.com
   ```
5. Deploy!

### Option 2: Deploy Entire Monorepo
If you want to deploy backend + frontend together:

**vercel.json** (create in project root):
```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/next"
    },
    {
      "src": "backend/main.py",
      "use": "@vercel/python"
    },
    {
      "src": "api/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "api/server.js"
    },
    {
      "src": "/backend/(.*)",
      "dest": "backend/main.py"
    },
    {
      "src": "/(.*)",
      "dest": "frontend/$1"
    }
  ]
}
```

**Important Notes:**
- Vercel has a 250MB deployment size limit and 50MB function size limit — the backend with ML libraries will exceed this
- For backend with heavy ML deps, use **Render**, **Railway**, **Fly.io**, or **AWS Lambda** (with layers)
- The API server (Express) can run on Vercel serverless functions
- Frontend is perfect for Vercel (Next.js native support)

### Recommended Architecture for Production
```
Frontend (Next.js) → Vercel
API Server (Express) → Vercel Serverless or separate Node host
Backend (FastAPI + ML) → Render/Railway/Fly.io with GPU support
Streak Service → Same as backend or separate microservice host
Database (PostgreSQL) → Vercel Postgres, Supabase, or Neon
Redis → Upstash Redis (serverless) or Redis Cloud
```

---

## 🐛 Known Issues & Next Steps

### Current Limitations
1. **Database:** Using SQLite locally; need to set up PostgreSQL for full functionality
   - Schema has incompatible types (`users.id` is VARCHAR but foreign keys expect INTEGER)
   - Run Alembic migrations after fixing schema: `alembic upgrade head`

2. **Redis:** Streak service requires Redis (install with `brew install redis && brew services start redis`)

3. **ML Features:** Heavy ML libraries not installed (sentence-transformers, torch, milvus)
   - Backend uses dummy fallback implementations
   - To enable full features: `pip install -r backend/requirements.txt` (large download, ~4GB)

4. **WebSocket Service:** Disabled for quick dev (requires networkx and other deps)

### To Enable Full Features Locally
```bash
# Install PostgreSQL
brew install postgresql@15
brew services start postgresql@15
createdb lumina

# Run DB init script
psql -d lumina -f database/init.sql

# Update backend/.env to use Postgres
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lumina

# Install full Python requirements (large, includes PyTorch)
cd backend
source ../.venv/bin/activate
pip install -r requirements.txt

# Uncomment DB and WebSocket initialization in backend/main.py
```

### Vercel-Specific Setup
1. **Environment Variables:**
   - Add all env vars from `.env.example` files to Vercel dashboard
   - Use Vercel Postgres addon or external PostgreSQL (Supabase/Neon)
   - Use Upstash Redis for streak service

2. **Build Settings:**
   - Frontend: `npm run build` (automatic for Next.js)
   - Backend: May need custom build command or Dockerfile (if using containers)

3. **API Routes:**
   - Next.js API routes can proxy to backend: create `frontend/pages/api/[...proxy].ts`
   - Or use Vercel rewrites in `next.config.js` (already configured for dev)

---

## 📝 Quick Commands Cheat Sheet

### Start All Services (Manual)
```bash
# Terminal 1: Backend
cd backend && ../.venv/bin/python main.py

# Terminal 2: API Server
cd api && node server.js

# Terminal 3: Streak Service
cd streak-service && ../.venv/bin/python main.py

# Terminal 4: Frontend
cd frontend && npm run dev
```

### Check All Health Endpoints
```bash
curl http://127.0.0.1:8000/health   # Backend
curl http://127.0.0.1:3001/api/health  # API
curl http://127.0.0.1:8001/health   # Streak service
curl http://localhost:3000          # Frontend
```

### Stop All Services
```bash
pkill -f "python.*main.py"
pkill -f "node.*server.js"
pkill -f "next dev"
```

---

## 🎉 Success!

Your Lumina AI Learning platform is now running locally! 

- Frontend: http://localhost:3000
- Backend API: http://127.0.0.1:8000/docs (FastAPI Swagger UI)
- Express API: http://127.0.0.1:3001

For Vercel deployment questions or issues, check the Vercel docs:
- https://vercel.com/docs/frameworks/nextjs
- https://vercel.com/docs/functions/serverless-functions/runtimes/python

Happy coding! 🚀
