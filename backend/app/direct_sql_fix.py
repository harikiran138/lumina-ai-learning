import psycopg2
import os

db_url = "postgresql://postgres:Lumina%40138800@db.odyjksznsdeyweylovzl.supabase.co:5432/postgres"

def fix_rls():
    try:
        print("🔗 Connecting directly to Postgres...")
        conn = psycopg2.connect(db_url)
        conn.autocommit = True
        cur = conn.cursor()
        
        print("🛠️ Disabling RLS on target tables...")
        tables = ["users", "courses", "progress", "submissions", "assignments", "ai_logs", "quiz_attempts", "user_data"]
        for table in tables:
            cur.execute(f"ALTER TABLE public.{table} DISABLE ROW LEVEL SECURITY;")
            print(f"   ✅ Disabled RLS on {table}")
            
        cur.close()
        conn.close()
        print("Done!")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    fix_rls()
