import os
import asyncio
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add backend to path
sys.path.append(os.getcwd())

load_dotenv()

from app.core.config import settings
from app.database.supabase_manager import supabase_db

async def check_health():
    print("🚀 Starting Lumina Backend Health Check...")
    
    # 1. Environment Check
    print("\n[1/4] Checking Environment Variables...")
    required_vars = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "DATABASE_URL"]
    for var in required_vars:
        val = os.getenv(var)
        status = "✅" if val else "❌"
        masked = f"{val[:10]}..." if val else "MISSING"
        print(f"  {status} {var}: {masked}")

    # 2. Supabase Connection & Schema
    print("\n[2/4] Verifying Supabase Tables...")
    tables_to_check = [
        "users", "courses", "course_questions", "ai_answer_queue", 
        "handwritten_assignments", "handwritten_questions", 
        "handwritten_submissions", "handwritten_submission_questions"
    ]
    client = supabase_db.get_client()
    for table in tables_to_check:
        try:
            # Just try a limit 0 select to check existence
            client.table(table).select("*").limit(0).execute()
            print(f"  ✅ Table '{table}' exists.")
        except Exception as e:
            print(f"  ❌ Table '{table}' missing or inaccessible: {str(e)[:50]}...")

    # 3. AI Services
    print("\n[3/4] Checking AI Service Configurations...")
    ai_status = "✅" if settings.ASSESSMENT_API_KEY else "❌"
    print(f"  {ai_status} Gemini API (ASSESSMENT_API_KEY): {'Set' if settings.ASSESSMENT_API_KEY else 'NOT SET'}")
    
    hf_status = "✅" if settings.HF_TOKEN else "⚠️"
    print(f"  {hf_status} HuggingFace Token (HF_TOKEN): {'Set' if settings.HF_TOKEN else 'NOT SET (Local Fallback)'}")

    # 4. Folder Structure
    print("\n[4/4] Verifying Upload Directories...")
    upload_path = Path(settings.UPLOAD_DIR)
    if not upload_path.exists():
        upload_path.mkdir(parents=True, exist_ok=True)
        print(f"  ✅ Created upload directory: {settings.UPLOAD_DIR}")
    else:
        print(f"  ✅ Upload directory exists: {settings.UPLOAD_DIR}")

    print("\n✨ Health Check Complete!")

if __name__ == "__main__":
    asyncio.run(check_health())
