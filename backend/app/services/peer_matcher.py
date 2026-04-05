"""
Peer/Mentor matching service for study groups.
"""
from __future__ import annotations

import uuid
from typing import Any, Dict, Optional


async def find_peer_match(
    client: Any,
    *,
    student_id: str,
    subject_filter: Optional[str] = None,
) -> Any[str, Any]:
    """Find the best peer match for a student based on mastery overlap."""
    try:
        query = client.table("student_mastery").select("student_id, topic, mastery_level")
        if subject_filter:
            query = query.ilike("topic", f"%{subject_filter}%")
        result = query.neq("student_id", student_id).limit(20).execute()
        rows = result.data or []
    except Exception:
        rows = []

    matched_id = rows[0]["student_id"] if rows else None
    return {"matched_student_id": matched_id, "match_type": "peer", "subject_filter": subject_filter}


async def find_mentor_match(
    client: Any,
    *,
    student_id: str,
    subject_filter: Optional[str] = None,
) -> Any[str, Any]:
    """Find a mentor match for a student based on high mastery in the desired subject."""
    try:
        query = (
            client.table("student_mastery")
            .select("student_id, topic, mastery_level")
            .gte("mastery_level", 0.8)
        )
        if subject_filter:
            query = query.ilike("topic", f"%{subject_filter}%")
        result = query.neq("student_id", student_id).limit(10).execute()
        rows = result.data or []
    except Exception:
        rows = []

    matched_id = rows[0]["student_id"] if rows else None
    return {"matched_student_id": matched_id, "match_type": "mentor", "subject_filter": subject_filter}


async def create_group(
    client: Any,
    *,
    student_id: str,
    match_result: Dict[str, Any],
) -> Any[str, Any]:
    """Create a new study group from a match result."""
    group_id = str(uuid.uuid4())
    matched_id = match_result.get("matched_student_id")

    members = [student_id]
    if matched_id:
        members.append(matched_id)

    try:
        client.table("study_groups").insert({
            "id": group_id,
            "members": members,
            "match_type": match_result.get("match_type", "peer"),
            "subject_filter": match_result.get("subject_filter"),
        }).execute()
    except Exception:
        pass

    return {"group_id": group_id, "members": members, "match_result": match_result}


async def get_group(client: Any, group_id: str) -> Optional[Dict[str, Any]]:
    """Fetch a study group by ID."""
    try:
        result = client.table("study_groups").select("*").eq("id", group_id).single().execute()
        return result.data
    except Exception:
        return None
