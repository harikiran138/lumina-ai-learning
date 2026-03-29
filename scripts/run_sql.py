import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ DATABASE_URL not found in .env")
    exit(1)

def run_sql_file(filename):
    print(f"Executing {filename}...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        with open(filename, 'r') as f:
            sql = f.read()
            
        cur.execute(sql)
        conn.commit()
        
        print(f"✅ {filename} executed successfully.")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ Error executing {filename}: {e}")
        exit(1)

if __name__ == "__main__":
    run_sql_file("scripts/apply_missing_tables.sql")
