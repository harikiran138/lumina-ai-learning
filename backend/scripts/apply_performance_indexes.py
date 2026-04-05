import os
import sys
import psycopg2
from pathlib import Path

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    from app.core.config import settings
except ImportError:
    # Fallback if app is not in path correctly
    class Settings:
        DATABASE_URL = os.getenv("DATABASE_URL")
    settings = Settings()

def apply_performance_migration():
    db_url = settings.DATABASE_URL
    if not db_url:
        print("DATABASE_URL not set. Skipping migration.")
        return

    migration_file = Path(__file__).parent.parent / "scripts" / "migration_add_performance_indexes.sql"
    if not migration_file.exists():
        print(f"Migration file {migration_file} not found.")
        return

    print(f"Applying migration: {migration_file}")
    
    try:
        conn = psycopg2.connect(db_url)
        conn.autocommit = True
        with conn.cursor() as cur:
            with open(migration_file, "r") as f:
                sql = f.read()
            cur.execute(sql)
            print("Performance migration applied successfully!")
    except Exception as e:
        print(f"Error applying performance migration: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    apply_performance_migration()
