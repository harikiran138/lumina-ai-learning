import asyncio
import json
from app.store.analytics_store import AnalyticsStore
from app.database.supabase_manager import supabase_db

async def test_role_dashboards():
    print("🚀 Starting Role-Based Dashboard Verification...\n")
    
    analytics = AnalyticsStore()
    client = supabase_db.get_client()
    
    # 1. Test Admin Stats
    print("--- Testing Admin Stats ---")
    admin_stats = await analytics.get_admin_dashboard_stats()
    print(f"Admin Stats: {json.dumps(admin_stats, indent=2)}")
    assert "totalUsers" in admin_stats
    assert "totalCourses" in admin_stats
    assert admin_stats["systemStatus"] == "healthy"
    print("✅ Admin Stats OK\n")
    
    # 2. Test Teacher Stats
    print("--- Testing Teacher Stats ---")
    # Get a teacher ID
    teachers = client.table("users").select("id").eq("role", "teacher").execute().data
    if teachers:
        teacher_id = teachers[0]["id"]
        print(f"Testing with Teacher ID: {teacher_id}")
        teacher_stats = await analytics.get_teacher_dashboard_stats(teacher_id)
        print(f"Teacher Stats: {json.dumps(teacher_stats, indent=2)}")
        assert "avg_mastery" in teacher_stats
        assert "active_courses" in teacher_stats
        print("✅ Teacher Stats OK\n")
    else:
        print("⚠️ No teacher found in database to test teacher stats.\n")

    # 3. Test Student Stats
    print("--- Testing Student Stats ---")
    students = client.table("users").select("id").eq("role", "student").execute().data
    if students:
        student_id = students[0]["id"]
        print(f"Testing with Student ID: {student_id}")
        student_stats = await analytics.get_student_dashboard_stats(student_id)
        print(f"Student Stats: {json.dumps(student_stats, indent=2)}")
        assert "avg_score" in student_stats
        print("✅ Student Stats OK\n")
    else:
        print("⚠️ No student found in database to test student stats.\n")

    print("🎉 All Backend Role-Based Connections Verified!")

if __name__ == "__main__":
    asyncio.run(test_role_dashboards())
