# 🚀 Deploy Lumina AI Learning - Quick Start

This guide walks you through deploying Lumina AI Learning to production in **under 10 minutes**.

## **Prerequisites**

- GitHub account (repository connected)
- Vercel account (free)
- Render account (free)
- Railway account (free, $5 credit)

## **3-Step Deployment**

### **Step 1️⃣: Make Scripts Executable**

```bash
chmod +x /Users/chepuriharikiran/Desktop/github/lumina-ai-learning/quick-deploy.sh
chmod +x /Users/chepuriharikiran/Desktop/github/lumina-ai-learning/deploy-frontend.sh
chmod +x /Users/chepuriharikiran/Desktop/github/lumina-ai-learning/deploy-backend.sh
```

### **Step 2️⃣: Run Deployment Script**

```bash
cd /Users/chepuriharikiran/Desktop/github/lumina-ai-learning
./quick-deploy.sh
```

This will:
1. ✅ Check your tools (Node, Python, Git)
2. ✅ Install Vercel CLI
3. ✅ Commit and push changes to GitHub
4. ✅ Deploy frontend to Vercel

### **Step 3️⃣: Deploy Backend & API (Manual in Dashboards)**

After the script finishes, complete these in your browser:

**Backend on Render:**
```bash
./deploy-backend.sh
# Shows step-by-step instructions
```

**API on Railway:**
```bash
./deploy-api.sh
# Shows step-by-step instructions
```

---

## **Detailed Instructions**

### **Deploy Frontend to Vercel**

**Automatic (fastest):**
```bash
./deploy-frontend.sh
```

**Manual (if script fails):**
1. Go to https://vercel.com
2. Click "Add New" → "Project"
3. Select your GitHub repo
4. Set **Root Directory** to `frontend`
5. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://backend.onrender.com
   NEXT_PUBLIC_BACKEND_URL=https://backend.onrender.com
   ```
6. Click "Deploy"

**Result:** Your app is live at `https://lumina.vercel.app` ✅

---

### **Deploy Backend to Render**

1. Go to https://render.com/dashboard
2. Click "New +" → "Web Service"
3. Connect GitHub & select your repo
4. Configure:
   - **Name:** `lumina-ai-backend`
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3.14`
   - **Build:** `pip install -r requirements.txt`
   - **Start:** `uvicorn main:app --host 0.0.0.0 --port 8000`

5. Add environment variables (click "Advanced"):
   ```
   DATABASE_URL=postgresql://...  (create Render PostgreSQL addon)
   REDIS_URL=redis://...          (create Upstash Redis)
   JWT_SECRET=your-random-secret
   ```

6. Select "Free" plan
7. Click "Create Web Service"

**Result:** Backend at `https://lumina-ai-backend.onrender.com` ✅

---

### **Deploy API Server to Railway**

1. Go to https://railway.app/dashboard
2. Click "New Project" → "GitHub Repo"
3. Select your repository
4. In "Services", click "Add"
5. Add "GitHub Service"
6. Configure:
   - **Root Directory:** `api`
   - **Start Command:** `node server.js`

7. Add variables:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=lumina
   DB_USER=postgres
   DB_PASSWORD=your-password
   JWT_SECRET=your-secret
   ```

8. Click "Deploy"

**Result:** API at `https://your-project.up.railway.app` ✅

---

## **Using Docker Compose (Local Testing)**

Test the full stack locally with Docker:

```bash
cd /Users/chepuriharikiran/Desktop/github/lumina-ai-learning

# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop all
docker-compose down
```

Services will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API: http://localhost:3001
- Streak: http://localhost:8001
- Database: localhost:5432
- Redis: localhost:6379

---

## **Environment Variables Checklist**

### **Vercel Frontend**
- [ ] `NEXT_PUBLIC_API_URL`
- [ ] `NEXT_PUBLIC_BACKEND_URL`

### **Render Backend**
- [ ] `DATABASE_URL`
- [ ] `REDIS_URL`
- [ ] `JWT_SECRET`
- [ ] `CORS_ORIGINS`

### **Railway API**
- [ ] `DB_HOST`
- [ ] `DB_PORT`
- [ ] `DB_NAME`
- [ ] `DB_USER`
- [ ] `DB_PASSWORD`
- [ ] `JWT_SECRET`

---

## **Verify Deployment**

```bash
# Check all services
curl https://lumina.vercel.app                      # Frontend
curl https://lumina-ai-backend.onrender.com/health  # Backend
curl https://your-api.up.railway.app/api/health     # API
```

---

## **Troubleshooting**

### **Build Fails on Vercel**
```bash
# Test locally
cd frontend
npm install
npm run build
```

### **Backend Times Out**
- Check PostgreSQL is running
- Verify DATABASE_URL is correct
- Check Render logs: Render Dashboard → Logs

### **API Can't Connect to DB**
- Make sure PostgreSQL service is added to Railway
- Use correct DB_HOST (may be `postgres` not `localhost`)

---

## **Next Steps**

1. ✅ Deployed? Visit your app at https://lumina.vercel.app
2. 📊 Monitor: Check logs in Vercel, Render, Railway dashboards
3. 🔄 Auto-deploy: Push to GitHub → automatic redeploy
4. 💾 Database: Set up backups in Render/Railway
5. 🔐 Security: Update JWT_SECRET with random key

---

## **CI/CD with GitHub Actions**

Your repository now has GitHub Actions configured:
- `.github/workflows/deploy-frontend.yml` — Auto-deploys on push
- `.github/workflows/deploy-backend.yml` — Auto-deploys backend

Check **Actions** tab in GitHub to see deployment progress.

---

## **Costs**

- **Vercel:** Free ($0/month for hobby projects)
- **Render:** Free tier ($0/month, scales to $7+)
- **Railway:** $5/month credit ($0/month if under limit)
- **Upstash Redis:** Free tier
- **Total:** **$0-5/month** 🎉

---

## **Support**

- **Vercel Docs:** https://vercel.com/docs
- **Render Docs:** https://render.com/docs
- **Railway Docs:** https://docs.railway.app

---

**Congratulations! Your app is live! 🚀**
