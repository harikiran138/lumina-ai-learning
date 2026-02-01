# Local Development Setup Guide

## Quick Start

### Prerequisites
- Python 3.8+ installed
- Node.js 18+ installed
- MongoDB running on `localhost:27017` (optional, for full functionality)
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

# Database (optional for basic features)
MONGODB_URI=mongodb://localhost:27017/lumina_db
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

### Option 1: Use Docker for Databases Only (Recommended)

```bash
# Start only database services
docker-compose up -d db redis mongo
```

### Option 2: Install Locally (macOS)

```bash
# Install via Homebrew
brew install mongodb-community redis

# Start services
brew services start mongodb-community
brew services start redis
```

### Option 3: Skip Databases (Limited Functionality)

The app will start without databases but some features won't work:
- User authentication
- Course persistence
- Chat history

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

**Error**: `Connection refused` (MongoDB/Redis)
- Check if services are running: `mongosh` or `redis-cli ping`
- Or start with Docker: `docker-compose up -d db redis mongo`

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
