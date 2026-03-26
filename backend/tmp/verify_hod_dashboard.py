import asyncio
import json
from app.database.supabase_manager import supabase_db
from app.store.teacher_store import teacher_store

async def verify_hod_dashboard():
    print("Verifying HOD Dashboard Data...")
    
    # HOD for CSE Dept
    hod_id = "4f71dfd4-f02e-4d8c-9444-6fd6a140214f"
    dept_id = "10be8fd3-6c31-4cd3-8171-077ed4ec61f4"
    
    # 1. Check pending requests
    print(f"Fetching pending requests for department: {dept_id}")
    requests = await teacher_store.get_pending_requests_by_department(dept_id)
    
    print(f"Found {len(requests)} requests")
    for r in requests:
        print(f"Request ID: {r.get('id')}")
        print(f"Teacher: {r.get('teacher_name')} ({r.get('teacher_email')})")
        print(f"Course: {r.get('course_name')}")
        print(f"Class: {r.get('class_name')}")
        print(f"Status: {r.get('status')}")
        print("-" * 20)

    if not requests:
        print("Error: No requests found for this department.")
    else:
        print("Success: Pending requests correctly fetched and enriched.")

if __name__ == "__main__":
    asyncio.run(verify_hod_dashboard())
