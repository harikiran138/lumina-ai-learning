import asyncio
import os
import sys
import uuid

# Add the current directory to the search path for imports
sys.path.append(os.getcwd())

from app.database.supabase_manager import supabase_db

async def verify():
    client = supabase_db.get_client()
    # Testing ONLY the columns we KNOW exist: id, email, role, password_hash
    patterns = ["student", "STUDENT", "Student", "parent", "teacher", "admin"]
    
    results = []
    
    for p in patterns:
        email = f"test_{p}_{uuid.uuid4().hex[:6]}@example.com"
        print(f"Testing role: '{p}' with {email}")
        try:
            # IMPORTANT: We only send the 4 columns we confirmed are available
            res = await client.table("users").insert({
                "id": str(uuid.uuid4()),
                "email": email,
                "password_hash": "dummy",
                "role": p
            }).async_execute()
            results.append(f"SUCCESS: '{p}' is a valid enum value.")
        except Exception as e:
            results.append(f"FAILED: '{p}' rejected: {str(e)}")
            
    with open("verify_result_patterns.txt", "w") as f:
        f.write("\n".join(results))

if __name__ == "__main__":
    asyncio.run(verify())
