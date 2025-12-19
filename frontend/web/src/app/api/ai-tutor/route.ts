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

        // 2. Construct System Prompt
        const systemPrompt = `
You are Lumina, an expert AI Tutor.
Your goal is to answer the student's question clearly and concisely.
Use the provided Context if relevant, but rely on your general knowledge if the context is insufficient.
Keep answers short (under 3 sentences) unless asked for more detail.

User Data:
${userContext || "No user data available."}

Learning Context (RAG):
${ragContext ? ragContext : "No specific topic context available."}

Student Question: ${question}
`;

        // 3. Call Gemini Flash
        console.log("Step 3: Call Gemini");
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const result = await model.generateContent(systemPrompt);
        console.log("Step 4: Response received");
        const response = result.response;
        const answer = response.text();

        return NextResponse.json({ answer });

    } catch (error: any) {
        console.error('AI Tutor API Error Details:', error.message);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message
        }, { status: 500 });
    }
}
