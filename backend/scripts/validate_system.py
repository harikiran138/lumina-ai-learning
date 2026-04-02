#!/usr/bin/env python3
import os
import sys
import subprocess
from dotenv import load_dotenv

def run_sql(query):
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("❌ ERROR: DATABASE_URL not found in environment.")
        sys.exit(1)
        
    result = subprocess.run(
        ["psql", db_url, "-t", "-c", query],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        print(f"❌ Query Error: {result.stderr.strip()}")
        return None
    return [line.strip() for line in result.stdout.split('\n') if line.strip()]

def check_tables_exist():
    print(">>> Checking Mandatory Tables Exist...")
    tables = [
        "ai_answer_queue", "verified_answers_bank", "assignments",
        "assignment_submissions", "user_roles", "attendance_sessions", "attendance_records"
    ]
    existing = run_sql("SELECT tablename FROM pg_tables WHERE schemaname = 'public';")
    if existing is None: return False
    
    missing = [t for t in tables if t not in existing]
    if missing:
        print(f"❌ Missing mandatory tables: {', '.join(missing)}")
        return False
    print("✅ All mandatory tables exist.")
    return True

def check_duplicate_submissions():
    print(">>> Checking for duplicate submissions...")
    query = """
    SELECT student_id, assignment_id, COUNT(*)
    FROM assignment_submissions
    GROUP BY student_id, assignment_id
    HAVING COUNT(*) > 1;
    """
    dupes = run_sql(query)
    if dupes:
        print(f"❌ Found duplicate submissions: {dupes}")
        return False
    print("✅ No duplicate submissions found.")
    return True

def check_orphan_records():
    print(">>> Checking for orphan submissions...")
    query = """
    SELECT id, student_id FROM assignment_submissions
    WHERE student_id NOT IN (SELECT id FROM users);
    """
    orphans = run_sql(query)
    if orphans:
        print(f"❌ Found {len(orphans)} orphan submissions without valid users.")
        return False
    
    print("✅ No orphan submissions found.")
    return True

def check_ai_tutor_flow():
    print(">>> Summarizing AI Answer Queue Flow...")
    query = "SELECT status, COUNT(*) FROM ai_answer_queue GROUP BY status;"
    counts = run_sql(query)
    if counts is not None:
        print(f"✅ AI Answer Queue state: {counts}")
        return True
    return False

def validate_system():
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
    
    print("===============================")
    print("   LUMINA SYSTEM VALIDATION")
    print("===============================\n")
    
    checks = [
        check_tables_exist(),
        check_duplicate_submissions(),
        check_orphan_records(),
        check_ai_tutor_flow()
    ]
    
    print("\n===============================")
    if all(checks):
        print("   ✅ SYSTEM OK")
    else:
        print("   ❌ SYSTEM FAILING INTEGRITY")
    print("===============================")

if __name__ == "__main__":
    validate_system()
