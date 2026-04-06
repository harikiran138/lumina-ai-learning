# Lumina AI Learning - Engineering Walkthrough

This guide ensures a **"Perfect LOCAL"** development experience and provides a stable path for **AWS/Staging** deployments.

## 1. Local Development Setup (Lumina Perfect LOCAL)

### Prerequisites
- **Node.js**: v20 or v22 (Use `v20.x` for strictest compatibility)
- **Python**: 3.10+ (Recommend 3.11 for performance)
- **Docker Desktop**: Must be **ON** for containerized workflows.

### Installation Strategy
To prevent dependency hell and memory crashes, always use these commands:

#### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -U pip setuptools
# Note: We use headless OpenCV to avoid graphics driver requirements locally
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### Frontend
```bash
cd frontend/web
# CRITICAL: Always use --legacy-peer-deps and increased memory
export NODE_OPTIONS=--max-old-space-size=4096
npm install --legacy-peer-deps
npm run dev
```

### Health Check Verification
Verify that the backend is alive:
`curl http://localhost:8000/health` → `{"status": "ok"}`

---

## 2. Docker & AWS/Staging Builds

Lumina is container-hardened for AWS (App Runner / ECS).

### Building Containers
```bash
# Backend Machine Learning Service
docker build -t lumina-ml ./backend -f backend/ml_services/Dockerfile

# Main Backend API
docker build -t lumina-api ./backend
```

### AWS/Staging Environment Variables
| Variable | Description | Recommended (Staging) |
|----------|-------------|-----------------------|
| `LUMINA_FORCE_REAL_DB` | Force Real Supabase DB | `1` |
| `SUPABASE_URL` | Cloud DB URL | `<your-supabase-url>` |
| `AWS_REGION` | Compute Region | `us-east-1` |
| `NODE_ENV` | Production Mode | `production` |

---

## 3. New Features (v1.1 "Perfect LOCAL")

Two powerful features have been added to the Handwritten Grading router:

1.  **Assignment Stats**: `GET /api/handwritten/assignments/stats`
    - Returns submission counts and average scores for teacher-owned assignments.
2.  **Results Export**: `GET /api/handwritten/submissions/{id}/export`
    - Provides a flat JSON export of grading results, ideal for integration with external tools like Excel or custom analytics.

---

## 4. Vercel Frontend Deployment

When deploying to Vercel, the build settings are automatically handled by the root `package.json`:

- **Build Command**: `npm run vercel-build`
- **Output Directory**: `frontend/web/.next`
- **Node.js Version**: `20.x`

> [!IMPORTANT]
> The build script now includes `NODE_OPTIONS=--max-old-space-size=4096` to prevent the "Next.js Workers Exited" crash during static page generation.
