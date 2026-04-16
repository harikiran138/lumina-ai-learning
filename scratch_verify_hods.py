import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.database.supabase_manager import supabase_db

async def verify_hod_mapping():
    print("--- Verifying HOD Mapping in Departments ---")
    
    # 1. Institutions
    institutions = await supabase_db.fetch_all("institutions", {"institution_name": "NSRIT"})
    inst_id = institutions[0]["id"]
    
    # 2. Departments
    departments = await supabase_db.fetch_all("departments", {"institution_id": inst_id})
    
    print("| Department | HOD Email | Verification |")
    print("|---|---|---|")
    
    for dept in departments:
        hod_id = dept.get("hod_id")
        status = "❌ Missing HOD"
        hod_email = "N/A"
        
        if hod_id:
            hod = await supabase_db.fetch_all("users", {"id": hod_id})
            if hod:
                hod_email = hod[0]["email"]
                if hod[0]["role"] == "hod" and hod[0]["department_id"] == dept["id"]:
                    status = "✅ Verified"
                else:
                    status = f"⚠️ Role/Dept Mismatch (Role: {hod[0]['role']})"
            else:
                status = "❌ User ID not found"
        
        print(f"| {dept['department_name']} | {hod_email} | {status} |")

if __name__ == "__main__":
    asyncio.run(verify_hod_mapping())
