import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(".env")
db_url = os.environ.get("DATABASE_URL")
if db_url and "5432" in db_url:
    db_url = db_url.replace("5432", "6543")

with open('ecosystem_seed.sql', 'r') as f:
    sql = f.read()

conn = psycopg2.connect(db_url)
conn.autocommit = True
cur = conn.cursor()
try:
    cur.execute(sql)
    print("Seed applied successfully!")
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    cur.close()
    conn.close()
