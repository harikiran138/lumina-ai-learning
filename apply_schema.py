import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(".env")
db_url = os.environ.get("DATABASE_URL")

with open('sync_schema_safe.sql', 'r') as f:
    sql = f.read()

conn = psycopg2.connect(db_url)
conn.autocommit = True
cur = conn.cursor()
try:
    cur.execute(sql)
    print("Schema applied successfully!")
except Exception as e:
    print(f"Error applying schema: {e}")
finally:
    cur.close()
    conn.close()
