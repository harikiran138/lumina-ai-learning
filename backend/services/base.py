"""Base classes and types for services"""
from typing import Dict, Any, List
from datetime import datetime

class AnalyticsEvent:
    """Base class for analytics events"""
    def __init__(self, 
                 event_type: str, 
                 user_id: str, 
                 timestamp: datetime,
                 data: Dict[str, Any]):
        self.event_type = event_type
        self.user_id = user_id
        self.timestamp = timestamp
        self.data = data

class AnalyticsSubscriber:
    """Base class for analytics subscribers"""
    async def on_analytics_event(self, event: AnalyticsEvent) -> None:
        """Handle an analytics event"""
        pass

class AnalyticsPublisher:
    """Base class for analytics publishers"""
    def __init__(self):
        self._subscribers: List[AnalyticsSubscriber] = []
        
    def add_subscriber(self, subscriber: AnalyticsSubscriber) -> None:
        """Add a subscriber to receive analytics events"""
        if subscriber not in self._subscribers:
            self._subscribers.append(subscriber)
            
    def remove_subscriber(self, subscriber: AnalyticsSubscriber) -> None:
        """Remove a subscriber from analytics events"""
        if subscriber in self._subscribers:
            self._subscribers.remove(subscriber)
            
    async def broadcast_event(self, event: AnalyticsEvent) -> None:
        """Broadcast an analytics event to all subscribers"""
        for subscriber in self._subscribers:
            await subscriber.on_analytics_event(event)