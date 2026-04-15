# Assessment Agent (Course Generation)

> **File:** `03-agents/01-course-generation-agent.md`
> **Related:** [[03-agents/00-agents-index]], [[05-prompts/01-course-generation-prompt]], [[08-features/02-ai-course-builder]]
> **Last Updated:** 2026-04-15

The Assessment Agent generates quizzes, assignment rubrics, and learning materials (PPT, PDF) from course content. All outputs go to Teacher review before any student interaction.

---

## Purpose

Automate the creation of pedagogically sound assessment material (MCQs, short-answer questions, rubrics) and formatted learning materials (slide decks, reading notes) from uploaded lecture PDFs and syllabi.

## Model

**Gemini 1.5 Flash** (via Google Generative AI SDK)

## Trigger

Teacher clicks "Generate Quiz" or "Generate Material" in the course management panel. FastAPI dispatches as a background task.

## Input Schema

```json
{
  "institution_id": "uuid",
  "course_id": "uuid",
  "teacher_id": "uuid",
  "task_type": "quiz|assignment|ppt|pdf_notes",
  "source_content": {
    "lecture_chunk_ids": ["string"],
    "syllabus_topic": "string",
    "difficulty_level": "easy|medium|hard|mixed"
  },
  "quiz_config": {
    "num_questions": "integer (1–50)",
    "question_types": ["mcq", "short_answer", "true_false"],
    "bloom_level": "remember|understand|apply|analyze|evaluate|create"
  },
  "material_config": {
    "num_slides": "integer (optional, for ppt)",
    "include_examples": "boolean",
    "include_diagrams_placeholder": "boolean"
  }
}
```

## Output Schema

**For quiz generation:**
```json
{
  "questions": [
    {
      "question_text": "string",
      "question_type": "mcq|short_answer|true_false",
      "options": ["string"] ,
      "correct_answer": "string",
      "explanation": "string",
      "bloom_level": "string",
      "knowledge_component_id": "uuid|null",
      "difficulty_score": "float (0.0–1.0)"
    }
  ],
  "generation_metadata": {
    "source_chunks_used": ["string"],
    "estimated_completion_time_minutes": "integer",
    "coverage_notes": "string"
  }
}
```

**For PPT/PDF generation:**
- File is written to MinIO bucket `lumina-generated`
- Output schema contains the MinIO object key for Teacher download

## How Output Is Used

1. Questions are inserted into `assessment_question_bank` with `status = 'PENDING_REVIEW'`
2. Teacher receives notification "Your quiz draft is ready for review"
3. Teacher reviews each question — can edit, delete, or approve
4. Only approved questions can be assigned to students
5. Generated PPTs/PDFs are accessible via pre-signed MinIO URL — Teacher downloads, reviews, and publishes

## Error Handling

| Error | Action |
|---|---|
| Gemini API timeout | Retry once; mark generation job as FAILED; notify Teacher |
| Insufficient source content | Return partial generation with `coverage_notes` warning |
| Guardian blocks output | Discard generation; log to `guardian_block_log`; notify Teacher |

## Latency Profile

| Task | Expected time |
|---|---|
| 10-question quiz | 8–15s (background) |
| 20-slide PPT | 15–30s (background) |
| PDF reading notes | 10–20s (background) |
