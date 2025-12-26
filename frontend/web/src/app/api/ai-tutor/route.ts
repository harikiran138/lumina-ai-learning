import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { retrieveContext } from '@/lib/ai-tutor/rag';

export async function POST(req: NextRequest) {
    try {
        console.log("AI Tutor API called");

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("GEMINI_API_KEY is missing in environment variables");
            return NextResponse.json({ error: 'Server Authorization Error: Missing API Key' }, { status: 500 });
        }
        console.log("API Key loaded:", apiKey.substring(0, 5) + "...");

        const genAI = new GoogleGenerativeAI(apiKey);
        const { question, userContext } = await req.json();

        if (!question) {
            return NextResponse.json({ error: 'Question is required' }, { status: 400 });
        }

        // 1. Retrieve Context (RAG)
        console.log("Step 1: Retrieve Context");
        const ragContext = await retrieveContext(question);
        console.log("Context retrieved:", ragContext ? "Yes" : "No");

        // 2. Construct System Instructions
        const systemInstruction = `You are Lumina, a helpful AI tutor.
You have access to a special UI rendering protocol called A2UI.
Instead of just text, you can render rich interactive components by outputting a code block starting with \`\`\`a2ui.

### A2UI COMPONENTS & SCHEMAS:
1. Quiz:
\`\`\`a2ui
{ 
  "component": "Quiz", 
  "props": { 
    "question": "The question text", 
    "options": ["Option A", "Option B", "Option C", "Option D"], 
    "correctIndex": 0, 
    "explanation": "Brief explanation" 
  } 
}
\`\`\`
CRITICAL: THE "options" ARRAY IS MANDATORY AND MUST HAVE EXACTLY 4 STRINGS.

2. Flashcard:
\`\`\`a2ui
{ "component": "Flashcard", "props": { "front": "Term", "back": "Definition" } }
\`\`\`

3. ComparisonTable:
\`\`\`a2ui
{ "component": "ComparisonTable", "props": { "title": "Topic", "headers": ["Col 1", "Col 2"], "rows": [{ "feature": "F1", "left": "val1", "right": "val2" }] } }
\`\`\`

### RULES:
- Use these components to make learning interactive.
- ALWAYS provide the 'options' property for a Quiz.
- Keep standard text answers concise.`;

        const userContextString = userContext ? `\nUser Context:\n${userContext}` : "";
        const ragContextString = ragContext ? `\nKnowledge Context:\n${ragContext}` : "";
        
        const finalUserPrompt = `${userContextString}${ragContextString}\n\nStudent Request: ${question}`;

        // 3. Call Gemini Flash with System Instructions
        console.log("Step 3: Call Gemini with System Instructions");
        const model = genAI.getGenerativeModel({ 
            model: "gemini-flash-latest",
            systemInstruction: systemInstruction 
        });
        
        const result = await model.generateContent(finalUserPrompt);
        console.log("Step 4: Response received");
        const answer = result.response.text();

        return NextResponse.json({ answer });

    } catch (error: any) {
        console.error('AI Tutor API Error Details:', error.message);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message
        }, { status: 500 });
    }
}
