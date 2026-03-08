import json
import os
from copy import deepcopy
from typing import Any, Dict, List


DEFAULT_LOCAL_DB = {
    "users": [],
    "courses": [],
    "progress": [],
    "certificates": [],
    "assignments": [],
    "submissions": [],
    "user_data": [],
    "assessment_sessions": [],
}


class LocalJsonStore:
    """
    Lightweight JSON persistence for local development and test environments
    where Supabase is unavailable.
    """

    def __init__(self):
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.data_dir = os.path.join(base_dir, "data")
        os.makedirs(self.data_dir, exist_ok=True)
        self.file_path = os.path.join(self.data_dir, "local_db.json")

    def read(self) -> Dict[str, Any]:
        if not os.path.exists(self.file_path):
            return deepcopy(DEFAULT_LOCAL_DB)

        try:
            with open(self.file_path, "r", encoding="utf-8") as handle:
                payload = json.load(handle)
        except (OSError, json.JSONDecodeError):
            return deepcopy(DEFAULT_LOCAL_DB)

        data = deepcopy(DEFAULT_LOCAL_DB)
        data.update(payload)
        return data

    def write(self, payload: Dict[str, Any]):
        with open(self.file_path, "w", encoding="utf-8") as handle:
            json.dump(payload, handle, indent=2)

    def table(self, name: str) -> List[Dict[str, Any]]:
        return self.read().get(name, [])
