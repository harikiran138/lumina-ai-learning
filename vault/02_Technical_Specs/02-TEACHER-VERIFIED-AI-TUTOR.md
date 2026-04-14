# 02 — Teacher-Verified AI Tutor & Handwritten Assignment Workflow

**Module:** AI Tutor Verification + Physical Assessment System
**Version:** 1.0
**Status:** Phase 1 — Priority Build (Core Differentiator)

---

## Overview

This is Lumina's most important differentiator from every other AI learning platform. The principle is:

> **All AI-generated answers must pass through the teacher before reaching the student. Students answer in their own words, on real paper. Teachers verify both the AI's output and the student's effort.**

This approach:
- Prevents students from copying AI answers verbatim
- Keeps teachers in authoritative control of knowledge
- Ensures answer quality matches the curriculum, exam board, and class level
- Builds genuine writing and thinking skills through physical practice
- Creates a trusted, curriculum-accurate Q&A knowledge base over time

---

## 1. How the AI Tutor Verification System Works

### The Core Loop

```
Student asks a question in AI Tutor chat
              ↓
AI generates an answer (uses RAG from approved content + LLM)
              ↓
Answer is HELD in verification queue — student does NOT see it yet
              ↓
Student sees: "Your teacher will review and release this answer shortly."
              ↓
Teacher reviews the AI's answer in their verification panel
              ↓
          Teacher APPROVES          Teacher EDITS + APPROVES     Teacher REJECTS
               ↓                            ↓                         ↓
   Answer released to student    Edited answer released        Teacher writes custom
   Added to verified bank                                      answer and releases
```

### Why this matters

Students often ask questions that have nuanced, context-dependent answers. A generic AI answer might be correct globally but wrong for a specific exam board, wrong for a student's current level, or might use concepts not yet covered. Teacher verification catches all of this.

---

## 2. Teacher Verification Panel

### Interface overview

```
VERIFICATION QUEUE                                    [12 pending]

Filter: [All Classes ▼] [All Subjects ▼] [All Difficulty ▼] [Newest First ▼]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Q: "Why does a ball thrown upward slow down before falling?"
   Asked by: Rahul S. (Class 10B) | Topic: Newton's Laws | 14 mins ago

AI Answer:
"When a ball is thrown upward, gravity acts as a constant downward 
force of approximately 9.8 m/s². This decelerates the ball at that 
rate until its velocity reaches zero at the peak, then it accelerates 
downward at the same rate. The ball slows down because the net force 
(gravity) acts opposite to the direction of motion..."

[✓ Approve as-is]  [✎ Edit & Approve]  [✗ Reject & Write Custom]  [Skip for now]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Q: "What is the formula for kinetic energy?"
   Asked by: Priya K. (Class 10B) | Topic: Work & Energy | 22 mins ago

AI Answer: "The kinetic energy formula is KE = ½mv² where m is mass 
in kilograms and v is velocity in m/s. The result is in Joules (J)."

SIMILAR QUESTION IN BANK: [View existing verified answer →]
[Use verified bank answer]  [✓ Approve this]  [✎ Edit]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Verification actions

| Action | Outcome | Time |
|--------|---------|------|
| Approve as-is | Answer released immediately to student. Added to verified bank. | ~5 seconds |
| Edit & Approve | Teacher modifies AI text. Edited version released. Bank gets edited version. | ~1–2 minutes |
| Reject & Write Custom | Teacher writes full answer from scratch. AI answer discarded. | ~3–5 minutes |
| Use bank answer | Existing verified answer released (for repeat questions). | ~5 seconds |
| Skip | Question stays in queue. AI attempts re-generation if >2 hours pass. | Instant |

### Smart queue prioritisation

The queue is not first-in-first-out. It prioritises by:
1. **Same question asked by multiple students** — one verification serves all
2. **High-urgency timing** — questions asked during active class session
3. **Student is stuck** — questions following multiple failed attempts
4. **Foundational concepts** — questions on prerequisite topics

### Batch verification mode

For common questions (definitions, formulae), teacher can:
- See all similar questions grouped together
- Verify one answer → apply to all similar questions at once
- Common Q&A pairs auto-populate the bank for future use

---

## 3. Student Experience During Verification Wait

Students are never left waiting in silence. While the answer is pending:

```
YOUR QUESTION: "Why does a ball thrown upward slow down before falling?"

[Thinking...] Your teacher is reviewing my answer. While you wait:

→ Try to write your own answer first. What do you think?
  [Your thinking space — type or save for your notes]

→ Related concept you can explore now:
  "What is the relationship between force and acceleration?"
  [Click to explore]

→ Hint: Think about what force acts on the ball at all times.
  [Show hint]

[Teacher has reviewed your answer] ← appears when approved
```

This "productive waiting" approach means students think before seeing the answer, which strongly reinforces learning.

---

## 4. Handwritten Assignment Workflow

### The philosophy

Writing on real paper is cognitively superior to typing for learning and retention:
- Handwriting activates deeper encoding in working memory (Mueller & Oppenheimer, 2014)
- Physical paper prevents copy-paste from AI
- Students develop examination-ready habits (all Indian board exams are paper-based)
- Teachers can assess effort, presentation, and thought process — not just correct answers

### Complete workflow

```
PHASE 1: ASSIGNMENT GIVEN
Teacher generates assignment (from verified Q&A bank)
System generates two PDFs automatically:
  • Student copy — questions only + answer boxes
  • Teacher copy — questions + model answers + marking scheme
Teacher distributes printed student copies (or students print themselves)
Assignment appears in student dashboard: "Offline Submission Due: [date]"

PHASE 2: STUDENT COMPLETES ON PAPER
Student receives printed assignment
Student writes answers on paper — no AI assistance during this phase
Student can view AI tutor for conceptual doubts (not for assignment answers)
Assignment deadline shown on student dashboard with countdown

PHASE 3: PHYSICAL SUBMISSION
Student submits handwritten paper to teacher
Teacher physically collects assignments as normal

PHASE 4: TEACHER DIGITAL VERIFICATION
Teacher scans/photographs completed papers (phone camera)
Upload to Lumina: [Scan Submissions] button in assignment panel
  → Lumina TrOCR + Gemini Vision extracts handwritten text
  → AI compares student answers against verified model answers
  → AI flags: ✓ Correct | ~ Partial | ✗ Incorrect | ? Unclear handwriting
Teacher reviews AI assessment
Teacher adjusts marks where AI got it wrong
Teacher adds comments per question
Teacher finalises marks with one click

PHASE 5: STUDENT FEEDBACK
Student receives:
  • Overall score
  • Per-question feedback (teacher's exact comments)
  • Model answer shown for questions they got wrong or partially right
  • "What to review" list — links to AI tutor for the concepts they missed
  • Mastery update — BKT/DKT model updated based on assignment performance
```

### Assignment submission upload interface

```
ASSIGNMENT: Newton's Laws — Problem Set 1
Class 10B | Due: 20 March 2026 | Submitted: 35/38 students

[Upload Scanned Papers]   Accepted formats: JPG, PNG, PDF

Uploaded:         [████████████░░] 28 papers processed

Processing status:
  ✓ Aarav S.        — 14/20  (AI assessed, pending your review)
  ✓ Priya K.        — 18/20  (AI assessed, pending your review)
  ✓ Rahul M.        — 9/20   (AI flagged: Q3 handwriting unclear)
  ✓ Sneha R.        — 20/20  (AI assessed, pending your review)
  ⏳ Ananya P.      — processing...
  ✗ Kiran B.        — not submitted (absent)

[Review All AI Assessments]  [Finalize Marks]  [Return to Students]
```

### AI handwriting assessment engine

```python
class HandwritingAssessor:
    def assess_submission(self, image_path: str, assignment_id: str) -> AssessmentResult:
        # Step 1: OCR with TrOCR for handwriting recognition
        extracted_text = self.trocr.transcribe(image_path)
        
        # Step 2: Segment into per-question answers
        answers = self.segmentor.split_by_question(
            text=extracted_text,
            assignment_template=self.get_template(assignment_id)
        )
        
        # Step 3: Compare each answer to verified model answer
        results = []
        for q_num, student_answer in answers.items():
            model_answer = self.qa_bank.get_model_answer(assignment_id, q_num)
            
            # Semantic similarity (not exact match)
            similarity = self.semantic_sim.compute(student_answer, model_answer)
            
            # LLM assessment for nuanced evaluation
            assessment = self.llm.assess_answer(
                question=model_answer.question,
                student_answer=student_answer,
                model_answer=model_answer.text,
                rubric=model_answer.rubric,
                max_marks=model_answer.marks
            )
            
            results.append(QuestionResult(
                question_number=q_num,
                student_answer=student_answer,
                awarded_marks=assessment.marks,
                max_marks=model_answer.marks,
                ai_feedback=assessment.feedback,
                correctness_level=assessment.level,  # correct/partial/incorrect
                confidence=assessment.confidence,
                flag_for_review=(assessment.confidence < 0.75)
            ))
        
        return AssessmentResult(questions=results, total_marks=sum(r.awarded_marks for r in results))
```

---

## 5. Teacher Feedback Interface for Physical Submissions

```
MARKING: Rahul M. — Assignment 1 — Newton's Laws

Q1 (3 marks): Define Newton's First Law.
  Student wrote: "An object stays still unless something pushes it."
  Model answer: "A body at rest or in uniform motion stays in that state unless acted upon by an external net force."
  
  AI assessment: Partial (1/3)  Confidence: 82%
  Your marks: [1] [2] [3]
  Your feedback: [Add feedback...]
  
Q2 (4 marks): Calculate acceleration if F=20N, m=5kg.
  Student wrote: "a = F/m = 20/5 = 4 m/s²"
  Model answer: "a = F/m = 20/5 = 4 m/s² (correct with units)"
  
  AI assessment: Correct (4/4)  Confidence: 97%
  Your marks: [1] [2] [3] [4]
  Your feedback: [Add feedback...] ← pre-filled: "Excellent! Full marks."
  
[Previous Student]                    Total: 12/20    [Save & Next Student]
```

---

## 6. AI Tutor Restriction During Physical Assignments

When a physical assignment is active:

```python
class AITutorMiddleware:
    def check_assignment_restriction(self, student_id: str, question: str) -> TutorMode:
        active_assignment = self.assignment_service.get_active_paper_assignment(student_id)
        
        if active_assignment and self.is_assignment_question(question, active_assignment):
            return TutorMode.RESTRICTED  # Block direct answers
        
        return TutorMode.NORMAL
    
    def handle_restricted_question(self, question: str, assignment: Assignment) -> str:
        return (
            "This question appears to be from your current assignment "
            f"'{assignment.title}', which you need to complete on paper. "
            "I can help you understand the underlying concept — "
            "what specifically about [concept] are you unsure of?"
        )
```

Students see:
```
ASSIGNMENT IN PROGRESS: Newton's Laws — Due 20 March

AI tutor is in study-help mode during your active assignment.
I can help you understand concepts but not give you the specific answers.

Ask me: "How does Newton's First Law work?" ✓
Ask me: "Explain inertia with an example" ✓
I won't answer: "What is the answer to Q3?" ✗
```

---

## 7. Database Schema — Verified Q&A System

```sql
-- Teacher verification queue
CREATE TABLE ai_answer_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id),
    teacher_id UUID REFERENCES users(id),
    course_id UUID REFERENCES courses(id),
    concept_id UUID REFERENCES knowledge_graph_nodes(id),
    
    student_question TEXT NOT NULL,
    ai_generated_answer TEXT NOT NULL,
    ai_confidence NUMERIC(4,3),
    ai_model_used VARCHAR(50),
    
    status VARCHAR(20) DEFAULT 'pending',  -- 'pending','approved','edited','rejected','custom'
    teacher_edited_answer TEXT,
    teacher_custom_answer TEXT,
    teacher_rejection_reason TEXT,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ,
    
    -- Release tracking
    released_to_student BOOLEAN DEFAULT FALSE,
    released_at TIMESTAMPTZ,
    
    -- For bank addition
    added_to_bank BOOLEAN DEFAULT FALSE,
    bank_question_id UUID REFERENCES question_bank(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    priority_score INTEGER DEFAULT 0
);

-- Physical assignment submissions
CREATE TABLE physical_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES assignments(id),
    student_id UUID REFERENCES users(id),
    teacher_id UUID REFERENCES users(id),
    
    submission_images TEXT[],  -- MinIO URLs for uploaded photos/scans
    ocr_extracted_text JSONB,  -- per-question extracted answers
    
    ai_assessment JSONB,       -- per-question AI marks and feedback
    teacher_assessment JSONB,  -- teacher's final marks and comments
    
    total_ai_marks NUMERIC(5,2),
    total_teacher_marks NUMERIC(5,2),
    max_marks NUMERIC(5,2),
    
    assessment_status VARCHAR(20) DEFAULT 'not_submitted',
    -- 'not_submitted','uploaded','ai_assessed','teacher_reviewed','finalised','returned'
    
    returned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 8. Notifications and Alerts

### Teacher notifications

| Event | Alert |
|-------|-------|
| 5+ questions pending verification | Push notification + dashboard badge |
| Same question asked 3+ times | "Trending question" alert — verify once, apply to all |
| Assignment submission upload complete | "Ready for your review: 35 papers" |
| Assignment deadline in 24 hours | "14 papers not yet submitted" |
| Student marked as struggling | "Arav has asked 6 questions on this topic and got 2/10" |

### Student notifications

| Event | Alert |
|-------|-------|
| Teacher verified their question | "Your answer is ready" push notification |
| Assignment marks released | "Your marks are available" |
| Teacher left a comment | "Your teacher commented on Q3" |
| Mastery milestone reached | "You've mastered Newton's Laws!" |

---

## 9. Quality Metrics Dashboard for Teachers

Teachers can see:

```
AI TUTOR QUALITY REPORT — March 2026

Questions verified this month:   142
  Approved as-is:               89  (62.7%)
  Edited before approving:      38  (26.8%)
  Rejected & custom written:    15  (10.5%)

Average verification time:       1 min 42 sec
Your verified Q&A bank size:    834 questions

Most asked topics:
  1. Newton's Laws               47 questions
  2. Work & Energy               31 questions
  3. Gravitation                 28 questions

Assignment performance:
  Class average:                68.4%
  Highest scorer:               Priya K. (94%)
  Most missed question:         Q5 (avg 1.2/4) — "Explain action-reaction pairs"
  Recommended re-teach:         [Newton's Third Law — click to generate remedial lesson]
```
