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

import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

// Helper for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Stage 1: Save extracted textbook text to MongoDB (No AI)
 */
export async function saveTextbook(title: string, content: string, userId?: string) {
    try {
        const client = await clientPromise;
        const db = client.db("lumina-database");

        const result = await db.collection("textbooks").insertOne({
            title,
            content,
            userId: userId || 'anonymous',
            createdAt: new Date(),
            status: 'raw'
        });

        return { success: true, id: result.insertedId.toString() };
    } catch (error: any) {
        console.error("Save Textbook Error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Stage 2: Generate course from stored textbook (AI)
 * Fetches text from DB -> Chunks -> AI -> Course
 */
/**
 * Fetch the raw content of a textbook from MongoDB
 */
export async function getTextbookContent(textbookId: string) {
    try {
        const client = await clientPromise;
        const db = client.db("lumina-database");
        const textbook = await db.collection("textbooks").findOne({
            _id: new ObjectId(textbookId)
        });

        if (!textbook || !textbook.content) {
            return { success: false, error: "Textbook not found" };
        }

        return { success: true, content: textbook.content, title: textbook.title };
    } catch (error: any) {
        console.error("Get Textbook Error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Process a SINGLE chunk of text with AI.
 * Called repeatedly by the client to avoid server timeouts.
 */
export async function generateLearningArtifacts(chunk: { text: string; heading?: string; source?: any[] }) {
    // Check configuration lazily
    const groqProvider = createGroqClient();
    if (!groqProvider) {
        throw new Error("API Key is required");
    }

    try {
        const chunkPrompt = `
            SYSTEM: You are a precise Course Builder. Output strictly valid JSON (no extra text).
            INPUT: { "chapter_title": "${chunk.heading || 'General Section'}", "source_text": "${chunk.text.replace(/"/g, '\\"')}", "source_pages": ${JSON.stringify(chunk.source || [])} }

            TASK:
            1) Produce "module_title" and "lessons" list.
            2) For each lesson create:
            - lesson_title
            - full_content_orig: (the verbatim source_text passed in input) <-- MUST be identical to input text
            - summary: concise 4-6 bullet summary
            - key_points: 6 bullets
            - definitions: list of {term, definition} found in text
            - example_problems: list (if applicable)
            - quiz: 5 MCQs with answer keys based only on source_text (options array, answer string)
            
            3) Output only JSON with keys: module_title, lessons (array).

            DO NOT invent facts outside source_text. If something is not present, leave an empty list.
            `;

        const { text } = await generateText({
            model: groqProvider('llama-3.1-8b-instant'),
            prompt: chunkPrompt,
            temperature: 0.1, // Low temp for precision
        });

        // Parse JSON safely
        let jsonStr = text;
        if (jsonStr.includes("```json")) {
            jsonStr = jsonStr.split("```json")[1].split("```")[0];
        } else if (jsonStr.includes("```")) {
            jsonStr = jsonStr.split("```")[1].split("```")[0];
        }

        const data = JSON.parse(jsonStr.trim());
        return { success: true, data };

    } catch (error: any) {
        console.error("Error processing chunk:", error);
        return { success: false, error: error.message };
    }
}

/**
 * INDEX-DRIVEN: Analyzes the Table of Contents text to map out the book structure.
 */
export async function analyzeTableOfContents(tocText: string): Promise<{ success: boolean, structure?: any, error?: string }> {
    // Check configuration lazily
    const groqProvider = createGroqClient();
    if (!groqProvider) return { success: false, error: "API Key missing" };

    try {
        const prompt = `
        You are an expert Librarian and Data Structuring AI.
        Your task is to analyze the provided text, which contains the TABLE OF CONTENTS (TOC) of a textbook.
        
        GOAL: construct a hierarchical JSON tree of the book's structure.
        
        RULES:
        1. Identify the hierarchy: Parts > Units > Chapters > Sections.
        2. Extract the START PAGE for each item.
        3. Infer the END PAGE based on the start of the next item. (For the last item, add 10 pages).
        4. Return a recursive JSON object matching the 'CourseNode' interface.
        
        CourseNode Interface:
        {
            "id": "string (unique)",
            "type": "root" | "unit" | "chapter" | "section",
            "title": "string",
            "pageRange": { "start": number, "end": number },
            "children": [ ...CourseNode[] ]
        }

        INPUT TEXT (TOC):
        ${tocText}
        
        OUTPUT JSON ONLY.
        `;

        const { text } = await generateText({
            model: groqProvider('llama-3.1-8b-instant'),
            prompt: prompt,
            temperature: 0.0
        });

        // Parse JSON safely
        let jsonStr = text;
        if (jsonStr.includes("```json")) {
            jsonStr = jsonStr.split("```json")[1].split("```")[0];
        } else if (jsonStr.includes("```")) {
            jsonStr = jsonStr.split("```")[1].split("```")[0];
        }

        const structure = JSON.parse(jsonStr.trim());
        return { success: true, structure };

    } catch (e: any) {
        console.error("TOC Analysis Error:", e);
        return { success: false, error: e.message };
    }
}
