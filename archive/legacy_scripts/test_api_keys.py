import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('.env.local')
url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_ANON_KEY')

print(f"URL: {url}")
try:
    supabase: Client = create_client(url, key)
    res = supabase.table('users').select('id').limit(1).execute()
    print("API connection successful. Data:", res.data)
except Exception as e:
    print(f"API connection failed: {e}")
