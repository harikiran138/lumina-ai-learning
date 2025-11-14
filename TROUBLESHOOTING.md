# 🔧 Troubleshooting Guide

## Common Issues & Solutions

### Frontend Issues

#### Issue: Port 3000 already in use

```bash
# Find and kill process on port 3000
lsof -i :3000
kill -9 <PID>

# Or use a different port
cd frontend
npm run dev -- -p 3001
```

#### Issue: `npm: command not found`

```bash
# Install Node.js
# macOS
brew install node

# Ubuntu/Debian
sudo apt-get install nodejs npm

# Windows
# Download from https://nodejs.org
```

#### Issue: Module not found / dependencies missing

```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install

# If still failing, check npm cache
npm cache clean --force
npm install
```

#### Issue: Build fails with memory error

```bash
# Increase Node memory
cd frontend
NODE_OPTIONS=--max-old-space-size=4096 npm run build
```

#### Issue: Next.js dev server won't start

```bash
# Check if .next directory is corrupted
cd frontend
rm -rf .next
npm run dev

# If port is stuck
sudo lsof -i :3000 | grep node | awk '{print $2}' | xargs sudo kill -9
```

---

### Backend Issues

#### Issue: Python command not found

```bash
# Check Python installation
python3 --version
which python3

# If not installed, install it
# macOS
brew install python@3.14

# Ubuntu/Debian
sudo apt-get install python3.14
```

#### Issue: `pip: command not found`

```bash
# Upgrade pip
python3 -m pip install --upgrade pip

# Or use apt/brew
# macOS
brew install python-pip

# Ubuntu/Debian
sudo apt-get install python3-pip
```

#### Issue: ModuleNotFoundError for dependencies

```bash
# Install missing packages
cd backend
pip install -r requirements.txt

# Install specific package
pip install fastapi uvicorn

# Check what's installed
pip list
```

#### Issue: Port 8000 already in use

```bash
# Find and kill process
lsof -i :8000
kill -9 <PID>

# Or run on different port
cd backend
uvicorn main:app --port 8001
```

#### Issue: FastAPI startup errors

```bash
# Check syntax
python3 -m py_compile main.py

# Run with verbose output
python3 main.py

# Check imports
python3 -c "import services.llm_service"
```

#### Issue: Database connection failed

```bash
# Check DATABASE_URL
cat backend/.env

# Try SQLite instead
export DATABASE_URL="sqlite:///./lumina_local_dev.db"
python3 main.py

# Or check PostgreSQL is running
psql -l  # List databases
```

#### Issue: OpenTelemetry import error

```bash
# Install OpenTelemetry packages
pip install opentelemetry-api opentelemetry-sdk
pip install opentelemetry-exporter-jaeger

# Or install all in one go
cd backend
pip install -r requirements.txt
```

---

### API Server Issues

#### Issue: `node: command not found`

```bash
# Install Node.js (see Frontend section)
brew install node
```

#### Issue: Database connection error

```bash
# Check connection string in .env
cat api/.env

# Test connection manually
psql -h localhost -U postgres -l

# Or use SQLite
DATABASE_URL="sqlite:///./api.db" node server.js
```

#### Issue: JWT secret error

```bash
# Generate a new JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env
echo "JWT_SECRET=YOUR_GENERATED_SECRET" >> api/.env
```

#### Issue: CORS errors

```bash
# Frontend can't reach API - check CORS headers
curl -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  http://localhost:3001

# Check api/server.js for CORS configuration
grep -n "cors" api/server.js

# Or enable all origins for dev
# In api/server.js, change: cors() to cors({origin: '*'})
```

---

### Streak Service Issues

#### Issue: Redis connection refused

```bash
# Start Redis
# macOS
brew services start redis

# Ubuntu/Debian
sudo systemctl start redis-server

# Docker
docker run -p 6379:6379 redis:latest

# Check if running
redis-cli ping  # Should return PONG
```

#### Issue: Port 8001 already in use

```bash
# Find and kill process
lsof -i :8001
kill -9 <PID>
```

#### Issue: FastAPI startup hangs

```bash
# This is normal if waiting for Redis
# Kill it and start Redis first
redis-cli
# Then restart the service
```

---

### Docker Issues

#### Issue: Docker daemon not running

```bash
# macOS
open /Applications/Docker.app

# Ubuntu/Debian
sudo systemctl start docker

# Check status
docker ps
```

#### Issue: `docker-compose: command not found`

```bash
# Install Docker Compose
# macOS
brew install docker-compose

# Ubuntu/Debian
sudo apt-get install docker-compose

# Or use Docker Compose V2
docker compose version
```

#### Issue: Port already in use (Docker)

```bash
# Stop all containers
docker-compose down

# Or stop specific service
docker-compose stop frontend

# Force remove
docker-compose down -v
```

#### Issue: Container exits immediately

```bash
# Check logs
docker-compose logs frontend

# Or for specific service
docker logs <container_id>

# Rebuild
docker-compose build --no-cache frontend
docker-compose up frontend
```

---

### Network Issues

#### Issue: Frontend can't reach backend

```bash
# Check backend is running
curl http://localhost:8000/health

# Check CORS is enabled
curl -H "Origin: http://localhost:3000" http://localhost:8000/health

# Check next.config.js has rewrites
cat frontend/next.config.js | grep rewrites -A 5

# Verify env variables in frontend
cat frontend/.env.local
```

#### Issue: API timeout

```bash
# Increase timeout in frontend requests
# In API calls, add timeout parameter

# Or check if service is slow
curl -w "Time: %{time_total}\n" http://localhost:8000/health

# Check resource usage
top -p $(lsof -t -i :8000)
```

#### Issue: CORS blocked

```bash
# Browser console shows: "Access to XMLHttpRequest blocked by CORS"

# Solutions:
# 1. Add backend to CORS whitelist in backend/main.py
# 2. Enable CORS in API server (api/server.js)
# 3. Use proxy in frontend (next.config.js)

# Check headers
curl -i http://localhost:8000/health | grep -i cors
```

---

### Database Issues

#### Issue: Database file locked (SQLite)

```bash
# SQLite doesn't support concurrent writes well

# Solution 1: Delete and recreate
rm lumina_local_dev.db

# Solution 2: Use PostgreSQL for dev
# Install PostgreSQL
brew install postgresql

# Start PostgreSQL
brew services start postgresql

# Create database
createdb lumina

# Update DATABASE_URL
export DATABASE_URL="postgresql://localhost/lumina"
```

#### Issue: PostgreSQL connection refused

```bash
# Start PostgreSQL
brew services start postgresql
# or
sudo systemctl start postgresql

# Check if running
psql -l

# Create database
createdb lumina

# Reset password
sudo -u postgres psql
postgres=# ALTER USER postgres PASSWORD 'postgres';
```

#### Issue: Migration errors

```bash
# Alembic migration issues

# Check current revision
alembic current

# Downgrade to start fresh
alembic downgrade base

# Upgrade to latest
alembic upgrade head

# View migration history
alembic history
```

---

### Performance Issues

#### Issue: Application is slow

```bash
# Check CPU usage
top

# Check memory usage
free -h  # Linux
vm_stat  # macOS

# Check disk I/O
iostat -x 1 5  # Linux
iotop  # Linux

# Reduce workers/threads
# In backend/main.py, reduce number of workers
```

#### Issue: High memory usage

```bash
# Check which process uses memory
ps aux | sort -k4 -nr | head

# Kill memory hog
kill -9 <PID>

# Increase system memory
# Or scale down services (remove streak-service, etc.)
```

#### Issue: Build takes too long

```bash
# Frontend build slow
# Use --production flag to skip some steps
npm run build -- --stats

# Backend startup slow
# Comment out optional services in main.py
# See startup event in backend/main.py
```

---

### Authentication Issues

#### Issue: JWT token invalid/expired

```bash
# Generate new JWT secret
python3 -c "import secrets; print(secrets.token_hex(32))"

# Update .env files
export JWT_SECRET="your-new-secret"

# Clear browser cookies and login again
# (In browser: Dev Tools > Application > Cookies > Clear)
```

#### Issue: Login fails

```bash
# Check if backend is responding
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'

# Check API server login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

---

### Deployment Issues

#### Issue: Vercel deployment fails

```bash
# Check build logs
vercel logs --follow

# Local build test
vercel build

# Check environment variables
vercel env list

# Check .vercelignore
cat frontend/.vercelignore
```

#### Issue: Backend deployment to Render fails

```bash
# Check logs
# 1. Go to https://dashboard.render.com
# 2. Select service
# 3. Check "Logs" tab

# Common issues:
# - DATABASE_URL not set (add in Environment)
# - PYTHONUNBUFFERED not set
# - Port conflicts

# Render uses PORT env variable
export PORT=8000
```

#### Issue: Database connection in production

```bash
# Check connection string format
postgresql://username:password@host:5432/database

# For Render:
# Format: postgresql://username:password@host:5432/database?sslmode=require

# Test connection
psql "postgresql://..."
```

---

### Monitoring Issues

#### Issue: Prometheus not scraping

```bash
# Check prometheus.yml
cat monitoring/prometheus.yml

# Verify service endpoints
curl http://localhost:8000/metrics
curl http://localhost:3001/metrics

# Check Prometheus UI
open http://localhost:9090
```

#### Issue: OpenTelemetry spans not exported

```bash
# Check if Jaeger is running
docker run -p 16686:16686 jaegertracing/all-in-one

# Verify OTEL_EXPORTER_OTLP_ENDPOINT
echo $OTEL_EXPORTER_OTLP_ENDPOINT

# Check logs
grep -i "tracer\|telemetry" /tmp/backend.log
```

---

### Git Issues

#### Issue: Git push rejected

```bash
# Check remote
git remote -v

# Pull before push
git pull origin main

# Force push (be careful!)
git push -f origin main

# Check branch
git branch -vv
```

#### Issue: Merge conflicts

```bash
# List conflicts
git status

# View conflict
cat <conflicted-file>

# Resolve manually, then
git add <file>
git commit -m "Resolve conflicts"
git push
```

---

## Quick Diagnostic

Run this to get system info for debugging:

```bash
# Create diagnostic report
cat > diagnostic.txt << 'EOF'
=== System Info ===
$(uname -a)

=== Node ===
$(node -v)
$(npm -v)

=== Python ===
$(python3 --version)
$(pip3 --version)

=== Git ===
$(git --version)

=== Docker ===
$(docker --version 2>/dev/null || echo "Not installed")
$(docker-compose --version 2>/dev/null || echo "Not installed")

=== Services Status ===
Frontend: $(curl -s http://localhost:3000 -o /dev/null -w "%{http_code}")
Backend: $(curl -s http://localhost:8000/health -o /dev/null -w "%{http_code}")
API: $(curl -s http://localhost:3001/api/health -o /dev/null -w "%{http_code}")

=== Ports ===
$(lsof -i :3000 2>/dev/null || echo "Port 3000 free")
$(lsof -i :8000 2>/dev/null || echo "Port 8000 free")
EOF

cat diagnostic.txt
```

---

## Need More Help?

1. **Check logs**:
   - Frontend: Browser dev tools (F12)
   - Backend: `/tmp/backend.log`
   - API: Check terminal output
   - Docker: `docker-compose logs -f`

2. **Enable debug mode**:
   ```bash
   # Frontend
   DEBUG=* npm run dev
   
   # Backend
   export LOG_LEVEL=DEBUG
   python main.py
   ```

3. **Create minimal test case** to isolate issue

4. **Search existing issues** on GitHub

5. **Ask on discussions** with diagnostic info

---

## Health Check Endpoints

Verify services are running:

```bash
# Frontend
curl http://localhost:3000 -v

# Backend
curl http://localhost:8000/health -v

# API
curl http://localhost:3001/api/health -v

# Streak Service
curl http://localhost:8001/health -v
```

Expected response: `HTTP 200 OK` with JSON body.

---

**Last updated:** 2024
**For more help:** See [LOCAL_SETUP.md](LOCAL_SETUP.md) and [DEPLOYMENT.md](DEPLOYMENT.md)
