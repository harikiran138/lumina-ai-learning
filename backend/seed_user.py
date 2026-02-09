import os
import uuid
from datetime import datetime
from pymongo import MongoClient
from passlib.context import CryptContext

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password):
    return pwd_context.hash(password)


def seed_student():
    mongo_url = os.getenv("MONGODB_URI", "mongodb://localhost:27017/lumina_db")
    # Base URL without DB name for client
    base_url = mongo_url.split("/")[0] + "//" + mongo_url.split("/")[2]
    db_name = mongo_url.split("/")[-1] if "/" in mongo_url.split("//")[-1] else "lumina_db"

    print(f"Connecting to {base_url} (DB: {db_name})")
    client = MongoClient(base_url)
    db = client[db_name]

    email = "student@lumina.com"
    password = "student123"

    existing = db.users.find_one({"email": email})
    if existing:
        print(f"User {email} already exists. Updating password...")
        db.users.update_one(
            {"email": email},
            {"$set": {"hashed_password": get_password_hash(password), "role": "student"}},
        )
    else:
        print(f"Creating user {email}...")
        user = {
            "id": str(uuid.uuid4()),
            "email": email,
            "hashed_password": get_password_hash(password),
            "name": "Alex Student",
            "role": "student",
            "status": "active",
            "avatar": "https://ui-avatars.com/api/?name=Alex+Student&background=random",
            "createdAt": datetime.now().isoformat(),
            "bio": "Enthusiastic Learner",
            "skills": ["Coding", "Design"],
            "location": "Lumina Virtual Campus",
        }
        db.users.insert_one(user)

    print("Seed complete.")


if __name__ == "__main__":
    seed_student()
