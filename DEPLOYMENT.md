# 🚀 Complete Deployment Guide - Lumina AI Learning

## **Architecture Overview**

```
┌─────────────────────────────────────┐
│  Frontend (Vercel)                  │
│  https://lumina.vercel.app          │
│  Next.js, React, Tailwind           │
└──────────────┬──────────────────────┘
               │
        ┌──────┴───────┐
        │              │
        v              v
┌────────────────┐  ┌──────────────────┐
│ Backend        │  │ API Server       │
│ (Render.com)   │  │ (Railway.app)    │
│ :8000          │  │ :3000            │
└────────┬───────┘  └────────┬─────────┘
         │                   │
    ┌────┴───────────────────┴────┐
    │                             │
    v                             v
┌──────────────┐         ┌─────────────────┐
│ PostgreSQL   │         │ Redis (Upstash) │
│ (Render)     │         │ Serverless      │
└──────────────┘         └─────────────────┘
```

---

## **Quick Deploy (5 minutes)**

### **Step 1: Deploy Frontend to Vercel**

```bash
# Navigate to project root
cd /Users/chepuriharikiran/Desktop/github/lumina-ai-learning

# Push latest code to GitHub
git add .
git commit -m "Ready for deployment"
git push origin main

# Open Vercel and import project
# https://vercel.com/new
```

**In Vercel Dashboard:**
1. Click "Add New" → "Project"
2. Select your GitHub repo
3. Configure:
   - **Framework**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
4. Add Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://api.yourcompany.com
   NEXT_PUBLIC_BACKEND_URL=https://backend.yourcompany.com
   ```
5. Click "Deploy"

**Result:** Your frontend is live at `https://lumina-ai-learning.vercel.app` ✅

---

### **Step 2: Deploy Backend to Render**

**In Render Dashboard (https://render.com):**

1. Click "New +" → "Web Service"
2. Connect your GitHub repo
3. Configure:
   - **Name**: `lumina-ai-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3.14`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port 8000`

4. Add Environment Variables:
   ```
   DATABASE_URL=postgresql://[from Render PostgreSQL addon]
   REDIS_URL=redis://[from Upstash Redis]
   JWT_SECRET=your-random-secret-key
   OLLAMA_BASE_URL=http://localhost:11434
   ```

5. Under "Plan", select "Free" tier
6. Click "Create Web Service"

**Result:** Backend deployed at `https://lumina-ai-backend.onrender.com` ✅

---

### **Step 3: Deploy API Server to Railway**

**In Railway Dashboard (https://railway.app):**

1. Click "New Project" → "GitHub Repo"
2. Select your repository
3. In "Services", add "GitHub Service"
4. Configure:
   - **Root Directory**: `api`
   - **Start Command**: `node server.js`

5. Add Environment Variables:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=lumina
   DB_USER=postgres
   DB_PASSWORD=your-password
   JWT_SECRET=your-secret
   ```

6. Click "Deploy"

**Result:** API at `https://your-railway-app.up.railway.app` ✅

---

## **Automated Deployment with GitHub Actions**

Once you've connected services to GitHub, edit deployment scripts:

### **Setup Secrets in GitHub**

Go to **Settings** → **Secrets and Variables** → **Actions** and add:

```
VERCEL_ORG_ID         # From Vercel account settings
VERCEL_PROJECT_ID     # From Vercel project
VERCEL_TOKEN          # From Vercel account settings

RENDER_API_KEY        # From Render account
RENDER_BACKEND_SERVICE_ID  # From Render service details
```

### **Auto-Deploy on Push**

The GitHub Actions workflows are already configured in `.github/workflows/`:
- `deploy-frontend.yml` — Auto-deploys frontend to Vercel on push to main
- `deploy-backend.yml` — Auto-deploys backend to Render on push to main

Just push to GitHub and watch the magic:

```bash
git add .
git commit -m "Update feature"
git push origin main

# Check GitHub Actions tab to see deployments in progress
```

---

## **Database Setup**

### **PostgreSQL (Render)**

1. In Render Dashboard, create "PostgreSQL" service
2. Copy the connection string
3. Add to backend env:
   ```
   DATABASE_URL=postgresql://user:pass@host:5432/lumina
   ```
4. Run migrations:
   ```bash
   python -m alembic upgrade head
   ```

### **Redis (Upstash)**

1. Go to https://upstash.com
2. Create new database (Serverless Redis)
3. Copy connection string
4. Add to backend env:
   ```
   REDIS_URL=redis://user:pass@host:port
   ```

---

## **Production Environment Variables**

### **Backend (.env)**
```
# Database
DATABASE_URL=postgresql://user:pass@db.onrender.com:5432/lumina

# Redis
REDIS_URL=redis://user:pass@upstash.io:port

# Security
JWT_SECRET=generate-a-random-secret
SECRET_KEY=another-random-key

# API Settings
API_HOST=0.0.0.0
API_PORT=8000

# CORS
CORS_ORIGINS=["https://lumina.vercel.app", "https://yourcompany.com"]

# Optional: LLM
OLLAMA_BASE_URL=http://localhost:11434
```

### **API Server (.env)**
```
PORT=3000
DB_HOST=db.onrender.com
DB_PORT=5432
DB_NAME=lumina
DB_USER=postgres
DB_PASSWORD=strong-password
JWT_SECRET=same-as-backend
```

### **Frontend (.env.production)**
```
NEXT_PUBLIC_API_URL=https://api.onrender.com
NEXT_PUBLIC_BACKEND_URL=https://backend.onrender.com
```

---

## **Health Checks**

Once deployed, verify everything works:

```bash
# Frontend
curl https://lumina.vercel.app

# Backend
curl https://lumina-ai-backend.onrender.com/health

# API Server
curl https://your-railway-api.up.railway.app/api/health

# Check CORS
curl -H "Origin: https://lumina.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     https://lumina-ai-backend.onrender.com/health
```

---

## **Scaling & Optimization**

### **Reduce Cold Start Time (Render)**
```dockerfile
# Use lighter Python image
FROM python:3.14-slim

# Pre-install common packages
RUN pip install --no-cache-dir gunicorn
```

### **Enable Caching (Vercel)**
Add to `frontend/next.config.js`:
```javascript
module.exports = {
  images: {
    unoptimized: true, // for static export
  },
  swcMinify: true,
};
```

### **Database Connection Pooling**
Add to backend requirements:
```
pgbouncer==1.18.0
```

---

## **Troubleshooting Deployments**

### **Vercel Build Fails**
```bash
# Test build locally first
cd frontend
npm run build

# Check node_modules
rm -rf node_modules package-lock.json
npm install
npm run build
```

### **Render Backend Times Out**
```bash
# Check logs
# In Render dashboard: Logs tab

# Common issues:
# - Database not initialized
# - Missing environment variables
# - Python version mismatch
```

### **Railway API Server Can't Connect to DB**
```bash
# Add database service to Railway project
# In Railway: "Create Service" → "PostgreSQL"

# Update DB_HOST to internal Railway hostname
DB_HOST=postgres  # Railway service name
```

---

## **Cost Breakdown (Monthly)**

| Service | Free Tier | Minimum Cost |
|---------|-----------|--------------|
| Vercel | 100GB bandwidth | $0 (free tier good for dev) |
| Render | 750 hours | $0 (free tier) or $7 |
| Railway | $5 credit | $5-20 |
| Upstash Redis | 10K commands/day | $0-2 |
| **Total** | **$0-5/month** | **$15-40/month** |

---

## **One-Command Deploy**

To make it even easier, create a deploy script:

```bash
#!/bin/bash
set -e

echo "🚀 Deploying Lumina AI Learning..."

# Build
cd frontend && npm run build && cd ..
cd backend && pip install -r requirements.txt && cd ..

# Deploy (requires CLI tools installed)
cd frontend && vercel --prod && cd ..

echo "✅ Deployment complete!"
```

Save as `quick-deploy.sh` and run:
```bash
chmod +x quick-deploy.sh
./quick-deploy.sh
```

---

## **Useful Resources**

- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs
- **Railway Docs**: https://docs.railway.app
- **Upstash Docs**: https://upstash.com/docs
- **GitHub Actions**: https://github.com/features/actions

---

## **Next Steps**

1. ✅ Deploy frontend to Vercel
2. ✅ Deploy backend to Render
3. ✅ Set up database
4. ✅ Configure environment variables
5. ✅ Test all endpoints
6. ✅ Monitor logs
7. ✅ Set up domain (optional)

**Your app is production-ready! 🎉**
