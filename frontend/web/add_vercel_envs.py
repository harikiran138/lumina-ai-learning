import os
import subprocess

def add_env(key, value):
    cmd = f'echo "{value}" | npx vercel env add {key} production,preview,development'
    print(f'Running: {key}')
    proc = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if proc.returncode != 0:
        if "Already exists" in proc.stderr or "Already exists" in proc.stdout:
            # If it exists, update it? Or we can just use `vercel env rm` first, but Vercel doesn't allow replacing directly via `add` without confirmation.
            # We can run rm first:
            subprocess.run(f'npx vercel env rm {key} production,preview,development -y', shell=True, capture_output=True)
            subprocess.run(cmd, shell=True)
            print(f"Updated {key}")
        else:
            print(f"Failed to add {key}: {proc.stderr}")
    else:
        print(f"Added {key}")

def process_env_file(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'): continue
            if '=' in line:
                k, v = line.split('=', 1)
                k = k.strip()
                v = v.strip().strip('"').strip("'")
                
                # Special cases to exclude
                if k == 'VERCEL_OIDC_TOKEN': continue
                add_env(k, v)

print("Processing frontend/.env.local...")
process_env_file('.env.local')
