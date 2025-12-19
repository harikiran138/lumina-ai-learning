class BehaviorModel:
    """
    Engagement Scoring and Behavior Analysis.
    """
    def __init__(self):
        self.state_history = []

    def calculate_engagement_score(self, session_data: dict) -> float:
        # Placeholder logic
        interactions = session_data.get("interactions", [])
        if not interactions:
            return 0.5
        return min(len(interactions) * 0.1, 1.0)
    
    def classify_behavior(self, session_data: dict) -> str:
        """
        Classifies learner behavior based on session data.
        Returns: 'focused', 'distracted', 'frustrated', 'idle'
        """
        engagement = self.calculate_engagement_score(session_data)
        avg_response_time = session_data.get("avg_response_time", 5)
        
        if engagement > 0.8:
            return "focused"
        elif engagement < 0.3 and avg_response_time > 10:
            return "distracted"
        elif engagement < 0.5 and avg_response_time < 2:
            return "frustrated"
        else:
            return "neutral"
