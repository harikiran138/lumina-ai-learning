
import os
import sys
import httpx
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_ANON_KEY")

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_ANON_KEY not found in .env")
    sys.exit(1)

print(f"Targeting Project URL: {url}")

# Patch for httpx compatibility if needed
# (Already handled in the project's managers usually, but for a standalone script we do it simply)

# ---------------------------------------------------------------------------
# Compatibility shim: gotrue 2.9.x passes `proxy=` to httpx.Client.__init__,
# but httpx 0.25.x only accepts `proxies=`. Patch it out transparently.
# ---------------------------------------------------------------------------
_OriginalHttpxSyncClient = httpx.Client.__init__
def _patched_httpx_init(self, *args, **kwargs):
    kwargs.pop("proxy", None)
    _OriginalHttpxSyncClient(self, *args, **kwargs)
httpx.Client.__init__ = _patched_httpx_init

try:
    supabase: Client = create_client(url, key)
    
    # Check connection
    response = supabase.table("users").select("count", count="exact").execute()
    print(f"Connected successfully. Current user count: {response.count}")
    
    # Since we can't easily run raw SQL DDL through the client's RPC (unless there's a specific function),
    # we will rely on checking table existence here.
    
    tables_to_check = ["users", "courses", "progress", "quizzes", "assignments"]
    for table in tables_to_check:
        try:
            res = supabase.table(table).select("count", count="exact").limit(1).execute()
            print(f"Table '{table}' exists. Row count: {res.count}")
        except Exception as e:
            print(f"Table '{table}' error (possibly missing): {e}")

except Exception as e:
    print(f"An error occurred: {e}")
