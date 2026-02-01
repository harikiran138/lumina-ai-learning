import random
from typing import List, Optional

from app.assessment.models.schemas import Option, Question, QuestionMetadata
from app.assessment.engine.policy_engine import PolicyDecision, AssessmentAction


def _make_mcq(
    qid: str,
    text: str,
    options_text: List[str],
    correct_answer_text: str,
    concepts: List[str],
    difficulty: float,
    blooms_level: str,
) -> Question:
    """Helper to build a canonical Question with metadata from simple pieces."""

    options: List[Option] = [Option(text=o) for o in options_text]
    # Find matching option; default to first if not found
    correct_opt = next((o for o in options if o.text == correct_answer_text), options[0])

    metadata = QuestionMetadata(
        question_id=qid,
        concepts=concepts,
        difficulty=difficulty,
        blooms_level=blooms_level,
    )

    return Question(
        id=qid,
        text=text,
        options=options,
        correct_option_id=correct_opt.id,
        difficulty=difficulty,
        topic="data_structures",  # simple topic label for this mock bank
        metadata=metadata,
    )


# MOCK DATABASE: small concept-tagged bank for arrays, recursion, complexity
MOCK_QUESTIONS: List[Question] = [
    _make_mcq(
        "q1",
        "What is the index of the first element in an array?",
        ["0", "1", "-1", "Depends on language"],
        "0",
        ["arrays"],
        0.2,
        "knowledge",
    ),
    _make_mcq(
        "q2",
        "Which operation adds an element to the end of a list in Python?",
        ["append()", "push()", "add()", "insert()"],
        "append()",
        ["arrays", "lists"],
        0.3,
        "application",
    ),
    _make_mcq(
        "q3",
        "What is the time complexity of accessing an array element by index?",
        ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
        "O(1)",
        ["arrays", "complexity"],
        0.5,
        "analysis",
    ),
    _make_mcq(
        "q4",
        "Recursive functions must have a...?",
        ["Base case", "Loop", "Global variable", "Pointer"],
        "Base case",
        ["recursion"],
        0.4,
        "knowledge",
    ),
    _make_mcq(
        "q5",
        "What happens if a recursive function lacks a base case?",
        ["Stack Overflow", "Heap Overflow", "Compilation Error", "Nothing"],
        "Stack Overflow",
        ["recursion"],
        0.6,
        "application",
    ),
    _make_mcq(
        "q6",
        "In a sorted array of size N, how many comparisons does Binary Search take in worst case?",
        ["N", "log N", "1", "N^2"],
        "log N",
        ["arrays", "complexity"],
        0.4,
        "analysis",
    ),
    _make_mcq(
        "q7",
        "Which data structure uses LIFO (Last In First Out)?",
        ["Queue", "Stack", "Array", "Tree"],
        "Stack",
        ["recursion"],  # loosely related to recursion implementation
        0.3,
        "knowledge",
    ),
    _make_mcq(
        "q8",
        "What is the result of [1, 2] + [3] in Python?",
        ["[1, 2, 3]", "[1, 2, [3]]", "Error", "[4, 2]"],
        "[1, 2, 3]",
        ["arrays"],
        0.3,
        "application",
    ),
    _make_mcq(
        "q9",
        "Which sorting algorithm has O(N^2) average complexity?",
        ["Merge Sort", "Quick Sort", "Bubble Sort", "Heap Sort"],
        "Bubble Sort",
        ["complexity", "arrays"],
        0.5,
        "knowledge",
    ),
    _make_mcq(
        "q10",
        "Tail recursion is an optimization that...",
        ["Reduces stack usage", "Increases speed", "Uses heap", "Avoids loops"],
        "Reduces stack usage",
        ["recursion"],
        0.8,
        "synthesis",
    ),
    _make_mcq(
        "q11",
        "What is the space complexity of an iterative array traversal?",
        ["O(1)", "O(N)", "O(log N)", "O(N^2)"],
        "O(1)",
        ["complexity", "arrays"],
        0.4,
        "analysis",
    ),
    _make_mcq(
        "q12",
        "Can an array store elements of different types in C?",
        ["Yes", "No", "Only if pointers", "Depends on compiler"],
        "No",
        ["arrays"],
        0.3,
        "knowledge",
    ),
]


class QuestionSelector:
    """Selects the best question based on the policy decision."""

    def __init__(self, questions: Optional[List[Question]] = None):
        self.questions = questions if questions is not None else MOCK_QUESTIONS

    def select_question(
        self, decision: PolicyDecision, seen_question_ids: List[str]
    ) -> Optional[Question]:
        if decision.action == AssessmentAction.STOP:
            return None

        # 1. Filter by unseen
        available = [q for q in self.questions if q.id not in seen_question_ids]

        # 2. Filter by concepts (if specified)
        if decision.target_concepts:
            filtered: List[Question] = []
            for q in available:
                concepts = q.metadata.concepts if q.metadata else []
                if any(c in concepts for c in decision.target_concepts):
                    filtered.append(q)
            available = filtered

        if not available:
            # Fallback: relax concept constraint and just use all unseen
            available = [q for q in self.questions if q.id not in seen_question_ids]
            if not available:
                return None

        # 3. Find closest difficulty match (using metadata if present, else question.difficulty)
        def _difficulty(q: Question) -> float:
            if q.metadata and q.metadata.difficulty is not None:
                return q.metadata.difficulty
            return q.difficulty

        available.sort(key=lambda q: abs(_difficulty(q) - decision.target_difficulty))

        # Take the top 3 closest and pick one randomly (slightly stochastic)
        top_candidates = available[:3]
        return random.choice(top_candidates) if top_candidates else None
