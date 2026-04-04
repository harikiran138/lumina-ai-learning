import asyncio
import os
import sys
import uuid
import json

# Add the current directory to the search path for imports
sys.path.append(os.getcwd())

from app.database.supabase_manager import supabase_db

async def check():
    client = supabase_db.get_client()
    guesses = ["1", "2", "3", "4", "5", "0"]
    
    results = {}
    
    for g in guesses:
        email = f"test_role_int_{g}_{uuid.uuid4().hex[:6]}@example.com"
        try:
            res = await client.table("users").insert({
                "id": str(uuid.uuid4()),
                "email": email,
                "password_hash": "dummy",
                "role": g
            }).async_execute()
            results[g] = "SUCCESS"
        except Exception as e:
            err = str(e)
            # Try to extract code from the JSON error if possible
            code = "UNKNOWN"
            if "code" in err:
                import re
                match = re.search(r"'code': '([^']+)'", err)
                if match:
                    code = match.group(1)
            results[g] = {"error": err[:100], "code": code}
                
    with open("verify_result_int_codes.json", "w") as f:
        json.dump(results, f, indent=2)

if __name__ == "__main__":
    asyncio.run(check())
