import subprocess

ENV_VARS = {
    "SUPABASE_URL": "https://odyjksznsdeyweylovzl.supabase.co",
    "SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9keWprc3puc2RleXdleWxvdnpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NTA1MjEsImV4cCI6MjA4ODUyNjUyMX0.cEz3pxnk2o7YcUe3fPgKdnKmnkqFivoImoEzT9KsZTM",
    "SUPABASE_SERVICE_ROLE_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9keWprc3puc2RleXdleWxvdnpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjk1MDUyMSwiZXhwIjoyMDg4NTI2NTIxfQ.62ne3wo7p-quLUa70p_9-R45MmwuTzu8lQleDgO2Q34",
    "DATABASE_URL": "postgresql://postgres:Lumin%40138800@db.odyjksznsdeyweylovzl.supabase.co:5432/postgres",
    "GEMINI_API_KEY": "AIzaSyBy3dg5S_RoDoqrUS7DFYquYNnEoj_AM1Qc",
    "JWT_SECRET": "supersecretjwtkey_lumina138800",
    "SECRET_KEY": "supersecretkey_lumina138800",
    "REDACT_PII_LOGS": "true",
    "ENVIRONMENT": "development",
    "FRONTEND_URL": "http://localhost:3000",
    "PORT": "8000",
    "DEBUG": "true",
    "REDIS_URL": "redis://localhost:6379"
}

def add_env(key, value):
    print(f"Adding {key}...")
    subprocess.run(["npx", "vercel", "env", "rm", key, "production", "preview", "development", "-y"], capture_output=True)
    process = subprocess.Popen(["npx", "vercel", "env", "add", key, "production", "preview", "development"], stdin=subprocess.PIPE, text=True)
    process.communicate(input=value)

for k, v in ENV_VARS.items():
    add_env(k, v)

print("Backend variables added successfully.")
