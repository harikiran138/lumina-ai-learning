import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.database.supabase_manager import supabase_db

async def verify_nsrit():
    print("--- Verifying NSRIT Deployment ---")
    
    # 1. Institutions
    institutions = await supabase_db.fetch_all("institutions", {"institution_name": "NSRIT"})
    if not institutions:
        print("❌ Error: NSRIT institution not found.")
        return
    
    inst_id = institutions[0]["id"]
    print(f"✅ Institution NSRIT found (ID: {inst_id})")
    
    # 2. Departments
    departments = await supabase_db.fetch_all("departments", {"institution_id": inst_id})
    dept_map = {d["id"]: d["department_name"] for d in departments}
    print(f"\nFound {len(departments)} departments:")
    
    # 3. Users
    all_users = await supabase_db.fetch_all("users")
    nsrit_users = [u for u in all_users if u["email"].endswith("@nsrit.edu")]
    print(f"--- User Audit ---\nFound {len(nsrit_users)} NSRIT users.")
    
    user_details = []
    for u in nsrit_users:
        role = u.get("role", "N/A")
        dept_id = u.get("department_id")
        dept_name = dept_map.get(dept_id, "N/A")
        
        user_details.append({
            "name": u["name"],
            "email": u["email"],
            "role": role,
            "dept": dept_name
        })

    # Sort by role and then email
    role_order = {"admin": 0, "hod": 1, "teacher": 2, "student": 3}
    user_details.sort(key=lambda x: (role_order.get(x["role"], 99), x["email"]))

    print("\n| Role | Name | Email | Department |")
    print("|---|---|---|---|")
    
    # Filter for the core users requested (plus a few students) to keep output readable
    # But I should show the requested ones
    core_emails = [
        "admin@nsrit.edu",
        "cse_hod@nsrit.edu", "cse_teacher@nsrit.edu",
        "ece_hod@nsrit.edu", "ece_teacher@nsrit.edu",
        "eee_hod@nsrit.edu", "eee_teacher@nsrit.edu",
        "mech_hod@nsrit.edu", "mech_teacher@nsrit.edu",
        "civil_hod@nsrit.edu", "civil_teacher@nsrit.edu",
        "aids_hod@nsrit.edu", "aids_teacher@nsrit.edu",
        "student1@nsrit.edu", "student2@nsrit.edu", "student3@nsrit.edu"
    ]
    
    for ud in user_details:
        if ud["email"] in core_emails or ud["role"] != "student":
            print(f"| {ud['role'].upper()} | {ud['name']} | {ud['email']} | {ud['dept']} |")
        elif ud["email"].startswith("student") and ud["email"] in core_emails: # ensure student 1,2,3 shown
             print(f"| {ud['role'].upper()} | {ud['name']} | {ud['email']} | {ud['dept']} |")

    # If there are 286 users, they are mostly students. Let's summarize them.
    student_count = sum(1 for ud in user_details if ud["role"] == "student")
    print(f"\nTotal Students: {student_count} (3 core test students + {student_count-3} additional)")

if __name__ == "__main__":
    asyncio.run(verify_nsrit())
