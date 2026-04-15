
import asyncio
from app.database.supabase_manager import supabase_db

async def check_tables():
    client = supabase_db.get_client()
    tables_to_check = [
        "ai_answer_queue",
        "ai_answer_decisions",
        "ai_answer_review",
        "queue_metrics",
        "verified_answers_bank",
        "ai_model_metrics",
        "institutions",
        "users",
        "courses",
        "assignments",
        "submissions",
        "progress"
    ]
    
    print(f"{'Table Name':<25} | {'Exists':<10}")
    print("-" * 40)
    
    for table in tables_to_check:
        try:
            # We just try to select 1 row to see if it works
            client.table(table).select("*").limit(1).execute()
            print(f"{table:<25} | {'YES':<10}")
        except Exception as e:
            error_msg = str(e)
            if 'does not exist' in error_msg.lower() or '404' in error_msg:
                print(f"{table:<25} | {'NO':<10}")
            else:
                print(f"{table:<25} | {'ERROR':<10} ({error_msg[:30]}...)")

if __name__ == "__main__":
    asyncio.run(check_tables())
