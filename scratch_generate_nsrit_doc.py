import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.database.supabase_manager import supabase_db

async def generate_nsrit_doc():
    institutions = await supabase_db.fetch_all("institutions", {"institution_name": "NSRIT"})
    inst_id = institutions[0]["id"]
    
    departments = await supabase_db.fetch_all("departments", {"institution_id": inst_id})
    dept_map = {d["id"]: d["department_name"] for d in departments}
    
    all_users = await supabase_db.fetch_all("users")
    nsrit_users = [u for u in all_users if u["email"].endswith("@nsrit.edu")]
    
    admins = []
    hods = []
    teachers = []
    students = []
    
    for u in nsrit_users:
        role = u.get("role", "student").lower()
        dept_id = u.get("department_id")
        dept_name = dept_map.get(dept_id, "All-Institution" if role == "admin" else "General")
        
        info = (u["name"], u["email"], "password", dept_name)
        
        if role == "admin": admins.append(info)
        elif role == "hod": hods.append(info)
        elif role == "teacher": teachers.append(info)
        else: students.append(info)

    # Sort
    admins.sort(key=lambda x: x[1])
    hods.sort(key=lambda x: x[1])
    teachers.sort(key=lambda x: x[1])
    students.sort(key=lambda x: x[1])

    doc_content = f"""# 🏛️ NSRIT Institutional Access Matrix

This document contain all verified login credentials for the **NSRIT** institution on the Lumina AI Learning Platform.

## 🔑 Administrative Access
| Name | Email | Password | Scope |
| :--- | :--- | :--- | :--- |
"""
    for a in admins:
        doc_content += f"| {a[0]} | `{a[1]}` | `{a[2]}` | {a[3]} |\n"

    doc_content += "\n## 🎓 Heads of Department (HODs)\n"
    doc_content += "| Name | Email | Password | Department |\n"
    doc_content += "| :--- | :--- | :--- | :--- |\n"
    for h in hods:
        doc_content += f"| {h[0]} | `{h[1]}` | `{h[2]}` | {h[3]} |\n"

    doc_content += "\n## 👨‍🏫 Teachers / Instructors\n"
    doc_content += "| Name | Email | Password | Department |\n"
    doc_content += "| :--- | :--- | :--- | :--- |\n"
    for t in teachers:
        doc_content += f"| {t[0]} | `{t[1]}` | `{t[2]}` | {t[3]} |\n"

    doc_content += f"\n## 🧑‍🎓 Students ({len(students)} Accounts)\n"
    doc_content += "| Name | Email | Password | Department/Context |\n"
    doc_content += "| :--- | :--- | :--- | :--- |\n"
    
    # List all students
    for s in students:
        doc_content += f"| {s[0]} | `{s[1]}` | `{s[2]}` | {s[3]} |\n"

    doc_path = os.path.join(os.getcwd(), "NSRIT_INSTITUTIONAL_LOGINS.md")
    with open(doc_path, "w") as f:
        f.write(doc_content)
    
    print(f"✅ Document generated at: {doc_path}")

if __name__ == "__main__":
    asyncio.run(generate_nsrit_doc())
