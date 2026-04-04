import asyncio
import os
import sys

# Add the current directory to the search path for imports
sys.path.append(os.getcwd())

from app.database.supabase_manager import supabase_db

async def check():
    client = supabase_db.get_client()
    emails = ["admin_mass@nsrit.edu", "student_mass1@nsrit.edu", "hod.cse@lumina.com", "admin@lumina.com"]
    
    for email in emails:
        print(f"Trying to fetch role for {email}...")
        try:
            # We try to select the role for a known user
            # Usually, you can select YOUR OWN user, so we might need a JWT.
            # But the service role key should bypass RLS.
            res = await client.table("users").select("role").eq("email", email).async_execute()
            if res.data:
                print(f"SUCCESS for {email}! Role value: '{res.data[0]['role']}'")
                return
            else:
                print(f"User {email} not found.")
        except Exception as e:
            print(f"Fetch failed for {email}: {str(e)}")

    print("Could not find ANY existing user to check role format.")

if __name__ == "__main__":
    asyncio.run(check())
