import asyncio
import os
import uuid
import random
from typing import Dict, Any, List

# Setup environment for Supabase
os.environ["SUPABASE_URL"] = "https://ncofwpuabtxddvdjljgj.supabase.co"
# Note: Ensure SUPABASE_SERVICE_ROLE_KEY is in the environment for bypass RLS

from app.database.supabase_manager import supabase_db
from app.store.user_store import UserStore

async def seed_nsrit():
    print("🚀 Starting NSRIT Data Seeding...")
    client = supabase_db.get_client()
    user_store = UserStore()

    # 1. Update/Create Institution: Nadimpalli Satyanarayana Raju Institute of Technology (NSRIT)
    print("🏫 Setting up Institution: NSRIT...")
    inst_response = client.table("institutions").select("*").limit(1).execute()
    if inst_response.data:
        inst_id = inst_response.data[0]["id"]
        client.table("institutions").update({
            "institution_name": "Nadimpalli Satyanarayana Raju Institute of Technology"
        }).eq("id", inst_id).execute()
    else:
        inst_id = str(uuid.uuid4())
        client.table("institutions").insert({
            "id": inst_id,
            "institution_name": "Nadimpalli Satyanarayana Raju Institute of Technology",
            "email": "contact@nsrit.edu.in",
            "onboarding_status": "ACTIVE"
        }).execute()
    
    # 2. Define Departments
    departments_data = [
        {"name": "Computer Science and Engineering", "code": "CSE"},
        {"name": "Electronics and Communication Engineering", "code": "ECE"},
        {"name": "Mechanical Engineering", "code": "MECH"},
        {"name": "Civil Engineering", "code": "CIVIL"}
    ]

    dept_ids = {}

    for dept in departments_data:
        print(f"🏢 Processing Department: {dept['name']}")
        # Check if dept exists
        existing = client.table("departments").select("id").eq("department_name", dept["name"]).eq("institution_id", inst_id).execute()
        if existing.data:
            d_id = existing.data[0]["id"]
        else:
            d_id = str(uuid.uuid4())
            client.table("departments").insert({
                "id": d_id,
                "institution_id": inst_id,
                "department_name": dept["name"],
                "description": f"Department of {dept['name']} at NSRIT."
            }).execute()
        
        dept_ids[dept["code"]] = d_id
        
        # 3. Create HOD for this department
        hod_email = f"hod.{dept['code'].lower()}@nsrit.edu.in"
        existing_hod = client.table("users").select("id").eq("email", hod_email).execute()
        
        if existing_hod.data:
            hod_id = existing_hod.data[0]["id"]
        else:
            hod_pw = f"hod{dept['code']}123"
            try:
                # Need to use admin API to bypass normal limitations potentially, but user_store works
                # Generate unique email if collision
                print(f"👤 Creating HOD: {hod_email}")
                new_hod = await user_store.create_user(
                    email=hod_email,
                    password=hod_pw,
                    full_name=f"HOD {dept['code']}",
                    role="hod"
                )
                hod_id = new_hod["id"]
                # Update user with dept
                client.table("users").update({"department_id": d_id}).eq("id", hod_id).execute()
            except Exception as e:
                print(f"Error creating HOD {hod_email}: {e}")
                continue

        # Link HOD to Department
        client.table("departments").update({"hod_id": hod_id}).eq("id", d_id).execute()

        # 4. Create Program for this department
        prog_name = f"B.Tech in {dept['name']}"
        existing_prog = client.table("programs").select("id").eq("program_name", prog_name).eq("institution_id", inst_id).execute()
        if existing_prog.data:
            prog_id = existing_prog.data[0]["id"]
        else:
            prog_id = str(uuid.uuid4())
            client.table("programs").insert({
                "id": prog_id,
                "institution_id": inst_id,
                "program_name": prog_name,
                "department_id": d_id, # If applicable
                "level": "Undergraduate",
                "duration_years": 4
            }).execute()

        # 5. Create Semesters for this program (1 to 8)
        sem_ids = []
        for sem in range(1, 9):
            sem_name = f"Semester {sem}"
            existing_sem = client.table("semesters").select("id").eq("program_id", prog_id).eq("semester_number", sem).execute()
            if existing_sem.data:
                s_id = existing_sem.data[0]["id"]
            else:
                s_id = str(uuid.uuid4())
                client.table("semesters").insert({
                    "id": s_id,
                    "program_id": prog_id,
                    "term_name": sem_name,
                    "semester_number": sem,
                    "credits_required": 24
                }).execute()
            sem_ids.append(s_id)

        # 6. Create 6 Faculty members for the department (who will teach courses in these semesters)
        print(f"👨‍🏫 Creating 6 Faculty members for {dept['code']}...")
        faculty_ids = []
        for i in range(1, 7):
            fac_email = f"faculty{i}.{dept['code'].lower()}@nsrit.edu.in"
            fac_pw = "faculty123"
            existing_fac = client.table("users").select("id").eq("email", fac_email).execute()
            if existing_fac.data:
                f_id = existing_fac.data[0]["id"]
            else:
                try:
                    new_fac = await user_store.create_user(
                        email=fac_email,
                        password=fac_pw,
                        full_name=f"{dept['code']} Professor {i}",
                        role="teacher"
                    )
                    f_id = new_fac["id"]
                    client.table("users").update({"department_id": d_id}).eq("id", f_id).execute()
                except Exception as e:
                    print(f"Error creating faculty {fac_email}: {e}")
                    continue
            faculty_ids.append(f_id)

    print("✅ NSRIT Seeding Completed Successfully!")
    print("\\n--- Login Credentials Provided ---")
    print("Institution: Nadimpalli Satyanarayana Raju Institute of Technology")
    print("Admin: admin@lumin.com / admin123")
    print("HOD Example: hod.cse@nsrit.edu.in / hodcse123 (Roles: hod)")
    print("Faculty Example: faculty1.cse@nsrit.edu.in / faculty123 (Roles: teacher)")

if __name__ == "__main__":
    asyncio.run(seed_nsrit())
