# Handwriting Analysis Project — Full Documentation

> **Part of the Lumina AI Learning Platform**
> Author: Chepuri Hari Kiran
> Date: March 2026
> Version: 0.1.0

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Goals & Objectives](#2-goals--objectives)
3. [System Architecture](#3-system-architecture)
4. [Tech Stack](#4-tech-stack)
5. [Project Structure](#5-project-structure)
6. [Frontend — Next.js Web App](#6-frontend--nextjs-web-app)
7. [Backend API Routes](#7-backend-api-routes)
8. [ML Service — Python FastAPI](#8-ml-service--python-fastapi)
9. [Database Design](#9-database-design)
10. [How It Works — Step by Step](#10-how-it-works--step-by-step)
11. [Setup & Installation Guide](#11-setup--installation-guide)
12. [Environment Variables](#12-environment-variables)
13. [Key Dependencies](#13-key-dependencies)
14. [Future Improvements](#14-future-improvements)

---

## 1. Project Overview

The **Handwriting Analysis Project** is an AI-powered web application that allows users to upload handwritten documents (in PDF format) and receive instant automated analysis including:

- **Transcription** — the handwritten content is extracted and converted to digital text
- **Scoring** — the document is given a score from 0 to 100 based on clarity, legibility, and content quality
- **Feedback** — constructive, AI-generated feedback to help the writer improve

The application is a standalone prototype module within the larger **Lumina AI Learning** platform — an educational AI system designed to assist students and teachers with learning analytics, adaptive assessments, and AI-based grading.

The project demonstrates two complementary approaches to handwriting analysis:

1. **Cloud AI Path** — Using Google Gemini 1.5 Flash (vision model) via the Next.js API layer for fast, production-ready analysis.
2. **Local ML Path** — A Python FastAPI service using Microsoft's TrOCR model for local, on-device handwriting recognition and semantic scoring.

---

## 2. Goals & Objectives

| Goal | Description |
|------|-------------|
| Automate Grading | Replace manual handwriting grading with AI-powered scoring |
| Transcription | Convert handwritten text to digital format automatically |
| Feedback Loop | Provide students with actionable feedback on their writing quality |
| History Tracking | Store all past analyses so students and teachers can review progress |
| Modular ML | Support fine-tunable local ML models (TrOCR) as an alternative to cloud AI |
| Educational Research | Serve as a learning project demonstrating full-stack AI app development |

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      User (Browser)                             │
│                 Uploads handwritten PDF                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP POST (multipart/form-data)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              Next.js 16 Application (Port 3000)                 │
│                                                                 │
│  ┌──────────────────────┐    ┌────────────────────────────┐    │
│  │  Frontend (React)    │    │  API Routes (Next.js)      │    │
│  │  page.tsx            │───▶│  POST /api/analyze         │    │
│  │  - File upload UI    │    │  GET  /api/history         │    │
│  │  - Results display   │    └───────────┬────────────────┘    │
│  │  - History table     │               │                      │
│  └──────────────────────┘               │                      │
└────────────────────────────────────────┬────────────────────────┘
                                         │
              ┌──────────────────────────┼──────────────────────┐
              │                          │                       │
              ▼                          ▼                       │
┌─────────────────────┐   ┌─────────────────────────┐          │
│  Google Gemini API  │   │  SQLite Database         │          │
│  (gemini-1.5-flash) │   │  (Prisma ORM)            │          │
│                     │   │                           │          │
│  • Vision analysis  │   │  Table: AnalysisResult   │          │
│  • OCR / transcribe │   │  - id (UUID)             │          │
│  • Score & feedback │   │  - filename              │          │
└─────────────────────┘   │  - transcribedText       │          │
                          │  - score                  │          │
                          │  - feedback               │          │
                          │  - createdAt              │          │
                          └─────────────────────────┘          │
                                                                 │
┌───────────────────────────────────────────────────────────────┐│
│         ML Service — Python FastAPI (Port 9000)               ││
│                                                               ││
│  ┌─────────────────────┐   ┌──────────────────────────────┐  ││
│  │  TrOCR Model        │   │  QA Scorer                   │  ││
│  │  (microsoft/trocr-  │   │  (sentence-transformers)     │  ││
│  │   base-handwritten) │   │  - Semantic similarity       │  ││
│  │  • Image → Text OCR │   │  - Grade submission answers  │  ││
│  └─────────────────────┘   └──────────────────────────────┘  ││
│                                                               ││
│  Endpoints:                                                   ││
│  POST /analyze    — Run TrOCR + optional answer scoring       ││
│  GET  /health     — Check model & GPU status                  ││
└───────────────────────────────────────────────────────────────┘│
```

---

## 4. Tech Stack

### Frontend & Full-Stack Framework

| Technology | Version | Role |
|-----------|---------|------|
| Next.js | 16.0.10 | Full-stack React framework (App Router) |
| React | 19.2.1 | UI library |
| TypeScript | ^5 | Type-safe JavaScript |
| Tailwind CSS | ^4 | Utility-first styling |

### AI & Machine Learning

| Technology | Version | Role |
|-----------|---------|------|
| Google Generative AI SDK | ^0.24.1 | Interface to Gemini 1.5 Flash |
| Gemini 1.5 Flash | (API) | Vision AI for OCR + analysis |
| Microsoft TrOCR | `trocr-base-handwritten` | Local handwriting OCR model (HuggingFace) |
| SentenceTransformers | latest | Semantic similarity scoring |
| PyTorch | latest | Deep learning framework for TrOCR |
| Transformers (HuggingFace) | latest | Model loading & inference |

### Database & ORM

| Technology | Version | Role |
|-----------|---------|------|
| Prisma | ^5.22.0 | ORM for database access |
| SQLite | (via Prisma) | Lightweight local database |

### Python ML Service

| Technology | Version | Role |
|-----------|---------|------|
| FastAPI | latest | Python web framework for ML API |
| Uvicorn | latest | ASGI server |
| Pillow | latest | Image processing |
| scikit-learn | latest | ML utilities |
| pandas | latest | Data handling |
| jiwer | latest | Word Error Rate calculation |
| kaggle | latest | Dataset downloading |

---

## 5. Project Structure

```
Handwriting_Analysis_Project/
│
├── src/                                # Next.js source code
│   ├── app/
│   │   ├── page.tsx                   # Main React UI (upload, results, history)
│   │   ├── layout.tsx                 # App layout wrapper
│   │   ├── globals.css                # Global styles (Tailwind)
│   │   └── api/
│   │       ├── analyze/
│   │       │   └── route.ts           # POST /api/analyze — AI analysis endpoint
│   │       └── history/
│   │           └── route.ts           # GET /api/history — fetch past analyses
│   ├── lib/
│   │   └── db.ts                      # Prisma client singleton
│   └── generated/
│       └── client/                    # Auto-generated Prisma types
│
├── ml_service/                         # Python ML service (standalone)
│   ├── api/
│   │   └── server.py                  # FastAPI app with /analyze and /health
│   ├── models/
│   │   └── train_trocr.py             # TrOCR model training script
│   ├── logic/
│   │   └── scoring.py                 # QAScorer — semantic similarity grading
│   ├── data/
│   │   └── download_datasets.py       # Dataset downloader (HuggingFace + Kaggle)
│   └── requirements.txt               # Python dependencies
│
├── prisma/
│   ├── schema.prisma                   # Database schema definition
│   ├── dev.db                          # SQLite database (development)
│   └── migrations/                     # Database migration history
│
├── public/                             # Static assets (SVGs)
├── package.json                        # Node.js dependencies & scripts
├── tsconfig.json                       # TypeScript configuration
├── next.config.ts                      # Next.js configuration
├── postcss.config.mjs                  # PostCSS/Tailwind config
├── eslint.config.mjs                   # ESLint config
└── list-models.js                      # Utility to list Gemini models
```

---

## 6. Frontend — Next.js Web App

The frontend is a single-page React application (`src/app/page.tsx`) built with the Next.js App Router.

### User Interface Sections

**1. Header**
Displays the app title "Handwriting Analyst" and a subtitle describing the purpose.

**2. New Analysis Section**
A drag-and-drop file upload area that accepts PDF files only. When a file is selected, it shows the filename with a green checkmark. A submit button triggers the analysis — it is disabled until a file is selected, and shows a loading state ("Analyzing...") during processing.

**3. Results Section**
Shown only after a successful analysis. Displays in a two-column grid:
- Left column: The transcribed text in a monospace code block
- Right column: The score (color-coded: green >80, yellow >50, red otherwise) and constructive feedback text

**4. History Section**
A table showing all previous analyses fetched from the database, ordered newest first. Columns include: Date, Filename, Score (color-coded badge), and a 50-character preview of the transcribed text.

### State Management

The component uses React hooks:

```typescript
const [file, setFile] = useState<File | null>(null);       // selected file
const [loading, setLoading] = useState(false);             // loading spinner
const [result, setResult] = useState<AnalysisResult | null>(null);  // latest result
const [history, setHistory] = useState<AnalysisResult[]>([]);       // past analyses
```

History is auto-fetched on component mount via `useEffect`, and is refreshed after each new analysis.

---

## 7. Backend API Routes

### `POST /api/analyze`

**File:** `src/app/api/analyze/route.ts`

**Purpose:** Accepts a handwritten PDF, sends it to Google Gemini for analysis, saves results to the database, and returns the structured result.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` (PDF file)

**Processing Steps:**
1. Extract the uploaded file from the FormData
2. Convert the file to a Base64-encoded buffer
3. Initialize Gemini 1.5 Flash model
4. Send the image/PDF with a structured prompt requesting: transcription, score (0-100), and feedback in JSON format
5. Parse the JSON response (stripping markdown code fences if present)
6. Save the result to the SQLite database via Prisma
7. Return the saved database record as JSON

**Response (200 OK):**
```json
{
  "id": "uuid-string",
  "filename": "homework.pdf",
  "transcribedText": "The quick brown fox jumps over the lazy dog...",
  "score": 87,
  "feedback": "Clear and well-formed letters. Minor inconsistency in letter spacing.",
  "createdAt": "2026-03-14T10:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` — no file was uploaded
- `500 Internal Server Error` — AI parsing failed or database error

---

### `GET /api/history`

**File:** `src/app/api/history/route.ts`

**Purpose:** Returns all past analysis records from the database, ordered by most recent first.

**Response (200 OK):**
```json
[
  {
    "id": "...",
    "filename": "notes.pdf",
    "transcribedText": "...",
    "score": 74,
    "feedback": "...",
    "createdAt": "2026-03-13T09:30:00.000Z"
  },
  ...
]
```

---

## 8. ML Service — Python FastAPI

The `ml_service/` directory contains a standalone Python service that provides a more powerful, locally-running alternative to the cloud Gemini approach.

### `api/server.py` — FastAPI Application

**Endpoint: `POST /analyze`**

Accepts a handwritten image file and an optional `answer_key` string.

1. Saves the uploaded image to a temporary file
2. Passes it through the TrOCR model to extract text
3. If `answer_key` is provided, calculates a semantic similarity score using `QAScorer`
4. Cleans up the temp file and returns results

**Endpoint: `GET /health`**

Returns the service health status and whether a GPU is available.

```json
{ "status": "healthy", "gpu": false }
```

### `models/train_trocr.py` — TrOCR Training Script

Provides the scaffolding to fine-tune Microsoft's `trocr-base-handwritten` model on a custom dataset.

Key configuration:
- Base model: `microsoft/trocr-base-handwritten`
- Batch size: 4
- Epochs: 3
- Learning rate: 5e-5
- Output: `models/fine_tuned_trocr/`
- Beam search with `num_beams=4`, `early_stopping=True`

The `HandwritingDataset` class wraps a pandas DataFrame with `file_name` and `text` columns, processing images through the TrOCR processor and tokenizing labels for the decoder.

### `logic/scoring.py` — Semantic Similarity Scorer

The `QAScorer` class uses `sentence-transformers` (model: `all-MiniLM-L6-v2`) to compare the semantic similarity between extracted handwriting text and an expected answer key.

**Methods:**
- `calculate_similarity(extracted_answer, key_answer)` — returns cosine similarity score between 0.0 and 1.0
- `grade_submission(extracted_text, questions)` — grades a full submission against a list of questions with answer keys, returning per-question scores and an average

### `data/download_datasets.py` — Dataset Downloader

A utility script to download training data from two sources:

**HuggingFace Datasets (10+ datasets):**
- FUNSD (form understanding)
- DocVQA (document question answering)
- CORD v2 (receipt understanding)
- RVL-CDIP (document classification)
- MNIST & EMNIST (digits and letters)
- IAM Handwriting Database
- And more

**Kaggle Datasets:**
- Handwriting recognition datasets
- EMNIST
- Handwritten invoices, digits, signatures

---

## 9. Database Design

**ORM:** Prisma
**Database:** SQLite (development), easily swappable to PostgreSQL for production
**Schema file:** `prisma/schema.prisma`

### Table: `AnalysisResult`

| Column | Type | Description |
|--------|------|-------------|
| `id` | String (UUID) | Primary key, auto-generated |
| `filename` | String | Name of the uploaded PDF file |
| `transcribedText` | String | AI-extracted text from the handwriting |
| `score` | Int | Quality score 0–100 |
| `feedback` | String | AI-generated constructive feedback |
| `createdAt` | DateTime | Timestamp of when analysis was performed |

### Prisma Schema

```prisma
model AnalysisResult {
  id              String   @id @default(uuid())
  filename        String
  transcribedText String
  score           Int
  feedback        String
  createdAt       DateTime @default(now())
}
```

### Database Client (`src/lib/db.ts`)

The Prisma client is implemented as a singleton to avoid creating multiple database connections during hot-reloads in development — a standard Next.js + Prisma best practice.

---

## 10. How It Works — Step by Step

Here is the complete flow when a user uploads a handwritten PDF:

```
1. User selects a PDF in the browser
        │
        ▼
2. React component calls POST /api/analyze with FormData
        │
        ▼
3. Next.js API route receives the file
        │
        ▼
4. File is converted to Base64 string in memory
        │
        ▼
5. Gemini 1.5 Flash receives the Base64 data + prompt
   (prompt asks for transcription, score 0-100, feedback as JSON)
        │
        ▼
6. Gemini returns a JSON response:
   { "transcribedText": "...", "score": 85, "feedback": "..." }
        │
        ▼
7. Response is parsed and validated
        │
        ▼
8. Record is saved to SQLite via Prisma
   (id, filename, transcribedText, score, feedback, createdAt)
        │
        ▼
9. Saved record is returned to the frontend as JSON
        │
        ▼
10. React displays: transcribed text, color-coded score, feedback
        │
        ▼
11. History table is refreshed to include the new entry
```

---

## 11. Setup & Installation Guide

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+ (for ML service only)
- A Google Gemini API key (get one at https://aistudio.google.com)

### Step 1 — Clone and Install Frontend Dependencies

```bash
cd Handwriting_Analysis_Project
npm install
```

### Step 2 — Set Up Environment Variables

Create a `.env.local` file in the `Handwriting_Analysis_Project/` directory:

```env
DATABASE_URL="file:./dev.db"
GEMINI_API_KEY="your-gemini-api-key-here"
```

### Step 3 — Initialize the Database

Run Prisma migrations to create the SQLite database and tables:

```bash
npx prisma migrate dev --name init
```

Or to just generate the client from an existing schema:

```bash
npx prisma generate
```

### Step 4 — Run the Next.js Development Server

```bash
npm run dev
```

Open your browser at [http://localhost:3000](http://localhost:3000).

### Step 5 (Optional) — Run the ML Service

If you want to use the local TrOCR-based ML service:

```bash
cd ml_service
pip install -r requirements.txt
uvicorn api.server:app --reload --host 0.0.0.0 --port 9000
```

The ML service will be available at [http://localhost:9000](http://localhost:9000).

### Step 6 (Optional) — Download Training Datasets

To download datasets for fine-tuning the TrOCR model:

```bash
cd ml_service
python data/download_datasets.py
```

> Note: Kaggle dataset downloading requires a `~/.kaggle/kaggle.json` API key file.

### Step 7 (Optional) — Set Up Local AI with Ollama

The repo includes a convenience script to set up a local Ollama model:

```bash
chmod +x setup_local_ai.sh
./setup_local_ai.sh
```

This installs Ollama, pulls the `qwen2.5:1.5b` model, and configures `.env.local` for local LLM usage.

---

## 12. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Path to SQLite file (e.g., `file:./dev.db`) |
| `GEMINI_API_KEY` | Yes | Google Gemini API key for AI analysis |
| `LLM_PROVIDER` | No | Set to `ollama` to use local LLM instead |
| `OLLAMA_MODEL` | No | Ollama model name (default: `qwen2.5:1.5b`) |
| `OLLAMA_THINK` | No | Enable chain-of-thought (default: `false`) |
| `OLLAMA_KEEP_ALIVE` | No | Keep model in memory duration (default: `15m`) |
| `OLLAMA_NUM_CTX` | No | Context window size (default: `8192`) |
| `OLLAMA_READ_TIMEOUT` | No | Timeout in seconds (default: `60`) |

---

## 13. Key Dependencies

### Node.js / Frontend

| Package | Purpose |
|---------|---------|
| `next@16.0.10` | Full-stack React framework |
| `react@19.2.1` | UI component library |
| `@google/generative-ai@^0.24.1` | Google Gemini AI SDK |
| `@prisma/client@^5.22.0` | Database ORM client |
| `prisma@^5.22.0` | Database ORM CLI |
| `uuid@^13.0.0` | UUID generation |
| `tailwindcss@^4` | Utility CSS framework |
| `typescript@^5` | Static typing |

### Python / ML Service

| Package | Purpose |
|---------|---------|
| `fastapi` | REST API framework |
| `uvicorn` | ASGI server |
| `torch` | Deep learning framework |
| `transformers` | HuggingFace model hub |
| `sentence-transformers` | Semantic similarity |
| `Pillow` | Image processing |
| `datasets` | HuggingFace dataset loader |
| `scikit-learn` | ML utilities |
| `pandas` | Data manipulation |
| `jiwer` | Word Error Rate (WER) metric |
| `kaggle` | Kaggle dataset API |

---

## 14. Future Improvements

The following enhancements would make this project more robust and production-ready:

**Functionality**
- Support for multi-page PDFs and image files (PNG, JPG)
- Question-aware grading — segment handwritten answers per question
- Side-by-side view of original PDF and transcribed text
- Export results as PDF or CSV report

**AI / ML**
- Fine-tune TrOCR on domain-specific datasets for higher OCR accuracy
- Integrate the local TrOCR ML service as a fallback when Gemini is unavailable
- Add confidence scoring to the transcription output
- Support for multiple languages and scripts

**Infrastructure**
- Switch database from SQLite to PostgreSQL for production
- Add user authentication (student/teacher roles)
- Deploy ML service as a Docker container
- Add rate limiting and API key rotation for Gemini calls

**UI/UX**
- Real-time progress bar during analysis
- Edit/correct transcribed text inline
- Tag and categorize analyses by subject or date
- Notification when analysis is complete (WebSocket or polling)

---

*This documentation was auto-generated by analyzing all project source files.*
*For questions, contact: harikiran1388@gmail.com*
