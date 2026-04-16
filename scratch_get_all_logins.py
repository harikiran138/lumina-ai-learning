import asyncio
import os
import sys
import json

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.database.supabase_manager import supabase_db

async def get_all_logins():
    institutions = await supabase_db.fetch_all("institutions", {"institution_name": "NSRIT"})
    inst_id = institutions[0]["id"]
    
    departments = await supabase_db.fetch_all("departments", {"institution_id": inst_id})
    dept_map = {d["id"]: d["department_name"] for d in departments}
    
    all_users = await supabase_db.fetch_all("users")
    nsrit_users = [u for u in all_users if u["email"].endswith("@nsrit.edu")]
    
    results = {
        "admin": [],
        "hod": [],
        "teacher": [],
        "student": []
    }
    
    for u in nsrit_users:
        role = u.get("role", "student").lower()
        dept_id = u.get("department_id")
        dept_name = dept_map.get(dept_id, "All-Institution" if role == "admin" else "General")
        
        user_info = {
            "name": u["name"],
            "email": u["email"],
            "password": "password",  # Assuming same password as per add_users.py
            "department": dept_name
        }
        
        if role in results:
            results[role].append(user_info)
        else:
            # Fallback if role is mismatch
            results["student"].append(user_info)

    # Sort each category
    for key in results:
        results[key].sort(key=lambda x: x["email"])
        
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    asyncio.run(get_all_logins())
