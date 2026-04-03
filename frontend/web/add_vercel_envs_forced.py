import os
import subprocess

def add_env(key, value):
    # Always remove the existing variable just in case
    print(f'Removing if exists: {key}')
    subprocess.run(f'npx vercel env rm {key} production,preview,development -y', shell=True, capture_output=True)
    
    cmd = f'echo "{value}" | npx vercel env add {key} production,preview,development'
    print(f'Adding: {key}')
    proc = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if proc.returncode != 0:
        print(f"Failed to add {key}: {proc.stderr}")
    else:
        print(f"Added {key} successfully.")

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
                
                if k == 'VERCEL_OIDC_TOKEN': continue
                add_env(k, v)

print("Processing frontend/.env.local...")
process_env_file('.env.local')

print("Processing backend/.env...")
process_env_file('../../backend/.env')
