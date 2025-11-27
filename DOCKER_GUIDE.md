# 🐳 Lumina Docker Complete Guide

## 🎯 What You Get with Docker

Running Lumina in Docker gives you:
- ✅ **PostgreSQL Database** - Fully configured and persistent
- ✅ **Next.js Application** - Golden Yellow & Black theme
- ✅ **Prisma Studio** - Database GUI at port 5555
- ✅ **Isolated Environment** - No local PostgreSQL installation needed
- ✅ **One-Command Setup** - Everything configured automatically
- ✅ **20+ Users** - Pre-loaded with realistic data
- ✅ **Easy Customization** - Change colors, add data instantly

---

## 🚀 Quick Start (3 Steps)

### Step 1: Install Docker
```bash
# Download Docker Desktop from:
https://www.docker.com/products/docker-desktop

# After installation, start Docker Desktop
```

### Step 2: Run Setup Script
```bash
./docker-setup.sh
```

This single command will:
1. Check Docker installation
2. Build application images
3. Start PostgreSQL database
4. Run database migrations
5. Seed with 20+ active users
6. Start the application
7. Launch Prisma Studio

### Step 3: Open Browser
```
Application:   http://localhost:1234
Database GUI:  http://localhost:5555
```

**That's it! Your platform is running! 🎉**

---

## 📋 What's Running?

After `docker-setup.sh` completes, you have 3 containers:

| Container | Port | Purpose |
|-----------|------|---------|
| `lumina-postgres` | 5432 | PostgreSQL 14 database |
| `lumina-app` | 3000 | Next.js application |
| `lumina-prisma-studio` | 5555 | Database management GUI |

---

## 🗄️ Database Credentials

**Connection Details:**
```
Host:     localhost
Port:     5432
Database: lumina_db
User:     lumina_user
Password: lumina_secure_password_123
```

**Connection String:**
```
postgresql://lumina_user:lumina_secure_password_123@localhost:5432/lumina_db
```

---

## 👤 Login Credentials

After running `docker-setup.sh`, you can login with:

```
Admin Account:
  Email:    admin@lumina.ai
  Password: password123

Teacher Account:
  Email:    teacher@lumina.ai
  Password: password123

Student Account:  
  Email:    student@lumina.ai
  Password: password123

Plus 17+ more realistic users!
```

---

## 🛠️ Docker Commands

### Start Everything
```bash
./docker-setup.sh
```

### Stop Everything
```bash
docker-compose down
```

### View Logs
```bash
# All containers
docker-compose logs -f

# Just the app
docker-compose logs -f app

# Just the database
docker-compose logs -f postgres
```

### Restart Containers
```bash
# Restart all
docker-compose restart

# Restart just the app
docker-compose restart app
```

### View Running Containers
```bash
docker-compose ps
```

### Access Container Shell
```bash
# App container
docker-compose exec app sh

# Database container
docker-compose exec postgres psql -U lumina_user -d lumina_db
```

---

## 📊 Add More Data

Want even more users and projects?

```bash
./add-more-data.sh
```

This adds:
- 10 more users (DevOps, Cloud, Security, etc.)
- 3 more projects (Kubernetes, Cloud Native, DeFi)
- 5+ more tasks
- Additional notifications

**Total after running:** 30+ users, 8+ projects, 25+ tasks!

---

## 🎨 Customize Colors

Change the theme instantly:

```bash
./customize-colors.sh
```

Choose from 8 presets:
1. Golden Yellow & Black (current)
2. Royal Blue & Navy
3. Purple & Dark Gray
4. Ruby Red & Black
5. Emerald Green & Black
6. Sunset Orange & Navy
7. Cyan & Dark Blue
8. Custom colors (enter your own)

After customizing:
```bash
docker-compose restart app
```

---

## 🔍 Understanding the Theme

### Current: Golden Yellow & Black

**Colors:**
- **Primary:** `#FFD700` (Golden Yellow)
- **Secondary:** `#FDB931` (Bright Gold)
- **Accent:** `#FAFAD2` (Light Golden)
- **Dark:** `#000000` (Pure Black)
- **Dark Light:** `#1a1a1a` (Almost Black)

**Visual Elements:**
- ✨ Golden glow effects on buttons
- 🪟 Black glass cards with golden borders
- 🌟 Golden gradient text
- ⚫ Pure black backgrounds
- 💫 Golden particle animations

**Where It's Used:**
- Navigation & headers
- Buttons & CTAs
- Status indicators (agents)
- Cards & modals
- Text highlights

---

## 📦 Docker Files Explained

### `Dockerfile`
Multi-stage build for production:
1. **deps** - Install dependencies
2. **builder** - Build Next.js app
3. **runner** - Minimal production image

### `docker-compose.yml`
Orchestrates 3 services:
- **postgres** - Database with health checks
- **app** - Next.js application
- **prisma-studio** - Database GUI

### `.dockerignore`
Excludes unnecessary files from build:
- node_modules
- .next
- Legacy folders

---

## 🧪 Testing Your Setup

### 1. Check Database Connection
```bash
curl http://localhost:1234/api/db/test
```

Expected:
```json
{
  "status": "connected",
  "stats": {
    "users": 20+,
    "agents": 6,
    "tasks": 20+
  }
}
```

### 2. View AI Agents
```bash
curl http://localhost:1234/api/agents
```

Should return 6 specialized agents.

### 3. Test Login
```bash
curl -X POST http://localhost:1234/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lumina.ai","password":"password123"}'
```

Should return JWT token.

### 4. View Data in Prisma Studio
Visit: http://localhost:5555

Browse all tables visually!

---

## 🔧 Advanced Operations

### Rebuild Everything
```bash
docker-compose down -v  # ⚠️ Deletes database!
docker-compose build --no-cache
docker-compose up -d
```

### Database Operations

**Backup Database:**
```bash
docker-compose exec postgres pg_dump -U lumina_user lumina_db > backup.sql
```

**Restore Database:**
```bash
docker-compose exec -T postgres psql -U lumina_user lumina_db < backup.sql
```

**Reset Database:**
```bash
docker-compose exec app npx prisma db push --force-reset
docker-compose exec app npx prisma db seed
```

### View Database Schema
```bash
docker-compose exec postgres psql -U lumina_user -d lumina_db -c "\dt"
```

### Execute SQL
```bash
docker-compose exec postgres psql -U lumina_user -d lumina_db -c "SELECT * FROM \"user\" LIMIT 5;"
```

---

## 📊 Container Resource Usage

Check resource usage:
```bash
docker stats
```

Shows CPU, memory, network for each container.

---

## 🐛 Troubleshooting

### Port Already in Use

**Error:** `port 1234 is already allocated`

**Solution:**
```bash
# Find what's using the port
lsof -i :1234

# Kill the process
kill -9 <PID>

# Or change port in docker-compose.yml
ports:
  - "3001:1234"
```

### Database Won't Start

**Check logs:**
```bash
docker-compose logs postgres
```

**Common fix:**
```bash
docker-compose down -v
docker-compose up -d postgres
```

### App Shows Error Page

**Check logs:**
```bash
docker-compose logs app
```

**Common issues:**
- Database not ready (wait 30 seconds)
- Missing environment variables
- Build failed (check build logs)

### Containers Keep Restarting

**View restart count:**
```bash
docker-compose ps
```

**Fix:**
```bash
# View logs for errors
docker-compose logs -f

# Rebuild and restart
docker-compose up -d --build
```

### Out of Disk Space

**Clean unused Docker data:**
```bash
docker system prune -a
```

### Can't Connect to Database

**From outside Docker:**
```bash
psql -h localhost -p 5432 -U lumina_user -d lumina_db
```

**From inside app container:**
```bash
docker-compose exec app npx prisma studio
```

---

## 🌟 Production Deployment

### Environment Variables

For production, change these in `docker-compose.yml`:

```yaml
environment:
  DATABASE_URL: ${DATABASE_URL}  # Use external DB
  JWT_SECRET: ${JWT_SECRET}  # From secrets manager
  NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
  NEXTAUTH_URL: https://your-domain.com
  NODE_ENV: production
```

### Use External Database

Replace postgres service:
```yaml
environment:
  DATABASE_URL: postgresql://user:pass@your-db-host:5432/db
```

### SSL/HTTPS

Use nginx or Caddy reverse proxy:
```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
```

---

## 📁 Folder Structure inside Docker

```
/app/
├── .next/          # Built application
├── node_modules/   # Dependencies
├── prisma/         # Database schema & migrations
├── public/         # Static files
├── src/            # Source code
└── package.json    # Package manifest
```

---

## 🎯 Common Workflows

### Daily Development
```bash
# Start
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop
docker-compose down
```

### Make Code Changes
Code hot-reloads automatically! Just save and refresh browser.

### Database Changes
```bash
# Edit prisma/schema.prisma
# Then:
docker-compose exec app npx prisma db push
docker-compose exec app npx prisma generate
docker-compose restart app
```

### Add New Package
```bash
# Edit package.json, then:
docker-compose down
docker-compose build --no-cache app
docker-compose up -d
```

---

## ✅ Success Indicators

You know everything is working when:

- ✅ `docker-compose ps` shows all containers "Up"
- ✅ http://localhost:1234 loads with golden theme
- ✅ http://localhost:5555 shows Prisma Studio
- ✅ `/api/db/test` returns connection status
- ✅ Can login with default credentials
- ✅ AI agents are visible
- ✅ Database has 20+ users

---

## 📞 Quick Reference

```bash
# Setup (first time)
./docker-setup.sh

# Start
docker-compose up -d

# Stop
docker-compose down

# Logs
docker-compose logs -f app

# Restart
docker-compose restart

# Add data
./add-more-data.sh

# Change colors
./customize-colors.sh

# Database GUI
http://localhost:5555

# App
http://localhost:1234
```

---

## 🎉 You're All Set!

Your Lumina AI Platform is now running in Docker with:

- ✨ Golden Yellow & Black premium theme
- 🗄️ PostgreSQL database with 20+ active users
- 🤖 6 specialized AI agents
- 📁 5+ realistic projects
- 📋 20+ active tasks
- 💬 30+ chat conversations
- 🎨 Easy color customization
- 📊 Database GUI (Prisma Studio)
- 🐳 Fully containerized & portable

**Start exploring: http://localhost:1234**

**Need help? Check the docs:**
- `QUICK_REFERENCE.md` - Commands
- `GOLDEN_THEME_UPDATE.md` - Theme guide
- `.agent/SETUP_GUIDE.md` - Full guide

**Happy coding! 🚀**
