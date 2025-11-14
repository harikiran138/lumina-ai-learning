# 🎓 Lumina AI Learning Platform

An AI-powered learning management system with personalized pathways, adaptive assessments, and real-time analytics.

## ⚡ Quick Start

### **Local Development (5 minutes)**

```bash
# Terminal 1: Backend
cd backend && python main.py

# Terminal 2: API Server
cd api && node server.js

# Terminal 3: Streak Service
cd streak-service && python main.py

# Terminal 4: Frontend
cd frontend && npm run dev
```

Visit http://localhost:3000 ✅

### **Docker (Single Command)**

```bash
docker-compose up
```

All services at http://localhost:3000

---

## 🚀 Deployment

### **Quick Deploy (Recommended)**

```bash
chmod +x quick-deploy.sh
./quick-deploy.sh
```

**Features:**
- ✅ Automatic dependency check
- ✅ Git commit & push
- ✅ Deploy to Vercel (frontend)
- ✅ Instructions for backend & API

### **Manual Deployment**

See [DEPLOY_QUICK_START.md](DEPLOY_QUICK_START.md) for step-by-step instructions.

Deployment architecture:
- **Frontend** → Vercel
- **Backend** → Render
- **API** → Railway
- **Database** → Render PostgreSQL
- **Cache** → Upstash Redis

---

## 📋 Project Structure

```
lumina-ai-learning/
├── frontend/          # Next.js React app
├── backend/           # FastAPI + ML services
├── api/               # Express API server
├── streak-service/    # FastAPI microservice
├── database/          # SQL migrations
└── docs/              # Documentation
```

---

## 🛠 Technology Stack

### **Frontend**
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Zustand (state management)

### **Backend**
- FastAPI (Python)
- SQLAlchemy ORM
- PostgreSQL
- Redis
- OpenTelemetry (monitoring)

### **Services**
- Express.js (API server)
- FastAPI (Streak microservice)
- Uvicorn (ASGI server)

### **Infrastructure**
- Docker & Docker Compose
- Vercel (frontend)
- Render (backend)
- Railway (API)
- Upstash (Redis)

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [LOCAL_SETUP.md](LOCAL_SETUP.md) | Local development setup |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Full deployment guide |
| [DEPLOY_QUICK_START.md](DEPLOY_QUICK_START.md) | Quick deployment steps |
| [backend/README.md](backend/README.md) | Backend setup |
| [frontend/README.md](frontend/README.md) | Frontend setup |

---

## 🎯 Features

- 🧠 **AI-Powered Learning Paths** — Personalized recommendations using ML
- 📊 **Adaptive Assessments** — Difficulty adjusts based on performance
- 🔄 **Real-time Analytics** — Student progress tracking & insights
- 🎮 **Gamification** — Learning streaks & leaderboards
- 🎨 **Modern UI** — Responsive, accessible interface
- 🔐 **Security** — JWT auth, password hashing, CORS
- 📈 **Monitoring** — OpenTelemetry & Prometheus metrics

---

## 🔧 Environment Variables

### **Backend** (`backend/.env`)
```
DATABASE_URL=postgresql://user:pass@localhost/lumina
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
CORS_ORIGINS=["http://localhost:3000"]
```

### **API Server** (`api/.env`)
```
PORT=3001
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=password
JWT_SECRET=your-secret-key
```

### **Frontend** (`frontend/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

See `.env.example` files for full options.

---

## 🧪 Testing

### **Backend Tests**
```bash
cd backend
pytest tests/
```

### **Frontend Tests**
```bash
cd frontend
npm test
```

---

## 🐛 Troubleshooting

### **Backend won't start**
```bash
# Check Python version
python --version  # Should be 3.14+

# Install dependencies
pip install -r requirements.txt

# Check database
psql -U postgres -l  # List databases
```

### **Frontend build fails**
```bash
# Clear cache
rm -rf frontend/node_modules frontend/.next
npm install
npm run build
```

### **Services not connecting**
```bash
# Check ports
lsof -i :8000  # Backend
lsof -i :3001  # API
lsof -i :3000  # Frontend

# Check env variables
cat backend/.env
cat api/.env
```

---

## 📊 Architecture

```
┌─────────────────────────────────────┐
│  Frontend (Next.js)                 │
│  http://localhost:3000              │
└──────────────┬──────────────────────┘
               │
        ┌──────┴───────┐
        │              │
        v              v
┌────────────────┐  ┌──────────────────┐
│ Backend        │  │ API Server       │
│ FastAPI        │  │ Express.js       │
│ :8000          │  │ :3001            │
└────────┬───────┘  └────────┬─────────┘
         │                   │
    ┌────┴───────────────────┴────┐
    │                             │
    v                             v
┌──────────────┐         ┌─────────────────┐
│ PostgreSQL   │         │ Redis           │
│ :5432        │         │ :6379           │
└──────────────┘         └─────────────────┘
```

---

## 📈 Performance

- ⚡ **Frontend:** Optimized with SWR, image optimization, code splitting
- 🚀 **Backend:** Async/await, connection pooling, caching
- 💾 **Database:** Indexes, query optimization, connection limits
- 🔄 **Services:** Load balancing, health checks, auto-restart

---

## 🔐 Security

- 🔑 JWT authentication
- 🛡️ CORS protection
- 🔒 Password hashing (bcrypt)
- 📝 Input validation (Pydantic)
- 🚨 Rate limiting
- 🔐 HTTPS (production)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature/name`
5. Submit pull request

---

## 📄 License

MIT License - see LICENSE file for details

---

## 📞 Support

- **Issues:** GitHub Issues
- **Discussions:** GitHub Discussions
- **Email:** support@lumina.dev

---

## 🎉 Quick Links

- 🚀 [Deploy Now](DEPLOY_QUICK_START.md)
- 📖 [Full Documentation](DEPLOYMENT.md)
- 💻 [Local Setup](LOCAL_SETUP.md)
- 🐳 [Docker Compose](docker-compose.yml)

---

**Ready to deploy? Start here:** [DEPLOY_QUICK_START.md](DEPLOY_QUICK_START.md)
