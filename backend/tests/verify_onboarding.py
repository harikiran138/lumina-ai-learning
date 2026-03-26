import asyncio
import os
import sys
import uuid
from dotenv import load_dotenv

# Ensure the app directory is in the path
sys.path.append(os.path.join(os.getcwd(), "backend"))

load_dotenv()

from app.store.user_store import UserStore
from app.store.institution_store import InstitutionStore
from app.database.supabase_manager import supabase_db

async def run_verification():
    print("🧪 Starting Onboarding & Init Verification...")
    
    await supabase_db.connect()
    user_store = UserStore()
    inst_store = InstitutionStore()
    
    try:
        # 1. Verify Admin exists (or create one for testing)
        print("1️⃣ Checking users...")
        users = await user_store.list_all_users()
        admin = next((u for u in users if u.get("role") == "admin"), None)
        
        if not admin:
            print("   - No admin found. Creating test admin...")
            admin = await user_store.create_user(
                email=f"test.admin.{uuid.uuid4().hex[:6]}@example.com",
                password="TestPassword123",
                full_name="Test Admin",
                role="admin"
            )
        print(f"   - Admin verified: {admin['email']}")

        # 2. test Institution Creation (Default Status)
        print("2️⃣ Testing Institution Creation...")
        inst_name = f"Test Inst {uuid.uuid4().hex[:6]}"
        new_inst = await inst_store.create_institution({
            "institution_name": inst_name,
            "type": "Private",
            "city": "Test City"
        })
        
        print(f"   - Institution created: {new_inst['institution_name']}")
        print(f"   - Status: {new_inst.get('onboarding_status')}")
        
        if new_inst.get('onboarding_status') != "PENDING":
            print(f"❌ FAILED: Expected status PENDING, got {new_inst.get('onboarding_status')}")
        else:
            print("✅ Status is PENDING as expected.")

        # 3. Test Stakeholder Linking (Auto-Activation)
        print("3️⃣ Testing Stakeholder Linking & Auto-Activation...")
        # Create a test student
        student = await user_store.create_user(
            email=f"test.student.{uuid.uuid4().hex[:6]}@example.com",
            password="TestPassword123",
            full_name="Test Student",
            role="student"
        )
        
        print(f"   - Linking student {student['email']} to {inst_name}...")
        await inst_store.create_stakeholder({
            "user_id": student["id"],
            "institution_id": new_inst["id"],
            "category": "Student",
            "name": student["name"],
            "email": student["email"]
        })
        
        # Check institution status again
        updated_inst = await inst_store.get_institution(new_inst["id"])
        print(f"   - Updated Status: {updated_inst.get('onboarding_status')}")
        
        if updated_inst.get('onboarding_status') == "ACTIVE":
            print("✅ Institution auto-activated successfully!")
        else:
            print(f"❌ FAILED: Status did not update to ACTIVE. Got {updated_inst.get('onboarding_status')}")

        # 4. Cleanup
        print("🧹 Cleaning up test data...")
        await user_store.delete_user(student["id"])
        # (Optional: Delete institution if possible, but keep it if you want to see it in DB)
        
    except Exception as e:
        print(f"❌ Verification failed with error: {e}")
    finally:
        await supabase_db.close()

if __name__ == "__main__":
    asyncio.run(run_verification())
