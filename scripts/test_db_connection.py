import os
import sys
import psycopg2
from dotenv import load_dotenv

def test_db_connection():
    load_dotenv()
    
    # We prioritize DATABASE_URL which is the standard for PostgreSQL
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("ERROR: DATABASE_URL not found in environment.")
        sys.exit(1)
        
    print(f"Connecting to: {db_url.split('@')[-1]}") # Log without credentials
    
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # 1. Verify Server Version
        cur.execute("SELECT version();")
        version = cur.fetchone()
        print(f"SUCCESS: PostgreSQL Connection Established.")
        print(f"Server Version: {version[0]}")
        
        # 2. Verify Onboarding Tables (Section 10a requirement)
        required_tables = [
            "users", "onboarding_sessions", "user_data", "learner_profiles", 
            "teacher_profiles", "student_subjects", "institutions", "batches", "departments"
        ]
        
        print("\nVerifying Core Table Existence:")
        for table in required_tables:
            cur.execute(f"SELECT COUNT(*) FROM information_schema.tables WHERE table_name = %s", (table,))
            exists = cur.fetchone()[0] > 0
            if exists:
                cur.execute(f"SELECT COUNT(*) FROM {table}")
                count = cur.fetchone()[0]
                print(f"  [PASS] {table}: {count} rows")
            else:
                print(f"  [FAIL] {table}: TABLE NOT FOUND")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"FAILED: Could not connect to PostgreSQL - {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_db_connection()
