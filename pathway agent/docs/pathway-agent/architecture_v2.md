# Pathway Agent Architecture V2: Hybrid Neuro-Symbolic

## Overview
This architecture replaces the simple Rule-Based/FFNN approach with a **Hybrid Neuro-Symbolic** system.
- **"Neuro" (Fast System)**: A local, fine-tuned Hugging Face Transformer model (Small Language Model or Specialized Knowledge Tracing Model) that predicts **Student User State** (Knowledge Tracing) and **Behavioral Patterns** from raw log data.
- **"Symbolic" (Slow System)**: The Gemini API, acting as the **Strategic Controller**. It takes the structured state output from the local model and makes high-level pedagogical decisions (Control Flow).

## 1. Data Layer
### Source Datasets (Hugging Face / Kaggle)
We will target standard Knowledge Tracing datasets (e.g., ASSISTments 2009/2012, EdNet, or similar) to pre-train the local model.
- **Input**: Sequence of interactions $(q_1, a_1), (q_2, a_2), \dots, (q_t, a_t)$ where $q$ is the question ID/tag and $a$ is correctness (0/1).
- **Target**: Predict $P(a_{t+1}| \text{history})$.

## 2. The "Knowledge Tracing" Model (Local HF Model)
We will deploy a specialized **Transformer-based Knowledge Tracing (TKT)** model.
- **Base Model**: `distilbert-base-uncased` or a small dedicated Transformer (e.g., SAINT+ architecture).
- **Input Encoding**:
    - **Exercise Embedding**: Embeds the question ID/Skill ID.
    - **Response Embedding**: Embeds whether the previous answer was correct/incorrect.
    - **Positional Embedding**: Time step.
- **Output**:
    - **Knowledge State Vector**: A latent representation of student mastery $h_t$.
    - **Next Interaction Prediction**: Probability the student gets the next item correct.

## 3. The "Strategic Controller" (Gemini API)
This is the **Pathway Controller**. It determines the *Control Flow* of the learning session.

### Inputs
1.  **Computed State** (from Local Model): "Mastery Probability: 85%", "Trend: Increasing".
2.  **Detected Patterns** (from previous task): "Pattern: BP01 Flow State".
3.  **Context**: "Session Time: 45m", "Goal: Exam Prep".

### Logic (Prompt Chain)
Gemini evaluates the state against pedagogical rules:
> "State is High Mastery (0.85), but Pattern is 'Boredom Loop'. Action: ADVANCE to Challenge."
> "State is Low Mastery (0.4), Pattern is 'Frustration'. Action: REVIEW (Video)."

## 4. Training Pipeline
1.  **Ingestion**: Script to download/format ASSISTments data from Hugging Face `datasets`.
2.  **Fine-Tuning**: PyTorch script to train the TKT model to minimize Binary Cross Entropy on next-token prediction.
3.  **Evaluation**: AUC (Area Under Curve) on hold-out student sets.

## 5. Deployment
- **Model Registry**: Save trained `.pth` or Hugging Face `PreTrainedModel` to `models/pathway_v2/`.
- **Inference Service**: A lightweight Python class `KnowledgeTracer` that loads the model and updates state in real-time ($O(1)$ complexity per step).
