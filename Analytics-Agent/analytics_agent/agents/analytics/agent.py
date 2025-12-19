import json
import time
import logging
from typing import Dict, Any, List, Optional

from analytics_agent.agents.analytics.schema import AnalyticsOutput, EngagementState, CognitiveState, RiskState, MasteryUpdate, RiskAssessment
from analytics_agent.agents.analytics.mcp_contract import DifficultyChangeRecommendation, MisconceptionSignal, InterventionAlert

from analytics_agent.core.signal_processor import SignalProcessor
from analytics_agent.core.aggregator import EventAggregator
from analytics_agent.models.engagement import EngagementModel
from analytics_agent.models.cognitive import CognitiveLoadModel
from analytics_agent.models.knowledge import KnowledgeTracer
from analytics_agent.models.prediction import RiskModel, StrategyDetector

logger = logging.getLogger(__name__)

class AnalyticsAgent:
    """
    Lumina Analytics Agent
    
    Autonomous agent responsible for modeling learner state, detecting strategies,
    and predicting outcomes based on behavioral streams.
    """
    
    def __init__(self, agent_id: str, learner_id: str, system_prompt_path: str = "docs/MASTER_PROMPT.md"):
        self.agent_id = agent_id
        self.learner_id = learner_id
        self.system_prompt = self._load_system_prompt(system_prompt_path)
        
        # Core Components
        self.signal_processor = SignalProcessor()
        self.aggregator = EventAggregator()
        
        # Models
        self.engagement_model = EngagementModel()
        self.cognitive_model = CognitiveLoadModel()
        self.knowledge_tracer = KnowledgeTracer()
        self.risk_model = RiskModel()
        self.strategy_detector = StrategyDetector()
        
        # Initialize Internal State (Expanded as per AGENT_STATE.md)
        self.last_action_timestamp = 0.0 # For cooldowns
        
        self.engagement_state = EngagementState(
            score=0.5, 
            trend="stable", 
            stability=1.0, 
            last_interaction_timestamp=time.time()
        )
        self.cognitive_state = CognitiveState(
            load_index=0.2, 
            fatigue_index=0.0,
            fatigue_detected=False, 
            flow_state=False,
            time_of_day_modifier=1.0
        )
        self.risk_state = RiskState(
            dropout_probability=0.0,
            failure_probability=0.0,
            burnout_risk=0.0
        )
        self.mastery_map: Dict[str, float] = {} 
        
        logger.info(f"AnalyticsAgent initialized for learner {learner_id}")

    def _load_system_prompt(self, path: str) -> str:
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return f.read()
        except FileNotFoundError:
            # logger.warning(f"System prompt file not found at {path}. Using default.")
            return "You are the Lumina Analytics Agent..."

    def process_signals(self, signals: List[Dict[str, Any]], context: Dict[str, Any] = None) -> AnalyticsOutput:
        """
        Main pipeline: Signals -> Features -> Models -> Insight
        """
        logger.info(f"Processing {len(signals)} signals for agent {self.agent_id}")
        if context is None:
            context = {}

        # 1. Signal Processing
        # In a real app, retrieve learner history from DB. Here we use internal state/mock.
        learner_history = {"avg_scroll_velocity": 10.0, "std_scroll_velocity": 5.0} 
        normalized_events = self.signal_processor.normalize_batch(signals, learner_history)
        filtered_events = self.signal_processor.filter_noise(normalized_events)
        
        # 2. Aggregation
        features = self.aggregator.aggregate_window(filtered_events)
        
        # 3. Model Inference
        # Engagement
        eng_result = self.engagement_model.predict(features)
        
        # Cognitive
        # Pass context (e.g. time of day)
        cog_result = self.cognitive_model.predict(features, context)
        
        # Knowledge (Batch update for simplicity, assuming one concept per batch or looping)
        # We look for a quiz_answer event to trigger update
        mastery_update = None
        for ev in signals:
            if ev.get("event_type") == "quiz_answer":
                payload = ev.get("payload", {})
                cid = payload.get("concept_id")
                is_correct = payload.get("is_correct")
                current_p = self.mastery_map.get(cid, 0.1)
                
                k_res = self.knowledge_tracer.predict({}, {
                    "concept_id": cid, 
                    "is_correct": is_correct, 
                    "current_p_mastery": current_p
                })
                
                # Update internal state
                self.mastery_map[cid] = k_res["probability"]
                mastery_update = MasteryUpdate(**k_res)
                break # Only handle one for simplified output
        
        # Calculate time delta for persistent risk logic
        current_time = time.time()
        time_since_last = current_time - self.engagement_state.last_interaction_timestamp
        
        # Risk (Pass derived state including time)
        risk_ctx = {
            "engagement_score": eng_result["score"],
            "avg_mastery": sum(self.mastery_map.values()) / (len(self.mastery_map) + 1e-9),
            "time_since_last_interaction": time_since_last
        }
        risk_result = self.risk_model.predict(features, risk_ctx)
        
        # Strategy
        strat_result = self.strategy_detector.predict(features)
        
        # 4. Update Internal State Objects
        self.engagement_state.score = eng_result["score"]
        self.engagement_state.last_interaction_timestamp = current_time # Update timestamp
        self.cognitive_state.load_index = cog_result["load_index"]
        self.cognitive_state.fatigue_detected = cog_result["fatigue_detected"]
        
        # Update Fatigue Index (Cumulative Load)
        if cog_result["load_index"] > 0.7:
             self.cognitive_state.fatigue_index = min(1.0, self.cognitive_state.fatigue_index + 0.05)
        else:
             self.cognitive_state.fatigue_index = max(0.0, self.cognitive_state.fatigue_index - 0.02)
             
        # Calculate trend
        score_diff = eng_result["score"] - self.engagement_state.score
        if score_diff > 0.05:
            current_trend = "increasing"
        elif score_diff < -0.05:
            current_trend = "declining"
        else:
            current_trend = "stable"

        # 6. Decide Actions (Populate output.recommended_action and return MCP signals)
        # Pass features to access error_rate/success_rate
        # We need a temporary object to pass to decide_mcp_actions or we calculate it first.
        # However, decide_mcp calls need 'analysis' which IS the output.
        # So we create output first without actions, then update it.
        
        output = AnalyticsOutput(
            engagement_score=eng_result["score"],
            engagement_trend=current_trend,
            cognitive_load="overload" if cog_result["load_index"] > 0.8 else "optimal",
            fatigue_detected=cog_result["fatigue_detected"],
            learning_strategy=strat_result["strategy"],
            mastery_update=mastery_update,
            risk_assessment=RiskAssessment(**risk_result),
            recommended_action=[], 
            confidence=eng_result["confidence"] * (0.8 if self.cognitive_state.fatigue_detected else 1.0)
        )
        
        mcp_objects = self.decide_mcp_actions(output, features)
        output.mcp_actions = [m.model_dump() for m in mcp_objects]
        
        # Add basic recommendations to the JSON output too
        if output.fatigue_detected:
            output.recommended_action.append("take_break")
        if output.cognitive_load == "overload":
            output.recommended_action.append("reduce_difficulty")
            
        return output

    def decide_mcp_actions(self, analysis: AnalyticsOutput, features: Dict[str, Any]) -> List[Any]:
        """
        Based on the analysis and features, decided MCP signals.
        Implements logic from DECISION_RULES.md (Overload, Boredom, Risk).
        """
        actions = []
        current_time = time.time()
        
        # Cooldown check: No global interventions within 5 minutes (300s)
        # In a real system, this would be granular per action type.
        if current_time - self.last_action_timestamp < 300:
            return []
        
        # Extract metrics
        load = self.cognitive_state.load_index
        engagement = analysis.engagement_score
        error_rate = features.get("error_rate", 0.0)
        success_rate = features.get("success_rate", 0.0)
        
        trigger_action = False
        
        # Rule 1: Cognitive Overload
        # Logic: load > 0.75 (High) AND error_rate > 0.4 (Failing)
        # We lowered threshold from 0.85 because model caps 'High' at 0.8 baseline.
        if load > 0.75 and error_rate > 0.4:
             actions.append(DifficultyChangeRecommendation(
                 direction="decrease",
                 magnitude=0.5,
                 reason=f"Cognitive overload (Load={load:.2f}, Error={error_rate:.2f})",
                 confidence=0.9
             ))
             trigger_action = True
             
        # Rule 2: Boredom / Coasting
        # Logic: load < 0.3 AND engagement > 0.8 AND success > 0.9
        elif load < 0.3 and engagement > 0.8 and success_rate > 0.9:
            actions.append(DifficultyChangeRecommendation(
                 direction="increase",
                 magnitude=0.2,
                 reason="Learner cruising, increase challenge",
                 confidence=0.85
             ))
            trigger_action = True
             
        # Rule 3: Dropout Risk
        # Logic: trend == declining AND high risk
        elif analysis.risk_assessment and analysis.risk_assessment.dropout_risk > 0.7:
             actions.append(InterventionAlert(
                risk_type="dropout",
                severity=analysis.risk_assessment.dropout_risk,
                reasoning="High dropout risk detected",
                suggested_action="send_encouragement_email",
                time_window="24h"
            ))
             trigger_action = True

        if trigger_action:
            self.last_action_timestamp = current_time
             
        return actions
