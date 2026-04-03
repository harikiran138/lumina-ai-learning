import subprocess
import os

MISSING_VARS = {
    "JWT_SECRET": "supersecretjwtkey_lumina138800",
    "REDACT_PII_LOGS": "true",
    "FRONTEND_URL": "https://lumina-ai.vercel.app",
    "PORT": "8000",
    "DEBUG": "false",
    "REDIS_URL": "redis://localhost:6379"
}

def add_env_to_all(key, value):
    print(f"Adding {key}...")
    for env in ["production", "preview", "development"]:
        # Remove if exists to prevent "already exists" error
        subprocess.run(["npx", "vercel", "env", "rm", key, env, "-y"], capture_output=True)
        # Add new
        # We provide the value directly to stdin via 'input' parameter
        cmd = ["npx", "vercel", "env", "add", key, env]
        process = subprocess.run(cmd, input=f"{value}\n", capture_output=True, text=True)
        if process.returncode != 0:
            print(f"  Failed for {env}: {process.stderr.strip()}")
        else:
            print(f"  Added to {env}")

for k, v in MISSING_VARS.items():
    add_env_to_all(k, v)

print("Finished.")
