import asyncio
import httpx
import time
from datetime import datetime

BASE_URL = "http://localhost:8000"


async def test_endpoint(client, name, path, method="GET", json=None):
    start = time.time()
    try:
        if method == "GET":
            response = await client.get(path)
        else:
            response = await client.post(path, json=json)

        duration = (time.time() - start) * 1000
        status = "✅" if response.status_code < 400 else "❌"
        print(f"{status} {name:25} | {response.status_code} | {duration:6.2f}ms")
        return response
    except Exception as e:
        print(f"❌ {name:25} | FAILED | {str(e)}")
        return None


async def verify_system():
    print(
        f"\n🚀 Lumina E2E Performance Verification - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    )
    print("-" * 60)
    print(f"{'Endpoint':27} | Status | Latency")
    print("-" * 60)

    async with httpx.AsyncClient(base_url=BASE_URL, timeout=10.0) as client:
        # 1. Health & Discovery
        await test_endpoint(client, "Health Check", "/health")

        # 2. Auth & User
        # Note: Using mock IDs for demonstration if actual ones aren't available
        student_id = "test_student_123"

        # 3. Community
        await test_endpoint(client, "Get Community Data", "/api/community/data")

        # 4. Learning & Progress
        await test_endpoint(client, "List Courses", "/api/courses/list")

        # 5. Dashboards (Synthetic Load)
        await test_endpoint(client, "Student Dashboard", "/api/student/dashboard")
        await test_endpoint(client, "Admin Dashboard", "/api/admin/dashboard")

        # 6. Assessment Engine
        mastery_resp = await test_endpoint(
            client, "Assessment Mastery", f"/api/assessment/student/{student_id}/mastery"
        )
        if mastery_resp and mastery_resp.status_code >= 500:
            print(f"DEBUG: {mastery_resp.text}")

    print("-" * 60)
    print("🏁 Verification Finished.\n")


if __name__ == "__main__":
    asyncio.run(verify_system())
