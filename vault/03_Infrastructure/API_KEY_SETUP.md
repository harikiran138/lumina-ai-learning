# Gemini API Key Setup Guide

## Issue: 403 Forbidden Error

You're seeing this error because the current API key in `.env` is invalid or expired:
```
Error generating content after retries: 403 Client Error: Forbidden
```

## Solution: Get a Valid API Key

### Step 1: Visit Google AI Studio
Go to: https://aistudio.google.com/app/apikey

### Step 2: Create/Get Your API Key
1. Sign in with your Google account
2. Click "Create API Key" or "Get API Key"
3. Copy the generated key (starts with `AIza...`)

### Step 3: Update Your `.env` File
Replace the current key in `/Users/chepuriharikiran/Desktop/github/lumina-ai-learning/.env`:

```bash
# Replace this invalid key:
GEMINI_API_KEY=AIzaSyC5ZyBBLjZFW1dZq3M8oJmHYPYT2qwoftQ

# With your new valid key:
GEMINI_API_KEY=YOUR_NEW_KEY_HERE
```

### Step 4: Restart the Backend
```bash
# If running with Docker:
docker-compose restart backend

# If running locally:
# Stop the server (Ctrl+C) and restart it
```

## Key Configuration

The system now uses **one unified key** (`GEMINI_API_KEY`) for:
- AI Tutor chat (`/api/tutor/chat`)
- Course generation (`/api/generate-course`)
- Quiz/Assessment generation (`/api/assessment/*`)
- PowerPoint generation (`/api/tutor/generate-ppt`)

## Free Tier Limits

Google Gemini API free tier includes:
- **15 requests per minute**
- **1 million tokens per day**
- **1,500 requests per day**

If you hit rate limits, the system will automatically fall back to Ollama (if configured).

## Alternative: Use Ollama (Local AI)

To avoid API key issues entirely, you can use local AI:

```bash
# Set in .env:
LLM_PROVIDER=ollama

# Make sure Ollama is running:
ollama serve
ollama pull mannix/llama3.1-8b-abliterated:latest
```
