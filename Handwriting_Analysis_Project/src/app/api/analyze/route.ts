import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "@/lib/db";

// Initialize Gemini
// NOTE: Ideally getting API Key from env, but user provided it in memory/chat rules.
// I will use process.env.GEMINI_API_KEY if available, else usage of provided key should be handled carefully.
// The user rules say "Gemini API Key: AIzaSyAz5Ii7lfvb9ucIngUbKGr98qgSnHgPFgY"
const apiKey = process.env.GEMINI_API_KEY || "AIzaSyAz5Ii7lfvb9ucIngUbKGr98qgSnHgPFgY";
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file");

        if (!file || !(file instanceof File)) {
            return NextResponse.json(
                { error: "No file uploaded" },
                { status: 400 }
            );
        }

        // Convert file to buffer then base64
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Data = buffer.toString("base64");

        // Use Gemini 1.5 Flash (efficient for text/vision)
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
      Please analyze this handwritten document.
      
      1. Transcribe the handwritten text exactly as it appears.
      2. Evaluate the text and provide a score from 0 to 100 based on clarity, legibility, and content quality.
      3. Provide brief, constructive feedback.

      Output the result in the following JSON format ONLY:
      {
        "transcribedText": "...",
        "score": 0,
        "feedback": "..."
      }
    `;

        // Gemini 1.5 supports PDF mime type directly in inlineData if it's small enough,
        // or we can treat it as image data if we knew it was an image.
        // However, for "application/pdf", we might need to use the File API for larger files,
        // but for simple "inline" usage, let's see if 1.5 Flash accepts pdf mime type inline.
        // It usually accepts image/*, and application/pdf via File API.
        // To be safe and simple for this prototype without a separate upload step to Google File API,
        // I will try to pass it as inline data with the correct mime type.

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: file.type,
                },
            },
        ]);

        const responseText = result.response.text();

        // Clean up markdown code blocks if present
        const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

        let analysis;
        try {
            analysis = JSON.parse(cleanJson);
        } catch (e) {
            console.error("Failed to parse JSON", responseText);
            return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
        }

        // Save to DB
        const savedRecord = await prisma.analysisResult.create({
            data: {
                filename: file.name,
                transcribedText: analysis.transcribedText || "",
                score: analysis.score || 0,
                feedback: analysis.feedback || "",
            }
        });

        return NextResponse.json(savedRecord);

    } catch (error) {
        console.error("Error processing file:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
