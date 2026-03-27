import asyncio
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.store.user_store import UserStore
from app.database.supabase_manager import supabase_db

async def seed_demo_roles():
    print("🚀 Seeding Lumina Demo Roles...")
    user_store = UserStore()
    
    demo_password = "DemoPassword123!"
    
    roles = [
        {"email": "student@lumina.ai", "name": "Sam Student", "role": "student"},
        {"email": "teacher@lumina.ai", "name": "Tara Teacher", "role": "teacher"},
        {"email": "admin@lumina.ai", "name": "Alex Admin", "role": "admin"},
        {"email": "parent@lumina.ai", "name": "Pat Parent", "role": "parent"},
        {"email": "mentor@lumina.ai", "name": "Molly Mentor", "role": "mentor"},
        {"email": "counselor@lumina.ai", "name": "Casey Counselor", "role": "counselor"},
        {"email": "researcher@lumina.ai", "name": "Ray Researcher", "role": "researcher"},
        {"email": "creator@lumina.ai", "name": "Chris Creator", "role": "content_creator"},
    ]
    
    for user in roles:
        try:
            # Check if user exists
            existing = await user_store.get_user_by_email(user["email"])
            if existing:
                print(f"✅ {user['role'].capitalize()} already exists: {user['email']}")
                # Ensure role is correct
                if existing["role"] != user["role"]:
                    await user_store.update_user_role(existing["id"], user["role"])
                    print(f"   🔄 Updated role to {user['role']}")
                continue
            
            # Create user
            await user_store.create_user(
                email=user["email"],
                password=demo_password,
                full_name=user["name"],
                role=user["role"]
            )
            print(f"✨ Created {user['role'].capitalize()}: {user['email']}")
        except Exception as e:
            print(f"❌ Failed to seed {user['role']}: {str(e)}")

    print("\n🎉 Seeding complete! All roles are ready for verification.")

if __name__ == "__main__":
    asyncio.run(seed_demo_roles())
