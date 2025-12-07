'use server';

import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDQjD7ak6PO6PNFVFMF-jziQizRx3qG70g';

// Initialize the Google provider with our key
const google = createGoogleGenerativeAI({
    apiKey: GEMINI_API_KEY,
});

/**
 * Generates a structured course from the provided content using Vercel AI SDK.
 * @param content The text content (from PDF or textbook) to analyze.
 * @returns The parsed JSON structure of the course.
 */
export async function generateCourseStructure(content: string) {
    if (!GEMINI_API_KEY) {
        throw new Error("API Key is required");
    }

    try {
        const prompt = `
        You are an expert Curriculum Architect and Instructional Designer.
        Analyze the provided text content from a textbook or document.
        Create a comprehensive, 5-layer hierarchical course structure (Course > Module > Topic > Subtopic > Content).

        The output must be a valid JSON object matching this exact schema:
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
                                { "type": "code", "content": "code snippet if applicable" },
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

        REQUIREMENTS:
        1. Extract the core structure from the text.
        2. Create at least 3 distinct Modules.
        3. Each Module must have at least 2 Topics.
        4. Populate "subtopics" for complex sections or deep dives.
        5. "content" arrays should provide actual educational content summarized from the text, not just placeholders.
        6. Ensure strict JSON validity.

        TEXT CONTENT TO ANALYZE:
        ${content.substring(0, 30000)}
        `;

        // Use generateText for a single response (equivalent to the previous behavior)
        // We use gemini-1.5-flash for speed and large context window
        const { text } = await generateText({
            model: google('gemini-1.5-flash'),
            prompt: prompt,
        });

        // Parse JSON
        let jsonStr = text;
        if (jsonStr.startsWith("```json")) {
            jsonStr = jsonStr.replace(/^```json\n/, "").replace(/\n```$/, "");
        } else if (jsonStr.startsWith("```")) {
            jsonStr = jsonStr.replace(/^```\n/, "").replace(/\n```$/, "");
        }

        const data = JSON.parse(jsonStr);
        return { success: true, data };

    } catch (error: any) {
        console.error("Vercel AI SDK Generation Error:", error);
        return { success: false, error: error.message };
    }
}
