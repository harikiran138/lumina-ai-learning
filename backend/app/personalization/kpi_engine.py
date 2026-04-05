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
        
        # Multidimensional Learning Score (S)
        # S = 0.4*corr + 0.3*depth + 0.2*effort + 0.1*growth
        current_s = cls.calculate_learning_score(assessment_events, now)

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
            learning_score=current_s, # Added new dimension
            growth_trend=trend,
            tier=tier,
            study_pattern=pattern,
            recommended_section=section,
            recorded_at=now,
        )

    @classmethod
    def calculate_learning_score(cls, events: List[LearningEventRecord], now: datetime) -> float:
        """
        Calculates the 40/30/20/10 Multidimensional score.
        """
        if not events: return 0.5
        
        recent = events[-5:] # Last 5 events
        
        # 1. Correctness (40%)
        correctness = sum(1 for e in recent if e.payload.get("is_correct") is True) / len(recent)
        
        # 2. Depth (30%) - Proxy: word count or rubric depth
        depths = [len(e.payload.get("answer_text", "")) / 500.0 for e in recent]
        avg_depth = min(1.0, sum(depths) / len(recent))
        
        # 3. Effort (20%) - Proxy: time taken relative to expectation
        effort_scores = [min(1.0, e.payload.get("time_taken", 0) / 60.0) for e in recent]
        avg_effort = sum(effort_scores) / len(recent)
        
        # 4. Growth (10%) - Δ correctness between first and last half of events
        if len(events) >= 10:
            past_half = events[:-5][-5:]
            past_corr = sum(1 for e in past_half if e.payload.get("is_correct") is True) / len(past_half)
            growth = max(0, correctness - past_corr)
        else:
            growth = 0.5 # Neutral for new students
            
        s_score = (0.4 * correctness) + (0.3 * avg_depth) + (0.2 * avg_effort) + (0.1 * growth)
        return round(float(s_score), 2)

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
        Lag = (1 - L) * (1 - e^(-N/τ)) where L is local mastery and N is attempts.
        """
        if not events:
            return 0.0
            
        recent_window = events[-10:] # Last 10 attempts
        incorrect_count = sum(1 for e in recent_window if e.payload.get("is_correct") is False)
        error_rate = float(incorrect_count) / len(recent_window)
        
        # If they haven't gotten anything right in 3+ attempts, lag spikes
        if len(recent_window) >= 3 and incorrect_count == len(recent_window):
            return 0.9
            
        # Exponential volume penalty
        # Tau=5: After 5 attempts at failing, lag is significant.
        volume_penalty = 1 - math.exp(-len(events) / 5.0)
        
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
            # Priority 1: Direct score from analysis engine
            payload_auth = e.payload.get("analysis", {}).get("authenticity_score")
            if payload_auth is not None:
                scores.append(float(payload_auth))
                continue
                
            # Priority 2: Heuristic based on timing
            time_taken = e.payload.get("time_taken", 0)
            answer_text = e.payload.get("answer_text", "")
            
            if not time_taken or not answer_text:
                continue
                
            char_count = len(answer_text)
            chars_per_sec = char_count / float(time_taken)
            
            if chars_per_sec > 15.0:
                scores.append(0.2)
            elif chars_per_sec > 8.0:
                scores.append(0.5)
            else:
                scores.append(1.0)
                
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
