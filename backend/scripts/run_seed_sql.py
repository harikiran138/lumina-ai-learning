import os
import sys
import psycopg2

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.config import settings

def execute_sql_file():
    db_url = settings.DATABASE_URL
    print(f"Connecting to: {db_url}")
    
    with open("ecosystem_seed.sql", "r") as f:
        sql = f.read()
    
    try:
        conn = psycopg2.connect(db_url)
        conn.autocommit = True
        with conn.cursor() as cur:
            print("Executing ecosystem_seed.sql ...")
            cur.execute(sql)
            print("Successfully executed SQL!")
    except Exception as e:
        print(f"Error executing SQL: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    execute_sql_file()
