"""
One-click script to apply the RLS fix for Lumina's admin user listing.

Run from the backend/ directory:
    python apply_rls_fix.py

The Supabase database password must be correct in ../.env (DATABASE_URL).
If you don't know the password, apply the SQL manually in the Supabase SQL Editor:
  https://supabase.com/dashboard/project/odyjksznsdeyweylovzl/editor

Copy and paste the contents of:
  app/database/migrations/015_fix_rls_admin.sql
"""
import os
import socket
import sys

# Force IPv4 to avoid IPv6 issues on macOS with Supabase
_orig = socket.getaddrinfo
def _ipv4_only(*args, **kwargs):
    results = _orig(*args, **kwargs)
    ipv4 = [r for r in results if r[0] == socket.AF_INET]
    return ipv4 if ipv4 else results
socket.getaddrinfo = _ipv4_only

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
import psycopg2

MIGRATION_PATH = os.path.join(
    os.path.dirname(__file__),
    "app", "database", "migrations", "015_fix_rls_admin.sql"
)


def apply():
    db_url = settings.DATABASE_URL
    if not db_url:
        print("❌ DATABASE_URL is not set in .env")
        sys.exit(1)

    print(f"🔗 Connecting to: {db_url[:50]}...")
    try:
        conn = psycopg2.connect(db_url, connect_timeout=10, sslmode="require")
        conn.autocommit = True
        cur = conn.cursor()

        with open(MIGRATION_PATH) as f:
            sql = f.read()

        print("🛠️  Applying RLS fix migration (015_fix_rls_admin.sql)...")
        cur.execute(sql)
        cur.close()
        conn.close()
        print("✅ Migration applied successfully!")
        print("   Users table RLS is now disabled — admin user listing will work.")
    except psycopg2.OperationalError as e:
        print(f"❌ Connection failed: {e}")
        print()
        print("Manual fix — paste this SQL in your Supabase SQL Editor:")
        print(f"  https://supabase.com/dashboard/project/odyjksznsdeyweylovzl/editor")
        print()
        with open(MIGRATION_PATH) as f:
            print(f.read())
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    apply()
