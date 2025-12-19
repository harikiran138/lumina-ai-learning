'use server';

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

// Initialize Groq helper - lazily or safely
const createGroqClient = () => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        console.error("GROQ_API_KEY is missing");
        return null;
    }
    return createOpenAI({
        apiKey: apiKey,
        baseURL: 'https://api.groq.com/openai/v1',
    });
};

export async function chatWithAI(messages: any[]) {
    try {
        const groqProvider = createGroqClient();
        if (!groqProvider) {
            return {
                id: 'error',
                role: 'assistant',
                content: "I'm sorry, my AI brain is currently disconnected (API Key missing). Please check the system configuration."
            };
        }

        // Convert messages to AI SDK format if needed, but generateText usually takes them directly if they match
        // Assuming messages are [{ role, content }]
        const response = await generateText({
            model: groqProvider('llama-3.1-8b-instant'),
            messages: messages,
        });

        return {
            id: Date.now().toString(),
            role: 'assistant',
            content: response.text
        };

    } catch (e: any) {
        console.error("Chat AI Error:", e);
        return {
            id: 'error',
            role: 'assistant',
            content: "I'm having trouble thinking right now. Please try again later."
        };
    }
}
