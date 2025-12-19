from .handwriting_agent import HandwritingAgent

class Orchestrator:
    """
    Master Agent that routes user intent to specialized agents.
    """
    def __init__(self):
        self.handwriting_agent = HandwritingAgent()

    def route_request(self, user_input: str, context: dict):
        """
        Analyze input and delegate to appropriate agent.
        """
        # Simple routing rule for now
        if context.get("type") == "handwriting_analysis":
            file_path = context.get("file_path")
            answer_key = context.get("answer_key")
            return self.handwriting_agent.analyze(file_path, answer_key)
            
        raise NotImplementedError("Orchestrator routing logic not implemented for this request.")
