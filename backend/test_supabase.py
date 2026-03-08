import asyncio
import uuid
import sys
import os

# Ensure app is in Python path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.database.supabase_manager import supabase_db
from app.store.user_store import UserStore
from app.store.course_store import CourseStore
from app.store.user_data_store import UserDataStore

async def test_all_connections():
    print("🚀 Beginning Supabase tests...")
    
    # 1. Test Client Connection
    client = supabase_db.get_client()
    print("✅ Supabase client initialized natively.")
    
    # Generate unique test data
    test_id_base = uuid.uuid4().hex[:8]
    test_email = f"test_{test_id_base}@example.com"
    test_phone = f"+1555{uuid.uuid4().int % 1000000:06d}"
    test_course_code = f"TEST-{test_id_base.upper()}"
    
    user_store = UserStore()
    course_store = CourseStore()
    user_data_store = UserDataStore()

    test_user = None
    test_course = None
    
    try:
        # --- Create Data ---
        print(f"\n--- Testing Creates ---")
        
        # 1. Create User
        test_user = await user_store.create_user(
            email=test_email,
            password="testpassword",
            full_name=f"Supabase Test User {test_id_base}",
            role="student",
            phone=test_phone
        )
        print(f"✅ Created user: {test_user['id']} with email {test_email}")

        # 2. Create Course
        test_course = await course_store.create_course(
            name="Supabase Integration Test Course",
            code=test_course_code,
            description="A course to test DB logic",
            teacher_id=test_user['id']
        )
        print(f"✅ Created course: {test_course['id']} with code {test_course_code}")

        # 3. Add User Progress
        await user_data_store.update_progress_metric(
            user_id=test_user['id'],
            metric="current_module",
            value="module_1"
        )
        print("✅ Added progress record successfully")

        # --- Read Data ---
        print(f"\n--- Testing Reads ---")
        
        # 1. Fetch User
        fetched_user = await user_store.get_user_by_email(test_email)
        assert fetched_user['id'] == test_user['id'], "User ID mismatch"
        print("✅ Fetched user successfully via Email")

        # 2. Fetch Course
        fetched_course = await course_store.get_course_by_code(test_course_code)
        assert fetched_course['id'] == test_course['id'], "Course ID mismatch"
        print("✅ Fetched course successfully via Code")

        # 3. Fetch Progress
        doc = await user_data_store._get_or_create_user(test_user['id'])
        assert doc and doc.get("progress", {}).get('current_module') == "module_1", "Progress mismatch or not found"
        print("✅ Fetched progress successfully from UserDataStore")

        # --- Update Data ---
        print(f"\n--- Testing Updates ---")
        
        # 1. Update Course
        await course_store.update_course(test_course['id'], {"description": "Updated database logic description"})
        updated_course = await course_store.get_course_by_id(test_course['id'])
        assert updated_course['description'] == "Updated database logic description", "Course update failed"
        print("✅ Updated course details successfully")

        print("\n🎉 All Supabase tests passed successfully! Logical execution is verified.")

    except Exception as e:
        print(f"\n❌ Test Failed during execution: {e}")
        import traceback
        traceback.print_exc()
        
    finally:
        # --- Cleanup ---
        print(f"\n--- Cleaning Up ---")
        if test_course:
            try:
                await course_store.delete_course(test_course['id'])
                print(f"🧹 Cleared test course {test_course['id']}")
            except Exception as e:
                print(f"⚠️ Failed to delete course: {e}")
                
        if test_user:
            try:
                # Delete progress explicitly from user_data
                client.table('user_data').delete().eq('user_id', test_user['id']).execute()
                await user_store.delete_user(test_user['id'])
                print(f"🧹 Cleared test progress and user {test_user['id']}")
            except Exception as e:
                print(f"⚠️ Failed to delete user: {e}")

if __name__ == "__main__":
    asyncio.run(test_all_connections())
