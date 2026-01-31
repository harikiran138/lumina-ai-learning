import pytest

def test_auth_security_checks(client):
    """
    Tests Authentication and IDOR protection.
    """
    # 1. Register Student A
    email_a = "student_a@example.com"
    client.post("/api/auth/register", json={
        "email": email_a, "password": "pass", "full_name": "Student A", "role": "student"
    })
    token_a = client.post("/api/auth/token", data={"username": email_a, "password": "pass"}).json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # 2. Register Student B
    email_b = "student_b@example.com"
    client.post("/api/auth/register", json={
        "email": email_b, "password": "pass", "full_name": "Student B", "role": "student"
    })
    token_b = client.post("/api/auth/token", data={"username": email_b, "password": "pass"}).json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 3. Verify ME endpoint
    resp = client.get("/api/auth/me", headers=headers_a)
    assert resp.status_code == 200
    assert resp.json()["email"] == email_a

    # 4. IDOR Check: Saving Data
    # Student A saves a note
    client.post("/api/student/note", json={"content": "Secret Note A"}, headers=headers_a)
    
    # 5. IDOR Check: Reading Data
    # Student A sees their note
    resp_a = client.get("/api/student/profile", headers=headers_a)
    assert "Secret Note A" in [n for n in resp_a.json()["notes"]]

    # Student B should NOT see Student A's note
    resp_b = client.get("/api/student/profile", headers=headers_b)
    assert "Secret Note A" not in [n for n in resp_b.json()["notes"]]

    # 6. Unauthorized Access
    resp_unauth = client.get("/api/student/profile")
    assert resp_unauth.status_code == 401
