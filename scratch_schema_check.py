import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Missing Supabase credentials")
    exit(1)

supabase: Client = create_client(url, key)

tables = ["ai_answer_queue", "ai_answer_decisions", "teacher_assignments", "courses", "users"]

for table in tables:
    try:
        res = supabase.table(table).select("*").limit(1).execute()
        print(f"Table '{table}' exists. Rows: {len(res.data)}")
    except Exception as e:
        print(f"Table '{table}' error: {str(e)}")
