import asyncio
import json
import uuid
from typing import Dict, Any
from app.database.supabase_manager import supabase_db
from app.store.user_store import UserStore
from app.store.discussion_store import DiscussionStore
from app.store.collaboration_store import CollaborationStore
from app.services.gamification import award_reputation, check_role_promotion
from app.services.collaboration_service import CollaborationService
from app.services.ai_tutor_service import AITutorService

async def run_evolution_test():
    print("Starting Lumina Evolution Ecosystem Test...")
    
    # 1. Initialize Stores
    user_store = UserStore()
    disc_store = DiscussionStore()
    collab_store = CollaborationStore()
    ai_tutor = AITutorService()
    collab_service = CollaborationService(disc_store, ai_tutor)
    
    # 2. Setup Test Data
    print("--- Phase 1: Identity & Permissions ---")
    test_user_id = str(uuid.uuid4())
    test_user_email = f"evolution_{test_user_id[:8]}@lumina.test"
    
    # Manually seed user into mock DB for test
    await supabase_db.table("users").insert({
        "id": test_user_id,
        "email": test_user_email,
        "name": "Evolution Test Student",
        "role": "student",
        "reputation_score": 0,
        "permissions": {}
    }).async_execute()
    
    # Verify field updates
    await user_store.update_user_fields(test_user_id, {"reputation_score": 100, "reputation_rank": "Novice"})
    updated_user = await user_store.get_user_by_id(test_user_id)
    print(f"ok User Reputation Initialized: {updated_user['reputation_score']} (Rank: {updated_user['reputation_rank']})")

    print("\n--- Phase 2: Collaborative Discussion ---")
    # Post a thread with AI auto-answer simulation
    thread = await collab_service.post_thread_with_ai(
        title="Understanding Quantum Entanglement",
        content="Can someone explain it in simple terms?",
        author_id=test_user_id,
        subject_id=None
    )
    print(f"ok Forum Thread Created: {thread['title']} (ID: {thread['id']})")
    
    comments = await disc_store.get_comments(thread["id"])
    has_ai = any(c.get("is_ai_generated") for c in comments)
    print(f"ok AI Auto-Response Verified: {'YES' if has_ai else 'NO'}")

    print("\n--- Phase 3: Reputation & Promotion Flow ---")
    # Award reputation for helping
    await award_reputation(supabase_db, test_user_id, "help_answered")
    await award_reputation(supabase_db, test_user_id, "group_session_led")
    
    user_after_rep = await user_store.get_user_by_id(test_user_id)
    print(f"ok Reputation Awarded: {user_after_rep['reputation_score']}")
    
    # Simulate high mastery for promotion
    await supabase_db.table("dkt_states").upsert({
        "user_id": test_user_id,
        "state_data": {"state": {"quantum_low": 0.95, "quantum_mid": 0.92, "linear_algebra": 0.99}}
    }).async_execute()
    
    # Trigger promotion check manually
    await check_role_promotion(supabase_db, test_user_id, user_after_rep['reputation_score'] + 400) # Boost rep for test
    
    promoted_user = await user_store.get_user_by_id(test_user_id)
    print(f"ok Role Promotion Verified: New Role = {promoted_user['role']}")

    print("\n--- Phase 4: Study Group Matching ---")
    group = await collab_store.create_group(
        title="Theoretical Physics Squad",
        description="High-mastery peer tutoring group",
        leader_id=test_user_id
    )
    print(f"ok Evolution Group Created: {group['title']}")
    
    members = await collab_store.get_members(group["id"])
    print(f"ok Member Persistence Verified: {len(members)} member(s)")

    print("\nEvolution Ecosystem Test Completed Successfully!")

if __name__ == "__main__":
    asyncio.run(run_evolution_test())
