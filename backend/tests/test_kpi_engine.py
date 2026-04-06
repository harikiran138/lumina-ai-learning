import pytest
from datetime import datetime, timedelta
from app.personalization.schemas import (
    LearnerProfileRecord,
    LearningEventRecord,
    LearningEventType,
)
from app.personalization.kpi_engine import KPIEngine

@pytest.fixture
def base_profile():
    return LearnerProfileRecord(user_id="test_user_kpi")

def build_event(is_correct: bool, time_taken: float, answer_text: str, days_ago: int = 0):
    return LearningEventRecord(
        user_id="test_user_kpi",
        event_type=LearningEventType.ASSESSMENT_ANSWER,
        payload={
            "is_correct": is_correct,
            "time_taken": time_taken,
            "answer_text": answer_text
        },
        created_at=datetime.utcnow() - timedelta(days=days_ago)
    )

def test_growth_velocity():
    profile = LearnerProfileRecord(user_id="test_1")
    
    events = [
        build_event(True, 10, "answer"),
        build_event(True, 12, "answer 2"),
        build_event(False, 5, "wrong"),
        build_event(True, 15, "right again")
    ]
    # 3 correct out of 4 = 0.75
    snapshot = KPIEngine.compute_snapshot(profile, events)
    assert snapshot.growth_velocity == 0.75

def test_lag_zone():
    profile = LearnerProfileRecord(user_id="test_1")
    
    # 10 wrong answers out of 10.
    # If they haven't gotten anything right in 3+ attempts, lag spikes to 0.9
    events = [build_event(False, 5, "w") for _ in range(10)]
    snapshot = KPIEngine.compute_snapshot(profile, events)
    assert snapshot.lag_zone_score == 0.9
    
    # 50 wrong answers out of 50.
    # Still hits the lag spike return 0.9
    large_lag_events = [build_event(False, 5, "w") for _ in range(50)]
    large_snapshot = KPIEngine.compute_snapshot(profile, large_lag_events)
    assert large_snapshot.lag_zone_score == 0.9

def test_authenticity_high():
    profile = LearnerProfileRecord(user_id="test_1")
    # Typing 20 chars in 10 seconds -> 2 chars / sec. Authentic.
    events = [build_event(True, 10.0, "This is twenty chars")]
    snapshot = KPIEngine.compute_snapshot(profile, events)
    assert snapshot.authenticity_score == 1.0

def test_authenticity_copy_paste():
    profile = LearnerProfileRecord(user_id="test_1")
    # Typing 200 chars in 2 seconds -> 100 chars / sec. Highly suspect!
    long_text = "A" * 200
    events = [build_event(True, 2.0, long_text)]
    snapshot = KPIEngine.compute_snapshot(profile, events)
    assert snapshot.authenticity_score == 0.20

def test_authenticity_mixed():
    profile = LearnerProfileRecord(user_id="test_1")
    long_text = "A" * 200
    events = [
        build_event(True, 2.0, long_text),       # 0.2
        build_event(True, 50.0, long_text),      # 4 chars/sec (Authentic, 1.0)
        build_event(True, 20.0, long_text)       # 10 chars/sec (Suspect, 0.5)
    ]
    # Average: (0.2 + 1.0 + 0.5) / 3 = 1.7 / 3 = 0.566 -> 0.57
    snapshot = KPIEngine.compute_snapshot(profile, events)
    assert snapshot.authenticity_score == 0.57

def test_explanation_effectiveness_default():
    profile = LearnerProfileRecord(user_id="test_1")
    # Without any explanation strategies logged, should default to 0.5
    snapshot = KPIEngine.compute_snapshot(profile, [])
    assert snapshot.explanation_effectiveness == 0.5

def test_skips_old_events():
    profile = LearnerProfileRecord(user_id="test_1")
    events = [
        build_event(False, 5.0, "A", days_ago=10), # Should be ignored
        build_event(True, 5.0, "A", days_ago=1)    # Included
    ]
    snapshot = KPIEngine.compute_snapshot(profile, events)
    assert snapshot.growth_velocity == 1.0 # Only the 1 recent correct answer is counted
