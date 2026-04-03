import subprocess

ENV_VARS = {
    "NEXT_PUBLIC_SUPABASE_URL": "https://odyjksznsdeyweylovzl.supabase.co",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9keWprc3puc2RleXdleWxvdnpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NTA1MjEsImV4cCI6MjA4ODUyNjUyMX0.cEz3pxnk2o7YcUe3fPgKdnKmnkqFivoImoEzT9KsZTM",
    "NEXT_PUBLIC_API_URL": "https://lumina-backend.onrender.com/api",
    "NEXT_PUBLIC_AUTH_URL": "https://lumina-backend.onrender.com/api",
    "NEXT_PUBLIC_IS_PROTOTYPE": "false",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9keWprc3puc2RleXdleWxvdnpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NTA1MjEsImV4cCI6MjA4ODUyNjUyMX0.cEz3pxnk2o7YcUe3fPgKdnKmnkqFivoImoEzT9KsZTM",
    "NEXT_PUBLIC_TUTOR_PROVIDER": "gemini"
}

def add_env(key, value):
    print(f"Adding {key}...")
    subprocess.run(["npx", "vercel", "env", "rm", key, "production", "preview", "development", "-y"], capture_output=True)
    process = subprocess.Popen(["npx", "vercel", "env", "add", key, "production", "preview", "development"], stdin=subprocess.PIPE, text=True)
    process.communicate(input=value)

for k, v in ENV_VARS.items():
    add_env(k, v)

print("Frontend variables added successfully.")
