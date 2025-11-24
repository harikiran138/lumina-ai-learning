"""
Advanced Analytics Service
Provides predictive analytics, deep insights, and machine learning-driven predictions for student learning.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Any, Tuple
from loguru import logger
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression
from sklearn.cluster import KMeans
from tensorflow import keras

from .base import AnalyticsSubscriber
from .realtime_analytics import RealTimeAnalytics
from db import get_db

# Support both production and test models
import sys
def get_models():
    """Detect whether we are running in test mode and import appropriate models"""
    if any('pytest' in arg for arg in sys.argv) or 'test_' in __name__:
        from tests.models import (
            TestUser as User,
            TestCourse as Course,
            TestLearningPathway as LearningPathway,
            TestSkillLevel as SkillLevel,
            TestSkill as Skill,
            TestStudentProgress as StudentProgress
        )
    else:
        from models import User, Course, LearningPathway, SkillLevel, Skill, StudentProgress
    return User, Course, LearningPathway, SkillLevel, Skill, StudentProgress

# Get the appropriate models
User, Course, LearningPathway, SkillLevel, Skill, StudentProgress = get_models()


class AdvancedAnalyticsService(AnalyticsSubscriber):
    """
    Advanced analytics service providing predictive modeling,
    causal inference, and deep learning insights.
    """

    def __init__(self, realtime_analytics: RealTimeAnalytics):
        super().__init__()
        self.realtime_analytics = realtime_analytics
        self.models_cache = {}
        self.predictions_cache = {}
        self.cache_ttl = 1800  # 30 minutes

        # ML model configurations
        self.model_configs = {
            'success_predictor': {
                'type': 'gradient_boosting',
                'features': ['avg_score', 'time_spent', 'attempts', 'learning_style', 'prior_knowledge'],
                'target': 'completion_probability'
            },
            'time_predictor': {
                'type': 'random_forest',
                'features': ['skill_difficulty', 'student_level', 'learning_style', 'session_length'],
                'target': 'estimated_completion_time'
            },
            'dropout_predictor': {
                'type': 'neural_network',
                'features': ['engagement_score', 'progress_rate', 'time_between_sessions', 'error_rate'],
                'target': 'dropout_risk'
            }
        }

    async def predict_student_success(
        self,
        student_id: str,
        course_id: str,
        prediction_horizon: int = 30
    ) -> Dict[str, Any]:
        """
        Predict student success probability using machine learning models.

        Args:
            student_id: The student's ID
            course_id: The course ID
            prediction_horizon: Days to predict ahead

        Returns:
            Prediction results with confidence scores
        """
        try:
            cache_key = f"success_{student_id}_{course_id}_{prediction_horizon}"
            if cache_key in self.predictions_cache:
                cached = self.predictions_cache[cache_key]
                if (datetime.utcnow() - cached['timestamp']).seconds < self.cache_ttl:
                    return cached['result']

            # Get student data
            student_data = await self._get_student_features(student_id, course_id)

            # Get course data
            course_data = await self._get_course_features(course_id)

            # Combine features
            features = {**student_data, **course_data}

            # Load or train success prediction model
            model = await self._get_or_train_model('success_predictor', features)

            # Make prediction
            prediction = await self._predict_with_model(model, features, 'success_predictor')

            # Calculate confidence intervals
            confidence_intervals = await self._calculate_prediction_intervals(
                model, features, prediction
            )

            result = {
                'student_id': student_id,
                'course_id': course_id,
                'success_probability': float(prediction),
                'confidence_interval': confidence_intervals,
                'prediction_horizon_days': prediction_horizon,
                'feature_importance': await self._get_feature_importance(model, 'success_predictor'),
                'risk_factors': await self._identify_risk_factors(features, prediction),
                'recommendations': await self._generate_success_recommendations(features, prediction),
                'timestamp': datetime.utcnow().isoformat()
            }

            # Cache result
            self.predictions_cache[cache_key] = {
                'result': result,
                'timestamp': datetime.utcnow()
            }

            logger.info(f"Predicted success for student {student_id}: {prediction:.3f}")
            return result

        except Exception as e:
            logger.error(f"Error predicting student success: {str(e)}")
            return self._get_fallback_prediction(student_id, course_id)

    async def generate_predictive_insights(
        self,
        student_id: str
    ) -> List[Dict[str, Any]]:
        """
        Generate comprehensive predictive insights for a student.

        Args:
            student_id: The student's ID

        Returns:
            List of predictive insights
        """
        try:
            insights = []

            # Get student courses
            db = next(get_db())
            pathways = db.query(LearningPathway).filter(
                LearningPathway.student_id == student_id
            ).all()

            for pathway in pathways:
                course_id = pathway.course_id

                # Success prediction
                success_pred = await self.predict_student_success(student_id, course_id)

                # Time prediction
                time_pred = await self.predict_completion_time(student_id, course_id)

                # Learning pattern analysis
                patterns = await self.analyze_learning_patterns_advanced(student_id, course_id)

                # Generate insights
                course_insights = await self._generate_course_insights(
                    student_id, course_id, success_pred, time_pred, patterns
                )

                insights.extend(course_insights)

            # Sort by importance/urgency
            insights.sort(key=lambda x: x.get('priority_score', 0), reverse=True)

            return insights[:10]  # Return top 10 insights

        except Exception as e:
            logger.error(f"Error generating predictive insights: {str(e)}")
            return []

    async def predict_completion_time(
        self,
        student_id: str,
        course_id: str
    ) -> Dict[str, Any]:
        """
        Predict time to completion for a course.

        Args:
            student_id: The student's ID
            course_id: The course ID

        Returns:
            Time prediction with confidence
        """
        try:
            # Get features for time prediction
            features = await self._get_time_prediction_features(student_id, course_id)

            # Load or train time prediction model
            model = await self._get_or_train_model('time_predictor', features)

            # Make prediction
            prediction = await self._predict_with_model(model, features, 'time_predictor')

            # Calculate realistic time bounds
            optimistic_time = max(prediction * 0.7, 1)  # At least 1 day
            pessimistic_time = prediction * 1.5

            return {
                'estimated_days': float(prediction),
                'optimistic_days': float(optimistic_time),
                'pessimistic_days': float(pessimistic_time),
                'confidence_level': 'medium',  # Would be calculated based on model certainty
                'factors': await self._get_time_factors(features),
                'timestamp': datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Error predicting completion time: {str(e)}")
            return {'estimated_days': 30, 'confidence_level': 'low'}

    async def analyze_learning_patterns_advanced(
        self,
        student_id: str,
        course_id: str
    ) -> Dict[str, Any]:
        """
        Advanced analysis of learning patterns using time-series and clustering.

        Args:
            student_id: The student's ID
            course_id: The course ID

        Returns:
            Advanced pattern analysis
        """
        try:
            # Get historical data
            historical_data = await self._get_learning_history(student_id, course_id)

            if not historical_data:
                return {}

            # Convert to time series
            df = pd.DataFrame(historical_data)
            df['date'] = pd.to_datetime(df['date'])
            df = df.set_index('date').sort_index()

            # Analyze patterns
            patterns = {
                'consistency_score': self._calculate_consistency_score(df),
                'peak_performance_times': self._identify_peak_times(df),
                'learning_velocity': self._calculate_learning_velocity(df),
                'fatigue_indicators': self._detect_fatigue_patterns(df),
                'optimal_session_length': self._find_optimal_session_length(df),
                'skill_mastery_sequence': self._analyze_skill_sequence(df),
                'engagement_clusters': self._cluster_engagement_patterns(df)
            }

            return patterns

        except Exception as e:
            logger.error(f"Error in advanced pattern analysis: {str(e)}")
            return {}

    async def detect_anomalies(
        self,
        student_id: str,
        course_id: str
    ) -> List[Dict[str, Any]]:
        """
        Detect learning anomalies that may indicate issues.

        Args:
            student_id: The student's ID
            course_id: The course ID

        Returns:
            List of detected anomalies
        """
        try:
            anomalies = []

            # Get recent progress
            recent_progress = await self._get_recent_progress(student_id, course_id, days=7)

            if not recent_progress:
                return anomalies

            # Statistical anomaly detection
            scores = [p['score'] for p in recent_progress]
            times = [p['time_spent'] for p in recent_progress]

            # Z-score based anomaly detection
            score_z_scores = self._calculate_z_scores(scores)
            time_z_scores = self._calculate_z_scores(times)

            # Check for anomalies
            for i, progress in enumerate(recent_progress):
                anomaly_score = 0

                if abs(score_z_scores[i]) > 2:  # Unusual score
                    anomaly_score += 1
                    anomalies.append({
                        'type': 'unusual_score',
                        'severity': 'high' if abs(score_z_scores[i]) > 3 else 'medium',
                        'description': f"Unusually {'high' if score_z_scores[i] > 0 else 'low'} score",
                        'value': progress['score'],
                        'expected_range': self._get_expected_score_range(scores),
                        'timestamp': progress['timestamp']
                    })

                if abs(time_z_scores[i]) > 2:  # Unusual time spent
                    anomaly_score += 1
                    anomalies.append({
                        'type': 'unusual_time',
                        'severity': 'high' if abs(time_z_scores[i]) > 3 else 'medium',
                        'description': f"Unusually {'high' if time_z_scores[i] > 0 else 'low'} time spent",
                        'value': progress['time_spent'],
                        'expected_range': self._get_expected_time_range(times),
                        'timestamp': progress['timestamp']
                    })

            return anomalies

        except Exception as e:
            logger.error(f"Error detecting anomalies: {str(e)}")
            return []

    async def _get_student_features(self, student_id: str, course_id: str) -> Dict[str, Any]:
        """Extract features for student success prediction."""
        try:
            db = next(get_db())

            # Get progress data
            progress_entries = db.query(StudentProgress).filter(
                StudentProgress.student_id == student_id
            ).all()

            # Get skill levels
            skill_levels = db.query(SkillLevel).filter(
                SkillLevel.student_id == student_id
            ).all()

            # Calculate features
            features = {
                'avg_score': np.mean([p.score for p in progress_entries]) if progress_entries else 0,
                'total_attempts': len(progress_entries),
                'skills_mastered': len([s for s in skill_levels if float(s.level) >= 0.8]),
                'total_skills': len(skill_levels),
                'learning_consistency': self._calculate_learning_consistency(progress_entries),
                'avg_time_per_session': np.mean([getattr(p, 'time_spent', 30) for p in progress_entries]) if progress_entries else 30,
                'progress_rate': len(progress_entries) / max(1, (datetime.utcnow() - min([p.completed_at for p in progress_entries] or [datetime.utcnow()])).days)
            }

            return features

        except Exception as e:
            logger.error(f"Error getting student features: {str(e)}")
            return {}

    async def _get_course_features(self, course_id: str) -> Dict[str, Any]:
        """Extract features for course difficulty assessment."""
        try:
            db = next(get_db())

            # Get course skills
            course_skills = db.query(Skill).filter(
                Skill.course_id == course_id
            ).all()

            features = {
                'course_difficulty': np.mean([s.difficulty for s in course_skills]) if course_skills else 0.5,
                'total_skills': len(course_skills),
                'prerequisite_complexity': np.mean([len(s.prerequisites.split(',')) if s.prerequisites else 0 for s in course_skills])
            }

            return features

        except Exception as e:
            logger.error(f"Error getting course features: {str(e)}")
            return {}

    async def _get_or_train_model(self, model_name: str, features: Dict[str, Any]):
        """Get cached model or train new one."""
        try:
            if model_name in self.models_cache:
                return self.models_cache[model_name]

            # Train new model
            model = await self._train_model(model_name, features)
            self.models_cache[model_name] = model

            return model

        except Exception as e:
            logger.error(f"Error getting/training model {model_name}: {str(e)}")
            return None

    async def _train_model(self, model_name: str, features: Dict[str, Any]):
        """Train a machine learning model."""
        try:
            config = self.model_configs[model_name]

            # Get training data (simplified - in practice would use historical data)
            X, y = await self._get_training_data(model_name)

            if len(X) < 10:  # Not enough data
                return self._create_simple_model(model_name)

            if config['type'] == 'gradient_boosting':
                model = GradientBoostingClassifier(
                    n_estimators=100,
                    learning_rate=0.1,
                    max_depth=3,
                    random_state=42
                )
            elif config['type'] == 'random_forest':
                model = RandomForestRegressor(
                    n_estimators=100,
                    max_depth=10,
                    random_state=42
                )
            elif config['type'] == 'neural_network':
                model = self._create_neural_network(config['features'])
            else:
                model = LinearRegression()

            # Scale features
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X)

            # Train model
            model.fit(X_scaled, y)

            # Store scaler with model
            model.scaler = scaler

            return model

        except Exception as e:
            logger.error(f"Error training model {model_name}: {str(e)}")
            return self._create_simple_model(model_name)

    async def _predict_with_model(self, model, features: Dict[str, Any], model_name: str) -> float:
        """Make prediction with trained model."""
        try:
            if model is None:
                return 0.5  # Default prediction

            config = self.model_configs[model_name]
            feature_names = config['features']

            # Extract feature values
            feature_values = []
            for feature in feature_names:
                value = features.get(feature, 0)
                if isinstance(value, str):
                    # Simple encoding for categorical features
                    value = hash(value) % 1000 / 1000.0
                feature_values.append(value)

            X = np.array([feature_values])

            # Scale features
            if hasattr(model, 'scaler'):
                X_scaled = model.scaler.transform(X)
            else:
                X_scaled = X

            # Make prediction
            prediction = model.predict(X_scaled)

            # Handle different model types
            if hasattr(prediction, '__len__'):
                prediction = prediction[0]

            # Ensure prediction is in valid range
            if 'probability' in model_name:
                prediction = np.clip(prediction, 0, 1)
            elif 'time' in model_name:
                prediction = max(prediction, 1)  # At least 1 day

            return float(prediction)

        except Exception as e:
            logger.error(f"Error making prediction with {model_name}: {str(e)}")
            return 0.5

    def _create_neural_network(self, input_features: List[str]):
        """Create a simple neural network model."""
        try:
            model = keras.Sequential([
                keras.layers.Dense(64, activation='relu', input_shape=(len(input_features),)),
                keras.layers.Dropout(0.2),
                keras.layers.Dense(32, activation='relu'),
                keras.layers.Dense(1, activation='sigmoid')
            ])

            model.compile(
                optimizer='adam',
                loss='binary_crossentropy',
                metrics=['accuracy']
            )

            return model

        except Exception as e:
            logger.error(f"Error creating neural network: {str(e)}")
            return LinearRegression()

    async def _get_training_data(self, model_name: str) -> Tuple[np.ndarray, np.ndarray]:
        """Get training data for model (simplified)."""
        # In practice, this would query historical data from database
        # For now, return synthetic data
        np.random.seed(42)
        n_samples = 100

        if model_name == 'success_predictor':
            X = np.random.rand(n_samples, 5)  # 5 features
            y = np.random.rand(n_samples)  # Success probability
        elif model_name == 'time_predictor':
            X = np.random.rand(n_samples, 4)  # 4 features
            y = np.random.exponential(30, n_samples)  # Completion time in days
        else:
            X = np.random.rand(n_samples, 4)  # 4 features
            y = np.random.rand(n_samples)  # Generic target

        return X, y

    def _create_simple_model(self, model_name: str):
        """Create a simple fallback model."""
        return LinearRegression()

    async def _calculate_prediction_intervals(self, model, features: Dict[str, Any], prediction: float) -> Dict[str, float]:
        """Calculate confidence intervals for prediction."""
        # Simplified confidence interval calculation
        std_dev = 0.1  # Would be calculated from model uncertainty
        return {
            'lower_bound': max(0, prediction - 1.96 * std_dev),
            'upper_bound': min(1, prediction + 1.96 * std_dev) if prediction <= 1 else prediction + 1.96 * std_dev
        }

    async def _get_feature_importance(self, model, model_name: str) -> Dict[str, float]:
        """Get feature importance from model."""
        try:
            config = self.model_configs[model_name]
            features = config['features']

            if hasattr(model, 'feature_importances_'):
                importances = model.feature_importances_
            else:
                # Default equal importance
                importances = np.ones(len(features)) / len(features)

            return dict(zip(features, importances))

        except Exception as e:
            logger.error(f"Error getting feature importance: {str(e)}")
            return {}

    async def _identify_risk_factors(self, features: Dict[str, Any], prediction: float) -> List[str]:
        """Identify risk factors affecting prediction."""
        risk_factors = []

        if features.get('avg_score', 0) < 0.6:
            risk_factors.append('Low average score')

        if features.get('learning_consistency', 1) < 0.5:
            risk_factors.append('Inconsistent learning pattern')

        if features.get('progress_rate', 1) < 0.5:
            risk_factors.append('Slow progress rate')

        if prediction < 0.4:
            risk_factors.append('High dropout risk predicted')

        return risk_factors

    async def _generate_success_recommendations(self, features: Dict[str, Any], prediction: float) -> List[str]:
        """Generate recommendations based on prediction."""
        recommendations = []

        if prediction < 0.6:
            recommendations.append('Consider additional study time')
            recommendations.append('Review foundational concepts')

        if features.get('learning_consistency', 1) < 0.7:
            recommendations.append('Establish a regular study schedule')

        if features.get('avg_time_per_session', 30) < 20:
            recommendations.append('Increase session length for better retention')

        return recommendations

    def _calculate_consistency_score(self, df: pd.DataFrame) -> float:
        """Calculate learning consistency score."""
        try:
            if df.empty:
                return 0.0

            # Calculate daily activity variance
            daily_counts = df.resample('D').size()
            consistency = 1.0 / (1.0 + daily_counts.std())
            return float(consistency)

        except Exception:
            return 0.0

    def _identify_peak_times(self, df: pd.DataFrame) -> List[str]:
        """Identify peak performance times."""
        try:
            if df.empty or 'hour' not in df.columns:
                return []

            # Group by hour and calculate average score
            hourly_performance = df.groupby('hour')['score'].mean()
            peak_hours = hourly_performance.nlargest(3).index.tolist()

            return [f"{hour}:00" for hour in peak_hours]

        except Exception:
            return []

    def _calculate_learning_velocity(self, df: pd.DataFrame) -> float:
        """Calculate learning velocity from time series."""
        try:
            if df.empty or len(df) < 2:
                return 0.0

            # Calculate rate of score improvement
            scores = df['score'].values
            velocity = np.polyfit(range(len(scores)), scores, 1)[0]
            return float(velocity)

        except Exception:
            return 0.0

    def _detect_fatigue_patterns(self, df: pd.DataFrame) -> List[str]:
        """Detect fatigue patterns in learning data."""
        try:
            patterns = []

            if df.empty:
                return patterns

            # Check for declining performance over sessions
            recent_scores = df['score'].tail(5).values
            if len(recent_scores) >= 3:
                trend = np.polyfit(range(len(recent_scores)), recent_scores, 1)[0]
                if trend < -0.05:  # Declining trend
                    patterns.append('Performance declining - possible fatigue')

            # Check for increasing time with decreasing scores
            if 'time_spent' in df.columns:
                correlation = df['score'].corr(df['time_spent'])
                if correlation < -0.3:  # Negative correlation
                    patterns.append('Increasing time but decreasing scores - fatigue indicator')

            return patterns

        except Exception:
            return []

    def _find_optimal_session_length(self, df: pd.DataFrame) -> int:
        """Find optimal session length based on performance."""
        try:
            if df.empty or 'time_spent' not in df.columns:
                return 30  # Default

            # Group by session length and calculate average score
            df['session_length_bin'] = pd.cut(df['time_spent'], bins=5)
            optimal_length = df.groupby('session_length_bin')['score'].mean().idxmax()

            # Return midpoint of optimal bin
            return int((optimal_length.left + optimal_length.right) / 2)

        except Exception:
            return 30

    def _analyze_skill_sequence(self, df: pd.DataFrame) -> List[str]:
        """Analyze the sequence of skill mastery."""
        try:
            if df.empty or 'skill_id' not in df.columns:
                return []

            # Group by skill and find mastery order
            skill_mastery = df.groupby('skill_id')['score'].max()
            mastery_order = skill_mastery.sort_values(ascending=False).index.tolist()

            return mastery_order

        except Exception:
            return []

    def _cluster_engagement_patterns(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Cluster engagement patterns."""
        try:
            if df.empty or len(df) < 5:
                return []

            # Simple clustering based on score and time
            features = df[['score', 'time_spent']].values
            kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
            clusters = kmeans.fit_predict(features)

            cluster_info = []
            for i in range(3):
                cluster_data = df[clusters == i]
                cluster_info.append({
                    'cluster_id': i,
                    'size': len(cluster_data),
                    'avg_score': cluster_data['score'].mean(),
                    'avg_time': cluster_data['time_spent'].mean(),
                    'description': f"Cluster {i}: {len(cluster_data)} sessions"
                })

            return cluster_info

        except Exception:
            return []

    def _calculate_z_scores(self, values: List[float]) -> List[float]:
        """Calculate z-scores for anomaly detection."""
        if not values:
            return []

        mean_val = np.mean(values)
        std_val = np.std(values)

        if std_val == 0:
            return [0] * len(values)

        return [(v - mean_val) / std_val for v in values]

    def _get_expected_score_range(self, scores: List[float]) -> Tuple[float, float]:
        """Get expected score range."""
        if not scores:
            return (0, 100)

        mean_score = np.mean(scores)
        std_score = np.std(scores)

        return (mean_score - std_score, mean_score + std_score)

    def _get_expected_time_range(self, times: List[float]) -> Tuple[float, float]:
        """Get expected time range."""
        if not times:
            return (10, 60)

        mean_time = np.mean(times)
        std_time = np.std(times)

        return (max(5, mean_time - std_time), mean_time + std_time)

    async def _get_time_prediction_features(self, student_id: str, course_id: str) -> Dict[str, Any]:
        """Get features for time prediction."""
        # Simplified - would extract relevant features
        return {
            'skill_difficulty': 0.5,
            'student_level': 0.5,
            'learning_style': 'visual',
            'session_length': 30
        }

    async def _get_time_factors(self, features: Dict[str, Any]) -> List[str]:
        """Get factors affecting time prediction."""
        factors = []

        if features.get('skill_difficulty', 0.5) > 0.7:
            factors.append('High skill difficulty')

        if features.get('student_level', 0.5) < 0.3:
            factors.append('Lower student skill level')

        return factors

    async def _get_learning_history(self, student_id: str, course_id: str) -> List[Dict[str, Any]]:
        """Get learning history for advanced analysis."""
        try:
            db = next(get_db())

            progress_entries = db.query(StudentProgress).filter(
                StudentProgress.student_id == student_id
            ).order_by(StudentProgress.completed_at).all()

            return [{
                'date': p.completed_at,
                'score': p.score,
                'skill_id': p.skill_id,
                'time_spent': getattr(p, 'time_spent', 30)
            } for p in progress_entries]

        except Exception:
            return []

    async def _get_recent_progress(self, student_id: str, course_id: str, days: int) -> List[Dict[str, Any]]:
        """Get recent progress for anomaly detection."""
        try:
            db = next(get_db())

            cutoff_date = datetime.utcnow() - timedelta(days=days)
            progress_entries = db.query(StudentProgress).filter(
                StudentProgress.student_id == student_id,
                StudentProgress.completed_at >= cutoff_date
            ).order_by(StudentProgress.completed_at).all()

            return [{
                'score': p.score,
                'time_spent': getattr(p, 'time_spent', 30),
                'timestamp': p.completed_at.isoformat()
            } for p in progress_entries]

        except Exception:
            return []

    async def _generate_course_insights(
        self,
        student_id: str,
        course_id: str,
        success_pred: Dict[str, Any],
        time_pred: Dict[str, Any],
        patterns: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate insights for a specific course."""
        insights = []

        # Success probability insight
        success_prob = success_pred.get('success_probability', 0.5)
        if success_prob < 0.6:
            insights.append({
                'type': 'warning',
                'title': 'Low Success Probability',
                'description': f'Predicted success rate for course {course_id} is {success_prob:.1%}',
                'priority_score': 0.9,
                'recommendations': success_pred.get('recommendations', []),
                'course_id': course_id
            })

        # Time estimate insight
        estimated_days = time_pred.get('estimated_days', 30)
        insights.append({
            'type': 'info',
            'title': 'Completion Time Estimate',
            'description': f'Expected completion time: {estimated_days:.0f} days',
            'priority_score': 0.5,
            'course_id': course_id
        })

        # Learning pattern insights
        consistency = patterns.get('consistency_score', 0)
        if consistency < 0.5:
            insights.append({
                'type': 'suggestion',
                'title': 'Inconsistent Learning Pattern',
                'description': 'Your learning sessions are irregular. Consider establishing a routine.',
                'priority_score': 0.7,
                'course_id': course_id
            })

        # Fatigue detection
        fatigue_indicators = patterns.get('fatigue_indicators', [])
        if fatigue_indicators:
            insights.append({
                'type': 'warning',
                'title': 'Possible Fatigue Detected',
                'description': 'Signs of fatigue detected in learning patterns.',
                'priority_score': 0.8,
                'indicators': fatigue_indicators,
                'course_id': course_id
            })

        return insights

    def _get_fallback_prediction(self, student_id: str, course_id: str) -> Dict[str, Any]:
        """Get fallback prediction when ML fails."""
        return {
            'student_id': student_id,
            'course_id': course_id,
            'success_probability': 0.5,
            'confidence_interval': {'lower_bound': 0.3, 'upper_bound': 0.7},
            'prediction_horizon_days': 30,
            'feature_importance': {},
            'risk_factors': ['Unable to analyze - using default prediction'],
            'recommendations': ['Continue regular study sessions'],
            'timestamp': datetime.utcnow().isoformat()
        }


# Global instance
advanced_analytics = AdvancedAnalyticsService(None)  # Will be initialized with realtime analytics
