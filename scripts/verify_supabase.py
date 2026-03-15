import httpx
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Compatibility shim: gotrue 2.9.x passes `proxy=` to httpx.Client.__init__,
# but httpx 0.25.x only accepts `proxies=`. Patch it out transparently.
_OriginalHttpxSyncClient = httpx.Client.__init__

def _patched_httpx_init(self, *args, **kwargs):
    kwargs.pop("proxy", None)   # strip the unsupported kwarg
    _OriginalHttpxSyncClient(self, *args, **kwargs)

httpx.Client.__init__ = _patched_httpx_init          # type: ignore[method-assign]

load_dotenv()

def verify_connection():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")
    
    print(f"Testing connection to: {url}")
    
    try:
        supabase: Client = create_client(url, key)
        # Attempt a simple query to verify the connection
        # We'll try to list buckets as a basic check
        response = supabase.storage.list_buckets()
        print("Successfully connected to Supabase!")
        print(f"Available buckets: {[b.name for b in response]}")
        return True
    except Exception as e:
        print(f"Failed to connect to Supabase: {e}")
        return False

if __name__ == "__main__":
    verify_connection()
