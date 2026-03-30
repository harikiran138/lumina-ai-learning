import os
import sys
import httpx
from supabase import create_client, Client, ClientOptions
from dotenv import load_dotenv

load_dotenv()

# --- Patch for httpx/supabase compatibility issue ---
_OriginalHttpxSyncClient = httpx.Client.__init__
def _patched_httpx_init(self, *args, **kwargs):
    kwargs.pop("proxy", None)
    _OriginalHttpxSyncClient(self, *args, **kwargs)
httpx.Client.__init__ = _patched_httpx_init
# ---------------------------------------------------

def test_connection():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
    
    if not url or not key:
        print("❌ Error: SUPABASE_URL and key must be set in .env")
        sys.exit(1)
        
    print(f"🔗 Connecting to Supabase at {url}...")
    try:
        supabase: Client = create_client(url, key)
        # Test basic connectivity by fetching a single user or health check
        # Note: We use the REST API via the client
        response = supabase.table("users").select("id").limit(1).execute()
        print("✅ Successfully connected to Supabase REST API")
        print(f"📊 Table 'users' is reachable. Rows found: {len(response.data)}")
    except Exception as e:
        print(f"❌ Connection failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    test_connection()
