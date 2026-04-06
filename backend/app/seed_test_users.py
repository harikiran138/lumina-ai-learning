"""
Lumina Platform - Test User Seeder
Uses Supabase REST API with service role key directly.
No async issues. Idempotent (uses ON CONFLICT).
"""
import os
import uuid
import json
import time
from typing import Optional
import requests
import bcrypt
from datetime import datetime

# ── Config ────────────────────────────────────────────────────────────────────
SUPABASE_URL = "https://odyjksznsdeyweylovzl.supabase.co"
SERVICE_ROLE_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9keWprc3puc2RleXdleWxvdnpsIiwicm9sZSI6"
    "InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjk1MDUyMSwiZXhwIjoyMDg4NTI2NTIxfQ."
    "62ne3wo7p-quLUa70p_9-R45MmwuTzu8lQleDgO2Q34"
)
HEADERS = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates,return=representation",
}

RAW_PASSWORD = "password"

# ── Test Users ─────────────────────────────────────────────────────────────────
# onboarding_step notes (from auth.py is_onboarding_complete):
#   super_admin / hod → auto-bypassed (any steps work)
#   college_admin     → needs >= 2
#   student           → needs >= 5 + learner_profile completed
#   teacher           → needs >= 5
TEST_USERS = [
    {
        "email": "superadmin@lumina.com",
        "full_name": "Lumina Super Admin",
        "role": "super_admin",
        "onboarding_step": 5,
    },
    {
        "email": "admin@lumina.com",
        "full_name": "Lumina System Admin",
        "role": "college_admin",
        "onboarding_step": 2,
    },
    {
        "email": "teacher@lumina.com",
        "full_name": "Lumina Teacher",
        "role": "teacher",
        "onboarding_step": 5,
    },
    {
        "email": "student@lumina.com",
        "full_name": "Lumina Student",
        "role": "student",
        "onboarding_step": 5,
        "needs_learner_profile": True,
    },
    {
        "email": "hod_hod001@lumina.com",
        "full_name": "Lumina HOD",
        "role": "hod",
        "employee_id": "HOD001",
        "onboarding_step": 5,
    },
    {
        "email": "faculty_fac001@lumina.com",
        "full_name": "Lumina Faculty",
        "role": "teacher",  # faculty normalizes to teacher
        "employee_id": "FAC001",
        "onboarding_step": 5,
    },
    {
        "email": "admin@demo.nsrit.edu.in",
        "full_name": "NSRIT Admin",
        "role": "college_admin",
        "onboarding_step": 2,
    },
    {
        "email": "student_22nu1a0519@lumina.com",
        "full_name": "Legacy Student",
        "role": "student",
        "roll_number": "22NU1A0519",
        "onboarding_step": 5,
        "needs_learner_profile": True,
    },
]


def hash_password(raw: str) -> str:
    return bcrypt.hashpw(raw.encode(), bcrypt.gensalt()).decode()


def upsert_user(user_data: dict) -> Optional[dict]:
    """Upserts a user into the users table using Supabase REST API."""
    now = datetime.utcnow().isoformat()
    user_id = str(uuid.uuid4())

    payload = {
        "id": user_id,
        "email": user_data["email"],
        "password_hash": hash_password(RAW_PASSWORD),
        "name": user_data["full_name"],
        "full_name": user_data["full_name"],
        "role": user_data["role"],
        "phone": "N/A",
        "is_active": True,
        "status": "active",
        "onboarding_step": user_data.get("onboarding_step", 5),
        "must_change_password": False,
        "created_at": now,
        "updated_at": now,
    }

    if user_data.get("employee_id"):
        payload["employee_id"] = user_data["employee_id"]
    if user_data.get("roll_number"):
        payload["roll_number"] = user_data["roll_number"]

    url = f"{SUPABASE_URL}/rest/v1/users"
    resp = requests.post(url, headers=HEADERS, json=payload, timeout=30)

    if resp.status_code in (200, 201):
        data = resp.json()
        return data[0] if isinstance(data, list) else data
    elif resp.status_code == 409 or "duplicate" in (resp.text or "").lower():
        # Already exists — fetch and update onboarding_step + password
        get_resp = requests.get(
            f"{SUPABASE_URL}/rest/v1/users",
            headers={**HEADERS, "Prefer": ""},
            params={"email": f"eq.{user_data['email']}", "select": "id,email,role"},
            timeout=30,
        )
        if get_resp.status_code == 200 and get_resp.json():
            existing = get_resp.json()[0]
            existing_id = existing["id"]
            patch_resp = requests.patch(
                f"{SUPABASE_URL}/rest/v1/users",
                headers={**HEADERS, "Prefer": "return=representation"},
                params={"id": f"eq.{existing_id}"},
                json={
                    "password_hash": hash_password(RAW_PASSWORD),
                    "onboarding_step": user_data.get("onboarding_step", 5),
                    "is_active": True,
                    "status": "active",
                    "role": user_data["role"],
                    "must_change_password": False,
                    "updated_at": datetime.utcnow().isoformat(),
                },
                timeout=30,
            )
            if patch_resp.status_code in (200, 204):
                print(f"  ↻ Updated existing user: {user_data['email']}")
                return {"id": existing_id, **existing}
    else:
        print(f"  ✗ Error {resp.status_code}: {resp.text[:200]}")
    return None


def create_learner_profile(user_id: str, email: str):
    """Creates/updates a learner_profile and ensures user_data progress is COMPLETED."""
    now = datetime.utcnow().isoformat()
    
    # 1. Update/Create Learner Profile (omit status if possible schema mismatch)
    payload = {
        "user_id": user_id,
        "learning_style": "visual",
        "goals": ["pass exams", "understand concepts"],
        "created_at": now,
        "updated_at": now,
    }
    # Check if we can add status or if it errors
    url = f"{SUPABASE_URL}/rest/v1/learner_profiles"
    resp = requests.post(url, headers=HEADERS, json={**payload, "status": "active"}, timeout=30)
    if resp.status_code not in (200, 201, 204):
        # Fallback without status
        requests.post(url, headers=HEADERS, json=payload, timeout=30)
    
    # 2. Update user_data progress for auth checks
    progress_payload = {
        "user_id": user_id,
        "progress": {
            "onboarding_status": "COMPLETED",
            "onboarding_step": 5,
            "completed_at": now,
            "adaptive_onboarding": {
                "status": "completed",
                "completed_at": now
            }
        },
        "updated_at": now
    }
    requests.post(
        f"{SUPABASE_URL}/rest/v1/user_data",
        headers=HEADERS,
        json=progress_payload,
        timeout=30
    )
    print(f"  ✓ Full onboarding status synced for {email}")


def verify_login(email: str):
    """Verifies the user can login via the backend API."""
    try:
        resp = requests.post(
            "http://localhost:8000/api/auth/login",
            json={"identifier": email, "password": RAW_PASSWORD},
            timeout=5,
        )
        if resp.status_code == 200:
            data = resp.json()
            role = data.get("user", {}).get("role", "unknown")
            onboarding = data.get("user", {}).get("onboardingCompleted", False)
            print(f"  ✓ Login OK | role={role} | onboardingCompleted={onboarding}")
            return True
        else:
            print(f"  ✗ Login FAILED ({resp.status_code}): {resp.text[:150]}")
            return False
    except Exception as e:
        print(f"  ✗ Login ERROR: {e}")
        return False


def main():
    print("=" * 60)
    print("Lumina Test User Seeder")
    print("=" * 60)

    results = {"seeded": 0, "failed": 0, "login_ok": 0, "login_fail": 0}

    for u in TEST_USERS:
        print(f"\n[{u['role'].upper()}] {u['email']}")
        user_record = upsert_user(u)

        if user_record:
            results["seeded"] += 1
            user_id = user_record.get("id")

            if u.get("needs_learner_profile") and user_id:
                create_learner_profile(user_id, u["email"])

            # Verify login works end-to-end
            if verify_login(u["email"]):
                results["login_ok"] += 1
            else:
                results["login_fail"] += 1
        else:
            results["failed"] += 1
        
        # Rate limit protection
        time.sleep(1.5)

    print("\n" + "=" * 60)
    print("SEEDING SUMMARY")
    print("=" * 60)
    print(f"  Users seeded/updated : {results['seeded']}")
    print(f"  Users failed         : {results['failed']}")
    print(f"  Login verified ✓     : {results['login_ok']}")
    print(f"  Login failed ✗       : {results['login_fail']}")
    print()
    if results["login_fail"] == 0 and results["failed"] == 0:
        print("✅ ALL USERS READY — Run E2E tests now")
    else:
        print("⚠️  Some users need attention — check logs above")


if __name__ == "__main__":
    main()
