import os
import uuid
from datetime import datetime
from pymongo import MongoClient
from passlib.context import CryptContext

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password):
    return pwd_context.hash(password)


def seed_users():
    mongo_url = os.getenv("MONGODB_URI", "mongodb://localhost:27017/lumina_db")
    # Base URL without DB name for client
    base_url = mongo_url.split("/")[0] + "//" + mongo_url.split("/")[2]
    db_name = mongo_url.split("/")[-1] if "/" in mongo_url.split("//")[-1] else "lumina_db"

    print(f"Connecting to {base_url} (DB: {db_name})")
    client = MongoClient(base_url)
    db = client[db_name]

    demo_users = [
        {
            "email": "student@lumina.com",
            "password": "student123",
            "name": "Alex Student",
            "role": "student",
            "bio": "Enthusiastic Learner",
            "skills": ["Coding", "Design"],
            "location": "Lumina Virtual Campus",
        },
        {
            "email": "teacher@lumina.com",
            "password": "teacher123",
            "name": "Jane Teacher",
            "role": "teacher",
            "bio": "Experienced Educator",
            "skills": ["Subject Matter Expert", "Pedagogy"],
            "location": "Lumina Virtual Campus",
        },
        {
            "email": "admin@lumina.com",
            "password": "Admin@123",
            "name": "Super Admin",
            "role": "admin",
            "bio": "System Administrator",
            "skills": ["Administration", "Management"],
            "location": "Lumina Virtual Campus",
        }
    ]

    for user_data in demo_users:
        email = user_data["email"]
        password = user_data["password"]
        role = user_data["role"]

        existing = db.users.find_one({"email": email})
        if existing:
            print(f"User {email} already exists. Updating password and role...")
            db.users.update_one(
                {"email": email},
                {"$set": {"hashed_password": get_password_hash(password), "role": role}},
            )
        else:
            print(f"Creating user {email}...")
            user = {
                "id": str(uuid.uuid4()),
                "email": email,
                "hashed_password": get_password_hash(password),
                "name": user_data["name"],
                "role": role,
                "status": "active",
                "avatar": f"https://ui-avatars.com/api/?name={user_data['name'].replace(' ', '+')}&background=random",
                "createdAt": datetime.now().isoformat(),
                "bio": user_data["bio"],
                "skills": user_data["skills"],
                "location": user_data["location"],
            }
            db.users.insert_one(user)

    print("Seed complete.")


if __name__ == "__main__":
    seed_users()
