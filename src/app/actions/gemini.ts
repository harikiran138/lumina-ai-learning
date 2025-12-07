'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'vck_3QS2kP9Ez4k0xhGnfpJirUmhvOIlDQAEFW2FxOMK8q2tWgvaO900uO4I';

/**
 * Generates a structured course from the provided content using Google Gemini.
 * @param content The text content (from PDF or textbook) to analyze.
 * @returns The parsed JSON structure of the course.
 */
export async function generateCourseStructure(content: string) {
    if (!GEMINI_API_KEY) {
        throw new Error("API Key is required");
    }

    try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        // Using gemini-1.5-flash-001 for stability with v1beta
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001", generationConfig: { responseMimeType: "application/json" } });

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
        ${content.substring(0, 30000)} // safely truncate to avoid hitting hard limits if extremely large, though Gemini handles large context well.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Parse JSON
        // Gemini with responseMimeType: "application/json" usually returns pure JSON, but we safeguard.
        let jsonStr = text;
        if (jsonStr.startsWith("```json")) {
            jsonStr = jsonStr.replace(/^```json\n/, "").replace(/\n```$/, "");
        } else if (jsonStr.startsWith("```")) {
            jsonStr = jsonStr.replace(/^```\n/, "").replace(/\n```$/, "");
        }

        const data = JSON.parse(jsonStr);
        return { success: true, data };

    } catch (error: any) {
        console.error("Gemini Generation Error:", error);
        return { success: false, error: error.message };
    }
}
