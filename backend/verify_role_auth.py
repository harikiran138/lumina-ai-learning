import asyncio
import os
import sys
import uuid

# Add the current directory to the search path for imports
sys.path.append(os.getcwd())

from app.database.supabase_manager import supabase_db

async def verify():
    client = supabase_db.get_client()
    # Testing ONLY 'authenticated' which is a standard Supabase role
    patterns = ["authenticated", "anon", "service_role"]
    
    results = []
    
    for p in patterns:
        email = f"test_{p}_{uuid.uuid4().hex[:6]}@example.com"
        print(f"Testing role: '{p}' with {email}")
        try:
            res = await client.table("users").insert({
                "id": str(uuid.uuid4()),
                "email": email,
                "password_hash": "dummy",
                "role": p
            }).async_execute()
            results.append(f"SUCCESS: '{p}' is a valid enum value.")
        except Exception as e:
            results.append(f"FAILED: '{p}' rejected: {str(e)}")
            
    with open("verify_result_patterns_auth.txt", "w") as f:
        f.write("\n".join(results))

if __name__ == "__main__":
    asyncio.run(verify())
