import asyncio
import os
import sys
from datetime import datetime

# Ensure backend path is in sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.security import get_password_hash
from app.database.supabase_manager import supabase_db
from app.core.logging import structlog

log = structlog.get_logger()

async def seed_verification_users():
    print("🚀 Seeding Verification Users...")
    client = supabase_db.get_client()

    # 1. Ensure a default institution exists
    try:
        inst_resp = client.table("institutions").select("*").limit(1).execute()
        if not inst_resp.data:
            print("Creating default institution...")
            inst_data = {
                "institution_name": "NSRIT Demo College",
                "email": "admin@nsrit.edu.in",
                "onboarding_status": "COMPLETED"
            }
            inst_resp = client.table("institutions").insert(inst_data).execute()
            college_id = inst_resp.data[0]["id"]
        else:
            college_id = inst_resp.data[0]["id"]
        print(f"✅ Institution ID: {college_id}")
    except Exception as e:
        print(f"⚠️ Could not ensure institution: {e}")
        college_id = None

    # 2. Define Demo Users
    demo_users = [
        {
            "email": "student_22nu1a0519@lumina.com",
            "password": "student@123",
            "name": "Harikiran (Demo Student)",
            "role": "student",
            "roll_number": "22NU1A0519",
        },
        {
            "email": "faculty_fac001@lumina.com",
            "password": "faculty@123",
            "name": "Dr. Smith (Demo Faculty)",
            "role": "faculty",
            "employee_id": "FAC001",
        },
        {
            "email": "hod_hod001@lumina.com",
            "password": "admin@123",
            "name": "Prof. Johnson (Demo HOD)",
            "role": "hod",
            "employee_id": "HOD001",
        },
        {
            "email": "admin@demo.nsrit.edu.in",
            "password": "admin@123",
            "name": "System Administrator",
            "role": "admin",
            "employee_id": "ADM001",
        }
    ]

    for user in demo_users:
        # Check if user exists by email or identifier
        identifier = user.get("roll_number") or user.get("employee_id")
        existing = client.table("users").select("*").eq("email", user["email"]).execute()
        
        if not existing.data and identifier:
            if "roll_number" in user:
                existing = client.table("users").select("*").eq("roll_number", user["roll_number"]).execute()
            else:
                existing = client.table("users").select("*").eq("employee_id", user["employee_id"]).execute()

        hashed = get_password_hash(user["password"])
        user_record = {
            "email": user["email"],
            "password_hash": hashed,
            "name": user["name"],
            "role": user["role"],
            "is_active": True,
            "college_id": college_id,
        }
        
        if "roll_number" in user:
            user_record["roll_number"] = user["roll_number"]
        if "employee_id" in user:
            user_record["employee_id"] = user["employee_id"]

        try:
            if existing.data:
                print(f"Updating user {user['email']} / {identifier}...")
                client.table("users").update(user_record).eq("id", existing.data[0]["id"]).execute()
            else:
                print(f"Creating user {user['email']} / {identifier}...")
                client.table("users").insert(user_record).execute()
        except Exception as e:
            print(f"❌ Failed to seed user {user['email']}: {e}")

    print("🎉 Verification users seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed_verification_users())
