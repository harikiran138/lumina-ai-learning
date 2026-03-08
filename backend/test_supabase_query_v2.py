from app.database.supabase_manager import supabase_db
import asyncio

async def test():
    client = supabase_db.get_client()
    course_id = "3ca8f41f-a4c9-49f5-bb14-e52ceda64c13"
    
    # Try with in_ using a list
    course_ids = [course_id]
    res_in = client.table("courses").select("*").in_("id", course_ids).execute()
    print(f"Results with in_ (list): {len(res_in.data)}")
    
    # Try with eq using the string
    res_eq = client.table("courses").select("*").eq("id", course_id).execute()
    print(f"Results with eq (string): {len(res_eq.data)}")
    
    if res_eq.data:
        print(f"Course Data: {res_eq.data[0]}")
    else:
        print("Course NOT FOUND with eq")

if __name__ == "__main__":
    asyncio.run(test())
