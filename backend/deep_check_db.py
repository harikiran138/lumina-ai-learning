import psycopg2
import os

DB_URL = "postgresql://postgres:CHANGE_ME@db.odyjksznsdeyweylovzl.supabase.co:5432/postgres"

def check():
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        
        # 1. Get user_role enum values
        print("\n--- Enum 'user_role' values ---")
        cur.execute("""
            SELECT e.enumlabel 
            FROM pg_type t 
            JOIN pg_enum e ON t.oid = e.enumtypid 
            WHERE t.typname = 'user_role';
        """)
        roles = [r[0] for r in cur.fetchall()]
        print(roles)
        
        # 2. Get users table columns
        print("\n--- 'public.users' columns ---")
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND table_schema = 'public';
        """)
        cols = cur.fetchall()
        for c in cols:
            print(f"Col: {c[0]} ({c[1]})")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"FAILED: {str(e)}")

if __name__ == "__main__":
    check()
