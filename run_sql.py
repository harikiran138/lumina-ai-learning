import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv("backend/.env")

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")

supabase: Client = create_client(url, key)

with open('sync_schema_safe.sql', 'r') as f:
    sql_script = f.read()

# Since supabase-py has no direct execute_sql(), we can use postgres connection or the RPC if we don't have direct connection string
# Alternatively, use mcp_supabase_execute_sql which DOES HAVE a direct connection to the database.
