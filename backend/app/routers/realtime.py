"""
Real-time WebSocket Router
--------------------------
Provides two WebSocket channels:

  /ws/community          — broadcast community chat messages to all connected users.
  /ws/ai-tutor/{user_id} — stream AI tutor responses token-by-token to a single user.

Connection lifecycle
--------------------
1. Client connects with an `access_token` query parameter or cookie.
2. Server decodes & validates the JWT (expiry + signature via JOSE).
3. On auth failure the server sends {"type":"error","detail":"..."} and closes.
4. Authenticated clients join the appropriate channel.

Redis pub/sub is used to fan out community messages across multiple backend
processes when the service is horizontally scaled.
"""

from __future__ import annotations

import json
import logging
from typing import Dict, Set

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from jose import jwt, JWTError

from app.core.config import settings
from app.store.ai_tutor_store import AITutorStore

log = logging.getLogger(__name__)
router = APIRouter()

# ---------------------------------------------------------------------------
# Simple in-process connection registry (works for single-process deploys).
# For multi-process deployments the community fan-out uses Redis pub/sub.
# ---------------------------------------------------------------------------

class _ConnectionManager:
    """Tracks active WebSocket connections per channel."""

    def __init__(self) -> None:
        self._channels: Dict[str, Set[WebSocket]] = {}

    async def connect(self, channel: str, ws: WebSocket) -> None:
        await ws.accept()
        self._channels.setdefault(channel, set()).add(ws)

    def disconnect(self, channel: str, ws: WebSocket) -> None:
        self._channels.get(channel, set()).discard(ws)

    async def broadcast(self, channel: str, payload: dict) -> None:
        dead: list[WebSocket] = []
        for ws in list(self._channels.get(channel, set())):
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(channel, ws)


manager = _ConnectionManager()
_COMMUNITY_CHANNEL = "community"
_REDIS_COMMUNITY_CHANNEL = "lumina:community"


# ---------------------------------------------------------------------------
# JWT helper (Edge-safe decode + expiry check)
# ---------------------------------------------------------------------------

def _decode_ws_token(token: str) -> dict | None:
    """Decode and validate a JWT for a WebSocket connection."""
    for secret in filter(None, [settings.JWT_SECRET, settings.SECRET_KEY]):
        try:
            payload = jwt.decode(token, secret, algorithms=["HS256"])
            return payload
        except JWTError:
            continue
    return None


def _auth_ws(ws: WebSocket, token: str | None) -> dict | None:
    """
    Extract & validate the bearer token from the WebSocket handshake.
    Priority: query param `access_token` → cookie `access_token`.
    Returns the decoded JWT payload or None on failure.
    """
    if not token:
        token = ws.cookies.get("access_token")
    if not token:
        return None
    return _decode_ws_token(token)


# ---------------------------------------------------------------------------
# Community broadcast channel
# ---------------------------------------------------------------------------

@router.websocket("/community")
async def community_ws(
    ws: WebSocket,
    access_token: str | None = Query(default=None),
):
    """
    WebSocket endpoint for real-time community chat.

    Message format (client → server):
        {"content": "<text>"}

    Broadcast format (server → all):
        {"type": "message", "user_id": "...", "name": "...", "content": "...", "ts": "..."}
    """
    payload = _auth_ws(ws, access_token)
    if not payload:
        await ws.accept()
        await ws.send_json({"type": "error", "detail": "Authentication required"})
        await ws.close(code=4001)
        return

    user_id = str(payload.get("id") or payload.get("sub", "unknown"))
    user_name = str(payload.get("fullName") or payload.get("email", "Anonymous"))

    await manager.connect(_COMMUNITY_CHANNEL, ws)
    log.info("ws_community_connected", user_id=user_id)

    try:
        # Optionally fan out via Redis pub/sub when redis is available.
        redis_pubsub = _try_redis_pubsub()

        while True:
            data = await ws.receive_text()
            try:
                msg = json.loads(data)
            except json.JSONDecodeError:
                await ws.send_json({"type": "error", "detail": "Invalid JSON"})
                continue

            content = (msg.get("content") or "").strip()
            if not content:
                continue

            from datetime import datetime, timezone
            broadcast_payload = {
                "type": "message",
                "user_id": user_id,
                "name": user_name,
                "content": content,
                "ts": datetime.now(timezone.utc).isoformat(),
            }

            # In-process broadcast
            await manager.broadcast(_COMMUNITY_CHANNEL, broadcast_payload)

            # Cross-process fan-out via Redis
            if redis_pubsub:
                try:
                    redis_pubsub.publish(_REDIS_COMMUNITY_CHANNEL, json.dumps(broadcast_payload))
                except Exception as exc:
                    log.warning("redis_publish_failed", error=str(exc))

    except WebSocketDisconnect:
        manager.disconnect(_COMMUNITY_CHANNEL, ws)
        log.info("ws_community_disconnected", user_id=user_id)


# ---------------------------------------------------------------------------
# AI Tutor streaming channel
# ---------------------------------------------------------------------------

@router.websocket("/ai-tutor/{user_id}")
async def ai_tutor_ws(
    ws: WebSocket,
    user_id: str,
    access_token: str | None = Query(default=None),
):
    """
    WebSocket endpoint for streaming AI tutor responses.

    Request format (client → server):
        {"prompt": "...", "history": [...], "context": {...}}

    Response events (server → client):
        {"type": "thinking"}          — AI is processing
        {"type": "token", "text": "…"} — partial response token
        {"type": "done", "response": "…"} — complete response
        {"type": "error", "detail": "…"} — AI / auth failure
    """
    payload = _auth_ws(ws, access_token)
    if not payload:
        await ws.accept()
        await ws.send_json({"type": "error", "detail": "Authentication required"})
        await ws.close(code=4001)
        return

    token_user_id = str(payload.get("id") or payload.get("sub", ""))
    if token_user_id != user_id:
        await ws.accept()
        await ws.send_json({"type": "error", "detail": "Token / user mismatch"})
        await ws.close(code=4003)
        return

    await ws.accept()
    tutor = AITutorStore()
    log.info("ws_ai_tutor_connected", user_id=user_id)

    try:
        while True:
            data = await ws.receive_text()
            try:
                msg = json.loads(data)
            except json.JSONDecodeError:
                await ws.send_json({"type": "error", "detail": "Invalid JSON"})
                continue

            prompt = (msg.get("prompt") or "").strip()
            if not prompt:
                await ws.send_json({"type": "error", "detail": "prompt is required"})
                continue

            history = msg.get("history") or []
            context = msg.get("context") or {}

            await ws.send_json({"type": "thinking"})

            try:
                gemini_history = tutor.format_history_for_gemini(history)
                response_text = await tutor.get_response(prompt, gemini_history, context)
            except Exception as exc:
                log.error("ws_ai_tutor_response_error", user_id=user_id, error=str(exc))
                # Graceful fallback — do not crash the connection.
                await ws.send_json({
                    "type": "error",
                    "detail": "AI service temporarily unavailable. Please try again in a moment.",
                })
                continue

            # Send response as a single `done` event.
            # If the underlying LLM ever exposes a streaming API, iterate tokens here.
            await ws.send_json({"type": "done", "response": response_text})

    except WebSocketDisconnect:
        log.info("ws_ai_tutor_disconnected", user_id=user_id)


# ---------------------------------------------------------------------------
# Redis pub/sub helper
# ---------------------------------------------------------------------------

def _try_redis_pubsub():
    """Return a sync Redis client for pub/sub, or None if unavailable."""
    try:
        import redis as _redis
        client = _redis.from_url(settings.REDIS_URL, decode_responses=True, socket_connect_timeout=2)
        client.ping()
        return client
    except Exception:
        return None
