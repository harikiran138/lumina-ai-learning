"""
Intelligent Q&A Engine for educational content.
Provides advanced question answering capabilities with context-aware responses.
"""

import logging
import re
from typing import Dict, List, Any, Optional
from datetime import datetime

from services.base import BaseService
from services.optimized_embedding import OptimizedEmbeddingService
from services.vector_store import VectorStoreService
from services.nlp_engine import NLPEngine

logger = logging.getLogger(__name__)

class QuestionProcessor:
    """Processes and understands student questions."""

    def __init__(self, nlp_engine: NLPEngine):
        self.nlp_engine = nlp_engine

        # Question type patterns
        self.question_patterns = {
            "factual": {
                "patterns": [
                    r"\b(what is|what are|who is|who was|when did|where is)\b",
                    r"\b(define|definition of|meaning of)\b",
                    r"\b(list|name|identify)\b"
                ],
                "response_style": "direct_answer"
            },
            "explanatory": {
                "patterns": [
                    r"\b(how does|how do|why does|why do)\b",
                    r"\b(explain|describe|elaborate)\b",
                    r"\b(what happens when|what occurs)\b"
                ],
                "response_style": "step_by_step"
            },
            "procedural": {
                "patterns": [
                    r"\b(how to|how can I|steps to)\b",
                    r"\b(how would I|how should I)\b",
                    r"\b(process|procedure|method)\b"
                ],
                "response_style": "step_by_step"
            },
            "comparative": {
                "patterns": [
                    r"\b(difference between|compare|versus|vs)\b",
                    r"\b(which is better|advantages|disadvantages)\b",
                    r"\b(contrast|similarities|differences)\b"
                ],
                "response_style": "comparative_analysis"
            },
            "analytical": {
                "patterns": [
                    r"\b(why is|why are|why does)\b",
                    r"\b(analyze|analysis|evaluate)\b",
                    r"\b(implications|impact|effect)\b"
                ],
                "response_style": "analytical"
            }
        }

    async def process_question(self, question: str, context: Optional[Dict] = None) -> Dict[str, Any]:
        """Process a question to understand its type and requirements."""
        try:
            # Get NLP analysis
            nlp_analysis = await self.nlp_engine.analyze_message(question, context)

            # Determine question type
            question_type = await self._classify_question_type(question)

            # Extract key elements
            key_elements = await self._extract_question_elements(question, nlp_analysis)

            # Determine response strategy
            response_strategy = await self._determine_response_strategy(question_type, nlp_analysis)

            return {
                "question_type": question_type,
                "key_elements": key_elements,
                "response_strategy": response_strategy,
                "nlp_analysis": nlp_analysis,
                "confidence": nlp_analysis.get("intent_confidence", 0.5),
                "complexity": nlp_analysis.get("complexity", {}).get("complexity_level", "medium")
            }

        except Exception as e:
            logger.error(f"Error processing question: {str(e)}")
            return {
                "question_type": "general",
                "key_elements": [],
                "response_strategy": "direct_answer",
                "nlp_analysis": {},
                "confidence": 0.0,
                "complexity": "medium",
                "error": str(e)
            }

    async def _classify_question_type(self, question: str) -> str:
        """Classify the type of question."""
        question_lower = question.lower()

        for q_type, config in self.question_patterns.items():
            for pattern in config["patterns"]:
                if re.search(pattern, question_lower, re.IGNORECASE):
                    return q_type

        return "general"

    async def _extract_question_elements(self, question: str, nlp_analysis: Dict) -> List[Dict[str, Any]]:
        """Extract key elements from the question."""
        elements = []

        # Extract concepts
        concepts = nlp_analysis.get("concepts", [])
        for concept in concepts:
            elements.append({
                "type": "concept",
                "value": concept.get("concept", ""),
                "confidence": concept.get("confidence", 0.5),
                "category": concept.get("category", "general")
            })

        # Extract question words
        question_words = ["what", "how", "why", "when", "where", "who", "which"]
        words = question.lower().split()
        for word in question_words:
            if word in words:
                elements.append({
                    "type": "question_word",
                    "value": word,
                    "position": words.index(word)
                })

        return elements

    async def _determine_response_strategy(self, question_type: str, nlp_analysis: Dict) -> str:
        """Determine the best response strategy."""
        # Get base strategy from question type
        base_strategy = self.question_patterns.get(question_type, {}).get("response_style", "direct_answer")

        # Adjust based on complexity
        complexity = nlp_analysis.get("complexity", {}).get("complexity_level", "medium")
        if complexity == "high":
            if base_strategy == "direct_answer":
                base_strategy = "step_by_step"

        # Adjust based on sentiment
        sentiment = nlp_analysis.get("sentiment", {}).get("sentiment", "neutral")
        if sentiment == "negative":
            base_strategy = "encouraging_" + base_strategy

        return base_strategy

class AnswerGenerator:
    """Generates comprehensive answers based on retrieved content."""

    def __init__(self, vector_store: VectorStoreService, embedding_service: OptimizedEmbeddingService):
        self.vector_store = vector_store
        self.embedding_service = embedding_service

    async def generate_answer(self, question: str, question_analysis: Dict,
                            course_id: str, context: Optional[Dict] = None) -> Dict[str, Any]:
        """Generate a comprehensive answer for the question."""
        try:
            # Retrieve relevant content
            relevant_content = await self._retrieve_relevant_content(question, course_id, question_analysis)

            if not relevant_content:
                return {
                    "answer_text": "I don't have specific information about that topic in the course materials. Could you rephrase your question or ask about a different aspect?",
                    "confidence": 0.0,
                    "sources": [],
                    "follow_up_questions": ["Could you provide more context about what you're trying to understand?"]
                }

            # Synthesize answer based on question type
            question_type = question_analysis.get("question_type", "general")
            response_strategy = question_analysis.get("response_strategy", "direct_answer")

            if response_strategy.startswith("step_by_step"):
                answer_text = await self._generate_step_by_step_answer(question, relevant_content, question_analysis)
            elif response_strategy == "comparative_analysis":
                answer_text = await self._generate_comparative_answer(question, relevant_content, question_analysis)
            elif response_strategy.startswith("analytical"):
                answer_text = await self._generate_analytical_answer(question, relevant_content, question_analysis)
            else:
                answer_text = await self._generate_direct_answer(question, relevant_content, question_analysis)

            # Generate follow-up questions
            follow_up_questions = await self._generate_follow_up_questions(question_analysis, relevant_content)

            # Calculate confidence
            confidence = await self._calculate_answer_confidence(relevant_content, question_analysis)

            return {
                "answer_text": answer_text,
                "confidence": confidence,
                "sources": [content.get("id", "unknown") for content in relevant_content],
                "follow_up_questions": follow_up_questions,
                "metadata": {
                    "question_type": question_type,
                    "response_strategy": response_strategy,
                    "content_count": len(relevant_content),
                    "generated_at": datetime.utcnow().isoformat()
                }
            }

        except Exception as e:
            logger.error(f"Error generating answer: {str(e)}")
            return {
                "answer_text": "I'm sorry, I encountered an error while generating an answer. Could you try asking your question differently?",
                "confidence": 0.0,
                "sources": [],
                "follow_up_questions": [],
                "error": str(e)
            }

    async def _retrieve_relevant_content(self, question: str, course_id: str,
                                       question_analysis: Dict) -> List[Dict[str, Any]]:
        """Retrieve relevant content for the question."""
        try:
            # Generate embedding for the question
            question_embedding = await self.embedding_service.generate_embedding(question)

            # Extract key concepts for additional search terms
            concepts = question_analysis.get("key_elements", [])
            concept_terms = [elem["value"] for elem in concepts if elem["type"] == "concept"]

            # Search with multiple strategies
            results = []

            # Primary search with question embedding
            primary_results = await self.vector_store.search_similar(
                embedding=question_embedding,
                course_id=course_id,
                limit=5,
                threshold=0.6
            )
            results.extend(primary_results)

            # Secondary search with concept-based queries
            for concept in concept_terms[:2]:  # Limit to top 2 concepts
                concept_results = await self.vector_store.search_similar(
                    embedding=await self.embedding_service.generate_embedding(f"explain {concept}"),
                    course_id=course_id,
                    limit=3,
                    threshold=0.7
                )
                results.extend(concept_results)

            # Remove duplicates and sort by relevance
            seen_ids = set()
            unique_results = []
            for result in results:
                result_id = result.get("id")
                if result_id and result_id not in seen_ids:
                    seen_ids.add(result_id)
                    unique_results.append(result)

            # Sort by relevance score
            unique_results.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)

            return unique_results[:8]  # Return top 8 results

        except Exception as e:
            logger.error(f"Error retrieving content: {str(e)}")
            return []

    async def _generate_direct_answer(self, question: str, content: List[Dict],
                                    question_analysis: Dict) -> str:
        """Generate a direct answer."""
        if not content:
            return "I don't have information about that topic."

        # Extract and combine relevant information
        relevant_texts = []
        for item in content[:3]:  # Use top 3 results
            text = item.get("content", "")
            if text and len(text) > 50:  # Ensure substantial content
                # Extract relevant sentences
                sentences = re.split(r'[.!?]+', text)
                relevant_sentences = []

                # Simple relevance check based on question keywords
                question_words = question.lower().split()
                key_words = [word for word in question_words if len(word) > 3]

                for sentence in sentences:
                    sentence_lower = sentence.lower()
                    if any(keyword in sentence_lower for keyword in key_words):
                        relevant_sentences.append(sentence.strip())

                if relevant_sentences:
                    relevant_texts.append(" ".join(relevant_sentences[:2]))  # Limit sentences

        if relevant_texts:
            combined_text = " ".join(relevant_texts)
            return f"Based on the course materials: {combined_text[:1000]}..."
        else:
            # Fallback to general content
            general_text = content[0].get("content", "")[:800]
            return f"Here's what I found in the course materials: {general_text}..."

    async def _generate_step_by_step_answer(self, question: str, content: List[Dict],
                                          question_analysis: Dict) -> str:
        """Generate a step-by-step answer."""
        if not content:
            return "I don't have step-by-step information about that process."

        # Try to identify sequential information
        combined_content = " ".join([item.get("content", "") for item in content[:3]])

        # Look for step indicators
        step_patterns = [
            r"\b(first|second|third|next|then|after that|finally)\b",
            r"\b(step \d+|phase \d+|stage \d+)\b",
            r"\b(begin by|start with|followed by)\b"
        ]

        sentences = re.split(r'[.!?]+', combined_content)
        step_sentences = []

        for sentence in sentences:
            if any(re.search(pattern, sentence, re.IGNORECASE) for pattern in step_patterns):
                step_sentences.append(sentence.strip())

        if step_sentences:
            steps_text = "\n".join(f"{i+1}. {sentence}" for i, sentence in enumerate(step_sentences[:5]))
            return f"Here's a step-by-step explanation:\n{steps_text}"
        else:
            # Fallback to structured general content
            return await self._generate_direct_answer(question, content, question_analysis)

    async def _generate_comparative_answer(self, question: str, content: List[Dict],
                                         question_analysis: Dict) -> str:
        """Generate a comparative analysis answer."""
        if not content:
            return "I don't have comparative information about those topics."

        # Look for comparison keywords in content
        combined_content = " ".join([item.get("content", "") for item in content])

        comparison_indicators = [
            "difference", "compared to", "versus", "vs", "unlike", "similar to",
            "whereas", "however", "although", "but", "advantages", "disadvantages"
        ]

        sentences = re.split(r'[.!?]+', combined_content)
        comparison_sentences = []

        for sentence in sentences:
            sentence_lower = sentence.lower()
            if any(indicator in sentence_lower for indicator in comparison_indicators):
                comparison_sentences.append(sentence.strip())

        if comparison_sentences:
            comparison_text = "\n".join(comparison_sentences[:4])
            return f"Here's a comparison based on the course materials:\n{comparison_text}"
        else:
            return await self._generate_direct_answer(question, content, question_analysis)

    async def _generate_analytical_answer(self, question: str, content: List[Dict],
                                        question_analysis: Dict) -> str:
        """Generate an analytical answer."""
        if not content:
            return "I don't have analytical information about that topic."

        # Look for analytical content (why, implications, etc.)
        combined_content = " ".join([item.get("content", "") for item in content])

        analytical_indicators = [
            "because", "therefore", "consequently", "as a result", "due to",
            "leads to", "causes", "results in", "implies", "suggests", "indicates"
        ]

        sentences = re.split(r'[.!?]+', combined_content)
        analytical_sentences = []

        for sentence in sentences:
            sentence_lower = sentence.lower()
            if any(indicator in sentence_lower for indicator in analytical_indicators):
                analytical_sentences.append(sentence.strip())

        if analytical_sentences:
            analysis_text = "\n".join(analytical_sentences[:4])
            return f"Here's an analysis of the topic:\n{analysis_text}"
        else:
            return await self._generate_direct_answer(question, content, question_analysis)

    async def _generate_follow_up_questions(self, question_analysis: Dict,
                                          content: List[Dict]) -> List[str]:
        """Generate follow-up questions to deepen understanding."""
        follow_ups = []
        question_type = question_analysis.get("question_type", "general")

        if question_type == "factual":
            follow_ups.extend([
                "Does this answer your question completely?",
                "Would you like me to provide more details about this?",
                "Is there a related concept you'd like to explore?"
            ])
        elif question_type == "explanatory":
            follow_ups.extend([
                "Does this explanation make sense to you?",
                "Would you like to see a practical example?",
                "Shall we work through a problem together?"
            ])
        elif question_type == "procedural":
            follow_ups.extend([
                "Would you like to try applying this process?",
                "Do you have any questions about these steps?",
                "Would you like to see this process in action?"
            ])
        elif question_type == "comparative":
            follow_ups.extend([
                "Does this comparison help clarify the differences?",
                "Would you like to explore one of these options in more detail?",
                "Do you have a preference between these approaches?"
            ])
        else:
            follow_ups.extend([
                "Is there anything specific you'd like to know more about?",
                "Would you like me to elaborate on any part of this?",
                "Do you have related questions I can help with?"
            ])

        return follow_ups[:3]

    async def _calculate_answer_confidence(self, content: List[Dict],
                                         question_analysis: Dict) -> float:
        """Calculate confidence score for the answer."""
        if not content:
            return 0.0

        # Base confidence from content relevance
        avg_relevance = sum(item.get("relevance_score", 0.5) for item in content) / len(content)

        # Boost for multiple sources
        source_boost = min(len(content) * 0.1, 0.3)

        # Boost for question analysis confidence
        analysis_confidence = question_analysis.get("confidence", 0.5)
        analysis_boost = analysis_confidence * 0.2

        confidence = avg_relevance + source_boost + analysis_boost
        return min(confidence, 1.0)

class AnswerEvaluator:
    """Evaluates and improves answer quality."""

    def __init__(self, nlp_engine: NLPEngine):
        self.nlp_engine = nlp_engine

    async def evaluate_answer(self, question: str, answer: str,
                            question_analysis: Dict) -> Dict[str, Any]:
        """Evaluate the quality of an answer."""
        try:
            # Analyze answer with NLP
            answer_analysis = await self.nlp_engine.analyze_message(answer)

            # Check answer relevance to question
            relevance_score = await self._check_relevance(question, answer, question_analysis)

            # Assess answer completeness
            completeness_score = await self._assess_completeness(question, answer, question_analysis)

            # Check for clarity and coherence
            clarity_score = await self._assess_clarity(answer, answer_analysis)

            # Overall quality score
            quality_score = (relevance_score + completeness_score + clarity_score) / 3

            # Generate improvement suggestions
            suggestions = await self._generate_improvements(
                relevance_score, completeness_score, clarity_score, question_analysis
            )

            return {
                "quality_score": quality_score,
                "relevance_score": relevance_score,
                "completeness_score": completeness_score,
                "clarity_score": clarity_score,
                "suggestions": suggestions,
                "evaluation_timestamp": datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Error evaluating answer: {str(e)}")
            return {
                "quality_score": 0.5,
                "relevance_score": 0.5,
                "completeness_score": 0.5,
                "clarity_score": 0.5,
                "suggestions": ["Unable to evaluate answer quality"],
                "error": str(e)
            }

    async def _check_relevance(self, question: str, answer: str,
                             question_analysis: Dict) -> float:
        """Check how relevant the answer is to the question."""
        question_words = set(question.lower().split())
        answer_words = set(answer.lower().split())

        # Calculate word overlap
        overlap = len(question_words.intersection(answer_words))
        total_unique = len(question_words.union(answer_words))

        if total_unique == 0:
            return 0.0

        overlap_score = overlap / total_unique

        # Check for key concepts
        question_concepts = {elem["value"] for elem in question_analysis.get("key_elements", [])
                           if elem["type"] == "concept"}
        answer_concepts = set()  # Would need concept extraction here

        concept_overlap = len(question_concepts.intersection(answer_concepts))
        concept_score = concept_overlap / len(question_concepts) if question_concepts else 0.5

        return min((overlap_score + concept_score) / 2 + 0.3, 1.0)

    async def _assess_completeness(self, question: str, answer: str,
                                 question_analysis: Dict) -> float:
        """Assess how complete the answer is."""
        question_type = question_analysis.get("question_type", "general")

        # Different completeness criteria for different question types
        if question_type == "factual":
            # For factual questions, check for definitive answers
            definitive_indicators = ["is", "are", "was", "were", "the", "a", "an"]
            words = answer.lower().split()
            definitive_count = sum(1 for word in definitive_indicators if word in words)
            return min(definitive_count / 5 + 0.4, 1.0)

        elif question_type in ["explanatory", "procedural"]:
            # For explanatory questions, check for detail and structure
            sentence_count = len(re.split(r'[.!?]+', answer))
            word_count = len(answer.split())
            return min((sentence_count / 5 + word_count / 100) / 2 + 0.3, 1.0)

        else:
            # General assessment
            word_count = len(answer.split())
            return min(word_count / 50 + 0.4, 1.0)

    async def _assess_clarity(self, answer: str, answer_analysis: Dict) -> float:
        """Assess clarity and coherence of the answer."""
        complexity = answer_analysis.get("complexity", {})
        complexity_level = complexity.get("complexity_level", "medium")

        # Adjust score based on complexity
        if complexity_level == "low":
            clarity_score = 0.9
        elif complexity_level == "medium":
            clarity_score = 0.7
        else:
            clarity_score = 0.5

        # Check for coherence indicators
        sentences = re.split(r'[.!?]+', answer)
        if len(sentences) > 1:
            # Check for transition words
            transitions = ["however", "therefore", "also", "but", "and", "or", "so", "because"]
            transition_count = sum(1 for sentence in sentences
                                 for transition in transitions
                                 if transition in sentence.lower())
            coherence_boost = min(transition_count / len(sentences), 0.2)
            clarity_score += coherence_boost

        return min(clarity_score, 1.0)

    async def _generate_improvements(self, relevance: float, completeness: float,
                                   clarity: float, question_analysis: Dict) -> List[str]:
        """Generate suggestions for improving the answer."""
        suggestions = []

        if relevance < 0.6:
            suggestions.append("Increase relevance by directly addressing the question's key elements")

        if completeness < 0.6:
            question_type = question_analysis.get("question_type", "general")
            if question_type == "factual":
                suggestions.append("Provide more definitive facts and specific details")
            elif question_type in ["explanatory", "procedural"]:
                suggestions.append("Add more detailed steps or explanations")
            else:
                suggestions.append("Expand the answer with more comprehensive information")

        if clarity < 0.6:
            suggestions.append("Improve clarity by using simpler language and clearer structure")
            suggestions.append("Break down complex ideas into smaller, digestible parts")

        if not suggestions:
            suggestions.append("Answer quality is good - consider adding examples or practical applications")

        return suggestions

class QAEngine(BaseService):
    """Main Q&A Engine service combining all Q&A capabilities."""

    def __init__(self, nlp_engine: NLPEngine, vector_store: VectorStoreService,
                 embedding_service: OptimizedEmbeddingService):
        super().__init__()
        self.nlp_engine = nlp_engine
        self.question_processor = QuestionProcessor(nlp_engine)
        self.answer_generator = AnswerGenerator(vector_store, embedding_service)
        self.answer_evaluator = AnswerEvaluator(nlp_engine)

    async def process_question(self, question: str, course_id: str,
                             context: Optional[Dict] = None) -> Dict[str, Any]:
        """Process a question and generate a comprehensive answer."""
        try:
            # Process the question
            question_analysis = await self.question_processor.process_question(question, context)

            # Generate answer
            answer_result = await self.answer_generator.generate_answer(
                question, question_analysis, course_id, context
            )

            # Evaluate answer quality
            evaluation = await self.answer_evaluator.evaluate_answer(
                question, answer_result["answer_text"], question_analysis
            )

            # Combine results
            result = {
                **answer_result,
                "question_analysis": question_analysis,
                "evaluation": evaluation,
                "processing_timestamp": datetime.utcnow().isoformat()
            }

            return result

        except Exception as e:
            logger.error(f"Error processing question: {str(e)}")
            return {
                "answer_text": "I'm sorry, I encountered an error while processing your question. Please try again.",
                "confidence": 0.0,
                "sources": [],
                "follow_up_questions": [],
                "question_analysis": {},
                "evaluation": {"quality_score": 0.0},
                "error": str(e)
            }

    async def get_suggestions(self, topic: str, course_id: str,
                            count: int = 5) -> List[Dict[str, Any]]:
        """Get suggested questions for a topic."""
        try:
            # Generate embedding for the topic
            topic_embedding = await self.answer_generator.embedding_service.generate_embedding(topic)

            # Find related content
            related_content = await self.answer_generator.vector_store.search_similar(
                embedding=topic_embedding,
                course_id=course_id,
                limit=10,
                threshold=0.7
            )

            if not related_content:
                return []

            # Generate question suggestions based on content
            suggestions = await self._generate_question_suggestions(topic, related_content, count)

            return suggestions

        except Exception as e:
            logger.error(f"Error generating suggestions: {str(e)}")
            return []

    async def _generate_question_suggestions(self, topic: str, content: List[Dict],
                                           count: int) -> List[Dict[str, Any]]:
        """Generate question suggestions based on content."""
        suggestions = []

        # Question templates for different types
        templates = {
            "factual": [
                "What is {concept}?",
                "Define {concept}",
                "What are the characteristics of {concept}?"
            ],
            "explanatory": [
                "How does {concept} work?",
                "Why is {concept} important?",
                "How is {concept} used?"
            ],
            "procedural": [
                "How do you {concept}?",
                "What are the steps for {concept}?",
                "How to implement {concept}?"
            ]
        }

        # Extract concepts from content
        all_concepts = set()
        for item in content:
            item_content = item.get("content", "")
            # Simple concept extraction (would be improved with NLP)
            words = item_content.split()
            concepts = [word for word in words if len(word) > 4 and word[0].isupper()]
            all_concepts.update(concepts)

        # Generate questions using templates
        concept_list = list(all_concepts)[:count]

        for i, concept in enumerate(concept_list):
            question_type = list(templates.keys())[i % len(templates)]
            template = templates[question_type][i % len(templates[question_type])]

            question = template.format(concept=concept)
            suggestions.append({
                "question": question,
                "type": question_type,
                "topic": topic,
                "difficulty": "medium",
                "estimated_time": "5-10 minutes"
            })

        return suggestions[:count]

    async def evaluate_user_answer(self, question: str, user_answer: str,
                                 correct_answer: str, course_id: str) -> Dict[str, Any]:
        """Evaluate a user's answer to a question."""
        try:
            # Analyze both answers
            user_analysis = await self.nlp_engine.analyze_message(user_answer)
            correct_analysis = await self.nlp_engine.analyze_message(correct_answer)

            # Compare semantic similarity (simplified)
            # Simple cosine similarity (would use proper implementation)
            similarity = 0.8  # Placeholder - would calculate actual similarity

            # Assess correctness based on similarity and key concepts
            user_concepts = {c["concept"] for c in user_analysis.get("concepts", [])}
            correct_concepts = {c["concept"] for c in correct_analysis.get("concepts", [])}

            concept_overlap = len(user_concepts.intersection(correct_concepts))
            concept_coverage = concept_overlap / len(correct_concepts) if correct_concepts else 0

            # Calculate overall score
            correctness_score = (similarity + concept_coverage) / 2

            # Generate feedback
            feedback = await self._generate_answer_feedback(
                correctness_score, user_analysis, correct_analysis
            )

            return {
                "correctness_score": correctness_score,
                "similarity_score": similarity,
                "concept_coverage": concept_coverage,
                "feedback": feedback,
                "strengths": await self._identify_strengths(user_answer, correct_answer),
                "improvements": await self._suggest_improvements(user_answer, correct_answer),
                "evaluation_timestamp": datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Error evaluating user answer: {str(e)}")
            return {
                "correctness_score": 0.0,
                "feedback": "Unable to evaluate answer",
                "error": str(e)
            }

    async def _generate_answer_feedback(self, score: float, user_analysis: Dict,
                                      correct_analysis: Dict) -> str:
        """Generate feedback for the user's answer."""
        if score >= 0.8:
            return "Excellent answer! You've captured the key points very well."
        elif score >= 0.6:
            return "Good answer with some strong points. There are a few areas for improvement."
        elif score >= 0.4:
            return "Your answer has potential but needs more development and accuracy."
        else:
            return "This answer needs significant improvement. Let's work on getting the core concepts right."

    async def _identify_strengths(self, user_answer: str, correct_answer: str) -> List[str]:
        """Identify strengths in the user's answer."""
        strengths = []

        # Simple strength detection
        if len(user_answer.split()) > len(correct_answer.split()) * 0.5:
            strengths.append("Good level of detail")

        if "?" not in user_answer:
            strengths.append("Clear and direct response")

        # Add more sophisticated strength detection here

        return strengths or ["Attempted to answer the question"]

    async def _suggest_improvements(self, user_answer: str, correct_answer: str) -> List[str]:
        """Suggest improvements for the user's answer."""
        improvements = []

        user_words = set(user_answer.lower().split())
        correct_words = set(correct_answer.lower().split())

        missing_key_words = correct_words - user_words
        if missing_key_words:
            improvements.append(f"Consider including key terms like: {', '.join(list(missing_key_words)[:3])}")

        if len(user_answer.split()) < 10:
            improvements.append("Provide more detailed explanations")

        if user_answer.endswith("?"):
            improvements.append("Ensure your answer actually addresses the question")

        return improvements or ["Review the correct answer and compare with your response"]
