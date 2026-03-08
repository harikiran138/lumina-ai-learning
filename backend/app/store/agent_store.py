from typing import List, Dict
from datetime import datetime
from app.database.supabase_manager import supabase_db
from app.database.models import AgentMemory, Message
from app.core.logging import structlog

log = structlog.get_logger()


class AgentStore:
    """
    Supabase Store for AI Agent Memory and Conversations.
    """

    def __init__(self):
        self.client = supabase_db.get_client()

    @property
    def memory_collection(self):
        return self.client.table("agent_memory")

    @property
    def conversations_collection(self):
        return self.client.table("conversations")

    # --- Memory ---

    async def store_memory(self, agent_id: str, user_id: str, key: str, value: str):
        """Stores a specific fact/memory for an agent regarding a user"""
        
        try:
            memory_data = {
                "agent_id": agent_id,
                "user_id": user_id,
                "context_key": key,
                "memory_value": value,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            # Upsert using match on agent_id, user_id, context_key
            # In Supabase, usually you rely on unique constraints and insert/upsert mapping.
            # Postgrest upsert relies on primary keys or unique constraints.
            # Assuming id isn't known, we might need to delete & insert or try update then insert
            response = self.memory_collection.select("id").eq("agent_id", agent_id).eq("user_id", user_id).eq("context_key", key).execute()
            if response.data:
                mid = response.data[0]["id"]
                self.memory_collection.update(memory_data).eq("id", mid).execute()
            else:
                self.memory_collection.insert(memory_data).execute()
                
        except Exception as e:
            log.error("store_memory_failed", error=str(e))


    async def get_memories(self, agent_id: str, user_id: str) -> List[Dict]:
        try:
            response = self.memory_collection.select("*").eq("agent_id", agent_id).eq("user_id", user_id).execute()
            return response.data
        except Exception as e:
            log.error("get_memories_failed", error=str(e))
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
            # Find active conversation
            response = self.conversations_collection.select("id, messages").eq("user_id", user_id).eq("agent_id", agent_id).execute()
            
            if response.data:
                conv_id = response.data[0]["id"]
                messages = response.data[0].get("messages", []) or []
                messages.append(message)
                self.conversations_collection.update({
                    "messages": messages,
                    "last_updated": datetime.utcnow().isoformat()
                }).eq("id", conv_id).execute()
            else:
                self.conversations_collection.insert({
                    "user_id": user_id,
                    "agent_id": agent_id,
                    "messages": [message],
                    "last_updated": datetime.utcnow().isoformat()
                }).execute()
        except Exception as e:
            log.error("save_message_failed", error=str(e))


    async def get_conversation_history(
        self, user_id: str, agent_id: str, limit: int = 10
    ) -> List[Dict]:
        try:
            response = self.conversations_collection.select("messages").eq("user_id", user_id).eq("agent_id", agent_id).execute()
            if response.data and response.data[0].get("messages"):
                messages = response.data[0]["messages"]
                return messages[-limit:]
        except Exception as e:
            log.error("get_msg_history_failed", error=str(e))
        return []
