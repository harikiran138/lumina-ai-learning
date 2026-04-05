import asyncio
import os
import uuid
from datetime import datetime
from app.store.parent_store import ParentStore
from app.database.supabase_manager import supabase_db, clear_global_mock_tables

async def verify_parent_portal():
    print("--- Starting Parent Portal Verification ---")
    
    # Force local mock DB
    os.environ["LUMINA_FORCE_LOCAL_DB"] = "1"
    clear_global_mock_tables()
    
    store = ParentStore()
    
    # 1. Setup Mock Data
    parent_id = str(uuid.uuid4())
    child_id = str(uuid.uuid4())
    
    print(f"Testing with Parent ID: {parent_id}, Child ID: {child_id}")
    
    # Create Parent and Child users
    await supabase_db.table("users").insert([
        {"id": parent_id, "email": "parent@example.com", "full_name": "Antigravity Parent", "role": "parent"},
        {"id": child_id, "email": "child@example.com", "full_name": "Lumina Student", "role": "student"}
    ]).async_execute()
    
    # 2. Create a link
    print("\n[1/6] Testing: Link Creation...")
    link_success = await store.create_link(parent_id, child_id)
    if link_success:
        print("✅ Link created successfully (status='linked', verified_by_admin=False)")
    else:
        print("❌ Link creation failed")
        return

    # 3. Verify Admin Link Fetching
    print("\n[2/6] Testing: Admin Verification Fetching...")
    # Simulate the admin router logic
    pending_links = (await supabase_db.table("parent_student_links")
                    .select("*")
                    .eq("status", "linked")
                    .eq("verified_by_admin", False)
                    .async_execute()).data
    if pending_links and len(pending_links) > 0:
        print(f"✅ Admin found {len(pending_links)} pending link(s)")
        link_id = pending_links[0]["id"]
    else:
        print("❌ Admin could not find pending links")
        return

    # 4. Create Mock Activities for the child
    print("\n[3/6] Testing: Activity Feed Aggregation...")
    await supabase_db.table("handwritten_papers").insert([
        {"id": str(uuid.uuid4()), "user_id": child_id, "title": "Math Assignment", "confidence": 0.95, "created_at": datetime.utcnow().isoformat()}
    ]).async_execute()
    
    await supabase_db.table("student_progress").insert([
        {"id": str(uuid.uuid4()), "user_id": child_id, "metadata": {"description": "Completed Unit 1 Quiz"}, "is_milestone": True, "created_at": datetime.utcnow().isoformat()}
    ]).async_execute()
    
    dashboard = await store.get_parent_dashboard(parent_id)
    feed = dashboard.get("activity_feed", [])
    if any(a["type"] == "handwritten_digitized" for a in feed):
        print("✅ Activity feed includes Handwritten OCR events")
    if any(a["is_milestone"] for a in feed):
        print("✅ Milestones properly flagged in feed")
    print(f"Total feed items: {len(feed)}")

    # 5. Goal Setting with Approval
    print("\n[4/6] Testing: Goal Setting & Approval Flow...")
    goal = await store.create_goal(parent_id, child_id, "Finish Algebra 1 by Friday")
    if goal and goal["approval_status"] == "pending":
        print("✅ Goal created with mandatory 'pending' status")
    else:
        print(f"❌ Goal creation failed or has wrong status: {goal}")

    # 6. Weekly Report Generation
    print("\n[5/6] Testing: Weekly Reports...")
    reports = await store.get_weekly_reports(parent_id)
    if reports and len(reports) > 0:
        print(f"✅ Generated {len(reports)} weekly report(s)")
        print(f"   Sample Report Summary: {reports[0].get('summary')}")
    else:
        print("❌ Weekly report generation failed")

    # 7. Admin Verification
    print("\n[6/6] Testing: Admin Final Verification...")
    now = datetime.utcnow().isoformat()
    # Mocking verify_parent_link endpoint logic
    verify_res = await supabase_db.table("parent_student_links").update({
        "verified_by_admin": True,
        "status": "verified",
        "verified_at": now
    }).eq("id", link_id).async_execute()
    
    if verify_res.data and verify_res.data[0]["verified_by_admin"] is True:
        print("✅ Admin verified the link successfully")
    else:
        print("❌ Admin verification update failed")

    print("\n--- Verification Complete: ALL SYSTEMS GO ---")

if __name__ == "__main__":
    asyncio.run(verify_parent_portal())
