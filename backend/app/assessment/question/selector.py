import random
from typing import List, Optional
from app.assessment.models.schemas import Question, QuestionMetadata
from app.assessment.engine.policy_engine import PolicyDecision, AssessmentAction

# MOCK DATABASE
MOCK_QUESTIONS = [
    Question(
        id="q1",
        content="What is the index of the first element in an array?",
        options=["0", "1", "-1", "Depends on language"],
        correct_answer="0",
        metadata=QuestionMetadata(
            question_id="q1",
            concepts=["arrays"],
            difficulty=0.2,
            blooms_level="knowledge"
        )
    ),
    Question(
        id="q2",
        content="Which operation adds an element to the end of a list in Python?",
        options=["append()", "push()", "add()", "insert()"],
        correct_answer="append()",
        metadata=QuestionMetadata(
            question_id="q2",
            concepts=["arrays", "lists"],
            difficulty=0.3,
            blooms_level="application"
        )
    ),
    Question(
        id="q3",
        content="What is the time complexity of accessing an array element by index?",
        options=["O(1)", "O(n)", "O(log n)", "O(n^2)"],
        correct_answer="O(1)",
        metadata=QuestionMetadata(
            question_id="q3",
            concepts=["arrays", "complexity"],
            difficulty=0.5,
            blooms_level="analysis"
        )
    ),
     Question(
        id="q4",
        content="Recursive functions must have a...?",
        options=["Base case", "Loop", "Global variable", "Pointer"],
        correct_answer="Base case",
        metadata=QuestionMetadata(
            question_id="q4",
            concepts=["recursion"],
            difficulty=0.4,
            blooms_level="knowledge"
        )
    ),
    Question(
        id="q5",
        content="What happens if a recursive function lacks a base case?",
        options=["Stack Overflow", "Heap Overflow", "Compilation Error", "Nothing"],
        correct_answer="Stack Overflow",
        metadata=QuestionMetadata(
            question_id="q5",
            concepts=["recursion"],
            difficulty=0.6,
            blooms_level="application"
        )
    ),
    Question(
        id="q6",
        content="In a sorted array of size N, how many comparisons does Binary Search take in worst case?",
        options=["N", "log N", "1", "N^2"],
        correct_answer="log N",
        metadata=QuestionMetadata(
            question_id="q6",
            concepts=["arrays", "complexity"],
            difficulty=0.4,
            blooms_level="analysis"
        )
    ),
    Question(
        id="q7",
        content="Which data structure uses LIFO (Last In First Out)?",
        options=["Queue", "Stack", "Array", "Tree"],
        correct_answer="Stack",
        metadata=QuestionMetadata(
            question_id="q7",
            concepts=["recursion"], # loosely related to recursion implementation
            difficulty=0.3,
            blooms_level="knowledge"
        )
    ),
    Question(
        id="q8",
        content="What is the result of [1, 2] + [3] in Python?",
        options=["[1, 2, 3]", "[1, 2, [3]]", "Error", "[4, 2]"],
        correct_answer="[1, 2, 3]",
        metadata=QuestionMetadata(
            question_id="q8",
            concepts=["arrays"],
            difficulty=0.3,
            blooms_level="application"
        )
    ),
    Question(
        id="q9",
        content="Which sorting algorithm has O(N^2) average complexity?",
        options=["Merge Sort", "Quick Sort", "Bubble Sort", "Heap Sort"],
        correct_answer="Bubble Sort",
        metadata=QuestionMetadata(
            question_id="q9",
            concepts=["complexity", "arrays"],
            difficulty=0.5,
            blooms_level="knowledge"
        )
    ),
    Question(
        id="q10",
        content="Tail recursion is an optimization that...",
        options=["Reduces stack usage", "Increases speed", "Uses heap", "Avoids loops"],
        correct_answer="Reduces stack usage",
        metadata=QuestionMetadata(
            question_id="q10",
            concepts=["recursion"],
            difficulty=0.8,
            blooms_level="synthesis"
        )
    ),
    Question(
        id="q11",
        content="What is the space complexity of an iterative array traversal?",
        options=["O(1)", "O(N)", "O(log N)", "O(N^2)"],
        correct_answer="O(1)",
        metadata=QuestionMetadata(
            question_id="q11",
            concepts=["complexity", "arrays"],
            difficulty=0.4,
            blooms_level="analysis"
        )
    ),
    Question(
        id="q12",
        content="Can an array store elements of different types in C?",
        options=["Yes", "No", "Only if pointers", "Depends on compiler"],
        correct_answer="No",
        metadata=QuestionMetadata(
            question_id="q12",
            concepts=["arrays"],
            difficulty=0.3,
            blooms_level="knowledge"
        )
    )
]

class QuestionSelector:
    """
    Selects the best question based on the policy decision.
    """
    
    def __init__(self, questions: List[Question] = None):
        self.questions = questions if questions else MOCK_QUESTIONS

    def select_question(self, decision: PolicyDecision, seen_question_ids: List[str]) -> Optional[Question]:
        if decision.action == AssessmentAction.STOP:
            return None
        
        candidates = []
        
        # 1. Filter by unseen
        available = [q for q in self.questions if q.id not in seen_question_ids]
        
        # 2. Filter by concepts (if specified)
        if decision.target_concepts:
            available = [q for q in available if any(c in decision.target_concepts for c in q.metadata.concepts)]
            
        if not available:
            # Fallback: maybe relax concept constraint or return None (generate with LLM?)
             return None

        # 3. Find closest difficulty match
        # We want to minimize |q.difficulty - target|
        # And also consider randomness to avoid deterministic loops if we had ties
        
        # Sort by distance to target difficulty
        available.sort(key=lambda q: abs(q.metadata.difficulty - decision.target_difficulty))
        
        # Take the top 3 closest and pick one randomly (Strategy Mix: slightly stochastic)
        top_candidates = available[:3]
        
        return random.choice(top_candidates) if top_candidates else None
