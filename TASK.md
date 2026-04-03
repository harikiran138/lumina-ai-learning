# 📘 TASK.md

## Adaptive Assessment System — End-to-End Implementation Plan

---

## 🎯 Objective

Build a **fully adaptive, AI-powered assessment system** that dynamically adjusts:

* **question difficulty**
* **concept focus**
* **feedback depth**
* **assessment length**

based on **real-time learner performance**, **knowledge mastery**, and **behavioral signals**.

This system must be:

* Scalable
* Explainable
* Guardrailed
* Self-hostable
* LLM-assisted (not LLM-dependent)

---

## 🧠 Core Philosophy

> **LLMs generate content.
> Algorithms decide adaptivity.
> Data drives intelligence.**

---

## 🧩 System Scope

### In-Scope

* Diagnostic, formative, and mastery-based assessments
* Concept-level mastery tracking
* Real-time adaptivity per question
* Weakness & misconception detection
* AI-generated questions, hints, explanations
* Student behavior analytics
* Instructor-visible learning insights

### Out-of-Scope (v1)

* Proctoring
* Voice/video responses
* High-stakes certification exams

---

## 🏗️ Architecture Overview

```
- [x] Frontend Dependencies Setup
    - [x] Run `npm install` in `frontend/web`
   ↓
Assessment API (FastAPI)
   ↓
Adaptive Engine
   ├─ Knowledge Tracing
  - [x] Environment Preparation
    - [x] Create `data/uploads` directory
    - [x] Create `static/presentations` directory
    - [x] Create `backend/db/chroma` directory
   ↓
LLM Content Generator
   ↓
Database + Analytics
```

---

## 📂 Repository Structure (Assessment Module)

```
lumina/
├── assessment/
│   ├── engine/
│   │   ├── knowledge_tracing.py
│   │   ├── policy_engine.py
│   │   ├── stop_controller.py
│   │   └── weakness_detector.py
│   │
│   ├── question/
│   │   ├── selector.py
│   │   ├── metadata_schema.py
│   │   └── generator.py
│   │
│   ├── llm/
│   │   ├── prompt_templates/
│   │   └── llm_client.py
│   │
│   ├── api/
│   │   └── assessment_routes.py
│   │
│   ├── eval/
│   │   ├── metrics.py
│   │   └── guardrails.py
│   │
│   └── models/
│       └── schemas.py
```

---

## 🔨 TASK BREAKDOWN (END-TO-END)

---

## ✅ TASK 1: Define Knowledge Model (Foundation)

### Goal

Track **concept-wise mastery probability** per learner.

### Actions

* Implement **Bayesian Knowledge Tracing (BKT)**
* Store mastery as probability `[0.0 – 1.0]`
* Update mastery after every response

### Output

```json
{
  "arrays": 0.68,
  "loops": 0.41,
  "recursion": 0.12
}
```

### Success Criteria

* Mastery updates correctly for correct/incorrect answers
* Supports multiple concepts per question

---

## ✅ TASK 2: Create Question Metadata System

### Goal

Enable intelligent selection and difficulty control.

### Required Metadata

```json
{
  "question_id": "q123",
  "concepts": ["arrays"],
  "difficulty": 0.6,
  "discrimination": 1.1,
  "guessing": 0.2,
  "blooms_level": "application",
  "format": "mcq"
}
```

### Actions

* Enforce metadata validation
* Reject questions without metadata

### Success Criteria

* Every question is machine-interpretable
* Difficulty & concept targeting works

---

## ✅ TASK 3: Build Adaptive Policy Engine (Brain)

### Goal

Decide **what question comes next**.

### Inputs

* Concept mastery probabilities
* Recent answers
* Time taken
* Confidence
* Question history

### Decisions

* Increase / decrease difficulty
* Switch concept
* Trigger remediation
* Stop assessment

### Policy Rules

* If mastery < 0.4 → remedial question
* If mastery 0.4–0.7 → practice
* If mastery > 0.8 → challenge or stop

### Success Criteria

* Different learners get different question paths
* No static flow

---

## ✅ TASK 4: Implement Question Selection Logic

### Goal

Select **best next question** (not random).

### Strategy Mix

- [x] Frontend Dependencies Setup
    - [x] Run `npm install` in `frontend/web`
- [x] Backend Dependencies Setup
    - [x] Create Python virtual environment (`.venv`)
    - [x] Install `requirements.txt`
- [x] Launch Services
    - [x] Start FastAPI Backend (Port 8000)
    - [x] Start Next.js Frontend (Port 3000)

### Actions

* Rank questions by relevance score
* Prevent repetition
* Respect difficulty ramp limits

### Success Criteria

* No repeated questions
* Difficulty evolves smoothly

---

## ✅ TASK 5: Integrate LLM for Content Generation

### Goal

Generate **context-aware questions & explanations**.

### LLM Responsibilities

* Generate questions ONLY after policy decision
* Generate hints & explanations
* Generate follow-up questions

### LLMs (Recommended)

* Phi-3.5-Mini
* Qwen2.5-Instruct
* Gemma-2-2B

### Prompt Structure

```
SYSTEM: You are an assessment content generator.
INPUT: Concept, difficulty, learner weakness
OUTPUT: One question + explanation
```

### Success Criteria

* No hallucinated facts
* Content matches difficulty & concept

---

## ✅ TASK 6: Weakness & Misconception Detection

### Goal

Understand **why** the learner failed.

### Signals

| Pattern        | Meaning           |
| -------------- | ----------------- |
| Fast + wrong   | Guessing          |
| Slow + wrong   | Concept gap       |
| Repeated wrong | Misconception     |
| Correct + slow | Fragile knowledge |

### Actions

* Log time, attempts, answer pattern
* Classify weakness type

### Success Criteria

* Feedback adapts to weakness type

---

## ✅ TASK 7: Stop Controller (Adaptive Termination)

### Goal

End assessment intelligently.

### Stop Conditions

* All concepts mastery ≥ threshold (e.g. 0.8)
* Max question limit reached
* Fatigue detected
* Confidence stabilized

### Output

```json
{
  "status": "completed",
  "reason": "mastery_achieved"
}
```

---

## ✅ TASK 8: Feedback & Explanation Engine

### Goal

Provide **personalized learning feedback**.

### Feedback Types

* Concept explanation
* Mistake explanation
* Hint
* Strategy advice

### Success Criteria

* Feedback references learner’s mistake
* Not generic

---

## ✅ TASK 9: Data Storage & Analytics

### Store

* Question attempts
* Mastery evolution
* Time on task
* Weakness patterns

### Enable

* Learning gain analysis
* Drop-off detection
* Tutor personalization

---

## ✅ TASK 10: Evaluation & Guardrails

### Metrics

* Learning gain (pre vs post)
* Questions to mastery
* Error reduction rate

### Guardrails

* Difficulty oscillation limit
* Bias detection
* Explanation factuality check

---

## 🚀 Final Deliverables

* Adaptive assessment engine
* Knowledge mastery dashboard
* AI-generated explanations
* Concept heatmap
* Evaluation metrics

---

## 🧠 Completion Definition

> The system **must never ask the same learner the same assessment twice** in the same way.
