import asyncio
import os
import sys
import uuid

# Add the current directory to the search path for imports
sys.path.append(os.getcwd())

from app.database.supabase_manager import supabase_db

async def check():
    client = supabase_db.get_client()
    # Testing roles found in the test_output.txt FAILURES
    guesses = [
        "faculty", "college_admin", "super_admin", "hod", "lecturer"
    ]
    
    results = []
    
    for g in guesses:
        email = f"test_{g}_{uuid.uuid4().hex[:6]}@example.com"
        print(f"Testing role: '{g}' with {email}")
        try:
            # Send ONLY the 4 columns we know exist
            await client.table("users").insert({
                "id": str(uuid.uuid4()),
                "email": email,
                "password_hash": "dummy",
                "role": g
            }).async_execute()
            results.append(f"SUCCESS: '{g}' is a valid enum value.")
        except Exception as e:
            msg = str(e)
            if "invalid input value for enum user_role" in msg:
                pass
            else:
                results.append(f"FAILED_OTHER: '{g}' rejected: {msg[:100]}")
                
    if not results:
         results.append("All guesses (faculty, college_admin, etc.) failed with 'invalid input value for enum user_role'")
         
    with open("verify_result_guesses_2.txt", "w") as f:
        f.write("\n".join(results))

if __name__ == "__main__":
    asyncio.run(check())
