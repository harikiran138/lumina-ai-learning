"""
Vercel Python serverless entry point for the Lumina FastAPI backend.
Vercel looks for `handler` in this file and treats it as an ASGI app.
"""
import sys
import os

# Tell the app it is running inside Vercel (read-only FS, skip StaticFiles)
os.environ.setdefault("VERCEL", "1")

# Add the backend root to the Python path so `from app.main import app` resolves
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app  # noqa: E402

# Vercel's Python runtime picks up the variable named `handler`
handler = app
