import asyncio
import json
from datetime import datetime, timedelta
from app.store.user_store import UserStore
from app.store.parent_store import ParentStore
from app.store.mentor_store import MentorStore
from app.store.counselor_store import CounselorStore
from app.store.researcher_store import ResearcherStore
from app.store.content_creator_store import ContentCreatorStore
from app.store.student_store import StudentStore
from app.store.peer_tutor_store import PeerTutorStore
from app.store.academic_store import AcademicStore
from app.core.logging import structlog

log = structlog.get_logger()

from app.database.supabase_manager import supabase_db

async def seed_roles():
    user_store = UserStore(db=supabase_db)
    parent_store = ParentStore(db=supabase_db)
    mentor_store = MentorStore(db=supabase_db)
    counselor_store = CounselorStore(db=supabase_db)
    researcher_store = ResearcherStore(db=supabase_db)
    creator_store = ContentCreatorStore(db=supabase_db)
    student_store = StudentStore(db=supabase_db)
    peer_tutor_store = PeerTutorStore(db=supabase_db)
    academic_store = AcademicStore(db=supabase_db)

    password = "DemoPassword123!"
    
    roles_to_seed = [
        {"email": "student@lumina.ai", "name": "Sam Student", "role": "student"},
        {"email": "teacher@lumina.ai", "name": "Terry Teacher", "role": "teacher"},
        {"email": "hod@lumina.ai", "name": "Harry HOD", "role": "hod"},
        {"email": "admin@lumina.ai", "name": "Alex Admin", "role": "college_admin"},
        {"email": "parent@lumina.ai", "name": "Pat Parent", "role": "parent"},
        {"email": "mentor@lumina.ai", "name": "Morgan Mentor", "role": "mentor"},
        {"email": "peertutor@lumina.ai", "name": "Peter Peer", "role": "peer_tutor"},
        {"email": "counselor@lumina.ai", "name": "Chris Counselor", "role": "counselor"},
        {"email": "researcher@lumina.ai", "name": "Robin Researcher", "role": "researcher"},
        {"email": "superadmin@lumina.ai", "name": "Sasha Super", "role": "super_admin"},
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
    hod_id = created_users.get("hod", {}).get("id")
    
    # 1. Setup Institutional Data (Department for HOD/Teacher)
    print("\n--- Seeding Institutional Data ---")
    dept_id = "dept_stem_001"
    try:
        await academic_store.db.insert("departments", {
            "id": dept_id,
            "department_name": "STEM & AI",
            "code": "STEM",
            "hod_id": hod_id,
            "institution_id": "inst_001"
        }, upsert=True)
        print(f"Department linked to HOD: {hod_id}")
    except Exception as e:
        print(f"Note: Department seeding info: {e}")

    if student_id:
        print("\n--- Seeding Role-Specific Data ---")
        
        # 1. Parent Data
        parent_id = created_users.get("parent", {}).get("id")
        if parent_id:
            print("Seeding Parent data...")
            await parent_store.db.insert("parent_child_links", {
                "parent_id": parent_id,
                "child_id": student_id,
                "verified_by_admin": True
            }, upsert=True)
            await parent_store.create_goal(parent_id, student_id, "Complete the Advanced Physics module.")

        # 2. Mentor Data
        mentor_id = created_users.get("mentor", {}).get("id")
        if mentor_id:
            print("Seeding Mentor data...")
            await mentor_store.db.insert("mentor_matches", {
                "mentor_id": mentor_id,
                "mentee_id": student_id,
                "status": "active"
            }, upsert=True)

        # 3. Peer Tutor Data
        peer_tutor_id = created_users.get("peer_tutor", {}).get("id")
        if peer_tutor_id:
            print("Seeding Peer Tutor data...")
            await peer_tutor_store.db.insert("tutor_sessions", {
                "tutor_id": peer_tutor_id,
                "student_id": student_id,
                "session_type": "peer_review",
                "status": "scheduled",
                "scheduled_at": (datetime.now() + timedelta(days=1)).isoformat()
            })

        # 4. Counselor Data
        counselor_id = created_users.get("counselor", {}).get("id")
        if counselor_id:
            print("Seeding Counselor data...")
            await counselor_store.db.insert("counselor_assignments", {
                "counselor_id": counselor_id,
                "student_id": student_id
            }, upsert=True)
            await counselor_store.add_note(counselor_id, student_id, "Student expression interest in AI Ethics.")

        # 5. Researcher Data
        researcher_id = created_users.get("researcher", {}).get("id")
        if researcher_id:
            print("Seeding Researcher snapshots...")
            snapshots = [
                {
                    "snapshot_date": "2026-03-01",
                    "dataset_type": "STEM_Mastery",
                    "data_json": {"avg_mastery": 0.85},
                    "institution_id_hash": "inst_hash_001"
                }
            ]
            for snap in snapshots:
                await researcher_store.db.insert("anonymised_snapshots", snap, upsert=True)

        # 6. HOD / Risk Data
        if hod_id:
            print("Seeding Risk Scores for HOD dashboard...")
            await academic_store.db.insert("student_risk_factors", {
                "student_id": student_id,
                "risk_score": 0.15,
                "risk_level": "low",
                "factors": ["attendance", "engagement"]
            }, upsert=True)

    print("\n--- Seeding Complete ---")

if __name__ == "__main__":
    asyncio.run(seed_roles())
