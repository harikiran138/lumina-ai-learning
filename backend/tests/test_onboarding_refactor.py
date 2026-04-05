import asyncio
import os
import uuid
from datetime import datetime
from app.store.parent_store import ParentStore
from app.store.user_data_store import UserDataStore
from app.store.user_store import UserStore
from app.database.supabase_manager import supabase_db, clear_global_mock_tables
from app.core.logging import structlog

log = structlog.get_logger()

async def verify_onboarding_integration():
    print("\n--- Starting Onboarding Integration Verification ---")
    
    # Force local mock DB
    os.environ["LUMINA_FORCE_LOCAL_DB"] = "1"
    clear_global_mock_tables()
    
    user_data_store = UserDataStore()
    user_store = UserStore()
    
    # Setup Mock Data
    parent_id = str(uuid.uuid4())
    print(f"Testing with Parent ID: {parent_id}")
    
    # 1. Create Parent User
    await supabase_db.table("users").insert([
        {
            "id": parent_id, 
            "email": "parent_test@example.com", 
            "full_name": "Initial Name", 
            "role": "parent",
            "onboarding_step": 0
        }
    ]).async_execute()
    
    print("\n[1/3] Testing: User Profile Updates...")
    # Simulate step 1 details
    full_name = "Refactored Parent Name"
    relationship = "Mother"
    
    updates = {
        "full_name": full_name,
        "name": full_name,
        "onboarding_step": 1,
        "updated_at": datetime.utcnow().isoformat()
    }
    
    success = await user_store.update_user_fields(parent_id, updates)
    if success:
        updated_user = await user_store.get_user_by_id(parent_id)
        if updated_user["full_name"] == full_name and updated_user["onboarding_step"] == 1:
            print(f"✅ User profile updated: {updated_user['full_name']} (Step {updated_user['onboarding_step']})")
        else:
            print(f"❌ User profile update mismatch: {updated_user}")
            return
    else:
        print("❌ User profile update failed")
        return

    print("\n[2/3] Testing: UserDataStore Progress Logic...")
    # Simulate the progress saving logic from the refactored router
    try:
        progress = await user_data_store.get_progress(parent_id) or {}
        # Ensure we got a dict even if it was None
        if progress == {}:
            print("✅ Handled missing progress (new user) correctly")
        
        step_payload = {"full_name": full_name, "relationship": relationship}
        progress["step_1"] = step_payload
        progress["onboarding_step"] = 1
        progress["relationship"] = relationship
        
        save_success = await user_data_store.set_progress(parent_id, progress)
        if save_success:
            print("✅ Progress saved via set_progress")
            
            # Verify retrieval
            refetched_progress = await user_data_store.get_progress(parent_id)
            if refetched_progress and refetched_progress.get("onboarding_step") == 1:
                print(f"✅ Verified progress persistence: {refetched_progress}")
            else:
                print(f"❌ Progress retrieval failed or incorrect: {refetched_progress}")
                return
        else:
            print("❌ set_progress failed")
            return
    except Exception as e:
        print(f"❌ Exception in UserDataStore logic: {str(e)}")
        return

    print("\n[3/3] Testing: Learner Profile Updates...")
    try:
        profile_data = {
            "user_id": parent_id,
            "full_name": full_name,
            "role": "parent",
            "preferences": {"relationship": relationship, "onboarding_step": 1}
        }
        await supabase_db.table("learner_profiles").upsert(profile_data).async_execute()
        
        # Verify
        profile = (await supabase_db.table("learner_profiles").select("*").eq("user_id", parent_id).async_execute()).data
        if profile and profile[0]["full_name"] == full_name:
            print(f"✅ Learner profile upserted successfully")
        else:
            print(f"❌ Learner profile upsert failed: {profile}")
            return
    except Exception as e:
        print(f"❌ Exception in Learner Profile logic: {str(e)}")
        return

    print("\n--- Integration Verification Complete: SUCCESS ---")

if __name__ == "__main__":
    asyncio.run(verify_onboarding_integration())
