# 01 — Teacher Content Pipeline

**Module:** Content Ingestion & Course Generation
**Version:** 1.0
**Status:** Phase 1 — Priority Build

---

## Overview

The Teacher Content Pipeline allows any teacher to upload a **textbook PDF, syllabus document, or reading material** and receive a fully structured course — complete with organised lessons, a knowledge graph, lecture slides, lecture PDFs, and auto-generated assignments — within minutes.

This eliminates the single most time-consuming part of teaching: preparing materials. Research shows teachers spend 5+ hours per lesson on manual prep; this pipeline reduces that to under 15 minutes.

---

## 1. Textbook & Syllabus Upload

### What teachers can upload
- **PDF textbook** — any standard school or college textbook (CBSE, ICSE, NCERT, State Board, IB, Cambridge)
- **Syllabus document** — .pdf, .docx, or .txt files listing topics and learning objectives
- **Lecture notes** — teacher's own notes, handwritten or typed
- **Reference materials** — supplementary PDFs, articles, chapters

### How the upload works

```
Teacher uploads PDF/DOCX
        ↓
Gemini 1.5 Flash extracts text, structure, images, equations
        ↓
AI identifies chapters → topics → subtopics → concepts
        ↓
Concepts mapped to knowledge graph (Neo4j)
        ↓
Prerequisite relationships detected automatically
        ↓
Teacher reviews & approves structure (5 min max)
        ↓
Course scaffold generated
```

### Extraction capabilities
- **Text** — all body content, captions, footnotes
- **Tables** — auto-converted to structured data
- **Equations** — LaTeX extraction via Mathpix API or Gemini vision
- **Diagrams** — described and tagged (cannot reproduce copyrighted images)
- **Chapter structure** — headings used as natural course module boundaries

### Teacher review interface

After extraction, the teacher sees:

```
COURSE SCAFFOLD PREVIEW

Module 1: Introduction to Mechanics          [Edit] [Delete]
  ├── Lesson 1.1: What is Motion?            [Edit]
  ├── Lesson 1.2: Types of Motion            [Edit]
  └── Lesson 1.3: Scalars vs Vectors         [Edit]

Module 2: Newton's Laws                      [Edit] [Delete]
  ├── Lesson 2.1: First Law — Inertia        [Edit]
  ├── Lesson 2.2: Second Law — F=ma          [Edit]
  └── Lesson 2.3: Third Law — Action/React   [Edit]

[Reorder Modules] [Add Module] [Approve & Generate] [Edit Schedule]
```

Teachers can drag-and-drop to reorder, rename any lesson, split or merge modules, and add custom lessons not in the textbook.

### Difficulty level auto-detection

The system analyses extracted content and tags each lesson:
- **Foundational** — definition-heavy, introductory concepts
- **Intermediate** — application problems, worked examples
- **Advanced** — proofs, edge cases, cross-concept integration

This automatically feeds the differentiated content generation (beginner/intermediate/advanced versions per lesson).

---

## 2. Lecture PPT Generator

### What it produces

A teacher clicks "Generate Lecture PPT" on any lesson and receives a .pptx file with:

| Slide Type | Content |
|-----------|---------|
| Title slide | Lesson name, class, date, teacher name |
| Learning objectives | 3–5 bullets: "By the end of this lesson, students will be able to..." |
| Key concept slides | One concept per slide, with definition, example, and visual placeholder |
| Worked example slides | Step-by-step problem solving with annotations |
| Real-world connection slide | How this concept appears in everyday life |
| Summary slide | Key takeaways in bullet form |
| Quick quiz slide | 2–3 MCQs to check understanding (answers hidden by default) |
| Next lesson preview | What's coming next to create continuity |

### Customisation options

- **Branding** — teacher/school logo, colour scheme
- **Language** — slide language selection (22 Indian languages supported)
- **Difficulty level** — generate three versions (basic/standard/advanced)
- **Slide count** — choose 10, 15, or 20 slides
- **Exam board style** — CBSE/ICSE/IB/Cambridge formatting

### Technical implementation

```python
# pptx generation service (ml_service/generators/ppt_generator.py)

class PPTGenerator:
    def generate(self, lesson: Lesson, config: PPTConfig) -> str:
        # 1. Get lesson content from knowledge graph
        content = self.kg.get_lesson_content(lesson.id)
        
        # 2. LLM generates slide content
        slides = self.llm.generate_slides(
            content=content,
            num_slides=config.slide_count,
            difficulty=config.difficulty,
            language=config.language,
            exam_board=config.exam_board
        )
        
        # 3. python-pptx assembles the deck
        deck = self.assemble_pptx(slides, config.theme)
        
        # 4. Save to MinIO, return download URL
        return self.storage.save_and_get_url(deck, f"{lesson.id}_lecture.pptx")
```

### Database fields

```sql
CREATE TABLE generated_ppts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES lessons(id),
    teacher_id UUID REFERENCES users(id),
    difficulty_level VARCHAR(20),  -- 'basic', 'standard', 'advanced'
    language VARCHAR(10),
    slide_count INTEGER,
    storage_url TEXT,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    last_downloaded TIMESTAMPTZ,
    download_count INTEGER DEFAULT 0
);
```

---

## 3. Lecture PDF Generator

### What it produces

The PDF generator creates a **print-ready handout** from the same lesson content:

| Section | Content |
|---------|---------|
| Header | Lesson title, date, class, teacher |
| Learning objectives | Numbered list |
| Content sections | Each concept with definition, examples, diagrams |
| Worked problems | Fully solved examples with step annotations |
| Student notes area | Lined space for handwritten notes (important for offline students) |
| Key formulae box | Boxed reference section at end |
| Practice problems | 5–10 questions (answers on teacher version, blanks on student version) |
| Summary | Key points recap |
| Next lesson notice | Topic preview |

### Two versions generated simultaneously

- **Teacher version** — complete with answers, annotations, and teaching notes
- **Student version** — blanks for answers, space for notes

### PDF generation implementation

```python
# pdf_generator.py uses ReportLab + WeasyPrint

class PDFGenerator:
    def generate_lecture_pdf(self, lesson: Lesson, version: str) -> bytes:
        # Build structured content from knowledge graph
        content = self.build_content(lesson, include_answers=(version == 'teacher'))
        
        # Generate via WeasyPrint from HTML template
        html = self.template_engine.render('lecture_pdf.html', content=content)
        return weasyprint.HTML(string=html).write_pdf()
    
    def generate_both_versions(self, lesson_id: str) -> tuple[str, str]:
        lesson = self.kg.get_lesson(lesson_id)
        teacher_pdf = self.generate_lecture_pdf(lesson, 'teacher')
        student_pdf = self.generate_lecture_pdf(lesson, 'student')
        
        teacher_url = self.storage.save(teacher_pdf, f"{lesson_id}_teacher.pdf")
        student_url = self.storage.save(student_pdf, f"{lesson_id}_student.pdf")
        return teacher_url, student_url
```

---

## 4. Assignment Generator

### Assignment types supported

| Type | Description | Best for |
|------|-------------|----------|
| **Problem set** | 10–20 numbered questions across difficulty levels | Math, Physics, Chemistry |
| **Reading comprehension** | Passage + questions | English, Social Science |
| **Essay assignment** | Prompt + rubric | Any subject |
| **Project brief** | Multi-step project with milestones | Science, Social Science |
| **Worksheet** | Structured fill-in format | Primary school, practice sessions |
| **Lab report template** | Hypothesis → method → results → conclusion | Science |
| **Case study** | Scenario-based analysis questions | Commerce, Social Science |

### Assignment configuration panel

```
CREATE ASSIGNMENT

Title: ___________________
Type: [Problem Set ▼]
Topic: Newton's Laws (auto-detected from lesson)
Difficulty: [Mixed ▼]  (Easy 30% / Medium 50% / Hard 20%)
Number of questions: [15]
Include: [✓] Diagrams  [✓] Worked examples  [ ] Hint section
Submission: [✓] Physical paper  [ ] Digital  [✓] Both

AI generates based on YOUR verified Q&A bank? [✓] Yes (recommended)
Include unseen questions? [ ] Yes — requires your review

Deadline: [Date picker]
Marks: [___ total]   Time limit: [___ minutes]

[Preview Assignment] [Generate] [Save as Template]
```

### Assignment generation logic

```python
class AssignmentGenerator:
    def generate(self, config: AssignmentConfig) -> Assignment:
        # Step 1: Pull verified questions from teacher's Q&A bank
        verified_qs = self.qa_bank.get_verified(
            topic_id=config.topic_id,
            difficulty=config.difficulty_distribution,
            types=config.question_types,
            teacher_id=config.teacher_id
        )
        
        # Step 2: If more questions needed, AI generates new ones
        if len(verified_qs) < config.num_questions:
            new_qs = self.ai.generate_questions(
                topic=config.topic,
                count=config.num_questions - len(verified_qs),
                difficulty=config.difficulty_distribution
            )
            # New AI questions go to teacher's verification queue first
            self.qa_bank.queue_for_verification(new_qs, teacher_id=config.teacher_id)
        
        # Step 3: Assemble assignment
        return self.assembler.build(verified_qs, config)
```

### Assignment PDF output

Every assignment generates two PDFs automatically:
1. **Student copy** — questions only, answer spaces proportional to expected length, name/date/class fields
2. **Teacher/answer key** — same questions with model answers, marking scheme, common mistakes to watch for, and Bloom's taxonomy tag per question

---

## 5. Question Bank Builder

This is the central repository that powers all AI-generated content and assignments.

### How the question bank grows

```
Source 1: Teacher uploads textbook
          → AI extracts + generates questions
          → Teacher verifies each one
          → Verified questions enter the bank

Source 2: Teacher manually adds questions
          → Directly enters bank as verified

Source 3: AI generates during assignment creation
          → Enters teacher's verification queue
          → After approval → enters bank

Source 4: AI tutor generates during student session
          → Enters teacher's verification queue (see Doc 02)
          → After approval → enters bank for future use
```

### Question bank schema

```sql
CREATE TABLE question_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES users(id),
    institution_id UUID REFERENCES institutions(id),
    course_id UUID REFERENCES courses(id),
    concept_id UUID REFERENCES knowledge_graph_nodes(id),
    
    -- Question content
    question_text TEXT NOT NULL,
    question_type VARCHAR(30), -- 'mcq', 'short', 'long', 'fill_blank', 'essay', 'diagram'
    difficulty_level NUMERIC(3,2), -- 0.00 to 1.00 (IRT-based)
    blooms_level VARCHAR(20), -- 'remember','understand','apply','analyse','evaluate','create'
    
    -- Answer content
    model_answer TEXT,
    answer_key JSONB, -- for MCQ options and correct answers
    marking_rubric JSONB,
    common_mistakes TEXT[],
    
    -- Verification
    verification_status VARCHAR(20) DEFAULT 'pending', -- 'pending','verified','rejected'
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    -- Metadata
    source VARCHAR(30), -- 'manual','textbook_upload','ai_tutor','ai_generated'
    times_used INTEGER DEFAULT 0,
    avg_student_score NUMERIC(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6. Complete Teacher Workflow Diagram

```
STEP 1: UPLOAD
Teacher uploads textbook PDF (NCERT Class 10 Science)
                    ↓
AI extracts 8 chapters → 42 topics → 180+ concepts
Teacher reviews scaffold (5–10 mins)
Teacher approves structure
                    ↓
STEP 2: GENERATE MATERIALS
For each lesson, teacher clicks:
  [Generate PPT] → receives slides in 90 seconds
  [Generate Student PDF] → printable handout in 60 seconds
  [Generate Teacher PDF] → complete with answers
  [Generate Assignment] → pulls from verified Q&A bank
                    ↓
STEP 3: SCHEDULE & PUBLISH
Teacher sets lesson schedule, assignment deadlines
Materials published to student dashboard
                    ↓
STEP 4: ONGOING ENRICHMENT
As students interact with AI tutor → new Q&As generated
Teacher verifies Q&As → bank grows
Next month's assignments are richer, more precise
```

---

## 7. API Endpoints

### Content Pipeline APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/teacher/upload/textbook` | Upload PDF for processing |
| GET | `/api/teacher/upload/{upload_id}/status` | Check processing status |
| GET | `/api/teacher/upload/{upload_id}/scaffold` | Get extracted course scaffold |
| PUT | `/api/teacher/upload/{upload_id}/scaffold` | Teacher edits scaffold |
| POST | `/api/teacher/upload/{upload_id}/approve` | Approve and create course |
| POST | `/api/teacher/courses/{course_id}/lessons/{lesson_id}/generate-ppt` | Generate PPT |
| POST | `/api/teacher/courses/{course_id}/lessons/{lesson_id}/generate-pdf` | Generate PDFs |
| POST | `/api/teacher/courses/{course_id}/lessons/{lesson_id}/generate-assignment` | Generate assignment |
| GET | `/api/teacher/question-bank` | List all verified questions |
| GET | `/api/teacher/question-bank/pending` | Get questions awaiting verification |
| POST | `/api/teacher/question-bank/{id}/verify` | Verify a question |
| POST | `/api/teacher/question-bank/{id}/reject` | Reject with reason |

---

## 8. Edge Cases and Error Handling

| Scenario | Handling |
|----------|---------|
| PDF is scanned image (not text) | OCR via Gemini vision before extraction |
| PDF is in regional language | IndicTrans translates, then processes |
| Textbook has DRM protection | Cannot process; ask teacher to upload unlocked version |
| Equations are images not text | Gemini vision describes equation; Mathpix API converts to LaTeX |
| Upload is very large (>100MB) | Chunk-based processing with progress indicator |
| AI extraction quality is poor | Teacher can manually correct scaffold before approving |
| Q&A generation fails | Falls back to template-based questions from content bank |
