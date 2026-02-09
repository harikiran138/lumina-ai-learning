from datetime import datetime
from app.database.manager import db


class HistoryStore:
    """
    MongoDB Historical Writer for Behavior Logs.
    """

    @property
    def collection(self):
        return db.get_collection("behavior_logs")

    async def log_event(self, event: dict):
        if self.collection is None:
            return

        if "timestamp" not in event:
            event["timestamp"] = datetime.utcnow().isoformat()

        await self.collection.insert_one(event)
