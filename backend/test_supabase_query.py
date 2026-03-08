from app.lib.supabase_client import get_supabase_client
import asyncio

async def test():
    client = get_supabase_client()
    course_ids = ["3ca8f41f-a4c9-49f5-bb14-e52ceda64c13"]
    
    # Try with in_
    res_in = client.table("courses").select("*").in_("id", course_ids).execute()
    print(f"Results with in_: {len(res_in.data)}")
    if res_in.data:
        print(f"First result ID: {res_in.data[0].get('id')}")
    
    # Try with eq
    res_eq = client.table("courses").select("*").eq("id", course_ids[0]).execute()
    print(f"Results with eq: {len(res_eq.data)}")

if __name__ == "__main__":
    asyncio.run(test())
