# Local Development Setup Guide

## Quick Start

### Prerequisites
- Python 3.8+ installed
- Node.js 18+ installed
- Supabase project (recommended) or local JSON fallback store
- Redis running on `localhost:6379` (optional, for caching)

### One-Command Startup

```bash
./run_local.sh
```

This will:
1. Check all dependencies
2. Install Python packages (if needed)
3. Install Node packages (if needed)
4. Start backend on port 8000
5. Start frontend on port 3000

### Manual Startup

#### Backend Only
```bash
./start_backend.sh
```

#### Frontend Only
```bash
./start_frontend.sh
```

## Environment Setup

### 1. Configure Environment Variables

Copy and edit the `.env` file:
```bash
cp .env.example .env
nano .env
```

Required variables:
```bash
# Gemini API (for AI features)
GEMINI_API_KEY=your_api_key_here

# Supabase (recommended for persistence)
SUPABASE_URL=https://<project-id>.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional local store (skip Supabase for dev/tests)
LUMINA_FORCE_LOCAL_STORE=false

# Cache (optional)
REDIS_URL=redis://localhost:6379/0
```

### 2. Install Dependencies

#### Backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

#### Frontend
```bash
cd frontend/web
npm install
```

## Database Setup

### Option 1: Use Supabase (Recommended)

Set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in `.env`.

### Option 2: Local JSON Store (Limited Functionality)

Set `LUMINA_FORCE_LOCAL_STORE=true` to use `backend/data/local_db.json` and
`backend/data/personalization_store.json` for persistence.

### Option 3: Redis Only (Optional)

Redis is still optional for caching and background jobs.

## Accessing the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## Development Workflow

### Running Tests

#### Backend Tests
```bash
cd backend
pytest tests/ -v
```

#### Frontend Tests
```bash
cd frontend/web
npm test
```

### Code Quality

#### Backend Linting
```bash
cd backend
flake8 app/ --max-line-length=120
```

#### Frontend Linting
```bash
cd frontend/web
npm run lint
```

## Troubleshooting

### Backend won't start

**Error**: `ModuleNotFoundError`
```bash
cd backend
source .venv/bin/activate
pip install -r requirements.txt
```

**Error**: `Connection refused` (Supabase/Redis)
- Check Supabase credentials in `.env`
- Ensure Redis is running: `redis-cli ping`

### Frontend won't start

**Error**: `Module not found`
```bash
cd frontend/web
rm -rf node_modules package-lock.json
npm install
```

**Error**: `Port 3000 already in use`
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Slow Performance

1. **Use Gemini API** instead of local models (already configured)
2. **Disable heavy features** in development:
   - OCR processing
   - Large embeddings
3. **Clear cache**:
   ```bash
   redis-cli FLUSHALL
   ```

## Performance Optimization Tips

### Backend
- Use Gemini API (fast, no local GPU needed)
- Enable Redis caching
- Use connection pooling

### Frontend
- Run `npm run build` to test production build
- Use React DevTools to find slow components
- Enable Next.js Fast Refresh

## Stopping Services

Press `Ctrl+C` in the terminal running `run_local.sh`, or:

```bash
# Kill backend
lsof -ti:8000 | xargs kill -9

# Kill frontend
lsof -ti:3000 | xargs kill -9
```

## Next Steps

1. ✅ Start the application: `./run_local.sh`
2. ✅ Open browser to http://localhost:3000
3. ✅ Check API docs at http://localhost:8000/docs
4. ✅ Run tests to verify everything works
5. ✅ Start building features!

## Need Help?

- Check logs in terminal
- Visit API docs for endpoint details
- Run health check: `curl http://localhost:8000/health`
