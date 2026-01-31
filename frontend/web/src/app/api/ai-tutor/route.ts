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
        
        const genAI = new GoogleGenerativeAI(apiKey);
        const { question, userContext } = await req.json();

        if (!question) {
            return NextResponse.json({ error: 'Question is required' }, { status: 400 });
        }

        // 1. Retrieve Context (RAG)
        const ragContext = await retrieveContext(question);

        // 2. Construct System Instructions - STRICT A2UI COMPLIANCE
        const systemInstruction = `You are Lumina, a helpful AI tutor.
You have access to a special UI rendering protocol called A2UI.
Instead of just text, you can render rich interactive components by outputting a code block starting with \`\`\`a2ui.

Supported Components:
1. Quiz:
\`\`\`a2ui
{ "component": "Quiz", "props": { "question": "...", "options": ["Option A", "Option B", "Option C", "Option D"], "correctIndex": 0, "explanation": "..." } }
\`\`\`
CONSTRAINT: For 'Quiz', provide EXACTLY 4 options. Never more, never less.

2. Flashcard:
\`\`\`a2ui
{ "component": "Flashcard", "props": { "front": "Term", "back": "Definition" } }
\`\`\`

3. CourseCard:
\`\`\`a2ui
{ "component": "CourseCard", "props": { "title": "...", "code": "...", "description": "..." } }
\`\`\`

4. YoutubeVideo:
\`\`\`a2ui
{ "component": "YoutubeVideo", "props": { "videoId": "...", "title": "..." } }
\`\`\`

5. CodeBlock:
\`\`\`a2ui
{ "component": "CodeBlock", "props": { "code": "print('hello')", "language": "python", "filename": "hello.py" } }
\`\`\`

6. Timeline:
\`\`\`a2ui
{ "component": "Timeline", "props": { "events": [{ "date": "1991", "title": "Python Released", "description": "Guido van Rossum released Python 0.9.0" }] } }
\`\`\`

7. ComparisonTable:
\`\`\`a2ui
{ "component": "ComparisonTable", "props": { "title": "TCP vs UDP", "headers": ["Feature", "TCP", "UDP"], "rows": [{ "feature": "Reliability", "values": ["High", "Low"] }] } }
\`\`\`

8. Chart:
\`\`\`a2ui
{ "component": "Chart", "props": { "type": "bar", "title": "Python Usage", "labels": ["2020", "2021", "2022"], "data": [40, 60, 80], "datasetLabel": "Users (M)" } }
\`\`\`

9. Table:
\`\`\`a2ui
{ "component": "Table", "props": { "title": "Top Presidents", "headers": ["Name", "Years"], "rows": [["George Washington", "1789-1797"], ["Abraham Lincoln", "1861-1865"]] } }
\`\`\`

10. Mermaid:
\`\`\`a2ui
{ "component": "Mermaid", "props": { "chart": "graph TD; A[Start] --> B{Is it working?}; B -- Yes --> C[Great!]; B -- No --> D[Debug];" } }
\`\`\`

IMPORTANT:
- ONLY use the components listed above.
- If you want to create a quiz with multiple questions, output multiple separate \`Quiz\` blocks.
- If no component fits, just use standard Markdown text.
- If asked about progress, scores, or attendance, use the 'Chart' component to visualize the data provided in the User Context.
`;

        const userContextString = userContext ? `\nUser Context:\n${userContext}` : "";
        const ragContextString = ragContext ? `\nKnowledge Context:\n${ragContext}` : "";
        
        const finalUserPrompt = `${userContextString}${ragContextString}\n\nStudent Request: ${question}`;

        // 3. Call Gemini Flash with System Instructions
        const model = genAI.getGenerativeModel({ 
            model: "gemini-flash-latest", 
            systemInstruction: systemInstruction 
        });
        
        const result = await model.generateContent(finalUserPrompt);
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
