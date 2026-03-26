import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.abspath("."))

from app.database.supabase_manager import supabase_db

async def main():
    print("Seeding HOD Hierarchy...")
    
    # 1. Get the first institution
    print("Fetching institutions...")
    insts = await supabase_db.fetch_all("institutions")
    if not insts:
        print("Trying public.institutions...")
        insts = await supabase_db.fetch_all("public.institutions")
    
    if not insts:
        print("No institutions found in institutions or public.institutions.")
        # Debug: list some tables
        return
    
    inst_id = insts[0]["id"]
    print(f"Using Institution: {inst_id}")

    # 2. Check if departments exist
    depts = await supabase_db.fetch_all("departments")
    if not depts:
        print("Creating departments...")
        await supabase_db.insert("departments", {
            "institution_id": inst_id,
            "department_name": "Computer Science and Engineering",
            "description": "Department of CSE focusing on AI and Software Engineering."
        })
        await supabase_db.insert("departments", {
            "institution_id": inst_id,
            "department_name": "Electronics and Communication Engineering",
            "description": "Department of ECE focusing on VLSI and Robotics."
        })
        depts = await supabase_db.fetch_all("departments")

    cse_dept_id = next(d["id"] for d in depts if "Computer Science" in d["department_name"])
    print(f"CSE Department ID: {cse_dept_id}")

    # 3. Assign HOD
    # Find a teacher to promote to HOD
    teachers = await supabase_db.fetch_all("users", {"role": "teacher"})
    if teachers:
        hod_candidate = teachers[0]
        print(f"Assigning HOD role to: {hod_candidate['email']}")
        await supabase_db.update("users", {"role": "hod", "department_id": cse_dept_id}, {"id": hod_candidate["id"]})
        await supabase_db.update("departments", {"hod_id": hod_candidate["id"]}, {"id": cse_dept_id})
        
        # Assign other teachers to this department
        for t in teachers[1:4]:
            print(f"Assigning teacher {t['email']} to CSE")
            await supabase_db.update("users", {"department_id": cse_dept_id}, {"id": t["id"]})
    else:
        print("No teachers found to promote to HOD.")

    print("Seeding complete.")

if __name__ == "__main__":
    asyncio.run(main())
