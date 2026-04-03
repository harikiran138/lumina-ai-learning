import subprocess
import os

def add_env(key, value, project_dir):
    print(f"Adding {key} to {project_dir}...")
    # Remove if exists to prevent error
    subprocess.run(["npx", "vercel", "env", "rm", key, "production", "preview", "development", "-y"], cwd=project_dir, capture_output=True)
    
    # Try adding to production
    process = subprocess.Popen(["npx", "vercel", "env", "add", key, "production"], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, cwd=project_dir, text=True)
    process.communicate(input=value)

    # Try adding to preview
    process = subprocess.Popen(["npx", "vercel", "env", "add", key, "preview"], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, cwd=project_dir, text=True)
    process.communicate(input=value)

    # Try adding to development
    process = subprocess.Popen(["npx", "vercel", "env", "add", key, "development"], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, cwd=project_dir, text=True)
    process.communicate(input=value)

# Frontend Variables
FRONTEND_VARS = {
    "NEXT_PUBLIC_SUPABASE_URL": "https://odyjksznsdeyweylovzl.supabase.co",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9keWprc3puc2RleXdleWxvdnpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NTA1MjEsImV4cCI6MjA4ODUyNjUyMX0.cEz3pxnk2o7YcUe3fPgKdnKmnkqFivoImoEzT9KsZTM",
    "NEXT_PUBLIC_API_URL": "https://lumina-backend.onrender.com/api",
    "NEXT_PUBLIC_AUTH_URL": "https://lumina-backend.onrender.com/api",
    "NEXT_PUBLIC_IS_PROTOTYPE": "false",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9keWprc3puc2RleXdleWxvdnpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NTA1MjEsImV4cCI6MjA4ODUyNjUyMX0.cEz3pxnk2o7YcUe3fPgKdnKmnkqFivoImoEzT9KsZTM",
    "NEXT_PUBLIC_TUTOR_PROVIDER": "gemini"
}

# Backend Variables
BACKEND_VARS = {
    "SUPABASE_URL": "https://odyjksznsdeyweylovzl.supabase.co",
    "SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9keWprc3puc2RleXdleWxvdnpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NTA1MjEsImV4cCI6MjA4ODUyNjUyMX0.cEz3pxnk2o7YcUe3fPgKdnKmnkqFivoImoEzT9KsZTM",
    "SUPABASE_SERVICE_ROLE_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9keWprc3puc2RleXdleWxvdnpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjk1MDUyMSwiZXhwIjoyMDg4NTI2NTIxfQ.62ne3wo7p-quLUa70p_9-R45MmwuTzu8lQleDgO2Q34",
    "DATABASE_URL": "postgresql://postgres:Lumin%40138800@db.odyjksznsdeyweylovzl.supabase.co:5432/postgres",
    "GEMINI_API_KEY": "AIzaSyBy3dg5S_RoDoqrUS7DFYquYNnEoj_AM1Qc",
    "JWT_SECRET": "supersecretjwtkey_lumina138800",
    "SECRET_KEY": "supersecretkey_lumina138800",
    "REDACT_PII_LOGS": "true",
    "ENVIRONMENT": "production",
    "FRONTEND_URL": "https://lumina-ai.vercel.app",
    "PORT": "8000",
    "DEBUG": "false",
    "REDIS_URL": "redis://localhost:6379"
}

frontend_dir = os.path.abspath("frontend/web")
backend_dir = os.path.abspath("backend")

for k, v in FRONTEND_VARS.items():
    add_env(k, v, frontend_dir)

for k, v in BACKEND_VARS.items():
    add_env(k, v, backend_dir)

print("All environment variables exported successfully.")
