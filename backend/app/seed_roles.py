import asyncio
import json
from datetime import datetime
from app.store.user_store import UserStore
from app.store.parent_store import ParentStore
from app.store.mentor_store import MentorStore
from app.store.counselor_store import CounselorStore
from app.store.researcher_store import ResearcherStore
from app.store.content_creator_store import ContentCreatorStore
from app.store.student_store import StudentStore
from app.core.logging import structlog

log = structlog.get_logger()

async def seed_roles():
    user_store = UserStore()
    parent_store = ParentStore()
    mentor_store = MentorStore()
    counselor_store = CounselorStore()
    researcher_store = ResearcherStore()
    creator_store = ContentCreatorStore()
    student_store = StudentStore()

    password = "DemoPassword123!"
    
    roles_to_seed = [
        {"email": "student@lumina.ai", "name": "Sam Student", "role": "student"},
        {"email": "teacher@lumina.ai", "name": "Terry Teacher", "role": "teacher"},
        {"email": "admin@lumina.ai", "name": "Alex Admin", "role": "admin"},
        {"email": "parent@lumina.ai", "name": "Pat Parent", "role": "parent"},
        {"email": "mentor@lumina.ai", "name": "Morgan Mentor", "role": "mentor"},
        {"email": "counselor@lumina.ai", "name": "Chris Counselor", "role": "counselor"},
        {"email": "researcher@lumina.ai", "name": "Robin Researcher", "role": "researcher"},
        {"email": "creator@lumina.ai", "name": "Casey Creator", "role": "content_creator"},
    ]

    created_users = {}

    print("--- Seeding Users ---")
    for r in roles_to_seed:
        try:
            # Check if user exists first to avoid errors
            existing = await user_store.get_user_by_email(r["email"])
            if not existing:
                print(f"Creating {r['role']}: {r['email']}...")
                user = await user_store.create_user(
                    email=r["email"],
                    password=password,
                    full_name=r["name"],
                    role=r["role"]
                )
                created_users[r["role"]] = user
            else:
                print(f"User {r['email']} already exists.")
                created_users[r["role"]] = existing
        except Exception as e:
            print(f"Error seeding user {r['email']}: {e}")

    student_id = created_users.get("student", {}).get("id")
    teacher_id = created_users.get("teacher", {}).get("id")
    
    if student_id:
        print("\n--- Seeding Role-Specific Data ---")
        
        # 1. Parent Data
        parent_id = created_users.get("parent", {}).get("id")
        if parent_id:
            print("Seeding Parent data...")
            # Link parent to student
            await parent_store.db.insert("parent_child_links", {
                "parent_id": parent_id,
                "child_id": student_id,
                "verified_by_admin": True
            })
            await parent_store.create_goal(parent_id, student_id, "Complete the Advanced Physics module by Friday and achieve 90% mastery.")
            
            parent_msg = {
                "parent_id": parent_id,
                "content": "Welcome to Lumina Parent Portal. You can now track your child's progress."
            }
            if teacher_id:
                parent_msg["teacher_id"] = teacher_id
                
            await parent_store.db.insert("parent_messages", parent_msg)

        # 2. Mentor Data
        mentor_id = created_users.get("mentor", {}).get("id")
        if mentor_id:
            print("Seeding Mentor data...")
            await mentor_store.db.insert("mentor_matches", {
                "mentor_id": mentor_id,
                "mentee_id": student_id,
                "status": "active"
            })
            await mentor_store.schedule_session(
                mentor_id, 
                student_id, 
                datetime.now().isoformat(), 
                "Initial career guidance focus session."
            )

        # 3. Counselor Data
        counselor_id = created_users.get("counselor", {}).get("id")
        if counselor_id:
            print("Seeding Counselor data...")
            await counselor_store.db.insert("counselor_assignments", {
                "counselor_id": counselor_id,
                "student_id": student_id
            })
            await counselor_store.add_note(counselor_id, student_id, "Student expressions interest in deep learning and AI Ethics.")

        # 4. Researcher Data
        researcher_id = created_users.get("researcher", {}).get("id")
        if researcher_id:
            print("Seeding Researcher data...")
            await researcher_store.log_query(researcher_id, {"subject": "STEM", "metric": "average_mastery", "year": 2026})
            
            # Seed Anonymised Snapshots
            snapshots = [
                {
                    "snapshot_date": "2026-03-01",
                    "dataset_type": "STEM_Mastery_Q1",
                    "data_json": {"metrics": {"avg_mastery": 0.85}, "cohort_size": 1200},
                    "institution_id_hash": "hash_stem_001"
                },
                {
                    "snapshot_date": "2026-03-05",
                    "dataset_type": "Humanities_Engagement",
                    "data_json": {"metrics": {"engagement_score": 92}, "cohort_size": 850},
                    "institution_id_hash": "hash_hum_002"
                },
                {
                    "snapshot_date": "2026-03-10",
                    "dataset_type": "Global_Peer_Network",
                    "data_json": {"metrics": {"network_density": 0.45}, "cohort_size": 2100},
                    "institution_id_hash": "hash_global_003"
                }
            ]
            for snap in snapshots:
                await researcher_store.db.insert("anonymised_snapshots", snap)

        # 5. Creator Data
        creator_id = created_users.get("content_creator", {}).get("id")
        if creator_id:
            print("Seeding Creator data...")
            blueprint = await creator_store.create_blueprint(
                creator_id, 
                "Quantum Computing for Beginners", 
                {"objectives": ["Understand qubits", "Superposition", "Entanglement"]}
            )
            if blueprint:
                await creator_store.add_lesson_sequence(blueprint["id"], [
                    {"title": "Introduction to Qubits", "type": "video", "order": 1},
                    {"title": "The Bloch Sphere", "type": "interactive", "order": 2}
                ])
                
            # Add another blueprint for variety
            bp2 = await creator_store.create_blueprint(
                creator_id,
                "Ethics in Artificial Intelligence",
                {"objectives": ["Bias Detection", "Transparency", "Accountability"]}
            )
            if bp2:
                await creator_store.add_lesson_sequence(bp2["id"], [
                    {"title": "Historical Context of Bias", "type": "text", "order": 1},
                    {"title": "Algorithmic Fairness", "type": "quiz", "order": 2}
                ])

    print("\n--- Seeding Complete ---")

if __name__ == "__main__":
    asyncio.run(seed_roles())
