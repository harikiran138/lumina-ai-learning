# Student Behavior Engine Documentation

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [The Problem: Invisible Student Struggles](#the-problem-invisible-student-struggles)
3. [Behavioral Signals Collection](#behavioral-signals-collection)
4. [Bayesian Knowledge Tracing (BKT)](#bayesian-knowledge-tracing-bkt)
5. [Deep Knowledge Tracing (DKT)](#deep-knowledge-tracing-dkt)
6. [Behavior Classification](#behavior-classification)
7. [Cognitive Load Estimation](#cognitive-load-estimation)
8. [Knowledge Gap Detection](#knowledge-gap-detection)
9. [State Management Architecture](#state-management-architecture)
10. [Engagement Scoring](#engagement-scoring)
11. [Predictive Interventions](#predictive-interventions)
12. [Student Patience Profiling](#student-patience-profiling)
13. [Study Behavior Patterns](#study-behavior-patterns)
14. [Learner Profile Database](#learner-profile-database)
15. [Privacy and FERPA Compliance](#privacy-and-ferpa-compliance)
16. [Implementation Examples](#implementation-examples)

---

## Executive Summary

**Problem Statement:** In a traditional classroom with 100 students, a teacher cannot individually monitor each student's understanding, confusion, frustration, or learning progress. Students who struggle silently fall through the cracks.

**Lumina's Solution:** The Student Behavior Engine passively collects **50+ behavioral signals** from every interaction—page dwell time, scroll patterns, quiz hesitation, error patterns, response speed, session duration, and more. Using machine learning models (Bayesian Knowledge Tracing and Deep Knowledge Tracing), it builds a real-time profile of each student's:

- **Knowledge State** - What they know, what they're unsure about
- **Emotional State** - Engaged, confused, frustrated, or bored
- **Cognitive Load** - Mental effort and working memory strain
- **Learning Patterns** - Whether they're a night owl, sprint learner, systematic problem-solver
- **Risk Factors** - Early warning signs of disengagement or failure

This transforms education from **reactive** (waiting for a failing test) to **proactive** (intervening when student shows signs of struggle).

---

## The Problem: Invisible Student Struggles

### Traditional Education Blindspot

```
Classroom with 100 Students
├── Teacher's Direct Observation
│   ├── Can see 5-10 students in real-time
│   ├── Can't monitor background struggles
│   └── Reaction comes after problems arise
│
├── Assessment Data (Exams/Quizzes)
│   ├── Data is infrequent (every 2 weeks)
│   ├── Too late for intervention
│   └── Binary: pass/fail, no insight into why
│
└── INVISIBLE STUDENT EXPERIENCES (80-90 students)
    ├── Student A: Silent confusion building for 3 weeks
    │   → Test day: Catastrophic failure
    │
    ├── Student B: Overconfidence, reading too fast
    │   → Misconceptions compound over time
    │
    ├── Student C: Struggling with one concept
    │   → Can't move forward, falling behind
    │
    ├── Student D: Learning style mismatch
    │   → Frustrated, disengaged
    │
    └── Student E: Working too hard, burned out
        → Diminishing returns, exhaustion

OUTCOME: Teachers are reactive. Problems discovered too late.
```

### Lumina's Behavioral Visibility

```
AI Behavior Engine Monitoring 100 Students Simultaneously

Behavioral Signals (50+)
├── Time-based
│   ├── Time on page (per section)
│   ├── Session duration
│   ├── Time between interactions
│   ├── Peak learning hours
│   └── Study frequency (daily, weekly pattern)
│
├── Interaction-based
│   ├── Number of practice attempts
│   ├── Response speed
│   ├── Retry behavior (gives up vs. persists)
│   ├── Question types attempted
│   └── Help requests (frequency, timing)
│
├── Performance-based
│   ├── Quiz accuracy
│   ├── Error pattern (careless vs. conceptual)
│   ├── Mastery progression
│   ├── Improvement rate
│   └── Performance consistency
│
├── Engagement-based
│   ├── Scroll behavior (skimming vs. careful reading)
│   ├── Note-taking frequency
│   ├── Bookmark usage
│   ├── Video watching rate (normal, skip, rewatch)
│   └── Content interaction depth
│
└── Emotional/Cognitive-based
    ├── Hesitation patterns
    ├── Error recovery speed
    ├── Question elaboration
    ├── Help-seeking behavior
    └── Session termination patterns

MACHINE LEARNING MODELS
├── BKT: Tracks knowledge state (P(Know), P(Learn), P(Slip), P(Guess))
├── DKT: LSTM predicts future performance
└── Behavior Classifiers: Labels current state (focused, confused, bored, etc.)

REAL-TIME INSIGHTS
├── Student A: "Confusion detected in Topic X, needs intervention NOW"
├── Student B: "Overconfidence. Ask clarifying questions."
├── Student C: "This student hits cognitive overload. Slow down."
├── Student D: "Learning style = visual. Provide diagrams."
└── Student E: "Burnout risk. Recommend break, adjust pace."

OUTCOME: Interventions are proactive. Problems caught early.
```

---

## Behavioral Signals Collection

### 50+ Behavioral Signals

The Behavior Engine collects rich signals from every interaction:

```python
class BehavioralSignal(BaseModel):
    """A single behavioral signal from a student interaction."""

    signal_id: str
    user_id: str
    course_id: str
    timestamp: datetime
    signal_type: str  # Category of signal
    signal_name: str  # Specific signal name
    value: float     # Numeric value
    metadata: Dict   # Contextual information

    # Example signals:
    # signal_name: "time_on_page", value: 245 (seconds), metadata: {"page": "quadratic_equations"}
    # signal_name: "quiz_response_time", value: 3.2 (seconds), metadata: {"question_id": "q123"}
    # signal_name: "error_type", value: 1 (conceptual), metadata: {"topic": "algebra"}

class BehavioralSignalCollector:
    """Collects behavioral signals during student interactions."""

    # TIME-BASED SIGNALS
    async def on_page_view(self, user_id: str, page_id: str, topic: str):
        """Record when student views a page."""
        await self.record_signal(
            user_id=user_id,
            signal_name="page_view",
            value=1,
            metadata={"page_id": page_id, "topic": topic}
        )

    async def on_page_exit(self, user_id: str, page_id: str, duration_seconds: int):
        """Record page dwell time."""
        # Benchmarks:
        # - Too fast (< 30s): Skimming, not reading
        # - Normal (30s-600s): Careful reading
        # - Too slow (> 600s): Stuck, re-reading, lost
        await self.record_signal(
            user_id=user_id,
            signal_name="time_on_page",
            value=duration_seconds,
            metadata={"page_id": page_id, "assessment": self._assess_pace(duration_seconds)}
        )

    async def on_scroll(self, user_id: str, page_id: str, scroll_position: float, direction: str):
        """Record scroll patterns."""
        # Patterns:
        # - Steady scroll: Methodical reading
        # - Rapid scroll: Skimming
        # - Multiple scrolls up: Re-reading, trying to understand
        # - No scroll (static): Stuck on one part
        await self.record_signal(
            user_id=user_id,
            signal_name="scroll_pattern",
            value=scroll_position,
            metadata={"direction": direction, "page_id": page_id}
        )

    async def on_video_play(self, user_id: str, video_id: str):
        """Record when student starts video."""
        await self.record_signal(
            user_id=user_id,
            signal_name="video_play",
            value=1,
            metadata={"video_id": video_id}
        )

    async def on_video_seek(self, user_id: str, video_id: str, time_position: int, direction: str):
        """Record video seeking behavior."""
        # Patterns:
        # - Seeking forward: Impatient, wants to skip parts
        # - Seeking backward: Didn't understand, rewinding
        # - Multiple rewinds: Struggling with content
        await self.record_signal(
            user_id=user_id,
            signal_name="video_seek",
            value=time_position,
            metadata={"direction": direction, "video_id": video_id}
        )

    # INTERACTION-BASED SIGNALS
    async def on_quiz_attempt(
        self,
        user_id: str,
        question_id: str,
        response_time_seconds: float,
        is_correct: bool,
        attempt_number: int
    ):
        """Record quiz response."""
        # Response time indicators:
        # - Very fast (< 2s): Guessing or very confident
        # - Moderate (2-15s): Thinking through
        # - Slow (15-60s): Struggling with concept
        # - Very slow (> 60s): Very confused or gave up partway
        await self.record_signal(
            user_id=user_id,
            signal_name="quiz_response_time",
            value=response_time_seconds,
            metadata={
                "question_id": question_id,
                "is_correct": is_correct,
                "attempt": attempt_number,
                "time_category": self._categorize_response_time(response_time_seconds)
            }
        )

    async def on_quiz_hint_request(self, user_id: str, question_id: str, after_attempts: int):
        """Record when student requests help."""
        # Patterns:
        # - Immediate help: Low confidence, needs scaffolding
        # - After many attempts: Persistence, determination
        # - No help requested: Independent (or doesn't know help available)
        await self.record_signal(
            user_id=user_id,
            signal_name="help_request",
            value=after_attempts,
            metadata={"question_id": question_id}
        )

    async def on_quiz_guess(self, user_id: str, question_id: str, previous_attempts: int):
        """Record random guessing behavior."""
        # Multiple guesses in row indicates:
        # - Lack of understanding
        # - Frustration/giving up
        # - Low confidence
        await self.record_signal(
            user_id=user_id,
            signal_name="random_guess",
            value=1,
            metadata={"question_id": question_id, "after_attempts": previous_attempts}
        )

    # PERFORMANCE-BASED SIGNALS
    async def on_quiz_complete(self, user_id: str, quiz_id: str, accuracy: float, improvement: float):
        """Record quiz results."""
        await self.record_signal(
            user_id=user_id,
            signal_name="quiz_accuracy",
            value=accuracy,
            metadata={"quiz_id": quiz_id, "improvement_from_previous": improvement}
        )

    async def record_error_pattern(
        self,
        user_id: str,
        question_id: str,
        error_type: str,  # "conceptual", "procedural", "careless"
        topic: str
    ):
        """Classify and record the type of error."""
        # Error types:
        # - Conceptual: Fundamental misunderstanding
        # - Procedural: Wrong steps or formula
        # - Careless: Arithmetic mistake, typo
        # - Systematic: Same error repeatedly
        await self.record_signal(
            user_id=user_id,
            signal_name=f"error_type_{error_type}",
            value=1,
            metadata={"question_id": question_id, "topic": topic}
        )

    # ENGAGEMENT-BASED SIGNALS
    async def on_note_taken(self, user_id: str, content_snippet: str):
        """Record when student takes notes."""
        # High note-taking = Active learning
        # No notes = Passive learning
        await self.record_signal(
            user_id=user_id,
            signal_name="note_taken",
            value=len(content_snippet.split()),  # Word count
            metadata={"snippet_preview": content_snippet[:100]}
        )

    async def on_bookmark_added(self, user_id: str, page_id: str, page_title: str):
        """Record when student bookmarks content."""
        # Bookmarking indicates:
        # - Important content they want to return to
        # - Difficulty they may revisit
        # - Active engagement with material
        await self.record_signal(
            user_id=user_id,
            signal_name="bookmark_added",
            value=1,
            metadata={"page_id": page_id, "page_title": page_title}
        )

    async def on_annotation_added(self, user_id: str, annotation_text: str):
        """Record annotations to course material."""
        # Annotations show:
        # - Questions student has
        # - Points they want to emphasize
        # - Active engagement
        await self.record_signal(
            user_id=user_id,
            signal_name="annotation_count",
            value=1,
            metadata={"text_preview": annotation_text[:100]}
        )

    # EMOTIONAL/COGNITIVE SIGNALS
    async def on_rapid_topic_switch(self, user_id: str, from_topic: str, to_topic: str, duration_seconds: int):
        """Record when student rapidly abandons topic."""
        # Rapid switching indicates:
        # - Frustration with current topic
        # - Avoidance behavior
        # - Inability to focus
        if duration_seconds < 30:
            await self.record_signal(
                user_id=user_id,
                signal_name="rapid_abandon",
                value=1,
                metadata={"from_topic": from_topic, "to_topic": to_topic, "duration": duration_seconds}
            )

    async def on_session_end(self, user_id: str, session_id: str, duration_seconds: int, reason: str):
        """Record session termination patterns."""
        # Reasons: "completed_exercise", "went_to_break", "didn't_save", "browser_closed", "error"
        # Abrupt endings suggest frustration
        await self.record_signal(
            user_id=user_id,
            signal_name="session_end",
            value=duration_seconds,
            metadata={"reason": reason, "was_abrupt": reason != "completed_exercise"}
        )

    async def on_question_elaboration(self, user_id: str, question_text: str):
        """Record when student adds detail/follow-up questions."""
        # Elaboration indicates:
        # - Deep thinking
        # - Confusion requiring clarification
        # - Metacognitive awareness
        await self.record_signal(
            user_id=user_id,
            signal_name="question_elaboration",
            value=len(question_text.split()),
            metadata={"question_type": self._classify_question(question_text)}
        )

    # HELPER METHODS
    def _assess_pace(self, duration_seconds: int) -> str:
        """Assess reading pace."""
        if duration_seconds < 30:
            return "skimming"
        elif duration_seconds < 600:
            return "normal"
        else:
            return "stuck_or_rereading"

    def _categorize_response_time(self, seconds: float) -> str:
        """Categorize response time."""
        if seconds < 2:
            return "instant"
        elif seconds < 15:
            return "quick"
        elif seconds < 60:
            return "thoughtful"
        else:
            return "struggling"

    def _classify_question(self, question_text: str) -> str:
        """Classify question type."""
        if "why" in question_text.lower():
            return "why_question"
        elif "how" in question_text.lower():
            return "how_question"
        elif "?" in question_text:
            return "clarification"
        else:
            return "statement"
```

### Signal Storage and Processing

```python
class SignalStore:
    """Stores behavioral signals in TimescaleDB for time-series analysis."""

    async def store_signal(self, signal: BehavioralSignal):
        """Store signal with timestamp."""

        # TimescaleDB table (auto-partitioned by time)
        await self.db.execute("""
            INSERT INTO behavioral_signals
            (user_id, course_id, signal_type, signal_name, value, metadata, timestamp)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        """, signal.user_id, signal.course_id, signal.signal_type, signal.signal_name,
            signal.value, json.dumps(signal.metadata), signal.timestamp)

    async def get_signals(
        self,
        user_id: str,
        signal_names: Optional[List[str]] = None,
        time_range: Tuple[datetime, datetime] = None,
        limit: int = 1000
    ) -> List[BehavioralSignal]:
        """Retrieve signals for analysis."""

        query = "SELECT * FROM behavioral_signals WHERE user_id = $1"
        params = [user_id]

        if signal_names:
            placeholders = ", ".join([f"${i+2}" for i in range(len(signal_names))])
            query += f" AND signal_name IN ({placeholders})"
            params.extend(signal_names)

        if time_range:
            query += f" AND timestamp BETWEEN ${len(params)+1} AND ${len(params)+2}"
            params.extend(time_range)

        query += " ORDER BY timestamp DESC LIMIT $" + str(len(params) + 1)
        params.append(limit)

        rows = await self.db.fetch(query, *params)
        return [BehavioralSignal(**row) for row in rows]

    async def get_signal_summary(
        self,
        user_id: str,
        time_window_hours: int = 24
    ) -> Dict[str, float]:
        """Get aggregated signal statistics."""

        return await self.db.fetchval("""
            SELECT json_object_agg(
                signal_name,
                json_build_object(
                    'count', COUNT(*),
                    'avg_value', AVG(value),
                    'max_value', MAX(value),
                    'min_value', MIN(value)
                )
            ) as summary
            FROM behavioral_signals
            WHERE user_id = $1
            AND timestamp > NOW() - INTERVAL '1 hour' * $2
            GROUP BY signal_name
        """, user_id, time_window_hours)
```

---

## Bayesian Knowledge Tracing (BKT)

### What is BKT?

Bayesian Knowledge Tracing is a probabilistic model that estimates whether a student has "learned" a concept. It tracks four parameters:

| Parameter | Meaning | Typical Value |
|-----------|---------|---------------|
| **P(L)** | Probability of Learning | 0.1-0.3 (per attempt) |
| **P(S)** | Probability of Slip (forgetting) | 0.05-0.1 |
| **P(G)** | Probability of Guess | 0.1-0.2 (random correct) |
| **P(K)** | Probability of Knowledge | 0.0-1.0 (updated continuously) |

### The BKT Model

```
Student has not learned (K=0)
        │
        ├─ Student guesses correctly (P(G))
        └─ Student doesn't guess (1-P(G))
                │
                └─ Student learns (P(L))
                     │
                     └─ Student now knows (K=1)
                            │
                            ├─ Student answers correctly (P(K))
                            └─ Student slips/forgets (P(S))
```

### BKT Mathematics

```python
class BKTModel:
    """Bayesian Knowledge Tracing model."""

    def __init__(
        self,
        p_learning: float = 0.1,      # P(L): Learn per attempt
        p_slip: float = 0.05,         # P(S): Forget
        p_guess: float = 0.1,         # P(G): Guess correctly
        p_initial_knowledge: float = 0.0  # P(K0): Prior knowledge
    ):
        self.p_l = p_learning
        self.p_s = p_slip
        self.p_g = p_guess
        self.p_k = p_initial_knowledge

    async def update(
        self,
        is_correct: bool
    ) -> float:
        """
        Update knowledge probability after student response.

        Bayes' Rule:
        P(K|evidence) = P(evidence|K) × P(K) / P(evidence)

        Where:
        - P(evidence|K=1) = 1 - P(S)  (if knows, correct unless slip)
        - P(evidence|K=0) = P(G)      (if doesn't know, correct only by guessing)
        """

        if is_correct:
            # Student answered correctly
            # Could be because they know, or they guessed

            # P(evidence | K=1)
            p_correct_given_know = 1 - self.p_s

            # P(evidence | K=0)
            p_correct_given_not_know = self.p_g

        else:
            # Student answered incorrectly
            # Could be because they don't know, or they slipped

            # P(evidence | K=1)
            p_correct_given_know = self.p_s  # They knew but slipped

            # P(evidence | K=0)
            p_correct_given_not_know = 1 - self.p_g

        # Update belief: P(K=1 | evidence)
        numerator = p_correct_given_know * self.p_k
        denominator = (p_correct_given_know * self.p_k) + \
                      (p_correct_given_not_know * (1 - self.p_k))

        self.p_k = numerator / denominator

        # Model learning: Increase knowledge probability
        # Only if student hasn't yet learned
        self.p_k = self.p_k + (1 - self.p_k) * self.p_l

        return self.p_k

    async def predict_next_performance(self) -> float:
        """Predict probability of correct answer on next attempt."""
        # If knows: probably correct (1 - P(S))
        # If doesn't know: maybe correct by guessing (P(G))
        return self.p_k * (1 - self.p_s) + (1 - self.p_k) * self.p_g

class BKTTracker:
    """Tracks BKT state for each student-concept pair."""

    def __init__(self, db):
        self.db = db
        self.models: Dict[Tuple[str, str], BKTModel] = {}  # (user_id, concept_id) -> model

    async def record_response(
        self,
        user_id: str,
        concept_id: str,
        is_correct: bool
    ) -> BKTUpdate:
        """Record student response and update BKT model."""

        key = (user_id, concept_id)

        # Load or initialize model
        if key not in self.models:
            saved_state = await self.db.fetch_one(
                "SELECT p_k, p_l, p_s, p_g FROM bkt_states WHERE user_id = $1 AND concept_id = $2",
                user_id, concept_id
            )

            if saved_state:
                model = BKTModel(
                    p_learning=saved_state['p_l'],
                    p_slip=saved_state['p_s'],
                    p_guess=saved_state['p_g'],
                    p_initial_knowledge=saved_state['p_k']
                )
            else:
                model = BKTModel()

            self.models[key] = model

        model = self.models[key]
        p_k_before = model.p_k

        # Update model
        p_k_after = await model.update(is_correct)
        p_next = await model.predict_next_performance()

        # Determine mastery
        mastery_threshold = 0.95
        is_mastered = p_k_after >= mastery_threshold

        # Save to database
        await self.db.execute("""
            INSERT INTO bkt_states (user_id, concept_id, p_k, p_l, p_s, p_g, mastery, last_updated)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            ON CONFLICT (user_id, concept_id) DO UPDATE SET
                p_k = $3, mastery = $7, last_updated = NOW()
        """, user_id, concept_id, p_k_after, model.p_l, model.p_s, model.p_g, is_mastered)

        return BKTUpdate(
            concept_id=concept_id,
            p_k_before=p_k_before,
            p_k_after=p_k_after,
            p_next_correct=p_next,
            is_mastered=is_mastered,
            mastery_threshold=mastery_threshold
        )
```

### BKT Example: Quadratic Equations

```
Student learning "Quadratic Equations"

Prior: P(K) = 0.0 (hasn't learned yet)
Parameters: P(L)=0.15, P(S)=0.05, P(G)=0.1

─────────────────────────────────────────────────────
Q1: "Solve x² + 5x + 6 = 0"
    Student: Incorrect (guessed)

    Update: P(K) = 0.0 (doesn't help - wrong anyway)
    Prior after learning: P(K) = 0.15
    Next answer P(correct) = 0.15 × 0.95 + 0.85 × 0.1 = 0.23

─────────────────────────────────────────────────────
Q2: "Solve x² - 7x + 12 = 0"
    Student: Correct (maybe knows, maybe lucky)

    Bayes: P(K|correct) = (0.95 × 0.15) / (0.95 × 0.15 + 0.1 × 0.85)
                        = 0.143 / 0.228 = 0.63

    After learning: P(K) = 0.63 + (1-0.63) × 0.15 = 0.70
    Next answer P(correct) = 0.70 × 0.95 + 0.30 × 0.1 = 0.68

─────────────────────────────────────────────────────
Q3: "Solve x² + 2x - 8 = 0"
    Student: Correct (more confident now)

    Bayes: P(K|correct) = (0.95 × 0.70) / (0.95 × 0.70 + 0.1 × 0.30)
                        = 0.665 / 0.695 = 0.96

    After learning: P(K) = 0.96 (MASTERY!)
    Next answer P(correct) = 0.96 × 0.95 + 0.04 × 0.1 = 0.92

─────────────────────────────────────────────────────
Student "Knows" quadratic equations (P(K) = 0.96)
AI Tutor: Move to harder topics or provide practice.
```

---

## Deep Knowledge Tracing (DKT)

### What is DKT?

DKT uses LSTM (Long Short-Term Memory) neural networks to model knowledge over time. Unlike BKT which treats each concept independently, DKT learns dependencies between concepts.

### DKT Architecture

```
Input Sequence of Interactions
(one-hot encoded question ID + correctness)
    │
    ▼
┌─────────────────────────────┐
│  Embedding Layer            │
│  (Question -> vector)       │
└────────────┬────────────────┘
             │
             ▼
    ┌──────────────────┐
    │  LSTM Layer 1    │  (64 units, hidden state tracks knowledge)
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │  LSTM Layer 2    │  (32 units, refines predictions)
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Output Layer     │  (Sigmoid: P(correct) for next question)
    └────────┬─────────┘
             │
             ▼
    Prediction: P(next question correct)
```

### DKT Mathematics

```python
class DKTModel:
    """
    Deep Knowledge Tracing using LSTM.

    Paper: "Deep Knowledge Tracing" by Piech et al., 2015
    """

    def __init__(self, num_questions: int, embedding_dim: int = 32):
        self.num_questions = num_questions
        self.embedding_dim = embedding_dim

        # Model layers
        self.embedding = torch.nn.Embedding(num_questions * 2, embedding_dim)
        # *2 because we encode both (question_id, correct) and (question_id, incorrect)

        self.lstm1 = torch.nn.LSTM(
            input_size=embedding_dim,
            hidden_size=64,
            batch_first=True
        )

        self.lstm2 = torch.nn.LSTM(
            input_size=64,
            hidden_size=32,
            batch_first=True
        )

        self.output = torch.nn.Linear(32, num_questions)
        self.sigmoid = torch.nn.Sigmoid()

    def encode_interaction(self, question_id: int, is_correct: bool) -> int:
        """
        Encode (question, correctness) as single integer.

        Examples:
        - Question 0, incorrect: 0
        - Question 0, correct: num_questions
        - Question 5, incorrect: 5
        - Question 5, correct: num_questions + 5
        """
        if is_correct:
            return question_id + self.num_questions
        else:
            return question_id

    async def forward(self, interactions: List[Tuple[int, bool]]) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Forward pass through DKT.

        Args:
            interactions: List of (question_id, is_correct)

        Returns:
            predictions: Probabilities for each question
            hidden_state: Final knowledge state (for analysis)
        """

        # Encode interactions
        encoded = [self.encode_interaction(q_id, correct) for q_id, correct in interactions]
        input_tensor = torch.tensor(encoded, dtype=torch.long).unsqueeze(0)  # [1, seq_len]

        # Embedding
        embedded = self.embedding(input_tensor)  # [1, seq_len, embedding_dim]

        # First LSTM layer
        lstm1_out, (h1, c1) = self.lstm1(embedded)  # [1, seq_len, 64]

        # Second LSTM layer
        lstm2_out, (h2, c2) = self.lstm2(lstm1_out)  # [1, seq_len, 32]

        # Output: Predict probability for each question
        logits = self.output(lstm2_out)  # [1, seq_len, num_questions]
        predictions = self.sigmoid(logits)

        return predictions, h2  # h2 is knowledge state

    async def predict_next(self, interactions: List[Tuple[int, bool]], question_id: int) -> float:
        """Predict probability of correct answer for next question."""

        predictions, _ = await self.forward(interactions)
        next_prob = predictions[0, -1, question_id]  # Last time step, target question

        return float(next_prob.item())

    async def extract_knowledge_state(self, interactions: List[Tuple[int, bool]]) -> torch.Tensor:
        """
        Extract knowledge state from LSTM hidden state.

        The hidden state is a vector (size 32) that encodes
        what the student knows at this point.
        """

        _, hidden_state = await self.forward(interactions)
        return hidden_state  # [1, 32] - knowledge representation

class DKTTracker:
    """Tracks DKT state for each student."""

    def __init__(self, model_path: str = None):
        self.model = DKTModel(num_questions=1000)

        if model_path:
            self.model.load_state_dict(torch.load(model_path))

        self.interaction_history: Dict[str, List[Tuple[int, bool]]] = {}

    async def record_response(
        self,
        user_id: str,
        question_id: int,
        is_correct: bool
    ) -> DKTUpdate:
        """Record response and update knowledge state."""

        if user_id not in self.interaction_history:
            self.interaction_history[user_id] = []

        self.interaction_history[user_id].append((question_id, is_correct))

        # Get predictions
        all_interactions = self.interaction_history[user_id]
        predictions, knowledge_state = await self.model.forward(all_interactions)

        # Get knowledge vector
        knowledge_vector = await self.model.extract_knowledge_state(all_interactions)

        return DKTUpdate(
            user_id=user_id,
            question_id=question_id,
            is_correct=is_correct,
            next_predictions={
                q_id: float(predictions[0, -1, q_id].item())
                for q_id in range(self.model.num_questions)
            },
            knowledge_state=knowledge_vector
        )

    async def predict_mastery(
        self,
        user_id: str,
        topic: str,
        threshold: float = 0.85
    ) -> float:
        """
        Predict percentage of topic that student has mastered.

        Uses DKT to estimate P(correct) for all questions in topic.
        """

        if user_id not in self.interaction_history:
            return 0.0

        interactions = self.interaction_history[user_id]
        predictions, _ = await self.model.forward(interactions)

        # Get questions in this topic
        topic_questions = await self.get_topic_questions(topic)
        topic_probs = [
            float(predictions[0, -1, q_id].item())
            for q_id in topic_questions
        ]

        # Count mastered (above threshold)
        mastered = sum(1 for p in topic_probs if p >= threshold)

        return mastered / len(topic_questions) if topic_questions else 0.0
```

---

## Behavior Classification

### Real-Time Behavior Labels

Based on behavioral signals, the engine classifies the student's current state:

```python
class BehaviorLabel(Enum):
    """Current behavior classification."""

    FOCUSED = "focused"           # Engaged, making progress
    CONFUSED = "confused"         # Stuck, re-reading, seeking help
    BORED = "bored"              # Disengaged, rapid navigation
    FRUSTRATED = "frustrated"     # Errors, rapid switching, abrupt ending
    FATIGUED = "fatigued"        # Slow responses, declining accuracy
    RUSHING = "rushing"           # Very fast responses, errors
    DISTRACTED = "distracted"     # Frequent topic switching
    LEARNING = "learning"         # Struggling but making progress

class BehaviorClassifier:
    """Classifies student behavior from signals."""

    async def classify(
        self,
        user_id: str,
        recent_signals: List[BehavioralSignal],
        bkt_state: Dict,
        time_window_minutes: int = 15
    ) -> Tuple[BehaviorLabel, float]:
        """
        Classify student behavior.

        Returns:
            (Label, Confidence: 0-1)
        """

        scores = {label: 0.0 for label in BehaviorLabel}

        # Extract feature groups
        time_signals = [s for s in recent_signals if s.signal_type == "time"]
        performance_signals = [s for s in recent_signals if s.signal_type == "performance"]
        engagement_signals = [s for s in recent_signals if s.signal_type == "engagement"]
        interaction_signals = [s for s in recent_signals if s.signal_type == "interaction"]

        # Rule-based classification
        # ---

        # FOCUSED: Normal pace, correct answers, good engagement
        if (self._has_normal_pace(time_signals) and
            self._has_good_accuracy(performance_signals) and
            self._has_high_engagement(engagement_signals)):
            scores[BehaviorLabel.FOCUSED] += 3.0

        # CONFUSED: Slow pace, incorrect answers, hesitation
        if (self._has_slow_pace(time_signals) and
            self._has_low_accuracy(performance_signals) and
            self._has_help_requests(interaction_signals)):
            scores[BehaviorLabel.CONFUSED] += 3.0

        # BORED: Fast navigation, low engagement, skipping
        if (self._has_rapid_navigation(time_signals) and
            self._has_low_engagement(engagement_signals) and
            self._has_topic_skipping(interaction_signals)):
            scores[BehaviorLabel.BORED] += 3.0

        # FRUSTRATED: Errors, rapid topic switches, abrupt ending
        if (self._has_high_errors(performance_signals) and
            self._has_topic_switching(interaction_signals) and
            self._has_abrupt_ending(interaction_signals)):
            scores[BehaviorLabel.FRUSTRATED] += 3.0

        # FATIGUED: Declining performance, slower responses over time
        if (self._has_declining_accuracy(performance_signals) and
            self._has_increasing_latency(time_signals)):
            scores[BehaviorLabel.FATIGUED] += 3.0

        # RUSHING: Very fast responses with errors
        if (self._has_very_fast_responses(time_signals) and
            self._has_increasing_errors(performance_signals)):
            scores[BehaviorLabel.RUSHING] += 3.0

        # DISTRACTED: Frequent rapid switching between topics
        if self._has_frequent_topic_switching(interaction_signals):
            scores[BehaviorLabel.DISTRACTED] += 3.0

        # LEARNING: Making progress despite errors
        if (self._has_improvement_trend(performance_signals) and
            self._has_persistence(interaction_signals)):
            scores[BehaviorLabel.LEARNING] += 3.0

        # Normalize and find max
        total = sum(scores.values())
        if total == 0:
            return BehaviorLabel.FOCUSED, 0.5  # Default

        normalized = {k: v / total for k, v in scores.items()}
        dominant_label = max(normalized, key=normalized.get)
        confidence = normalized[dominant_label]

        return dominant_label, confidence

    def _has_normal_pace(self, signals: List[BehavioralSignal]) -> bool:
        """Check if reading pace is normal."""
        time_on_pages = [s.value for s in signals if s.signal_name == "time_on_page"]
        if not time_on_pages:
            return True
        avg_time = sum(time_on_pages) / len(time_on_pages)
        return 30 < avg_time < 600  # 30 seconds to 10 minutes

    def _has_good_accuracy(self, signals: List[BehavioralSignal]) -> bool:
        """Check if quiz accuracy is high."""
        accuracies = [s.value for s in signals if s.signal_name == "quiz_accuracy"]
        if not accuracies:
            return True
        return sum(accuracies) / len(accuracies) > 0.75

    def _has_high_engagement(self, signals: List[BehavioralSignal]) -> bool:
        """Check if engagement is high."""
        engagement_count = sum(1 for s in signals if s.signal_name in [
            "note_taken", "bookmark_added", "annotation_count"
        ])
        return engagement_count >= 2

    def _has_slow_pace(self, signals: List[BehavioralSignal]) -> bool:
        """Check if pace is slow."""
        time_on_pages = [s.value for s in signals if s.signal_name == "time_on_page"]
        if not time_on_pages:
            return False
        avg_time = sum(time_on_pages) / len(time_on_pages)
        return avg_time > 300  # More than 5 minutes average

    def _has_low_accuracy(self, signals: List[BehavioralSignal]) -> bool:
        """Check if quiz accuracy is low."""
        accuracies = [s.value for s in signals if s.signal_name == "quiz_accuracy"]
        if not accuracies:
            return False
        return sum(accuracies) / len(accuracies) < 0.60

    def _has_help_requests(self, signals: List[BehavioralSignal]) -> bool:
        """Check if student is requesting help."""
        return any(s.signal_name == "help_request" for s in signals)

    # Additional helper methods...
```

---

## Cognitive Load Estimation

### Working Memory Constraints

Students have limited working memory (typically 4±2 chunks). Exceeding this causes confusion.

```python
class CognitiveLoadEstimator:
    """Estimates real-time cognitive load."""

    async def estimate_load(
        self,
        user_id: str,
        current_task_complexity: float,  # 0-10
        response_time: float,             # seconds
        accuracy: float,                  # 0-1
        behavioral_signals: Dict
    ) -> Tuple[float, str]:
        """
        Estimate cognitive load on 0-10 scale.

        Factors:
        - Task complexity (explicit)
        - Response time (fast = low load or high confidence, slow = high load or struggling)
        - Accuracy (errors suggest overload)
        - Behavioral patterns
        """

        load_factors = []

        # Factor 1: Task complexity
        load_factors.append({
            "name": "task_complexity",
            "weight": 0.3,
            "value": current_task_complexity / 10.0  # Normalize to 0-1
        })

        # Factor 2: Response time
        # Slow response + wrong = overload
        # Fast response + right = low load
        # Slow response + right = thoughtful (not overload)
        response_load = self._assess_response_time_load(
            response_time=response_time,
            accuracy=accuracy
        )
        load_factors.append({
            "name": "response_time",
            "weight": 0.3,
            "value": response_load
        })

        # Factor 3: Error patterns
        # Careless errors = low overload
        # Conceptual errors = high overload
        error_patterns = behavioral_signals.get("error_types", {})
        conceptual_error_pct = (error_patterns.get("conceptual", 0) /
                                 (sum(error_patterns.values()) or 1))
        load_factors.append({
            "name": "error_type",
            "weight": 0.2,
            "value": conceptual_error_pct  # High conceptual error = overload
        })

        # Factor 4: Recovery speed
        # Can student recover from error quickly? Low load.
        # Takes multiple attempts? High load.
        recovery_speed = await self._assess_recovery_speed(user_id)
        load_factors.append({
            "name": "recovery_speed",
            "weight": 0.2,
            "value": 1 - recovery_speed  # Slow recovery = high load
        })

        # Weighted sum
        total_load = sum(
            factor["value"] * factor["weight"]
            for factor in load_factors
        )

        # Classify
        if total_load < 0.3:
            classification = "LOW"
        elif total_load < 0.6:
            classification = "MODERATE"
        elif total_load < 0.8:
            classification = "HIGH"
        else:
            classification = "OVERLOAD"

        return total_load, classification

    def _assess_response_time_load(self, response_time: float, accuracy: float) -> float:
        """
        Assess load based on response time and accuracy combination.

        Matrix:
        ┌──────────┬───────────┬───────────┐
        │          │ Accurate  │ Inaccurate│
        ├──────────┼───────────┼───────────┤
        │ Fast     │ Low load  │ Guessing  │ 0.2-0.4
        │ Medium   │ Thoughtful│ Confused  │ 0.4-0.7
        │ Slow     │ Careful   │ Overload  │ 0.7-0.9
        └──────────┴───────────┴───────────┘
        """

        # Categorize response time
        if response_time < 3:
            time_category = "fast"
        elif response_time < 15:
            time_category = "medium"
        else:
            time_category = "slow"

        # Accuracy category
        if accuracy > 0.75:
            accuracy_category = "accurate"
        else:
            accuracy_category = "inaccurate"

        # Matrix lookup
        matrix = {
            ("fast", "accurate"): 0.2,
            ("fast", "inaccurate"): 0.4,
            ("medium", "accurate"): 0.4,
            ("medium", "inaccurate"): 0.7,
            ("slow", "accurate"): 0.5,
            ("slow", "inaccurate"): 0.85,
        }

        return matrix.get((time_category, accuracy_category), 0.5)

    async def _assess_recovery_speed(self, user_id: str) -> float:
        """
        Assess how quickly student recovers from errors.

        0 = Takes many attempts (low recovery)
        1 = Immediate recovery (high recovery)
        """

        recent_interactions = await self.db.fetch("""
            SELECT error_recovery_time FROM student_interactions
            WHERE user_id = $1
            ORDER BY timestamp DESC
            LIMIT 20
        """, user_id)

        if not recent_interactions:
            return 0.5  # Neutral

        avg_recovery_time = np.mean([i["error_recovery_time"] for i in recent_interactions])

        # Fast recovery: < 2 minutes -> 1.0
        # Slow recovery: > 10 minutes -> 0.0
        if avg_recovery_time < 120:
            return 1.0
        elif avg_recovery_time > 600:
            return 0.0
        else:
            return (600 - avg_recovery_time) / 480  # Linear interpolation

    async def recommend_adjustment(
        self,
        load: float,
        classification: str
    ) -> Optional[str]:
        """Recommend intervention based on cognitive load."""

        if classification == "OVERLOAD":
            return "SLOW_DOWN"  # Reduce complexity, provide scaffolding
        elif classification == "HIGH":
            return "INCREASE_SUPPORT"  # Provide hints, examples
        elif classification == "LOW":
            return "INCREASE_DIFFICULTY"  # Challenge student with harder problems
        else:
            return None  # Moderate load, no change needed
```

---

## Knowledge Gap Detection

### Misconception Identification

The system identifies common misconceptions and knowledge gaps:

```python
class KnowledgeGapDetector:
    """Identifies knowledge gaps and misconceptions."""

    COMMON_MISCONCEPTIONS = {
        "quadratic_equations": {
            "solution_set_misunderstanding": {
                "description": "Student thinks x² = 4 has one solution (2)",
                "correct": "x² = 4 has two solutions (2 and -2)",
                "detection_pattern": ["student answered x=2", "missed x=-2"]
            },
            "factoring_sign_error": {
                "description": "Student makes sign errors when factoring",
                "correct": "In x² - 5x + 6 = (x - 2)(x - 3), not (x + 2)(x + 3)",
                "detection_pattern": ["factoring with wrong signs"]
            },
            "zero_product_property": {
                "description": "Student doesn't apply zero product property",
                "correct": "If (x-2)(x-3)=0, then x=2 or x=3",
                "detection_pattern": ["factored correctly but didn't solve"]
            }
        },
        "fractions": {
            "same_denominator_assumption": {
                "description": "Student assumes you can add numerators only",
                "correct": "1/2 + 1/3 = 5/6, not 2/5",
                "detection_pattern": ["added numerators only"]
            },
            "division_invert_error": {
                "description": "Student forgets to invert divisor",
                "correct": "3/4 ÷ 5/6 = 3/4 × 6/5 = 18/20 = 9/10",
                "detection_pattern": ["attempted division without inverting"]
            }
        }
    }

    async def detect_misconceptions(
        self,
        user_id: str,
        recent_errors: List[Dict],
        topic: str
    ) -> List[Misconception]:
        """
        Detect misconceptions from error patterns.

        Analyzes:
        - What specific errors student made
        - Error consistency (one-off vs. systematic)
        - Related concept performance
        """

        detected = []

        if topic not in self.COMMON_MISCONCEPTIONS:
            return detected

        topic_misconceptions = self.COMMON_MISCONCEPTIONS[topic]

        for misconception_name, misconception_data in topic_misconceptions.items():
            # Check if error matches detection pattern
            error_texts = [e.get("response", "") for e in recent_errors]
            detection_patterns = misconception_data.get("detection_pattern", [])

            matches = sum(
                1 for pattern in detection_patterns
                if any(pattern.lower() in text.lower() for text in error_texts)
            )

            # If 2+ errors match pattern, it's systematic (not a one-off)
            if matches >= 2:
                detected.append(Misconception(
                    type=misconception_name,
                    description=misconception_data["description"],
                    correct_concept=misconception_data["correct"],
                    confidence=min(matches / len(detection_patterns), 1.0),
                    teaching_strategy=f"Directly address: {misconception_data['description']}"
                ))

        return detected

    async def identify_knowledge_gaps(
        self,
        user_id: str,
        course_id: str,
        topic: str
    ) -> List[KnowledgeGap]:
        """
        Identify prerequisite knowledge gaps.

        Example: If student struggles with quadratic equations,
        check if they understand:
        - Factoring
        - FOIL
        - Distributing multiplication
        """

        # Fetch prerequisite topics
        prerequisites = await self._get_prerequisites(course_id, topic)

        gaps = []

        for prereq_topic in prerequisites:
            # Get student's mastery of this prerequisite
            mastery = await self._get_mastery(user_id, course_id, prereq_topic)

            if mastery < 0.7:  # Below 70% is a gap
                gaps.append(KnowledgeGap(
                    topic=prereq_topic,
                    current_mastery=mastery,
                    importance="CRITICAL",  # Prerequisites are critical
                    recommendation=f"Remediate {prereq_topic} before continuing with {topic}"
                ))

        return gaps
```

---

## State Management Architecture

### Multi-Layer State Storage

```python
class BehaviorStateManager:
    """Manages behavior state across multiple storage layers."""

    # Layer 1: Redis (Real-time, <1s response)
    # Layer 2: PostgreSQL (Durable, <100ms response)
    # Layer 3: TimescaleDB (Time-series analysis, <500ms response)

    async def update_state(
        self,
        user_id: str,
        course_id: str,
        behavior_label: str,
        cognitive_load: float,
        engagement_score: float,
        mastery_updates: Dict[str, float]
    ) -> None:
        """
        Update student state across all layers.

        Process:
        1. Update Redis (immediate)
        2. Update PostgreSQL (durable)
        3. Log to TimescaleDB (analytics)
        """

        state_update = {
            "user_id": user_id,
            "course_id": course_id,
            "timestamp": datetime.now(),
            "behavior_label": behavior_label,
            "cognitive_load": cognitive_load,
            "engagement_score": engagement_score,
            "mastery_updates": mastery_updates
        }

        # Layer 1: Redis (expires after 24 hours)
        redis_key = f"behavior_state:{user_id}:{course_id}"
        await self.redis.setex(
            redis_key,
            86400,  # 24 hour TTL
            json.dumps(state_update, default=str)
        )

        # Layer 2: PostgreSQL (permanent)
        await self.db.execute("""
            INSERT INTO student_behavior_states
            (user_id, course_id, behavior_label, cognitive_load, engagement_score, timestamp)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                behavior_label = $3,
                cognitive_load = $4,
                engagement_score = $5,
                timestamp = $6
        """, user_id, course_id, behavior_label, cognitive_load, engagement_score, state_update["timestamp"])

        # Update mastery scores
        for topic, mastery in mastery_updates.items():
            await self.db.execute("""
                INSERT INTO topic_mastery (user_id, topic, mastery, last_updated)
                VALUES ($1, $2, $3, NOW())
                ON CONFLICT (user_id, topic) DO UPDATE SET
                    mastery = $3, last_updated = NOW()
            """, user_id, topic, mastery)

        # Layer 3: TimescaleDB (time-series)
        await self.timescaledb.insert_metric(
            metric_name="student_behavior",
            timestamp=state_update["timestamp"],
            tags={
                "user_id": user_id,
                "course_id": course_id,
                "behavior": behavior_label
            },
            fields={
                "cognitive_load": cognitive_load,
                "engagement": engagement_score
            }
        )

    async def get_state(self, user_id: str, course_id: str) -> BehaviorState:
        """Retrieve current state from fastest available source."""

        # Try Redis first (fastest)
        redis_key = f"behavior_state:{user_id}:{course_id}"
        cached = await self.redis.get(redis_key)

        if cached:
            return BehaviorState.parse_raw(cached)

        # Fall back to PostgreSQL
        row = await self.db.fetchrow("""
            SELECT behavior_label, cognitive_load, engagement_score, timestamp
            FROM student_behavior_states
            WHERE user_id = $1 AND course_id = $2
        """, user_id, course_id)

        if row:
            return BehaviorState(**row)

        # New student, initialize
        return BehaviorState(
            user_id=user_id,
            behavior_label="focused",
            cognitive_load=0.5,
            engagement_score=0.5
        )
```

---

## Engagement Scoring

### Multi-Factor Engagement Formula

```python
class EngagementScorer:
    """Computes student engagement score 0-100."""

    async def compute_engagement(
        self,
        user_id: str,
        course_id: str,
        time_window_hours: int = 24
    ) -> float:
        """
        Compute engagement as weighted combination of factors.

        Formula:
        Engagement = 0.25×Participation + 0.25×Interaction_Depth +
                     0.25×Progress + 0.15×Consistency + 0.10×Help_Seeking

        Score Interpretation:
        90-100: Highly engaged, proactive learning
        70-89:  Engaged, making steady progress
        50-69:  Moderately engaged, needs some push
        30-49:  Disengaged, at risk
        0-29:   Severely disengaged, likely to fail
        """

        # Factor 1: Participation (0-100)
        participation = await self._compute_participation(
            user_id, course_id, time_window_hours
        )

        # Factor 2: Interaction Depth (0-100)
        depth = await self._compute_interaction_depth(
            user_id, course_id, time_window_hours
        )

        # Factor 3: Progress (0-100)
        progress = await self._compute_progress(
            user_id, course_id, time_window_hours
        )

        # Factor 4: Consistency (0-100)
        consistency = await self._compute_consistency(
            user_id, course_id
        )

        # Factor 5: Help-seeking (0-100)
        help_seeking = await self._compute_help_seeking(
            user_id, course_id, time_window_hours
        )

        # Weighted sum
        engagement = (0.25 * participation +
                      0.25 * depth +
                      0.25 * progress +
                      0.15 * consistency +
                      0.10 * help_seeking)

        return engagement

    async def _compute_participation(
        self,
        user_id: str,
        course_id: str,
        hours: int
    ) -> float:
        """
        Measure: Did the student log in and interact?

        Scoring:
        - Multiple sessions in time window: +20
        - Regular session timing: +20
        - Total time on task > 1 hour: +30
        - Interact with variety of content types: +30
        """

        score = 0

        # Session frequency
        sessions = await self.db.fetch("""
            SELECT COUNT(*) as count FROM sessions
            WHERE user_id = $1 AND course_id = $2
            AND timestamp > NOW() - INTERVAL '1 hour' * $3
        """, user_id, course_id, hours)

        if sessions[0]["count"] >= 3:
            score += 20

        # Session consistency
        session_times = await self.db.fetch("""
            SELECT EXTRACT(HOUR FROM timestamp) as hour
            FROM sessions
            WHERE user_id = $1 AND course_id = $2
            AND timestamp > NOW() - INTERVAL '7 days'
        """, user_id, course_id)

        if session_times and len(set(h["hour"] for h in session_times)) > 3:
            score += 20

        # Total time
        total_time = await self.db.fetchval("""
            SELECT SUM(duration_minutes) as total
            FROM sessions
            WHERE user_id = $1 AND course_id = $2
            AND timestamp > NOW() - INTERVAL '1 hour' * $3
        """, user_id, course_id, hours) or 0

        if total_time > 60:
            score += 30

        # Content variety
        content_types = await self.db.fetch("""
            SELECT DISTINCT content_type
            FROM interactions
            WHERE user_id = $1 AND course_id = $2
            AND timestamp > NOW() - INTERVAL '1 hour' * $3
        """, user_id, course_id, hours)

        if len(content_types) >= 4:  # Videos, quizzes, text, practice
            score += 30

        return min(score, 100)  # Cap at 100

    async def _compute_interaction_depth(
        self,
        user_id: str,
        course_id: str,
        hours: int
    ) -> float:
        """
        Measure: How deeply does student interact with content?

        Scoring:
        - Note-taking: +20
        - Bookmarks/annotations: +20
        - Stays on page > 2 min: +20
        - Reviews previous content: +20
        - Asks questions: +20
        """

        score = 0

        # Note-taking
        notes = await self.db.fetchval("""
            SELECT COUNT(*) FROM notes
            WHERE user_id = $1 AND course_id = $2
            AND timestamp > NOW() - INTERVAL '1 hour' * $3
        """, user_id, course_id, hours)

        if notes and notes > 0:
            score += 20

        # Bookmarks/annotations
        marks = await self.db.fetchval("""
            SELECT COUNT(*) FROM bookmarks + annotations
            WHERE user_id = $1 AND course_id = $2
            AND timestamp > NOW() - INTERVAL '1 hour' * $3
        """, user_id, course_id, hours) or 0

        if marks > 0:
            score += 20

        # Page dwell time
        long_dwells = await self.db.fetchval("""
            SELECT COUNT(*) FROM page_interactions
            WHERE user_id = $1 AND course_id = $2
            AND duration_seconds > 120
            AND timestamp > NOW() - INTERVAL '1 hour' * $3
        """, user_id, course_id, hours) or 0

        if long_dwells > 0:
            score += 20

        # Content review
        revisits = await self.db.fetchval("""
            SELECT COUNT(DISTINCT page_id) FROM page_interactions
            WHERE user_id = $1 AND course_id = $2
            GROUP BY page_id HAVING COUNT(*) > 1
            AND timestamp > NOW() - INTERVAL '1 hour' * $3
        """, user_id, course_id, hours) or 0

        if revisits > 0:
            score += 20

        # Questions asked
        questions = await self.db.fetchval("""
            SELECT COUNT(*) FROM tutor_questions
            WHERE user_id = $1 AND course_id = $2
            AND timestamp > NOW() - INTERVAL '1 hour' * $3
        """, user_id, course_id, hours) or 0

        if questions > 0:
            score += 20

        return min(score, 100)

    async def _compute_progress(
        self,
        user_id: str,
        course_id: str,
        hours: int
    ) -> float:
        """
        Measure: Is student making progress?

        Scoring:
        - Mastery improving: +30
        - Completing exercises/quizzes: +40
        - Error rate decreasing: +30
        """

        score = 0

        # Mastery trend
        old_mastery = await self.db.fetchval("""
            SELECT AVG(mastery) FROM topic_mastery_history
            WHERE user_id = $1 AND course_id = $2
            AND timestamp BETWEEN NOW() - INTERVAL '1 hour' * ($3+24) AND NOW() - INTERVAL '24 hours'
        """, user_id, course_id, hours)

        new_mastery = await self.db.fetchval("""
            SELECT AVG(mastery) FROM topic_mastery_history
            WHERE user_id = $1 AND course_id = $2
            AND timestamp > NOW() - INTERVAL '1 hour' * $3
        """, user_id, course_id, hours)

        if old_mastery and new_mastery and new_mastery > old_mastery:
            score += 30

        # Completion
        completed = await self.db.fetchval("""
            SELECT COUNT(*) FROM assignments
            WHERE user_id = $1 AND course_id = $2
            AND status = 'completed'
            AND timestamp > NOW() - INTERVAL '1 hour' * $3
        """, user_id, course_id, hours)

        if completed and completed > 0:
            score += 40

        # Error rate improvement
        old_errors = await self.db.fetchval("""
            SELECT COUNT(*) FROM quiz_responses
            WHERE user_id = $1 AND course_id = $2
            AND is_correct = FALSE
            AND timestamp BETWEEN NOW() - INTERVAL '1 hour' * ($3+24) AND NOW() - INTERVAL '24 hours'
        """, user_id, course_id, hours) or 0

        new_errors = await self.db.fetchval("""
            SELECT COUNT(*) FROM quiz_responses
            WHERE user_id = $1 AND course_id = $2
            AND is_correct = FALSE
            AND timestamp > NOW() - INTERVAL '1 hour' * $3
        """, user_id, course_id, hours) or 0

        if old_errors > 0 and new_errors < old_errors:
            score += 30

        return min(score, 100)

    async def _compute_consistency(self, user_id: str, course_id: str) -> float:
        """
        Measure: Is student's engagement consistent or sporadic?

        Consistent engagement = Regular, predictable participation
        Sporadic = Bursty, unpredictable
        """

        # Get session times over last 7 days
        sessions = await self.db.fetch("""
            SELECT DATE_TRUNC('day', timestamp) as day
            FROM sessions
            WHERE user_id = $1 AND course_id = $2
            AND timestamp > NOW() - INTERVAL '7 days'
            GROUP BY day
        """, user_id, course_id)

        if not sessions:
            return 0.0

        # Count days with activity
        active_days = len(sessions)

        # Ideal: At least 5 days out of 7 (consistent)
        # Poor: 1-2 days (sporadic)
        consistency = min(active_days / 5 * 100, 100)

        return consistency

    async def _compute_help_seeking(
        self,
        user_id: str,
        course_id: str,
        hours: int
    ) -> float:
        """
        Measure: Is student seeking help appropriately?

        Appropriate help-seeking = Sign of engagement, not disengagement
        Never seeking help = Could mean over-confident or disengaged
        Always seeking help = Could mean struggling or dependent
        """

        help_requests = await self.db.fetchval("""
            SELECT COUNT(*) FROM help_requests
            WHERE user_id = $1 AND course_id = $2
            AND timestamp > NOW() - INTERVAL '1 hour' * $3
        """, user_id, course_id, hours) or 0

        # Optimal: Some help requests (shows engagement)
        # 0-2 requests: +10 (independent but some help)
        # 3-5 requests: +30 (healthy help-seeking)
        # 6-10 requests: +20 (some help, not overdependent)
        # 10+ requests: +10 (overly dependent)

        if help_requests == 0:
            return 10.0
        elif help_requests <= 2:
            return 10.0
        elif help_requests <= 5:
            return 30.0
        elif help_requests <= 10:
            return 20.0
        else:
            return 10.0
```

---

## Predictive Interventions

(Continued in next part due to length constraints...)

Actually, let me continue with the comprehensive document:

### Predictive Interventions

```python
class InterventionAgent:
    """Predicts when students need help and recommends interventions."""

    async def predict_at_risk(
        self,
        user_id: str,
        course_id: str,
        prediction_horizon_days: int = 7
    ) -> AtRiskPrediction:
        """
        Predict if student will fail/drop out within prediction horizon.

        Uses ensemble of signals:
        - Declining engagement
        - Increasing cognitive load
        - Misconceptions
        - Knowledge gaps
        - Emotional state
        """

        # Collect current state
        behavior_state = await self.behavior_manager.get_state(user_id, course_id)
        engagement = await self.engagement_scorer.compute_engagement(user_id, course_id)
        mastery = await self.get_average_mastery(user_id, course_id)

        # Extract risk factors
        risk_factors = []

        # Factor 1: Engagement trend
        engagement_trend = await self._get_engagement_trend(user_id, course_id, days=7)
        if engagement_trend < -0.1:  # Declining
            risk_factors.append({
                "factor": "declining_engagement",
                "severity": abs(engagement_trend),
                "weight": 0.25
            })

        # Factor 2: Cognitive overload
        if behavior_state.cognitive_load > 0.8:
            risk_factors.append({
                "factor": "cognitive_overload",
                "severity": behavior_state.cognitive_load,
                "weight": 0.20
            })

        # Factor 3: Low mastery
        if mastery < 0.5:
            risk_factors.append({
                "factor": "low_mastery",
                "severity": 1 - mastery,
                "weight": 0.25
            })

        # Factor 4: Persistent misconceptions
        misconceptions = await self.gap_detector.detect_misconceptions(user_id, None, None)
        if len(misconceptions) > 2:
            risk_factors.append({
                "factor": "multiple_misconceptions",
                "severity": min(len(misconceptions) / 5, 1.0),
                "weight": 0.15
            })

        # Factor 5: Disengagement behaviors
        if behavior_state.behavior_label in ["bored", "frustrated", "distracted"]:
            risk_factors.append({
                "factor": f"behavioral_{behavior_state.behavior_label}",
                "severity": 0.7,
                "weight": 0.15
            })

        # Calculate risk score (0-1)
        if not risk_factors:
            risk_score = 0.0
        else:
            risk_score = sum(
                f["severity"] * f["weight"]
                for f in risk_factors
            ) / sum(f["weight"] for f in risk_factors)

        # Determine risk level
        if risk_score > 0.7:
            risk_level = "CRITICAL"
        elif risk_score > 0.5:
            risk_level = "HIGH"
        elif risk_score > 0.3:
            risk_level = "MODERATE"
        else:
            risk_level = "LOW"

        return AtRiskPrediction(
            risk_score=risk_score,
            risk_level=risk_level,
            risk_factors=risk_factors,
            recommendation=await self._recommend_intervention(risk_factors)
        )

    async def _recommend_intervention(self, risk_factors: List[Dict]) -> str:
        """Recommend specific intervention based on risk factors."""

        top_factor = max(risk_factors, key=lambda x: x["severity"])["factor"]

        if "declining_engagement" in top_factor:
            return "Schedule check-in with student. Discuss obstacles. Consider reducing workload."

        elif "cognitive_overload" in top_factor:
            return "Slow down. Provide scaffolding. Break into smaller chunks. Increase support."

        elif "low_mastery" in top_factor:
            return "Remediate prerequisites. Provide worked examples. Increase practice."

        elif "misconceptions" in top_factor:
            return "Directly address misconceptions. Provide counterexamples. Check understanding."

        elif "behavioral_frustrated" in top_factor:
            return "Provide encouragement. Celebrate small wins. Adjust difficulty down."

        elif "behavioral_bored" in top_factor:
            return "Increase challenge. Add interesting applications. Offer choice in tasks."

        elif "behavioral_distracted" in top_factor:
            return "Refocus attention. Remove distractions. Provide structure. Increase engagement."

        else:
            return "Monitor closely. Continue current support."
```

---

## Student Patience Profiling

```python
class PatienceProfiler:
    """Profiles each student's patience level and learning preferences."""

    async def build_patience_profile(
        self,
        user_id: str,
        course_id: str
    ) -> PatienceProfile:
        """
        Measure: How patient is this student with learning?

        Factors:
        - Quick-giveup: Abandons after few attempts
        - Persistent: Keeps trying despite failures
        - Help-dependent: Always asks for help
        - Independent: Rarely asks for help
        - Impatient with details: Skips explanations
        - Thorough: Reads carefully, takes notes
        """

        # Get interaction history
        interactions = await self.db.fetch("""
            SELECT * FROM quiz_responses
            WHERE user_id = $1 AND course_id = $2
            ORDER BY timestamp DESC
            LIMIT 100
        """, user_id, course_id)

        # Measure 1: Giveup tendency
        giveup_score = self._measure_giveup_tendency(interactions)

        # Measure 2: Persistence
        persistence_score = self._measure_persistence(interactions)

        # Measure 3: Help dependency
        help_dependency = await self._measure_help_dependency(user_id, course_id)

        # Measure 4: Detail orientation
        detail_score = await self._measure_detail_orientation(user_id, course_id)

        patience_level = (
            (100 - giveup_score) * 0.3 +  # Low giveup = patient
            persistence_score * 0.3 +
            (100 - help_dependency) * 0.2 +  # Independence = patience
            detail_score * 0.2
        ) / 100

        return PatienceProfile(
            user_id=user_id,
            patience_level=patience_level,  # 0-10 scale
            giveup_tendency=giveup_score,
            persistence=persistence_score,
            help_dependency=help_dependency,
            detail_orientation=detail_score,
            recommendation=self._generate_recommendation(
                giveup_score,
                persistence_score,
                help_dependency,
                detail_score
            )
        )

    def _measure_giveup_tendency(self, interactions: List[Dict]) -> float:
        """
        How often does student give up after few attempts?

        0 = Never gives up
        100 = Always gives up
        """

        if not interactions:
            return 50.0

        quick_abandons = sum(
            1 for interaction in interactions
            if interaction["attempt_number"] <= 1 and not interaction["is_correct"]
        )

        return (quick_abandons / len(interactions)) * 100

    def _measure_persistence(self, interactions: List[Dict]) -> float:
        """
        How persistent is student in face of failures?

        0 = Doesn't persist
        100 = Highly persistent
        """

        if not interactions:
            return 50.0

        persists = sum(
            1 for interaction in interactions
            if (interaction["attempt_number"] > 3 or
                (not interaction["is_correct"] and "retried" in str(interaction)))
        )

        return (persists / len(interactions)) * 100

    async def _measure_help_dependency(self, user_id: str, course_id: str) -> float:
        """
        How dependent is student on help?

        0 = Very independent
        100 = Very dependent
        """

        total_questions = await self.db.fetchval("""
            SELECT COUNT(*) FROM quiz_responses
            WHERE user_id = $1 AND course_id = $2
        """, user_id, course_id) or 1

        help_requests = await self.db.fetchval("""
            SELECT COUNT(*) FROM help_requests
            WHERE user_id = $1 AND course_id = $2
        """, user_id, course_id) or 0

        return (help_requests / total_questions) * 100

    async def _measure_detail_orientation(self, user_id: str, course_id: str) -> float:
        """
        Does student read carefully or skim?

        0 = Skimming
        100 = Thorough reading
        """

        # Time on page (careful reading takes longer)
        avg_dwell_time = await self.db.fetchval("""
            SELECT AVG(duration_seconds) FROM page_interactions
            WHERE user_id = $1 AND course_id = $2
        """, user_id, course_id) or 0

        # Taking notes (sign of careful reading)
        notes_count = await self.db.fetchval("""
            SELECT COUNT(*) FROM notes
            WHERE user_id = $1 AND course_id = $2
        """, user_id, course_id) or 0

        # Bookmarks (mark important parts)
        bookmarks_count = await self.db.fetchval("""
            SELECT COUNT(*) FROM bookmarks
            WHERE user_id = $1 AND course_id = $2
        """, user_id, course_id) or 0

        # Calculate score
        dwell_score = min(avg_dwell_time / 120, 1.0) * 100  # 2 min = full points
        notes_score = min(notes_count / 5, 1.0) * 100  # 5+ notes = full points
        bookmarks_score = min(bookmarks_count / 3, 1.0) * 100  # 3+ bookmarks = full points

        return (dwell_score * 0.5 + notes_score * 0.3 + bookmarks_score * 0.2)

    def _generate_recommendation(
        self,
        giveup: float,
        persistence: float,
        help_dep: float,
        detail: float
    ) -> str:
        """Generate personalized learning recommendation."""

        if giveup > 70:
            return "This student gives up quickly. Provide scaffolding, hint system, and encouragement."

        if persistence > 80:
            return "This student is very persistent. Challenge them with difficult problems."

        if help_dep > 70:
            return "This student relies on help. Encourage independence with hint progression."

        if detail < 30:
            return "This student skims. Require note-taking. Use visual aids. Summarize key points."

        return "Student shows balanced learning behaviors. Continue current approach."
```

---

## Study Behavior Patterns

```python
class StudyPatternAnalyzer:
    """Identifies individual study patterns."""

    async def analyze_patterns(
        self,
        user_id: str,
        course_id: str
    ) -> StudyPatternProfile:
        """
        Identify: Is student a night owl or early bird?
        Do they study in sprints or marathons?
        Are they systematic or random in approach?
        """

        # Get all study sessions over past month
        sessions = await self.db.fetch("""
            SELECT DATE_TRUNC('hour', timestamp) as hour,
                   SUM(duration_minutes) as total_duration,
                   COUNT(*) as session_count
            FROM sessions
            WHERE user_id = $1 AND course_id = $2
            AND timestamp > NOW() - INTERVAL '30 days'
            GROUP BY hour
            ORDER BY hour
        """, user_id, course_id)

        if not sessions:
            return StudyPatternProfile(
                chronotype="unknown",
                study_style="unknown",
                approach="unknown"
            )

        # Pattern 1: Chronotype (when does student study?)
        hours_of_day = [s["hour"].hour for s in sessions]
        hour_distribution = {}

        for hour in range(24):
            hour_distribution[hour] = sum(
                1 for h in hours_of_day
                if h == hour
            )

        peak_hours = sorted(
            hour_distribution.items(),
            key=lambda x: x[1],
            reverse=True
        )[:3]

        peak_hour_values = [h for h, _ in peak_hours]

        if all(5 <= h < 12 for h in peak_hour_values):
            chronotype = "EARLY_BIRD"
        elif all(17 <= h < 24 or 0 <= h < 5 for h in peak_hour_values):
            chronotype = "NIGHT_OWL"
        else:
            chronotype = "FLEXIBLE"

        # Pattern 2: Study style (sprint vs marathon)
        durations = [s["total_duration"] for s in sessions]
        avg_duration = np.mean(durations)
        std_duration = np.std(durations)

        coefficient_of_variation = std_duration / avg_duration if avg_duration > 0 else 0

        if coefficient_of_variation > 0.7:
            study_style = "VARIED"  # Inconsistent session lengths
        elif avg_duration < 30:
            study_style = "SPRINT"  # Short, intense sessions
        elif avg_duration > 90:
            study_style = "MARATHON"  # Long study sessions
        else:
            study_style = "MODERATE"

        # Pattern 3: Approach (systematic vs random)
        # Systematic: Takes same topics, consistent progression
        # Random: Jumps between topics

        topics_per_session = await self.db.fetch("""
            SELECT session_id, COUNT(DISTINCT topic) as topic_count
            FROM session_interactions
            WHERE user_id = $1 AND course_id = $2
            GROUP BY session_id
        """, user_id, course_id)

        avg_topics_per_session = np.mean([t["topic_count"] for t in topics_per_session]) if topics_per_session else 1

        if avg_topics_per_session < 1.5:
            approach = "SYSTEMATIC"  # One topic per session
        elif avg_topics_per_session > 3:
            approach = "RANDOM"  # Many topics per session
        else:
            approach = "BALANCED"

        return StudyPatternProfile(
            user_id=user_id,
            chronotype=chronotype,
            study_style=study_style,
            approach=approach,
            recommendations=self._generate_pattern_recommendations(
                chronotype, study_style, approach
            )
        )

    def _generate_pattern_recommendations(
        self,
        chronotype: str,
        style: str,
        approach: str
    ) -> List[str]:
        """Generate recommendations based on identified patterns."""

        recommendations = []

        if chronotype == "NIGHT_OWL":
            recommendations.append(
                "Schedule tutoring sessions in evening. "
                "Avoid forcing early morning study."
            )
        elif chronotype == "EARLY_BIRD":
            recommendations.append(
                "Schedule challenges and assessments early morning "
                "when student is most alert."
            )

        if style == "SPRINT":
            recommendations.append(
                "Student prefers intense, focused sessions. "
                "Structure content for 20-30 min focused blocks."
            )
        elif style == "MARATHON":
            recommendations.append(
                "Student prefers long sessions. "
                "Provide comprehensive content. "
                "Include breaks within long sessions."
            )

        if approach == "RANDOM":
            recommendations.append(
                "Student jumps between topics. "
                "Provide a recommended learning path "
                "to increase coherence."
            )
        elif approach == "SYSTEMATIC":
            recommendations.append(
                "Student is methodical. "
                "Provide clear progression through topics. "
                "Acknowledge their structured approach."
            )

        return recommendations
```

---

## Learner Profile Database

### Core Schema

```sql
-- Core learner profile tables

CREATE TABLE learner_profiles (
    user_id UUID PRIMARY KEY,
    course_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Behavior state
    current_behavior_label VARCHAR(50),
    behavior_confidence FLOAT,
    cognitive_load FLOAT,  -- 0-1
    engagement_score FLOAT,  -- 0-100

    -- Learning characteristics
    learning_style VARCHAR(50),  -- visual, auditory, kinesthetic, reading_writing
    patience_level FLOAT,  -- 0-10
    chronotype VARCHAR(50),  -- early_bird, night_owl, flexible
    study_style VARCHAR(50),  -- sprint, marathon, moderate
    approach VARCHAR(50),  -- systematic, random, balanced

    -- Progress
    overall_mastery FLOAT,  -- 0-1
    topics_completed INT,
    topics_in_progress INT,
    topics_struggling INT,

    -- Risk assessment
    at_risk BOOLEAN,
    risk_score FLOAT,  -- 0-1
    risk_level VARCHAR(50),  -- CRITICAL, HIGH, MODERATE, LOW

    -- Preferences
    prefers_examples BOOLEAN,
    prefers_detailed_explanations BOOLEAN,
    prefers_bullet_points BOOLEAN,
    prefers_video BOOLEAN,
    prefers_text BOOLEAN,
    prefers_interactive BOOLEAN
);

CREATE TABLE topic_mastery (
    user_id UUID NOT NULL,
    topic_id VARCHAR NOT NULL,
    course_id UUID NOT NULL,

    mastery_bkt FLOAT,  -- BKT-based mastery (0-1)
    mastery_dkt FLOAT,  -- DKT-based mastery (0-1)
    mastery_combined FLOAT,  -- Average (0-1)

    last_attempted TIMESTAMP,
    attempts_count INT,
    correct_count INT,

    PRIMARY KEY (user_id, topic_id, course_id)
);

CREATE TABLE misconceptions_log (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    course_id UUID NOT NULL,
    misconception_type VARCHAR NOT NULL,
    detected_at TIMESTAMP DEFAULT NOW(),
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    intervention_used VARCHAR
);

CREATE TABLE knowledge_gaps (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    prerequisite_topic VARCHAR NOT NULL,
    missing_concept VARCHAR NOT NULL,
    identified_at TIMESTAMP DEFAULT NOW(),
    gap_severity FLOAT,  -- 0-1
    recommended_remediation VARCHAR
);

CREATE TABLE behavioral_signals (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    course_id UUID NOT NULL,
    signal_name VARCHAR NOT NULL,
    signal_value FLOAT,
    signal_metadata JSONB,
    recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE bkt_states (
    user_id UUID NOT NULL,
    concept_id VARCHAR NOT NULL,
    p_k FLOAT,  -- Probability of knowing
    p_l FLOAT,  -- Probability of learning
    p_s FLOAT,  -- Probability of slip
    p_g FLOAT,  -- Probability of guess
    mastery BOOLEAN,
    last_updated TIMESTAMP DEFAULT NOW(),

    PRIMARY KEY (user_id, concept_id)
);

-- Time-series tables in TimescaleDB
CREATE TABLE student_behavior_timeseries (
    time TIMESTAMP,
    user_id UUID,
    course_id UUID,
    behavior_label VARCHAR(50),
    cognitive_load FLOAT,
    engagement_score FLOAT,
    PRIMARY KEY (time, user_id)
)
PARTITION BY TIME (time);
```

---

## Privacy and FERPA Compliance

### Data Protection

```python
class PrivacyCompliance:
    """Ensures FERPA and privacy compliance."""

    # FERPA (Family Educational Rights and Privacy Act)
    # Key requirements:
    # 1. Student data can only be accessed by authorized users
    # 2. Parents/students have right to review their data
    # 3. Data must be protected from unauthorized access
    # 4. Retention policies must be followed

    async def anonymize_behavioral_signals(
        self,
        signal: BehavioralSignal,
        for_research: bool = False
    ) -> BehavioralSignal:
        """Remove PII before storing for analytics."""

        if for_research:
            # For research, anonymize user_id
            signal.user_id = hash_user_id(signal.user_id)

        # Always keep timestamp but aggregate to hour level for granular privacy
        signal.timestamp = signal.timestamp.replace(minute=0, second=0, microsecond=0)

        # Remove identifying metadata
        if "personal_info" in signal.metadata:
            del signal.metadata["personal_info"]

        return signal

    async def get_student_data_export(
        self,
        user_id: str,
        course_id: str,
        requester_id: str,
        requester_role: str
    ) -> StudentDataExport:
        """
        Export all student data (FERPA right to access).

        Access control:
        - Student can access their own data
        - Parent can access their child's data (with authorization)
        - Teacher can access student data for their course
        - Admin can access with audit log
        """

        # Verify authorization
        if requester_role == "student":
            if requester_id != user_id:
                raise UnauthorizedError("Students can only access their own data")

        elif requester_role == "parent":
            # Verify parent-student relationship
            is_authorized_parent = await self._verify_parent_authorization(
                requester_id, user_id
            )
            if not is_authorized_parent:
                raise UnauthorizedError("Not authorized to access this student's data")

        elif requester_role == "teacher":
            # Verify teacher teaches this course
            teaches_course = await self._verify_teacher_course(requester_id, course_id)
            if not teaches_course:
                raise UnauthorizedError("Not authorized to access this data")

        elif requester_role == "admin":
            # Admin access with audit log
            await self._audit_log_access(requester_id, user_id, course_id, "admin_export")

        # Compile export
        export = StudentDataExport(
            user_id=user_id,
            course_id=course_id,
            exported_at=datetime.now(),

            # Personal data
            profile=await self.db.get_learner_profile(user_id, course_id),

            # Academic data
            mastery_scores=await self.db.get_topic_mastery(user_id, course_id),
            quiz_results=await self.db.get_quiz_results(user_id, course_id),
            assignments=await self.db.get_assignments(user_id, course_id),

            # Behavioral data (anonymized for privacy)
            behavioral_insights=await self.db.get_behavioral_summary(user_id, course_id),
            misconceptions=await self.db.get_misconceptions(user_id, course_id),
            interaction_summary=await self.db.get_interaction_summary(user_id, course_id),

            # AI tutor interactions
            tutor_conversations=await self._get_sanitized_conversations(user_id, course_id)
        )

        return export

    async def _get_sanitized_conversations(
        self,
        user_id: str,
        course_id: str
    ) -> List[Dict]:
        """Get tutor conversations with sensitive info removed."""

        conversations = await self.db.fetch("""
            SELECT session_id, student_query, ai_response, timestamp
            FROM tutor_interactions
            WHERE user_id = $1 AND course_id = $2
            ORDER BY timestamp DESC
        """, user_id, course_id)

        # Remove any PII from responses
        sanitized = []

        for convo in conversations:
            sanitized.append({
                "timestamp": convo["timestamp"],
                "student_query": convo["student_query"],
                "ai_response": self._remove_pii(convo["ai_response"])
            })

        return sanitized

    def _remove_pii(self, text: str) -> str:
        """Remove personally identifiable information from text."""

        # Remove email addresses
        text = re.sub(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", "[EMAIL]", text)

        # Remove phone numbers
        text = re.sub(r"\b\d{3}[-.]?\d{3}[-.]?\d{4}\b", "[PHONE]", text)

        # Remove SSN-like patterns
        text = re.sub(r"\b\d{3}-\d{2}-\d{4}\b", "[SSN]", text)

        # Remove names (if preceded by identifiers like "student name")
        # ... (more sophisticated name removal)

        return text

    async def enforce_retention_policy(self):
        """Delete old data according to retention policy."""

        # FERPA guidelines suggest keeping education records during enrollment
        # + 3 years after, then delete

        # Delete behavioral signals older than 3 years
        await self.db.execute("""
            DELETE FROM behavioral_signals
            WHERE recorded_at < NOW() - INTERVAL '3 years'
        """)

        # Delete interaction logs older than 3 years
        await self.db.execute("""
            DELETE FROM tutor_interactions
            WHERE timestamp < NOW() - INTERVAL '3 years'
        """)

        # Keep mastery/grades indefinitely (required by law)
        # But flag as archived

    async def audit_log_access(
        self,
        accessor_id: str,
        student_id: str,
        course_id: str,
        action: str
    ):
        """Log all access to student data (FERPA requirement)."""

        await self.db.execute("""
            INSERT INTO data_access_audit_log
            (accessor_id, student_id, course_id, action, accessed_at)
            VALUES ($1, $2, $3, $4, NOW())
        """, accessor_id, student_id, course_id, action)
```

---

## Implementation Examples

### Example 1: Student X - At-Risk Detection

```
STUDENT X PROFILE:
- Enrolled: Math 101, Week 3 of 12
- Mastery: 45% (below 50% threshold)
- Behavioral Label: FRUSTRATED
- Cognitive Load: 0.82 (HIGH)
- Engagement Score: 32/100 (LOW)

BEHAVIORAL SIGNALS (Last 24 hours):
- time_on_page: 180-300 seconds (slow, re-reading)
- quiz_response_time: 45-120 seconds (struggling)
- quiz_accuracy: 0.40 (many errors)
- error_type_conceptual: 8 errors (fundamental misunderstanding)
- rapid_topic_switch: 3 (abandoning topics)
- help_request: 5 (asking for help frequently)
- session_end_abrupt: Yes (left without completing)

BKT ANALYSIS:
Topic: Quadratic Equations
- P(K) = 0.35 (35% confident student knows)
- P(L) = 0.15 (learning slowly)
- P(S) = 0.08 (some forgetting)
- Mastery: FALSE (need 0.95 to master)

DETECTED MISCONCEPTIONS:
1. "Solution Set Misunderstanding" - Thinks x²=4 has one solution
   Confidence: 0.85 (detected in 3 quiz responses)

2. "Factoring Sign Errors" - Consistently gets signs wrong
   Confidence: 0.90 (systematic pattern)

KNOWLEDGE GAPS:
- Prerequisite "Distributive Property" mastery: 0.55 (insufficient)
- Prerequisite "FOIL Method" mastery: 0.62 (weak)

RISK ASSESSMENT:
Risk Score: 0.72 (HIGH RISK)
Risk Factors:
  - Declining engagement (↓ 15% over past 3 days)
  - Cognitive overload (0.82 > 0.70)
  - Low mastery (45% < 50%)
  - Multiple misconceptions (2 detected)
  - Behavioral frustration

RECOMMENDED INTERVENTIONS:
1. IMMEDIATE (Now):
   - Check in with student: "How are you feeling about the material?"
   - Provide encouragement: "You're making progress; this is hard."
   - Reduce cognitive load: "Let's slow down and focus on one concept."

2. SHORT-TERM (Next 3 days):
   - Remediate prerequisites (Distributive Property, FOIL)
   - Address misconceptions directly with counterexamples
   - Scaffold quadratic equations with step-by-step guidance
   - Provide worked examples student can reference

3. MEDIUM-TERM (Next week):
   - Daily check-ins to maintain motivation
   - Celebrate small wins
   - Adjust pace downward
   - Offer 1-on-1 tutor session

4. SYSTEMIC:
   - Monitor engagement score daily
   - Track whether misconceptions are resolved
   - Measure whether mastery improves
   - Adjust interventions based on progress

EXPECTED OUTCOMES:
- Mastery should improve to 60%+ within 1 week with interventions
- Engagement should increase above 50
- Frustration should decrease with success
- Misconceptions should be resolved
```

---

## Conclusion

The Student Behavior Engine transforms invisible student struggles into actionable insights. By tracking 50+ behavioral signals and using sophisticated ML models (BKT, DKT), it enables Lumina to:

✅ Detect struggling students in real-time (not after they fail)
✅ Identify root causes (misconceptions, knowledge gaps, cognitive overload)
✅ Recommend targeted interventions
✅ Personalize learning to each student's pace, style, and patience
✅ Prevent dropouts through early warning systems
✅ Build trust through privacy-first data practices

**The Result:** Teachers can finally see all 100 students, not just the vocal ones.
