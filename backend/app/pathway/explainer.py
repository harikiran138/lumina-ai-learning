from app.pathway.schemas import PathwayAction

class Explainer:
    """
    Generates human-readable reasoning for logs and UI explanation.
    """
    
    @staticmethod
    def generate_reasoning(action: PathwayAction, target: str, raw_reason: str) -> str:
        """
        Formats the reasoning string clearly.
        """
        if action == PathwayAction.REST:
            return f"Taking a break. {raw_reason}"
        elif action == PathwayAction.REVIEW:
            return f"Reviewing '{target}'. {raw_reason}"
        elif action == PathwayAction.ADVANCE:
            return f"Advancing to new material '{target}'. {raw_reason}"
        else:
            return f"Continuing with '{target}'. {raw_reason}"
