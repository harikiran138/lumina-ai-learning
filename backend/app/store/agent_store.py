from typing import List, Dict, Optional, Any
from datetime import datetime
from app.database.supabase_manager import supabase_db
from app.core.logging import structlog

log = structlog.get_logger()


class AgentStore:
    """
    Supabase Store for AI Agent Memory and Conversations.
    Operates on 'agent_memory' and 'conversations' tables.
    """

    def __init__(self):
        self.db = supabase_db

    # --- Memory ---

    async def store_memory(self, agent_id: str, user_id: str, key: str, value: str):
        """Stores a specific fact/memory for an agent regarding a user"""
        memory_data = {
            "agent_id": agent_id,
            "user_id": user_id,
            "context_key": key,
            "memory_value": value,
            "timestamp": datetime.utcnow().isoformat()
        }
        try:
            # Use upsert with a logical match on (agent_id, user_id, context_key)
            # Fetch first to get ID for safer upsert
            client = self.db.get_client()
            response = await client.table("agent_memory").select("id").eq("agent_id", agent_id).eq("user_id", user_id).eq("context_key", key).async_execute()
            
            if response.data:
                mid = response.data[0]["id"]
                await client.table("agent_memory").update(memory_data).eq("id", mid).async_execute()
            else:
                await client.table("agent_memory").insert(memory_data).async_execute()
                
        except Exception as e:
            log.error("store_memory_failed", error=str(e), agent_id=agent_id, user_id=user_id)


    async def get_memories(self, agent_id: str, user_id: str) -> List[Dict]:
        try:
            return await self.db.fetch_all("agent_memory", {"agent_id": agent_id, "user_id": user_id})
        except Exception as e:
            log.error("get_memories_failed", error=str(e), agent_id=agent_id, user_id=user_id)
            return []

    # --- Conversation ---

    async def save_message(self, user_id: str, agent_id: str, role: str, content: str):
        """Appends a message to the conversation history"""
        message = {
            "role": role, 
            "content": content, 
            "timestamp": datetime.utcnow().isoformat()
        }

        try:
            client = self.db.get_client()
            response = await client.table("conversations").select("id, messages").eq("user_id", user_id).eq("agent_id", agent_id).async_execute()
            
            if response.data:
                conv_id = response.data[0]["id"]
                messages = response.data[0].get("messages", []) or []
                messages.append(message)
                client.table("conversations").update({
                    "messages": messages,
                    "updated_at": datetime.utcnow().isoformat()
                }).eq("id", conv_id).async_execute()
            else:
                client.table("conversations").insert({
                    "user_id": user_id,
                    "agent_id": agent_id,
                    "messages": [message],
                    "updated_at": datetime.utcnow().isoformat(),
                    "created_at": datetime.utcnow().isoformat()
                }).async_execute()
        except Exception as e:
            log.error("save_message_failed", error=str(e), user_id=user_id, agent_id=agent_id)


    async def get_conversation_history(
        self, user_id: str, agent_id: str, limit: int = 10
    ) -> List[Dict]:
        try:
            client = self.db.get_client()
            response = await client.table("conversations").select("messages").eq("user_id", user_id).eq("agent_id", agent_id).async_execute()
            if response.data and response.data[0].get("messages"):
                messages = response.data[0]["messages"]
                return messages[-limit:]
        except Exception as e:
            log.error("get_msg_history_failed", error=str(e), user_id=user_id, agent_id=agent_id)
        return []
