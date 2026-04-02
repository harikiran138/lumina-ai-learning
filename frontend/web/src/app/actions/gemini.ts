"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

const createGeminiModel = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing");
    return null;
  }
  const client = new GoogleGenerativeAI(apiKey);
  return client.getGenerativeModel({ model: "gemini-1.5-flash" });
};

/**
 * Stage 1: Save extracted textbook text to the local textbook store (No AI)
 */
export async function saveTextbook(
  title: string,
  content: string,
  userId?: string,
) {
  try {
    const client = await clientPromise;
    if (!client) {
      return { success: false, error: "MongoDB is not configured" };
    }
    const db = client.db("lumina_db");

    const result = await db.collection("textbooks").insertOne({
      title,
      content,
      userId: userId || "anonymous",
      createdAt: new Date(),
      status: "raw",
    });

    return { success: true, id: result.insertedId.toString() };
  } catch (error: any) {
    console.error("Save Textbook Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Stage 2: Generate course from stored textbook (AI)
 * Fetches text from the local textbook store -> Chunks -> AI -> Course
 */
/**
 * Fetch the raw content of a textbook from the local textbook store
 */
export async function getTextbookContent(textbookId: string) {
  try {
    const client = await clientPromise;
    if (!client) {
      return { success: false, error: "MongoDB is not configured" };
    }
    const db = client.db("lumina_db");
    const textbook = await db.collection("textbooks").findOne({
      _id: new ObjectId(textbookId),
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
export async function generateCourseChunk(
  chunkText: string,
  chunkIndex: number,
  totalChunks: number,
) {
  // Check configuration lazily
  const model = createGeminiModel();
  if (!model) {
    throw new Error("API Key is required");
  }

  try {
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

            TEXT TO STRUCTURE (PART ${chunkIndex + 1} of ${totalChunks}):
            ${chunkText}
            `;

    const result = await model.generateContent(chunkPrompt);
    const text = result.response.text();

    // Parse JSON safely
    let jsonStr = text;
    if (jsonStr.includes("```json")) {
      jsonStr = jsonStr.split("```json")[1].split("```")[0];
    } else if (jsonStr.includes("```")) {
      jsonStr = jsonStr.split("```")[1].split("```")[0];
    }

    const data = JSON.parse(jsonStr.trim());
    return { success: true, modules: data.modules || [] };
  } catch (error: any) {
    console.error("Error processing chunk:", error);
    return { success: false, modules: [], error: error.message };
  }
}

/**
 * INDEX-DRIVEN: Analyzes the Table of Contents text to map out the book structure.
 */
export async function analyzeTableOfContents(
  tocText: string,
): Promise<{ success: boolean; structure?: any; error?: string }> {
  // Check configuration lazily
  const model = createGeminiModel();
  if (!model) return { success: false, error: "API Key missing" };

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

    const result = await model.generateContent(prompt);
    const text = result.response.text();

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
