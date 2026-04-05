import asyncio
from app.db.supabase_client import DatabaseClient
from app.store.mentor_store import MentorStore
import uuid

async def seed_mentor_matches():
    db = DatabaseClient()
    store = MentorStore(db)
    client = db.get_client()

    # 1. Get a mentor and some students
    users_resp = await client.table("users").select("id, role").async_execute()
    users = users_resp.data
    
    mentors = [u for u in users if u["role"] == "mentor"]
    students = [u for u in users if u["role"] == "student"]
    
    if not mentors or not students:
        print("No mentors or students found to match.")
        return

    mentor_id = mentors[0]["id"]
    
    # 2. Create some ML-only matches
    for student in students[:3]:
        match_data = {
            "mentor_id": mentor_id,
            "student_id": student["id"],
            "match_source": "ml_only",
            "status": "active"
        }
        try:
            await client.table("mentor_matches").upsert(match_data).async_execute()
            print(f"Matched Mentor {mentor_id} with Student {student['id']} (ML-only)")
        except Exception as e:
            print(f"Failed to match: {e}")

if __name__ == "__main__":
    asyncio.run(seed_mentor_matches())
