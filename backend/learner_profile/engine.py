from .store.state import StateStore

class LearnerProfileEngine:
    """
    Core engine for user modeling and state tracking.
    """
    def __init__(self):
        self.state_store = StateStore()

    def update_state(self, user_id: str, event: dict):
        current_state = self.state_store.get_state(user_id)
        # Update logic would go here
        # e.g. merge mastery, update behavior label
        if "behavior" in event:
            current_state["behavior_label"] = event["behavior"]
        
        self.state_store.update_state(user_id, current_state)
    
    def get_profile(self, user_id: str) -> dict:
        return self.state_store.get_state(user_id)
