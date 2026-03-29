import json
from datetime import datetime
from pathlib import Path


class HistoryStore:
    """
    Local behavior log writer for learner profile events.
    """

    def __init__(self):
        self.path = Path(__file__).resolve().parents[2] / "data" / "behavior_logs.json"

    async def log_event(self, event: dict):
        if "timestamp" not in event:
            event["timestamp"] = datetime.utcnow().isoformat()

        self.path.parent.mkdir(parents=True, exist_ok=True)
        if self.path.exists():
            try:
                existing = json.loads(self.path.read_text())
            except json.JSONDecodeError:
                existing = []
        else:
            existing = []
        existing.append(event)
        self.path.write_text(json.dumps(existing, indent=2))
