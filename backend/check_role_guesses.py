import asyncio
import os
import sys
import uuid

# Add the current directory to the search path for imports
sys.path.append(os.getcwd())

from app.database.supabase_manager import supabase_db

async def check():
    client = supabase_db.get_client()
    # Try more guesses for the enum values
    guesses = [
        "student", "STUDENT", "Student",
        "learner", "LEARNER", "Learner",
        "user", "USER", "User",
        "member", "MEMBER", "Member",
        "authenticated", "AUTHENTICATED", "Authenticated",
        "standard", "STANDARD", "Standard",
        "student_role", "STUDENT_ROLE", "Student_Role"
    ]
    
    results = []
    
    for g in guesses:
        email = f"test_{g}_{uuid.uuid4().hex[:6]}@example.com"
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
                # Still failing on enum, keep going
                pass
            else:
                # Failing on something else (e.g. column)?
                results.append(f"FAILED_OTHER: '{g}' rejected: {msg[:100]}")
                
    if not results:
         results.append("All guesses failed with 'invalid input value for enum user_role'")
         
    with open("verify_result_guesses.txt", "w") as f:
        f.write("\n".join(results))

if __name__ == "__main__":
    asyncio.run(check())
