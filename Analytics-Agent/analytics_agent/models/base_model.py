from abc import ABC, abstractmethod
from typing import Any, Dict

class AnalyticsModel(ABC):
    """
    Abstract Base Class for all analytics models in the Lumina agent.
    """
    
    @abstractmethod
    def predict(self, features: Dict[str, Any], context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Produce a prediction given input features and context.
        """
        pass
