import asyncio

from app.store.user_store import UserStore

async def seed_users():
    user_store = UserStore()
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
        existing = await user_store.get_user_by_email(email)
        if existing:
            print(f"User {email} already exists.")
        else:
            print(f"Creating user {email}...")
            await user_store.create_user(
                email=email,
                password=user_data["password"],
                full_name=user_data["name"],
                role=user_data["role"],
            )

    print("Seed complete.")


if __name__ == "__main__":
    asyncio.run(seed_users())
