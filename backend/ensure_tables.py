import os
import time
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(url, key)

REQUIRED_TABLES = [
    "course_questions",
    "ai_answer_queue",
    "assignments",
    "physical_submissions",
    "question_bank",
    "handwritten_submissions",
    "handwritten_submission_questions"
]

def check_table_exists(table_name: str) -> bool:
    try:
        supabase.table(table_name).select("*").limit(0).execute()
        return True
    except Exception as e:
        if "does not exist" in str(e).lower() or "not found" in str(e).lower():
            return False
        # If it's a permission error or something else, we might still have the table
        print(f"Warning checking {table_name}: {e}")
        return False

def create_missing_tables():
    for table in REQUIRED_TABLES:
        exists = check_table_exists(table)
        if exists:
            print(f"Table '{table}' already exists.")
        else:
            print(f"Table '{table}' is MISSING.")
            # Note: supabase-py doesn't support easy 'CREATE TABLE' via RPC unless we have a specific function.
            # We usually use SQL editor or a migration tool. 
            # I will output the SQL needed if missing.

if __name__ == "__main__":
    create_missing_tables()
