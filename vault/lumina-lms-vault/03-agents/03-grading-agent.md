# Grading Pipeline — TrOCR + Assessment Agent

> **File:** `03-agents/03-grading-agent.md`
> **Related:** [[03-agents/00-agents-index]], [[08-features/05-assessments-quizzes]]
> **Last Updated:** 2026-04-15

The handwritten assignment grading pipeline is a six-stage process: image upload → TrOCR transcription → Assessment Agent rubric evaluation → Teacher review → mark release.

---

## Purpose

Enable students to submit handwritten assignments by photographing their answer sheets, while automating transcription and rubric-based grading — with mandatory teacher review before any marks or feedback reach the student.

## Six-Stage Pipeline

### Stage 1 — Upload
Student uploads image file (JPEG/PNG) via the assignment submission UI. Backend validates file type and size (max 10MB per page, max 20 pages), generates a pre-signed MinIO PUT URL, and stores the object key in `handwritten_submissions.image_path`.

### Stage 2 — TrOCR Transcription
AI Engine loads `microsoft/trocr-large-handwritten` (558M parameters). Input: image file from MinIO. Output: raw transcription text. CER on IAM dataset: 2.89%. The transcription is stored in `handwritten_submissions.transcription`.

### Stage 3 — Segmentation
Transcription is split into individual answer segments by matching question numbering patterns (e.g., "Q1.", "1)", "Answer 1:"). Each segment is aligned to a rubric question.

### Stage 4 — Assessment Agent Grading
Gemini 1.5 Flash receives:
- The transcribed answer for each question
- The rubric (marking scheme from `assignment_rubrics`)
- The maximum marks per question

Returns:
```json
{
  "question_gradings": [
    {
      "question_id": "uuid",
      "awarded_marks": "float",
      "max_marks": "float",
      "feedback": "string",
      "confidence": "float"
    }
  ],
  "total_awarded": "float",
  "overall_feedback": "string",
  "grading_confidence": "float"
}
```

### Stage 5 — Teacher Review Queue
The grading result lands in `handwritten_grading_queue` with `status = 'PENDING'`. Teacher sees:
- Transcription text alongside original image scan (side by side)
- AI-suggested marks and feedback per question
- Option to: APPROVE as-is, EDIT marks/feedback, or REJECT (return to student for resubmission)

### Stage 6 — Mark Release
On Teacher APPROVE, marks and feedback are written to `student_grades` and become visible to the student. The student is notified via the platform notification system.

## Input Schema (to AI Engine)

```json
{
  "submission_id": "uuid",
  "institution_id": "uuid",
  "assignment_id": "uuid",
  "student_id_hash": "string",
  "image_minio_keys": ["string"],
  "rubric": [
    {
      "question_id": "uuid",
      "question_text": "string",
      "max_marks": "float",
      "marking_criteria": "string"
    }
  ]
}
```

## Error Handling

| Stage | Error | Action |
|---|---|---|
| Upload | File too large | Reject with 400; prompt student to compress/split |
| TrOCR | Illegible handwriting (confidence < 0.4) | Flag submission as `MANUAL_REVIEW`; Teacher receives original scan only |
| Segmentation | Cannot identify question boundaries | Pass full transcription to Teacher without segmentation |
| Grading | Gemini timeout | Retry once; mark as FAILED; Teacher grades manually |
| Teacher review | Teacher rejects | Student notified to resubmit; original submission archived |

## Latency Profile (background, not blocking)

| Stage | Time |
|---|---|
| TrOCR per page | 2–5s |
| Grading (Gemini) | 5–10s |
| Total (5-page submission) | 20–40s |
