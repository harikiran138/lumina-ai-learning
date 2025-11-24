"""
Advanced Learning Analytics Service
Provides real-time analytics, insights, and predictions for student learning pathways.
Uses machine learning for pattern detection and predictive modeling.
"""

import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from typing import List, Dict, Any, Optional
from datetime import datetime
from loguru import logger
from db import get_db
from sqlalchemy.orm import Session
from models import (
    StudentProgress, AssessmentScore, LearningActivity,
    LearningPathway
)

class LearningAnalytics:
    def __init__(self):
        self.scaler = StandardScaler()
        self.prediction_model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        self.anomaly_detector = IsolationForest(
            contamination=0.1,
            random_state=42
        )
        self.cached_analytics = {}
        self.cache_ttl = 300  # 5 minutes

    async def get_student_analytics(self, student_id: str) -> Dict[str, Any]:
        """Get comprehensive analytics for a student."""
        try:
            # Check cache first
            cache_key = f"student_analytics_{student_id}"
            cached = self._get_cached_analytics(cache_key)
            if cached:
                return cached

            db = next(get_db())
            
            # Gather all relevant data
            progress = await self._get_student_progress(db, student_id)
            assessments = await self._get_assessment_history(db, student_id)
            activities = await self._get_learning_activities(db, student_id)
            pathway = await self._get_current_pathway(db, student_id)
            
            # Calculate various metrics
            engagement_score = self._calculate_engagement_score(activities)
            mastery_prediction = await self._predict_mastery(student_id, progress, assessments)
            weak_areas = self._identify_weak_areas(assessments, progress)
            learning_patterns = self._analyze_learning_patterns(activities)
            pace_analysis = self._analyze_learning_pace(activities, pathway)
            risk_factors = self._identify_risk_factors(progress, assessments, activities)
            
            # Compile analytics
            analytics = {
                "student_id": student_id,
                "timestamp": datetime.utcnow().isoformat(),
                "overview": {
                    "engagement_score": engagement_score,
                    "predicted_mastery": mastery_prediction,
                    "completion_rate": self._calculate_completion_rate(progress),
                    "current_streak": progress.get("current_streak", 0),
                    "average_score": np.mean([a["score"] for a in assessments]) if assessments else 0
                },
                "mastery": {
                    "by_topic": self._calculate_topic_mastery(assessments),
                    "trend": self._calculate_mastery_trend(assessments),
                    "predicted_outcomes": mastery_prediction,
                    "weak_areas": weak_areas
                },
                "engagement": {
                    "score": engagement_score,
                    "patterns": learning_patterns,
                    "recent_activity": self._get_recent_activity_summary(activities),
                    "pace_analysis": pace_analysis
                },
                "risk_assessment": {
                    "overall_risk": risk_factors.get("overall_risk", "low"),
                    "factors": risk_factors.get("specific_factors", []),
                    "recommendations": risk_factors.get("recommendations", [])
                },
                "recommendations": await self._generate_personalized_recommendations(
                    student_id, weak_areas, learning_patterns, risk_factors
                )
            }
            
            # Cache the results
            self._cache_analytics(cache_key, analytics)
            
            return analytics

        except Exception as e:
            logger.error(f"Error generating student analytics: {str(e)}")
            return {
                "student_id": student_id,
                "error": "Failed to generate analytics",
                "timestamp": datetime.utcnow().isoformat()
            }

    async def get_class_analytics(self, course_id: str) -> Dict[str, Any]:
        """Get real-time analytics for an entire class."""
        try:
            # Check cache
            cache_key = f"class_analytics_{course_id}"
            cached = self._get_cached_analytics(cache_key)
            if cached:
                return cached

            db = next(get_db())
            
            # Get all students in the course
            students = await self._get_course_students(db, course_id)
            
            # Gather and aggregate student data
            student_analytics = []
            for student in students:
                analytics = await self.get_student_analytics(student.id)
                student_analytics.append(analytics)
            
            # Calculate class-wide metrics
            class_analytics = {
                "course_id": course_id,
                "timestamp": datetime.utcnow().isoformat(),
                "overview": {
                    "total_students": len(students),
                    "average_engagement": np.mean([a["overview"]["engagement_score"] for a in student_analytics]),
                    "average_mastery": np.mean([a["overview"]["predicted_mastery"] for a in student_analytics]),
                    "completion_rate": np.mean([a["overview"]["completion_rate"] for a in student_analytics])
                },
                "mastery_distribution": self._calculate_mastery_distribution(student_analytics),
                "engagement_patterns": self._analyze_class_engagement(student_analytics),
                "risk_analysis": self._analyze_class_risks(student_analytics),
                "topic_analysis": self._analyze_topic_performance(student_analytics),
                "recommendations": self._generate_class_recommendations(student_analytics)
            }
            
            # Cache results
            self._cache_analytics(cache_key, class_analytics)
            
            return class_analytics

        except Exception as e:
            logger.error(f"Error generating class analytics: {str(e)}")
            return {
                "course_id": course_id,
                "error": "Failed to generate class analytics",
                "timestamp": datetime.utcnow().isoformat()
            }

    async def detect_learning_anomalies(self, student_id: str) -> Dict[str, Any]:
        """Detect unusual patterns or anomalies in learning behavior."""
        try:
            db = next(get_db())
            
            # Get recent activities
            activities = await self._get_learning_activities(db, student_id)
            
            # Prepare features for anomaly detection
            features = self._prepare_anomaly_features(activities)
            
            # Detect anomalies
            anomaly_scores = self.anomaly_detector.fit_predict(features)
            
            # Analyze anomalies
            anomalies = self._analyze_anomalies(activities, anomaly_scores)
            
            return {
                "student_id": student_id,
                "timestamp": datetime.utcnow().isoformat(),
                "anomalies": anomalies,
                "recommendations": self._generate_anomaly_recommendations(anomalies)
            }

        except Exception as e:
            logger.error(f"Error detecting learning anomalies: {str(e)}")
            return {
                "student_id": student_id,
                "error": "Failed to detect anomalies",
                "timestamp": datetime.utcnow().isoformat()
            }

    def _get_cached_analytics(self, key: str) -> Optional[Dict[str, Any]]:
        """Get analytics from cache if not expired."""
        if key in self.cached_analytics:
            cached_data = self.cached_analytics[key]
            if (datetime.utcnow() - cached_data["cached_at"]).total_seconds() < self.cache_ttl:
                return cached_data["data"]
        return None

    def _cache_analytics(self, key: str, data: Dict[str, Any]):
        """Cache analytics data with timestamp."""
        self.cached_analytics[key] = {
            "data": data,
            "cached_at": datetime.utcnow()
        }

    async def _get_student_progress(self, db: Session, student_id: str) -> Dict[str, Any]:
        """Get detailed student progress data."""
        progress = db.query(StudentProgress).filter(
            StudentProgress.student_id == student_id
        ).order_by(StudentProgress.created_at.desc()).all()
        
        return {
            "completed_lessons": sum(len(p.completed_lessons) for p in progress),
            "current_streak": max((p.current_streak for p in progress), default=0),
            "mastery_scores": [p.mastery_score for p in progress if p.mastery_score],
            "recent_progress": [p for p in progress][:10]
        }

    async def _get_course_students(self, db: Session, course_id: str) -> List[Any]:
        """Get all students enrolled in a course."""
        from models import StudentCourseEnrollment
        
        enrollments = db.query(StudentCourseEnrollment).filter(
            StudentCourseEnrollment.course_id == course_id,
            StudentCourseEnrollment.is_active
        ).all()
        
        return [enrollment.student for enrollment in enrollments]

    async def _get_assessment_history(self, db: Session, student_id: str) -> List[Dict[str, Any]]:
        """Get student's assessment history."""
        assessments = db.query(AssessmentScore).filter(
            AssessmentScore.student_id == student_id
        ).order_by(AssessmentScore.submitted_at.desc()).all()
        
        return [
            {
                "id": a.id,
                "score": a.score,
                "topic": a.topic,
                "submitted_at": a.submitted_at,
                "duration": a.duration_minutes
            }
            for a in assessments
        ]

    async def _get_learning_activities(self, db: Session, student_id: str) -> List[Dict[str, Any]]:
        """Get student's learning activities."""
        activities = db.query(LearningActivity).filter(
            LearningActivity.student_id == student_id
        ).order_by(LearningActivity.created_at.desc()).limit(100).all()
        
        return [
            {
                "id": a.id,
                "type": a.activity_type,
                "duration": a.duration_minutes,
                "completed": a.completed,
                "created_at": a.created_at
            }
            for a in activities
        ]

    async def _get_current_pathway(self, db: Session, student_id: str) -> Optional[Dict[str, Any]]:
        """Get student's current learning pathway."""
        pathway = db.query(LearningPathway).filter(
            LearningPathway.student_id == student_id,
            LearningPathway.is_active
        ).first()
        
        return pathway.pathway_data if pathway else None

    def _calculate_engagement_score(self, activities: List[Dict[str, Any]]) -> float:
        """Calculate student engagement score based on activities."""
        if not activities:
            return 0.0
            
        # Calculate recency weights
        now = datetime.utcnow()
        recency_weights = [
            1 / (1 + (now - a["created_at"]).days)
            for a in activities
        ]
        
        # Calculate activity scores
        activity_scores = [
            self._score_activity(activity) * weight
            for activity, weight in zip(activities, recency_weights)
        ]
        
        return min(100, sum(activity_scores) / len(activities) * 100)

    def _score_activity(self, activity: Dict[str, Any]) -> float:
        """Score individual learning activity."""
        base_score = 0.5
        
        # Adjust for completion
        if activity["completed"]:
            base_score += 0.3
            
        # Adjust for duration
        if activity["duration"] > 30:  # More than 30 minutes
            base_score += 0.2
            
        return min(1.0, base_score)

    def _analyze_learning_patterns(self, activities: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze learning patterns from student activities."""
        if not activities:
            return {
                "best_time_of_day": None,
                "preferred_duration": None,
                "completion_rate": 0.0,
                "patterns": []
            }

        # Analyze time of day preferences
        hours = [activity["created_at"].hour for activity in activities]
        morning = sum(1 for h in hours if 6 <= h < 12)
        afternoon = sum(1 for h in hours if 12 <= h < 18)
        evening = sum(1 for h in hours if 18 <= h)
        
        time_periods = {
            "morning": morning,
            "afternoon": afternoon,
            "evening": evening
        }
        best_time_of_day = max(time_periods.items(), key=lambda x: x[1])[0]
        
        # Analyze duration preferences
        durations = [activity["duration"] for activity in activities]
        avg_duration = np.mean(durations) if durations else 0
        
        # Analyze completion patterns
        completed_count = sum(1 for activity in activities if activity["completed"])
        completion_rate = completed_count / len(activities) if activities else 0
        
        return {
            "best_time_of_day": best_time_of_day,
            "preferred_duration": avg_duration,
            "completion_rate": completion_rate,
            "patterns": [
                "Prefers " + best_time_of_day + " study sessions",
                f"Average session duration: {avg_duration:.1f} minutes",
                f"Task completion rate: {completion_rate*100:.1f}%"
            ]
        }

    def _identify_weak_areas(self, assessments: List[Dict[str, Any]], progress: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Identify areas needing improvement."""
        topic_scores = {}
        
        # Group assessment scores by topic
        for assessment in assessments:
            topic = assessment["topic"]
            if topic not in topic_scores:
                topic_scores[topic] = []
            topic_scores[topic].append(assessment["score"])
        
        # Identify weak areas (topics with average score below 70%)
        weak_areas = []
        for topic, scores in topic_scores.items():
            avg_score = np.mean(scores)
            if avg_score < 70:
                weak_areas.append({
                    "topic": topic,
                    "average_score": avg_score,
                    "assessment_count": len(scores),
                    "last_assessment": max(
                        (a["submitted_at"] for a in assessments if a["topic"] == topic),
                        default=None
                    )
                })
        
        return sorted(weak_areas, key=lambda x: x["average_score"])

    async def _predict_mastery(
        self, 
        student_id: str,
        progress: Dict[str, Any],
        assessments: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Predict future mastery levels based on current data."""
        try:
            # Prepare features for prediction
            features = self._prepare_prediction_features(progress, assessments)
            
            # Make predictions
            predictions = self.prediction_model.predict(features)
            
            return {
                "predicted_mastery": float(predictions[0]),
                "confidence": self._calculate_prediction_confidence(features),
                "timeframe": "4 weeks",
                "factors": self._get_prediction_factors(features)
            }
        except Exception as e:
            logger.error(f"Error predicting mastery: {str(e)}")
            return {
                "predicted_mastery": None,
                "error": "Prediction failed"
            }

    def _prepare_prediction_features(
        self,
        progress: Dict[str, Any],
        assessments: List[Dict[str, Any]]
    ) -> np.ndarray:
        """Prepare features for mastery prediction."""
        features = [
            np.mean(progress["mastery_scores"]) if progress["mastery_scores"] else 0,
            len(progress["completed_lessons"]),
            progress["current_streak"],
            np.mean([a["score"] for a in assessments]) if assessments else 0,
            len(assessments),
            self._calculate_consistency_score(assessments)
        ]
        return np.array(features).reshape(1, -1)

    def _prepare_anomaly_features(self, activities: List[Dict[str, Any]]) -> np.ndarray:
        """Prepare features for anomaly detection."""
        if not activities:
            return np.array([]).reshape(0, 4)
        
        features = []
        for activity in activities:
            # Extract key metrics for anomaly detection
            feature_vector = [
                activity["duration"],  # Session duration
                1 if activity["completed"] else 0,  # Completion status
                self._calculate_engagement_level(activity),  # Engagement level
                (datetime.utcnow() - activity["created_at"]).total_seconds() / 3600  # Hours since activity
            ]
            features.append(feature_vector)
            
        return np.array(features)

    def _calculate_engagement_level(self, activity: Dict[str, Any]) -> float:
        """Calculate engagement level for an activity."""
        engagement = 0.0
        
        # Base engagement from duration
        if activity["duration"] > 0:
            engagement += min(1.0, activity["duration"] / 60)  # Max 1.0 for sessions over 60 mins
            
        # Bonus for completion
        if activity["completed"]:
            engagement += 0.5
            
        # Normalize to 0-1 range
        return min(1.0, engagement)

    def _analyze_anomalies(
        self, 
        activities: List[Dict[str, Any]], 
        anomaly_scores: np.ndarray
    ) -> List[Dict[str, Any]]:
        """Analyze detected anomalies and provide context."""
        anomalies = []
        
        for idx, score in enumerate(anomaly_scores):
            if score == -1:  # Anomaly detected
                activity = activities[idx]
                anomaly = {
                    "timestamp": activity["created_at"].isoformat(),
                    "type": self._determine_anomaly_type(activity),
                    "severity": self._calculate_anomaly_severity(activity),
                    "context": self._get_anomaly_context(activity),
                    "suggested_action": self._get_suggested_action(activity)
                }
                anomalies.append(anomaly)
                
        return anomalies
        
    def _determine_anomaly_type(self, activity: Dict[str, Any]) -> str:
        """Determine the type of anomaly based on activity metrics."""
        if activity["duration"] < 5:  # Very short duration
            return "brief_engagement"
        if activity["duration"] > 180:  # Very long duration
            return "extended_session"
        if not activity["completed"]:
            return "incomplete_activity"
        return "irregular_pattern"
        
    def _calculate_anomaly_severity(self, activity: Dict[str, Any]) -> str:
        """Calculate severity level of an anomaly."""
        severity_score = 0
        
        # Duration-based severity
        if activity["duration"] < 1 or activity["duration"] > 240:
            severity_score += 2
        elif activity["duration"] < 5 or activity["duration"] > 180:
            severity_score += 1
            
        # Completion-based severity
        if not activity["completed"]:
            severity_score += 1
            
        return "high" if severity_score >= 2 else "medium" if severity_score == 1 else "low"
        
    def _get_anomaly_context(self, activity: Dict[str, Any]) -> str:
        """Get contextual information about the anomaly."""
        context_parts = []
        
        if activity["duration"] < 5:
            context_parts.append("Unusually short session duration")
        elif activity["duration"] > 180:
            context_parts.append("Exceptionally long session duration")
            
        if not activity["completed"]:
            context_parts.append("Activity left incomplete")
            
        return " and ".join(context_parts) or "Irregular activity pattern detected"
        
    def _get_suggested_action(self, activity: Dict[str, Any]) -> str:
        """Get suggested action based on anomaly type."""
        if activity["duration"] < 5:
            return "Review minimum engagement requirements with student"
        if activity["duration"] > 180:
            return "Check for potential session timing issues or continuous activity monitoring"
        if not activity["completed"]:
            return "Follow up on completion barriers"
        return "Monitor for pattern continuation"

    def _generate_anomaly_recommendations(self, anomalies: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate recommendations based on detected anomalies."""
        recommendations = []
        
        if not anomalies:
            return [{
                "type": "positive",
                "message": "No significant learning anomalies detected",
                "action": "Continue with current learning approach"
            }]
            
        # Analyze patterns in anomalies
        brief_sessions = sum(1 for a in anomalies if a["type"] == "brief_engagement")
        incomplete_activities = sum(1 for a in anomalies if a["type"] == "incomplete_activity")
        extended_sessions = sum(1 for a in anomalies if a["type"] == "extended_session")
        
        if brief_sessions > 0:
            recommendations.append({
                "type": "engagement",
                "message": f"Detected {brief_sessions} unusually brief learning sessions",
                "action": "Schedule regular study time blocks of at least 25-30 minutes"
            })
            
        if incomplete_activities > 0:
            recommendations.append({
                "type": "completion",
                "message": f"Found {incomplete_activities} incomplete activities",
                "action": "Review incomplete activities and identify any obstacles to completion"
            })
            
        if extended_sessions > 0:
            recommendations.append({
                "type": "pacing",
                "message": f"Noticed {extended_sessions} extended learning sessions",
                "action": "Consider breaking long sessions into smaller, focused study periods"
            })
            
        return recommendations

    def _calculate_prediction_confidence(self, features: np.ndarray) -> float:
        """Calculate confidence score for predictions."""
        # Simple heuristic based on feature completeness
        non_zero_features = np.count_nonzero(features)
        return min(1.0, non_zero_features / features.shape[1])

    def _calculate_consistency_score(self, assessments: List[Dict[str, Any]]) -> float:
        """Calculate learning consistency score."""
        if not assessments:
            return 0.0
            
        scores = [a["score"] for a in assessments]
        return 1.0 - np.std(scores) / 100 if scores else 0.0

    async def _generate_personalized_recommendations(
        self,
        student_id: str,
        weak_areas: List[Dict[str, Any]],
        learning_patterns: Dict[str, Any],
        risk_factors: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate personalized learning recommendations."""
        recommendations = []
        
        # Add recommendations based on weak areas
        for area in weak_areas[:3]:  # Top 3 weak areas
            recommendations.append({
                "type": "review",
                "priority": "high",
                "topic": area["topic"],
                "reason": f"Score below 70% in {area['topic']}",
                "suggestion": f"Review {area['topic']} concepts and take practice assessments"
            })
        
        # Add recommendations based on learning patterns
        if learning_patterns.get("best_time_of_day"):
            recommendations.append({
                "type": "schedule",
                "priority": "medium",
                "suggestion": f"Schedule study sessions during {learning_patterns['best_time_of_day']} for optimal learning"
            })
        
        # Add recommendations based on risk factors
        if risk_factors.get("overall_risk") == "high":
            recommendations.append({
                "type": "intervention",
                "priority": "high",
                "suggestion": "Schedule a meeting with your instructor for additional support"
            })
        
        return recommendations

# Global instance
learning_analytics = LearningAnalytics()