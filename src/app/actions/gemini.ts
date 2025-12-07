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
export async function generateCourseFromTextbook(textbookId: string) {
    // Check configuration lazily
    const groqProvider = createGroqClient();
    if (!groqProvider) {
        throw new Error("API Key is required");
    }

    try {
        // 1. Fetch Text from DB
        const client = await clientPromise;
        const db = client.db("lumina-database");
        const textbook = await db.collection("textbooks").findOne({
            _id: new ObjectId(textbookId)
        });

        if (!textbook || !textbook.content) {
            throw new Error("Textbook not found or empty");
        }

        const fullText = textbook.content;
        console.log(`Fetched textbook "${textbook.title}" (${fullText.length} chars)`);

        // 2. Chunking Strategy with Overlap (To prevent data loss at boundaries)
        const CHUNK_SIZE = 12000;
        const OVERLAP = 1000; // Overlap to ensure no sentence is cut off
        const chunks = [];

        let start = 0;
        while (start < fullText.length) {
            const end = Math.min(start + CHUNK_SIZE, fullText.length);
            chunks.push(fullText.substring(start, end));
            // Move forward by chunk size minus overlap
            start += (CHUNK_SIZE - OVERLAP);
        }

        console.log(`Split text into ${chunks.length} chunks (with overlap).`);
        let allModules: any[] = [];

        // 3. Sequential Processing
        for (let i = 0; i < chunks.length; i++) {
            console.log(`Processing Chunk ${i + 1}/${chunks.length}...`);

            const chunkPrompt = `
            You are a strict Data Structuring AI.
            Your ONLY job is to take the provided text and format it into a structured JSON.
            
            CRITICAL INSTRUCTIONS (NO DATA LOSS):
            1. DO NOT Summarize.
            2. DO NOT Paraphrase.
            3. DO NOT Omit any information.
            4. You must include the EXACT verbatim text from the source into the "content" fields.
            5. If a section is too long, break it into multiple paragraphs, but keep ALL the words.
            
            Structure the text into logical "Modules" and "Topics" based on headers.
            Look for "[[PAGE_X]]" markers to track where content comes from.
            
            OUTPUT JSON FORMAT:
            {
                "modules": [
                    {
                        "title": "Module Title (Found in text)",
                        "topics": [
                            {
                                "title": "Topic Header",
                                "pageRef": "Page number (e.g. 5)",
                                "content": [
                                    { "type": "paragraph", "content": "Exact text from source..." },
                                    { "type": "list", "content": "- Exact list item 1\\n- Exact list item 2" },
                                    { "type": "code", "content": "Exact code block" }
                                ]
                            }
                        ]
                    }
                ]
            }

            TEXT TO STRUCTURE (PART ${i + 1}):
            ${chunks[i]}
            `;

            try {
                // Get Client
                const groqProvider = createGroqClient();
                if (!groqProvider) throw new Error("Server Misconfiguration: GROQ_API_KEY missing");

                // Call Groq
                const { text } = await generateText({
                    model: groqProvider('llama-3.1-8b-instant'),
                    prompt: chunkPrompt,
                    temperature: 0.1, // Near zero for exact reproduction
                });

                // Parse
                let jsonStr = text;
                if (jsonStr.includes("```json")) {
                    jsonStr = jsonStr.split("```json")[1].split("```")[0];
                } else if (jsonStr.includes("```")) {
                    jsonStr = jsonStr.split("```")[1].split("```")[0];
                }
                const data = JSON.parse(jsonStr.trim());

                if (data.modules) {
                    allModules = [...allModules, ...data.modules];
                }

            } catch (err) {
                console.error(`Error processing chunk ${i} (Data skipped):`, err);
            }

            // Rate Limit Wait
            if (i < chunks.length - 1) {
                console.log("Waiting 20s for Rate Limit cooldown...");
                await delay(20000);
            }
        }

        return { success: true, data: { modules: allModules } };

    } catch (error: any) {
        console.error("Groq Full Course Error:", error);
        return { success: false, error: error.message };
    }
}
