from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

import structlog
from fastapi import APIRouter, Depends, HTTPException, Query, Body
import json

from app.database.supabase_manager import supabase_db
from app.store.local_store import LocalJsonStore
from .auth import get_current_user
from app.database.scoped_db import get_scoped_db

log = structlog.get_logger()
router = APIRouter(prefix="/api/knowledge-graph", tags=["knowledge-graph"])


class KnowledgeNodePayload(BaseModel):
    concept: str
    difficulty: str = Field(default="beginner")
    prerequisites: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class KnowledgeGraphUpsert(BaseModel):
    nodes: List[KnowledgeNodePayload]


@router.get("/{course_id}")
async def list_knowledge_nodes(course_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in {"teacher", "admin", "student"}:
        raise HTTPException(status_code=403, detail="Access denied")

    client = supabase_db.get_client()
    if client:
        try:
            rows = client.table("knowledge_nodes").select("*").eq("course_id", course_id).execute().data
            return rows
        except Exception as exc:
            log.warning("knowledge_nodes_fetch_failed", course_id=course_id, error=str(exc))

    store = LocalJsonStore()
    payload = store.read()
    return [node for node in payload.get("knowledge_nodes", []) if node.get("course_id") == course_id]


@router.post("/{course_id}/nodes")
async def upsert_knowledge_nodes(
    course_id: str,
    payload: KnowledgeGraphUpsert,
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") not in {"teacher", "admin"}:
        raise HTTPException(status_code=403, detail="Teacher access required")

    rows = [
        {
            "course_id": course_id,
            "concept": node.concept,
            "difficulty": node.difficulty,
            "prerequisites": node.prerequisites,
            "metadata": node.metadata,
        }
        for node in payload.nodes
    ]

    client = supabase_db.get_client()
    if client:
        try:
            client.table("knowledge_nodes").upsert(rows, on_conflict="course_id,concept").execute()
            return {"status": "success", "count": len(rows), "source": "supabase"}
        except Exception as exc:
            log.warning("knowledge_nodes_upsert_failed", course_id=course_id, error=str(exc))

    store = LocalJsonStore()
    db = store.read()
    existing = [node for node in db.get("knowledge_nodes", []) if node.get("course_id") != course_id]
    db["knowledge_nodes"] = existing + rows
    store.write(db)
    return {"status": "success", "count": len(rows), "source": "local"}


@router.get("/concept/{concept_id}/graph")
async def get_concept_graph(
    concept_id: str,
    depth: int = 2,
    current_user: dict = Depends(get_current_user),
):
    """Return the dependency graph for a specific concept up to `depth` hops."""
    client = supabase_db.get_client()

    if not client:
        # Supabase unavailable — return a safe mock response
        return {
            "concept_id": concept_id,
            "name": concept_id,
            "dependencies": [],
            "dependents": [],
            "depth": depth,
            "edges": [],
        }

    # Fetch the concept node
    concept = None
    try:
        rows = client.table("concept_nodes").select("*").eq("id", concept_id).limit(1).execute().data
        concept = rows[0] if rows else None
    except Exception as exc:
        log.warning("concept_nodes_fetch_failed", concept_id=concept_id, error=str(exc))

    if concept is None:
        # Table may not exist yet — return mock
        return {
            "concept_id": concept_id,
            "name": concept_id,
            "dependencies": [],
            "dependents": [],
            "depth": depth,
            "edges": [],
        }

    # Collect edges by walking up to `depth` hops from the seed concept
    visited_concepts: set = {concept_id}
    frontier: set = {concept_id}
    all_edges: List[Dict[str, Any]] = []

    for _hop in range(depth):
        if not frontier:
            break
        next_frontier: set = set()
        for cid in frontier:
            try:
                edge_rows = (
                    client.table("concept_edges")
                    .select("*")
                    .or_(f"source_id.eq.{cid},target_id.eq.{cid}")
                    .execute()
                    .data
                )
                for edge in edge_rows:
                    all_edges.append(edge)
                    for side in ("source_id", "target_id"):
                        neighbor = str(edge.get(side, ""))
                        if neighbor and neighbor not in visited_concepts:
                            visited_concepts.add(neighbor)
                            next_frontier.add(neighbor)
            except Exception as exc:
                log.warning("concept_edges_fetch_failed", concept_id=cid, error=str(exc))
        frontier = next_frontier

    # Deduplicate edges by id (or by source+target if id absent)
    seen_edge_ids: set = set()
    unique_edges: List[Dict[str, Any]] = []
    for edge in all_edges:
        key = edge.get("id") or f"{edge.get('source_id')}:{edge.get('target_id')}"
        if key not in seen_edge_ids:
            seen_edge_ids.add(key)
            unique_edges.append(edge)

    dependencies = [
        e.get("source_id") for e in unique_edges if e.get("target_id") == concept_id
    ]
    dependents = [
        e.get("target_id") for e in unique_edges if e.get("source_id") == concept_id
    ]

    return {
        "concept_id": concept_id,
        "name": concept.get("name") or concept.get("concept") or concept_id,
        "dependencies": dependencies,
        "dependents": dependents,
        "depth": depth,
        "edges": unique_edges,
    }
