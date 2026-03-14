import random
from typing import List, Dict, Optional
from datetime import datetime

from app.personalization.schemas import (
    LearnerProfileRecord,
    ExplanationProfile,
    ExplanationStrategyState,
    ExplanationPlan,
)

EXPLANATION_MODES = [
    "Story",
    "Joke",
    "Analogy",
    "Poem",
    "Experiment",
    "Formula",
    "Socratic",
    "Real-world"
]

EXPLANATION_STRATEGIES = [
    "worked_example_first",
    "step_by_step",
    "concept_first",
    "socratic_prompting",
    "compare_contrast",
    "visual_analogy"
]

class ExplanationPlanner:
    """
    Decides the communication mode and pedagogical strategy before tutor response generation.
    Implements evidence-based selection with epsilon-greedy exploration.
    """

    @classmethod
    def generate_plan(cls, profile: LearnerProfileRecord, objective: str = "explain") -> ExplanationPlan:
        """
        Creates a structured plan for the tutor.
        """
        exp_profile = profile.explanation_profile
        cognitive_load = profile.behavior_signals.get("cognitive_load", 50)
        mastery = sum(cm.score for cm in profile.mastery_state.values()) / max(len(profile.mastery_state), 1)

        # 1. Choose Difficulty Band
        difficulty_band = cls._determine_difficulty_band(cognitive_load, mastery)
        
        # 2. Choose Mode (Observe -> Reward -> Explore -> Persist)
        mode = cls._select_mode(exp_profile)
        
        # 3. Choose Strategy
        strategy = cls._select_strategy(difficulty_band, profile)
        
        # 4. Refine Parameters based on band
        params = cls._refine_parameters(difficulty_band)
        
        return ExplanationPlan(
            objective=objective,
            strategy=strategy,
            mode=mode,
            vocabulary_band=params["vocabulary"],
            depth=params["depth"],
            pace=params["pace"],
            chunk_size=params["chunk_size"],
            socratic_ratio=params["socratic_ratio"],
            modalities=params["modalities"],
            confidence=0.8
        )

    @staticmethod
    def _determine_difficulty_band(load: float, mastery: float) -> str:
        if load >= 75:
            return "reduced_load"
        if mastery < 0.4:
            return "remediation"
        if mastery < 0.75:
            return "guided_practice"
        return "challenge"

    @classmethod
    def _select_mode(cls, exp_profile: ExplanationProfile, epsilon: float = 0.1) -> str:
        """
        Epsilon-greedy selection of explanation mode.
        """
        # Explore
        if random.random() < epsilon or not exp_profile.strategies:
            return random.choice(EXPLANATION_MODES)
            
        # Exploit (Choose mode with highest effectiveness)
        sorted_modes = sorted(
            exp_profile.strategies.items(), 
            key=lambda x: x[1].effectiveness_score, 
            reverse=True
        )
        return sorted_modes[0][0]

    @staticmethod
    def _select_strategy(band: str, profile: LearnerProfileRecord) -> str:
        """
        Logic for selecting the pedagogical strategy.
        """
        if band == "reduced_load":
            return "step_by_step"
        if band == "remediation":
            return "worked_example_first"
        if band == "challenge":
            return "socratic_prompting"
        
        # Default: try to pick something else
        return "concept_first"

    @staticmethod
    def _refine_parameters(band: str) -> Dict:
        if band == "reduced_load":
            return {
                "vocabulary": "simple",
                "depth": "concise",
                "pace": "slow",
                "chunk_size": 1,
                "socratic_ratio": 0.1,
                "modalities": ["steps", "text"]
            }
        if band == "remediation":
            return {
                "vocabulary": "simple",
                "depth": "standard",
                "pace": "slow",
                "chunk_size": 2,
                "socratic_ratio": 0.2,
                "modalities": ["example", "steps"]
            }
        if band == "challenge":
            return {
                "vocabulary": "advanced",
                "depth": "concise",
                "pace": "normal",
                "chunk_size": 3,
                "socratic_ratio": 0.7,
                "modalities": ["reflection", "challenge"]
            }
        
        # guided_practice
        return {
            "vocabulary": "grade-level",
            "depth": "standard",
            "pace": "normal",
            "chunk_size": 2,
            "socratic_ratio": 0.4,
            "modalities": ["steps", "example", "quiz"]
        }
