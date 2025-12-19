import os
import certifi
import datetime
from pymongo import MongoClient
from bson.objectid import ObjectId

# New URI
URI = "mongodb+srv://Vercel-Admin-atlas-orange-notebook:ejVMdYwUJGHEGDE2@atlas-orange-notebook.tmc7uan.mongodb.net/?retryWrites=true&w=majority"
DB_NAME = "lumina-database"

def seed():
    print(f"Connecting to {URI.split('@')[1]}...")
    client = MongoClient(URI, tlsCAFile=certifi.where())
    db = client[DB_NAME]
    
    # 1. Clear existing (optional, but good for seed)
    # print("Clearing existing data...")
    # db.users.delete_many({})
    # db.courses.delete_many({})
    # db.progress.delete_many({})
    
    # 2. Users
    print("Creating Users...")
    users = [
        {
            "email": "student@lumina.com",
            "password": "$2a$10$X7.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1", # Hash for 'student123' (mock)
            "name": "Alex Student",
            "role": "student",
            "avatar": "https://ui-avatars.com/api/?name=Alex+Student&background=random",
            "status": "active",
            "createdAt": datetime.datetime.utcnow(),
            "bio": "Eager learner",
            "skills": ["Python", "Math"]
        },
        {
            "email": "teacher@lumina.com",
            "password": "hashed_teacher_pass", 
            "name": "Prof. Sarah",
            "role": "teacher",
            "avatar": "https://ui-avatars.com/api/?name=Sarah+Teacher&background=random",
            "status": "active",
            "createdAt": datetime.datetime.utcnow(),
            "bio": "Senior Lecturer in AI",
            "skills": ["Teaching", "AI"]
        },
         {
            "email": "admin@lumina.com",
            "password": "hashed_admin_pass", 
            "name": "System Admin",
            "role": "admin",
            "avatar": "https://ui-avatars.com/api/?name=System+Admin&background=000000&color=fff",
            "status": "active",
            "createdAt": datetime.datetime.utcnow(),
            "bio": "Admin",
            "skills": ["Ops"]
        }
    ]
    
    user_ids = []
    for u in users:
        # Upsert by email to avoid dupes
        res = db.users.update_one({"email": u["email"]}, {"$set": u}, upsert=True)
        # Fetch actual ID
        doc = db.users.find_one({"email": u["email"]})
        user_ids.append(doc["_id"])
        print(f"User {u['email']} upserted: {doc['_id']}")

    student_id = user_ids[0]
    teacher_id = user_ids[1]

    # 3. Courses
    print("Creating Courses...")
    course_data = {
        "name": "Introduction to Artificial Intelligence",
        "description": "Learn the basics of AI, Machine Learning, and Neural Networks.",
        "instructorId": str(teacher_id),
        "thumbnail": "https://images.unsplash.com/photo-1677442136019-21780ecad995",
        "level": "Beginner",
        "status": "Active",
        "enrolledCount": 1,
        "createdAt": datetime.datetime.utcnow(),
        "modules": [
            {
                "id": "mod_1",
                "title": "Module 1: What is AI?",
                "lessons": [
                    {
                        "id": "les_1_1",
                        "title": "History of AI",
                        "content": "AI started in 1956...",
                        "type": "text"
                    },
                     {
                        "id": "les_1_2",
                        "title": "Types of AI",
                        "content": "Narrow vs General AI...",
                        "type": "text"
                    }
                ]
            }
        ]
    }
    
    course_res = db.courses.update_one({"name": course_data["name"]}, {"$set": course_data}, upsert=True)
    course_doc = db.courses.find_one({"name": course_data["name"]})
    course_id = course_doc["_id"]
    print(f"Course upserted: {course_id}")

    # 4. Enroll Student
    print("Enrolling Student...")
    progress_data = {
        "userId": str(student_id),
        "courseId": str(course_id),
        "progress": 25,
        "mastery": 80,
        "streak": 3,
        "lastAccessed": datetime.datetime.utcnow(),
        "enrolledAt": datetime.datetime.utcnow()
    }
    
    db.progress.update_one(
        {"userId": str(student_id), "courseId": str(course_id)},
        {"$set": progress_data},
        upsert=True
    )
    print("Progress upserted.")
    
    print("\n✅ Database Seeded Successfully!")

if __name__ == "__main__":
    seed()
