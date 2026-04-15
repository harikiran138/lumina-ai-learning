#!/usr/bin/env python3
"""
Lumina Onboarding Migration Runner

Applies all onboarding migrations to Supabase database in correct order.
"""

import os
import sys
from pathlib import Path
import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv


def get_db_connection():
    """Get connection to Supabase database."""
    load_dotenv()
    
    # Connection parameters
    db_url = os.getenv("SUPABASE_URL")
    db_key = os.getenv("SUPABASE_KEY")
    db_password = os.getenv("SUPABASE_PASSWORD")
    db_user = os.getenv("SUPABASE_USER", "postgres")
    db_name = os.getenv("SUPABASE_DB", "postgres")
    
    if not db_url or not db_password:
        print("❌ Missing SUPABASE_URL or SUPABASE_PASSWORD environment variables")
        return None
    
    try:
        # Parse Supabase URL to get host
        # Format: https://xxxxxxxxxxxx.supabase.co
        host = db_url.replace("https://", "").replace(".supabase.co", "")
        
        conn = psycopg2.connect(
            host=f"{host}.supabase.co",
            database=db_name,
            user=db_user,
            password=db_password,
            port=5432
        )
        print("✅ Connected to Supabase database")
        return conn
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return None


def run_migration(conn, migration_file):
    """Execute a single migration SQL file."""
    try:
        with open(migration_file, 'r') as f:
            sql_content = f.read()
        
        with conn.cursor() as cur:
            cur.execute(sql_content)
        
        conn.commit()
        print(f"✅ Applied: {migration_file.name}")
        return True
    except Exception as e:
        conn.rollback()
        print(f"❌ Failed to apply {migration_file.name}: {e}")
        return False


def main():
    """Run all migrations in order."""
    print("=" * 70)
    print("LUMINA ONBOARDING - MIGRATION RUNNER")
    print("=" * 70)
    
    # Connect to database
    conn = get_db_connection()
    if not conn:
        return 1
    
    # Get migration files in order
    migrations_dir = Path("/Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/migrations")
    
    migration_files = [
        migrations_dir / "011_onboarding_core_schema.sql",
        migrations_dir / "012_onboarding_profiles_schema.sql",
        migrations_dir / "013_onboarding_analytics_views.sql",
    ]
    
    print("\n[Applying Migrations]\n")
    
    successful = 0
    for migration_file in migration_files:
        if not migration_file.exists():
            print(f"❌ Not found: {migration_file}")
            continue
        
        if run_migration(conn, migration_file):
            successful += 1
    
    # Summary
    print("\n" + "=" * 70)
    print(f"Migration completed: {successful}/{len(migration_files)} successful")
    print("=" * 70)
    
    conn.close()
    
    if successful == len(migration_files):
        print("\n🎉 All migrations applied successfully!")
        return 0
    else:
        print(f"\n⚠️  {len(migration_files) - successful} migration(s) failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())
