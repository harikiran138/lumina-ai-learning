from typing import List, Dict
from datetime import datetime
from app.database.manager import db
from app.database.models import AgentMemory, Message
from app.core.logging import structlog

log = structlog.get_logger()


class AgentStore:
    """
    Store for AI Agent Memory and Conversations.
    """

    @property
    def memory_collection(self):
        return db.get_collection("agent_memory")

    @property
    def conversations_collection(self):
        return db.get_collection("conversations")

    # --- Memory ---

    async def store_memory(self, agent_id: str, user_id: str, key: str, value: str):
        """Stores a specific fact/memory for an agent regarding a user"""
        if self.memory_collection is None:
            return

        memory = AgentMemory(
            agent_id=agent_id,
            user_id=user_id,
            context_key=key,
            memory_value=value,
            timestamp=datetime.utcnow(),
        )

        await self.memory_collection.update_one(
            {"agent_id": agent_id, "user_id": user_id, "context_key": key},
            {"$set": memory.model_dump(exclude={"id"})},
            upsert=True,
        )

    async def get_memories(self, agent_id: str, user_id: str) -> List[Dict]:
        if self.memory_collection is None:
            return []

        cursor = self.memory_collection.find({"agent_id": agent_id, "user_id": user_id})
        memories = await cursor.to_list(length=100)
        return memories

    # --- Conversation ---

    async def save_message(self, user_id: str, agent_id: str, role: str, content: str):
        """Appends a message to the conversation history"""
        if self.conversations_collection is None:
            return

        message = Message(role=role, content=content, timestamp=datetime.utcnow())

        # Find active conversation or create new
        # For simplicity, we assume one active conversation per agent-user pair for now
        # Or we could just $push to a document

        await self.conversations_collection.update_one(
            {"user_id": user_id, "agent_id": agent_id},
            {
                "$push": {"messages": message.model_dump()},
                "$set": {"last_updated": datetime.utcnow()},
            },
            upsert=True,
        )

    async def get_conversation_history(
        self, user_id: str, agent_id: str, limit: int = 10
    ) -> List[Dict]:
        if self.conversations_collection is None:
            return []

        doc = await self.conversations_collection.find_one(
            {"user_id": user_id, "agent_id": agent_id}
        )
        if not doc or "messages" not in doc:
            return []

        # Return last N messages
        return doc["messages"][-limit:]
