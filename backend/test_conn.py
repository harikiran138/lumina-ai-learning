import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("CRITICAL: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    exit(1)

try:
    supabase: Client = create_client(url, key)
    # Try a simple count query
    res = supabase.table("users").select("*", count="exact").limit(1).execute()
    print(f"SUCCESS: Connected to Supabase. User count: {res.count if res.count is not None else 'unknown'}")
except Exception as e:
    print(f"ERROR: Could not connect to Supabase: {e}")
