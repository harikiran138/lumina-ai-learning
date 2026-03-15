
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

db_url = os.getenv("DATABASE_URL")
schema_path = "docs/COMPLETE_SCHEMA.sql"

if not db_url:
    print("Error: DATABASE_URL not found in .env")
    exit(1)

# Ensure the URL is in a format psycopg2 likes if it's not already
# Supabase URLs can have special characters in passwords.

print(f"Connecting to database...")

try:
    # Use the URL directly for connection
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cursor = conn.cursor()

    print(f"Reading schema from {schema_path}...")
    with open(schema_path, 'r') as f:
        sql = f.read()

    print("Applying schema (this may take a minute)...")
    cursor.execute(sql)
    
    print("Schema applied successfully!")
    
    # Verify counts
    cursor.execute("SELECT count(*) FROM users;")
    print(f"User count check: {cursor.fetchone()[0]}")
    
    cursor.execute("SELECT count(*) FROM courses;")
    print(f"Course count check: {cursor.fetchone()[0]}")

    cursor.close()
    conn.close()

except Exception as e:
    print(f"Error applying schema: {e}")
    exit(1)
