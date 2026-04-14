# Handwritten Assignment System
## AI-powered grading with TrOCR + LangChain + HuggingFace + Teacher Override

---

## Architecture at a glance

```
Student uploads scan/photo
        │
        ▼
[Image Quality Gate] ─── fail ──→ "Please re-scan" (returned to student)
        │ pass
        ▼
[Pre-processing] — deskew, denoise, adaptive threshold
        │
        ▼
[Question Segmentation] — horizontal projection profile
        │
        ▼
[TrOCR] — microsoft/trocr-large-handwritten  ← HuggingFace
  │  confidence < 0.70 → flagged for teacher
        │
        ▼
[LangChain chain] — rubric + OCR text → Mistral-7B-Instruct → JSON score
        │  HuggingFace Inference API (free)  or  OpenAI (fallback)
        │
        ▼
[Teacher Dashboard] — see scan | OCR | AI score | Accept / Override / Reject
        │
        ▼
[Grade Published to LMS]
```

---

## Quick start (local dev, no GPU needed)

### 1. Clone and configure
```bash
cd backend
cp .env.example .env
# Edit .env — add your HuggingFace token at minimum
```

### 2. Get your FREE HuggingFace token
1. Go to https://huggingface.co/settings/tokens
2. Create a token with `read` scope (free, no credit card)
3. Paste it as `HUGGINGFACE_API_TOKEN` in `.env`

### 3. Start with Docker Compose (easiest)
```bash
docker compose up --build
# API: http://localhost:8000
# Frontend: http://localhost:5173
# Docs: http://localhost:8000/docs
```

### 4. Or run directly
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# In another terminal:
cd frontend
npm install && npm run dev
```

---

## API Quick Reference

### Create an assignment (teacher)
```http
POST /api/assignments
{
  "title": "Physics Chapter 3 Test",
  "teacher_id": "teacher-123",
  "questions": [
    {
      "number": 1,
      "text": "Explain Newton's second law.",
      "max_marks": 10,
      "rubric": {
        "criteria": [
          {"label": "Formula F=ma", "marks": 3, "description": "States the formula correctly"},
          {"label": "Explanation",  "marks": 5, "description": "Explains proportionality"},
          {"label": "Example",      "marks": 2, "description": "Gives a real-world example"}
        ],
        "keywords": ["force", "mass", "acceleration", "proportional"],
        "sample_answer": "Newton's second law states that the net force on an object equals its mass times acceleration (F=ma)..."
      }
    }
  ]
}
```

### Upload student submission
```http
POST /api/submissions/upload?assignment_id=XXX&student_id=YYY
Content-Type: multipart/form-data
file: <image or PDF>
```

### Poll processing status
```http
GET /api/submissions/{id}/status
# Returns: { "status": "ai_evaluated", "processing_log": [...] }
```

### Get teacher review data
```http
GET /api/submissions/{id}/review
# Returns full payload: scan crops, OCR text, AI scores, reasoning
```

### Teacher accepts AI score
```http
PATCH /api/submissions/{id}/questions/{sq_id}/accept
```

### Teacher overrides
```http
PATCH /api/submissions/{id}/questions/{sq_id}/override
{
  "teacher_score": 7.5,
  "teacher_feedback": "Good attempt but missed the vector nature of force.",
  "override_reason": "Student's diagram clarifies understanding not captured by OCR"
}
```

### Finalize and publish
```http
POST /api/submissions/{id}/finalize
```

---

## OCR accuracy tips (the most important section)

| Situation | What to tell students |
|---|---|
| Phone camera | Use good lighting, hold steady, flatten paper |
| Pencil | Avoid — too light for OCR. Use dark blue/black pen |
| Question labels | Write "Q1:", "Q2:" at the start of each answer |
| Spacing | Leave a blank line between questions |
| Diagrams | Draw diagrams in a clearly labelled separate box |

### TrOCR model choice
| Model | Speed | Accuracy | Use when |
|---|---|---|---|
| `trocr-base-handwritten` | Fast (2s/page) | Good | High volume, GPU available |
| `trocr-large-handwritten` | Slow (8s/page) | Best | **Default — production** |
| HF Inference API | Network-bound | Same as large | No GPU, dev/small load |

---

## LLM / Grading model choice

### Free options (HuggingFace Inference API)
| Model | Quality | Notes |
|---|---|---|
| `mistralai/Mistral-7B-Instruct-v0.3` | ⭐⭐⭐⭐ | **Recommended default** |
| `HuggingFaceH4/zephyr-7b-beta` | ⭐⭐⭐ | Very reliable, always available |
| `meta-llama/Meta-Llama-3-8B-Instruct` | ⭐⭐⭐⭐⭐ | Best quality, needs HF approval |

### Paid fallback
| Model | Quality | Cost |
|---|---|---|
| `gpt-4o-mini` | ⭐⭐⭐⭐⭐ | ~$0.001 per question |

---

## How to improve OCR results beyond TrOCR

### Option A: Pre-process harder (already in code)
Already implemented: deskew, denoise, adaptive threshold, contrast, sharpen.

### Option B: Multi-model voting (easy 5% gain, ~10 lines of code)
Run TrOCR + PaddleOCR on the same segment, pick the result with higher confidence.
PaddleOCR is great for printed + mixed text.

### Option C: Fine-tune TrOCR on your students' handwriting
Collect 200+ correct (image, text) pairs from your school.
Fine-tune takes ~2 hours on a free Colab GPU.
This is your #1 accuracy unlock for a specific school/subject.

```python
# Fine-tuning skeleton (run in Colab)
from transformers import Seq2SeqTrainer, Seq2SeqTrainingArguments
# ... see HuggingFace TrOCR fine-tuning guide
```

### Option D: Better segmentation with LayoutLMv3
For complex multi-column or table-based answer sheets, replace the
projection-profile segmenter with LayoutLMv3 document understanding.
Add to requirements: `pip install layoutparser`

---

## Extending the system

### Add Celery for heavy async load
```python
# In pipeline_service.py, replace background_tasks with:
from celery import Celery
app = Celery("tasks", broker=settings.redis_url)

@app.task
def process_submission_task(submission_id: str):
    import asyncio
    asyncio.run(process_submission(submission_id))
```

### Add RAG for better rubric matching
Use `sentence-transformers` to embed student answers and compare
against a vector store of exemplary answers at each mark level.
This gives the LLM much better grounding for borderline answers.

```python
from sentence_transformers import SentenceTransformer
from langchain_community.vectorstores import FAISS

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
# ... embed rubric examples, retrieve closest at eval time
```

---

## File structure
```
handwritten-assignment-system/
├── backend/
│   ├── app/
│   │   ├── api/routes.py           # All FastAPI endpoints
│   │   ├── core/config.py          # Settings from .env
│   │   ├── core/database.py        # Async SQLAlchemy setup
│   │   ├── models/models.py        # DB models (Assignment, Submission, etc.)
│   │   └── services/
│   │       ├── ocr_service.py      # TrOCR + preprocessing + segmentation
│   │       ├── evaluation_service.py  # LangChain + HuggingFace grading chain
│   │       └── pipeline_service.py # Orchestrates the full pipeline
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   └── src/
│       └── TeacherReviewDashboard.jsx  # Complete React dashboard
└── docker-compose.yml
```
