from app.core.config import settings
import os

print(f"SUPABASE_URL from settings: {settings.SUPABASE_URL}")
print(f"SUPABASE_ANON_KEY from settings: {settings.SUPABASE_ANON_KEY}")
print(f"SUPABASE_SERVICE_ROLE_KEY from settings: {settings.SUPABASE_SERVICE_ROLE_KEY}")
print(f"DATABASE_URL from settings: {settings.DATABASE_URL}")
print(f"Current OS Env SUPABASE_URL: {os.getenv('SUPABASE_URL')}")
