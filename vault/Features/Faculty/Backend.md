# Faculty Experience: Backend Architecture

The Faculty backend handles complex administrative flows, classroom orchestration, and a heavy-duty OCR digitization pipeline for physical assignments.

## 🛤 Code Traceability
- **Primary Router**: [teacher.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/routers/teacher.py)
- **HOD Router**: [hod.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/routers/hod.py)
- **OCR Service**: [ocr_service.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/services/ocr_service.py)
- **Key Functions**:
    - `get_teacher_dashboard()`: Aggregates class headcount, pending grading, and at-risk alerts.
    - `process_physical_submission()`: Digitizes and grades handwritten work ([teacher.py:L472](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/routers/teacher.py#L472)).
    - `digitize_image()`: Tenders images to TrOCR model ([ocr_service.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/services/ocr_service.py)).
    - `grade_submission()`: LLM-based verification of OCR text against rubric.

## 📄 OCR Digitization Pipeline (Verifiable Logic)
The OCR pipeline is designed for high-accuracy digitization of student handwriting.

1.  **Ingestion**: Receives a `submission_id` via [teacher.py:L472](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/routers/teacher.py#L472).
2.  **Digitization**: iterates through images and calls `ocr_service.digitize_image()`.
    - Supports `microsoft/trocr-large-handwritten` with a **0.70 confidence threshold**.
3.  **Grading**: Extracted text is sent to `grader_service.grade_submission()`.
    - **Mistral-7B-Instruct-v0.3** is used to evaluate the semantic correctness of the digitized text against the assignment rubric.
4.  **Result Persistence**: Updates `assignment_submissions` with `ocr_extracted_text` and `total_ai_marks`.

## 🛡 Verification Queue
Located in `ai_governance.py`, this queue allows teachers to override AI decisions:
- **Status**: `graded` status allows teacher review before final publishing to the student dashboard.
- **Traceable Logic**: [teacher.py:L501](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/routers/teacher.py#L501) sets the initial `graded` status.

## 📊 Dashboard Orchestration Flow
1. **Frontend** calls `GET /api/teacher/dashboard`.
2. **Logic Helpers**:
    - `_build_assignment_views`: Links assignments to courses, batches, and programs for a multi-tenant view.
    - `check_teacher_role`: Enforces RBAC permissions ([teacher.py:L37](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/routers/teacher.py#L37)).
3. **Headcount**: Dynamic join across `student_enrollments` to determine active headcount per class.

## ⚠️ Failure Points & Risk Analysis

### Failure Points
- **OCR Confidence Misclassification**: Handwriting with confidence `< 0.70` triggers manual audit. If the volume of low-confidence uploads spikes, it creates an operational bottleneck for faculty.
- **Rubric Mismatch**: If the rubric provided to the LLM grader isn't semantically aligned with the assignment, students receive incorrect marks.
- **Heavy Image Processing**: Simultaneous uploads of high-resolution images can stress the server's CPU/GPU resources during digitization.
- **HOD Approval Bottleneck**: Institutional policies requiring HOD approval for all grades can lead to "Status Deadlock" if the HOD is inactive.

### Risk Level: MEDIUM
- **Reasoning**: While Faculty tools are critical for academic delivery, failures here are asynchronous and can be resolved through manual overrides. The "Model Drift" risk for OCR is the primary technical concern.

