"""
NLP Engine Service for advanced natural language processing capabilities.
"""

import asyncio
import logging
import re
from typing import Dict, List, Any, Optional, Tuple, Set
from collections import defaultdict, Counter
from datetime import datetime

from services.base import BaseService
from services.optimized_embedding import OptimizedEmbeddingService

logger = logging.getLogger(__name__)

class IntentClassifier:
    """Advanced intent classification with machine learning capabilities."""

    def __init__(self):
        # Enhanced intent patterns with more sophisticated matching
        self.intent_patterns = {
            "question_asking": {
                "patterns": [
                    r"\b(what|how|why|when|where|which|who|can you explain)\b.*\?",
                    r"\b(tell me|explain|describe)\b.*\b(what|how|why)\b",
                    r"\b(i want to know|i need to understand)\b",
                    r"\b(help me understand|clarify)\b"
                ],
                "keywords": ["what", "how", "why", "when", "where", "which", "who", "explain", "tell", "describe"],
                "weight": 1.0
            },
            "explanation_request": {
                "patterns": [
                    r"\b(explain|describe|tell me about)\b",
                    r"\b(i don't understand|i'm confused)\b",
                    r"\b(can you elaborate|please clarify)\b",
                    r"\b(break it down|simplify)\b"
                ],
                "keywords": ["explain", "describe", "elaborate", "clarify", "break down", "simplify"],
                "weight": 1.2
            },
            "practice_request": {
                "patterns": [
                    r"\b(practice|exercise|try|example|problem)\b",
                    r"\b(work on|do some|give me)\b.*\b(problems|examples|exercises)\b",
                    r"\b(i want to practice|let me try)\b"
                ],
                "keywords": ["practice", "exercise", "try", "example", "problem", "work on"],
                "weight": 1.1
            },
            "concept_clarification": {
                "patterns": [
                    r"\b(confused|unclear|not sure|don't get it)\b",
                    r"\b(still confused|still unclear)\b",
                    r"\b(can you rephrase|say it differently)\b"
                ],
                "keywords": ["confused", "unclear", "not sure", "rephrase", "differently"],
                "weight": 1.3
            },
            "help_request": {
                "patterns": [
                    r"\b(help|stuck|difficult|can't|trouble)\b",
                    r"\b(i need help|i'm stuck)\b",
                    r"\b(this is hard|too difficult)\b"
                ],
                "keywords": ["help", "stuck", "difficult", "can't", "trouble", "hard"],
                "weight": 1.4
            },
            "general_chat": {
                "patterns": [
                    r"\b(hello|hi|hey|good morning|good afternoon|thanks|thank you)\b",
                    r"\b(okay|ok|alright|sure|yes|no)\b",
                    r"\b(nice|good|great|excellent|well done)\b"
                ],
                "keywords": ["hello", "hi", "hey", "thanks", "okay", "good", "great"],
                "weight": 0.8
            }
        }

    async def classify_intent(self, message: str, context: Optional[Dict] = None) -> Tuple[str, float]:
        """Classify the intent of a message with confidence score."""
        message_lower = message.lower().strip()

        # Initialize scores
        intent_scores = defaultdict(float)

        # Pattern matching
        for intent, config in self.intent_patterns.items():
            score = 0.0

            # Check regex patterns
            for pattern in config["patterns"]:
                if re.search(pattern, message_lower, re.IGNORECASE):
                    score += 1.0

            # Check keywords
            keywords = config["keywords"]
            keyword_matches = sum(1 for keyword in keywords if keyword in message_lower)
            if keyword_matches > 0:
                score += keyword_matches * 0.5

            # Apply weight
            intent_scores[intent] = score * config["weight"]

        # Find best intent
        if intent_scores:
            best_intent = max(intent_scores, key=intent_scores.get)
            total_score = sum(intent_scores.values())
            confidence = intent_scores[best_intent] / total_score if total_score > 0 else 0.0

            # Boost confidence for clear patterns
            if intent_scores[best_intent] >= 2.0:
                confidence = min(confidence + 0.2, 1.0)

            return best_intent, confidence

        return "general_chat", 0.5

class ConceptExtractor:
    """Advanced concept extraction from educational content."""

    def __init__(self, embedding_service: OptimizedEmbeddingService):
        self.embedding_service = embedding_service

        # Domain-specific concept dictionaries
        self.concept_categories = {
            "programming": {
                "keywords": [
                    "function", "variable", "class", "method", "loop", "condition",
                    "algorithm", "data structure", "array", "list", "dictionary",
                    "object", "inheritance", "polymorphism", "encapsulation"
                ],
                "patterns": [
                    r"\bdef\s+\w+\s*\(",  # Function definitions
                    r"\bclass\s+\w+",     # Class definitions
                    r"\bfor\s+\w+\s+in\b", # Loops
                    r"\bif\s+.*:\b"       # Conditions
                ]
            },
            "mathematics": {
                "keywords": [
                    "equation", "theorem", "hypothesis", "integral", "derivative",
                    "function", "variable", "coefficient", "matrix", "vector",
                    "calculus", "algebra", "geometry", "trigonometry", "probability"
                ],
                "patterns": [
                    r"\b\d+\s*[\+\-\*\/]\s*\d+\b",  # Mathematical expressions
                    r"\b∫\b",  # Integrals
                    r"\bd/dx\b",  # Derivatives
                    r"\b∑\b"   # Summations
                ]
            },
            "science": {
                "keywords": [
                    "theory", "hypothesis", "experiment", "observation", "law",
                    "principle", "force", "energy", "matter", "atom", "molecule",
                    "reaction", "cell", "organism", "ecosystem", "evolution"
                ],
                "patterns": [
                    r"\bH2O\b",  # Chemical formulas
                    r"\bDNA\b",  # Biological terms
                    r"\bE\s*=\s*m\s*c²\b"  # Famous equations
                ]
            },
            "general": {
                "keywords": [
                    "concept", "idea", "theory", "principle", "method", "approach",
                    "strategy", "technique", "process", "system", "model", "framework"
                ],
                "patterns": []
            }
        }

    async def extract_concepts(self, text: str, domain: str = "general") -> List[Dict[str, Any]]:
        """Extract concepts from text with confidence scores."""
        concepts = []
        text_lower = text.lower()

        # Get domain-specific concepts
        domain_config = self.concept_categories.get(domain, self.concept_categories["general"])

        # Extract keyword-based concepts
        for keyword in domain_config["keywords"]:
            if keyword in text_lower:
                # Count occurrences and find positions
                occurrences = text_lower.count(keyword)
                positions = [m.start() for m in re.finditer(re.escape(keyword), text_lower)]

                concepts.append({
                    "concept": keyword,
                    "category": domain,
                    "confidence": min(occurrences * 0.3, 1.0),
                    "positions": positions,
                    "context": self._get_context(text, positions[0], 50) if positions else ""
                })

        # Extract pattern-based concepts
        for pattern in domain_config["patterns"]:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                concepts.append({
                    "concept": match.strip(),
                    "category": domain,
                    "confidence": 0.8,
                    "positions": [],
                    "context": ""
                })

        # Remove duplicates and sort by confidence
        seen = set()
        unique_concepts = []
        for concept in concepts:
            concept_key = concept["concept"].lower()
            if concept_key not in seen:
                seen.add(concept_key)
                unique_concepts.append(concept)

        return sorted(unique_concepts, key=lambda x: x["confidence"], reverse=True)

    def _get_context(self, text: str, position: int, window: int = 50) -> str:
        """Get context around a concept position."""
        start = max(0, position - window)
        end = min(len(text), position + window)
        return text[start:end].strip()

class SentimentAnalyzer:
    """Advanced sentiment analysis for educational conversations."""

    def __init__(self):
        # Enhanced sentiment lexicons
        self.positive_words = {
            "good": 0.6, "great": 0.8, "excellent": 0.9, "amazing": 0.8,
            "wonderful": 0.7, "fantastic": 0.8, "perfect": 0.9, "awesome": 0.8,
            "understand": 0.7, "clear": 0.6, "easy": 0.5, "helpful": 0.7,
            "brilliant": 0.8, "outstanding": 0.9, "superb": 0.8, "marvelous": 0.7,
            "love": 0.8, "like": 0.5, "enjoy": 0.6, "appreciate": 0.6,
            "thank": 0.4, "thanks": 0.4, "grateful": 0.6
        }

        self.negative_words = {
            "bad": -0.6, "terrible": -0.8, "awful": -0.8, "horrible": -0.8,
            "confused": -0.7, "confusing": -0.7, "difficult": -0.6, "hard": -0.5,
            "stuck": -0.7, "lost": -0.6, "frustrated": -0.8, "annoyed": -0.6,
            "hate": -0.8, "dislike": -0.6, "don't understand": -0.7,
            "unclear": -0.6, "complicated": -0.6, "complex": -0.4,
            "wrong": -0.5, "incorrect": -0.6, "mistake": -0.5
        }

        self.intensifiers = {
            "very": 1.5, "really": 1.5, "so": 1.3, "extremely": 1.8,
            "quite": 1.2, "totally": 1.4, "absolutely": 1.6, "completely": 1.4
        }

        self.negations = ["not", "don't", "doesn't", "isn't", "aren't", "no", "never"]

    async def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """Analyze sentiment with detailed scoring."""
        text_lower = text.lower()
        words = text_lower.split()

        sentiment_score = 0.0
        positive_words = []
        negative_words = []
        intensifier_count = 0

        i = 0
        while i < len(words):
            word = words[i]
            score = 0.0

            # Check for intensifiers
            intensifier_multiplier = 1.0
            if word in self.intensifiers:
                intensifier_multiplier = self.intensifiers[word]
                intensifier_count += 1
                i += 1
                if i < len(words):
                    word = words[i]

            # Check for negations
            negation_multiplier = 1.0
            if word in self.negations:
                negation_multiplier = -1.0
                i += 1
                if i < len(words):
                    word = words[i]

            # Check sentiment words
            if word in self.positive_words:
                score = self.positive_words[word] * intensifier_multiplier * negation_multiplier
                if score > 0:
                    positive_words.append(word)
                elif score < 0:
                    negative_words.append(word)
            elif word in self.negative_words:
                score = self.negative_words[word] * intensifier_multiplier * negation_multiplier
                if score < 0:
                    negative_words.append(word)
                elif score > 0:
                    positive_words.append(word)

            sentiment_score += score
            i += 1

        # Normalize score to [-1, 1]
        word_count = len(words)
        if word_count > 0:
            sentiment_score = sentiment_score / word_count
            sentiment_score = max(-1.0, min(1.0, sentiment_score))

        # Determine sentiment category
        if sentiment_score > 0.2:
            sentiment = "positive"
        elif sentiment_score < -0.2:
            sentiment = "negative"
        else:
            sentiment = "neutral"

        # Calculate confidence
        confidence = min(abs(sentiment_score) + 0.3, 1.0)

        return {
            "sentiment": sentiment,
            "score": sentiment_score,
            "confidence": confidence,
            "positive_words": positive_words,
            "negative_words": negative_words,
            "intensifier_count": intensifier_count,
            "word_count": word_count
        }

class ComplexityAnalyzer:
    """Analyzes text complexity for adaptive responses."""

    def __init__(self):
        self.simple_words = {
            "good", "bad", "big", "small", "hot", "cold", "fast", "slow",
            "easy", "hard", "new", "old", "high", "low", "right", "wrong",
            "yes", "no", "here", "there", "now", "then", "what", "how", "why"
        }

        self.complex_indicators = [
            r"\b(therefore|however|consequently|furthermore|moreover)\b",
            r"\b(algorithm|hypothesis|theorem|principle|paradigm)\b",
            r"\b(differentiate|integrate|optimize|synthesize|analyze)\b",
            r"\b(matrix|vector|tensor|polynomial|derivative)\b"
        ]

    async def analyze_complexity(self, text: str) -> Dict[str, Any]:
        """Analyze text complexity for educational content."""
        words = text.split()
        sentences = re.split(r'[.!?]+', text)

        # Basic metrics
        word_count = len(words)
        sentence_count = len([s for s in sentences if s.strip()])
        avg_sentence_length = word_count / sentence_count if sentence_count > 0 else 0

        # Vocabulary complexity
        unique_words = set(words)
        simple_word_count = sum(1 for word in words if word.lower() in self.simple_words)
        complex_word_ratio = 1 - (simple_word_count / word_count) if word_count > 0 else 0

        # Syntactic complexity
        complex_indicator_count = 0
        for pattern in self.complex_indicators:
            complex_indicator_count += len(re.findall(pattern, text, re.IGNORECASE))

        # Calculate complexity score
        complexity_score = (
            (avg_sentence_length * 0.3) +
            (complex_word_ratio * 0.4) +
            (complex_indicator_count * 0.3)
        )

        # Normalize and categorize
        complexity_score = min(complexity_score, 10.0)  # Cap at 10

        if complexity_score < 2.0:
            level = "low"
        elif complexity_score < 5.0:
            level = "medium"
        else:
            level = "high"

        return {
            "complexity_level": level,
            "complexity_score": complexity_score,
            "word_count": word_count,
            "sentence_count": sentence_count,
            "avg_sentence_length": avg_sentence_length,
            "unique_words": len(unique_words),
            "complex_word_ratio": complex_word_ratio,
            "complex_indicators": complex_indicator_count
        }

class DialogueAnalyzer:
    """Analyzes dialogue patterns and learning progress."""

    def __init__(self):
        self.patterns = {
            "persistent_confusion": {
                "indicators": ["still confused", "still don't understand", "still unclear"],
                "threshold": 3
            },
            "increasing_understanding": {
                "indicators": ["now I understand", "that makes sense", "clear now"],
                "threshold": 2
            },
            "frustration_building": {
                "indicators": ["this is frustrating", "I'm stuck", "this is too hard"],
                "threshold": 2
            },
            "active_engagement": {
                "indicators": ["can you show me", "let me try", "what about"],
                "threshold": 2
            }
        }

    async def analyze_dialogue_patterns(self, conversation_history: List[Dict]) -> Dict[str, Any]:
        """Analyze patterns in conversation history."""
        if not conversation_history:
            return {"patterns": [], "insights": []}

        patterns_found = []
        insights = []

        # Analyze recent messages (last 5)
        recent_messages = conversation_history[-5:]
        recent_text = " ".join([msg.get("student_message", "") for msg in recent_messages])

        # Check for patterns
        for pattern_name, config in self.patterns.items():
            count = 0
            for indicator in config["indicators"]:
                count += recent_text.lower().count(indicator.lower())

            if count >= config["threshold"]:
                patterns_found.append({
                    "pattern": pattern_name,
                    "count": count,
                    "threshold": config["threshold"]
                })

        # Generate insights
        if any(p["pattern"] == "persistent_confusion" for p in patterns_found):
            insights.append("Student shows persistent confusion - consider alternative explanation approach")

        if any(p["pattern"] == "increasing_understanding" for p in patterns_found):
            insights.append("Student is gaining understanding - maintain current approach")

        if any(p["pattern"] == "frustration_building" for p in patterns_found):
            insights.append("Student frustration detected - provide encouragement and simpler explanations")

        if any(p["pattern"] == "active_engagement" for p in patterns_found):
            insights.append("Student shows active engagement - encourage continued participation")

        return {
            "patterns": patterns_found,
            "insights": insights,
            "conversation_length": len(conversation_history),
            "recent_message_count": len(recent_messages)
        }

class NLPEngine(BaseService):
    """Main NLP Engine service combining all NLP capabilities."""

    def __init__(self, embedding_service: OptimizedEmbeddingService):
        super().__init__()
        self.intent_classifier = IntentClassifier()
        self.concept_extractor = ConceptExtractor(embedding_service)
        self.sentiment_analyzer = SentimentAnalyzer()
        self.complexity_analyzer = ComplexityAnalyzer()
        self.dialogue_analyzer = DialogueAnalyzer()
        self.embedding_service = embedding_service

    async def analyze_message(self, message: str, context: Optional[Dict] = None) -> Dict[str, Any]:
        """Comprehensive message analysis."""
        try:
            # Parallel analysis for better performance
            intent_task = self.intent_classifier.classify_intent(message, context)
            sentiment_task = self.sentiment_analyzer.analyze_sentiment(message)
            complexity_task = self.complexity_analyzer.analyze_complexity(message)

            # Extract domain from context
            domain = context.get("domain", "general") if context else "general"
            concepts_task = self.concept_extractor.extract_concepts(message, domain)

            # Await all analyses
            intent_result, sentiment_result, complexity_result, concepts_result = await asyncio.gather(
                intent_task, sentiment_task, complexity_task, concepts_task
            )

            # Analyze dialogue patterns if context provided
            dialogue_analysis = {}
            if context and "conversation_history" in context:
                dialogue_analysis = await self.dialogue_analyzer.analyze_dialogue_patterns(
                    context["conversation_history"]
                )

            # Determine follow-up needs
            follow_up_needed = await self._determine_follow_up_needs(
                intent_result, sentiment_result, complexity_result, dialogue_analysis
            )

            # Generate suggested actions
            suggested_actions = await self._generate_suggested_actions(
                intent_result, sentiment_result, complexity_result, concepts_result
            )

            return {
                "intent": intent_result[0],
                "intent_confidence": intent_result[1],
                "sentiment": sentiment_result,
                "complexity": complexity_result,
                "concepts": concepts_result,
                "dialogue_patterns": dialogue_analysis,
                "follow_up_needed": follow_up_needed,
                "suggested_actions": suggested_actions,
                "analysis_timestamp": datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Error in message analysis: {str(e)}")
            return {
                "intent": "general_chat",
                "intent_confidence": 0.5,
                "sentiment": {"sentiment": "neutral", "score": 0.0, "confidence": 0.5},
                "complexity": {"complexity_level": "medium", "complexity_score": 3.0},
                "concepts": [],
                "dialogue_patterns": {"patterns": [], "insights": []},
                "follow_up_needed": False,
                "suggested_actions": [],
                "error": str(e)
            }

    async def _determine_follow_up_needs(self, intent_result: Tuple[str, float],
                                       sentiment_result: Dict, complexity_result: Dict,
                                       dialogue_analysis: Dict) -> bool:
        """Determine if follow-up is needed based on analysis."""
        intent, confidence = intent_result

        # Follow up for low confidence intents
        if confidence < 0.7:
            return True

        # Follow up for negative sentiment
        if sentiment_result.get("sentiment") == "negative":
            return True

        # Follow up for high complexity with clarification intents
        if (complexity_result.get("complexity_level") == "high" and
            intent in ["concept_clarification", "help_request"]):
            return True

        # Follow up for persistent confusion patterns
        if any(p.get("pattern") == "persistent_confusion" for p in dialogue_analysis.get("patterns", [])):
            return True

        return False

    async def _generate_suggested_actions(self, intent_result: Tuple[str, float],
                                        sentiment_result: Dict, complexity_result: Dict,
                                        concepts_result: List[Dict]) -> List[str]:
        """Generate suggested actions based on analysis."""
        actions = []
        intent, confidence = intent_result

        # Intent-based actions
        if intent == "question_asking":
            actions.extend(["provide_answer", "suggest_resources", "ask_clarifying_question"])
        elif intent == "explanation_request":
            actions.extend(["give_detailed_explanation", "provide_examples", "create_visual_aid"])
        elif intent == "practice_request":
            actions.extend(["generate_practice_problem", "provide_solution_steps", "offer_hints"])
        elif intent == "concept_clarification":
            actions.extend(["rephrase_explanation", "use_analogy", "break_down_concept"])
        elif intent == "help_request":
            actions.extend(["assess_difficulty", "suggest_alternative_approach", "provide_guidance"])

        # Sentiment-based actions
        if sentiment_result.get("sentiment") == "negative":
            actions.append("provide_encouragement")
        elif sentiment_result.get("sentiment") == "positive":
            actions.append("reinforce_positive_behavior")

        # Complexity-based actions
        if complexity_result.get("complexity_level") == "high":
            actions.append("simplify_explanation")
        elif complexity_result.get("complexity_level") == "low":
            actions.append("provide_additional_depth")

        # Concept-based actions
        if concepts_result:
            actions.append("focus_on_key_concepts")

        return list(set(actions))  # Remove duplicates

    async def analyze_learning_progress(self, conversation_history: List[Dict]) -> Dict[str, Any]:
        """Analyze learning progress from conversation history."""
        try:
            if not conversation_history:
                return {"progress_score": 0.0, "insights": []}

            # Analyze sentiment progression
            sentiments = []
            for msg in conversation_history:
                if "sentiment" in msg:
                    sentiment_data = msg["sentiment"]
                    if isinstance(sentiment_data, dict):
                        sentiments.append(sentiment_data.get("score", 0.0))

            # Calculate progress indicators
            sentiment_trend = "stable"
            if len(sentiments) >= 3:
                recent_avg = sum(sentiments[-3:]) / 3
                earlier_avg = sum(sentiments[:-3]) / len(sentiments[:-3]) if sentiments[:-3] else recent_avg
                if recent_avg > earlier_avg + 0.1:
                    sentiment_trend = "improving"
                elif recent_avg < earlier_avg - 0.1:
                    sentiment_trend = "declining"

            # Analyze question complexity progression
            complexities = []
            for msg in conversation_history:
                if "complexity" in msg:
                    complexity_data = msg["complexity"]
                    if isinstance(complexity_data, dict):
                        complexities.append(complexity_data.get("complexity_score", 3.0))

            complexity_trend = "stable"
            if len(complexities) >= 3:
                recent_complexity = sum(complexities[-3:]) / 3
                earlier_complexity = sum(complexities[:-3]) / len(complexities[:-3]) if complexities[:-3] else recent_complexity
                if recent_complexity > earlier_complexity + 1.0:
                    complexity_trend = "increasing"
                elif recent_complexity < earlier_complexity - 1.0:
                    complexity_trend = "decreasing"

            # Calculate overall progress score
            progress_score = 0.0
            if sentiment_trend == "improving":
                progress_score += 0.4
            if complexity_trend == "increasing":
                progress_score += 0.3
            if len(conversation_history) > 5:
                progress_score += 0.3

            progress_score = min(progress_score, 1.0)

            insights = []
            if sentiment_trend == "improving":
                insights.append("Student sentiment is improving - positive learning experience")
            if complexity_trend == "increasing":
                insights.append("Student is handling more complex content - good progress")
            if progress_score > 0.7:
                insights.append("Strong learning progress detected")

            return {
                "progress_score": progress_score,
                "sentiment_trend": sentiment_trend,
                "complexity_trend": complexity_trend,
                "insights": insights,
                "conversation_length": len(conversation_history)
            }

        except Exception as e:
            logger.error(f"Error analyzing learning progress: {str(e)}")
            return {"progress_score": 0.0, "insights": [], "error": str(e)}
