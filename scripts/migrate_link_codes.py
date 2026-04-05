import asyncio
import random
import string
import os
import sys

# Add backend directory to sys.path
backend_dir = os.path.join(os.getcwd(), "backend")
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

# Import dependencies
from app.database.supabase_manager import supabase_db

async def migrate_parent_link_codes():
    print("🚀 Starting Parent Link Code Migration...")
    client = supabase_db.get_client()
    
    # 1. Fetch all students
    # Note: We can't easily filter by null in list but we will handle it in loop
    response = await client.table("users")\
        .select("id, name, email, role, parent_link_code")\
        .eq("role", "student")\
        .execute()
    
    if not response.data:
        print("✅ No students found in the database.")
        return

    students = response.data
    updated_count = 0
    total_found = len(students)
    
    print(f"📋 Found {total_found} students. Checking codes...")
    
    for student in students:
        user_id = student["id"]
        current_code = student.get("parent_link_code")
        
        # If code is missing, None, or placeholder '--------'
        if not current_code or current_code == "--------":
            # Generate a unique 8-character code
            new_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
            
            # Update the user
            try:
                # Use standard supabase client directly
                await client.table("users").update({"parent_link_code": new_code}).eq("id", user_id).execute()
                print(f"✨ Generated code {new_code} for {student['name']} ({student['email']}).")
                updated_count += 1
            except Exception as e:
                print(f"❌ Failed to update {student['name']}: {str(e)}")

    print(f"\n🏁 Migration Complete! Found {total_found} students, updated {updated_count}.")

if __name__ == "__main__":
    asyncio.run(migrate_parent_link_codes())
