import pytest
from analytics_agent.core.signal_processor import SignalProcessor
from analytics_agent.core.aggregator import EventAggregator

@pytest.fixture
def processor():
    return SignalProcessor()

@pytest.fixture
def aggregator():
    return EventAggregator()

def test_normalization(processor):
    events = [
        {"event_type": "scroll", "payload": {"velocity": 15.0}}, # High velocity
        {"event_type": "click", "payload": {}}
    ]
    history = {"avg_scroll_velocity": 10.0, "std_scroll_velocity": 5.0} # 15 is +1 std
    
    normalized = processor.normalize_batch(events, history)
    
    assert len(normalized) == 2
    # Scroll: (15-10)/5 = 1.0
    assert normalized[0]["normalized_intensity"] == 1.0
    assert normalized[0]["weight"] == 0.4 # from source_weights
    
    # Click: default intensity 1.0, weight 0.6
    assert normalized[1]["normalized_intensity"] == 1.0
    assert normalized[1]["weight"] == 0.6

def test_noise_filtering(processor):
    events = [
        {"event_type": "pause", "payload": {"duration": 20}},  # Keep
        {"event_type": "pause", "payload": {"duration": 600}} # Drop (idle > 300)
    ]
    
    filtered = processor.filter_noise(events)
    assert len(filtered) == 1
    assert filtered[0]["payload"]["duration"] == 20

def test_aggregation(aggregator):
    # Mock normalized events
    events = [
        {"event_type": "scroll", "normalized_intensity": 1.0, "weight": 0.5},
        {"event_type": "scroll", "normalized_intensity": 2.0, "weight": 0.5},
        {"event_type": "click", "normalized_intensity": 1.0, "weight": 1.0}
    ]
    
    features = aggregator.aggregate_window(events)
    
    assert features["event_count"] == 3
    # Intensity: (1*0.5) + (2*0.5) + (1*1.0) = 0.5 + 1.0 + 1.0 = 2.5
    assert features["total_weighted_intensity"] == 2.5
    assert features["dominant_event"] == "scroll"
