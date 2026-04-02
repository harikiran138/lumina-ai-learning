import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def check_details():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        tables = ["course_questions", "ai_answer_queue", "users", "courses"]
        for table in tables:
            print(f"\n--- Columns in {table} ---")
            cur.execute(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table}';")
            rows = cur.fetchall()
            for row in rows:
                print(f"{row[0]}: {row[1]}")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    check_details()
