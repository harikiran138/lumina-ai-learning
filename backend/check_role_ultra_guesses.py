import asyncio
import os
import sys
import uuid

# Add the current directory to the search path for imports
sys.path.append(os.getcwd())

from app.database.supabase_manager import supabase_db

async def check():
    client = supabase_db.get_client()
    guesses = [
        "student", "STUDENT", "Student", 
        "teacher", "TEACHER", "Teacher",
        "faculty", "FACULTY", "Faculty",
        "admin", "ADMIN", "Admin",
        "super_admin", "SUPER_ADMIN", "SuperAdmin",
        "authenticated", "AUTHENTICATED", "Authenticated",
        "anon", "ANON", "Anon",
        "learner", "LEARNER", "Learner",
        "user", "USER", "User",
        "member", "MEMBER", "Member"
    ]
    
    results = []
    
    for g in guesses:
        email = f"test_{g}_{uuid.uuid4().hex[:6]}@example.com"
        print(f"Testing: '{g}'")
        try:
            # Minimal insert to users table
            res = await client.table("users").insert({
                "id": str(uuid.uuid4()),
                "email": email,
                "password_hash": "dummy",
                "role": g
            }).async_execute()
            results.append(f"SUCCESS: '{g}' is a valid enum value!")
            print(f"==> FOUND ONE: {g}")
        except Exception as e:
            err = str(e)
            if "invalid input value for enum" in err or "22P02" in err:
                print(f"  Rejected: {g}")
            else:
                results.append(f"ERROR: '{g}' failed with unexpected error: {err[:100]}")
                print(f"  Failed other: {err[:100]}")
                
    if not results:
         results.append("All guesses failed with 'invalid input value for enum user_role'")
         
    with open("verify_result_ultra_guesses.txt", "w") as f:
        f.write("\n".join(results))

if __name__ == "__main__":
    asyncio.run(check())
