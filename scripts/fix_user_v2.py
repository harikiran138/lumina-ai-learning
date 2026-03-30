import asyncio
import sys
import argparse
from dotenv import load_dotenv
from app.store.user_store import UserStore
from app.core.security import get_password_hash

async def fix_user(email, role, password):
    load_dotenv()
    store = UserStore()
    client = store.db.get_client()
    
    updates = {}
    if role:
        updates["role"] = role
    if password:
        updates["password_hash"] = get_password_hash(password)
        
    print(f"Updating user {email} with {updates}...")
    result = client.table("users").update(updates).eq("email", email).execute()
    
    if result.data:
        print(f"✅ User updated: {result.data[0]['email']} (Role: {result.data[0]['role']})")
    else:
        print(f"❌ User {email} not found.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--email", required=True)
    parser.add_argument("--role")
    parser.add_argument("--password")
    args = parser.parse_args()
    
    asyncio.run(fix_user(args.email, args.role, args.password))
