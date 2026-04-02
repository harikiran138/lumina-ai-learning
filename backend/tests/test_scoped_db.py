import os
import sys

import pytest

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.scoped_db import get_scoped_db
from app.database.supabase_manager import supabase_db


@pytest.mark.asyncio
async def test_scoped_db_select_does_not_require_soft_delete_columns():
    client = supabase_db.get_client(force_new=True)
    client.table("courses").insert(
        {"id": "course-scope-1", "title": "Scoped Course", "institution_id": "inst-1"}
    ).execute()

    db = get_scoped_db({"id": "teacher-1", "role": "teacher", "institution_id": "inst-1"})
    rows = await db.fetch_all("courses")

    assert len(rows) == 1
    assert rows[0]["id"] == "course-scope-1"


@pytest.mark.asyncio
async def test_scoped_db_delete_hard_deletes_when_table_is_not_soft_delete_enabled():
    client = supabase_db.get_client(force_new=True)
    client.table("student_subjects").insert(
        {"id": "student-subject-1", "student_id": "student-1", "institution_id": "inst-1"}
    ).execute()

    db = get_scoped_db({"id": "student-1", "role": "student", "institution_id": "inst-1"})
    deleted = await db.delete("student_subjects", {"student_id": "student-1"})

    assert deleted is True
    remaining = client.table("student_subjects").select("*").execute().data or []
    assert remaining == []
