"""
AI Tools service — generates flashcards and mind maps using Anthropic Claude API.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

MAX_CONTENT_LENGTH = 5000
MAX_FLASHCARDS     = 15

# ─── Client initialisation ────────────────────────────────────────────────────

def _get_client():
    """Return an Anthropic client. Lazy-loaded to avoid import errors if key absent."""
    try:
        import anthropic
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            logger.warning("ai_tools: ANTHROPIC_API_KEY not set")
        return anthropic.Anthropic(api_key=api_key)
    except ImportError:
        logger.error("ai_tools: anthropic package not installed")
        return None


# ─── Flashcard generation ─────────────────────────────────────────────────────

async def generate_flashcards(
    content_text: str,
    concept_ids: list,
    language_code: str = "en",
) -> List[dict]:
    """
    Call Anthropic Claude to extract key concepts and generate flashcard pairs.
    Returns list of { front, back, concept_id, difficulty } dicts (max 15).
    Truncates input at 5000 chars with appended note.
    Returns empty list on any API failure.
    """
    try:
        client = _get_client()
        if client is None:
            return []

        # Truncate content if necessary
        if len(content_text) > MAX_CONTENT_LENGTH:
            content_text = (
                content_text[:MAX_CONTENT_LENGTH]
                + "\n\n[Content truncated for processing]"
            )

        system_prompt = (
            "You are an educational content expert. Extract key concepts and generate flashcard pairs.\n"
            f"Format: Return ONLY a JSON array of objects with keys: front, back, concept_id (use snake_case name), difficulty (0.0-1.0).\n"
            f"Language: {language_code}. Generate maximum {MAX_FLASHCARDS} cards."
        )

        concept_hint = ""
        if concept_ids:
            concept_hint = f"\nFocus on these concept IDs where possible: {', '.join(str(c) for c in concept_ids)}"

        user_message = f"Generate flashcards from the following educational content:{concept_hint}\n\n{content_text}"

        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2048,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}],
        )

        raw_text = response.content[0].text.strip()

        # Strip markdown code fences if present
        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
        raw_text = raw_text.strip()

        cards: List[dict] = json.loads(raw_text)

        # Validate and normalise each card
        validated = []
        for card in cards[:MAX_FLASHCARDS]:
            if not isinstance(card, dict):
                continue
            validated.append({
                "front":      str(card.get("front", "")),
                "back":       str(card.get("back", "")),
                "concept_id": str(card.get("concept_id", "unknown")),
                "difficulty": max(0.0, min(1.0, float(card.get("difficulty", 0.5)))),
            })

        logger.info("generate_flashcards: generated %d cards", len(validated))
        return validated

    except json.JSONDecodeError as exc:
        logger.error("generate_flashcards: JSON parse error: %s", str(exc))
        return []
    except Exception as exc:
        logger.error("generate_flashcards failed: %s", str(exc))
        return []


# ─── Mind map generation ──────────────────────────────────────────────────────

async def generate_mindmap(
    content_text: str,
    root_concept: str,
    student_id: Optional[str] = None,
) -> dict:
    """
    Call Claude to extract concept relationships and return a mind-map structure.
    Returns { nodes: [...], edges: [...] }.
    Returns empty dict on any API failure.
    """
    try:
        client = _get_client()
        if client is None:
            return {}

        if len(content_text) > MAX_CONTENT_LENGTH:
            content_text = (
                content_text[:MAX_CONTENT_LENGTH]
                + "\n\n[Content truncated for processing]"
            )

        system_prompt = (
            'Extract concept relationships from this content. Return ONLY valid JSON:\n'
            '{ "nodes": [{"id": "snake_case_id", "label": "Display Name", "x": float, "y": float}],\n'
            '  "edges": [{"from": "id1", "to": "id2", "relationship": "prerequisite|related|subtopic"}] }\n'
            f'Root concept: {root_concept}'
        )

        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2048,
            system=system_prompt,
            messages=[{"role": "user", "content": content_text}],
        )

        raw_text = response.content[0].text.strip()

        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
        raw_text = raw_text.strip()

        mindmap: dict = json.loads(raw_text)

        # Validate structure
        nodes = mindmap.get("nodes", [])
        edges = mindmap.get("edges", [])

        validated_nodes = []
        for node in nodes:
            if isinstance(node, dict) and "id" in node:
                validated_nodes.append({
                    "id":         str(node["id"]),
                    "label":      str(node.get("label", node["id"])),
                    "x":          float(node.get("x", 0.0)),
                    "y":          float(node.get("y", 0.0)),
                    "concept_id": str(node.get("concept_id", node["id"])),
                })

        validated_edges = []
        for edge in edges:
            if isinstance(edge, dict) and "from" in edge and "to" in edge:
                validated_edges.append({
                    "from":         str(edge["from"]),
                    "to":           str(edge["to"]),
                    "relationship": str(edge.get("relationship", "related")),
                })

        logger.info(
            "generate_mindmap: root=%s nodes=%d edges=%d student=%s",
            root_concept, len(validated_nodes), len(validated_edges), student_id,
        )
        return {"nodes": validated_nodes, "edges": validated_edges}

    except json.JSONDecodeError as exc:
        logger.error("generate_mindmap: JSON parse error: %s", str(exc))
        return {}
    except Exception as exc:
        logger.error("generate_mindmap failed: %s", str(exc))
        return {}
