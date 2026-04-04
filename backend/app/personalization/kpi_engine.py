import math
from datetime import datetime, timedelta
from typing import List, Dict

from app.personalization.schemas import (
    LearnerProfileRecord,
    LearningEventRecord,
    LearningEventType,
    KPISnapshot,
)
from app.services.student_analytics import (
    compute_student_analytics,
    _classify_tier,
    _detect_study_pattern,
    _compute_growth_trend,
    _recommend_section,
)

class KPIEngine:
    """
    Computes shared KPI metrics representing a student's learning health, momentum,
    and authenticity based on their historical events and current profile state.
    """

    @classmethod
    def compute_snapshot(
        cls, profile: LearnerProfileRecord, recent_events: List[LearningEventRecord]
    ) -> KPISnapshot:
        """
        Computes a fresh KPI snapshot using the profile and a window of recent events.
        """
        now = datetime.utcnow()
        
        # We only consider events from the last 7 days for velocity/lag
        time_window = now - timedelta(days=7)
        relevant_events = [e for e in recent_events if e.created_at.replace(tzinfo=None) >= time_window]
        
        assessment_events = [e for e in relevant_events if e.event_type == LearningEventType.ASSESSMENT_ANSWER]
        
        growth_vel = cls._calculate_growth_velocity(assessment_events)
        lag_zone = cls._calculate_lag_zone(assessment_events)
        auth_score = cls._calculate_authenticity(assessment_events, profile)
        exp_effectiveness = cls._calculate_explanation_effectiveness(profile)
        engagement = cls._calculate_engagement(relevant_events, profile)
        persistence = cls._calculate_persistence(relevant_events)
        readiness = cls._calculate_readiness(profile)

        # AI analytics fields — derived from student_analytics service
        tier, _tier_score = _classify_tier(profile)
        pattern, _pattern_detail = _detect_study_pattern(relevant_events)
        trend, _trend_vel = _compute_growth_trend(profile)
        section = _recommend_section(tier, trend)

        return KPISnapshot(
            growth_velocity=growth_vel,
            lag_zone_score=lag_zone,
            authenticity_score=auth_score,
            explanation_effectiveness=exp_effectiveness,
            engagement_score=engagement,
            persistence=persistence,
            readiness=readiness,
            growth_trend=trend,
            tier=tier,
            study_pattern=pattern,
            recommended_section=section,
            recorded_at=now,
        )

    @staticmethod
    def _calculate_engagement(events: List[LearningEventRecord], profile: LearnerProfileRecord) -> float:
        """
        Calculates engagement based on recent event frequency and streak.
        """
        base_score = min(len(events) / 20.0, 1.0) # Cap at 20 events per week
        streak_bonus = min(profile.engagement_summary.current_streak / 10.0, 0.5)
        return min(round(base_score + streak_bonus, 2), 1.0)

    @staticmethod
    def _calculate_persistence(events: List[LearningEventRecord]) -> float:
        """
        Measures the likelihood of retrying after failure.
        """
        assessment_events = [e for e in events if e.event_type == LearningEventType.ASSESSMENT_ANSWER]
        if not assessment_events:
            return 0.5
        
        retries = 0
        failures = 0
        for e in assessment_events:
            if e.payload.get("is_correct") is False:
                failures += 1
            if e.payload.get("attempt_number", 1) > 1:
                retries += 1
                
        if failures == 0:
            return 1.0
        return min(round(retries / float(failures), 2), 1.0)

    @staticmethod
    def _calculate_readiness(profile: LearnerProfileRecord) -> float:
        """
        Determines overall readiness to tackle new/advanced topics.
        """
        performance = profile.performance_summary.recent_average_score / 100.0
        if performance == 0:
            return 0.5
        return min(round(performance, 2), 1.0)

    @staticmethod
    def _calculate_growth_velocity(events: List[LearningEventRecord]) -> float:
        """
        Calculates the rate of correct answers or mastery progression.
        Returns a rolling average of correctness over the recent assessment events,
        scaled 0.0 to 1.0. 
        """
        if not events:
            return 0.0
            
        correct_count = sum(1 for e in events if e.payload.get("is_correct") is True)
        return round(float(correct_count) / len(events), 2)

    @staticmethod
    def _calculate_lag_zone(events: List[LearningEventRecord]) -> float:
        """
        Measures 'spinning wheels' - high attempt volume with low correctness.
        Returns a score from 0.0 (no lag) to 1.0 (severe lag).
        """
        if not events:
            return 0.0
            
        incorrect_count = sum(1 for e in events if e.payload.get("is_correct") is False)
        error_rate = float(incorrect_count) / len(events)
        
        # If error rate is high and volume of events is also high, they are in a lag zone
        volume_penalty = min(len(events) / 50.0, 1.0) # Peaks if >= 50 questions answered recently
        
        return round(error_rate * volume_penalty, 2)

    @staticmethod
    def _calculate_authenticity(events: List[LearningEventRecord], profile: LearnerProfileRecord) -> float:
        """
        Heuristic for authenticity based on response timing vs text length.
        A very low timing for a very long response text indicates copy-paste.
        Returns 0.0 to 1.0 (1.0 = highly authentic).
        """
        if not events:
            # Fallback to the last known score if available, otherwise assume 1.0
            return profile.kpi_snapshot.authenticity_score if profile.kpi_snapshot else 1.0
            
        scores = []
        for e in events:
            time_taken = e.payload.get("time_taken", 0)
            answer_text = e.payload.get("answer_text", "")
            
            # If no time track or no text, it's neutral (skip or assume authentic)
            if not time_taken or not answer_text:
                continue
                
            char_count = len(answer_text)
            # Rough heuristic: average typing speed is ~200 chars/min (3.3 chars/sec)
            # If they typed > 10 chars per second, it's highly suspect.
            chars_per_sec = char_count / float(time_taken)
            
            if chars_per_sec > 15.0:
                scores.append(0.2) # High chance of copy-paste
            elif chars_per_sec > 8.0:
                scores.append(0.5) # Suspect
            else:
                scores.append(1.0) # Looks normal
                
        if not scores:
            return profile.kpi_snapshot.authenticity_score if profile.kpi_snapshot else 1.0
            
        avg_score = sum(scores) / len(scores)
        return round(avg_score, 2)

    @staticmethod
    def _calculate_explanation_effectiveness(profile: LearnerProfileRecord) -> float:
        """
        Averages the effectiveness of the student's explanation profile.
        """
        strategies = profile.explanation_profile.strategies
        if not strategies:
            return 0.5
            
        total_effectiveness = sum(s.effectiveness_score for s in strategies.values())
        return round(total_effectiveness / len(strategies), 2)
