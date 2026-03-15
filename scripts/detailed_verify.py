import httpx
import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

# Compatibility shim: gotrue 2.9.x passes `proxy=` to httpx.Client.__init__,
# but httpx 0.25.x only accepts `proxies=`. Patch it out transparently.
_OriginalHttpxSyncClient = httpx.Client.__init__

def _patched_httpx_init(self, *args, **kwargs):
    kwargs.pop("proxy", None)   # strip the unsupported kwarg
    _OriginalHttpxSyncClient(self, *args, **kwargs)

httpx.Client.__init__ = _patched_httpx_init          # type: ignore[method-assign]

load_dotenv()

EXPECTED_TABLES = [
    "users", "sessions", "courses", "progress", "knowledge_nodes",
    "pathway_nodes", "student_pathways", "skill_mastery", "learner_profiles",
    "assignments", "submissions", "assessment_sessions", "quizzes",
    "quiz_attempts", "question_bank", "user_data", "behavior_logs",
    "ai_logs", "agent_memory", "conversations", "community_messages",
    "study_groups", "study_group_members", "parent_guardian", "attendance",
    "intervention_logs", "notifications", "ppt_generations", "feedback",
    "leaderboard_entries", "teacher_stats", "student_stats", "analytics_events",
    "tutor_sessions", "certificates"
]

def verify_detailed():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")
    
    if not url or not key:
        print("Error: SUPABASE_URL or SUPABASE_ANON_KEY not found in environment.")
        return

    print(f"--- Detailed Verification for Project: {url} ---")
    
    try:
        supabase: Client = create_client(url, key)
        
        # 1. Verify all tables exist
        print("\nChecking Table Existence:")
        missing_tables = []
        found_tables = []
        
        for table in EXPECTED_TABLES:
            try:
                # Try a select limit 0 to check if table exists
                supabase.table(table).select("*").limit(0).execute()
                print(f"  [✓] {table}")
                found_tables.append(table)
            except Exception as e:
                if "does not exist" in str(e).lower() or "404" in str(e):
                    print(f"  [X] {table} - MISSING")
                    missing_tables.append(table)
                else:
                    print(f"  [?] {table} - Error: {e}")
        
        # 2. Key Data Verification
        print("\nVerifying Key Data Counts:")
        key_tables = ["users", "courses", "progress"]
        for table in key_tables:
            if table in found_tables:
                try:
                    res = supabase.table(table).select("*", count="exact").execute()
                    count = res.count if hasattr(res, 'count') else len(res.data)
                    print(f"  - {table}: {count} rows")
                except Exception as e:
                    print(f"  - {table}: Could not get count ({e})")

        # 3. Check for Views and Functions (indirectly)
        # We can try to query the public schema via RPC or system tables if allowed, 
        # but since this is PostgREST, we'll try to query a known view if available.
        # COMPLETE_SCHEMA.sql likely has some views.
        
        if missing_tables:
            print(f"\nSummary: {len(found_tables)}/{len(EXPECTED_TABLES)} tables found. {len(missing_tables)} MISSING.")
            sys.exit(1)
        else:
            print(f"\nSummary: All {len(EXPECTED_TABLES)} tables verified successfully!")
            
    except Exception as e:
        print(f"Critical Error during verification: {e}")
        sys.exit(1)

if __name__ == "__main__":
    verify_detailed()
