# Assessment Engine Documentation

## Table of Contents

1. [Overview](#overview)
2. [Assessment Philosophy](#assessment-philosophy)
3. [Dynamic Question Generation](#dynamic-question-generation)
4. [Difficulty Adaptation](#difficulty-adaptation)
5. [Assessment Session Flow](#assessment-session-flow)
6. [Real-Time LLM Grading](#real-time-llm-grading)
7. [Handwriting Assessment](#handwriting-assessment)
8. [Assignment-Based Course Generation](#assignment-based-course-generation)
9. [Scoring Algorithm](#scoring-algorithm)
10. [Mastery Thresholds](#mastery-thresholds)
11. [Celery Async Grading](#celery-async-grading)
12. [Anti-Cheating Measures](#anti-cheating-measures)
13. [Certificate Generation](#certificate-generation)
14. [Question Bank Management](#question-bank-management)
15. [Evaluation Metrics](#evaluation-metrics)
16. [API Endpoints](#api-endpoints)

---

## Overview

The Assessment Engine is the evaluation backbone of Lumina, providing:

- **Intelligent Question Generation**: Uses LLMs to create questions dynamically from course content
- **Adaptive Difficulty**: Adjusts question complexity based on student mastery level in real-time
- **Accurate Grading**: Grades open-ended responses using LLM + rubric-based scoring
- **Comprehensive Feedback**: Explains why answers are wrong and what student should learn
- **Anti-Cheating**: Detects anomalies in answer patterns, response times, and behaviors
- **Evidence-Based Mastery**: Tracks learning using BKT/DKT to determine true mastery
- **Certification**: Awards credentials when mastery thresholds are met

### Core Objectives

| Objective | Implementation |
|-----------|-----------------|
| **Validity** | Questions measure what they claim to measure (aligned to learning objectives) |
| **Reliability** | Consistent, fair grading; not affected by student identity or circumstances |
| **Fairness** | Bias-free questions; accommodations for diverse learners |
| **Efficiency** | Instant feedback; async grading for scalability |
| **Adaptivity** | Difficulty matches student level; no boredom or frustration |
| **Security** | Prevents cheating; maintains assessment integrity |

---

## Assessment Philosophy

### Why Dynamic Questions > Static Question Banks

**Traditional Approach (Static Bank):**

```
Question Bank (200 questions)
├── Same questions used repeatedly
├── Students memorize answers
├── No adaptation to individual level
├── Validity threatened by memorization
└── Doesn't measure true understanding

Problems:
- Answer key leaks on forum → Everyone knows correct answers
- Student A (50% mastery) and Student B (90% mastery) get same questions
  Result: Student A frustrated (too hard), Student B bored (too easy)
- Fairness issue: Earlier students have advantage
- Limited feedback beyond "correct/incorrect"
```

**Lumina's Approach (Dynamic Generation):**

```
Learner Profile → Assessment Engine → Unique Question Generated

Benefits:
✓ Every student gets different questions (prevents memorization)
✓ Each question tailored to student's level
✓ Each question fresh (never seen before)
✓ Unlimited questions (never exhaust the bank)
✓ Can regenerate if student reports unclear question
✓ Aligned to learning objectives (generated from course material)
✓ Rich feedback (LLM explains reasoning)

Example:
- Student A (50% mastery): "Factor 2x² + 7x + 3" (medium difficulty)
- Student B (90% mastery): "Prove: If x² + 5x + 6 = 0, then x ∈ {-2, -3}" (hard)
- Both are quadratic equations, but adapted to level
```

### Learning Outcome Alignment

```python
class LearningObjective(BaseModel):
    """Learning objective (from curriculum)."""

    objective_id: str
    topic: str
    description: str  # "Student will understand how to factor quadratics"
    bloom_level: str  # "understand", "apply", "analyze", "evaluate", "create"
    content_standards: List[str]  # Aligned standards (Common Core, etc.)
    prerequisite_objectives: List[str]

class AssessmentItem(BaseModel):
    """Assessment question item."""

    question_id: str
    learning_objective_id: str  # Aligned to objective
    question_text: str
    question_type: str  # MCQ, short_answer, essay, code, etc.
    difficulty_level: int  # 1-5
    bloom_level: str  # Maps to objective

    # Grading info
    correct_answer: str  # For auto-gradeable
    grading_rubric: Optional[Dict]  # For essays
    partial_credit_rules: Optional[Dict]
```

---

## Dynamic Question Generation

### Question Generation Pipeline

```
┌─────────────────────────────────────┐
│   Learning Objective (Topic, Level) │
└────────────┬────────────────────────┘
             │
             ▼
    ┌────────────────────────────┐
    │   Retrieve Course Content  │
    │   (relevant to topic)      │
    └────────────┬───────────────┘
                 │
                 ▼
    ┌──────────────────────────────┐
    │   Build Generation Prompt    │
    │   - Topic: quadratic_equations
    │   - Level: 3/5 (intermediate)
    │   - Type: multiple_choice
    │   - Context: word problem
    │   - Learning objective: apply
    │   - Student mistakes: sign errors
    │   - Include distractor based
    │     on common misconception
    └────────────┬─────────────────┘
                 │
                 ▼
    ┌──────────────────────────────┐
    │   LLM Generates Question     │
    │   (Ollama or Gemini)         │
    └────────────┬─────────────────┘
                 │
                 ▼
    ┌──────────────────────────────┐
    │   Validate Question Quality  │
    │   - Aligned to objective?    │
    │   - Correct level?           │
    │   - Grammar/clarity OK?      │
    │   - No bias/offensive?       │
    │   - Answer key correct?      │
    └────────────┬─────────────────┘
                 │
         ┌───────┴────────┐
         │ Pass?          │
         └───┬────────┬───┘
            YES      NO
             │        │
             │        └──→ Regenerate (up to 3x)
             │
             ▼
    ┌──────────────────────────┐
    │   Present to Student     │
    │   Log for analytics      │
    │   Store in question bank │
    └──────────────────────────┘
```

### Question Generation Implementation

```python
class QuestionGenerator:
    """Generates questions using LLM."""

    async def generate_question(
        self,
        learning_objective: LearningObjective,
        student_level: int,  # 1-5
        question_type: str,  # "mcq", "short_answer", "essay", "code"
        context: Optional[str] = None,  # e.g., "word_problem", "proof"
        avoid_misconceptions: Optional[List[str]] = None,
        max_attempts: int = 3
    ) -> AssessmentItem:
        """
        Generate a single assessment question.

        Process:
        1. Build generation prompt from objective + level + type
        2. Call LLM to generate question
        3. Validate quality
        4. Retry if needed
        5. Store for future reuse
        """

        for attempt in range(max_attempts):
            # Step 1: Build prompt
            prompt = await self._build_generation_prompt(
                objective=learning_objective,
                level=student_level,
                question_type=question_type,
                context=context,
                misconceptions=avoid_misconceptions
            )

            # Step 2: Call LLM
            generated = await self._call_question_generator(prompt)

            # Step 3: Parse response
            question_item = QuestionParseResult(
                question_text=generated.get("question"),
                question_type=question_type,
                options=generated.get("options"),  # For MCQ
                correct_answer=generated.get("correct_answer"),
                explanation=generated.get("explanation"),
                difficulty_estimate=generated.get("difficulty")
            )

            # Step 4: Validate
            is_valid, issues = await self._validate_question(question_item, learning_objective)

            if is_valid:
                # Store in database
                question_item.question_id = str(uuid4())
                question_item.learning_objective_id = learning_objective.objective_id
                await self.db.questions.insert(question_item.dict())

                return question_item

            # Log validation issues for debugging
            logger.warning(f"Question validation failed (attempt {attempt+1}): {issues}")

        # Max attempts reached
        raise QuestionGenerationError(
            f"Failed to generate valid question after {max_attempts} attempts"
        )

    async def _build_generation_prompt(
        self,
        objective: LearningObjective,
        level: int,
        question_type: str,
        context: Optional[str],
        misconceptions: Optional[List[str]]
    ) -> str:
        """Build detailed prompt for LLM question generation."""

        # Get relevant course content
        course_content = await self._retrieve_content(objective.topic)

        difficulty_descriptor = {
            1: "very easy, basic knowledge recall",
            2: "easy, simple application",
            3: "intermediate, requires some reasoning",
            4: "difficult, requires multiple steps",
            5: "very difficult, requires deep understanding"
        }[level]

        prompt = f"""
You are an expert educational assessment designer.

OBJECTIVE:
Topic: {objective.topic}
Description: {objective.description}
Learning Objective: {objective.bloom_level}
Student Level: {level}/5 ({difficulty_descriptor})

QUESTION TYPE: {question_type}

CONSTRAINTS:
1. Difficulty level must be {level}/5
2. Question must assess {objective.bloom_level}-level thinking
3. Should be aligned to the topic: {objective.topic}
4. Should take 2-5 minutes to complete
5. Must have a single, unambiguous correct answer
6. Language should be clear and unbiased

COURSE CONTENT (reference):
{course_content}

DISTRACTORS (common misconceptions to avoid):
{', '.join(misconceptions) if misconceptions else 'None provided'}

CONTEXT: {context or 'General assessment'}

Generate a {question_type} question that:
1. Tests understanding of {objective.description}
2. Is at difficulty level {level}/5
3. Has a clear correct answer
4. Includes 3-4 plausible wrong answers (if MCQ)
5. Explains WHY the correct answer is right (in explanation field)

Respond in JSON format:
{{
    "question": "The question text",
    "options": ["A", "B", "C", "D"],  // Only for MCQ
    "correct_answer": "A",
    "explanation": "Why A is correct and why B, C, D are wrong",
    "difficulty": {level}
}}
"""

        return prompt

    async def _validate_question(
        self,
        item: QuestionParseResult,
        objective: LearningObjective
    ) -> Tuple[bool, List[str]]:
        """Validate question quality."""

        issues = []

        # Check 1: Question is not empty
        if not item.question_text or len(item.question_text) < 20:
            issues.append("Question text too short or empty")

        # Check 2: For MCQ, has 3-4 options
        if item.question_type == "mcq":
            if not item.options or len(item.options) < 3:
                issues.append("MCQ must have at least 3 options")

            if item.correct_answer not in item.options:
                issues.append("Correct answer not in options list")

        # Check 3: Aligned to learning objective
        alignment_score = await self._check_objective_alignment(
            question_text=item.question_text,
            objective=objective
        )

        if alignment_score < 0.7:
            issues.append(f"Question not well-aligned to objective (score: {alignment_score:.2f})")

        # Check 4: Grammar and clarity
        clarity_issues = await self._check_clarity(item.question_text)
        if clarity_issues:
            issues.append(f"Clarity issues: {clarity_issues}")

        # Check 5: No bias detected
        bias_score = await self._check_for_bias(item.question_text, item.options or [])
        if bias_score > 0.3:
            issues.append(f"Potential bias detected (score: {bias_score:.2f})")

        # Check 6: Difficulty matches target
        estimated_difficulty = item.difficulty_estimate or 3
        target_difficulty = objective.difficulty_level if hasattr(objective, 'difficulty_level') else 3

        if abs(estimated_difficulty - target_difficulty) > 1:
            issues.append(
                f"Difficulty mismatch: estimated {estimated_difficulty}, target {target_difficulty}"
            )

        return len(issues) == 0, issues

    async def _retrieve_content(self, topic: str) -> str:
        """Retrieve relevant course material for context."""

        # Query RAG system
        chunks = await self.rag_system.retrieve(
            query=f"Explain {topic}",
            max_results=3
        )

        return "\n\n".join([chunk.content for chunk in chunks])

    async def _call_question_generator(self, prompt: str) -> Dict:
        """Call LLM to generate question."""

        response = await self.llm_provider.generate(
            prompt=prompt,
            system_prompt="You are an expert educational assessment designer.",
            temperature=0.7,
            max_tokens=1024
        )

        # Parse JSON response
        import json
        try:
            result = json.loads(response)
            return result
        except json.JSONDecodeError:
            # Try to extract JSON from response
            import re
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            raise QuestionGenerationError("Invalid JSON from LLM")
```

### Question Types

```python
class QuestionType(Enum):
    """Supported assessment question types."""

    MULTIPLE_CHOICE = "mcq"           # Select one correct option
    MULTIPLE_SELECT = "ms"            # Select multiple correct options
    SHORT_ANSWER = "short_answer"     # 1-2 sentence text response
    FILL_BLANK = "fill_blank"         # Fill in missing word/number
    TRUE_FALSE = "true_false"         # Boolean answer
    ESSAY = "essay"                   # Long-form written response
    CODE = "code"                     # Write code that passes tests
    MATCHING = "matching"             # Match concepts to definitions
    ORDERING = "ordering"             # Put items in correct sequence
    DIAGRAM = "diagram"               # Label or draw diagram
    HANDWRITING = "handwriting"       # Handwritten math/notation

class MCQuestion(AssessmentItem):
    """Multiple choice question."""

    options: List[str]  # ["A) ...", "B) ...", "C) ...", "D) ..."]
    correct_option: str  # "A"

class ShortAnswerQuestion(AssessmentItem):
    """Short answer question."""

    correct_answers: List[str]  # Multiple acceptable phrasings
    # Example: ["photosynthesis", "conversion of light to chemical energy"]

    keyword_required: Optional[List[str]]  # Must include certain concepts
    # Example: ["light", "energy", "glucose"]

class EssayQuestion(AssessmentItem):
    """Essay question with rubric-based grading."""

    grading_rubric: Dict[str, Dict]  # Dimension -> scoring levels
    # Example:
    # {
    #   "thesis_clarity": {
    #     "exemplary": "Clear, specific, arguable thesis (5 pts)",
    #     "proficient": "Clear thesis but may lack specificity (4 pts)",
    #     "developing": "Thesis present but unclear (2 pts)",
    #     "incomplete": "No clear thesis (0 pts)"
    #   },
    #   "evidence_support": {
    #     ...
    #   }
    # }

    min_word_count: int = 200
    max_word_count: int = 1000

class CodeQuestion(AssessmentItem):
    """Code question with test cases."""

    language: str  # "python", "javascript", "java"
    starter_code: str  # Code skeleton
    test_cases: List[Dict]  # [{"input": "...", "expected_output": "..."}]
    allowed_imports: List[str]  # Libs student can use
    max_execution_time_seconds: float = 5.0
```

---

## Difficulty Adaptation

### Real-Time Difficulty Adjustment

The assessment engine continuously adjusts difficulty based on student performance:

```
STUDENT JOURNEY THROUGH ASSESSMENT:

Start Level: 3/5 (middle)
├── Question 1: Moderate difficulty → Correct (50% → 55% mastery)
│   Next: Slight difficulty increase to 3.2
│
├── Question 2: Slightly hard → Correct (55% → 60% mastery)
│   Next: Further increase to 3.5
│
├── Question 3: Medium-hard → Wrong (60% → 55% mastery)
│   Next: Decrease back to 3.0 (calibrating)
│
├── Question 4: Medium → Correct (55% → 60% mastery)
│   Next: Increase to 3.3
│
├── Question 5: Medium-hard → Wrong (60% → 55% mastery)
│   Next: Stabilize at 3.0-3.3 (student is learning here)
│
└── Continue until mastery threshold met (90%+) or max questions reached
```

### Adaptive Algorithm (IRT - Item Response Theory)

```python
class AdaptiveAssessmentEngine:
    """Dynamically adjusts question difficulty."""

    async def select_next_question(
        self,
        user_id: str,
        current_mastery: float,  # 0-1 (current BKT-based estimate)
        previous_responses: List[Dict],
        target_difficulty: float = 0.5  # Optimal difficulty
    ) -> AssessmentItem:
        """
        Select next question using adaptive testing algorithm.

        Algorithm: Item Response Theory (IRT)
        - Questions have difficulty and discrimination parameters
        - Select question with difficulty closest to student's ability
        - Targets ~50% probability of correct answer (sweet spot)
        """

        # Get available questions for this topic
        available_questions = await self.db.questions.find(
            {"topic": self.current_topic},
            {"is_available": True}
        )

        # Score each question on suitability
        question_scores = []

        for question in available_questions:
            # Skip if student already answered this question
            if any(r["question_id"] == question.id for r in previous_responses):
                continue

            # IRT Model: How well does this question match current ability?
            # P(correct) = 1 / (1 + exp(-discrimination * (ability - difficulty)))

            discrimination = question.discrimination_parameter or 1.0  # Steepness
            difficulty = question.difficulty_parameter or 0.5

            p_correct = 1 / (1 + math.exp(-discrimination * (current_mastery - difficulty)))

            # Score: Distance from optimal 0.5 probability
            # (Student should have ~50% chance of getting it right)
            score = 1 - abs(p_correct - target_difficulty)

            # Bonus: Prefer questions that discriminate between students
            discrimination_bonus = abs(discrimination - 1.0) * 0.1

            question_scores.append({
                "question": question,
                "score": score + discrimination_bonus,
                "p_correct": p_correct
            })

        # Select top-scoring question
        if not question_scores:
            # No suitable question found, use random
            return random.choice(available_questions)

        best_question = max(question_scores, key=lambda x: x["score"])

        logger.info(
            f"Selected Q{best_question['question'].id}: "
            f"Difficulty={best_question['question'].difficulty_level}, "
            f"P(correct)={best_question['p_correct']:.2f}"
        )

        return best_question["question"]

    async def update_difficulty(
        self,
        user_id: str,
        current_difficulty: int,  # 1-5
        response_correct: bool,
        response_time_seconds: float,
        previous_accuracy: float
    ) -> int:
        """
        Adjust difficulty level for next question.

        Rules:
        - Correct + quick → Increase difficulty
        - Correct + slow → Keep difficulty
        - Incorrect + slow → Decrease difficulty
        - Incorrect + quick → Suspicious (possible guessing), retest at same level
        """

        new_difficulty = current_difficulty

        if response_correct:
            if response_time_seconds < 15:  # Quick correct = confident
                new_difficulty = min(current_difficulty + 1, 5)
            elif previous_accuracy > 0.7:  # Consistently correct
                new_difficulty = min(current_difficulty + 1, 5)

        else:  # Incorrect
            if response_time_seconds > 60:  # Slow incorrect = struggling
                new_difficulty = max(current_difficulty - 1, 1)
            elif response_time_seconds < 5 and current_difficulty > 2:
                # Very quick incorrect = likely guessing, retest
                new_difficulty = current_difficulty

        # Smooth transitions: don't jump more than 1 level
        new_difficulty = max(
            new_difficulty,
            current_difficulty - 1
        )
        new_difficulty = min(
            new_difficulty,
            current_difficulty + 1
        )

        return new_difficulty

class IRT_Parameters:
    """Item Response Theory parameters for questions."""

    difficulty_parameter: float  # How hard the question is (-3 to +3)
    # -3: Very easy, +3: Very hard, 0: Medium

    discrimination_parameter: float  # How well question discriminates ability (0.2 to 2.0)
    # 0.2: Poor (random students as likely to pass as smart students)
    # 1.0: Good (smart students more likely to pass)
    # 2.0: Excellent (strong correlation with ability)

    guessing_parameter: float  # Prob of correct answer by pure chance (0.2 to 0.5)
    # For MCQ with 4 options: ~0.25
    # For MCQ with 2 options: ~0.5
```

---

## Assessment Session Flow

### Session Lifecycle

```python
class AssessmentSession(BaseModel):
    """A single assessment session (e.g., quiz, final exam)."""

    session_id: str                    # UUID
    user_id: str
    assessment_id: str                 # Which assessment (quiz 1, midterm, etc.)
    course_id: str

    started_at: datetime
    submitted_at: Optional[datetime]
    is_submitted: bool = False

    # Question progression
    questions_presented: List[str]     # Question IDs shown
    responses: List[AssessmentResponse]  # Student responses
    current_question_number: int
    total_questions: int               # Unknown initially (adaptive)

    # Progression tracking
    current_difficulty: int            # 1-5
    current_mastery_estimate: float    # 0-1

    # Scoring
    raw_score: Optional[float]         # Points earned
    scaled_score: Optional[float]      # 0-100
    is_passed: Optional[bool]

    # Session state
    time_remaining_seconds: Optional[int]
    is_paused: bool = False
    pause_reason: Optional[str]

class AssessmentResponse(BaseModel):
    """Student's response to a question."""

    question_id: str
    response_text: str                 # What student submitted
    response_type: str                 # "selected_option", "typed_text", "image", "code"
    submitted_at: datetime
    response_time_seconds: float

    # Grading (populated after auto-grade)
    is_correct: Optional[bool]
    confidence_score: Optional[float]  # How confident we are in grade (0-1)
    points_earned: Optional[float]
    feedback: Optional[str]            # Explanation of grade

class AssessmentSessionManager:
    """Manages assessment session lifecycle."""

    async def create_session(
        self,
        user_id: str,
        assessment_id: str,
        course_id: str,
        time_limit_minutes: Optional[int] = None
    ) -> AssessmentSession:
        """
        Create new assessment session.

        Steps:
        1. Verify student is enrolled
        2. Check prerequisites (must complete earlier assessments)
        3. Initialize session state
        4. Load first question
        5. Start timer
        """

        # Verify enrollment
        enrollment = await self.db.enrollments.find_one(
            {"user_id": user_id, "course_id": course_id}
        )
        if not enrollment:
            raise NotEnrolledError("Student not enrolled in course")

        # Check prerequisites
        assessment = await self.db.assessments.find_one({"id": assessment_id})
        if assessment.prerequisite_assessment_ids:
            completed = await self._check_prerequisites_completed(
                user_id, assessment.prerequisite_assessment_ids
            )
            if not completed:
                raise PrerequisiteNotMetError("Must complete prerequisite assessment first")

        # Create session
        session = AssessmentSession(
            session_id=str(uuid4()),
            user_id=user_id,
            assessment_id=assessment_id,
            course_id=course_id,
            started_at=datetime.now(),
            current_question_number=0,
            total_questions=assessment.num_questions,
            current_difficulty=3,  # Start at medium
            current_mastery_estimate=0.5  # Neutral prior
        )

        # Save to database
        await self.db.assessment_sessions.insert(session.dict())

        # Load first question
        first_question = await self._select_first_question(assessment_id)
        session.questions_presented.append(first_question.id)
        session.current_question_number = 1

        # Start timer if time-limited
        if time_limit_minutes:
            session.time_remaining_seconds = time_limit_minutes * 60

        await self.db.assessment_sessions.update(
            {"session_id": session.session_id},
            session.dict()
        )

        return session

    async def submit_response(
        self,
        session_id: str,
        question_id: str,
        response: AssessmentResponse
    ) -> Dict:
        """
        Process student response.

        Steps:
        1. Validate response format
        2. Save response
        3. Grade response (async or immediate)
        4. Update mastery estimate
        5. Select next question
        6. Return feedback
        """

        session = await self.db.assessment_sessions.find_one(
            {"session_id": session_id}
        )

        if session.is_submitted:
            raise SessionSubmittedError("Assessment already submitted")

        # Validate
        if response.question_id != question_id:
            raise ValueError("Question ID mismatch")

        # Save response
        response.submitted_at = datetime.now()
        session.responses.append(response.dict())

        # Grade (immediate for MC, async for essays)
        question = await self.db.questions.find_one({"id": question_id})

        if question.question_type == "mcq":
            # Immediate grading
            is_correct = response.response_text == question.correct_option
            response.is_correct = is_correct
            response.confidence_score = 0.95  # High confidence for auto-grading

        else:
            # Queue for async grading
            await self.grading_queue.enqueue(
                "grade_response",
                session_id=session_id,
                question_id=question_id,
                response_text=response.response_text,
                grading_rubric=question.grading_rubric
            )
            response.confidence_score = 0.0  # Pending grading

        # Update mastery estimate (BKT)
        if response.is_correct is not None:
            new_mastery = await self._update_mastery_estimate(
                user_id=session.user_id,
                question=question,
                is_correct=response.is_correct,
                previous_mastery=session.current_mastery_estimate
            )
            session.current_mastery_estimate = new_mastery

        # Select next question
        if session.current_question_number < session.total_questions:
            next_question = await self._select_next_question(
                assessment_id=session.assessment_id,
                current_mastery=session.current_mastery_estimate,
                current_difficulty=session.current_difficulty,
                previous_responses=session.responses,
                previous_questions=session.questions_presented
            )

            session.questions_presented.append(next_question.id)
            session.current_question_number += 1

            # Adapt difficulty
            new_difficulty = await self._update_difficulty(
                current_difficulty=session.current_difficulty,
                response_correct=response.is_correct,
                response_time_seconds=response.response_time_seconds
            )
            session.current_difficulty = new_difficulty

            next_question_dict = next_question.dict()
        else:
            next_question_dict = None

        # Save updated session
        await self.db.assessment_sessions.update(
            {"session_id": session_id},
            session.dict()
        )

        return {
            "feedback": await self._generate_feedback(response, question),
            "next_question": next_question_dict,
            "progress": {
                "current": session.current_question_number,
                "total": session.total_questions,
                "mastery": session.current_mastery_estimate
            },
            "response_correct": response.is_correct,
            "points_earned": response.points_earned or (1 if response.is_correct else 0)
        }

    async def end_session(
        self,
        session_id: str,
        reason: str = "completed"  # "completed", "timeout", "withdrawn"
    ) -> AssessmentResult:
        """
        End assessment session and finalize score.

        Steps:
        1. Mark session as submitted
        2. Wait for pending grades (if any)
        3. Calculate final score
        4. Determine pass/fail
        5. Generate report
        6. Update learner profile
        """

        session = await self.db.assessment_sessions.find_one(
            {"session_id": session_id}
        )

        session.is_submitted = True
        session.submitted_at = datetime.now()

        # Wait for pending grades (timeout after 60s)
        max_wait_seconds = 60
        start_time = datetime.now()

        while any(r.get("confidence_score", 1.0) == 0.0 for r in session.responses):
            if (datetime.now() - start_time).seconds > max_wait_seconds:
                break
            await asyncio.sleep(1)  # Check every second

        # Calculate final score
        assessment = await self.db.assessments.find_one(
            {"id": session.assessment_id}
        )

        final_score = await self._calculate_score(
            session.responses,
            assessment
        )

        session.raw_score = final_score
        session.scaled_score = (final_score / 100) * 100  # Normalize to 0-100
        session.is_passed = session.scaled_score >= assessment.passing_threshold

        # Update learner profile
        await self._update_learner_profile(
            user_id=session.user_id,
            course_id=session.course_id,
            assessment_id=session.assessment_id,
            passed=session.is_passed,
            final_mastery=session.current_mastery_estimate
        )

        # Generate report
        report = await self._generate_assessment_report(session)

        # Save results
        await self.db.assessment_sessions.update(
            {"session_id": session_id},
            session.dict()
        )

        return AssessmentResult(
            session_id=session_id,
            user_id=session.user_id,
            assessment_id=session.assessment_id,
            raw_score=session.raw_score,
            scaled_score=session.scaled_score,
            is_passed=session.is_passed,
            submitted_at=session.submitted_at,
            report=report
        )
```

---

## Real-Time LLM Grading

### LLM-Based Response Evaluation

```python
class LLMGrader:
    """Grades open-ended responses using LLM + rubric."""

    async def grade_response(
        self,
        student_response: str,
        question: AssessmentItem,
        rubric: Dict,
        student_level: int,
        context: Optional[str] = None
    ) -> GradeResult:
        """
        Grade open-ended response using LLM.

        Process:
        1. Build grading prompt with rubric
        2. Call LLM to evaluate response
        3. Parse LLM output (score + reasoning)
        4. Validate score (shouldn't differ from reference by >1 level)
        5. Return grade + feedback
        """

        # Step 1: Build grading prompt
        grading_prompt = self._build_grading_prompt(
            question=question,
            student_response=student_response,
            rubric=rubric,
            student_level=student_level,
            context=context
        )

        # Step 2: Call LLM
        llm_response = await self.llm_provider.generate(
            prompt=grading_prompt,
            system_prompt=GRADING_SYSTEM_PROMPT,
            temperature=0.3,  # Lower temp for consistency
            max_tokens=1024
        )

        # Step 3: Parse response
        grade_result = await self._parse_grading_response(llm_response, rubric)

        # Step 4: Validate
        confidence_score = await self._validate_grade(
            grade_result=grade_result,
            student_response=student_response,
            rubric=rubric
        )

        grade_result.confidence_score = confidence_score

        # Step 5: Generate feedback
        feedback = await self._generate_grading_feedback(
            grade_result=grade_result,
            question=question,
            student_response=student_response
        )

        grade_result.feedback = feedback

        return grade_result

    def _build_grading_prompt(
        self,
        question: AssessmentItem,
        student_response: str,
        rubric: Dict,
        student_level: int,
        context: Optional[str]
    ) -> str:
        """Build detailed grading prompt."""

        rubric_text = self._format_rubric(rubric)

        prompt = f"""
You are an expert educator grading student work.

QUESTION:
{question.question_text}

STUDENT RESPONSE:
{student_response}

GRADING RUBRIC:
{rubric_text}

STUDENT LEVEL: {student_level}/5
(Adjust expectations accordingly - this is a {student_level}/5 student)

CONTEXT: {context or 'General assessment'}

INSTRUCTIONS:
1. Carefully read the student response
2. Evaluate against each rubric dimension
3. Assign score for each dimension
4. Calculate overall score
5. Provide specific, actionable feedback

Respond in JSON format:
{{
    "dimension_scores": {{
        "clarity": {{"score": 3, "max": 5, "evidence": "Student clearly explained..."}},
        "completeness": {{"score": 4, "max": 5, "evidence": "Response addresses all parts..."}},
        ...
    }},
    "overall_score": 18,
    "overall_max": 25,
    "passing": true,
    "feedback": "Strengths: ... Areas to improve: ...",
    "reasoning": "Detailed explanation of grading decisions"
}}
"""

        return prompt

    async def _parse_grading_response(
        self,
        llm_response: str,
        rubric: Dict
    ) -> GradeResult:
        """Parse LLM's grading response."""

        import json

        try:
            parsed = json.loads(llm_response)
        except json.JSONDecodeError:
            # Try to extract JSON
            import re
            json_match = re.search(r'\{.*\}', llm_response, re.DOTALL)
            if json_match:
                parsed = json.loads(json_match.group())
            else:
                raise GradingError("Could not parse LLM grading response")

        # Extract scores
        dimension_scores = parsed.get("dimension_scores", {})
        overall_score = parsed.get("overall_score", 0)
        overall_max = parsed.get("overall_max", 100)

        # Normalize to 0-1
        scaled_score = overall_score / overall_max if overall_max > 0 else 0

        return GradeResult(
            is_correct=parsed.get("passing", scaled_score >= 0.7),
            raw_score=overall_score,
            max_score=overall_max,
            scaled_score=scaled_score,
            dimension_scores=dimension_scores,
            feedback=parsed.get("feedback", ""),
            reasoning=parsed.get("reasoning", "")
        )

    async def _validate_grade(
        self,
        grade_result: GradeResult,
        student_response: str,
        rubric: Dict
    ) -> float:
        """
        Validate grading confidence.

        Cross-checks:
        - Does score match the feedback?
        - Are there obvious errors in grading?
        - How well-structured is the response?
        """

        confidence = 1.0

        # Check 1: Response length vs rubric expectations
        word_count = len(student_response.split())
        if word_count < 20:
            confidence *= 0.8  # Very brief response, less confident

        # Check 2: Presence of key concepts
        key_concepts = self._extract_key_concepts_from_rubric(rubric)
        concepts_found = sum(
            1 for concept in key_concepts
            if concept.lower() in student_response.lower()
        )

        if len(key_concepts) > 0:
            concept_coverage = concepts_found / len(key_concepts)
            if concept_coverage < grade_result.scaled_score:
                # Score higher than concept coverage, suspicious
                confidence *= 0.7

        # Check 3: Grammar/clarity
        if len(student_response) > 100:
            grammar_score = await self._assess_grammar(student_response)
            if grammar_score < 0.5 and grade_result.scaled_score > 0.6:
                confidence *= 0.8  # Poor grammar but high score, suspicious

        return min(confidence, 0.99)  # Cap at 99%

    def _format_rubric(self, rubric: Dict) -> str:
        """Format rubric for display in prompt."""

        formatted_parts = []

        for dimension, levels in rubric.items():
            formatted_parts.append(f"\n{dimension.upper()}:")

            for level_name, description in levels.items():
                formatted_parts.append(f"  {level_name}: {description}")

        return "\n".join(formatted_parts)

    async def _generate_grading_feedback(
        self,
        grade_result: GradeResult,
        question: AssessmentItem,
        student_response: str
    ) -> str:
        """Generate detailed feedback for student."""

        feedback_parts = []

        # Part 1: Overall assessment
        if grade_result.is_correct:
            feedback_parts.append("✓ Your response demonstrates understanding of the concept.")
        else:
            feedback_parts.append(
                "Your response shows some understanding, "
                "but there are areas that need improvement."
            )

        # Part 2: Dimension-specific feedback
        if grade_result.dimension_scores:
            feedback_parts.append("\nBy dimension:")

            for dimension, score_data in grade_result.dimension_scores.items():
                feedback_parts.append(
                    f"  • {dimension}: {score_data.get('score', 0)}/{score_data.get('max', 5)} - "
                    f"{score_data.get('evidence', '')}"
                )

        # Part 3: Specific guidance
        feedback_parts.append("\nTo improve:")
        feedback_parts.append(grade_result.feedback)

        # Part 4: Reference material
        feedback_parts.append(
            "\nFor more information, review the course material on this topic "
            "or ask your tutor."
        )

        return "\n".join(feedback_parts)
```

---

## Handwriting Assessment

### OCR + Grading Pipeline

```python
class HandwritingAssessor:
    """Assesses handwritten responses (math, notation, drawings)."""

    async def process_handwriting(
        self,
        image_bytes: bytes,
        question: AssessmentItem,
        student_id: str
    ) -> GradeResult:
        """
        Process handwritten response.

        Pipeline:
        1. OCR (extract text/notation from image)
        2. Cleanup & normalization
        3. Grade as text response
        4. Return grade + handwriting feedback
        """

        # Step 1: OCR
        extracted_text = await self._ocr_handwriting(image_bytes)

        # Step 2: Cleanup
        cleaned_text = await self._normalize_notation(extracted_text)

        # Step 3: Grade
        if question.question_type == "handwriting":
            grade_result = await self.llm_grader.grade_response(
                student_response=cleaned_text,
                question=question,
                rubric=question.grading_rubric or {},
                student_level=await self._get_student_level(student_id),
                context="handwritten_response"
            )
        else:
            grade_result = GradeResult(
                is_correct=cleaned_text == question.correct_answer,
                raw_score=100 if cleaned_text == question.correct_answer else 0,
                max_score=100,
                scaled_score=1.0 if cleaned_text == question.correct_answer else 0.0
            )

        # Step 4: Add handwriting feedback
        handwriting_quality = await self._assess_handwriting_legibility(image_bytes)

        if handwriting_quality < 0.5:
            grade_result.feedback += (
                "\nNote: Your handwriting was difficult to read in places. "
                "Clearer writing will help communicate your thinking."
            )

        return grade_result

    async def _ocr_handwriting(self, image_bytes: bytes) -> str:
        """
        Extract text from handwritten image.

        Uses Tesseract or cloud OCR API.
        """

        # Save temporary file
        import tempfile
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            tmp.write(image_bytes)
            tmp_path = tmp.name

        try:
            # Call Tesseract
            extracted = pytesseract.image_to_string(tmp_path)
            return extracted

        finally:
            import os
            os.unlink(tmp_path)

    async def _normalize_notation(self, text: str) -> str:
        """Normalize mathematical notation."""

        # Convert common handwriting variations to standard notation
        # Example: "2^3" or "2 to the power 3" → "2**3"

        replacements = {
            r"(\w)\^(\w)": r"\1**\2",  # Exponents
            r"(\w)\s+to\s+the\s+(\w+)": r"\1**\2",  # "to the power"
            r"√(\w)": r"sqrt(\1)",  # Square root
            r"∫": "integral",
            r"∑": "sum",
            r"∏": "product",
            r"π": "pi",
            r"θ": "theta",
            r"×": "*",
            r"÷": "/",
        }

        for pattern, replacement in replacements.items():
            text = re.sub(pattern, replacement, text)

        return text

    async def _assess_handwriting_legibility(self, image_bytes: bytes) -> float:
        """
        Assess how legible the handwriting is (0-1).

        Factors:
        - Contrast (dark ink on light paper)
        - Size (readable without magnification)
        - Spacing (letters/words aren't cramped)
        - Consistency (uniform size/slant)
        """

        # Load image
        from PIL import Image
        import io

        image = Image.open(io.BytesIO(image_bytes))

        # Convert to grayscale
        gray = image.convert("L")

        # Assess contrast
        pixels = list(gray.getdata())
        mean_brightness = sum(pixels) / len(pixels)
        contrast = abs(mean_brightness - 128) / 128  # 0-1, high = good contrast

        # Assess size (estimated from image dimensions vs area covered)
        width, height = image.size
        pixels_used = sum(1 for p in pixels if 50 < p < 200)  # Non-white, non-black
        density = pixels_used / (width * height)

        # Assess spacing (OCR confidence can indicate spacing)
        spacing_score = 0.7 if 0.2 < density < 0.8 else 0.4

        # Combined legibility score
        legibility = (contrast * 0.4 + spacing_score * 0.6)

        return legibility
```

---

## Assignment-Based Course Generation

### Dynamic Course Creation from Assignment Scores

```python
class AssignmentCourseGenerator:
    """
    Generates personalized course based on assignment results.

    Use case: Student scores 40% on physics assignment
    → System generates remedial physics course targeting weak areas
    """

    async def analyze_assignment(
        self,
        user_id: str,
        assignment_id: str,
        assignment_results: AssignmentResult
    ) -> AssignmentAnalysis:
        """
        Analyze student's assignment performance.

        Returns:
        - Overall score
        - Performance by topic/concept
        - Identified weaknesses
        - Learning objectives not yet mastered
        """

        analysis = AssignmentAnalysis(
            assignment_id=assignment_id,
            overall_score=assignment_results.scaled_score,
            analyzed_at=datetime.now()
        )

        # Extract question-by-question performance
        for question_id, response in assignment_results.responses.items():
            question = await self.db.questions.find_one({"id": question_id})

            analysis.topic_performance[question.topic] = {
                "correct": response.is_correct,
                "score": response.points_earned or (1 if response.is_correct else 0),
                "mastery": await self._estimate_topic_mastery(
                    user_id=user_id,
                    topic=question.topic,
                    recent_responses=[response]
                )
            }

        # Identify weak topics (< 70% mastery)
        analysis.weak_topics = [
            topic for topic, perf in analysis.topic_performance.items()
            if perf["mastery"] < 0.7
        ]

        return analysis

    async def generate_course(
        self,
        user_id: str,
        course_id: str,
        assignment_analysis: AssignmentAnalysis,
        duration_hours: int = 4
    ) -> GeneratedCourse:
        """
        Generate personalized remedial course.

        Steps:
        1. Identify prerequisite topics for weak areas
        2. Create learning path
        3. Generate course materials (video, text, practice)
        4. Schedule completion
        """

        generated_course = GeneratedCourse(
            generated_at=datetime.now(),
            reason="assignment_remediation",
            assignment_id=assignment_analysis.assignment_id,
            target_user_id=user_id,
            duration_hours=duration_hours
        )

        # Step 1: Identify prerequisites
        prerequisite_topics = []

        for weak_topic in assignment_analysis.weak_topics:
            prereqs = await self._get_prerequisites(weak_topic)
            prerequisite_topics.extend(prereqs)

        # Step 2: Create learning path
        learning_path = await self._create_learning_path(
            weak_topics=assignment_analysis.weak_topics,
            prerequisite_topics=prerequisite_topics,
            duration_hours=duration_hours
        )

        # Step 3: Generate materials
        for lesson in learning_path:
            lesson_materials = await self._generate_lesson_materials(
                topic=lesson.topic,
                level=3,  # Intermediate
                focus="remediation"
            )

            lesson.materials = lesson_materials

            # Add assessment
            lesson.assessment = await self.question_generator.generate_question(
                learning_objective=LearningObjective(
                    topic=lesson.topic,
                    description=f"Check understanding of {lesson.topic}",
                    bloom_level="understand"
                ),
                student_level=3,
                question_type="mcq"
            )

        generated_course.lessons = learning_path

        # Save to database
        await self.db.generated_courses.insert(generated_course.dict())

        return generated_course

    async def _create_learning_path(
        self,
        weak_topics: List[str],
        prerequisite_topics: List[str],
        duration_hours: int
    ) -> List[Lesson]:
        """Create ordered learning path."""

        # Start with prerequisites, then weak topics
        all_topics = prerequisite_topics + weak_topics

        # Remove duplicates while preserving order
        seen = set()
        unique_topics = []
        for topic in all_topics:
            if topic not in seen:
                unique_topics.append(topic)
                seen.add(topic)

        # Allocate time
        minutes_per_lesson = (duration_hours * 60) / len(unique_topics)

        lessons = []
        for i, topic in enumerate(unique_topics):
            lesson = Lesson(
                topic=topic,
                order=i + 1,
                estimated_duration_minutes=minutes_per_lesson,
                prerequisite_lessons=[lessons[j] for j in range(len(lessons))] if lessons else []
            )

            lessons.append(lesson)

        return lessons

    async def _generate_lesson_materials(
        self,
        topic: str,
        level: int,
        focus: str  # "introduction", "remediation", "enrichment"
    ) -> LessonMaterials:
        """Generate lesson materials for a topic."""

        materials = LessonMaterials(topic=topic)

        # Generate text explanation
        explanation_prompt = f"Explain {topic} for a {level}/5 student focusing on {focus}"
        explanation = await self.content_generator.generate(explanation_prompt)
        materials.text_content = explanation

        # Generate worked example
        example_prompt = f"Provide a step-by-step worked example of {topic}"
        example = await self.content_generator.generate(example_prompt)
        materials.worked_example = example

        # Generate practice questions
        materials.practice_questions = []
        for i in range(3):  # 3 practice problems
            question = await self.question_generator.generate_question(
                learning_objective=LearningObjective(
                    topic=topic,
                    description=f"Practice problem {i+1}",
                    bloom_level="apply"
                ),
                student_level=level,
                question_type="short_answer"
            )
            materials.practice_questions.append(question)

        return materials
```

---

## Scoring Algorithm

### Multi-Factor Scoring Formula

```python
class ScoringEngine:
    """Calculates assessment scores using multiple methods."""

    async def calculate_score(
        self,
        responses: List[AssessmentResponse],
        assessment: Assessment,
        student_level: int
    ) -> AssessmentScore:
        """
        Calculate comprehensive score.

        Methods:
        1. Raw points (sum of points_earned)
        2. Percentage correct
        3. Confidence-weighted score
        4. Time-adjusted score (penalize excessive time)
        5. Effort score (bonus for persistence)
        """

        score_result = AssessmentScore(
            assessment_id=assessment.id,
            timestamp=datetime.now()
        )

        # Method 1: Raw points
        total_points = sum(r.points_earned or (1 if r.is_correct else 0) for r in responses)
        max_points = len(responses)
        score_result.raw_score = total_points
        score_result.raw_score_max = max_points

        # Method 2: Percentage correct
        percentage_correct = (total_points / max_points * 100) if max_points > 0 else 0
        score_result.percentage_correct = percentage_correct

        # Method 3: Confidence-weighted score
        confidence_weighted = 0

        for response in responses:
            confidence = response.confidence_score or 1.0
            points = response.points_earned or (1 if response.is_correct else 0)
            confidence_weighted += points * confidence

        avg_confidence = np.mean([r.confidence_score or 1.0 for r in responses])
        score_result.confidence_weighted_score = (
            confidence_weighted / max_points if max_points > 0 else 0
        )

        # Method 4: Time-adjusted score
        # Excessive time suggests struggling; reward quick-but-correct
        total_time = sum(r.response_time_seconds or 60 for r in responses)
        expected_time = max_points * 30  # 30 seconds per question expected

        if total_time > expected_time * 2:  # 2x expected time
            time_penalty = 0.9  # 10% penalty
        elif total_time < expected_time * 0.5:  # Too fast (maybe guessing)
            if percentage_correct < 60:
                time_penalty = 0.7  # 30% penalty for fast + low accuracy
            else:
                time_penalty = 1.05  # 5% bonus for fast + accurate
        else:
            time_penalty = 1.0  # No adjustment

        score_result.time_adjusted_score = (percentage_correct / 100) * time_penalty

        # Method 5: Effort score (bonus for persistence)
        # Count attempts per question
        avg_attempts = np.mean([
            response.metadata.get("attempt_number", 1)
            for response in responses if response.metadata
        ]) if responses else 1

        effort_bonus = 1.0
        if avg_attempts > 2:  # Multiple attempts shows persistence
            effort_bonus = 1.05  # 5% bonus
        elif avg_attempts > 3 and percentage_correct > 50:  # Persistent AND improving
            effort_bonus = 1.10  # 10% bonus

        score_result.effort_adjusted_score = (percentage_correct / 100) * effort_bonus

        # Final composite score (weighted average of methods)
        weights = {
            "raw": 0.25,
            "percentage": 0.25,
            "confidence": 0.15,
            "time": 0.20,
            "effort": 0.15
        }

        final_score = (
            (score_result.raw_score / score_result.raw_score_max) * weights["raw"] +
            (percentage_correct / 100) * weights["percentage"] +
            score_result.confidence_weighted_score * weights["confidence"] +
            score_result.time_adjusted_score * weights["time"] +
            score_result.effort_adjusted_score * weights["effort"]
        ) * 100

        score_result.final_score = min(final_score, 100)  # Cap at 100
        score_result.is_passed = final_score >= assessment.passing_threshold

        return score_result
```

---

## Mastery Thresholds

### Mastery Definition and Progression

```python
class MasteryThreshold(BaseModel):
    """Defines mastery levels for a topic/objective."""

    topic: str
    mastery_threshold_bkt: float = 0.90  # 90% probability of knowing
    mastery_threshold_score: float = 0.85  # 85% score on assessment
    mastery_threshold_consistency: int = 3  # 3 consistent successes

class MasteryLevelClassification:
    """Maps mastery percentage to level."""

    LEVELS = {
        "not_started": (0.0, 0.1),      # 0-10%: Haven't attempted
        "struggling": (0.1, 0.4),       # 10-40%: Many errors
        "developing": (0.4, 0.7),       # 40-70%: Making progress
        "proficient": (0.7, 0.85),      # 70-85%: Good understanding
        "mastered": (0.85, 1.0),        # 85-100%: Full mastery
    }

    @classmethod
    def classify_mastery(cls, mastery_percentage: float) -> str:
        """Classify mastery level."""

        for level, (min_pct, max_pct) in cls.LEVELS.items():
            if min_pct <= mastery_percentage < max_pct:
                return level

        return "mastered"

    @classmethod
    def get_recommendation(cls, mastery_level: str) -> str:
        """Get learning recommendation based on mastery level."""

        recommendations = {
            "not_started": "Start with introductory material and basic examples.",
            "struggling": "Focus on fundamental concepts. Use worked examples and scaffolding.",
            "developing": "Continue practice with varied problems. Review misconceptions.",
            "proficient": "Tackle more challenging applications. Connect to other topics.",
            "mastered": "Ready for advanced topics or peer tutoring.",
        }

        return recommendations.get(mastery_level, "")

class MasteryTracker:
    """Tracks mastery progression over time."""

    async def update_mastery(
        self,
        user_id: str,
        topic: str,
        new_assessment_score: float
    ) -> MasteryUpdate:
        """
        Update topic mastery after assessment.

        Uses Bayesian update combining:
        - Previous mastery estimate (BKT/DKT)
        - New assessment score
        - Consistency of recent scores
        """

        # Get previous mastery
        previous_mastery = await self._get_current_mastery(user_id, topic)

        # Get recent scores (consistency check)
        recent_scores = await self._get_recent_scores(user_id, topic, limit=5)

        # Bayesian update
        # New mastery = weighted average of:
        # - Previous estimate (prior): 40%
        # - New assessment: 60%

        updated_mastery = (previous_mastery * 0.4 + new_assessment_score * 0.6)

        # Consistency bonus/penalty
        if len(recent_scores) >= 3:
            # Check if scores are consistent (low variance = consistent)
            variance = np.var(recent_scores + [new_assessment_score])

            if variance < 0.05:  # Very consistent
                updated_mastery *= 1.05  # 5% bonus
            elif variance > 0.2:  # Inconsistent
                updated_mastery *= 0.95  # 5% penalty

        # Cap at 1.0
        updated_mastery = min(updated_mastery, 1.0)

        # Determine if mastered
        threshold = 0.90
        is_mastered = updated_mastery >= threshold

        return MasteryUpdate(
            user_id=user_id,
            topic=topic,
            previous_mastery=previous_mastery,
            new_mastery=updated_mastery,
            assessment_score=new_assessment_score,
            is_mastered=is_mastered,
            mastery_level=self._classify_mastery(updated_mastery),
            recommendation=self._get_recommendation(updated_mastery)
        )

    async def _get_current_mastery(self, user_id: str, topic: str) -> float:
        """Get student's current mastery estimate for topic."""

        # Try BKT first
        bkt_state = await self.db.bkt_states.find_one(
            {"user_id": user_id, "concept_id": topic}
        )

        if bkt_state:
            return bkt_state["p_k"]

        # Fall back to DKT
        dkt_estimate = await self.dkt_tracker.predict_mastery(
            user_id=user_id,
            topic=topic,
            threshold=0.85
        )

        return dkt_estimate

    def _classify_mastery(self, mastery: float) -> str:
        """Classify mastery level (0-100)."""

        if mastery >= 0.85:
            return "mastered"
        elif mastery >= 0.70:
            return "proficient"
        elif mastery >= 0.40:
            return "developing"
        elif mastery >= 0.10:
            return "struggling"
        else:
            return "not_started"

    def _get_recommendation(self, mastery: float) -> str:
        """Get learning recommendation based on mastery."""

        level = self._classify_mastery(mastery)
        return MasteryLevelClassification.get_recommendation(level)
```

---

## Celery Async Grading

### Background Grading Queue

```python
# celery_app.py

from celery import Celery
from celery.result import AsyncResult

app = Celery('lumina')
app.config_from_object('celeryconfig')

@app.task(bind=True, max_retries=3)
def grade_essay_response(
    self,
    session_id: str,
    question_id: str,
    response_text: str,
    grading_rubric: Dict
):
    """
    Grade essay response asynchronously.

    Runs in background, updates database when complete.
    """

    try:
        # Initialize grader
        grader = LLMGrader(
            llm_provider=get_llm_provider(),
            db=get_db()
        )

        # Grade response
        grade_result = await grader.grade_response(
            student_response=response_text,
            question_id=question_id,
            rubric=grading_rubric
        )

        # Save grade to database
        db = get_db()
        await db.assessment_responses.update(
            {"session_id": session_id, "question_id": question_id},
            {
                "is_correct": grade_result.is_correct,
                "points_earned": grade_result.raw_score,
                "max_points": grade_result.max_score,
                "feedback": grade_result.feedback,
                "confidence_score": grade_result.confidence_score,
                "graded_at": datetime.now()
            }
        )

        # Update learner profile
        learner_profile = LearnerProfileEngine(db)
        await learner_profile.update_from_assessment(
            user_id=session_id.split(":")[1],  # Extract user_id from session_id
            assessment_result=grade_result
        )

        logger.info(f"Graded essay response {question_id}: {grade_result.is_correct}")

        return {
            "status": "success",
            "grade": grade_result.scaled_score,
            "feedback": grade_result.feedback
        }

    except Exception as exc:
        logger.error(f"Grading failed: {exc}")

        # Retry with exponential backoff
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))

@app.task(bind=True, max_retries=2)
def grade_code_submission(
    self,
    session_id: str,
    question_id: str,
    code_text: str,
    test_cases: List[Dict],
    language: str
):
    """Grade code submission by running test cases."""

    try:
        grader = CodeGrader(language=language)

        # Run code against test cases
        results = grader.run_tests(
            code=code_text,
            test_cases=test_cases,
            timeout_seconds=5
        )

        # Calculate score
        passed = sum(1 for r in results if r["passed"])
        total = len(test_cases)
        score = (passed / total * 100) if total > 0 else 0

        # Save results
        db = get_db()
        await db.assessment_responses.update(
            {"session_id": session_id, "question_id": question_id},
            {
                "is_correct": passed == total,
                "points_earned": score / 100,
                "max_points": 1,
                "feedback": CodeGrader.format_feedback(results),
                "test_results": results,
                "graded_at": datetime.now()
            }
        )

        return {
            "status": "success",
            "tests_passed": passed,
            "tests_total": total,
            "score": score
        }

    except TimeoutError:
        return {
            "status": "timeout",
            "feedback": "Code execution exceeded time limit (5 seconds)"
        }

    except Exception as exc:
        logger.error(f"Code grading failed: {exc}")
        raise self.retry(exc=exc, countdown=30 * (2 ** self.request.retries))

# Usage in assessment session
async def submit_response(session_id: str, question_id: str, response: AssessmentResponse):
    """Submit response and queue for grading if needed."""

    question = await get_question(question_id)

    if question.question_type == "essay":
        # Queue for background grading
        task = grade_essay_response.delay(
            session_id=session_id,
            question_id=question_id,
            response_text=response.response_text,
            grading_rubric=question.grading_rubric
        )

        return {
            "task_id": task.id,
            "status": "grading_in_progress"
        }

    elif question.question_type == "code":
        # Queue for code grading
        task = grade_code_submission.delay(
            session_id=session_id,
            question_id=question_id,
            code_text=response.response_text,
            test_cases=question.test_cases,
            language=question.language
        )

        return {
            "task_id": task.id,
            "status": "grading_in_progress"
        }

    else:
        # Immediate grading
        return {
            "status": "graded",
            "is_correct": response.is_correct,
            "feedback": response.feedback
        }

# Endpoint to check grading status
@router.get("/api/assessment/{session_id}/grading-status/{task_id}")
async def get_grading_status(session_id: str, task_id: str):
    """Check status of background grading task."""

    task_result = AsyncResult(task_id, app=app)

    return {
        "task_id": task_id,
        "status": task_result.status,
        "result": task_result.result if task_result.ready() else None,
        "error": str(task_result.info) if task_result.failed() else None
    }
```

---

## Anti-Cheating Measures

### Fraud Detection System

```python
class AnticheatingEngine:
    """Detects suspicious assessment behavior."""

    async def analyze_session_for_cheating(
        self,
        session_id: str
    ) -> CheatScore:
        """
        Analyze assessment session for signs of cheating.

        Red flags:
        - Sudden jump in performance/difficulty
        - Answers copied/too similar to another student
        - Response time anomalies
        - Idle time followed by rapid responses
        - Suspicious navigation patterns
        - Eye-gaze anomalies (if using webcam)
        """

        session = await self.db.assessment_sessions.find_one(
            {"session_id": session_id}
        )

        cheat_indicators = []

        # Indicator 1: Sudden performance change
        student_history = await self._get_student_assessment_history(session.user_id)
        performance_jump = await self._detect_performance_jump(
            session=session,
            history=student_history
        )

        if performance_jump["jump_detected"]:
            cheat_indicators.append({
                "type": "performance_anomaly",
                "severity": performance_jump["severity"],
                "description": f"Performance jumped from {performance_jump['baseline']}% to {performance_jump['current']}%"
            })

        # Indicator 2: Answer similarity (plagiarism detection)
        similarity_check = await self._check_answer_similarity(
            session_id=session_id,
            responses=session.responses
        )

        if similarity_check["suspicious_similarity"]:
            cheat_indicators.append({
                "type": "answer_similarity",
                "severity": similarity_check["max_similarity"],
                "description": f"Answers too similar to student {similarity_check['similar_to_user']}"
            })

        # Indicator 3: Response time anomalies
        time_anomaly = await self._detect_time_anomalies(session.responses)

        if time_anomaly["anomaly_detected"]:
            cheat_indicators.append({
                "type": "response_time_anomaly",
                "severity": time_anomaly["severity"],
                "description": time_anomaly["description"]
            })

        # Indicator 4: Navigation patterns
        if session.metadata.get("browser_events"):
            navigation_check = await self._check_navigation_patterns(
                session.metadata["browser_events"]
            )

            if navigation_check["suspicious"]:
                cheat_indicators.append({
                    "type": "suspicious_navigation",
                    "severity": navigation_check["severity"],
                    "description": navigation_check["description"]
                })

        # Indicator 5: Webcam monitoring (if available)
        if session.metadata.get("webcam_frames"):
            eye_gaze = await self._analyze_eye_gaze(
                session.metadata["webcam_frames"]
            )

            if eye_gaze["suspicious"]:
                cheat_indicators.append({
                    "type": "eye_gaze_anomaly",
                    "severity": eye_gaze["severity"],
                    "description": "Eye gaze not focused on screen"
                })

        # Calculate overall cheat score
        if not cheat_indicators:
            cheat_score = 0.0
            confidence = "LOW_RISK"
        else:
            # Weighted average of indicators
            avg_severity = np.mean([i["severity"] for i in cheat_indicators])
            indicator_count_weight = len(cheat_indicators) / 5  # 5 possible indicators

            cheat_score = (avg_severity * 0.7 + indicator_count_weight * 0.3)

            if cheat_score < 0.3:
                confidence = "LOW_RISK"
            elif cheat_score < 0.6:
                confidence = "MEDIUM_RISK"
            else:
                confidence = "HIGH_RISK"

        result = CheatScore(
            session_id=session_id,
            cheat_score=cheat_score,
            risk_level=confidence,
            indicators=cheat_indicators,
            recommendations=await self._get_recommendations(
                cheat_score, cheat_indicators
            )
        )

        return result

    async def _detect_performance_jump(
        self,
        session: AssessmentSession,
        history: List[AssessmentResult]
    ) -> Dict:
        """Detect sudden improvement/decline in performance."""

        if not history:
            return {"jump_detected": False}

        # Get baseline (average of last 3 assessments)
        recent_scores = [h.scaled_score for h in history[-3:]]
        baseline = np.mean(recent_scores) if recent_scores else 50

        # Current performance
        current_score = session.current_mastery_estimate * 100

        # Calculate jump
        jump_magnitude = abs(current_score - baseline)

        # Is jump suspicious?
        baseline_std = np.std(recent_scores) if recent_scores else 15

        # Threshold: >2.5 standard deviations from baseline
        threshold = baseline_std * 2.5

        if jump_magnitude > threshold:
            return {
                "jump_detected": True,
                "baseline": round(baseline),
                "current": round(current_score),
                "jump_magnitude": jump_magnitude,
                "threshold": threshold,
                "severity": min(jump_magnitude / threshold, 1.0)
            }

        return {"jump_detected": False}

    async def _check_answer_similarity(
        self,
        session_id: str,
        responses: List[AssessmentResponse]
    ) -> Dict:
        """Check if student's answers are suspiciously similar to others."""

        user_id = session_id.split(":")[1]

        # Get all responses for same assessment in last 24 hours
        similar_sessions = await self.db.assessment_sessions.find(
            {
                "assessment_id": session_id.split(":")[0],
                "user_id": {"$ne": user_id},
                "submitted_at": {"$gte": datetime.now() - timedelta(hours=24)}
            }
        ).limit(50)

        max_similarity = 0.0
        similar_to_user = None

        for session in similar_sessions:
            # Compare answers to those in other session
            for i, response in enumerate(responses):
                if i >= len(session.responses):
                    continue

                other_response = session.responses[i]

                # Compute similarity (using Levenshtein distance)
                similarity = self._compute_text_similarity(
                    response.response_text,
                    other_response["response_text"]
                )

                if similarity > max_similarity:
                    max_similarity = similarity
                    similar_to_user = session.user_id

        # Threshold: >80% similarity is suspicious
        threshold = 0.80

        return {
            "suspicious_similarity": max_similarity > threshold,
            "max_similarity": max_similarity,
            "similar_to_user": similar_to_user,
            "severity": max(0, (max_similarity - threshold) / (1 - threshold))
        }

    def _compute_text_similarity(self, text1: str, text2: str) -> float:
        """Compute similarity between two text responses (0-1)."""

        from difflib import SequenceMatcher

        similarity = SequenceMatcher(None, text1.lower(), text2.lower()).ratio()
        return similarity

    async def _detect_time_anomalies(
        self,
        responses: List[AssessmentResponse]
    ) -> Dict:
        """Detect response time anomalies."""

        response_times = [r.response_time_seconds for r in responses]

        if len(response_times) < 5:
            return {"anomaly_detected": False}

        mean_time = np.mean(response_times)
        std_time = np.std(response_times)

        anomalies = []

        # Check for very fast responses (possible guessing/AI assistance)
        very_fast = [t for t in response_times if t < 3 and mean_time > 30]

        if len(very_fast) / len(response_times) > 0.3:  # >30% very fast
            anomalies.append({
                "type": "suspiciously_fast",
                "count": len(very_fast),
                "percentage": len(very_fast) / len(response_times)
            })

        # Check for gaps (idle time followed by rapid responses)
        for i in range(1, len(response_times)):
            if response_times[i] > mean_time * 5 and response_times[i+1] < 5:
                anomalies.append({
                    "type": "gap_and_rapid",
                    "idle_time": response_times[i],
                    "rapid_response": response_times[i+1]
                })

        if anomalies:
            return {
                "anomaly_detected": True,
                "anomalies": anomalies,
                "severity": min(len(anomalies) / 5, 1.0),
                "description": f"Detected {len(anomalies)} time anomalies"
            }

        return {"anomaly_detected": False}
```

---

## Certificate Generation

### Mastery-Based Credentialing

```python
class CertificateGenerator:
    """Generates certificates upon mastery."""

    async def check_certification_eligibility(
        self,
        user_id: str,
        course_id: str,
        topic: str
    ) -> CertificationEligibility:
        """Check if student is eligible for certificate."""

        # Requirements:
        # 1. Mastery ≥ 90%
        # 2. Mastery consistent (no decline)
        # 3. All prerequisites completed
        # 4. Assessment passed

        # Requirement 1: Mastery threshold
        mastery = await self._get_current_mastery(user_id, topic)

        if mastery < 0.90:
            return CertificationEligibility(
                eligible=False,
                reason="mastery_below_threshold",
                mastery=mastery,
                requirement="90%"
            )

        # Requirement 2: Consistency
        recent_scores = await self._get_recent_assessment_scores(
            user_id, topic, limit=5
        )

        if recent_scores:
            # Check for declining trend
            if recent_scores[-1] < recent_scores[0] * 0.9:  # 10% decline
                return CertificationEligibility(
                    eligible=False,
                    reason="declining_performance",
                    mastery=mastery
                )

        # Requirement 3: Prerequisites
        prerequisites = await self._get_topic_prerequisites(topic)

        for prerequisite in prerequisites:
            prerequisite_mastery = await self._get_current_mastery(user_id, prerequisite)

            if prerequisite_mastery < 0.80:
                return CertificationEligibility(
                    eligible=False,
                    reason="prerequisite_not_met",
                    missing_prerequisite=prerequisite,
                    mastery_in_prerequisite=prerequisite_mastery
                )

        # Requirement 4: Assessment passed
        final_assessment = await self._get_final_assessment_result(user_id, topic)

        if final_assessment.scaled_score < 0.80:
            return CertificationEligibility(
                eligible=False,
                reason="final_assessment_not_passed",
                final_score=final_assessment.scaled_score
            )

        # All requirements met
        return CertificationEligibility(
            eligible=True,
            mastery=mastery,
            completed_at=datetime.now()
        )

    async def generate_certificate(
        self,
        user_id: str,
        course_id: str,
        topic: str
    ) -> Certificate:
        """Generate certificate upon mastery."""

        # Verify eligibility
        eligibility = await self.check_certification_eligibility(
            user_id, course_id, topic
        )

        if not eligibility.eligible:
            raise NotEligibleError(f"Not eligible: {eligibility.reason}")

        # Create certificate
        certificate = Certificate(
            certificate_id=str(uuid4()),
            user_id=user_id,
            course_id=course_id,
            topic=topic,
            issued_at=datetime.now(),
            expires_at=datetime.now() + timedelta(days=365 * 2),  # 2-year validity
            mastery_level="MASTER",
            final_score=eligibility.final_assessment_score
        )

        # Render certificate as PDF
        pdf_content = await self._render_certificate_pdf(certificate)

        # Save certificate
        await self.db.certificates.insert({
            **certificate.dict(),
            "pdf_content": pdf_content
        })

        # Notify student and instructor
        await self._send_certificate_notification(certificate)

        return certificate

    async def _render_certificate_pdf(self, certificate: Certificate) -> bytes:
        """Render certificate as PDF."""

        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import letter
        import io

        # Create in-memory PDF
        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)

        # Certificate design
        c.setFont("Helvetica-Bold", 36)
        c.drawString(150, 750, "Certificate of Mastery")

        c.setFont("Helvetica", 14)
        c.drawString(100, 700, f"This certifies that")

        c.setFont("Helvetica-Bold", 18)
        student = await self.db.users.find_one({"id": certificate.user_id})
        c.drawString(150, 650, student["name"])

        c.setFont("Helvetica", 14)
        c.drawString(100, 600, f"has successfully demonstrated mastery of")

        c.setFont("Helvetica-Bold", 18)
        c.drawString(150, 550, certificate.topic)

        c.setFont("Helvetica", 12)
        c.drawString(100, 480, f"Date: {certificate.issued_at.strftime('%B %d, %Y')}")
        c.drawString(100, 450, f"Mastery Score: {certificate.final_score:.1f}%")

        # Signature line
        c.drawString(150, 300, "_" * 30)
        c.drawString(150, 280, "Lumina AI Certification Authority")

        c.save()
        buffer.seek(0)

        return buffer.getvalue()

    async def _send_certificate_notification(self, certificate: Certificate):
        """Send notification of certificate issuance."""

        student = await self.db.users.find_one({"id": certificate.user_id})

        email_subject = f"Congratulations! You've Earned Your {certificate.topic} Certificate"

        email_body = f"""
Dear {student['name']},

Congratulations! You have successfully demonstrated mastery of {certificate.topic}
and have earned a Certificate of Mastery.

Your certificate has been issued and is valid until {certificate.expires_at.strftime('%B %d, %Y')}.

You can view and share your certificate in your Lumina dashboard.

Keep learning!
Lumina Learning Team
"""

        await self.email_service.send(
            to=student["email"],
            subject=email_subject,
            body=email_body
        )
```

---

## Question Bank Management

### Storing and Reusing Generated Questions

```python
class QuestionBank:
    """Stores generated questions for reuse and analysis."""

    async def save_question(
        self,
        question: AssessmentItem,
        metadata: Dict
    ):
        """
        Save question to bank after validation.

        Includes:
        - Question content
        - Difficulty/IRT parameters
        - Usage statistics
        - Quality metrics
        """

        question_record = {
            "question_id": question.question_id,
            "learning_objective_id": question.learning_objective_id,
            "question_text": question.question_text,
            "question_type": question.question_type,
            "difficulty_level": question.difficulty_level,
            "grading_rubric": question.grading_rubric,

            # IRT parameters (updated over time)
            "irt_difficulty": question.difficulty_parameter or 0,
            "irt_discrimination": question.discrimination_parameter or 1.0,
            "irt_guessing": question.guessing_parameter or 0.25,

            # Usage
            "times_used": 0,
            "last_used": None,
            "usage_by_level": {},

            # Quality metrics
            "avg_difficulty_rating": None,
            "avg_clarity_rating": None,
            "avg_fairness_rating": None,

            # Generated metadata
            "generated_at": datetime.now(),
            "generation_model": metadata.get("model"),
            "generation_temperature": metadata.get("temperature"),

            # Validity checks
            "is_valid": True,
            "validation_notes": []
        }

        await self.db.questions.insert(question_record)

    async def retrieve_question(
        self,
        learning_objective_id: str,
        student_level: int,
        previously_seen: List[str]
    ) -> Optional[AssessmentItem]:
        """
        Retrieve question from bank matching criteria.

        Prefers:
        1. Questions not previously seen by student
        2. Well-validated questions
        3. Questions at appropriate level
        """

        # Query for matching questions
        questions = await self.db.questions.find({
            "learning_objective_id": learning_objective_id,
            "difficulty_level": student_level,
            "question_id": {"$nin": previously_seen},
            "is_valid": True
        }).sort("times_used", 1).limit(10)  # Less-used first

        if not questions:
            # Fall back to less-precise match
            questions = await self.db.questions.find({
                "learning_objective_id": learning_objective_id,
                "question_id": {"$nin": previously_seen},
                "is_valid": True
            }).limit(10)

        if questions:
            # Return random from candidates (avoid predictability)
            selected = random.choice(questions)

            # Update usage stats
            await self.db.questions.update(
                {"question_id": selected["question_id"]},
                {
                    "times_used": selected["times_used"] + 1,
                    "last_used": datetime.now()
                }
            )

            return AssessmentItem(**selected)

        return None

    async def update_irt_parameters(
        self,
        question_id: str,
        response_correct: bool,
        student_ability: float
    ):
        """
        Update IRT parameters based on student response.

        Uses maximum likelihood estimation to refine difficulty/discrimination.
        """

        question = await self.db.questions.find_one(
            {"question_id": question_id}
        )

        # Current parameters
        current_difficulty = question["irt_difficulty"]
        current_discrimination = question["irt_discrimination"]

        # Update using Bayesian item response theory
        # New estimate = weighted combination of prior + observation

        # If correct response from low-ability student, difficulty lower
        # If incorrect response from high-ability student, difficulty higher

        likelihood_of_correct = 1 / (1 + math.exp(
            -current_discrimination * (student_ability - current_difficulty)
        ))

        # Adjust difficulty based on discrepancy
        adjustment = 0.01 * (likelihood_of_correct - int(response_correct))
        new_difficulty = current_difficulty + adjustment

        # Adjust discrimination (how well does it separate students)
        # High discrimination = big difference in P(correct) between able and less-able students
        new_discrimination = current_discrimination  # TODO: implement refinement

        # Save updated parameters
        await self.db.questions.update(
            {"question_id": question_id},
            {
                "irt_difficulty": new_difficulty,
                "irt_discrimination": new_discrimination,
                "last_calibrated": datetime.now()
            }
        )
```

---

## Evaluation Metrics

### Assessment Quality and Validity Metrics

```python
class AssessmentMetrics:
    """Computes assessment quality metrics."""

    async def compute_assessment_reliability(
        self,
        assessment_id: str,
        sample_size: int = 100
    ) -> ReliabilityReport:
        """
        Compute Cronbach's alpha (internal consistency).

        Alpha = 0.7-0.8: Acceptable
        Alpha = 0.8-0.9: Good
        Alpha > 0.9: Excellent
        """

        # Get recent assessment results
        results = await self.db.assessment_results.find({
            "assessment_id": assessment_id
        }).sort("submitted_at", -1).limit(sample_size)

        if len(results) < 30:
            return ReliabilityReport(
                status="insufficient_data",
                message="Need at least 30 responses for reliability analysis"
            )

        # Extract question-by-question scores
        scores_by_question = {}

        for result in results:
            for response in result.responses:
                q_id = response.question_id

                if q_id not in scores_by_question:
                    scores_by_question[q_id] = []

                scores_by_question[q_id].append(
                    1 if response.is_correct else 0
                )

        # Compute Cronbach's alpha
        # alpha = (k / (k-1)) * (1 - (sum of item variances / total variance))

        k = len(scores_by_question)  # Number of questions
        item_variances = [
            np.var(scores) for scores in scores_by_question.values()
        ]
        total_variance = np.var([
            sum([scores_by_question[q_id][i] for q_id in scores_by_question])
            for i in range(len(results))
        ])

        sum_item_variances = sum(item_variances)

        if total_variance == 0:
            cronbachs_alpha = 0.0
        else:
            cronbachs_alpha = (k / (k - 1)) * (1 - (sum_item_variances / total_variance))

        # Interpret
        if cronbachs_alpha < 0.5:
            reliability_level = "POOR"
        elif cronbachs_alpha < 0.7:
            reliability_level = "QUESTIONABLE"
        elif cronbachs_alpha < 0.8:
            reliability_level = "ACCEPTABLE"
        elif cronbachs_alpha < 0.9:
            reliability_level = "GOOD"
        else:
            reliability_level = "EXCELLENT"

        return ReliabilityReport(
            assessment_id=assessment_id,
            cronbachs_alpha=cronbachs_alpha,
            reliability_level=reliability_level,
            items_analyzed=k,
            responses_analyzed=len(results),
            recommendation=self._get_reliability_recommendation(cronbachs_alpha)
        )

    async def compute_item_difficulty(
        self,
        question_id: str,
        sample_size: int = 100
    ) -> ItemDifficultyMetric:
        """
        Compute item difficulty (proportion correct).

        Optimal difficulty: 0.5 (50% of students get it right)
        - Too easy: >0.8 (not discriminating)
        - Too hard: <0.2 (discouraging)
        """

        # Get recent responses to this question
        responses = await self.db.assessment_responses.find({
            "question_id": question_id
        }).sort("submitted_at", -1).limit(sample_size)

        if len(responses) < 20:
            return ItemDifficultyMetric(
                status="insufficient_data"
            )

        correct_count = sum(1 for r in responses if r.is_correct)
        p_correct = correct_count / len(responses)

        # Difficulty index interpretation
        if p_correct > 0.9:
            difficulty_level = "TOO_EASY"
            recommendation = "Consider increasing difficulty"
        elif p_correct > 0.8:
            difficulty_level = "EASY"
            recommendation = "Slightly increase difficulty"
        elif p_correct > 0.2:
            difficulty_level = "OPTIMAL"
            recommendation = "Keep as is"
        elif p_correct > 0.1:
            difficulty_level = "HARD"
            recommendation = "Slightly decrease difficulty or improve wording"
        else:
            difficulty_level = "TOO_HARD"
            recommendation = "Substantially decrease difficulty or check for errors"

        return ItemDifficultyMetric(
            question_id=question_id,
            p_correct=p_correct,
            difficulty_level=difficulty_level,
            responses_analyzed=len(responses),
            recommendation=recommendation
        )

    async def compute_item_discrimination(
        self,
        question_id: str,
        assessment_id: str
    ) -> ItemDiscriminationMetric:
        """
        Compute item discrimination (point-biserial correlation).

        Measures: Do students with high overall scores get this question right?
        r = 0.4+: Good discrimination
        r = 0.3-0.4: Acceptable
        r = 0.2-0.3: Weak
        r < 0.2: Poor (maybe flawed question)
        """

        # Get all responses for this assessment
        results = await self.db.assessment_results.find({
            "assessment_id": assessment_id
        })

        # For each result, extract:
        # - Overall score on assessment
        # - Response to this question

        overall_scores = []
        question_responses = []

        for result in results:
            overall_scores.append(result.scaled_score)

            question_response = next(
                (r for r in result.responses if r.question_id == question_id),
                None
            )

            if question_response:
                question_responses.append(1 if question_response.is_correct else 0)
            else:
                question_responses.append(None)

        # Remove None values
        pairs = [
            (score, response)
            for score, response in zip(overall_scores, question_responses)
            if response is not None
        ]

        if len(pairs) < 20:
            return ItemDiscriminationMetric(
                status="insufficient_data"
            )

        # Compute point-biserial correlation
        from scipy.stats import pointbiserialr

        scores = [p[0] for p in pairs]
        responses = [p[1] for p in pairs]

        r, p_value = pointbiserialr(responses, scores)

        # Interpret
        if r < 0.2:
            discrimination_level = "POOR"
        elif r < 0.3:
            discrimination_level = "WEAK"
        elif r < 0.4:
            discrimination_level = "ACCEPTABLE"
        else:
            discrimination_level = "GOOD"

        return ItemDiscriminationMetric(
            question_id=question_id,
            point_biserial_r=r,
            p_value=p_value,
            discrimination_level=discrimination_level,
            responses_analyzed=len(pairs),
            recommendation=self._get_discrimination_recommendation(r)
        )
```

---

## Conclusion

The Assessment Engine provides sophisticated, fair, and scalable assessment of student learning. Through dynamic question generation, adaptive difficulty, LLM grading, and comprehensive quality metrics, it enables:

✅ Every student gets different questions tailored to their level
✅ Assessment measures true understanding, not memorization
✅ Instant feedback guides learning
✅ Cheating detection protects assessment integrity
✅ Mastery certification recognizes achievement
✅ Data-driven improvements refine assessment quality

**The Result:** Fair, valid, reliable assessment that supports rather than hinders learning.
