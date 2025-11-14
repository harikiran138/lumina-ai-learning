# Production Environment Variables Reference

This file documents all environment variables used across the Lumina AI Learning platform.

## Frontend Environment Variables

### `frontend/.env.local` (Local Development)

```bash
# API Endpoints
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# Analytics (optional)
NEXT_PUBLIC_ANALYTICS_ID=

# Feature flags
NEXT_PUBLIC_ENABLE_GAMIFICATION=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_REAL_TIME=true
```

### `frontend/.env.production` (Vercel)

```bash
# Production URLs (set in Vercel dashboard)
NEXT_PUBLIC_API_URL=https://lumina-api.up.railway.app
NEXT_PUBLIC_BACKEND_URL=https://lumina-ai-backend.onrender.com

# Analytics
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id

# Feature flags (can be toggled)
NEXT_PUBLIC_ENABLE_GAMIFICATION=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_REAL_TIME=true
```

---

## Backend Environment Variables

### `backend/.env.example` → `backend/.env`

```bash
# Database Configuration
DATABASE_URL=sqlite:///./lumina_local_dev.db
# Production: postgresql://user:password@db-host:5432/lumina

# Redis Configuration
REDIS_URL=redis://localhost:6379/0
# Production: redis://:password@redis-host:6379

# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=false
LOG_LEVEL=INFO

# Security
JWT_SECRET=your-super-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
CORS_ORIGINS=["http://localhost:3000","http://localhost:3001"]
# Production: ["https://lumina.vercel.app","https://lumina-ai-backend.onrender.com"]

# OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Email Service (optional)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SENDER_EMAIL=

# OpenTelemetry (optional)
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
OTEL_SERVICE_NAME=lumina-backend
OTEL_ENABLED=false

# ML Configuration
ML_MODEL_PATH=./models
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
USE_GPU=false

# Feature Flags
ENABLE_VECTOR_SEARCH=true
ENABLE_ML_MODELS=false  # Set to false in quick dev mode
ENABLE_WEBSOCKETS=false  # Set to false in quick dev mode
ENABLE_ANALYTICS=true

# Monitoring
PROMETHEUS_ENABLED=false
GRAFANA_ENABLED=false

# API Keys (add as needed)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
COHERE_API_KEY=
```

---

## API Server Environment Variables

### `api/.env.example` → `api/.env`

```bash
# Server
PORT=3001
NODE_ENV=development
DEBUG=false

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=lumina
DB_SSL=false
# Production: DB_SSL=true

# Connection Pool
DB_MIN_POOL=2
DB_MAX_POOL=10

# Security
JWT_SECRET=your-super-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Password
PASSWORD_MIN_LENGTH=8
PASSWORD_HASH_ROUNDS=10

# CORS
CORS_ORIGIN=http://localhost:3000
# Production: CORS_ORIGIN=https://lumina.vercel.app

# API Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# Feature Flags
ENABLE_REGISTRATION=true
ENABLE_SOCIAL_LOGIN=false

# Monitoring
ENABLE_REQUEST_LOGGING=true
ENABLE_METRICS=false

# Cache (Redis)
REDIS_URL=redis://localhost:6379/1
CACHE_TTL_SECONDS=3600
```

---

## Streak Service Environment Variables

### `streak-service/.env.example` → `streak-service/.env`

```bash
# Server
HOST=0.0.0.0
PORT=8001
DEBUG=false

# Redis
REDIS_URL=redis://localhost:6379/0
# Production: redis://:password@redis-host:6379/0

# Configuration
STREAK_RESET_HOUR=0  # UTC hour to reset streaks
LEADERBOARD_SIZE=100
CACHE_TTL_SECONDS=3600

# Feature Flags
ENABLE_GAMIFICATION=true
ENABLE_NOTIFICATIONS=false
```

---

## Production Deployment Settings

### Render.com Backend Deployment

Add these to Render environment:

```
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<database>
REDIS_URL=redis://<auth>@<host>:6379
JWT_SECRET=<generate-new-secret>
DEBUG=false
LOG_LEVEL=INFO
PORT=8000
CORS_ORIGINS=["https://lumina.vercel.app"]
PYTHONUNBUFFERED=1
```

### Railway.app API Deployment

```
PORT=3001
NODE_ENV=production
DB_HOST=<railway-postgresql-host>
DB_PORT=5432
DB_USER=<user>
DB_PASSWORD=<password>
DB_NAME=lumina
JWT_SECRET=<generate-new-secret>
CORS_ORIGIN=https://lumina.vercel.app
REDIS_URL=redis://<upstash-redis-url>
```

### Vercel Frontend Deployment

```
NEXT_PUBLIC_API_URL=https://lumina-api.up.railway.app
NEXT_PUBLIC_BACKEND_URL=https://lumina-ai-backend.onrender.com
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

---

## Environment Variable Generation

### Generate JWT Secret

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Python
python3 -c "import secrets; print(secrets.token_hex(32))"

# OpenSSL
openssl rand -hex 32
```

### Generate Database Password

```bash
# Strong random password
openssl rand -base64 32

# Or use
python3 -c "import secrets; print(secrets.token_urlsafe(24))"
```

---

## Environment Variable Priority

1. **Local Development**: Read from `.env` file
2. **Docker**: From `docker-compose.yml` environment section
3. **Production**: From platform dashboard (Vercel, Render, Railway)
4. **Fallback**: Hardcoded defaults in code

---

## Sensitive Variables

⚠️ **Never commit these to git:**
- `JWT_SECRET`
- `DB_PASSWORD`
- `API_KEYS`
- `SMTP_PASSWORD`
- Database credentials

Use `.env` files (in `.gitignore`) or platform secrets management.

---

## Database Connection Strings

### SQLite (Local Development)
```
sqlite:///./database.db
sqlite:////absolute/path/to/database.db
```

### PostgreSQL (Production)
```
postgresql://user:password@localhost:5432/database
postgresql://user:password@host:5432/database?sslmode=require
```

### PostgreSQL (Render)
```
postgresql://lumina:password@dpg-xxxxx-a.oregon-postgres.render.com:5432/lumina
```

---

## Redis Connection Strings

### Local
```
redis://localhost:6379/0
redis://:password@localhost:6379/0
```

### Upstash (Production)
```
redis://<token>@<host>.upstash.io:6379
redis://<token>@<host>.upstash.io:6379?ssl_certfile=<path>
```

---

## Verifying Environment Variables

### In Frontend
```javascript
// Check in browser console
console.log(process.env.NEXT_PUBLIC_API_URL)
```

### In Backend
```python
import os
print(os.environ.get('DATABASE_URL'))
```

### In API Server
```javascript
console.log(process.env.DB_HOST)
```

---

## Troubleshooting Environment Issues

### Variables not loading
```bash
# Check if .env file exists
ls -la backend/.env

# Check content
cat backend/.env

# Source manually
source backend/.env
echo $DATABASE_URL
```

### Different values in production
```bash
# Check Render environment
curl https://api.render.com/v1/services/<service-id> \
  -H "authorization: Bearer $RENDER_API_KEY"

# Check Vercel environment
vercel env list

# Check Railway environment
railway run env
```

### Default values not working
```bash
# Explicitly set in code:
DATABASE_URL = os.environ.get('DATABASE_URL', 'sqlite:///./lumina_local_dev.db')

# Or in .env file:
DATABASE_URL=sqlite:///./lumina_local_dev.db
```

---

## Example Complete Configuration

### Minimal Working Setup

**backend/.env**
```
DATABASE_URL=sqlite:///./lumina_local_dev.db
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-secret-key
CORS_ORIGINS=["http://localhost:3000"]
DEBUG=true
LOG_LEVEL=DEBUG
```

**api/.env**
```
PORT=3001
DB_HOST=localhost
DB_NAME=lumina
JWT_SECRET=dev-secret-key
CORS_ORIGIN=http://localhost:3000
```

**frontend/.env.local**
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

---

## Production Checklist

- [ ] Generate new JWT secrets
- [ ] Set strong database passwords
- [ ] Configure Redis with auth
- [ ] Enable HTTPS/SSL
- [ ] Set CORS to production domains only
- [ ] Disable debug mode
- [ ] Set LOG_LEVEL to INFO
- [ ] Configure monitoring/alerts
- [ ] Test database backups
- [ ] Test secret rotation
- [ ] Verify all endpoints respond with 200 OK

---

**Last Updated:** 2024
**For deployment help:** See [DEPLOYMENT.md](DEPLOYMENT.md)
