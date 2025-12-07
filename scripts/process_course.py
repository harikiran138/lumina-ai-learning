import sys
import json
import pdfplumber
import requests
import argparse

# Configuration
OLLAMA_API_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llama3.1:8b" 

PROMPT_TEMPLATE = """
You are an expert Curriculum Architect.
Analyze the provided text content from a textbook.
Create a comprehensive course structure (Course > Module > Topic > Subtopic > Content).

The output must be a valid JSON object match this exact schema:
{
    "modules": [
        {
            "title": "Module Title",
            "summary": "Brief summary",
            "topics": [
                {
                    "title": "Topic Title",
                    "goal": "Learning objective",
                    "content": [
                        { "type": "paragraph", "content": "Detailed explanation..." },
                        { "type": "list", "content": "- Item 1\\n- Item 2" },
                        { "type": "code", "content": "code snippet" },
                        { "type": "tip", "content": "Helpful tip" },
                        { "type": "warning", "content": "Important warning" }
                    ],
                    "subtopics": [
                        {
                            "title": "Subtopic Title",
                            "content": [
                                { "type": "paragraph", "content": "..." }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
}

RULES:
1. Output ONLY valid JSON. No explanations.
2. Create at least 2 distinct Modules.
3. "content" arrays should provide actual educational content summarized from the text.

TEXT CONTENT:
"""

def extract_text(file_path):
    text = ""
    try:
        if file_path.endswith('.txt'):
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                text = f.read()
        else:
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    text += page.extract_text() + "\n"
    except Exception as e:
        # Fallback: try reading as plain text if PDF fails or if extension is weird
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                text = f.read()
        except:
            print(json.dumps({"error": f"Failed to extract text: {str(e)}"}))
            sys.exit(1)
    return text

def chunk_text(text, chunk_size=15000):
    # Simple chunking for now, can be improved to split by headers
    return [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]

def generate_structure(text_chunk):
    prompt = PROMPT_TEMPLATE + text_chunk[:20000] # Limit context window just in case
    
    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False,
        "format": "json" 
    }

    try:
        response = requests.post(OLLAMA_API_URL, json=payload)
        response.raise_for_status()
        result = response.json()
        return result['response']
    except Exception as e:
        print(json.dumps({"error": f"Ollama generation failed: {str(e)}"}))
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("file_path", help="Path to the PDF file")
    args = parser.parse_args()

    # 1. Extract
    full_text = extract_text(args.file_path)

    # 2. Chunk (We will just process the first large chunk for the overall structure for now)
    # Processing the whole book in chunks and merging is complex; starting with a "Structure Generation" pass on the first significant chunk (Table of Contents + Intro).
    # Ideally we'd scan efficiently, but for MVP we take the first 20k chars.
    
    # 3. Generate
    json_str = generate_structure(full_text)

    # 4. Parse & Validate
    try:
        data = json.loads(json_str)
        # Wrap in standard response format
        print(json.dumps({"success": True, "data": data}))
    except json.JSONDecodeError:
        # Fallback or retry logic could go here
        print(json.dumps({"error": "Failed to parse AI response as JSON", "raw": json_str}))
        sys.exit(1)

if __name__ == "__main__":
    main()
